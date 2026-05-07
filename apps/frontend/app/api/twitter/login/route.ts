// apps/frontend/app/api/twitter/login/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = url.searchParams.get('next') ?? '/apply';

  const res = await fetch(`${BACKEND_URL}/twitter/login-url`);
  const body = (await res.json()) as {
    stub?: boolean;
    authUrl?: string;
    state?: string;
    codeVerifier?: string;
  };

  if (body.stub) {
    const callback = new URL('/api/twitter/callback', url.origin);
    callback.searchParams.set('stub', '1');
    callback.searchParams.set('next', next);
    return NextResponse.redirect(callback);
  }

  if (!body.authUrl || !body.state || !body.codeVerifier) {
    return NextResponse.redirect(new URL('/apply?error=oauth_init', url.origin));
  }

  const jar = await cookies();
  jar.set('twitter_oauth_state', body.state, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  jar.set('twitter_oauth_verifier', body.codeVerifier, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  jar.set('twitter_oauth_next', next, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });

  return NextResponse.redirect(body.authUrl);
}
