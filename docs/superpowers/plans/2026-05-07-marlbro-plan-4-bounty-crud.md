# Marlbro · Plan 4 — Bounty CRUD + Audit Log

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** Make bounties first-class data: admin can create / edit / pause / retire bounties through the dashboard; the public Bounty Board reads from the DB; every admin action writes to `audit_log`; admins can browse the audit log.

**Architecture:** Drizzle queries module + server actions. Database seeds itself with the sample-data bounties on first boot when the table is empty (so dev still has content). Audit log is append-only — every mutation writes a row.

**Spec ref:** §7 (data model), §11.2 (admin roles), §11.7 (privacy / IP hashing), §11.8 (audit logging).

---

## File Structure

```
db/
  queries/
    bounties.ts                Bounty CRUD queries
    bounties.test.ts
    audit.ts                   Audit log helpers
    audit.test.ts
  seed.ts                      First-boot seeding from sampleData if empty

lib/
  ip.ts                        Hash an IP with the env salt
  ip.test.ts
  auth/
    requireAdmin.ts            Helper for server actions to require auth + role
    requireAdmin.test.ts

app/
  admin/(authed)/
    bounties/
      page.tsx                 Admin bounty list table
      new/page.tsx             Create bounty form
      new/actions.ts           createBountyAction
      [id]/page.tsx            Edit bounty form
      [id]/actions.ts          updateBountyAction
    audit/
      page.tsx                 Audit log viewer (paginated)
  bounties/
    page.tsx                   [modified] Read bounties from DB
    [number]/page.tsx          [modified] Read bounty from DB
    [number]/not-found.tsx     [unchanged from Plan 2]
```

---

## Task 1: Bounty queries module

**Files:** Create `db/queries/bounties.ts`, `db/queries/bounties.test.ts`.

Functions to implement: `listBounties`, `listLiveBounties`, `getBountyById`, `getBountyByNumber`, `createBounty`, `updateBounty`, `transitionStatus`.

- [ ] **Step 1: Test**

```typescript
// db/queries/bounties.test.ts
// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestClient } from '../client';
import { admins } from '../schema';
import {
  listBounties, listLiveBounties, getBountyById, getBountyByNumber,
  createBounty, updateBounty, transitionStatus,
} from './bounties';

describe('bounty queries', () => {
  let db: Awaited<ReturnType<typeof createTestClient>>;
  let adminId: string;

  beforeEach(async () => {
    db = await createTestClient();
    const [admin] = await db
      .insert(admins)
      .values({ email: 'a@b.c', displayName: 'A', role: 'approver' })
      .returning();
    adminId = admin!.id;
  });

  it('createBounty inserts and returns the row', async () => {
    const b = await createBounty(db, {
      title: 'Test',
      brief: 'Brief',
      payoutMarlbro: '5000',
      payoutSol: '0',
      maxClaims: null,
      deadline: null,
      locationConstraint: null,
      status: 'live',
      createdBy: adminId,
    });
    expect(b.title).toBe('Test');
    expect(b.number).toBeGreaterThan(0);
  });

  it('listBounties returns inserted bounties newest-first by number', async () => {
    await createBounty(db, { title: 'A', brief: 'a', payoutMarlbro: '1', payoutSol: '0', maxClaims: null, deadline: null, locationConstraint: null, status: 'live', createdBy: adminId });
    await createBounty(db, { title: 'B', brief: 'b', payoutMarlbro: '2', payoutSol: '0', maxClaims: null, deadline: null, locationConstraint: null, status: 'draft', createdBy: adminId });
    const all = await listBounties(db);
    expect(all.length).toBe(2);
    expect(all[0]!.number).toBeGreaterThan(all[1]!.number);
  });

  it('listLiveBounties only returns live bounties', async () => {
    await createBounty(db, { title: 'A', brief: 'a', payoutMarlbro: '1', payoutSol: '0', maxClaims: null, deadline: null, locationConstraint: null, status: 'live', createdBy: adminId });
    await createBounty(db, { title: 'B', brief: 'b', payoutMarlbro: '2', payoutSol: '0', maxClaims: null, deadline: null, locationConstraint: null, status: 'draft', createdBy: adminId });
    const live = await listLiveBounties(db);
    expect(live.length).toBe(1);
    expect(live[0]!.title).toBe('A');
  });

  it('getBountyById returns the matching bounty', async () => {
    const created = await createBounty(db, { title: 'X', brief: 'x', payoutMarlbro: '1', payoutSol: '0', maxClaims: null, deadline: null, locationConstraint: null, status: 'live', createdBy: adminId });
    const found = await getBountyById(db, created.id);
    expect(found?.id).toBe(created.id);
  });

  it('getBountyByNumber returns the matching bounty', async () => {
    const created = await createBounty(db, { title: 'X', brief: 'x', payoutMarlbro: '1', payoutSol: '0', maxClaims: null, deadline: null, locationConstraint: null, status: 'live', createdBy: adminId });
    const found = await getBountyByNumber(db, created.number);
    expect(found?.id).toBe(created.id);
  });

  it('updateBounty patches fields and bumps updatedAt', async () => {
    const created = await createBounty(db, { title: 'Old', brief: 'b', payoutMarlbro: '1', payoutSol: '0', maxClaims: null, deadline: null, locationConstraint: null, status: 'live', createdBy: adminId });
    await new Promise((r) => setTimeout(r, 10));
    const updated = await updateBounty(db, created.id, { title: 'New' });
    expect(updated?.title).toBe('New');
    expect(updated!.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());
  });

  it('transitionStatus changes status', async () => {
    const created = await createBounty(db, { title: 'X', brief: 'x', payoutMarlbro: '1', payoutSol: '0', maxClaims: null, deadline: null, locationConstraint: null, status: 'live', createdBy: adminId });
    const paused = await transitionStatus(db, created.id, 'paused');
    expect(paused?.status).toBe('paused');
  });
});
```

