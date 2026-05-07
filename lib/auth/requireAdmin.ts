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
