// lib/auth/magicLink.ts
import { SignJWT, jwtVerify } from 'jose';

const ISSUER = 'marlbro-foundation';
const AUDIENCE = 'marlbro-admin-magiclink';

function getSecret(): Uint8Array {
  const s = process.env.MAGIC_LINK_SECRET;
  if (!s) throw new Error('MAGIC_LINK_SECRET is required');
  return new TextEncoder().encode(s);
}

export interface GenerateOptions {
  expiresIn?: string;
}

export async function generateMagicLinkToken(email: string, opts: GenerateOptions = {}): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(opts.expiresIn ?? '15m')
    .sign(getSecret());
}

export async function verifyMagicLinkToken(token: string): Promise<{ email: string }> {
  const { payload } = await jwtVerify(token, getSecret(), {
    issuer: ISSUER,
    audience: AUDIENCE,
  });
  if (typeof payload.email !== 'string') {
    throw new Error('Token missing email claim');
  }
  return { email: payload.email };
}
