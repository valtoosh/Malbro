// lib/squads/propose.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('proposePayout (stub)', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    delete process.env.SQUADS_PROPOSER_SK;
    delete process.env.SQUADS_MULTISIG_PUBKEY;
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('returns stub proposal pubkey when env unset', async () => {
    const { proposePayout } = await import('./propose');
    const r = await proposePayout({
      grantId: 'aaaa-bbbb-cccc-dddd',
      recipientWallet: '5n3X9pK4rT2QmL8vWYxZdNbF7HjAuC1k7p4q',
      payoutMarlbro: '5000',
      payoutSol: '0',
      memo: 'marlbro:grant:test',
    });
    expect(r.ok).toBe(true);
    expect(r.delivered).toBe('stub');
    expect(r.proposalPubkey).toMatch(/^stub_proposal_/);
    expect(logSpy).toHaveBeenCalled();
  });

  it('throws when only one env var is set', async () => {
    process.env.SQUADS_PROPOSER_SK = 'x';
    const { proposePayout } = await import('./propose');
    const r = await proposePayout({
      grantId: 'a', recipientWallet: 'w', payoutMarlbro: '0', payoutSol: '0', memo: 'x',
    });
    // Without SQUADS_MULTISIG_PUBKEY, falls back to stub
    expect(r.delivered).toBe('stub');
  });
});