- [ ] **Step 2:** Run, FAIL.

- [ ] **Step 3: Implement `db/queries/bounties.ts`**

```typescript
// db/queries/bounties.ts
import { eq, desc, and } from 'drizzle-orm';
import { bounties, type Bounty, type NewBounty } from '../schema';

type DbLike = {
  insert: <T>(table: T) => { values: (...args: unknown[]) => unknown };
  select: () => unknown;
  update: <T>(table: T) => { set: (...args: unknown[]) => unknown };
};

// We type the db parameter as `any` for query helpers because Drizzle's
// generic types resist parameterization across pg/pglite drivers.
// All call sites pass a real Drizzle instance.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

export async function listBounties(db: Db): Promise<Bounty[]> {
  return db.select().from(bounties).orderBy(desc(bounties.number));
}

export async function listLiveBounties(db: Db): Promise<Bounty[]> {
  return db.select().from(bounties).where(eq(bounties.status, 'live')).orderBy(desc(bounties.number));
}

export async function getBountyById(db: Db, id: string): Promise<Bounty | undefined> {
  const [row] = await db.select().from(bounties).where(eq(bounties.id, id)).limit(1);
  return row;
}

export async function getBountyByNumber(db: Db, number: number): Promise<Bounty | undefined> {
  const [row] = await db.select().from(bounties).where(eq(bounties.number, number)).limit(1);
  return row;
}

export async function createBounty(
  db: Db,
  input: Omit<NewBounty, 'id' | 'createdAt' | 'updatedAt' | 'number' | 'claimsUsed'>,
): Promise<Bounty> {
  const [row] = await db.insert(bounties).values(input).returning();
  return row;
}

export async function updateBounty(
  db: Db,
  id: string,
  patch: Partial<Omit<Bounty, 'id' | 'number' | 'createdAt'>>,
): Promise<Bounty | undefined> {
  const [row] = await db
    .update(bounties)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(bounties.id, id))
    .returning();
  return row;
}

export async function transitionStatus(
  db: Db,
  id: string,
  status: Bounty['status'],
): Promise<Bounty | undefined> {
  return updateBounty(db, id, { status });
}
```

The `// eslint-disable-next-line` comments are intentional — Drizzle's union types across pg-js / pglite drivers can't be cleanly written without `any`. Each exported function still gives consumers strongly-typed return values.

- [ ] **Step 4:** Run, PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add db/queries/bounties.ts db/queries/bounties.test.ts
git commit -m "feat(db): add bounty queries module"
```

---

## Task 2: Audit log helper

**Files:** Create `db/queries/audit.ts`, `db/queries/audit.test.ts`.

- [ ] **Step 1: Test**

```typescript
// db/queries/audit.test.ts
// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestClient } from '../client';
import { admins } from '../schema';
import { recordAudit, listAudit } from './audit';

describe('audit log', () => {
  let db: Awaited<ReturnType<typeof createTestClient>>;
  let adminId: string;

  beforeEach(async () => {
    db = await createTestClient();
    const [admin] = await db
      .insert(admins)
      .values({ email: 'a@b.c', displayName: 'A', role: 'superadmin' })
      .returning();
    adminId = admin!.id;
  });

  it('records an audit entry', async () => {
    await recordAudit(db, {
      adminId,
      action: 'bounty_create',
      targetType: 'bounty',
      targetId: 'b-1',
      payload: { title: 'X' },
      ipHash: 'hashedip',
    });
    const rows = await listAudit(db);
    expect(rows.length).toBe(1);
    expect(rows[0]!.action).toBe('bounty_create');
    expect(rows[0]!.payload).toEqual({ title: 'X' });
  });

  it('lists audit entries newest-first', async () => {
    await recordAudit(db, { adminId, action: 'a' });
    await new Promise((r) => setTimeout(r, 5));
    await recordAudit(db, { adminId, action: 'b' });
    const rows = await listAudit(db);
    expect(rows[0]!.action).toBe('b');
    expect(rows[1]!.action).toBe('a');
  });

  it('paginates with limit and offset', async () => {
    for (let i = 0; i < 5; i++) {
      await recordAudit(db, { adminId, action: `a${i}` });
    }
    const page1 = await listAudit(db, { limit: 2, offset: 0 });
    const page2 = await listAudit(db, { limit: 2, offset: 2 });
    expect(page1.length).toBe(2);
    expect(page2.length).toBe(2);
    expect(page1[0]!.id).not.toBe(page2[0]!.id);
  });
});
```

- [ ] **Step 2:** Run, FAIL.

- [ ] **Step 3: Implement `db/queries/audit.ts`**

```typescript
// db/queries/audit.ts
import { desc } from 'drizzle-orm';
import { auditLog, type AuditLogEntry } from '../schema';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

export interface RecordAuditInput {
  adminId: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  payload?: unknown;
  ipHash?: string | null;
}

export async function recordAudit(db: Db, input: RecordAuditInput): Promise<void> {
  await db.insert(auditLog).values({
    adminId: input.adminId,
    action: input.action,
    targetType: input.targetType ?? null,
    targetId: input.targetId ?? null,
    payload: input.payload ?? null,
    ipHash: input.ipHash ?? null,
  });
}

export interface ListAuditOptions {
  limit?: number;
  offset?: number;
}

