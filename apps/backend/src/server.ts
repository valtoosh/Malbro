import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';

app.use(
  '*',
  cors({
    origin: FRONTEND_ORIGIN,
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

app.get('/', (c) => c.json({ name: 'marlbro-backend', ok: true }));

app.get('/health', async (c) => {
  // DB ping is wired in Phase 3 once routes are added.
  return c.json({ ok: true, db: 'pending' });
});

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, (info) => {
  // eslint-disable-next-line no-console
  console.log(`marlbro-backend listening on http://localhost:${info.port}`);
});

export default app;
