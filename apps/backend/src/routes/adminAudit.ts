import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { getDb } from '@marlbro/db/client';
import { listAudit } from '@marlbro/db/queries/audit';
import { admins } from '@marlbro/db/schema';
import { requireAdminMiddleware } from '../auth/middleware';

export const adminAuditRoutes = new Hono();

adminAuditRoutes.use('*', requireAdminMiddleware('superadmin'));

adminAuditRoutes.get('/', async (c) => {
  const page = Math.max(1, Number.parseInt(c.req.query('page') ?? '1', 10) || 1);
  const limit = 50;
  const db = await getDb();
  const entries = await listAudit(db, { limit, offset: (page - 1) * limit });

  const adminIds = Array.from(new Set(entries.map((e) => e.adminId).filter((x): x is string => !!x)));
  const adminMap: Record<string, string> = {};
  for (const id of adminIds) {
    const [a] = await db.select().from(admins).where(eq(admins.id, id)).limit(1);
    if (a) adminMap[a.id] = a.email;
  }

  return c.json({ entries, adminMap, page, hasMore: entries.length === limit });
});
