# Marlbro · Plan 5 — Submission Flow

> Required sub-skill: superpowers:subagent-driven-development.

**Goal:** Make /apply a working application form. Users sign in with Twitter (or a dev-stub if Twitter keys are missing), provide wallet + tweet URL + receipt photo + notes, the system rate-limits + dedupes + persists, and we get back a queue of pending submissions ready for the admin review (Plan 6).

**Architecture:** New schema for submissions / receipts_seen / rate_limit_events / twitter_accounts / bounty_claims_lock. Twitter OAuth via `arctic` (or stub when env unset). R2 storage abstracted as a `Storage` interface — local-filesystem in dev, S3-compatible R2 in prod. Receipt hashing via sha256 of bytes. Server action does the full intake pipeline atomically.

**Spec ref:** §7.1 (data model), §8 stage 1 (intake), §9 (anti-fraud).

---

## File Structure

```
db/
  schema.ts                     [modified] add submissions, receipts_seen, rate_limit_events,
                                twitter_accounts, bounty_claims_lock
  queries/
    submissions.ts              create + list + getByUid
    submissions.test.ts
  migrations/                   regenerated

lib/
  storage/
    types.ts                    Storage interface
    local.ts                    Local filesystem implementation
    r2.ts                       R2 (S3) implementation — placeholder, used when env keys present
    factory.ts                  Returns local or R2 based on env
    factory.test.ts
  twitter/
    oauth.ts                    Arctic OAuth flow (stub if no keys)
    oauth.test.ts
    verify.ts                   STUB — returns success in dev (Plan 6 implements real verification)
    verify.test.ts
  rateLimit.ts                  Pre-intake gate — checks cooldowns
  rateLimit.test.ts
  hash.ts                       sha256 utility
  hash.test.ts

app/
  apply/
    page.tsx                    Replaces placeholder — full form
    actions.ts                  submitApplication server action
    confirmation/[uid]/page.tsx Public submission tracking page
  api/
    twitter/
      callback/route.ts         OAuth callback handler
      login/route.ts            Initiates OAuth flow
```

---

## Task 1: Schema additions for submissions

**Files:** Modify `db/schema.ts`. Regenerate migration.

Add these tables (use the EXACT shape from the spec §7.1):

```typescript
// Append to db/schema.ts

export const lane = pgEnum('lane', ['bounty', 'open']);
export const submissionStatus = pgEnum('submission_status', [
  'pending',
  'verifying',
  'review_ready',
  'approved',
  'rejected',
  'expired',
  'flagged',
]);

export const twitterAccounts = pgTable('twitter_accounts', {
  twitterId: text('twitter_id').primaryKey(),
  handle: text('handle').notNull(),
  email: text('email'),
  accessTokenEnc: text('access_token_enc'),
  refreshTokenEnc: text('refresh_token_enc'),
  firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }).notNull().defaultNow(),
});

export const submissions = pgTable('submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  publicUid: text('public_uid').notNull().unique(),
  lane: lane('lane').notNull(),
  bountyId: uuid('bounty_id').references(() => bounties.id),
  applicantTwitterHandle: text('applicant_twitter_handle').notNull(),
  applicantTwitterId: text('applicant_twitter_id').notNull(),
  applicantWalletAddress: text('applicant_wallet_address').notNull(),
  tweetUrl: text('tweet_url').notNull(),
  tweetId: text('tweet_id').notNull(),
  tweetVerifiedAt: timestamp('tweet_verified_at', { withTimezone: true }),
  tweetVerificationPayload: jsonb('tweet_verification_payload'),
  receiptImageR2Key: text('receipt_image_r2_key').notNull(),
  receiptHash: text('receipt_hash').notNull(),
  ipHash: text('ip_hash'),
  notes: text('notes'),
  status: submissionStatus('status').notNull().default('pending'),
  rejectionReason: text('rejection_reason'),
  reviewedBy: uuid('reviewed_by').references(() => admins.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const receiptsSeen = pgTable('receipts_seen', {
  receiptHash: text('receipt_hash').primaryKey(),
  firstSubmissionId: uuid('first_submission_id').references(() => submissions.id),
  firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull().defaultNow(),
});

export const rateLimitEventKind = pgEnum('rate_limit_kind', ['submission', 'approval']);

export const rateLimitEvents = pgTable('rate_limit_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull(),
  kind: rateLimitEventKind('kind').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const bountyClaimsLock = pgTable('bounty_claims_lock', {
  id: uuid('id').primaryKey().defaultRandom(),
  bountyId: uuid('bounty_id').notNull().references(() => bounties.id),
  submissionId: uuid('submission_id').notNull().references(() => submissions.id).unique(),
  lockedUntil: timestamp('locked_until', { withTimezone: true }).notNull(),
});

export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
export type TwitterAccount = typeof twitterAccounts.$inferSelect;
export type NewTwitterAccount = typeof twitterAccounts.$inferInsert;
```

