# Marlbro · Plan 3 — Database + Admin Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** Set up the production-shaped Postgres schema (Drizzle ORM), provide an in-process PGlite database for dev/test (no external service required), and build a passwordless magic-link admin auth flow with email stubbed in dev. Outcome: an /admin section that requires authentication, a working login flow, and a complete schema for `admins`, `audit_log`, `config`, `bounties` (other tables come in later plans alongside their features).

**Architecture:** Drizzle ORM + `postgres-js` driver in production, `@electric-sql/pglite` in dev/test (Postgres compiled to WASM, no external DB). Schema is full Postgres syntax. Magic-link tokens are short-lived JWTs signed with env secret; email delivery via Resend in prod, `console.log` in dev. Sessions are JWT cookies (httpOnly, secure).

**Tech Stack additions:** drizzle-orm, drizzle-kit, postgres (postgres-js), @electric-sql/pglite, jose (JWT), zod (schema validation), resend (email — stubbed if no key).

**Spec reference:** `docs/superpowers/specs/2026-05-06-marlbro-design.md` §7 (data model), §11.1–11.3 (auth model).

---

## File Structure

```
db/
  schema.ts                     Drizzle schema for v1 tables
  schema.test.ts
  client.ts                     DB client factory (PGlite for dev, postgres-js for prod)
  client.test.ts
  migrate.ts                    Programmatic migration runner used in tests
  migrations/                   drizzle-kit generated SQL
    0000_init.sql

drizzle.config.ts
.env.example                    DATABASE_URL, MAGIC_LINK_SECRET, RESEND_API_KEY (optional)

lib/
  env.ts                        Validated env loader using zod
  env.test.ts
  auth/
    magicLink.ts                Generate + verify magic link tokens (jose JWT)
    magicLink.test.ts
    session.ts                  Encode/decode session JWTs in cookies
    session.test.ts
    sendMagicLink.ts            Resend send if key set, else console.log
    sendMagicLink.test.ts

app/
  admin/
    layout.tsx                  Auth-walled layout for all /admin/*
    page.tsx                    /admin index — placeholder dashboard
    login/page.tsx              Email entry form
    login/actions.ts            Server action: request magic link
    verify/page.tsx             Magic link verification page
    signout/route.ts            Server action / route handler — clear cookie
  api/
    health/route.ts             GET /api/health — DB ping (used by tests)
```

---

## Task 1: Install dependencies + .env.example

**Files:** Modify `package.json`, create `.env.example`.

- [ ] **Step 1**

```bash
cd /Users/valtoosh/Malbro-red
npm install drizzle-orm postgres @electric-sql/pglite jose zod resend
npm install -D drizzle-kit @types/pg
```

- [ ] **Step 2:** Create `.env.example`:

```
# Postgres connection. In dev, leave unset to use embedded PGlite.
# In prod, set to a real Neon URL.
# DATABASE_URL=postgres://user:pass@host:5432/marlbro

# Required: secret for signing magic-link tokens and session JWTs.
# Generate with: openssl rand -hex 32
MAGIC_LINK_SECRET=replace_me_with_32_byte_hex

# Optional: Resend API key for sending real emails. If unset, magic links
# are printed to console (development).
# RESEND_API_KEY=

# Optional: domain to use as the from-address for magic-link emails.
# Defaults to onboarding@resend.dev (Resend's test domain) if unset.
# RESEND_FROM=Marlbro Foundation <admin@marlbro.com>

# The base URL of the site, used to construct magic-link URLs.
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 3:** Commit

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: install drizzle, pglite, jose, zod, resend; add .env.example"
```

---

## Task 2: Validated env loader

**Files:** Create `lib/env.ts`, `lib/env.test.ts`.

A single canonical place to read environment variables, validated via zod, fails-loud if required vars are missing.

- [ ] **Step 1: Test**

```typescript
// lib/env.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('env loader', () => {
  const original = { ...process.env };

  beforeEach(() => {
    // Clear any env vars we manage
    delete process.env.DATABASE_URL;
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM;
    process.env.MAGIC_LINK_SECRET = 'a'.repeat(64);
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    process.env = { ...original };
  });

  it('throws when MAGIC_LINK_SECRET is missing', async () => {
    delete process.env.MAGIC_LINK_SECRET;
    const { loadEnv } = await import('./env');
    expect(() => loadEnv()).toThrow(/MAGIC_LINK_SECRET/);
  });

  it('throws when MAGIC_LINK_SECRET is too short', async () => {
    process.env.MAGIC_LINK_SECRET = 'short';
    const { loadEnv } = await import('./env');
    expect(() => loadEnv()).toThrow();
  });

  it('returns env object when valid', async () => {
    const { loadEnv } = await import('./env');
    const env = loadEnv();
    expect(env.MAGIC_LINK_SECRET).toBe('a'.repeat(64));
    expect(env.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000');
    expect(env.DATABASE_URL).toBeUndefined();
    expect(env.RESEND_API_KEY).toBeUndefined();
  });

  it('flags isEmailConfigured false when RESEND_API_KEY missing', async () => {
    const { loadEnv } = await import('./env');
    expect(loadEnv().isEmailConfigured).toBe(false);
  });

  it('flags isEmailConfigured true when RESEND_API_KEY present', async () => {
    process.env.RESEND_API_KEY = 're_test_xxx';
    const { loadEnv } = await import('./env');
    expect(loadEnv().isEmailConfigured).toBe(true);
  });
});
```

