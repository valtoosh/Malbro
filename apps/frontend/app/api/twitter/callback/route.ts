// apps/frontend/app/api/twitter/callback/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const jar = await cookies();
  const next = jar.get('twitter_oauth_next')?.value ?? '/apply';

  const isStub = url.searchParams.get('stub') === '1';
  let exchangeBody: { stub?: boolean; code?: string; codeVerifier?: string } = {};

  if (isStub) {
    exchangeBody = { stub: true };
  } else {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const cookieState = jar.get('twitter_oauth_state')?.value;
    const verifier = jar.get('twitter_oauth_verifier')?.value;
    if (!code || !state || !cookieState || !verifier || state !== cookieState) {
      return NextResponse.redirect(new URL('/apply?error=oauth_state', url.origin));
    }
    exchangeBody = { code, codeVerifier: verifier };
  }

  const res = await fetch(`${BACKEND_URL}/twitter/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(exchangeBody),
  });
  const body = (await res.json()) as {
    ok?: boolean;
    applicant?: { twitterId: string; handle: string };
  };

  if (!body.ok || !body.applicant) {
    return NextResponse.redirect(new URL('/apply?error=oauth_user', url.origin));
  }

  jar.set('marlbro_applicant', JSON.stringify(body.applicant), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  });

  return NextResponse.redirect(new URL(next, url.origin));
}
