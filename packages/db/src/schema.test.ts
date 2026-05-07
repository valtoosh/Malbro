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
