'use server';

import { redirect } from 'next/navigation';
import { backendJson } from '@/lib/api';

export async function approveSubmission(formData: FormData): Promise<void> {
  const submissionId = formData.get('submissionId') as string;
  const payoutMarlbro = formData.get('payoutMarlbro') as string;
  const payoutSol = formData.get('payoutSol') as string;

  const body = await backendJson<{ ok: boolean; grantId?: string }>(
    `/admin/queue/${submissionId}/approve`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payoutMarlbro, payoutSol }),
    },
    { auth: 'admin' },
  );

  if (body.ok && body.grantId) {
    redirect(`/admin/queue/${submissionId}?ok=approved&grantId=${body.grantId}`);
  }
  redirect(`/admin/queue/${submissionId}?ok=approved`);
}

export async function rejectSubmission(formData: FormData): Promise<void> {
  const submissionId = formData.get('submissionId') as string;
  const reason = formData.get('reason') as string;

  await backendJson(
    `/admin/queue/${submissionId}/reject`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    },
    { auth: 'admin' },
  );

  redirect('/admin/queue?ok=rejected');
}

export async function markGrantExecuted(formData: FormData): Promise<void> {
  const grantId = formData.get('grantId') as string;
  const txSignature = formData.get('txSignature') as string;

  await backendJson(
    `/admin/queue/grants/${grantId}/execute`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txSignature }),
    },
    { auth: 'admin' },
  );

  redirect('/admin/queue?ok=executed');
}
