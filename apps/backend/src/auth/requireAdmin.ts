// apps/backend/src/auth/requireAdmin.ts
import type { AdminRole } from './session';

const ROLE_RANK: Record<AdminRole, number> = {
  reviewer: 0,
  approver: 1,
  superadmin: 2,
};

export function hasRequiredRole(actual: AdminRole, required: AdminRole): boolean {
  return ROLE_RANK[actual] >= ROLE_RANK[required];
}
