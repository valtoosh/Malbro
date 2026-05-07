'use server';

import { redirect } from 'next/navigation';
import { backendJson } from '@/lib/api';

export interface ActionResult {
  ok: boolean;
  errors?: Record<string, string>;
}

export async function createBountyAction(formData: FormData): Promise<ActionResult> {
  const payload = {
    title: formData.get('title'),
    brief: formData.get('brief'),
    payoutMarlbro: formData.get('payoutMarlbro'),
    payoutSol: formData.get('payoutSol'),
    maxClaims: formData.get('maxClaims') || null,
    deadline: formData.get('deadline') || null,
    locationConstraint: formData.get('locationConstraint') || null,
    status: formData.get('status'),
  };

  let body: { ok: boolean; bounty?: { id: string }; errorCode?: string; message?: string };
  try {
    body = await backendJson(
      '/admin/bounties',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      { auth: 'admin' },
    );
  } catch (err: unknown) {
    const apiErr = err as { message?: string };
    return { ok: false, errors: { _form: apiErr.message ?? 'Server error' } };
  }

  if (!body.ok || !body.bounty) {
    return { ok: false, errors: { _form: body.message ?? 'Failed to create bounty' } };
  }

  redirect(`/admin/bounties/${body.bounty.id}`);
}
