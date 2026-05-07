import { Hono } from 'hono';
import { z } from 'zod';
import { getDb } from '@marlbro/db/client';
import { listBounties, getBountyById, createBounty, updateBounty } from '@marlbro/db/queries/bounties';
import { recordAudit } from '@marlbro/db/queries/audit';
import { requireAdminMiddleware } from '../auth/middleware';
import { hashIp } from '../lib/ip';

export const adminBountiesRoutes = new Hono();

adminBountiesRoutes.use('*', requireAdminMiddleware('reviewer'));

const createSchema = z.object({
  title: z.string().min(1).max(200),
  brief: z.string().min(1).max(5000),
  payoutMarlbro: z.string().regex(/^\d+(\.\d+)?$/, 'Must be a numeric value'),
  payoutSol: z.string().regex(/^\d+(\.\d+)?$/, 'Must be a numeric value'),
  maxClaims: z.string().optional(),
  deadline: z.string().optional(),
  locationConstraint: z.string().optional(),
  status: z.enum(['draft', 'live', 'paused']),
});

const updateSchema = z.object({
  title: z.string().min(1).max(200),
  brief: z.string().min(1).max(5000),
  payoutMarlbro: z.string().regex(/^\d+(\.\d+)?$/),
  payoutSol: z.string().regex(/^\d+(\.\d+)?$/),
  maxClaims: z.string().optional(),
  deadline: z.string().optional(),
  locationConstraint: z.string().optional(),
  status: z.enum(['draft', 'live', 'paused', 'exhausted', 'expired']),
});

// GET /admin/bounties — list all (reviewer+)
adminBountiesRoutes.get('/', async (c) => {
  const db = await getDb();
  const list = await listBounties(db);
  return c.json({ bounties: list });
});

// POST /admin/bounties — create (approver+)
adminBountiesRoutes.post('/', requireAdminMiddleware('approver'), async (c) => {
  const admin = c.get('admin');
  const body = await c.req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      errors[issue.path.join('.')] = issue.message;
    }
    return c.json({ ok: false, errors }, 400);
  }

  const db = await getDb();
  const created = await createBounty(db, {
    title: parsed.data.title,
    brief: parsed.data.brief,
    payoutMarlbro: parsed.data.payoutMarlbro,
    payoutSol: parsed.data.payoutSol,
    maxClaims: parsed.data.maxClaims ? Number.parseInt(parsed.data.maxClaims, 10) : null,
    deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
    locationConstraint: parsed.data.locationConstraint ?? null,
    status: parsed.data.status,
    createdBy: admin.adminId,
  });

  const ipHash = hashIp(c.req.header('X-Forwarded-For') ?? c.req.header('cf-connecting-ip') ?? 'unknown');
  await recordAudit(db, {
    adminId: admin.adminId,
    action: 'bounty_create',
    targetType: 'bounty',
    targetId: created.id,
    payload: { number: created.number, title: created.title, status: created.status },
    ipHash,
  });

  return c.json({ ok: true, bounty: created }, 201);
});

// GET /admin/bounties/:id — single (reviewer+)
adminBountiesRoutes.get('/:id', async (c) => {
  const db = await getDb();
  const b = await getBountyById(db, c.req.param('id'));
  if (!b) return c.json({ error: 'NOT_FOUND' }, 404);
  return c.json({ bounty: b });
});

// PATCH /admin/bounties/:id — update (approver+)
adminBountiesRoutes.patch('/:id', requireAdminMiddleware('approver'), async (c) => {
  const admin = c.get('admin');
  const body = await c.req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      errors[issue.path.join('.')] = issue.message;
    }
    return c.json({ ok: false, errors }, 400);
  }

  const id = c.req.param('id') ?? '';
  const db = await getDb();
  const updated = await updateBounty(db, id, {
    title: parsed.data.title,
    brief: parsed.data.brief,
    payoutMarlbro: parsed.data.payoutMarlbro,
    payoutSol: parsed.data.payoutSol,
    maxClaims: parsed.data.maxClaims ? Number.parseInt(parsed.data.maxClaims, 10) : null,
    deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
    locationConstraint: parsed.data.locationConstraint ?? null,
    status: parsed.data.status,
  });
  if (!updated) return c.json({ ok: false, errors: { _form: 'Bounty not found' } }, 404);

  const ipHash = hashIp(c.req.header('X-Forwarded-For') ?? c.req.header('cf-connecting-ip') ?? 'unknown');
  await recordAudit(db, {
    adminId: admin.adminId,
    action: 'bounty_update',
    targetType: 'bounty',
    targetId: updated.id,
    payload: { number: updated.number, title: updated.title, status: updated.status },
    ipHash,
  });

  return c.json({ ok: true, bounty: updated });
});
