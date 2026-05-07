import { Hono } from 'hono';
import fs from 'fs/promises';
import path from 'path';

export const uploadsRoutes = new Hono();

const ROOT = () => process.env.LOCAL_UPLOADS_DIR ?? path.join(process.cwd(), '..', '..', 'uploads');

uploadsRoutes.get('/*', async (c) => {
  const reqPath = c.req.path.replace(/^\/uploads\//, '');
  const safe = decodeURIComponent(reqPath).replace(/\.\./g, '');
  const filePath = path.join(ROOT(), safe);
  try {
    const buf = await fs.readFile(filePath);
    const ext = path.extname(filePath).slice(1).toLowerCase();
    const ct =
      ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
      ext === 'png' ? 'image/png' : 'application/octet-stream';
    return new Response(buf, { headers: { 'Content-Type': ct } });
  } catch {
    return c.text('Not found', 404);
  }
});
