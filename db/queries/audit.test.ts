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
