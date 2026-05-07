// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { isStubMode, stubAuthData } from './oauth';

describe('twitter oauth', () => {
  beforeEach(() => {
    delete process.env.TWITTER_CLIENT_ID;
    delete process.env.TWITTER_CLIENT_SECRET;
  });

  it('isStubMode true when keys missing', () => {
    expect(isStubMode()).toBe(true);
  });

  it('isStubMode false when both keys present', () => {
    process.env.TWITTER_CLIENT_ID = 'x';
    process.env.TWITTER_CLIENT_SECRET = 'y';
    expect(isStubMode()).toBe(false);
  });

  it('stubAuthData returns dev applicant', () => {
    const d = stubAuthData();
    expect(d.handle).toBe('dev_marlbro_applicant');
    expect(d.twitterId).toBe('dev_000_000_001');
  });
});
