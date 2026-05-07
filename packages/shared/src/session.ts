// packages/shared/src/session.ts
import { SignJWT, jwtVerify } from 'jose';

const ISSUER = 'marlbro-foundation';
const AUDIENCE = 'marlbro-admin-session';
export const SESSION_COOKIE = 'marlbro_session';

export type AdminRole = 'reviewer' | 'approver' | 'superadmin';

export interface SessionPayload {
  adminId: string;
  email: string;
  role: AdminRole;
}

interface EncodeOptions {
  expiresIn?: string;
}

function getSecret(): Uint8Array {
  const s = process.env.MAGIC_LINK_SECRET;
  if (!s) throw new Error('MAGIC_LINK_SECRET is required');
  return new TextEncoder().encode(s);
}

export async function encodeSession(payload: SessionPayload, opts: EncodeOptions = {}): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(opts.expiresIn ?? '12h')
    .sign(getSecret());
}

export async function decodeSession(token: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(token, getSecret(), { issuer: ISSUER, audience: AUDIENCE });
  if (
    typeof payload.adminId !== 'string' ||
    typeof payload.email !== 'string' ||
    typeof payload.role !== 'string' ||
    !['reviewer', 'approver', 'superadmin'].includes(payload.role)
  ) {
    throw new Error('Invalid session payload');
  }
  return {
    adminId: payload.adminId,
    email: payload.email,
    role: payload.role as AdminRole,
  };
}
