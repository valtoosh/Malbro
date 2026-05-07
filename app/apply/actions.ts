// app/apply/actions.ts
'use server';

import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { sha256 } from '@/lib/hash';
import { hashIp } from '@/lib/ip';
import { checkRateLimits, recordIntake } from '@/lib/rateLimit';
import { getStorage } from '@/lib/storage/factory';
import { createSubmission, parseTweetUrl } from '@/db/queries/submissions';
import { receiptsSeen, bounties as bountiesTable } from '@/db/schema';

const APPLICANT_COOKIE = 'marlbro_applicant';

const inputSchema = z.object({
  walletAddress: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, 'Wallet address must be valid base58'),
  walletConfirmed: z.literal('on', { message: 'Wallet confirmation is required' }),
  tweetUrl: z.string().url(),
  notes: z.string().max(2000).optional(),
  bountyNumber: z.string().optional(),
});

export interface ApplyResult {
  ok: boolean;
  errorCode?: string;
  message?: string;
}

function failRedirect(errorCode: string, message: string, bountyNumber?: string): never {
  const params = new URLSearchParams({ applyError: errorCode, applyMessage: message });
  if (bountyNumber) params.set('bounty', bountyNumber);
  redirect(`/apply?${params.toString()}`);
}

export async function submitApplication(formData: FormData): Promise<void> {
  const bountyNumber = (formData.get('bountyNumber') as string | null) ?? undefined;
  const jar = await cookies();
  const applicantRaw = jar.get(APPLICANT_COOKIE)?.value;
  if (!applicantRaw) {
    failRedirect('NO_APPLICANT', 'Sign in with X before submitting.', bountyNumber);
  }
  let applicant: { twitterId: string; handle: string };
  try {
    applicant = JSON.parse(applicantRaw);
  } catch {
    failRedirect('BAD_COOKIE', 'Sign-in record is corrupted; please sign in again.', bountyNumber);
  }

  const parsed = inputSchema.safeParse({
    walletAddress: formData.get('walletAddress'),
    walletConfirmed: formData.get('walletConfirmed'),
    tweetUrl: formData.get('tweetUrl'),
    notes: formData.get('notes') || undefined,
    bountyNumber: bountyNumber || undefined,
  });
  if (!parsed.success) {
    failRedirect('INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Invalid input', bountyNumber);
  }

  let tweetId: string;
  try {
    tweetId = parseTweetUrl(parsed.data.tweetUrl).tweetId;
  } catch (e) {
    failRedirect('INVALID_TWEET_URL', e instanceof Error ? e.message : 'Invalid tweet URL', bountyNumber);
  }

  const file = formData.get('receipt') as File | null;
  if (!file || file.size === 0) {
    failRedirect('NO_RECEIPT', 'A receipt photograph must be furnished.', bountyNumber);
  }
  if (file.size > 8 * 1024 * 1024) {
    failRedirect('RECEIPT_TOO_LARGE', 'Receipt must not exceed 8 MB.', bountyNumber);
  }
  if (!file.type.startsWith('image/')) {
    failRedirect('NOT_AN_IMAGE', 'Receipt must be an image file.', bountyNumber);
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const receiptHash = sha256(buf);

  const db = await getDb();

  // Check receipt dedup
  const [existing] = await db.select().from(receiptsSeen).where(eq(receiptsSeen.receiptHash, receiptHash)).limit(1);
  if (existing) {
    failRedirect(
      'RECEIPT_DUPLICATE',
      `This receipt has already been submitted. Original submission filed ${existing.firstSeenAt.toISOString().slice(0, 10)}.`,
      bountyNumber,
    );
  }

  // Rate limit pre-check
  const h = await headers();
  const ipHash = hashIp(h.get('x-forwarded-for') ?? 'unknown');
  const rate = await checkRateLimits(db, {
    wallet: parsed.data.walletAddress,
    twitterId: applicant!.twitterId,
    ipHash,
  });
  if (!rate.ok) {
    failRedirect(
      rate.errorCode ?? 'RATE_LIMITED',
      `Application denied. ${rate.errorCode}. Retry after ${rate.retryAfter?.toISOString().slice(0, 10) ?? 'later'}.`,
      bountyNumber,
    );
  }

  // Resolve bounty if requested
  let bountyId: string | null = null;
  let lane: 'open' | 'bounty' = 'open';
  if (parsed.data.bountyNumber) {
    const n = Number.parseInt(parsed.data.bountyNumber, 10);
    if (!Number.isNaN(n)) {
      const [b] = await db.select().from(bountiesTable).where(eq(bountiesTable.number, n)).limit(1);
      if (!b) {
        failRedirect('BOUNTY_NOT_FOUND', `Bounty №${n} does not exist.`, bountyNumber);
      }
      if (b.status !== 'live') {
        failRedirect('BOUNTY_NOT_LIVE', `Bounty №${n} is not currently accepting applications.`, bountyNumber);
      }
      bountyId = b.id;
      lane = 'bounty';
    }
  }

  // Generate uid + upload receipt
  const publicUid = randomUUID();
  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const yyyy = new Date().getFullYear();
  const mm = String(new Date().getMonth() + 1).padStart(2, '0');
  const r2Key = `receipts/${yyyy}/${mm}/${publicUid}.${ext}`;
  const storage = getStorage();
  await storage.put(r2Key, buf, file.type);

  // Persist submission row + receipts_seen + rate_limit events
  const sub = await createSubmission(db, {
    publicUid,
    lane,
    bountyId,
    applicantTwitterHandle: applicant.handle.toLowerCase(),
    applicantTwitterId: applicant.twitterId,
    applicantWalletAddress: parsed.data.walletAddress,
    tweetUrl: parsed.data.tweetUrl,
    tweetId,
    receiptImageR2Key: r2Key,
    receiptHash,
    ipHash,
    notes: parsed.data.notes ?? null,
    status: 'review_ready', // Plan 6 will move to verifying → review_ready via worker; for now, skip straight there
  });
  await db.insert(receiptsSeen).values({
    receiptHash,
    firstSubmissionId: sub.id,
  });
  await recordIntake(db, {
    wallet: parsed.data.walletAddress,
    twitterId: applicant.twitterId,
    ipHash,
  });

  redirect(`/apply/confirmation/${publicUid}`);
}
