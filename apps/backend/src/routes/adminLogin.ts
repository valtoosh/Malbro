import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@marlbro/db/client';
import { admins } from '@marlbro/db/schema';
import { sendMagicLink } from '../auth/sendMagicLink';
import { verifyMagicLinkToken } from '../auth/magicLink';
import { encodeSession } from '../auth/session';

export const adminLoginRoutes = new Hono();

const requestSchema = z.object({ email: z.string().email() });

adminLoginRoutes.post('/request', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ ok: false, message: parsed.error.issues[0]?.message ?? 'Invalid email' }, 400);
  }
  await sendMagicLink(parsed.data.email);
  return c.json({
    ok: true,
    message: 'If the address is on file, a single-use access instrument has been dispatched.',
  });
});

const verifySchema = z.object({ token: z.string().min(10) });

adminLoginRoutes.post('/verify', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) return c.json({ ok: false, errorCode: 'NO_TOKEN' }, 400);

  let email: string;
  try {
    const verified = await verifyMagicLinkToken(parsed.data.token);
    email = verified.email.toLowerCase();
  } catch {
    return c.json({ ok: false, errorCode: 'INVALID_OR_EXPIRED' }, 401);
  }

  const db = await getDb();
  const [admin] = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
  if (!admin || !admin.active) {
    return c.json({ ok: false, errorCode: 'NO_ADMIN' }, 401);
  }
  const session = await encodeSession({
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
  });
  return c.json({ ok: true, session, admin: { id: admin.id, email: admin.email, role: admin.role } });
});