export async function listAudit(
  db: Db,
  opts: ListAuditOptions = {},
): Promise<AuditLogEntry[]> {
  return db
    .select()
    .from(auditLog)
    .orderBy(desc(auditLog.at))
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0);
}
```

- [ ] **Step 4:** Run, PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add db/queries/audit.ts db/queries/audit.test.ts
git commit -m "feat(db): add audit log helpers"
```

---

## Task 3: IP hash helper + requireAdmin

**Files:** Create `lib/ip.ts`, `lib/ip.test.ts`, `lib/auth/requireAdmin.ts`, `lib/auth/requireAdmin.test.ts`.

- [ ] **Step 1: ip test**

```typescript
// lib/ip.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { hashIp } from './ip';

describe('hashIp', () => {
  beforeEach(() => {
    process.env.MAGIC_LINK_SECRET = 'a'.repeat(64);
  });

  it('returns a stable hash for the same input', () => {
    const a = hashIp('1.2.3.4');
    const b = hashIp('1.2.3.4');
    expect(a).toBe(b);
  });

  it('returns different hashes for different inputs', () => {
    expect(hashIp('1.2.3.4')).not.toBe(hashIp('1.2.3.5'));
  });

  it('returns a hex string of length 64 (sha256)', () => {
    expect(hashIp('1.2.3.4')).toMatch(/^[0-9a-f]{64}$/);
  });
});
```

- [ ] **Step 2:** Run, FAIL.

- [ ] **Step 3: Implement `lib/ip.ts`**

```typescript
// lib/ip.ts
import { createHash } from 'crypto';

export function hashIp(ip: string): string {
  const salt = process.env.MAGIC_LINK_SECRET ?? '';
  return createHash('sha256').update(salt + ':' + ip).digest('hex');
}
```

- [ ] **Step 4:** Run, PASS (3 tests).

- [ ] **Step 5: requireAdmin test**

```typescript
// lib/auth/requireAdmin.test.ts
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { hasRequiredRole } from './requireAdmin';

describe('hasRequiredRole', () => {
  it('reviewer >= reviewer is true', () => {
    expect(hasRequiredRole('reviewer', 'reviewer')).toBe(true);
  });
  it('approver >= reviewer is true', () => {
    expect(hasRequiredRole('approver', 'reviewer')).toBe(true);
  });
  it('superadmin >= approver is true', () => {
    expect(hasRequiredRole('superadmin', 'approver')).toBe(true);
  });
  it('reviewer >= approver is false', () => {
    expect(hasRequiredRole('reviewer', 'approver')).toBe(false);
  });
  it('approver >= superadmin is false', () => {
    expect(hasRequiredRole('approver', 'superadmin')).toBe(false);
  });
});
```

- [ ] **Step 6:** Run, FAIL.

- [ ] **Step 7: Implement `lib/auth/requireAdmin.ts`**

```typescript
// lib/auth/requireAdmin.ts
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decodeSession, SESSION_COOKIE, type SessionPayload, type AdminRole } from './session';

const ROLE_RANK: Record<AdminRole, number> = {
  reviewer: 0,
  approver: 1,
  superadmin: 2,
};

export function hasRequiredRole(actual: AdminRole, required: AdminRole): boolean {
  return ROLE_RANK[actual] >= ROLE_RANK[required];
}

export async function requireAdmin(minimumRole: AdminRole = 'reviewer'): Promise<SessionPayload> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) redirect('/admin/login');
  let session: SessionPayload;
  try {
    session = await decodeSession(token);
  } catch {
    redirect('/admin/login');
  }
  if (!hasRequiredRole(session.role, minimumRole)) {
    throw new Error(`Forbidden: requires ${minimumRole} role; have ${session.role}`);
  }
  return session;
}
```

- [ ] **Step 8:** Run, PASS (5 tests).

- [ ] **Step 9: Commit**

```bash
git add lib/ip.ts lib/ip.test.ts lib/auth/requireAdmin.ts lib/auth/requireAdmin.test.ts
git commit -m "feat(auth): add ip hash + requireAdmin role check"
```

---

## Task 4: DB seeding from sampleData

**Files:** Create `db/seed.ts`. Modify `db/client.ts` to call it after migration in PGlite mode.

The idea: in dev/test, after migrations run on PGlite, if the bounties table is empty, seed it with the sampleData entries. Production with a real DATABASE_URL skips seeding (data is owned by admin actions).

- [ ] **Step 1: Implement `db/seed.ts`**

```typescript
// db/seed.ts
import { count } from 'drizzle-orm';
import { admins, bounties } from './schema';
import { SAMPLE_BOUNTIES } from '@/lib/sampleData';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

const SEED_ADMIN_EMAIL = 'admin@marlbro.com';

export async function seedIfEmpty(db: Db): Promise<void> {
  const [bountyCount] = await db.select({ n: count() }).from(bounties);
  if ((bountyCount?.n ?? 0) > 0) return;

  // Ensure a seed admin exists
  const [admin] = await db
    .insert(admins)
    .values({
      email: SEED_ADMIN_EMAIL,
      displayName: 'Foundation Admin',
      role: 'superadmin',
    })
    .onConflictDoNothing({ target: admins.email })
    .returning();

  // If onConflictDoNothing returned nothing, look up existing admin
  let adminId: string;
  if (admin) {
    adminId = admin.id;
  } else {
    const [existing] = await db.select().from(admins).limit(1);
    adminId = existing!.id;
  }

  for (const b of SAMPLE_BOUNTIES) {
    await db.insert(bounties).values({
      title: b.title,
      brief: b.brief,
      payoutMarlbro: String(b.payoutMarlbro),
      payoutSol: String(b.payoutSol),
      maxClaims: b.maxClaims,
      claimsUsed: b.claimsUsed,
      status: b.status,
      deadline: b.deadline ? new Date(b.deadline) : null,
      locationConstraint: b.locationConstraint,
      createdBy: adminId,
    });
  }
}
```

