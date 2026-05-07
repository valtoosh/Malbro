import { Twitter } from 'arctic';
import { generateCodeVerifier, generateState } from 'arctic';

export interface TwitterAuthData {
  twitterId: string;
  handle: string;
  email?: string;
}

const STATE_COOKIE = 'twitter_oauth_state';
const VERIFIER_COOKIE = 'twitter_oauth_verifier';

export function isStubMode(): boolean {
  return !process.env.TWITTER_CLIENT_ID || !process.env.TWITTER_CLIENT_SECRET;
}

export function getTwitterClient(): Twitter {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;
  const redirectUri = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000') + '/api/twitter/callback';
  if (!clientId || !clientSecret) throw new Error('TWITTER_CLIENT_ID/SECRET required');
  return new Twitter(clientId, clientSecret, redirectUri);
}

export { generateState, generateCodeVerifier, STATE_COOKIE, VERIFIER_COOKIE };

export function stubAuthData(): TwitterAuthData {
  return {
    twitterId: 'dev_000_000_001',
    handle: 'dev_marlbro_applicant',
    email: undefined,
  };
}