- [ ] **Step 2:** Run, FAIL.

- [ ] **Step 3: Implement `lib/env.ts`:**

```typescript
// lib/env.ts
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().url().optional(),
  MAGIC_LINK_SECRET: z.string().min(32, 'MAGIC_LINK_SECRET must be at least 32 chars'),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
});

export type Env = z.infer<typeof schema> & {
  isEmailConfigured: boolean;
};

export function loadEnv(): Env {
  const parsed = schema.parse(process.env);
  return {
    ...parsed,
    isEmailConfigured: parsed.RESEND_API_KEY !== undefined,
  };
}
```

- [ ] **Step 4:** Run, PASS (5 tests).

- [ ] **Step 5:** Commit

```bash
git add lib/env.ts lib/env.test.ts
git commit -m "feat(env): add zod-validated env loader"
```

---

## Task 3: Drizzle schema (admins, audit_log, config, bounties)

**Files:** Create `db/schema.ts`, `db/schema.test.ts`.

Schema covers the four tables needed for Plans 3 + 4. `submissions`, `approved_grants`, `rate_limit_events`, `receipts_seen`, `bounty_claims_lock`, `twitter_accounts` are deferred to Plan 5 (when their features land).

- [ ] **Step 1: Test (verifies schema imports + table exports + column shapes)**

```typescript
// db/schema.test.ts
import { describe, it, expect } from 'vitest';
import { admins, auditLog, config, bounties } from './schema';

describe('drizzle schema', () => {
  it('exports admins table with id, email, role, active, created_at', () => {
    const cols = Object.keys(admins);
    expect(cols).toContain('id');
    expect(cols).toContain('email');
    expect(cols).toContain('displayName');
    expect(cols).toContain('role');
    expect(cols).toContain('active');
    expect(cols).toContain('createdAt');
  });

  it('exports auditLog table', () => {
    const cols = Object.keys(auditLog);
    expect(cols).toContain('id');
    expect(cols).toContain('adminId');
    expect(cols).toContain('action');
    expect(cols).toContain('targetType');
    expect(cols).toContain('targetId');
    expect(cols).toContain('payload');
    expect(cols).toContain('at');
  });

  it('exports config table', () => {
    const cols = Object.keys(config);
    expect(cols).toContain('key');
    expect(cols).toContain('value');
    expect(cols).toContain('updatedAt');
  });

  it('exports bounties table with all spec fields', () => {
    const cols = Object.keys(bounties);
    expect(cols).toContain('id');
    expect(cols).toContain('number');
    expect(cols).toContain('title');
    expect(cols).toContain('brief');
    expect(cols).toContain('payoutMarlbro');
    expect(cols).toContain('payoutSol');
    expect(cols).toContain('maxClaims');
    expect(cols).toContain('claimsUsed');
    expect(cols).toContain('deadline');
    expect(cols).toContain('status');
    expect(cols).toContain('locationConstraint');
    expect(cols).toContain('createdAt');
    expect(cols).toContain('updatedAt');
  });
});
```

- [ ] **Step 2:** Run, FAIL.

- [ ] **Step 3: Implement `db/schema.ts`**

```typescript
// db/schema.ts
import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
  serial,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const adminRole = pgEnum('admin_role', ['reviewer', 'approver', 'superadmin']);
export const bountyStatus = pgEnum('bounty_status', ['draft', 'live', 'paused', 'exhausted', 'expired']);

export const admins = pgTable('admins', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  role: adminRole('role').notNull().default('reviewer'),
  totpSecretEnc: text('totp_secret_enc'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  adminId: uuid('admin_id').references(() => admins.id),
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: text('target_id'),
  payload: jsonb('payload'),
  ipHash: text('ip_hash'),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
});

export const config = pgTable('config', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedBy: uuid('updated_by').references(() => admins.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const bounties = pgTable('bounties', {
  id: uuid('id').primaryKey().defaultRandom(),
  number: serial('number').notNull(),
  title: text('title').notNull(),
  brief: text('brief').notNull(),
  payoutMarlbro: numeric('payout_marlbro', { precision: 30, scale: 6 }).notNull().default('0'),
  payoutSol: numeric('payout_sol', { precision: 30, scale: 9 }).notNull().default('0'),
  maxClaims: integer('max_claims'),
  claimsUsed: integer('claims_used').notNull().default(0),
  deadline: timestamp('deadline', { withTimezone: true }),
  status: bountyStatus('status').notNull().default('draft'),
  locationConstraint: text('location_constraint'),
  posterImageUrl: text('poster_image_url'),
  createdBy: uuid('created_by').references(() => admins.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Type exports for app code:
export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;
export type Bounty = typeof bounties.$inferSelect;
export type NewBounty = typeof bounties.$inferInsert;
export type AuditLogEntry = typeof auditLog.$inferSelect;
export type ConfigEntry = typeof config.$inferSelect;

// Re-export sql util for migration files
export { sql };
```