Steps:
- [ ] Add columns to `db/schema.ts` per above.
- [ ] Run `npm run db:generate` — produces a new migration `0001_*.sql`.
- [ ] Run `npm test` — schema tests still pass; client tests still pass.
- [ ] Commit:
```
git add db/schema.ts db/migrations
git commit -m "feat(db): schema for submissions, receipts_seen, rate_limit, twitter_accounts, bounty_claims_lock"
```

---

## Task 2: hash + storage primitives

**Files:** `lib/hash.ts`, `lib/hash.test.ts`, `lib/storage/types.ts`, `lib/storage/local.ts`, `lib/storage/r2.ts`, `lib/storage/factory.ts`, `lib/storage/factory.test.ts`.

### hash:

```typescript
// lib/hash.ts
import { createHash } from 'crypto';
export function sha256(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex');
}
```

```typescript
// lib/hash.test.ts
import { describe, it, expect } from 'vitest';
import { sha256 } from './hash';

describe('sha256', () => {
  it('returns 64-char hex', () => {
    expect(sha256(Buffer.from('hello'))).toMatch(/^[0-9a-f]{64}$/);
  });
  it('is deterministic', () => {
    expect(sha256(Buffer.from('x'))).toBe(sha256(Buffer.from('x')));
  });
});
```

### Storage:

```typescript
// lib/storage/types.ts
export interface PutResult {
  key: string;
}

export interface Storage {
  put(key: string, body: Buffer, contentType: string): Promise<PutResult>;
  url(key: string): string;
}
```

```typescript
// lib/storage/local.ts
import fs from 'fs/promises';
import path from 'path';
import type { Storage, PutResult } from './types';

const ROOT = process.env.LOCAL_UPLOADS_DIR ?? path.join(process.cwd(), 'uploads');

export class LocalStorage implements Storage {
  async put(key: string, body: Buffer): Promise<PutResult> {
    const filePath = path.join(ROOT, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, body);
    return { key };
  }
  url(key: string): string {
    // In dev, served via /api/uploads/[...path]
    return `/api/uploads/${encodeURI(key)}`;
  }
}
```

```typescript
// lib/storage/r2.ts
// PLACEHOLDER — implement when R2 keys are provided.
import type { Storage, PutResult } from './types';

export class R2Storage implements Storage {
  // TODO: instantiate AWS S3 client pointed at R2 endpoint when env keys present:
  //   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL.
  // For now, throw — the factory only returns this when those env vars exist,
  // so this constructor never runs in the unstubbed dev path.
  async put(_key: string, _body: Buffer): Promise<PutResult> {
    throw new Error('R2Storage not implemented — fill in R2_* env vars and wire up @aws-sdk/client-s3.');
  }
  url(key: string): string {
    return `${process.env.R2_PUBLIC_URL}/${key}`;
  }
}
```

```typescript
// lib/storage/factory.ts
import type { Storage } from './types';
import { LocalStorage } from './local';
import { R2Storage } from './r2';

export function getStorage(): Storage {
  if (process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET) {
    return new R2Storage();
  }
  return new LocalStorage();
}
```

