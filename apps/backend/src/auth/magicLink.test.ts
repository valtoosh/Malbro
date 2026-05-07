// @vitest-environment node
// lib/auth/magicLink.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { generateMagicLinkToken, verifyMagicLinkToken } from './magicLink';

const SECRET = 'a'.repeat(64);

beforeAll(() => {
  process.env.MAGIC_LINK_SECRET = SECRET;
});

describe('magicLink', () => {
  it('round-trips an email', async () => {
    const token = await generateMagicLinkToken('admin@marlbro.com');
    const verified = await verifyMagicLinkToken(token);
    expect(verified.email).toBe('admin@marlbro.com');
  });
  it('rejects a tampered token', async () => {
    const token = await generateMagicLinkToken('admin@marlbro.com');
    const tampered = token.slice(0, -3) + 'xxx';
    await expect(verifyMagicLinkToken(tampered)).rejects.toThrow();
  });
  it('rejects an expired token', async () => {
    const token = await generateMagicLinkToken('admin@marlbro.com', { expiresIn: '-1s' });
    await expect(verifyMagicLinkToken(token)).rejects.toThrow();
  });
});
