# Marlbro · Plan 6 — Review Queue + Stubbed Payouts + DB-driven Wall

> Required sub-skill: superpowers:subagent-driven-development.

**Goal:** Admin can approve / reject submissions; approval creates an `approved_grants` row and triggers a stubbed Squads payout (logs the transaction it WOULD broadcast); after the (mocked) execution, the grant appears on /wall. End of plan: the full system runs end-to-end against PGlite + console-stubbed Squads, ready for real keys.

**Architecture:** New table `approved_grants`. New `lib/squads/` module — `proposePayout` returns a stub proposal id and logs the would-be tx when keys absent. New `markGrantExecuted` action simulates the polling job (Plan 7+ replaces with real polling). Wall reads approved_grants instead of sample posters.

**Spec ref:** §7.1 (approved_grants), §8 stages 3–5 (review → payout → wall), §11.3 (Squads).

---

## File Structure

```
db/
  schema.ts                       [modified] add approved_grants
  queries/
    approvedGrants.ts             create + listExecuted + getById + markExecuted
    approvedGrants.test.ts
  migrations/                     regenerated

lib/
  squads/
    propose.ts                    proposePayout — stub when no keys
    propose.test.ts

app/
  admin/(authed)/queue/
    page.tsx                      Review queue
    [submissionId]/page.tsx       Single-submission review
    [submissionId]/actions.ts     approve / reject / markExecuted server actions
  wall/
    page.tsx                      [modified] read from approved_grants
    [id]/page.tsx                 [modified] read from approved_grants
```

---

## Task 1: approved_grants schema + queries

Add to `db/schema.ts`:

```typescript
export const payoutStatus = pgEnum('payout_status', ['queued', 'proposed', 'executed', 'failed']);

export const approvedGrants = pgTable('approved_grants', {
  id: uuid('id').primaryKey().defaultRandom(),
  displayNumber: serial('display_number').notNull(),
  submissionId: uuid('submission_id').notNull().unique().references(() => submissions.id),
  bountyId: uuid('bounty_id').references(() => bounties.id),
  payoutMarlbro: numeric('payout_marlbro', { precision: 30, scale: 6 }).notNull().default('0'),
  payoutSol: numeric('payout_sol', { precision: 30, scale: 9 }).notNull().default('0'),
  payoutStatus: payoutStatus('payout_status').notNull().default('queued'),
  squadsProposalPubkey: text('squads_proposal_pubkey'),
  payoutTxSignature: text('payout_tx_signature'),
  posterOgImageUrl: text('poster_og_image_url'),
  approvedAt: timestamp('approved_at', { withTimezone: true }).notNull().defaultNow(),
  paidAt: timestamp('paid_at', { withTimezone: true }),
});

export type ApprovedGrant = typeof approvedGrants.$inferSelect;
export type NewApprovedGrant = typeof approvedGrants.$inferInsert;
```

Generate migration: `npm run db:generate`.

Queries module `db/queries/approvedGrants.ts`:

```typescript
import { eq, desc } from 'drizzle-orm';
import { approvedGrants, type ApprovedGrant, type NewApprovedGrant } from '../schema';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

export async function createApprovedGrant(db: Db, input: NewApprovedGrant): Promise<ApprovedGrant> {
  const [row] = await db.insert(approvedGrants).values(input).returning();
  return row;
}

export async function getApprovedGrantById(db: Db, id: string): Promise<ApprovedGrant | undefined> {
  const [row] = await db.select().from(approvedGrants).where(eq(approvedGrants.id, id)).limit(1);
  return row;
}

export async function listExecutedGrants(db: Db, opts: { limit?: number; offset?: number } = {}): Promise<ApprovedGrant[]> {
  return db
    .select()
    .from(approvedGrants)
    .where(eq(approvedGrants.payoutStatus, 'executed'))
    .orderBy(desc(approvedGrants.displayNumber))
    .limit(opts.limit ?? 100)
    .offset(opts.offset ?? 0);
}

export async function setProposalPubkey(db: Db, id: string, pubkey: string): Promise<void> {
  await db
    .update(approvedGrants)
    .set({ squadsProposalPubkey: pubkey, payoutStatus: 'proposed' })
    .where(eq(approvedGrants.id, id));
}

export async function markExecuted(db: Db, id: string, txSignature: string): Promise<ApprovedGrant | undefined> {
  const [row] = await db
    .update(approvedGrants)
    .set({ payoutStatus: 'executed', payoutTxSignature: txSignature, paidAt: new Date() })
    .where(eq(approvedGrants.id, id))
    .returning();
  return row;
}
```

