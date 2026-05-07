'use server';

import { redirect } from 'next/navigation';
import { backendJson } from '@/lib/api';

export interface ActionResult {
  ok: boolean;
  errors?: Record<string, string>;
}

export async function updateBountyAction(formData: FormData): Promise<ActionResult> {
  const id = formData.get('id') as string;
  if (!id) return { ok: false, errors: { _form: 'Missing bounty ID' } };

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
      `/admin/bounties/${id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      { auth: 'admin' },
    );
  } catch (err: unknown) {
    const apiErr = err as { message?: string };
    return { ok: false, errors: { _form: apiErr.message ?? 'Server error' } };
  }

  if (!body.ok) {
    return { ok: false, errors: { _form: body.message ?? 'Failed to update bounty' } };
  }

  redirect(`/admin/bounties/${id}`);
}
