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
