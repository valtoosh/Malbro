// lib/ip.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { hashIp } from './ip';

describe('hashIp', () => {
  beforeEach(() => {
    process.env.MAGIC_LINK_SECRET = 'a'.repeat(64);
  });

  it('returns a stable hash for the same input', () => {
    const a = hashIp('1.2.3.4');
    const b = hashIp('1.2.3.4');
    expect(a).toBe(b);
  });

  it('returns different hashes for different inputs', () => {
    expect(hashIp('1.2.3.4')).not.toBe(hashIp('1.2.3.5'));
  });

  it('returns a hex string of length 64 (sha256)', () => {
    expect(hashIp('1.2.3.4')).toMatch(/^[0-9a-f]{64}$/);
  });
});