- [ ] **Step 2: Modify `db/client.ts`** to call `seedIfEmpty` after migration in PGlite mode. Read the current file, then update the PGlite branch:

```typescript
// db/client.ts (PGlite branch — relevant excerpt)
import { seedIfEmpty } from './seed';
// ... existing imports ...

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
    await seedIfEmpty(db);
    cachedDb = db;
  }
  return cachedDb;
}
```

`createTestClient` should NOT seed (keeps tests isolated).

- [ ] **Step 3: Verify build passes** — `npm run build`. The seed import shouldn't break tree-shaking; it only runs at runtime in dev.

- [ ] **Step 4: Commit**

```bash
git add db/seed.ts db/client.ts
git commit -m "feat(db): seed sample bounties on first PGlite boot"
```

---

## Task 5: Public bounties pages read from DB

**Files:** Modify `app/bounties/page.tsx`, `app/bounties/[number]/page.tsx`.

- [ ] **Step 1:** Replace `app/bounties/page.tsx`:

```tsx
// app/bounties/page.tsx
import { PageShell } from '@/components/layout/PageShell';
import { BountyCard } from '@/components/ui/BountyCard';
import { getDb } from '@/db/client';
import { listLiveBounties } from '@/db/queries/bounties';
import type { Bounty as DbBounty } from '@/db/schema';
import type { Bounty } from '@/lib/sampleData';

export const metadata = { title: 'Bounty Board' };
export const dynamic = 'force-dynamic';

function dbToView(b: DbBounty): Bounty {
  return {
    id: b.id,
    number: b.number,
    title: b.title,
    brief: b.brief,
    payoutMarlbro: Number(b.payoutMarlbro),
    payoutSol: Number(b.payoutSol),
    maxClaims: b.maxClaims,
    claimsUsed: b.claimsUsed,
    status: b.status,
    deadline: b.deadline ? b.deadline.toISOString().slice(0, 10) : null,
    locationConstraint: b.locationConstraint,
  };
}

export default async function BountiesPage() {
  const db = await getDb();
  const list = await listLiveBounties(db);
  const bounties = list.map(dbToView);

  return (
    <PageShell schedule="Schedule R-7 · Form 042-B">
      <header className="mb-12">
        <p className="font-mono text-eyebrow uppercase mb-4">§02 — BOUNTY BOARD</p>
        <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
          BOUNTY BOARD
        </h1>
        <p className="text-bodyL mt-5 max-w-[720px]">
          A registry of curated discretionary grants currently open for application. Each posting
          constitutes a Statement of Work pursuant to Schedule R-7 §11(a).
        </p>
      </header>
      {bounties.length === 0 ? (
        <p className="font-mono text-body-s text-ink-2">
          The Foundation has no active grants at this time. Pursuant to Schedule R-7, please consult the Open Grant lane.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bounties.map((bounty) => (
            <BountyCard key={bounty.id} bounty={bounty} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
```

- [ ] **Step 2:** Replace `app/bounties/[number]/page.tsx`:

