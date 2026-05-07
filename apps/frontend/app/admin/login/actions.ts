'use server';

import { BACKEND_BASE_URL } from '@/lib/api';

export interface ActionResult {
  ok: boolean;
  message: string;
}

export async function requestMagicLink(formData: FormData): Promise<ActionResult> {
  const email = formData.get('email');
  if (typeof email !== 'string') return { ok: false, message: 'Email required' };

  try {
    const res = await fetch(`${BACKEND_BASE_URL}/admin/login/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const body = (await res.json()) as { ok: boolean; message: string };
    return body;
  } catch {
    return { ok: false, message: 'Service unavailable. Please try again.' };
  }
}