- [ ] **Step 4:** Run, PASS (4 tests).

- [ ] **Step 5:** Commit

```bash
git add db/schema.ts db/schema.test.ts
git commit -m "feat(db): add drizzle schema for admins, audit_log, config, bounties"
```

---

## Task 4: Drizzle config + generate initial migration

**Files:** Create `drizzle.config.ts`, run drizzle-kit generate to produce `db/migrations/0000_init.sql`.

- [ ] **Step 1: Create `drizzle.config.ts`**

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // drizzle-kit only uses this for `push` / `studio`; we don't run those in CI.
    url: process.env.DATABASE_URL ?? 'postgres://placeholder',
  },
  strict: true,
  verbose: true,
} satisfies Config;
```

- [ ] **Step 2: Add scripts to `package.json`**

Add these to the existing `scripts` block:

```json
"db:generate": "drizzle-kit generate",
"db:migrate": "tsx db/migrate.ts"
```

(`tsx` may not be installed; install if needed: `npm install -D tsx`.)

- [ ] **Step 3: Generate migration**

```bash
npm run db:generate
```

Expected: a new file appears in `db/migrations/`. Drizzle-kit will create an SQL file like `0000_init.sql` plus a `meta/` subdirectory.

- [ ] **Step 4: Verify migration file content**

```bash
ls db/migrations/
cat db/migrations/0000_*.sql | head -50
```

Expected: SQL with `CREATE TYPE admin_role`, `CREATE TYPE bounty_status`, `CREATE TABLE admins`, `CREATE TABLE bounties`, etc.

- [ ] **Step 5:** Commit

```bash
git add drizzle.config.ts package.json package-lock.json db/migrations
git commit -m "chore(db): add drizzle config and generate initial migration"
```

---

## Task 5: DB client + programmatic migration runner

**Files:** Create `db/client.ts`, `db/migrate.ts`, `db/client.test.ts`.

The client picks PGlite if `DATABASE_URL` is unset, otherwise postgres-js.

- [ ] **Step 1: Test (uses PGlite)**

```typescript
// db/client.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { createTestClient } from './client';
import { admins } from './schema';

