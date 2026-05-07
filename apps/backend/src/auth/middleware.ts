import type { Context, Next } from 'hono';
import { createMiddleware } from 'hono/factory';
import { decodeSession, type AdminRole, type SessionPayload } from './session';
import { hasRequiredRole } from './requireAdmin';

declare module 'hono' {
  interface ContextVariableMap {
    admin: SessionPayload;
  }
}

export const requireAdminMiddleware = (minRole: AdminRole = 'reviewer') =>
  createMiddleware(async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'NO_AUTH', message: 'Authorization Bearer token required' }, 401);
    }
    const token = authHeader.slice(7);
    let session: SessionPayload;
    try {
      session = await decodeSession(token);
    } catch {
      return c.json({ error: 'INVALID_SESSION' }, 401);
    }
    if (!hasRequiredRole(session.role, minRole)) {
      return c.json({ error: 'FORBIDDEN', required: minRole, have: session.role }, 403);
    }
    c.set('admin', session);
    await next();
  });
