import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isStubMode, getTwitterClient, generateState, generateCodeVerifier, STATE_COOKIE, VERIFIER_COOKIE } from '@/lib/twitter/oauth';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = url.searchParams.get('next') ?? '/apply';

  if (isStubMode()) {
    // Bypass straight to callback with a stub flag
    const callback = new URL('/api/twitter/callback', url.origin);
    callback.searchParams.set('stub', '1');
    callback.searchParams.set('next', next);
    return NextResponse.redirect(callback);
  }

  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const client = getTwitterClient();
  const authUrl = client.createAuthorizationURL(state, codeVerifier, ['tweet.read', 'users.read', 'offline.access']);

  const jar = await cookies();
  jar.set(STATE_COOKIE, state, { httpOnly: true, secure: false, sameSite: 'lax', path: '/', maxAge: 600 });
  jar.set(VERIFIER_COOKIE, codeVerifier, { httpOnly: true, secure: false, sameSite: 'lax', path: '/', maxAge: 600 });
  jar.set('twitter_oauth_next', next, { httpOnly: true, secure: false, sameSite: 'lax', path: '/', maxAge: 600 });

  return NextResponse.redirect(authUrl);
}