describe('db client (PGlite)', () => {
  let db: Awaited<ReturnType<typeof createTestClient>>;

  beforeAll(async () => {
    db = await createTestClient();
  });

  it('can insert and read an admin', async () => {
    const inserted = await db
      .insert(admins)
      .values({ email: 'test@marlbro.com', displayName: 'Test' })
      .returning();
    expect(inserted[0]?.email).toBe('test@marlbro.com');
    expect(inserted[0]?.role).toBe('reviewer');
  });

  it('enforces unique email constraint', async () => {
    await db.insert(admins).values({ email: 'dupe@marlbro.com', displayName: 'A' });
    await expect(
      db.insert(admins).values({ email: 'dupe@marlbro.com', displayName: 'B' }),
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2:** Run, FAIL.

- [ ] **Step 3: Implement `db/client.ts`**

```typescript
// db/client.ts
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { PGlite } from '@electric-sql/pglite';
import postgres from 'postgres';
import * as schema from './schema';
import { runMigrationsOn } from './migrate';

type DrizzleDb = ReturnType<typeof drizzlePg<typeof schema>> | ReturnType<typeof drizzlePglite<typeof schema>>;

let cachedDb: DrizzleDb | null = null;

export async function getDb(): Promise<DrizzleDb> {
  if (cachedDb) return cachedDb;
  const url = process.env.DATABASE_URL;
  if (url) {
    const sql = postgres(url, { max: 5 });
    cachedDb = drizzlePg(sql, { schema });
  } else {
    const pglite = new PGlite();
    const db = drizzlePglite(pglite, { schema });
    await runMigrationsOn(db);
    cachedDb = db;
  }
  return cachedDb;
}

/**
 * Test-only — creates a fresh in-memory PGlite instance and runs migrations.
 * Each test that needs a clean DB should call this.
 */
export async function createTestClient(): Promise<ReturnType<typeof drizzlePglite<typeof schema>>> {
  const pglite = new PGlite();
  const db = drizzlePglite(pglite, { schema });
  await runMigrationsOn(db);
  return db;
}
```

- [ ] **Step 4: Implement `db/migrate.ts`**

```typescript
// db/migrate.ts
import { migrate as migratePg } from 'drizzle-orm/postgres-js/migrator';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import path from 'path';

const MIGRATIONS_FOLDER = path.join(process.cwd(), 'db', 'migrations');

/**
 * Run migrations on a pre-built drizzle instance (used in tests with PGlite).
 */
export async function runMigrationsOn(db: unknown): Promise<void> {
  // The drizzle pglite migrate works directly on the drizzle instance
  await migratePglite(db as Parameters<typeof migratePglite>[0], { migrationsFolder: MIGRATIONS_FOLDER });
}

/**
 * Standalone CLI — runs migrations against DATABASE_URL.
 * Invoked via `npm run db:migrate`.
 */
async function cli() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is required for db:migrate');
    process.exit(1);
  }
  const sql = postgres(url, { max: 1 });
  const db = drizzlePg(sql);
  await migratePg(db, { migrationsFolder: MIGRATIONS_FOLDER });
  await sql.end();
  console.log('Migrations applied.');
}

if (require.main === module) {
  cli().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
```

- [ ] **Step 5:** Run client tests, PASS (2 tests).

- [ ] **Step 6:** Commit

```bash
git add db/client.ts db/client.test.ts db/migrate.ts
git commit -m "feat(db): add PGlite-aware client factory and programmatic migrator"
```

---

## Task 6: Magic-link token + session JWT primitives

**Files:** Create `lib/auth/magicLink.ts`, `lib/auth/magicLink.test.ts`, `lib/auth/session.ts`, `lib/auth/session.test.ts`.

Use `jose` for HS256 JWTs. Magic link token TTL: 15 minutes. Session TTL: 12 hours.

- [ ] **Step 1: Test magicLink**

```typescript
// lib/auth/magicLink.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { generateMagicLinkToken, verifyMagicLinkToken } from './magicLink';

const SECRET = 'a'.repeat(64);

beforeAll(() => {
  process.env.MAGIC_LINK_SECRET = SECRET;
});

describe('magicLink', () => {
  it('round-trips an email', async () => {
    const token = await generateMagicLinkToken('admin@marlbro.com');
    const verified = await verifyMagicLinkToken(token);
    expect(verified.email).toBe('admin@marlbro.com');
  });

  it('rejects a tampered token', async () => {
    const token = await generateMagicLinkToken('admin@marlbro.com');
    const tampered = token.slice(0, -3) + 'xxx';
    await expect(verifyMagicLinkToken(tampered)).rejects.toThrow();
  });

  it('rejects an expired token', async () => {
    const token = await generateMagicLinkToken('admin@marlbro.com', { expiresIn: '-1s' });
    await expect(verifyMagicLinkToken(token)).rejects.toThrow();
  });
});
```

- [ ] **Step 2:** Run, FAIL.

- [ ] **Step 3: Implement `lib/auth/magicLink.ts`**

```typescript
// lib/auth/magicLink.ts
import { SignJWT, jwtVerify } from 'jose';

const ISSUER = 'marlbro-foundation';
const AUDIENCE = 'marlbro-admin-magiclink';

function getSecret(): Uint8Array {
  const s = process.env.MAGIC_LINK_SECRET;
  if (!s) throw new Error('MAGIC_LINK_SECRET is required');
  return new TextEncoder().encode(s);
}

export interface GenerateOptions {
  expiresIn?: string;
}

export async function generateMagicLinkToken(email: string, opts: GenerateOptions = {}): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(opts.expiresIn ?? '15m')
    .sign(getSecret());
}

export async function verifyMagicLinkToken(token: string): Promise<{ email: string }> {
  const { payload } = await jwtVerify(token, getSecret(), {
    issuer: ISSUER,
    audience: AUDIENCE,
  });
  if (typeof payload.email !== 'string') {
    throw new Error('Token missing email claim');
  }
  return { email: payload.email };
}
```

- [ ] **Step 4:** Run, PASS (3 tests).

- [ ] **Step 5: Test session**

```typescript
// lib/auth/session.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { encodeSession, decodeSession } from './session';

beforeAll(() => {
  process.env.MAGIC_LINK_SECRET = 'b'.repeat(64);
});

describe('session', () => {
  it('round-trips an admin session', async () => {
    const token = await encodeSession({ adminId: 'abc-123', email: 'x@y.z', role: 'approver' });
    const decoded = await decodeSession(token);
    expect(decoded.adminId).toBe('abc-123');
    expect(decoded.email).toBe('x@y.z');
    expect(decoded.role).toBe('approver');
  });

  it('rejects expired session', async () => {
    const token = await encodeSession(
      { adminId: 'abc-123', email: 'x@y.z', role: 'reviewer' },
      { expiresIn: '-1s' },
    );
    await expect(decodeSession(token)).rejects.toThrow();
  });

  it('rejects a tampered session', async () => {
    const token = await encodeSession({ adminId: 'a', email: 'x@y.z', role: 'reviewer' });
    await expect(decodeSession(token.slice(0, -3) + 'xxx')).rejects.toThrow();
  });
});
```

- [ ] **Step 6:** Run, FAIL.

- [ ] **Step 7: Implement `lib/auth/session.ts`**

```typescript
// lib/auth/session.ts
import { SignJWT, jwtVerify } from 'jose';

const ISSUER = 'marlbro-foundation';
const AUDIENCE = 'marlbro-admin-session';
export const SESSION_COOKIE = 'marlbro_session';

export type AdminRole = 'reviewer' | 'approver' | 'superadmin';

export interface SessionPayload {
  adminId: string;
  email: string;
  role: AdminRole;
}

interface EncodeOptions {
  expiresIn?: string;
}

function getSecret(): Uint8Array {
  const s = process.env.MAGIC_LINK_SECRET;
  if (!s) throw new Error('MAGIC_LINK_SECRET is required');
  return new TextEncoder().encode(s);
}

export async function encodeSession(payload: SessionPayload, opts: EncodeOptions = {}): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(opts.expiresIn ?? '12h')
    .sign(getSecret());
}

export async function decodeSession(token: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(token, getSecret(), { issuer: ISSUER, audience: AUDIENCE });
  if (
    typeof payload.adminId !== 'string' ||
    typeof payload.email !== 'string' ||
    typeof payload.role !== 'string' ||
    !['reviewer', 'approver', 'superadmin'].includes(payload.role)
  ) {
    throw new Error('Invalid session payload');
  }
  return {
    adminId: payload.adminId,
    email: payload.email,
    role: payload.role as AdminRole,
  };
}
```

- [ ] **Step 8:** Run, PASS (3 tests).

- [ ] **Step 9:** Commit

```bash
git add lib/auth
git commit -m "feat(auth): add magic-link tokens and session JWTs (jose)"
```

---

## Task 7: Magic link email send (Resend or console.log)

**Files:** Create `lib/auth/sendMagicLink.ts`, `lib/auth/sendMagicLink.test.ts`.

- [ ] **Step 1: Test**

```typescript
// lib/auth/sendMagicLink.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('sendMagicLink', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    process.env.MAGIC_LINK_SECRET = 'c'.repeat(64);
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    delete process.env.RESEND_API_KEY;
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('logs the magic link to console when RESEND_API_KEY is unset', async () => {
    const { sendMagicLink } = await import('./sendMagicLink');
    const result = await sendMagicLink('admin@marlbro.com');
    expect(result.delivered).toBe('console');
    expect(result.url).toMatch(/^http:\/\/localhost:3000\/admin\/verify\?token=/);
    expect(logSpy).toHaveBeenCalled();
  });

  it('returns the URL even when delivered via console', async () => {
    const { sendMagicLink } = await import('./sendMagicLink');
    const result = await sendMagicLink('admin@marlbro.com');
    expect(result.url).toBeDefined();
    expect(result.url.length).toBeGreaterThan(50);
  });
});
```

- [ ] **Step 2:** Run, FAIL.

- [ ] **Step 3: Implement `lib/auth/sendMagicLink.ts`**

```typescript
// lib/auth/sendMagicLink.ts
import { generateMagicLinkToken } from './magicLink';
import { Resend } from 'resend';

export interface SendResult {
  delivered: 'resend' | 'console';
  url: string;
}

export async function sendMagicLink(email: string): Promise<SendResult> {
  const token = await generateMagicLinkToken(email);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const url = `${baseUrl}/admin/verify?token=${encodeURIComponent(token)}`;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(
      `\n[Marlbro Foundation] Magic link for ${email}:\n  ${url}\n` +
        `  (Email delivery not configured — set RESEND_API_KEY to send via Resend)\n`,
    );
    return { delivered: 'console', url };
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM ?? 'Marlbro Foundation <onboarding@resend.dev>';
  await resend.emails.send({
    from,
    to: email,
    subject: 'The Marlbro Foundation — Administrative Access',
    html:
      `<p>Pursuant to Schedule R-7 §11(c), the bearer of this instrument is granted single-use ` +
      `administrative access to the Foundation's portal.</p>` +
      `<p><a href="${url}">${url}</a></p>` +
      `<p style="font-family: monospace; font-size: 12px; color: #666;">` +
      `LINK EXPIRES IN 15 MINUTES. NOT TRANSFERABLE. SCHEDULE R-7 §11(c).</p>`,
    text: `Marlbro Foundation administrative access:\n\n${url}\n\nLink expires in 15 minutes.`,
  });
  return { delivered: 'resend', url };
}
```

- [ ] **Step 4:** Run, PASS (2 tests).

- [ ] **Step 5:** Commit

```bash
git add lib/auth/sendMagicLink.ts lib/auth/sendMagicLink.test.ts
git commit -m "feat(auth): add sendMagicLink with Resend / console fallback"
```

---

## Task 8: /admin/login page + request-magic-link server action

**Files:** Create `app/admin/login/page.tsx`, `app/admin/login/actions.ts`.

- [ ] **Step 1: Implement `app/admin/login/actions.ts`**

```typescript
// app/admin/login/actions.ts
'use server';

import { sendMagicLink } from '@/lib/auth/sendMagicLink';
import { z } from 'zod';

const inputSchema = z.object({
  email: z.string().email('A valid email address must be furnished'),
});

export interface ActionResult {
  ok: boolean;
  message: string;
}

export async function requestMagicLink(formData: FormData): Promise<ActionResult> {
  const parsed = inputSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  // Always return success to avoid email enumeration. The actual admin check
  // happens at verify time — we look up the email in the admins table then.
  await sendMagicLink(parsed.data.email);
  return {
    ok: true,
    message:
      'If the furnished address is on file, a single-use access instrument has been dispatched. The instrument expires in 15 minutes.',
  };
}
```

- [ ] **Step 2: Implement `app/admin/login/page.tsx`**

```tsx
// app/admin/login/page.tsx
'use client';

import { useState, useTransition } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Stamp } from '@/components/ui/Stamp';
import { requestMagicLink, type ActionResult } from './actions';

export default function AdminLoginPage() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  return (
    <PageShell schedule="Schedule R-7 · Form 042-S · Administrative Access">
      <div className="max-w-[520px] mx-auto pt-8">
        <p className="font-mono text-eyebrow uppercase mb-4">§07 — ADMINISTRATIVE ACCESS</p>
        <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
          ADMIN ENTRY
        </h1>
        <p className="text-bodyL mt-5 text-ink-2">
          Pursuant to Schedule R-7 §11(c), administrative access is granted via single-use
          instrument dispatched to the address on file.
        </p>

        <Card className="mt-10 p-8 bg-paper-2">
          <form
            action={(fd) =>
              startTransition(async () => {
                const r = await requestMagicLink(fd);
                setResult(r);
              })
            }
          >
            <label className="block">
              <span className="block font-mono text-eyebrow uppercase tracking-[0.12em] mb-2">
                ADMINISTRATIVE EMAIL ADDRESS
              </span>
              <Input
                name="email"
                type="email"
                required
                placeholder="admin@marlbro.com"
                disabled={pending}
                variant="prose"
              />
            </label>
            <Button type="submit" disabled={pending} className="w-full mt-6">
              {pending ? 'DISPATCHING…' : 'DISPATCH ACCESS INSTRUMENT'}
            </Button>
          </form>

          {result && (
            <div
              className={`mt-6 p-4 border-2 ${
                result.ok ? 'border-ink bg-paper' : 'border-stamp-red bg-paper'
              }`}
            >
              <p className="font-mono text-bodyS">{result.message}</p>
            </div>
          )}
        </Card>

        <div className="mt-12 flex items-center gap-4">
          <Stamp label="OFFICIAL USE ONLY" rotate={-7} />
          <p className="font-mono text-caption uppercase tracking-[0.12em] text-ink-2">
            Schedule R-7 §11(c) — single-use, 15-minute expiry, non-transferable.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 3: Verify build, commit**

```bash
npm run build 2>&1 | tail -10
git add app/admin/login
git commit -m "feat(admin): add login page with magic-link request action"
```

---

## Task 9: /admin/verify page (consume token, set session)

**Files:** Create `app/admin/verify/page.tsx`.

This is a server component. It reads `?token=...`, verifies it, looks up the admin by email, sets the session cookie, redirects to `/admin`. Errors render an inline message.

- [ ] **Step 1: Implement `app/admin/verify/page.tsx`**

```tsx
// app/admin/verify/page.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { PageShell } from '@/components/layout/PageShell';
import { Stamp } from '@/components/ui/Stamp';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { verifyMagicLinkToken } from '@/lib/auth/magicLink';
import { encodeSession, SESSION_COOKIE } from '@/lib/auth/session';
import { getDb } from '@/db/client';
import { admins } from '@/db/schema';

export const metadata = { title: 'Verifying Access' };

interface SearchParams {
  token?: string;
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return renderError('No instrument was furnished with this request.');
  }

  let email: string;
  try {
    const verified = await verifyMagicLinkToken(token);
    email = verified.email.toLowerCase();
  } catch {
    return renderError('The furnished instrument is invalid or has expired.');
  }

  const db = await getDb();
  const [admin] = await db.select().from(admins).where(eq(admins.email, email)).limit(1);

  if (!admin || !admin.active) {
    return renderError(
      'No active administrative record exists for the furnished address. Pursuant to Schedule R-7 §11(d), access is denied.',
    );
  }

  const session = await encodeSession({
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12, // 12 hours
  });

  redirect('/admin');
}

function renderError(message: string) {
  return (
    <PageShell schedule="Schedule R-7 · Form 042-S · Access Denied">
      <div className="max-w-[640px] mx-auto pt-8">
        <p className="font-mono text-eyebrow uppercase mb-4">§07 — ACCESS DENIED</p>
        <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
          ACCESS DENIED.
        </h1>
        <p className="text-bodyL mt-5">{message}</p>
        <div className="mt-8 flex items-center gap-6">
          <Button asChild>
            <Link href="/admin/login">REQUEST NEW INSTRUMENT</Link>
          </Button>
          <Stamp label="ACCESS DENIED" rotate={-9} />
        </div>
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 2: Verify build, commit**

```bash
npm run build 2>&1 | tail -10
git add app/admin/verify
git commit -m "feat(admin): add verify page that consumes magic link and sets session"
```

---

## Task 10: /admin layout + /admin index + signout

**Files:** Create `app/admin/layout.tsx`, `app/admin/page.tsx`, `app/admin/signout/route.ts`.

- [ ] **Step 1: Implement `app/admin/layout.tsx`**

```tsx
// app/admin/layout.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { decodeSession, SESSION_COOKIE, type SessionPayload } from '@/lib/auth/session';

const PUBLIC_ADMIN_PATHS = new Set(['/admin/login', '/admin/verify']);

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // The layout component doesn't have direct access to the pathname in a
  // server component context (no headers() pathname helper guaranteed). So we
  // gate at page level for /admin/login and /admin/verify by NOT putting them
  // under this layout.

  const session = await currentAdmin();
  if (!session) {
    redirect('/admin/login');
  }

  return <AdminFrame session={session}>{children}</AdminFrame>;
}

async function currentAdmin(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return await decodeSession(token);
  } catch {
    return null;
  }
}