Tests in `db/queries/approvedGrants.test.ts` (5 tests minimum: create, getById, listExecutedFiltersStatus, setProposalPubkey, markExecuted).

Commit:
```
git add db/schema.ts db/migrations db/queries/approvedGrants.ts db/queries/approvedGrants.test.ts
git commit -m "feat(db): add approved_grants table and queries"
```

---

## Task 2: Squads propose stub

`lib/squads/propose.ts`:

```typescript
// lib/squads/propose.ts
// PLACEHOLDER: real Squads multisig integration is fill-in-later. When
// SQUADS_PROPOSER_SK + SQUADS_MULTISIG_PUBKEY env vars are absent, this
// returns a fake proposal pubkey and logs the would-be transaction so the
// admin flow runs end-to-end. Plan 7 replaces with real @sqds/multisig calls.

export interface ProposePayoutInput {
  grantId: string;
  recipientWallet: string;
  payoutMarlbro: string;  // stringified numeric
  payoutSol: string;
  memo: string;
}

export interface ProposeResult {
  ok: boolean;
  proposalPubkey: string;
  delivered: 'real' | 'stub';
}

export async function proposePayout(input: ProposePayoutInput): Promise<ProposeResult> {
  if (process.env.SQUADS_PROPOSER_SK && process.env.SQUADS_MULTISIG_PUBKEY) {
    // TODO: real implementation
    // 1. Decode SQUADS_PROPOSER_SK as a Solana keypair (base58 or array).
    // 2. Build SPL transfer ix for $MARLBRO mint + lamport transfer for SOL.
    // 3. Wrap in Squads VaultTransactionCreate ix with the memo.
    // 4. Sign with proposer keypair, send via Helius RPC.
    // 5. Return real proposal pubkey.
    throw new Error('Real Squads payout not yet implemented — Plan 7.');
  }

  // Stub: log + return fake pubkey
  const fakePubkey = `stub_proposal_${input.grantId.slice(0, 8)}_${Date.now()}`;
  console.log(
    `\n[Squads STUB] Would propose payout for grant ${input.grantId}:\n` +
      `  recipient:   ${input.recipientWallet}\n` +
      `  $MARLBRO:    ${input.payoutMarlbro}\n` +
      `  SOL:         ${input.payoutSol}\n` +
      `  memo:        ${input.memo}\n` +
      `  proposalKey: ${fakePubkey}\n` +
      `  (Set SQUADS_PROPOSER_SK + SQUADS_MULTISIG_PUBKEY to broadcast for real)\n`,
  );
  return { ok: true, proposalPubkey: fakePubkey, delivered: 'stub' };
}
```

Tests:

```typescript
// lib/squads/propose.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('proposePayout (stub)', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    delete process.env.SQUADS_PROPOSER_SK;
    delete process.env.SQUADS_MULTISIG_PUBKEY;
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('returns stub proposal pubkey when env unset', async () => {
    const { proposePayout } = await import('./propose');
    const r = await proposePayout({
      grantId: 'aaaa-bbbb-cccc-dddd',
      recipientWallet: '5n3X9pK4rT2QmL8vWYxZdNbF7HjAuC1k7p4q',
      payoutMarlbro: '5000',
      payoutSol: '0',
      memo: 'marlbro:grant:test',
    });
    expect(r.ok).toBe(true);
    expect(r.delivered).toBe('stub');
    expect(r.proposalPubkey).toMatch(/^stub_proposal_/);
    expect(logSpy).toHaveBeenCalled();
  });

  it('throws when only one env var is set', async () => {
    process.env.SQUADS_PROPOSER_SK = 'x';
    const { proposePayout } = await import('./propose');
    const r = await proposePayout({
      grantId: 'a', recipientWallet: 'w', payoutMarlbro: '0', payoutSol: '0', memo: 'x',
    });
    // Without SQUADS_MULTISIG_PUBKEY, falls back to stub
    expect(r.delivered).toBe('stub');
  });
});
```

