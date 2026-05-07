// PLACEHOLDER: real Twitter API verification lives in Plan 6. For now, this
// returns a stub success object that lets the worker pipeline run end-to-end
// against fixture submissions.

export interface VerificationResult {
  ok: boolean;
  reason?: string;
  payload?: unknown;
}

export async function verifyTweet(_tweetId: string, _expectedAuthorId: string): Promise<VerificationResult> {
  if (process.env.TWITTER_BEARER_TOKEN) {
    // TODO: real implementation in Plan 6. Hits Twitter API v2 GET /2/tweets/:id
    // with media expansions, validates author, photo, mention, age.
    throw new Error('Real Twitter verification not yet implemented — Plan 6.');
  }
  // Dev stub
  return {
    ok: true,
    payload: { stub: true, note: 'Twitter API not configured; stub verification.' },
  };
}
