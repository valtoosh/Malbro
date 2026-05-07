import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('env loader', () => {
  const original = { ...process.env };

  beforeEach(() => {
    delete process.env.DATABASE_URL;
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM;
    process.env.MAGIC_LINK_SECRET = 'a'.repeat(64);
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    process.env = { ...original };
  });

  it('throws when MAGIC_LINK_SECRET is missing', async () => {
    delete process.env.MAGIC_LINK_SECRET;
    const { loadEnv } = await import('./env');
    expect(() => loadEnv()).toThrow(/MAGIC_LINK_SECRET/);
  });

  it('throws when MAGIC_LINK_SECRET is too short', async () => {
    process.env.MAGIC_LINK_SECRET = 'short';
    const { loadEnv } = await import('./env');
    expect(() => loadEnv()).toThrow();
  });

  it('returns env object when valid', async () => {
    const { loadEnv } = await import('./env');
    const env = loadEnv();
    expect(env.MAGIC_LINK_SECRET).toBe('a'.repeat(64));
    expect(env.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000');
    expect(env.DATABASE_URL).toBeUndefined();
    expect(env.RESEND_API_KEY).toBeUndefined();
  });

  it('flags isEmailConfigured false when RESEND_API_KEY missing', async () => {
    const { loadEnv } = await import('./env');
    expect(loadEnv().isEmailConfigured).toBe(false);
  });

  it('flags isEmailConfigured true when RESEND_API_KEY present', async () => {
    process.env.RESEND_API_KEY = 're_test_xxx';
    const { loadEnv } = await import('./env');
    expect(loadEnv().isEmailConfigured).toBe(true);
  });
});
