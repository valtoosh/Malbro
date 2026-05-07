// db/queries/approvedGrants.test.ts
// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestClient } from '../client';
import { twitterAccounts } from '../schema';
import {
  createApprovedGrant,
  getApprovedGrantById,
  listExecutedGrants,
  setProposalPubkey,
  markExecuted,
} from './approvedGrants';
import { createSubmission } from './submissions';

describe('approvedGrants queries', () => {
  let db: Awaited<ReturnType<typeof createTestClient>>;
  let submissionId: string;

  beforeEach(async () => {
    db = await createTestClient();
    await db.insert(twitterAccounts).values({
      twitterId: 'ttid_1',
      handle: 'tester',
    });
    const sub = await createSubmission(db, {
      publicUid: 'uid-grant-1',
      lane: 'open',
      applicantTwitterHandle: 'tester',
      applicantTwitterId: 'ttid_1',
      applicantWalletAddress: '5n3X9pK4rT2QmL8vWYxZdNbF7HjAuC1k7p4q',
      tweetUrl: 'https://x.com/tester/status/9999',
      tweetId: '9999',
      receiptImageR2Key: 'receipts/2026/05/test.jpg',
      receiptHash: 'a'.repeat(64),
      status: 'review_ready',
    });
    submissionId = sub.id;
  });

  it('createApprovedGrant inserts and returns', async () => {
    const grant = await createApprovedGrant(db, {
      submissionId,
      payoutMarlbro: '5000',
      payoutSol: '0',
      payoutStatus: 'queued',
    });
    expect(grant.submissionId).toBe(submissionId);
    expect(Number(grant.payoutMarlbro)).toBe(5000);
    expect(grant.payoutStatus).toBe('queued');
    expect(grant.displayNumber).toBeGreaterThan(0);
  });

  it('getApprovedGrantById fetches the row', async () => {
    const grant = await createApprovedGrant(db, {
      submissionId,
      payoutMarlbro: '5000',
      payoutSol: '0',
      payoutStatus: 'queued',
    });
    const found = await getApprovedGrantById(db, grant.id);
    expect(found?.id).toBe(grant.id);
    expect(found?.submissionId).toBe(submissionId);
  });

  it('listExecutedGrants filters by executed status', async () => {
    const grant = await createApprovedGrant(db, {
      submissionId,
      payoutMarlbro: '5000',
      payoutSol: '0',
      payoutStatus: 'queued',
    });
    // Should not appear yet
    let executed = await listExecutedGrants(db);
    expect(executed.length).toBe(0);

    // Mark executed
    await markExecuted(db, grant.id, 'txSig123');
    executed = await listExecutedGrants(db);
    expect(executed.length).toBe(1);
    expect(executed[0]?.payoutTxSignature).toBe('txSig123');
  });

  it('setProposalPubkey updates to proposed status', async () => {
    const grant = await createApprovedGrant(db, {
      submissionId,
      payoutMarlbro: '5000',
      payoutSol: '0',
      payoutStatus: 'queued',
    });
    await setProposalPubkey(db, grant.id, 'stub_proposal_abc123');
    const updated = await getApprovedGrantById(db, grant.id);
    expect(updated?.payoutStatus).toBe('proposed');
    expect(updated?.squadsProposalPubkey).toBe('stub_proposal_abc123');
  });

  it('markExecuted sets status to executed and returns the row', async () => {
    const grant = await createApprovedGrant(db, {
      submissionId,
      payoutMarlbro: '5000',
      payoutSol: '0',
      payoutStatus: 'queued',
    });
    const updated = await markExecuted(db, grant.id, 'real_tx_sig_12345');
    expect(updated?.payoutStatus).toBe('executed');
    expect(updated?.payoutTxSignature).toBe('real_tx_sig_12345');
    expect(updated?.paidAt).toBeTruthy();
  });
});