```tsx
// app/bounties/[number]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageShell } from '@/components/layout/PageShell';
import { Tag } from '@/components/ui/Tag';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getDb } from '@/db/client';
import { getBountyByNumber } from '@/db/queries/bounties';

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const db = await getDb();
  const b = await getBountyByNumber(db, Number.parseInt(number, 10));
  if (!b) return { title: 'Bounty Not Found' };
  return { title: `Grant №${b.number} · ${b.title}` };
}

export default async function BountyDetailPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const n = Number.parseInt(number, 10);
  if (Number.isNaN(n)) notFound();

  const db = await getDb();
  const b = await getBountyByNumber(db, n);
  if (!b) notFound();

  const left = b.maxClaims !== null ? Math.max(0, b.maxClaims - b.claimsUsed) : null;
  const isExhausted = b.maxClaims !== null && b.claimsUsed >= b.maxClaims;
  const claimsLabel = b.maxClaims === null
    ? 'UNLIMITED CLAIMS'
    : isExhausted
      ? 'EXHAUSTED'
      : `${left} CLAIM${left === 1 ? '' : 'S'} REMAINING`;
  const payoutMarlbroNum = Number(b.payoutMarlbro);
  const payoutSolNum = Number(b.payoutSol);
  const deadlineISO = b.deadline ? b.deadline.toISOString().slice(0, 10) : null;

  return (
    <PageShell schedule={`Schedule R-7 · Form 042-B · Grant ${b.number}`}>
      <Link href="/bounties" className="font-mono text-eyebrow uppercase tracking-[0.12em] inline-block mb-6 underline underline-offset-[3px]">
        ← BOUNTY BOARD
      </Link>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <article className="lg:col-span-8">
          <p className="font-mono text-eyebrow uppercase mb-4">GRANT №{b.number}</p>
          <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">{b.title}</h1>
          <div className="flex flex-wrap gap-2 mt-6">
            <Tag variant={isExhausted ? 'alert' : 'default'}>{claimsLabel}</Tag>
            {deadlineISO && <Tag>DEADLINE {deadlineISO}</Tag>}
            {b.locationConstraint && <Tag variant="muted">{b.locationConstraint}</Tag>}
          </div>
          <section className="mt-10">
            <h2 className="font-mono text-eyebrow uppercase mb-3">STATEMENT OF WORK</h2>
            <p className="text-bodyL leading-relaxed whitespace-pre-wrap">{b.brief}</p>
          </section>
          <section className="mt-10">
            <h2 className="font-mono text-eyebrow uppercase mb-3">SUBMISSION REQUIREMENTS</h2>
            <ol className="space-y-2 text-body list-none">
              <li>1. The applicant shall furnish a photograph satisfying the Statement of Work.</li>
              <li>2. The applicant shall publish a corresponding post on X tagging @marlbrotoken.</li>
              <li>3. The applicant shall provide a Solana wallet address for disbursement.</li>
              <li>4. The applicant shall complete Form 042-B (this instrument).</li>
            </ol>
          </section>
        </article>
        <aside className="lg:col-span-4">
          <Card className="bg-paper-2 sticky top-8">
            <div className="px-5 pt-5">
              <p className="font-mono text-eyebrow uppercase mb-2">DISBURSEMENT</p>
              <p className="font-display font-black text-h1 leading-none tracking-[-0.02em]">
                {formatNumber(payoutMarlbroNum)}
                <span className="block text-eyebrow font-mono tracking-[0.1em] mt-2 opacity-70">$MARLBRO</span>
              </p>
              {payoutSolNum > 0 && (
                <p className="font-display font-black text-h2 leading-none tracking-[-0.02em] mt-4 pt-4 border-t-2 border-ink">
                  +{payoutSolNum}
                  <span className="block text-eyebrow font-mono tracking-[0.1em] mt-2 opacity-70">SOL</span>
                </p>
              )}
            </div>
            <div className="px-5 pt-5 pb-5 mt-5 border-t-2 border-ink">
              {isExhausted ? (
                <Button disabled className="w-full">FILLED</Button>
              ) : (
                <Button asChild className="w-full">
                  <Link href={`/apply?bounty=${b.number}`}>CLAIM THIS GRANT</Link>
                </Button>
              )}
            </div>
          </Card>
        </aside>
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 3:** `npm run build`. The dynamic-route export means these pages are now SSR (`ƒ`), not SSG. That's expected.

- [ ] **Step 4: Commit**

```bash
git add app/bounties/page.tsx app/bounties/[number]/page.tsx
git commit -m "feat(bounties): switch public pages to read from DB"
```

---

## Task 6: Admin bounty list page

**Files:** Create `app/admin/(authed)/bounties/page.tsx`.

```tsx
// app/admin/(authed)/bounties/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { getDb } from '@/db/client';
import { listBounties } from '@/db/queries/bounties';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export const metadata = { title: 'Admin · Bounty Management' };

