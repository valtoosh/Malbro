// @vitest-environment node
// lib/auth/session.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { encodeSession, decodeSession } from './session';

beforeAll(() => {
  process.env.MAGIC_LINK_SECRET = 'b'.repeat(64);
});

describe('session', () => {
  it('round-trips an admin session', async () => {
    const token = await encodeSession({ adminId: 'abc-123', email: 'x@y.z', role: 'approver' });
    const decoded = await decodeSession(token);
    expect(decoded.adminId).toBe('abc-123');
    expect(decoded.email).toBe('x@y.z');
    expect(decoded.role).toBe('approver');
  });
  it('rejects expired session', async () => {
    const token = await encodeSession(
      { adminId: 'abc-123', email: 'x@y.z', role: 'reviewer' },
      { expiresIn: '-1s' },
    );
    await expect(decodeSession(token)).rejects.toThrow();
  });
  it('rejects a tampered session', async () => {
    const token = await encodeSession({ adminId: 'a', email: 'x@y.z', role: 'reviewer' });
    await expect(decodeSession(token.slice(0, -3) + 'xxx')).rejects.toThrow();
  });
});
