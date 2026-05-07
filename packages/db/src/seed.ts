// db/seed.ts
import { count } from 'drizzle-orm';
import { admins, bounties } from './schema';
import { SAMPLE_BOUNTIES } from '@marlbro/shared/sampleData';

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