Commit:
```
git add lib/squads
git commit -m "feat(squads): add proposePayout with stub when keys absent"
```

---

## Task 3: Admin queue page

Files: `app/admin/(authed)/queue/page.tsx`.

```tsx
// app/admin/(authed)/queue/page.tsx
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { getDb } from '@/db/client';
import { listPendingSubmissions } from '@/db/queries/submissions';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export const metadata = { title: 'Admin · Review Queue' };
export const dynamic = 'force-dynamic';

export default async function ReviewQueuePage() {
  await requireAdmin('reviewer');
  const db = await getDb();
  const pending = await listPendingSubmissions(db);

  return (
    <>
      <p className="font-mono text-eyebrow uppercase mb-4">§02 — REVIEW QUEUE</p>
      <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em] mb-8">
        REVIEW QUEUE
      </h1>
      <p className="font-mono text-caption uppercase tracking-[0.12em] text-ink-2 mb-8">
        {pending.length} submission{pending.length === 1 ? '' : 's'} awaiting review
      </p>

      {pending.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="font-mono text-bodyL text-ink-2">No submissions in queue.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {pending.map((s) => (
            <Link key={s.id} href={`/admin/queue/${s.id}`} className="block group">
              <Card className="p-6 group-hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between gap-6 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-mono text-eyebrow uppercase mb-2">FILING {s.publicUid.slice(0, 8)}</p>
                    <h3 className="font-display font-bold text-h3 leading-tight">@{s.applicantTwitterHandle}</h3>
                    <p className="font-mono text-bodyS mt-2 break-all opacity-70">{s.applicantWalletAddress}</p>
                    <p className="font-mono text-caption mt-2">
                      <a href={s.tweetUrl} target="_blank" rel="noopener noreferrer" className="underline break-all">
                        {s.tweetUrl}
                      </a>
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 items-end shrink-0">
                    <Tag>{s.lane.toUpperCase()}</Tag>
                    <p className="font-mono text-caption text-ink-2">{s.createdAt.toISOString().slice(0, 10)}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
```

Build, commit:
```
git add 'app/admin/(authed)/queue/page.tsx'
git commit -m "feat(admin): add review queue page"
```

---

## Task 4: Single-submission review page + actions

`app/admin/(authed)/queue/[submissionId]/actions.ts`:

