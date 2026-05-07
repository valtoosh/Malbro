// @vitest-environment node
// lib/auth/sendMagicLink.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('sendMagicLink', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    process.env.MAGIC_LINK_SECRET = 'c'.repeat(64);
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    delete process.env.RESEND_API_KEY;
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('logs the magic link to console when RESEND_API_KEY is unset', async () => {
    const { sendMagicLink } = await import('./sendMagicLink');
    const result = await sendMagicLink('admin@marlbro.com');
    expect(result.delivered).toBe('console');
    expect(result.url).toMatch(/^http:\/\/localhost:3000\/admin\/verify\?token=/);
    expect(logSpy).toHaveBeenCalled();
  });

  it('returns the URL even when delivered via console', async () => {
    const { sendMagicLink } = await import('./sendMagicLink');
    const result = await sendMagicLink('admin@marlbro.com');
    expect(result.url).toBeDefined();
    expect(result.url.length).toBeGreaterThan(50);
  });
});
