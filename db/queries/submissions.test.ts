// db/queries/submissions.test.ts
// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestClient } from '../client';
import { admins, twitterAccounts } from '../schema';
import {
  createSubmission, getSubmissionByPublicUid, listPendingSubmissions, parseTweetUrl,
} from './submissions';

describe('submissions queries', () => {
  let db: Awaited<ReturnType<typeof createTestClient>>;
  beforeEach(async () => {
    db = await createTestClient();
    await db.insert(twitterAccounts).values({
      twitterId: 'ttid_1',
      handle: 'tester',
    });
  });

  it('parseTweetUrl extracts tweetId from a x.com URL', () => {
    const p = parseTweetUrl('https://x.com/foo/status/1234567890');
    expect(p.tweetId).toBe('1234567890');
    expect(p.authorHandle).toBe('foo');
  });

  it('parseTweetUrl handles twitter.com URLs', () => {
    const p = parseTweetUrl('https://twitter.com/bar/status/9876543210');
    expect(p.tweetId).toBe('9876543210');
  });

  it('parseTweetUrl throws on invalid URL', () => {
    expect(() => parseTweetUrl('not a url')).toThrow();
    expect(() => parseTweetUrl('https://x.com/foo')).toThrow();
  });

  it('createSubmission inserts and returns', async () => {
    const sub = await createSubmission(db, {
      publicUid: 'uid-1',
      lane: 'open',
      applicantTwitterHandle: 'tester',
      applicantTwitterId: 'ttid_1',
      applicantWalletAddress: '5n3X9pK4rT2QmL8vWYxZdNbF7HjAuC1k7p4q',
      tweetUrl: 'https://x.com/tester/status/123',
      tweetId: '123',
      receiptImageR2Key: 'receipts/2026/05/abc.jpg',
      receiptHash: 'a'.repeat(64),
      status: 'verifying',
    });
    expect(sub.publicUid).toBe('uid-1');
  });

  it('getSubmissionByPublicUid fetches the row', async () => {
    await createSubmission(db, {
      publicUid: 'uid-2',
      lane: 'open',
      applicantTwitterHandle: 'tester',
      applicantTwitterId: 'ttid_1',
      applicantWalletAddress: '5n3X9pK4rT2QmL8vWYxZdNbF7HjAuC1k7p4q',
      tweetUrl: 'https://x.com/tester/status/124',
      tweetId: '124',
      receiptImageR2Key: 'receipts/2026/05/def.jpg',
      receiptHash: 'b'.repeat(64),
      status: 'review_ready',
    });
    const found = await getSubmissionByPublicUid(db, 'uid-2');
    expect(found?.tweetId).toBe('124');
  });

  it('listPendingSubmissions returns review_ready submissions', async () => {
    await createSubmission(db, {
      publicUid: 'uid-3',
      lane: 'open',
      applicantTwitterHandle: 'tester',
      applicantTwitterId: 'ttid_1',
      applicantWalletAddress: '5n3X9pK4rT2QmL8vWYxZdNbF7HjAuC1k7p4q',
      tweetUrl: 'https://x.com/tester/status/125',
      tweetId: '125',
      receiptImageR2Key: 'receipts/2026/05/ghi.jpg',
      receiptHash: 'c'.repeat(64),
      status: 'review_ready',
    });
    const pending = await listPendingSubmissions(db);
    expect(pending.length).toBe(1);
    expect(pending[0]?.publicUid).toBe('uid-3');
  });
});