```typescript
// lib/storage/factory.test.ts
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { getStorage } from './factory';

const TMP = path.join(os.tmpdir(), 'marlbro-test-uploads');

beforeEach(() => {
  delete process.env.R2_ACCESS_KEY_ID;
  delete process.env.R2_SECRET_ACCESS_KEY;
  delete process.env.R2_BUCKET;
  process.env.LOCAL_UPLOADS_DIR = TMP;
  fs.rmSync(TMP, { recursive: true, force: true });
});

afterAll(() => {
  fs.rmSync(TMP, { recursive: true, force: true });
});

describe('getStorage', () => {
  it('returns LocalStorage when R2 env vars are unset', async () => {
    const s = getStorage();
    const r = await s.put('test/abc.jpg', Buffer.from('hello'), 'image/jpeg');
    expect(r.key).toBe('test/abc.jpg');
    expect(fs.existsSync(path.join(TMP, 'test/abc.jpg'))).toBe(true);
    expect(s.url('test/abc.jpg')).toContain('/api/uploads/');
  });

  it('returns R2Storage when R2 env vars are set', () => {
    process.env.R2_ACCESS_KEY_ID = 'x';
    process.env.R2_SECRET_ACCESS_KEY = 'y';
    process.env.R2_BUCKET = 'z';
    const s = getStorage();
    expect(s.constructor.name).toBe('R2Storage');
  });
});
```

Commit:
```
git add lib/hash.ts lib/hash.test.ts lib/storage
git commit -m "feat(storage): add sha256 helper and Local/R2 storage abstraction"
```

---

## Task 3: Twitter OAuth (with dev stub)

**Files:** `lib/twitter/oauth.ts`, `lib/twitter/oauth.test.ts`, `lib/twitter/verify.ts`, `lib/twitter/verify.test.ts`, `app/api/twitter/login/route.ts`, `app/api/twitter/callback/route.ts`.

When `TWITTER_CLIENT_ID` is set, use real OAuth via `arctic` package. When unset, use a deterministic dev-stub: `/api/twitter/login` redirects to `/api/twitter/callback?stub=1`, which signs in as `@dev_marlbro_applicant` with twitter_id `dev_000_000_001`. This lets the form be testable end-to-end without Twitter API access.

Install arctic: `npm install arctic`.

```typescript
// lib/twitter/oauth.ts
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
```

```typescript
// lib/twitter/oauth.test.ts
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
```

```typescript
// lib/twitter/verify.ts
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
```

```typescript
// lib/twitter/verify.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { verifyTweet } from './verify';

describe('verifyTweet', () => {
  beforeEach(() => {
    delete process.env.TWITTER_BEARER_TOKEN;
  });

  it('returns stub success when no bearer token', async () => {
    const r = await verifyTweet('123', 'author1');
    expect(r.ok).toBe(true);
    expect((r.payload as { stub: boolean }).stub).toBe(true);
  });
});
```

```typescript
// app/api/twitter/login/route.ts
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
```

```typescript
// app/api/twitter/callback/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
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
```

Tests run, commit:
```
git add lib/twitter app/api/twitter
git commit -m "feat(twitter): add OAuth + verify with dev stubs"
```

---

## Task 4: Rate-limit pre-intake gate

**Files:** `lib/rateLimit.ts`, `lib/rateLimit.test.ts`.

