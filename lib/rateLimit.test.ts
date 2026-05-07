// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestClient } from '@/db/client';
import { checkRateLimits, recordIntake } from './rateLimit';

describe('rateLimit', () => {
  let db: Awaited<ReturnType<typeof createTestClient>>;
  beforeEach(async () => {
    db = await createTestClient();
  });

  it('passes when no events recorded', async () => {
    const r = await checkRateLimits(db, { wallet: 'w', twitterId: 't', ipHash: 'h' });
    expect(r.ok).toBe(true);
  });

  it('trips wallet cooldown after one intake', async () => {
    await recordIntake(db, { wallet: 'w', twitterId: 't1', ipHash: 'h1' });
    const r = await checkRateLimits(db, { wallet: 'w', twitterId: 't2', ipHash: 'h2' });
    expect(r.ok).toBe(false);
    expect(r.errorCode).toBe('WALLET_COOLDOWN');
  });

  it('trips ip cooldown after 5 intakes', async () => {
    for (let i = 0; i < 5; i++) {
      await recordIntake(db, { wallet: `w${i}`, twitterId: `t${i}`, ipHash: 'sameip' });
    }
    const r = await checkRateLimits(db, { wallet: 'wnew', twitterId: 'tnew', ipHash: 'sameip' });
    expect(r.ok).toBe(false);
    expect(r.errorCode).toBe('IP_RATE_LIMITED');
  });
});
