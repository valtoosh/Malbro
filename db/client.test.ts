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
