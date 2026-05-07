import { describe, it, expect, beforeEach } from 'vitest';
import { verifyTweet } from './verify';

describe('verifyTweet', () => {
  beforeEach(() => {
    delete process.env.TWITTER_BEARER_TOKEN;
  });

  it('returns stub success when no bearer token', async () => {
    const r = await verifyTweet('123', 'author1');
    expect(r.ok).toBe(true);
    expect((r.payload as { stub: boolean }).stub).toBe(true);
  });
});
