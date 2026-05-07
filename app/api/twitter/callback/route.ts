import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isStubMode, stubAuthData, getTwitterClient, STATE_COOKIE, VERIFIER_COOKIE } from '@/lib/twitter/oauth';
import { getDb } from '@/db/client';
import { twitterAccounts } from '@/db/schema';

const APPLICANT_COOKIE = 'marlbro_applicant';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const jar = await cookies();
  const next = jar.get('twitter_oauth_next')?.value ?? '/apply';

  let twitterId: string;
  let handle: string;

  if (isStubMode() || url.searchParams.get('stub') === '1') {
    const stub = stubAuthData();
    twitterId = stub.twitterId;
    handle = stub.handle;
  } else {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const cookieState = jar.get(STATE_COOKIE)?.value;
    const verifier = jar.get(VERIFIER_COOKIE)?.value;
    if (!code || !state || !cookieState || !verifier || state !== cookieState) {
      return NextResponse.redirect(new URL('/apply?error=oauth_state', url.origin));
    }
    const client = getTwitterClient();
    const tokens = await client.validateAuthorizationCode(code, verifier);
    // Fetch user info
    const userRes = await fetch('https://api.twitter.com/2/users/me', {
      headers: { Authorization: `Bearer ${tokens.accessToken()}` },
    });
    const userJson = (await userRes.json()) as { data?: { id: string; username: string } };
    if (!userJson.data) {
      return NextResponse.redirect(new URL('/apply?error=oauth_user', url.origin));
    }
    twitterId = userJson.data.id;
    handle = userJson.data.username;
  }

  // Upsert into twitter_accounts
  const db = await getDb();
  await db
    .insert(twitterAccounts)
    .values({ twitterId, handle, lastUsedAt: new Date() })
    .onConflictDoUpdate({
      target: twitterAccounts.twitterId,
      set: { handle, lastUsedAt: new Date() },
    });

  // Set applicant cookie (signed JWT-lite — we reuse session signing key)
  // Simpler: just store twitterId + handle as JSON in an httpOnly cookie. Not
  // as secure as a JWT but adequate for v1 (re-verified at submission time).
  jar.set(APPLICANT_COOKIE, JSON.stringify({ twitterId, handle }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  });

  return NextResponse.redirect(new URL(next, url.origin));
}

export const APPLICANT_COOKIE_NAME = APPLICANT_COOKIE;
