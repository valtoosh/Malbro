import { Hono } from 'hono';
import { getDb } from '@marlbro/db/client';
import { listLiveBounties, getBountyByNumber } from '@marlbro/db/queries/bounties';

export const bountiesRoutes = new Hono();

bountiesRoutes.get('/', async (c) => {
  const db = await getDb();
  const list = await listLiveBounties(db);
  return c.json({ bounties: list });
});

bountiesRoutes.get('/:number{[0-9]+}', async (c) => {
  const n = Number.parseInt(c.req.param('number'), 10);
  const db = await getDb();
  const b = await getBountyByNumber(db, n);
  if (!b) return c.json({ error: 'NOT_FOUND' }, 404);
  return c.json({ bounty: b });
});