```typescript
// lib/rateLimit.ts
import { and, eq, gt, sql } from 'drizzle-orm';
import { rateLimitEvents } from '@/db/schema';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

export interface RateCheckResult {
  ok: boolean;
  errorCode?: string;
  retryAfter?: Date;
}

const DEFAULTS = {
  walletCooldownDays: 7,
  twitterCooldownDays: 7,
  ipPerDay: 5,
};

export async function checkRateLimits(
  db: Db,
  input: { wallet: string; twitterId: string; ipHash: string },
): Promise<RateCheckResult> {
  const now = new Date();
  const walletWindow = new Date(now.getTime() - DEFAULTS.walletCooldownDays * 24 * 3600 * 1000);
  const twitterWindow = new Date(now.getTime() - DEFAULTS.twitterCooldownDays * 24 * 3600 * 1000);
  const ipWindow = new Date(now.getTime() - 24 * 3600 * 1000);

  const walletCount = await db
    .select({ n: sql<number>`count(*)` })
    .from(rateLimitEvents)
    .where(
      and(
        eq(rateLimitEvents.key, `wallet:${input.wallet}`),
        eq(rateLimitEvents.kind, 'submission'),
        gt(rateLimitEvents.createdAt, walletWindow),
      ),
    );
  if ((walletCount[0]?.n ?? 0) > 0) {
    return {
      ok: false,
      errorCode: 'WALLET_COOLDOWN',
      retryAfter: new Date(walletWindow.getTime() + DEFAULTS.walletCooldownDays * 24 * 3600 * 1000),
    };
  }

  const twitterCount = await db
    .select({ n: sql<number>`count(*)` })
    .from(rateLimitEvents)
    .where(
      and(
        eq(rateLimitEvents.key, `twitter:${input.twitterId}`),
        eq(rateLimitEvents.kind, 'submission'),
        gt(rateLimitEvents.createdAt, twitterWindow),
      ),
    );
  if ((twitterCount[0]?.n ?? 0) > 0) {
    return {
      ok: false,
      errorCode: 'TWITTER_COOLDOWN',
      retryAfter: new Date(twitterWindow.getTime() + DEFAULTS.twitterCooldownDays * 24 * 3600 * 1000),
    };
  }

  const ipCount = await db
    .select({ n: sql<number>`count(*)` })
    .from(rateLimitEvents)
    .where(
      and(
        eq(rateLimitEvents.key, `ip:${input.ipHash}`),
        eq(rateLimitEvents.kind, 'submission'),
        gt(rateLimitEvents.createdAt, ipWindow),
      ),
    );
  if ((ipCount[0]?.n ?? 0) >= DEFAULTS.ipPerDay) {
    return {
      ok: false,
      errorCode: 'IP_RATE_LIMITED',
      retryAfter: new Date(ipWindow.getTime() + 24 * 3600 * 1000),
    };
  }

  return { ok: true };
}

export async function recordIntake(
  db: Db,
  input: { wallet: string; twitterId: string; ipHash: string },
): Promise<void> {
  await db.insert(rateLimitEvents).values([
    { key: `wallet:${input.wallet}`, kind: 'submission' },
    { key: `twitter:${input.twitterId}`, kind: 'submission' },
    { key: `ip:${input.ipHash}`, kind: 'submission' },
  ]);
}
```

Test (uses createTestClient):
```typescript
// lib/rateLimit.test.ts
// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestClient } from '@/db/client';
import { checkRateLimits, recordIntake } from './rateLimit';

describe('rateLimit', () => {
  let db: Awaited<ReturnType<typeof createTestClient>>;
  beforeEach(async () => {
    db = await createTestClient();
  });

  it('passes when no events recorded', async () => {
    const r = await checkRateLimits(db, { wallet: 'w', twitterId: 't', ipHash: 'h' });
    expect(r.ok).toBe(true);
  });

  it('trips wallet cooldown after one intake', async () => {
    await recordIntake(db, { wallet: 'w', twitterId: 't1', ipHash: 'h1' });
    const r = await checkRateLimits(db, { wallet: 'w', twitterId: 't2', ipHash: 'h2' });
    expect(r.ok).toBe(false);
    expect(r.errorCode).toBe('WALLET_COOLDOWN');
  });

  it('trips ip cooldown after 5 intakes', async () => {
    for (let i = 0; i < 5; i++) {
      await recordIntake(db, { wallet: `w${i}`, twitterId: `t${i}`, ipHash: 'sameip' });
    }
    const r = await checkRateLimits(db, { wallet: 'wnew', twitterId: 'tnew', ipHash: 'sameip' });
    expect(r.ok).toBe(false);
    expect(r.errorCode).toBe('IP_RATE_LIMITED');
  });
});
```

