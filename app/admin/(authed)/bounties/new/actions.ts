'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { headers } from 'next/headers';
import { getDb } from '@/db/client';
import { createBounty } from '@/db/queries/bounties';
import { recordAudit } from '@/db/queries/audit';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { hashIp } from '@/lib/ip';

const inputSchema = z.object({
  title: z.string().min(1).max(200),
  brief: z.string().min(1).max(5000),
  payoutMarlbro: z.string().regex(/^\d+(\.\d+)?$/, 'Must be a numeric value'),
  payoutSol: z.string().regex(/^\d+(\.\d+)?$/, 'Must be a numeric value'),
  maxClaims: z.string().optional(),
  deadline: z.string().optional(),
  locationConstraint: z.string().optional(),
  status: z.enum(['draft', 'live', 'paused']),
});

export interface ActionResult {
  ok: boolean;
  errors?: Record<string, string>;
}

export async function createBountyAction(formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin('approver');

  const parsed = inputSchema.safeParse({
    title: formData.get('title'),
    brief: formData.get('brief'),
    payoutMarlbro: formData.get('payoutMarlbro'),
    payoutSol: formData.get('payoutSol'),
    maxClaims: formData.get('maxClaims') || undefined,
    deadline: formData.get('deadline') || undefined,
    locationConstraint: formData.get('locationConstraint') || undefined,
    status: formData.get('status'),
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      errors[issue.path.join('.')] = issue.message;
    }
    return { ok: false, errors };
  }

  const db = await getDb();
  const created = await createBounty(db, {
    title: parsed.data.title,
    brief: parsed.data.brief,
    payoutMarlbro: parsed.data.payoutMarlbro,
    payoutSol: parsed.data.payoutSol,
    maxClaims: parsed.data.maxClaims ? Number.parseInt(parsed.data.maxClaims, 10) : null,
    deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
    locationConstraint: parsed.data.locationConstraint ?? null,
    status: parsed.data.status,
    createdBy: session.adminId,
  });

  const h = await headers();
  await recordAudit(db, {
    adminId: session.adminId,
    action: 'bounty_create',
    targetType: 'bounty',
    targetId: created.id,
    payload: { number: created.number, title: created.title, status: created.status },
    ipHash: hashIp(h.get('x-forwarded-for') ?? 'unknown'),
  });

  redirect(`/admin/bounties/${created.id}`);
}
