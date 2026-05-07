import { Hono } from 'hono';
import { sql } from 'drizzle-orm';
import { getDb } from '@marlbro/db/client';

export const healthRoutes = new Hono();

healthRoutes.get('/', async (c) => {
  try {
    const db = await getDb();
    await db.execute(sql`SELECT 1`);
    return c.json({ ok: true, db: 'reachable' });
  } catch (err) {
    return c.json({ ok: false, error: String(err) }, 500);
  }
});