Commit:
```
git add lib/rateLimit.ts lib/rateLimit.test.ts
git commit -m "feat(rateLimit): add pre-intake rate-limit checks"
```

---

## Task 5: Submissions queries

**Files:** `db/queries/submissions.ts`, `db/queries/submissions.test.ts`.

Implement:
- `createSubmission(db, input)` — atomic intake: inserts submission row, receipts_seen entry, rate_limit_events.
- `getSubmissionByPublicUid(db, uid)` — for the confirmation page.
- `listPendingSubmissions(db)` — for the admin queue (Plan 6 uses this).
- `parseTweetUrl(url)` — extract tweet_id from a tweet URL, throws if invalid.

Read the plan in detail; this is a substantial file but mechanical.

Commit:
```
git add db/queries/submissions.ts db/queries/submissions.test.ts
git commit -m "feat(db): add submissions queries"
```

(Implementer: produce this file modeled on `db/queries/bounties.ts`. Cover: insert + receipts_seen dedup + rate_limit_events log + parseTweetUrl + getByPublicUid + listPending. Tests: 6+. Function signatures must use `Db = any` pattern with eslint-disable.)

---

## Task 6: /apply form + server action

**Files:** `app/apply/page.tsx`, `app/apply/actions.ts`, `app/apply/confirmation/[uid]/page.tsx`.

The `/apply` page reads the `marlbro_applicant` cookie. If absent, it shows a "SIGN IN WITH X" button linking to `/api/twitter/login?next=/apply`. If present, it shows the form (wallet, tweet URL, receipt photo, optional notes, optional bounty pre-filled from `?bounty=` query param).

Server action `submitApplication`:
1. Parse formData via zod.
2. Read applicant cookie.
3. Compute `ipHash` from `x-forwarded-for`.
4. Call `checkRateLimits` — if not ok, return `{ ok: false, errorCode, retryAfter }`.
5. Read receipt file → Buffer → sha256 → check `receipts_seen`.
6. Generate `publicUid` (uuid).
7. Upload receipt to `getStorage()` at `receipts/{yyyy}/{mm}/{publicUid}.jpg`.
8. Insert submission row (status: `verifying`).
9. Insert receipts_seen.
10. Call `recordIntake` to log rate limits.
11. (Async) trigger `verifyTweet` and update submission row — for now, set status `review_ready` directly using stub.
12. `redirect(/apply/confirmation/${publicUid})`.

The confirmation page shows: "FILE 042-A · STATUS PENDING REVIEW" + the publicUid + the submission status (read on each page load). User can refresh to see updates.

This is a sizeable batch. The implementer should use Task 6 as a single substantive page+action implementation, follow the spec §8 stage 1 closely.

Commit:
```
git add app/apply
git commit -m "feat(apply): build application form + intake server action + confirmation page"
```

---

## Task 7: Local uploads route handler

**File:** `app/api/uploads/[...path]/route.ts`.

Serves files from the local `uploads/` directory. Used in dev only (Plan 6+ deployment uses R2 public URLs directly).

```typescript
// app/api/uploads/[...path]/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const ROOT = process.env.LOCAL_UPLOADS_DIR ?? path.join(process.cwd(), 'uploads');

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await params;
  const safe = parts.map((p) => decodeURIComponent(p)).join('/').replace(/\.\./g, '');
  const filePath = path.join(ROOT, safe);
  try {
    const buf = await fs.readFile(filePath);
    const ext = path.extname(filePath).slice(1).toLowerCase();
    const ct = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'png' ? 'image/png' : 'application/octet-stream';
    return new NextResponse(buf, { headers: { 'Content-Type': ct } });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
```

Commit:
```
git add app/api/uploads
git commit -m "feat(uploads): add local file-serve route for dev"
```

---

## Task 8: Final validation + push to PR branch

```bash
npm test
npm run typecheck
npm run lint
npm run build
git push origin plan-3-db-admin-auth
gh run list --limit 1 --json status,conclusion,name
```

CI passes; PR #1 picks up Plan 5.

---

*End of Plan 5.*