```typescript
'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { submissions, bounties as bountiesTable } from '@/db/schema';
import { createApprovedGrant, setProposalPubkey, markExecuted } from '@/db/queries/approvedGrants';
import { recordAudit } from '@/db/queries/audit';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { hashIp } from '@/lib/ip';
import { proposePayout } from '@/lib/squads/propose';

const approveSchema = z.object({
  submissionId: z.string().uuid(),
  payoutMarlbro: z.string().regex(/^\d+(\.\d+)?$/),
  payoutSol: z.string().regex(/^\d+(\.\d+)?$/),
});

export async function approveSubmission(formData: FormData): Promise<void> {
  const session = await requireAdmin('approver');
  const parsed = approveSchema.parse({
    submissionId: formData.get('submissionId'),
    payoutMarlbro: formData.get('payoutMarlbro'),
    payoutSol: formData.get('payoutSol'),
  });
  const db = await getDb();
  const [sub] = await db.select().from(submissions).where(eq(submissions.id, parsed.submissionId)).limit(1);
  if (!sub) throw new Error('Submission not found');
  if (sub.status !== 'review_ready') throw new Error(`Submission status ${sub.status} not eligible for approval`);

  // Update submission status
  await db
    .update(submissions)
    .set({ status: 'approved', reviewedBy: session.adminId, reviewedAt: new Date() })
    .where(eq(submissions.id, sub.id));

  // Create approved_grants
  const grant = await createApprovedGrant(db, {
    submissionId: sub.id,
    bountyId: sub.bountyId,
    payoutMarlbro: parsed.payoutMarlbro,
    payoutSol: parsed.payoutSol,
    payoutStatus: 'queued',
  });

  // Increment claims_used on bounty if bounty lane
  if (sub.bountyId) {
    const [b] = await db.select().from(bountiesTable).where(eq(bountiesTable.id, sub.bountyId)).limit(1);
    if (b) {
      await db
        .update(bountiesTable)
        .set({ claimsUsed: (b.claimsUsed ?? 0) + 1 })
        .where(eq(bountiesTable.id, sub.bountyId));
    }
  }

  // Propose Squads payout
  const proposal = await proposePayout({
    grantId: grant.id,
    recipientWallet: sub.applicantWalletAddress,
    payoutMarlbro: parsed.payoutMarlbro,
    payoutSol: parsed.payoutSol,
    memo: `marlbro:grant:${grant.id}`,
  });
  await setProposalPubkey(db, grant.id, proposal.proposalPubkey);

  // Audit
  const h = await headers();
  await recordAudit(db, {
    adminId: session.adminId,
    action: 'submission_approve',
    targetType: 'submission',
    targetId: sub.id,
    payload: { grantId: grant.id, payoutMarlbro: parsed.payoutMarlbro, payoutSol: parsed.payoutSol, proposalPubkey: proposal.proposalPubkey },
    ipHash: hashIp(h.get('x-forwarded-for') ?? 'unknown'),
  });

  redirect(`/admin/queue/${sub.id}?ok=approved&grantId=${grant.id}`);
}

const rejectSchema = z.object({
  submissionId: z.string().uuid(),
  reason: z.string().min(3).max(1000),
});

export async function rejectSubmission(formData: FormData): Promise<void> {
  const session = await requireAdmin('reviewer');
  const parsed = rejectSchema.parse({
    submissionId: formData.get('submissionId'),
    reason: formData.get('reason'),
  });
  const db = await getDb();
  await db
    .update(submissions)
    .set({ status: 'rejected', rejectionReason: parsed.reason, reviewedBy: session.adminId, reviewedAt: new Date() })
    .where(eq(submissions.id, parsed.submissionId));

  const h = await headers();
  await recordAudit(db, {
    adminId: session.adminId,
    action: 'submission_reject',
    targetType: 'submission',
    targetId: parsed.submissionId,
    payload: { reason: parsed.reason },
    ipHash: hashIp(h.get('x-forwarded-for') ?? 'unknown'),
  });

  redirect(`/admin/queue?ok=rejected`);
}

const markPaidSchema = z.object({
  grantId: z.string().uuid(),
  txSignature: z.string().min(20).max(200),
});

export async function markGrantExecuted(formData: FormData): Promise<void> {
  const session = await requireAdmin('approver');
  const parsed = markPaidSchema.parse({
    grantId: formData.get('grantId'),
    txSignature: formData.get('txSignature'),
  });
  const db = await getDb();
  const updated = await markExecuted(db, parsed.grantId, parsed.txSignature);
  if (!updated) throw new Error('Grant not found');

  const h = await headers();
  await recordAudit(db, {
    adminId: session.adminId,
    action: 'grant_mark_executed',
    targetType: 'approved_grant',
    targetId: parsed.grantId,
    payload: { txSignature: parsed.txSignature },
    ipHash: hashIp(h.get('x-forwarded-for') ?? 'unknown'),
  });

  redirect(`/admin/queue?ok=executed`);
}
```

