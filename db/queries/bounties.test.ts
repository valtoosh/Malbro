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
