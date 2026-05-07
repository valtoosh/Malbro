import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { healthRoutes } from './routes/health';
import { bountiesRoutes } from './routes/bounties';
import { wallRoutes } from './routes/wall';
import { submissionsRoutes } from './routes/submissions';
import { adminLoginRoutes } from './routes/adminLogin';
import { adminBountiesRoutes } from './routes/adminBounties';
import { adminQueueRoutes } from './routes/adminQueue';
import { adminAuditRoutes } from './routes/adminAudit';
import { twitterRoutes } from './routes/twitter';
import { uploadsRoutes } from './routes/uploads';

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

app.route('/health', healthRoutes);
app.route('/bounties', bountiesRoutes);
app.route('/wall', wallRoutes);
app.route('/submissions', submissionsRoutes);
app.route('/admin/login', adminLoginRoutes);
app.route('/admin/bounties', adminBountiesRoutes);
app.route('/admin/queue', adminQueueRoutes);
app.route('/admin/audit', adminAuditRoutes);
app.route('/twitter', twitterRoutes);
app.route('/uploads', uploadsRoutes);

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? 3001);
  serve({ fetch: app.fetch, port }, (info) => {
    // eslint-disable-next-line no-console
    console.log(`marlbro-backend listening on http://localhost:${info.port}`);
  });
}

export default app;
