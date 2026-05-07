// tests/integration/auth.test.ts
// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import { createTestClient } from '@/db/client';
import { admins } from '@/db/schema';
import { generateMagicLinkToken, verifyMagicLinkToken } from '@/lib/auth/magicLink';
import { encodeSession, decodeSession } from '@/lib/auth/session';

beforeAll(() => {
  process.env.MAGIC_LINK_SECRET = 'd'.repeat(64);
});

describe('admin auth — end-to-end', () => {
  it('issues magic link → verifies → looks up admin → encodes session', async () => {
    const db = await createTestClient();
    const [admin] = await db
      .insert(admins)
      .values({ email: 'flow@marlbro.com', displayName: 'Flow', role: 'approver' })
      .returning();
    expect(admin).toBeDefined();

    const token = await generateMagicLinkToken('flow@marlbro.com');
    const verified = await verifyMagicLinkToken(token);
    expect(verified.email).toBe('flow@marlbro.com');

    const session = await encodeSession({
      adminId: admin!.id,
      email: admin!.email,
      role: admin!.role,
    });
    const decoded = await decodeSession(session);
    expect(decoded.adminId).toBe(admin!.id);
    expect(decoded.role).toBe('approver');
  });
});