export default async function AdminBountiesListPage() {
  await requireAdmin('reviewer');
  const db = await getDb();
  const list = await listBounties(db);

  return (
    <>
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <p className="font-mono text-eyebrow uppercase mb-2">§01 — BOUNTY MANAGEMENT</p>
          <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">BOUNTIES</h1>
        </div>
        <Button asChild>
          <Link href="/admin/bounties/new">+ NEW BOUNTY</Link>
        </Button>
      </div>

      <div className="border-4 border-ink bg-paper">
        <table className="w-full text-bodyS">
          <thead className="bg-ink text-paper">
            <tr className="font-mono uppercase text-eyebrow tracking-[0.1em]">
              <th className="px-4 py-3 text-left">№</th>
              <th className="px-4 py-3 text-left">TITLE</th>
              <th className="px-4 py-3 text-left">PAYOUT</th>
              <th className="px-4 py-3 text-left">CLAIMS</th>
              <th className="px-4 py-3 text-left">STATUS</th>
              <th className="px-4 py-3 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-2 font-mono">
                  No bounties recorded.
                </td>
              </tr>
            )}
            {list.map((b) => (
              <tr key={b.id} className="border-t-2 border-ink">
                <td className="px-4 py-3 font-mono">№{b.number}</td>
                <td className="px-4 py-3 font-display font-bold">{b.title}</td>
                <td className="px-4 py-3 font-mono">
                  {Number(b.payoutMarlbro).toLocaleString()} $M
                  {Number(b.payoutSol) > 0 ? ` + ${b.payoutSol} SOL` : ''}
                </td>
                <td className="px-4 py-3 font-mono">
                  {b.claimsUsed}/{b.maxClaims ?? '∞'}
                </td>
                <td className="px-4 py-3">
                  <Tag variant={b.status === 'live' ? 'default' : 'muted'}>{b.status.toUpperCase()}</Tag>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/bounties/${b.id}`} className="font-mono text-eyebrow uppercase tracking-[0.1em] underline">EDIT</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
```

Build, commit:
```bash
npm run build 2>&1 | tail -10
git add app/admin/\(authed\)/bounties/page.tsx
git commit -m "feat(admin): add bounty list page"
```

---

## Task 7: Admin bounty create page + action

**Files:** Create `app/admin/(authed)/bounties/new/page.tsx`, `app/admin/(authed)/bounties/new/actions.ts`.

### actions.ts:

```typescript
// app/admin/(authed)/bounties/new/actions.ts
'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { headers } from 'next/headers';
import { getDb } from '@/db/client';
import { createBounty } from '@/db/queries/bounties';
import { recordAudit } from '@/db/queries/audit';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { hashIp } from '@/lib/ip';

const inputSchema = z.object({
  title: z.string().min(1).max(200),
  brief: z.string().min(1).max(5000),
  payoutMarlbro: z.string().regex(/^\d+(\.\d+)?$/, 'Must be a numeric value'),
  payoutSol: z.string().regex(/^\d+(\.\d+)?$/, 'Must be a numeric value'),
  maxClaims: z.string().optional(),
  deadline: z.string().optional(),
  locationConstraint: z.string().optional(),
  status: z.enum(['draft', 'live', 'paused']),
});

export interface ActionResult {
  ok: boolean;
  errors?: Record<string, string>;
}

export async function createBountyAction(formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin('approver');

  const parsed = inputSchema.safeParse({
    title: formData.get('title'),
    brief: formData.get('brief'),
    payoutMarlbro: formData.get('payoutMarlbro'),
    payoutSol: formData.get('payoutSol'),
    maxClaims: formData.get('maxClaims') || undefined,
    deadline: formData.get('deadline') || undefined,
    locationConstraint: formData.get('locationConstraint') || undefined,
    status: formData.get('status'),
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      errors[issue.path.join('.')] = issue.message;
    }
    return { ok: false, errors };
  }

  const db = await getDb();
  const created = await createBounty(db, {
    title: parsed.data.title,
    brief: parsed.data.brief,
    payoutMarlbro: parsed.data.payoutMarlbro,
    payoutSol: parsed.data.payoutSol,
    maxClaims: parsed.data.maxClaims ? Number.parseInt(parsed.data.maxClaims, 10) : null,
    deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
    locationConstraint: parsed.data.locationConstraint ?? null,
    status: parsed.data.status,
    createdBy: session.adminId,
  });

  const h = await headers();
  await recordAudit(db, {
    adminId: session.adminId,
    action: 'bounty_create',
    targetType: 'bounty',
    targetId: created.id,
    payload: { number: created.number, title: created.title, status: created.status },
    ipHash: hashIp(h.get('x-forwarded-for') ?? 'unknown'),
  });

  redirect(`/admin/bounties/${created.id}`);
}
```

### page.tsx:

```tsx
// app/admin/(authed)/bounties/new/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createBountyAction } from './actions';

export const metadata = { title: 'Admin · New Bounty' };

export default async function NewBountyPage() {
  await requireAdmin('approver');
  return (
    <>
      <Link href="/admin/bounties" className="font-mono text-eyebrow uppercase tracking-[0.12em] inline-block mb-6 underline underline-offset-[3px]">
        ← BOUNTIES
      </Link>
      <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em] mb-8">
        NEW BOUNTY
      </h1>
      <Card className="p-8 bg-paper-2">
        <form action={createBountyAction} className="space-y-6">
          <Field label="TITLE" name="title" required />
          <TextField label="BRIEF (STATEMENT OF WORK)" name="brief" required rows={5} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="PAYOUT — $MARLBRO" name="payoutMarlbro" required defaultValue="5000" />
            <Field label="PAYOUT — SOL" name="payoutSol" required defaultValue="0" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="MAX CLAIMS (BLANK = UNLIMITED)" name="maxClaims" type="number" />
            <Field label="DEADLINE (YYYY-MM-DD, OPTIONAL)" name="deadline" type="date" />
          </div>
          <Field label="LOCATION CONSTRAINT (OPTIONAL)" name="locationConstraint" />
          <div>
            <span className="block font-mono text-eyebrow uppercase tracking-[0.12em] mb-2">STATUS</span>
            <select name="status" defaultValue="draft" className="block w-full px-[14px] py-[12px] bg-paper-2 border-2 border-ink font-mono text-bodyS">
              <option value="draft">DRAFT</option>
              <option value="live">LIVE</option>
              <option value="paused">PAUSED</option>
            </select>
          </div>
          <Button type="submit">CREATE BOUNTY</Button>
        </form>
      </Card>
    </>
  );
}

function Field({ label, name, type = 'text', required = false, defaultValue }: {
  label: string; name: string; type?: string; required?: boolean; defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="block font-mono text-eyebrow uppercase tracking-[0.12em] mb-2">{label}</span>
      <Input name={name} type={type} required={required} defaultValue={defaultValue} variant="prose" />
    </label>
  );
}

function TextField({ label, name, required = false, rows = 4 }: {
  label: string; name: string; required?: boolean; rows?: number;
}) {
  return (
    <label className="block">
      <span className="block font-mono text-eyebrow uppercase tracking-[0.12em] mb-2">{label}</span>
      <textarea name={name} required={required} rows={rows} className="block w-full px-[14px] py-[12px] bg-paper-2 border-2 border-ink font-sans text-body" />
    </label>
  );
}
```

Build, commit:
```bash
npm run build 2>&1 | tail -10
git add app/admin/\(authed\)/bounties/new
git commit -m "feat(admin): add new bounty page with create action"
```

---

## Task 8: Admin bounty edit page + action

**Files:** Create `app/admin/(authed)/bounties/[id]/page.tsx`, `app/admin/(authed)/bounties/[id]/actions.ts`.

### actions.ts:

```typescript
// app/admin/(authed)/bounties/[id]/actions.ts
'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { headers } from 'next/headers';
import { getDb } from '@/db/client';
import { updateBounty } from '@/db/queries/bounties';
import { recordAudit } from '@/db/queries/audit';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { hashIp } from '@/lib/ip';

const inputSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  brief: z.string().min(1).max(5000),
  payoutMarlbro: z.string().regex(/^\d+(\.\d+)?$/),
  payoutSol: z.string().regex(/^\d+(\.\d+)?$/),
  maxClaims: z.string().optional(),
  deadline: z.string().optional(),
  locationConstraint: z.string().optional(),
  status: z.enum(['draft', 'live', 'paused', 'exhausted', 'expired']),
});

export interface ActionResult { ok: boolean; errors?: Record<string, string>; }

export async function updateBountyAction(formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin('approver');
  const parsed = inputSchema.safeParse({
    id: formData.get('id'),
    title: formData.get('title'),
    brief: formData.get('brief'),
    payoutMarlbro: formData.get('payoutMarlbro'),
    payoutSol: formData.get('payoutSol'),
    maxClaims: formData.get('maxClaims') || undefined,
    deadline: formData.get('deadline') || undefined,
    locationConstraint: formData.get('locationConstraint') || undefined,
    status: formData.get('status'),
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[issue.path.join('.')] = issue.message;
    return { ok: false, errors };
  }
  const db = await getDb();
  const updated = await updateBounty(db, parsed.data.id, {
    title: parsed.data.title,
    brief: parsed.data.brief,
    payoutMarlbro: parsed.data.payoutMarlbro,
    payoutSol: parsed.data.payoutSol,
    maxClaims: parsed.data.maxClaims ? Number.parseInt(parsed.data.maxClaims, 10) : null,
    deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
    locationConstraint: parsed.data.locationConstraint ?? null,
    status: parsed.data.status,
  });
  if (!updated) return { ok: false, errors: { _form: 'Bounty not found' } };

  const h = await headers();
  await recordAudit(db, {
    adminId: session.adminId,
    action: 'bounty_update',
    targetType: 'bounty',
    targetId: updated.id,
    payload: { number: updated.number, title: updated.title, status: updated.status },
    ipHash: hashIp(h.get('x-forwarded-for') ?? 'unknown'),
  });

  redirect(`/admin/bounties/${updated.id}`);
}
```

### page.tsx:

```tsx
// app/admin/(authed)/bounties/[id]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { getDb } from '@/db/client';
import { getBountyById } from '@/db/queries/bounties';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { updateBountyAction } from './actions';

export const metadata = { title: 'Admin · Edit Bounty' };

export default async function EditBountyPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin('approver');
  const { id } = await params;
  const db = await getDb();
  const b = await getBountyById(db, id);
  if (!b) notFound();

  const deadlineISO = b.deadline ? b.deadline.toISOString().slice(0, 10) : '';

  return (
    <>
      <Link href="/admin/bounties" className="font-mono text-eyebrow uppercase tracking-[0.12em] inline-block mb-6 underline underline-offset-[3px]">
        ← BOUNTIES
      </Link>
      <div className="flex items-baseline gap-4 mb-8 flex-wrap">
        <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
          GRANT №{b.number}
        </h1>
        <Tag variant={b.status === 'live' ? 'default' : 'muted'}>{b.status.toUpperCase()}</Tag>
      </div>
      <p className="font-mono text-caption uppercase tracking-[0.12em] mb-8 text-ink-2">
        {b.claimsUsed} / {b.maxClaims ?? '∞'} claims used · created {b.createdAt.toISOString().slice(0, 10)}
      </p>

      <Card className="p-8 bg-paper-2">
        <form action={updateBountyAction} className="space-y-6">
          <input type="hidden" name="id" value={b.id} />
          <Field label="TITLE" name="title" required defaultValue={b.title} />
          <TextField label="BRIEF (STATEMENT OF WORK)" name="brief" required defaultValue={b.brief} rows={5} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="PAYOUT — $MARLBRO" name="payoutMarlbro" required defaultValue={String(b.payoutMarlbro)} />
            <Field label="PAYOUT — SOL" name="payoutSol" required defaultValue={String(b.payoutSol)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="MAX CLAIMS (BLANK = UNLIMITED)" name="maxClaims" type="number" defaultValue={b.maxClaims !== null ? String(b.maxClaims) : ''} />
            <Field label="DEADLINE (OPTIONAL)" name="deadline" type="date" defaultValue={deadlineISO} />
          </div>
          <Field label="LOCATION CONSTRAINT (OPTIONAL)" name="locationConstraint" defaultValue={b.locationConstraint ?? ''} />
          <div>
            <span className="block font-mono text-eyebrow uppercase tracking-[0.12em] mb-2">STATUS</span>
            <select name="status" defaultValue={b.status} className="block w-full px-[14px] py-[12px] bg-paper-2 border-2 border-ink font-mono text-bodyS">
              <option value="draft">DRAFT</option>
              <option value="live">LIVE</option>
              <option value="paused">PAUSED</option>
              <option value="exhausted">EXHAUSTED</option>
              <option value="expired">EXPIRED</option>
            </select>
          </div>
          <Button type="submit">SAVE CHANGES</Button>
        </form>
      </Card>
    </>
  );
}

function Field({ label, name, type = 'text', required = false, defaultValue }: {
  label: string; name: string; type?: string; required?: boolean; defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="block font-mono text-eyebrow uppercase tracking-[0.12em] mb-2">{label}</span>
      <Input name={name} type={type} required={required} defaultValue={defaultValue} variant="prose" />
    </label>
  );
}

function TextField({ label, name, required = false, rows = 4, defaultValue }: {
  label: string; name: string; required?: boolean; rows?: number; defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="block font-mono text-eyebrow uppercase tracking-[0.12em] mb-2">{label}</span>
      <textarea name={name} required={required} rows={rows} defaultValue={defaultValue} className="block w-full px-[14px] py-[12px] bg-paper-2 border-2 border-ink font-sans text-body" />
    </label>
  );
}
```

Build, commit:
```bash
npm run build 2>&1 | tail -10
git add app/admin/\(authed\)/bounties/\[id\]
git commit -m "feat(admin): add bounty edit page with update action"
```

---

## Task 9: Audit log viewer

**Files:** Create `app/admin/(authed)/audit/page.tsx`.

```tsx
// app/admin/(authed)/audit/page.tsx
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { listAudit } from '@/db/queries/audit';
import { admins } from '@/db/schema';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export const metadata = { title: 'Admin · Audit Log' };
export const dynamic = 'force-dynamic';

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdmin('superadmin');
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1);
  const limit = 50;
  const offset = (page - 1) * limit;

  const db = await getDb();
  const entries = await listAudit(db, { limit, offset });

  // Build a map of admin_id → email for display
  const adminIds = Array.from(new Set(entries.map((e) => e.adminId).filter((x): x is string => !!x)));
  const adminMap = new Map<string, string>();
  for (const id of adminIds) {
    const [a] = await db.select().from(admins).where(eq(admins.id, id)).limit(1);
    if (a) adminMap.set(a.id, a.email);
  }

  return (
    <>
      <p className="font-mono text-eyebrow uppercase mb-4">§99 — AUDIT LOG</p>
      <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em] mb-8">
        AUDIT LOG
      </h1>

      <div className="border-4 border-ink bg-paper">
        <table className="w-full text-bodyS">
          <thead className="bg-ink text-paper">
            <tr className="font-mono uppercase text-eyebrow tracking-[0.1em]">
              <th className="px-4 py-3 text-left">TIME</th>
              <th className="px-4 py-3 text-left">ADMIN</th>
              <th className="px-4 py-3 text-left">ACTION</th>
              <th className="px-4 py-3 text-left">TARGET</th>
              <th className="px-4 py-3 text-left">PAYLOAD</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-2 font-mono">No entries.</td>
              </tr>
            )}
            {entries.map((e) => (
              <tr key={e.id} className="border-t-2 border-ink align-top">
                <td className="px-4 py-3 font-mono whitespace-nowrap">
                  {e.at.toISOString().replace('T', ' ').slice(0, 19)}
                </td>
                <td className="px-4 py-3 font-mono">{e.adminId ? adminMap.get(e.adminId) ?? e.adminId : '—'}</td>
                <td className="px-4 py-3 font-display font-bold">{e.action}</td>
                <td className="px-4 py-3 font-mono">{e.targetType ? `${e.targetType}:${e.targetId ?? ''}` : '—'}</td>
                <td className="px-4 py-3 font-mono text-bodyS">
                  <pre className="whitespace-pre-wrap max-w-[480px]">{e.payload ? JSON.stringify(e.payload, null, 2) : '—'}</pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav className="mt-6 flex gap-4 font-mono text-eyebrow uppercase tracking-[0.12em]">
        {page > 1 && (
          <a href={`/admin/audit?page=${page - 1}`} className="underline">← PREV</a>
        )}
        {entries.length === limit && (
          <a href={`/admin/audit?page=${page + 1}`} className="underline">NEXT →</a>
        )}
      </nav>
    </>
  );
}
```

Build, commit:
```bash
npm run build 2>&1 | tail -10
git add app/admin/\(authed\)/audit/page.tsx
git commit -m "feat(admin): add audit log viewer (superadmin only)"
```

---

## Task 10: Update admin dashboard cards + push

Modify `app/admin/(authed)/page.tsx` to swap "FORTHCOMING" tags on Bounty Management + Audit Log to live links. Also add navigation links in dashboard.

```tsx
// app/admin/(authed)/page.tsx
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';

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
        <Link href="/admin/bounties" className="block">
          <Card className="p-6 h-full hover:shadow-lg transition-shadow">
            <p className="font-mono text-eyebrow uppercase mb-3">MODULE</p>
            <h3 className="font-display font-black text-h3 leading-tight">BOUNTY MANAGEMENT</h3>
            <p className="text-bodyS text-ink-2 mt-2">Create, edit, pause, and retire grants on the public Bounty Board.</p>
            <div className="mt-4">
              <Tag>OPEN →</Tag>
            </div>
          </Card>
        </Link>

        <Card className="p-6">
          <p className="font-mono text-eyebrow uppercase mb-3">MODULE</p>
          <h3 className="font-display font-black text-h3 leading-tight">REVIEW QUEUE</h3>
          <p className="text-bodyS text-ink-2 mt-2">Approve, reject, or flag pending grant applications.</p>
          <div className="mt-4">
            <Tag variant="muted">FORTHCOMING — PLAN 5</Tag>
          </div>
        </Card>

        <Link href="/admin/audit" className="block">
          <Card className="p-6 h-full hover:shadow-lg transition-shadow">
            <p className="font-mono text-eyebrow uppercase mb-3">MODULE</p>
            <h3 className="font-display font-black text-h3 leading-tight">AUDIT LOG</h3>
            <p className="text-bodyS text-ink-2 mt-2">View administrative action history (superadmin only).</p>
            <div className="mt-4">
              <Tag>OPEN →</Tag>
            </div>
          </Card>
        </Link>
      </div>

      <p className="font-mono text-caption uppercase tracking-[0.12em] mt-12 text-ink-2">
        <Link href="/" className="underline underline-offset-2">↩ RETURN TO PUBLIC SITE</Link>
      </p>
    </>
  );
}
```

Final validation gate:
```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Commit + push (still on plan-3-db-admin-auth branch):
```bash
git add app/admin/\(authed\)/page.tsx
git commit -m "feat(admin): wire dashboard cards to bounty management + audit log"
git push origin plan-3-db-admin-auth
```

CI runs on the branch; PR #1 picks up the new commits automatically.

---

*End of Plan 4.*