function AdminFrame({ session, children }: { session: SessionPayload; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <header className="bg-ink text-paper border-b-4 border-ink px-7 py-3.5 flex justify-between items-center font-mono text-eyebrow uppercase tracking-[0.12em] flex-wrap gap-3">
        <span>The Marlbro Foundation · Administrative Console</span>
        <span className="flex items-center gap-4">
          <span>{session.email}</span>
          <span className="bg-marlbro text-paper px-2 py-0.5">{session.role.toUpperCase()}</span>
          <form action="/admin/signout" method="post">
            <button type="submit" className="underline underline-offset-2 hover:text-marlbro">
              SIGN OUT
            </button>
          </form>
        </span>
      </header>
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-8 md:px-12 py-10">{children}</main>
    </div>
  );
}
```

**IMPORTANT:** The above layout wraps every `/admin/*` route. But `/admin/login` and `/admin/verify` need to render WITHOUT the auth gate — they're how you get authenticated in the first place. Solution: place login + verify under a **route group** that escapes the admin layout. Move `app/admin/login/` to `app/(public-admin)/admin/login/` would conflict with route group naming for this case. Cleaner: split the layout — login + verify use `PageShell` directly (which they already do), and we put the auth-gated content under `app/admin/(authed)/` group folder.

Restructure:
1. Move `app/admin/login/` → keep as is, but DO NOT inherit AdminLayout.
2. Same for `app/admin/verify/`.
3. Auth-gated pages live under `app/admin/(authed)/page.tsx`.

The pattern: in Next.js App Router, parenthesised `(group)` folders create a route group without affecting URL. So `app/admin/(authed)/layout.tsx` + `app/admin/(authed)/page.tsx` produces `/admin/page` URL with the auth layout — but `app/admin/login/page.tsx` (sibling, outside the group) does NOT inherit `(authed)/layout.tsx`.

**Refactor instructions:**
- Delete the `app/admin/layout.tsx` you just wrote.
- Create directory `app/admin/(authed)/` and move the layout there as `app/admin/(authed)/layout.tsx`.
- Create `app/admin/(authed)/page.tsx` for the dashboard.
- Leave `app/admin/login/` and `app/admin/verify/` as siblings of `(authed)/` — they will not inherit the auth layout.

- [ ] **Step 2: Restructure** — write the layout to the right path, then create the dashboard page.

Create `app/admin/(authed)/layout.tsx` with the same content as the layout above.

Create `app/admin/(authed)/page.tsx`:

```tsx
// app/admin/(authed)/page.tsx
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import Link from 'next/link';

export const metadata = { title: 'Administrative Dashboard' };

export default function AdminDashboard() {
  return (
    <>
      <p className="font-mono text-eyebrow uppercase mb-4">§00 — DASHBOARD</p>
      <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
        ADMINISTRATIVE DASHBOARD
      </h1>
      <p className="text-bodyL mt-5 max-w-[720px] text-ink-2">
        Welcome to the Foundation&apos;s administrative console. Module access is governed by the
        role-based provisions of Schedule R-7 §11.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
        <Card className="p-6">
          <p className="font-mono text-eyebrow uppercase mb-3">MODULE</p>
          <h3 className="font-display font-black text-h3 leading-tight">BOUNTY MANAGEMENT</h3>
          <p className="text-bodyS text-ink-2 mt-2">Create, edit, pause, and retire grants on the public Bounty Board.</p>
          <div className="mt-4">
            <Tag variant="muted">FORTHCOMING — PLAN 4</Tag>
          </div>
        </Card>

        <Card className="p-6">
          <p className="font-mono text-eyebrow uppercase mb-3">MODULE</p>
          <h3 className="font-display font-black text-h3 leading-tight">REVIEW QUEUE</h3>
          <p className="text-bodyS text-ink-2 mt-2">Approve, reject, or flag pending grant applications.</p>
          <div className="mt-4">
            <Tag variant="muted">FORTHCOMING — PLAN 5</Tag>
          </div>
        </Card>

        <Card className="p-6">
          <p className="font-mono text-eyebrow uppercase mb-3">MODULE</p>
          <h3 className="font-display font-black text-h3 leading-tight">AUDIT LOG</h3>
          <p className="text-bodyS text-ink-2 mt-2">View administrative action history with filtering.</p>
          <div className="mt-4">
            <Tag variant="muted">FORTHCOMING — PLAN 4</Tag>
          </div>
        </Card>
      </div>

      <p className="font-mono text-caption uppercase tracking-[0.12em] mt-12 text-ink-2">
        <Link href="/" className="underline underline-offset-2">↩ RETURN TO PUBLIC SITE</Link>
      </p>
    </>
  );
}
```

Delete the old `app/admin/layout.tsx` if it was created. Keep only `app/admin/(authed)/layout.tsx`.

Implement `app/admin/signout/route.ts`:

```typescript
// app/admin/signout/route.ts
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/lib/auth/session';

export async function POST() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect('/admin/login');
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -25
```

The route table should show `/admin`, `/admin/login`, `/admin/verify`, `/admin/signout`.

- [ ] **Step 4: Commit**

```bash
git add app/admin
git commit -m "feat(admin): add auth-gated layout, dashboard, and signout route"
```

---

## Task 11: Health endpoint + integration test for full auth flow

**Files:** Create `app/api/health/route.ts`, `tests/integration/auth.test.ts`.

- [ ] **Step 1: Implement `/api/health`**

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    const db = await getDb();
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({ ok: true, db: 'reachable' });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 2: Auth flow integration test**

```typescript
// tests/integration/auth.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { createTestClient } from '@/db/client';
import { admins } from '@/db/schema';
import { generateMagicLinkToken, verifyMagicLinkToken } from '@/lib/auth/magicLink';
import { encodeSession, decodeSession } from '@/lib/auth/session';

beforeAll(() => {
  process.env.MAGIC_LINK_SECRET = 'd'.repeat(64);
});

describe('admin auth — end-to-end', () => {
  it('issues magic link → verifies → looks up admin → encodes session', async () => {
    const db = await createTestClient();
    const [admin] = await db
      .insert(admins)
      .values({ email: 'flow@marlbro.com', displayName: 'Flow', role: 'approver' })
      .returning();
    expect(admin).toBeDefined();

    const token = await generateMagicLinkToken('flow@marlbro.com');
    const verified = await verifyMagicLinkToken(token);
    expect(verified.email).toBe('flow@marlbro.com');

    const session = await encodeSession({
      adminId: admin!.id,
      email: admin!.email,
      role: admin!.role,
    });
    const decoded = await decodeSession(session);
    expect(decoded.adminId).toBe(admin!.id);
    expect(decoded.role).toBe('approver');
  });
});
```

- [ ] **Step 3: Verify all tests pass**

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add app/api/health tests/integration/auth.test.ts
git commit -m "feat: add health endpoint and admin auth integration test"
```

---

## Task 12: Final push

```bash
git push origin main
sleep 15
gh run list --limit 1 --json status,conclusion,name
```

Watch CI for green. If it fails (esp. due to missing env vars in CI), set `MAGIC_LINK_SECRET` in CI workflow:

If CI fails for missing `MAGIC_LINK_SECRET`, modify `.github/workflows/ci.yml` to add an `env:` block to the test step:

```yaml
- name: Test
  env:
    MAGIC_LINK_SECRET: ${{ secrets.MAGIC_LINK_SECRET || 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }}
  run: npm test
```

Commit + push the fix if needed.

---

## Self-Review

**Spec coverage:**
- §7 data model — admins, audit_log, config, bounties tables match the spec column-by-column. (Other tables — submissions, approved_grants, etc. — deferred to Plan 5+ alongside their features.)
- §11.1 public auth — not in scope (Plan 5).
- §11.2 admin auth — magic link via Resend ✓, role enum ✓, session JWT cookie ✓. Step-up auth + TOTP deferred to Plan 4 (when destructive actions land).
- §11.4 secrets — `MAGIC_LINK_SECRET` documented in `.env.example`; Resend key optional.
- §11.6 privacy — IP hashing not in scope yet (no submissions yet).

**Placeholder scan:** The dashboard placeholder cards explicitly say "FORTHCOMING — PLAN N" — that's intentional, not a TBD.

**Type consistency:** `AdminRole` matches Drizzle enum. `SessionPayload` is the canonical session shape consumed by the admin layout.

---

*End of Plan 3.*
