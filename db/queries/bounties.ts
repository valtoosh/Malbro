// db/queries/bounties.ts
import { eq, desc } from 'drizzle-orm';
import { bounties, type Bounty, type NewBounty } from '../schema';

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