`app/admin/(authed)/queue/[submissionId]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { getDb } from '@/db/client';
import { submissions, approvedGrants } from '@/db/schema';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { approveSubmission, rejectSubmission, markGrantExecuted } from './actions';

export const metadata = { title: 'Admin · Review' };
export const dynamic = 'force-dynamic';

export default async function ReviewSubmissionPage({
  params,
  searchParams,
}: {
  params: Promise<{ submissionId: string }>;
  searchParams: Promise<{ ok?: string; grantId?: string }>;
}) {
  await requireAdmin('reviewer');
  const { submissionId } = await params;
  const sp = await searchParams;
  const db = await getDb();
  const [sub] = await db.select().from(submissions).where(eq(submissions.id, submissionId)).limit(1);
  if (!sub) notFound();

  // Fetch any associated approved_grant
  const [grant] = await db.select().from(approvedGrants).where(eq(approvedGrants.submissionId, sub.id)).limit(1);

  return (
    <>
      <Link href="/admin/queue" className="font-mono text-eyebrow uppercase tracking-[0.12em] inline-block mb-6 underline underline-offset-[3px]">
        ← REVIEW QUEUE
      </Link>

      <p className="font-mono text-eyebrow uppercase mb-2">FILING {sub.publicUid}</p>
      <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em] mb-6">
        @{sub.applicantTwitterHandle}
      </h1>
      <div className="flex flex-wrap gap-2 mb-8">
        <Tag>{sub.status.toUpperCase()}</Tag>
        <Tag variant="muted">{sub.lane.toUpperCase()} LANE</Tag>
      </div>

      {sp.ok === 'approved' && (
        <div className="mb-6 p-4 border-2 border-ink bg-paper-2">
          <p className="font-mono text-bodyS">Submission approved. Grant ID {sp.grantId}. Squads proposal queued.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6">
            <h3 className="font-mono text-eyebrow uppercase mb-3">RECEIPT</h3>
            <a href={`/api/uploads/${encodeURI(sub.receiptImageR2Key)}`} target="_blank" rel="noopener noreferrer" className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/uploads/${encodeURI(sub.receiptImageR2Key)}`}
                alt="Receipt"
                className="border-2 border-ink max-w-full"
              />
            </a>
          </Card>

          <Card className="p-6">
            <h3 className="font-mono text-eyebrow uppercase mb-3">TWEET</h3>
            <a href={sub.tweetUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-bodyS break-all underline">
              {sub.tweetUrl}
            </a>
            <p className="font-mono text-caption mt-3">tweet ID: {sub.tweetId}</p>
            {sub.tweetVerificationPayload ? (
              <pre className="mt-3 p-3 bg-paper-2 border-2 border-ink overflow-x-auto text-bodyS font-mono">
                {JSON.stringify(sub.tweetVerificationPayload, null, 2)}
              </pre>
            ) : (
              <p className="font-mono text-caption mt-3 text-marlbro-deep">[NO VERIFICATION PAYLOAD — Twitter API stub]</p>
            )}
          </Card>

          {sub.notes && (
            <Card className="p-6">
              <h3 className="font-mono text-eyebrow uppercase mb-3">APPLICANT NOTES</h3>
              <p className="text-body whitespace-pre-wrap">{sub.notes}</p>
            </Card>
          )}
        </div>

        <aside className="lg:col-span-5 space-y-6">
          <Card className="p-6 bg-paper-2">
            <h3 className="font-mono text-eyebrow uppercase mb-3">RECIPIENT</h3>
            <p className="font-mono text-bodyS break-all">{sub.applicantWalletAddress}</p>
          </Card>

          {sub.status === 'review_ready' && (
            <>
              <Card className="p-6">
                <h3 className="font-mono text-eyebrow uppercase mb-3">APPROVE</h3>
                <form action={approveSubmission} className="space-y-4">
                  <input type="hidden" name="submissionId" value={sub.id} />
                  <label className="block">
                    <span className="block font-mono text-eyebrow uppercase tracking-[0.12em] mb-2">PAYOUT — $MARLBRO</span>
                    <Input name="payoutMarlbro" required defaultValue="5000" />
                  </label>
                  <label className="block">
                    <span className="block font-mono text-eyebrow uppercase tracking-[0.12em] mb-2">PAYOUT — SOL</span>
                    <Input name="payoutSol" required defaultValue="0" />
                  </label>
                  <Button type="submit" className="w-full">APPROVE + PROPOSE PAYOUT</Button>
                </form>
              </Card>

              <Card className="p-6">
                <h3 className="font-mono text-eyebrow uppercase mb-3">REJECT</h3>
                <form action={rejectSubmission} className="space-y-4">
                  <input type="hidden" name="submissionId" value={sub.id} />
                  <textarea
                    name="reason"
                    required
                    rows={3}
                    placeholder="Pursuant to Schedule R-7 §17(a), …"
                    className="block w-full px-[14px] py-[12px] bg-paper border-2 border-ink font-sans text-body"
                  />
                  <Button type="submit" variant="ghost" className="w-full">REJECT</Button>
                </form>
              </Card>
            </>
          )}

          {grant && (
            <Card className="p-6 bg-paper-2">
              <h3 className="font-mono text-eyebrow uppercase mb-3">APPROVED GRANT</h3>
              <p className="font-mono text-bodyS">№{grant.displayNumber}</p>
              <p className="font-mono text-caption mt-2">status: {grant.payoutStatus}</p>
              {grant.squadsProposalPubkey && (
                <p className="font-mono text-caption mt-1 break-all">proposal: {grant.squadsProposalPubkey}</p>
              )}
              {grant.payoutTxSignature && (
                <p className="font-mono text-caption mt-1 break-all">tx: {grant.payoutTxSignature}</p>
              )}
              {grant.payoutStatus === 'proposed' && (
                <form action={markGrantExecuted} className="mt-4 space-y-3">
                  <input type="hidden" name="grantId" value={grant.id} />
                  <label className="block">
                    <span className="block font-mono text-eyebrow uppercase tracking-[0.12em] mb-2">TX SIGNATURE (after Squads execution)</span>
                    <Input name="txSignature" required placeholder="5KqW1..." />
                  </label>
                  <Button type="submit" className="w-full">MARK EXECUTED</Button>
                </form>
              )}
            </Card>
          )}

          {sub.rejectionReason && (
            <Card className="p-6 border-stamp-red">
              <h3 className="font-mono text-eyebrow uppercase mb-3 text-stamp-red">REJECTION REASON</h3>
              <p className="text-body whitespace-pre-wrap">{sub.rejectionReason}</p>
            </Card>
          )}
        </aside>
      </div>
    </>
  );
}
```

Commit:
```
git add 'app/admin/(authed)/queue/[submissionId]'
git commit -m "feat(admin): add submission review page with approve/reject/mark-paid actions"
```

---

## Task 5: Wall reads from approved_grants

Modify `app/wall/page.tsx` and `app/wall/[id]/page.tsx`. Approved grants need to be JOIN'd with submissions to get tweet quote, applicant handle, wallet (truncated). Use a query helper.

Add to `db/queries/approvedGrants.ts`:

```typescript
import { submissions } from '../schema';

