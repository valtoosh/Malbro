import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { getDb } from '@marlbro/db/client';
import { receiptsSeen, bounties as bountiesTable } from '@marlbro/db/schema';
import { createSubmission, parseTweetUrl, getSubmissionByPublicUid } from '@marlbro/db/queries/submissions';
import { sha256 } from '../lib/hash';
import { hashIp } from '../lib/ip';
import { checkRateLimits, recordIntake } from '../lib/rateLimit';
import { getStorage } from '../storage/factory';

export const submissionsRoutes = new Hono();

const inputSchema = z.object({
  walletAddress: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, 'Wallet must be base58 32-44 chars'),
  tweetUrl: z.string().url(),
  notes: z.string().max(2000).optional(),
  bountyNumber: z.string().optional(),
});

const applicantSchema = z.object({
  twitterId: z.string().min(1),
  handle: z.string().min(1),
});

submissionsRoutes.post('/', async (c) => {
  const applicantHeader = c.req.header('X-Marlbro-Applicant');
  if (!applicantHeader) {
    return c.json({ ok: false, errorCode: 'NO_APPLICANT', message: 'Sign in with X first.' }, 401);
  }
  let applicant: z.infer<typeof applicantSchema>;
  try {
    applicant = applicantSchema.parse(JSON.parse(applicantHeader));
  } catch {
    return c.json({ ok: false, errorCode: 'BAD_APPLICANT' }, 400);
  }

  const body = await c.req.parseBody();
  const input = {
    walletAddress: body.walletAddress as string,
    tweetUrl: body.tweetUrl as string,
    notes: (body.notes as string) || undefined,
    bountyNumber: (body.bountyNumber as string) || undefined,
  };
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return c.json({ ok: false, errorCode: 'INVALID_INPUT', message: parsed.error.issues[0]?.message }, 400);
  }

  let tweetId: string;
  try {
    tweetId = parseTweetUrl(parsed.data.tweetUrl).tweetId;
  } catch (e) {
    return c.json({ ok: false, errorCode: 'INVALID_TWEET_URL', message: e instanceof Error ? e.message : 'Invalid tweet URL' }, 400);
  }

  const file = body.receipt as File | undefined;
  if (!file || !(file instanceof File) || file.size === 0) {
    return c.json({ ok: false, errorCode: 'NO_RECEIPT', message: 'Receipt photo required.' }, 400);
  }
  if (file.size > 8 * 1024 * 1024) {
    return c.json({ ok: false, errorCode: 'RECEIPT_TOO_LARGE', message: 'Receipt must not exceed 8 MB.' }, 400);
  }
  if (!file.type.startsWith('image/')) {
    return c.json({ ok: false, errorCode: 'NOT_AN_IMAGE', message: 'Receipt must be an image.' }, 400);
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const receiptHash = sha256(buf);

  const db = await getDb();

  const [existing] = await db.select().from(receiptsSeen).where(eq(receiptsSeen.receiptHash, receiptHash)).limit(1);
  if (existing) {
    return c.json({
      ok: false,
      errorCode: 'RECEIPT_DUPLICATE',
      message: `Receipt already submitted ${existing.firstSeenAt.toISOString().slice(0, 10)}.`,
    }, 409);
  }

  const ipHash = hashIp(c.req.header('X-Forwarded-For') ?? c.req.header('cf-connecting-ip') ?? 'unknown');

  const rate = await checkRateLimits(db, {
    wallet: parsed.data.walletAddress,
    twitterId: applicant.twitterId,
    ipHash,
  });
  if (!rate.ok) {
    return c.json({
      ok: false,
      errorCode: rate.errorCode,
      message: `Application denied. ${rate.errorCode}.`,
      retryAfter: rate.retryAfter?.toISOString(),
    }, 429);
  }

  let bountyId: string | null = null;
  let lane: 'open' | 'bounty' = 'open';
  if (parsed.data.bountyNumber) {
    const n = Number.parseInt(parsed.data.bountyNumber, 10);
    if (!Number.isNaN(n)) {
      const [b] = await db.select().from(bountiesTable).where(eq(bountiesTable.number, n)).limit(1);
      if (!b) return c.json({ ok: false, errorCode: 'BOUNTY_NOT_FOUND' }, 404);
      if (b.status !== 'live') return c.json({ ok: false, errorCode: 'BOUNTY_NOT_LIVE' }, 409);
      bountyId = b.id;
      lane = 'bounty';
    }
  }

  const publicUid = randomUUID();
  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const yyyy = new Date().getFullYear();
  const mm = String(new Date().getMonth() + 1).padStart(2, '0');
  const r2Key = `receipts/${yyyy}/${mm}/${publicUid}.${ext}`;
  const storage = getStorage();
  await storage.put(r2Key, buf, file.type);

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
    status: 'review_ready',
  });
  await db.insert(receiptsSeen).values({ receiptHash, firstSubmissionId: sub.id });
  await recordIntake(db, {
    wallet: parsed.data.walletAddress,
    twitterId: applicant.twitterId,
    ipHash,
  });

  return c.json({ ok: true, publicUid });
});

submissionsRoutes.get('/:uid', async (c) => {
  const db = await getDb();
  const sub = await getSubmissionByPublicUid(db, c.req.param('uid'));
  if (!sub) return c.json({ error: 'NOT_FOUND' }, 404);
  return c.json({ submission: sub });
});
