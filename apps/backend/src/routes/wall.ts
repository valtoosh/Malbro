import { Hono } from 'hono';
import { getDb } from '@marlbro/db/client';
import { listExecutedAsPosters, getPosterViewById } from '@marlbro/db/queries/approvedGrants';

export const wallRoutes = new Hono();

wallRoutes.get('/', async (c) => {
  const db = await getDb();
  const posters = await listExecutedAsPosters(db);
  return c.json({ posters });
});

wallRoutes.get('/:id', async (c) => {
  const db = await getDb();
  const p = await getPosterViewById(db, c.req.param('id'));
  if (!p) return c.json({ error: 'NOT_FOUND' }, 404);
  return c.json({ poster: p });
});
