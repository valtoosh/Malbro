import { Hono } from 'hono';
import { getDb } from '@marlbro/db/client';
import { twitterAccounts } from '@marlbro/db/schema';
import {
  isStubMode,
  stubAuthData,
  getTwitterClient,
  generateState,
  generateCodeVerifier,
} from '../twitter/oauth';

export const twitterRoutes = new Hono();

twitterRoutes.get('/login-url', async (c) => {
  if (isStubMode()) {
    return c.json({ ok: true, stub: true });
  }
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const client = getTwitterClient();
  const authUrl = client.createAuthorizationURL(
    state,
    codeVerifier,
    ['tweet.read', 'users.read', 'offline.access'],
  );
  return c.json({ ok: true, stub: false, authUrl: authUrl.toString(), state, codeVerifier });
});

twitterRoutes.post('/exchange', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  let twitterId: string;
  let handle: string;

  if (isStubMode() || body.stub === true) {
    const stub = stubAuthData();
    twitterId = stub.twitterId;
    handle = stub.handle;
  } else {
    const { code, codeVerifier } = body as { code?: string; codeVerifier?: string };
    if (!code || !codeVerifier) return c.json({ ok: false, errorCode: 'BAD_OAUTH' }, 400);
    const client = getTwitterClient();
    const tokens = await client.validateAuthorizationCode(code, codeVerifier);
    const userRes = await fetch('https://api.twitter.com/2/users/me', {
      headers: { Authorization: `Bearer ${tokens.accessToken()}` },
    });
    const userJson = (await userRes.json()) as { data?: { id: string; username: string } };
    if (!userJson.data) return c.json({ ok: false, errorCode: 'OAUTH_USER_FAILED' }, 401);
    twitterId = userJson.data.id;
    handle = userJson.data.username;
  }

  const db = await getDb();
  await db
    .insert(twitterAccounts)
    .values({ twitterId, handle, lastUsedAt: new Date() })
    .onConflictDoUpdate({
      target: twitterAccounts.twitterId,
      set: { handle, lastUsedAt: new Date() },
    });

  return c.json({ ok: true, applicant: { twitterId, handle } });
});