export interface PosterView {
  id: string;
  displayNumber: number;
  bountyNumber: number | null;
  applicantHandle: string;
  walletShort: string;
  tweetQuote: string;  // For sample, derive from notes or use tweetUrl
  payoutMarlbro: number;
  payoutSol: number;
  paidAt: string;
}

export async function listExecutedAsPosters(db: Db, opts: { limit?: number; offset?: number } = {}): Promise<PosterView[]> {
  const rows = await db
    .select({
      grant: approvedGrants,
      submission: submissions,
    })
    .from(approvedGrants)
    .innerJoin(submissions, eq(approvedGrants.submissionId, submissions.id))
    .where(eq(approvedGrants.payoutStatus, 'executed'))
    .orderBy(desc(approvedGrants.displayNumber))
    .limit(opts.limit ?? 100)
    .offset(opts.offset ?? 0);

  return rows.map((r: { grant: ApprovedGrant; submission: typeof submissions.$inferSelect }) => ({
    id: r.grant.id,
    displayNumber: r.grant.displayNumber,
    bountyNumber: null, // bountyId mapped to bounty.number is a separate query; v1 leaves null
    applicantHandle: r.submission.applicantTwitterHandle,
    walletShort: shortenWallet(r.submission.applicantWalletAddress),
    tweetQuote: r.submission.notes ?? `Filing ${r.submission.publicUid.slice(0, 8)}`,
    payoutMarlbro: Number(r.grant.payoutMarlbro),
    payoutSol: Number(r.grant.payoutSol),
    paidAt: (r.grant.paidAt ?? r.grant.approvedAt).toISOString().slice(0, 10),
  }));
}

