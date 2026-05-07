import { describe, it, expect } from 'vitest';
import { sha256 } from './hash';

describe('sha256', () => {
  it('returns 64-char hex', () => {
    expect(sha256(Buffer.from('hello'))).toMatch(/^[0-9a-f]{64}$/);
  });
  it('is deterministic', () => {
    expect(sha256(Buffer.from('x'))).toBe(sha256(Buffer.from('x')));
  });
});
