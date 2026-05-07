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