function shortenWallet(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 4)}···${addr.slice(-4)}`;
}

export async function getPosterViewById(db: Db, id: string): Promise<PosterView | undefined> {
  const list = await db
    .select({ grant: approvedGrants, submission: submissions })
    .from(approvedGrants)
    .innerJoin(submissions, eq(approvedGrants.submissionId, submissions.id))
    .where(eq(approvedGrants.id, id))
    .limit(1);
  if (list.length === 0) return undefined;
  const r = list[0]!;
  return {
    id: r.grant.id,
    displayNumber: r.grant.displayNumber,
    bountyNumber: null,
    applicantHandle: r.submission.applicantTwitterHandle,
    walletShort: shortenWallet(r.submission.applicantWalletAddress),
    tweetQuote: r.submission.notes ?? `Filing ${r.submission.publicUid.slice(0, 8)}`,
    payoutMarlbro: Number(r.grant.payoutMarlbro),
    payoutSol: Number(r.grant.payoutSol),
    paidAt: (r.grant.paidAt ?? r.grant.approvedAt).toISOString().slice(0, 10),
  };
}
```

Modify `app/wall/page.tsx` to call `listExecutedAsPosters`. If empty, fall back to `SAMPLE_POSTERS` so the wall isn't blank in dev:

```tsx
import { SAMPLE_POSTERS } from '@/lib/sampleData';
import { listExecutedAsPosters } from '@/db/queries/approvedGrants';
// ...
const dbPosters = await listExecutedAsPosters(db);
const posters = dbPosters.length > 0 ? dbPosters : SAMPLE_POSTERS;
```

Same fallback pattern in `app/wall/[id]/page.tsx`: try DB first by id, then fall back to sample data lookup.

Commit:
```
git add db/queries/approvedGrants.ts app/wall
git commit -m "feat(wall): switch Wall of Grants to read approved_grants with sample fallback"
```

---

## Task 6: Wire dashboard to review queue + final push

Modify `app/admin/(authed)/page.tsx` to make Review Queue card live (link to `/admin/queue`).

```tsx
// In dashboard: replace the "FORTHCOMING — PLAN 5" Review Queue card with a live link
<Link href="/admin/queue" className="block">
  <Card className="p-6 h-full hover:shadow-lg transition-shadow">
    <p className="font-mono text-eyebrow uppercase mb-3">MODULE</p>
    <h3 className="font-display font-black text-h3 leading-tight">REVIEW QUEUE</h3>
    <p className="text-bodyS text-ink-2 mt-2">Approve, reject, or flag pending grant applications.</p>
    <div className="mt-4">
      <Tag>OPEN →</Tag>
    </div>
  </Card>
</Link>
```

Commit:
```
git add 'app/admin/(authed)/page.tsx'
git commit -m "feat(admin): wire dashboard to review queue"
```

Final validation + push:
```
npm test
npm run typecheck
npm run lint
npm run build
git push origin plan-3-db-admin-auth
gh run list --limit 1 --json status,conclusion,name
```

---

*End of Plan 6.*
