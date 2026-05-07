// apps/backend/src/routes/routes.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import app from '../server';
import { encodeSession } from '@marlbro/shared/session';

beforeAll(() => {
  process.env.MAGIC_LINK_SECRET = 'a'.repeat(64);
});

describe('routes integration', () => {
  it('GET / returns ok', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it('GET /health returns DB-reachable', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it('GET /bounties returns array', async () => {
    const res = await app.request('/bounties');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.bounties)).toBe(true);
  });

  it('GET /wall returns array', async () => {
    const res = await app.request('/wall');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.posters)).toBe(true);
  });

  it('GET /bounties/:number not found returns 404', async () => {
    const res = await app.request('/bounties/99999');
    expect(res.status).toBe(404);
  });

  it('GET /submissions/:uid not found returns 404', async () => {
    const res = await app.request('/submissions/nonexistent-uid');
    expect(res.status).toBe(404);
  });

  it('GET /admin/audit without auth → 401', async () => {
    const res = await app.request('/admin/audit');
    expect(res.status).toBe(401);
  });

  it('GET /admin/audit with non-superadmin token → 403', async () => {
    const session = await encodeSession({ adminId: 'a', email: 'a@b.c', role: 'reviewer' });
    const res = await app.request('/admin/audit', {
      headers: { Authorization: `Bearer ${session}` },
    });
    expect(res.status).toBe(403);
  });

  it('GET /admin/bounties without auth → 401', async () => {
    const res = await app.request('/admin/bounties');
    expect(res.status).toBe(401);
  });

  it('GET /admin/queue without auth → 401', async () => {
    const res = await app.request('/admin/queue');
    expect(res.status).toBe(401);
  });

  it('GET /admin/bounties with reviewer token → 200', async () => {
    const session = await encodeSession({ adminId: 'test-id', email: 'reviewer@b.c', role: 'reviewer' });
    const res = await app.request('/admin/bounties', {
      headers: { Authorization: `Bearer ${session}` },
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.bounties)).toBe(true);
  });

  it('POST /admin/bounties with reviewer token → 403 (requires approver)', async () => {
    const session = await encodeSession({ adminId: 'test-id', email: 'reviewer@b.c', role: 'reviewer' });
    const res = await app.request('/admin/bounties', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(403);
  });

  it('POST /submissions without X-Marlbro-Applicant → 401', async () => {
    const res = await app.request('/submissions', { method: 'POST' });
    expect(res.status).toBe(401);
  });

  it('GET /twitter/login-url returns stub=true in stub mode', async () => {
    // No TWITTER_CLIENT_ID/SECRET set in test env → stub mode
    const res = await app.request('/twitter/login-url');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.stub).toBe(true);
  });
});
