import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@marlbro/db/client';
import { submissions, bounties as bountiesTable, approvedGrants } from '@marlbro/db/schema';
import { listPendingSubmissions } from '@marlbro/db/queries/submissions';
import { createApprovedGrant, setProposalPubkey, markExecuted } from '@marlbro/db/queries/approvedGrants';
import { recordAudit } from '@marlbro/db/queries/audit';
import { requireAdminMiddleware } from '../auth/middleware';
import { hashIp } from '../lib/ip';
import { proposePayout } from '../squads/propose';

export const adminQueueRoutes = new Hono();

adminQueueRoutes.use('*', requireAdminMiddleware('reviewer'));

// GET /admin/queue — list pending submissions (reviewer+)
adminQueueRoutes.get('/', async (c) => {
  const page = Math.max(1, Number.parseInt(c.req.query('page') ?? '1', 10) || 1);
  const limit = 50;
  const db = await getDb();
  const list = await listPendingSubmissions(db, { limit, offset: (page - 1) * limit });
  return c.json({ submissions: list, page, hasMore: list.length === limit });
});

// GET /admin/queue/:submissionId — single submission + grant (reviewer+)
adminQueueRoutes.get('/:submissionId', async (c) => {
  const submissionId = c.req.param('submissionId') ?? '';
  const db = await getDb();
  const [sub] = await db.select().from(submissions).where(eq(submissions.id, submissionId)).limit(1);
  if (!sub) return c.json({ error: 'NOT_FOUND' }, 404);

  // Also fetch associated grant if exists
  const grants = await db
    .select()
    .from(approvedGrants)
    .where(eq(approvedGrants.submissionId, sub.id))
    .limit(1);
  const grant = grants[0] ?? null;

  return c.json({ submission: sub, grant });
});

const approveSchema = z.object({
  payoutMarlbro: z.string().regex(/^\d+(\.\d+)?$/),
  payoutSol: z.string().regex(/^\d+(\.\d+)?$/),
});

// POST /admin/queue/:submissionId/approve — approve (approver+)
adminQueueRoutes.post('/:submissionId/approve', requireAdminMiddleware('approver'), async (c) => {
  const admin = c.get('admin');
  const body = await c.req.json().catch(() => ({}));
  const parsed = approveSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, 400);
  }

  const submissionId = c.req.param('submissionId') ?? '';
  const db = await getDb();
  const [sub] = await db.select().from(submissions).where(eq(submissions.id, submissionId)).limit(1);
  if (!sub) return c.json({ ok: false, errorCode: 'NOT_FOUND' }, 404);
  if (sub.status !== 'review_ready') {
    return c.json({ ok: false, errorCode: 'INVALID_STATUS', message: `Submission status ${sub.status} not eligible for approval` }, 409);
  }

  await db
    .update(submissions)
    .set({ status: 'approved', reviewedBy: admin.adminId, reviewedAt: new Date() })
    .where(eq(submissions.id, sub.id));

  const grant = await createApprovedGrant(db, {
    submissionId: sub.id,
    bountyId: sub.bountyId,
    payoutMarlbro: parsed.data.payoutMarlbro,
    payoutSol: parsed.data.payoutSol,
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

  const proposal = await proposePayout({
    grantId: grant.id,
    recipientWallet: sub.applicantWalletAddress,
    payoutMarlbro: parsed.data.payoutMarlbro,
    payoutSol: parsed.data.payoutSol,
    memo: `marlbro:grant:${grant.id}`,
  });
  await setProposalPubkey(db, grant.id, proposal.proposalPubkey);

  const ipHash = hashIp(c.req.header('X-Forwarded-For') ?? c.req.header('cf-connecting-ip') ?? 'unknown');
  await recordAudit(db, {
    adminId: admin.adminId,
    action: 'submission_approve',
    targetType: 'submission',
    targetId: sub.id,
    payload: { grantId: grant.id, payoutMarlbro: parsed.data.payoutMarlbro, payoutSol: parsed.data.payoutSol, proposalPubkey: proposal.proposalPubkey },
    ipHash,
  });

  return c.json({ ok: true, grantId: grant.id, proposalPubkey: proposal.proposalPubkey });
});

const rejectSchema = z.object({
  reason: z.string().min(3).max(1000),
});

// POST /admin/queue/:submissionId/reject — reject (reviewer+)
adminQueueRoutes.post('/:submissionId/reject', async (c) => {
  const admin = c.get('admin');
  const body = await c.req.json().catch(() => ({}));
  const parsed = rejectSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, 400);
  }

  const submissionId = c.req.param('submissionId') ?? '';
  const db = await getDb();
  const [sub] = await db.select().from(submissions).where(eq(submissions.id, submissionId)).limit(1);
  if (!sub) return c.json({ ok: false, errorCode: 'NOT_FOUND' }, 404);

  await db
    .update(submissions)
    .set({ status: 'rejected', rejectionReason: parsed.data.reason, reviewedBy: admin.adminId, reviewedAt: new Date() })
    .where(eq(submissions.id, sub.id));

  const ipHash = hashIp(c.req.header('X-Forwarded-For') ?? c.req.header('cf-connecting-ip') ?? 'unknown');
  await recordAudit(db, {
    adminId: admin.adminId,
    action: 'submission_reject',
    targetType: 'submission',
    targetId: sub.id,
    payload: { reason: parsed.data.reason },
    ipHash,
  });

  return c.json({ ok: true });
});

const markExecutedSchema = z.object({
  txSignature: z.string().min(20).max(200),
});

// POST /admin/queue/grants/:grantId/mark-executed — mark paid (approver+)
adminQueueRoutes.post('/grants/:grantId/mark-executed', requireAdminMiddleware('approver'), async (c) => {
  const admin = c.get('admin');
  const body = await c.req.json().catch(() => ({}));
  const parsed = markExecutedSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, 400);
  }

  const grantId = c.req.param('grantId') ?? '';
  const db = await getDb();
  const updated = await markExecuted(db, grantId, parsed.data.txSignature);
  if (!updated) return c.json({ ok: false, errorCode: 'NOT_FOUND' }, 404);

  const ipHash = hashIp(c.req.header('X-Forwarded-For') ?? c.req.header('cf-connecting-ip') ?? 'unknown');
  await recordAudit(db, {
    adminId: admin.adminId,
    action: 'grant_mark_executed',
    targetType: 'approved_grant',
    targetId: grantId,
    payload: { txSignature: parsed.data.txSignature },
    ipHash,
  });

  return c.json({ ok: true, grant: updated });
});
