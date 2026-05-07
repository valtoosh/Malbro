'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { BACKEND_BASE_URL, APPLICANT_COOKIE_NAME } from '@/lib/api';

export async function submitApplication(formData: FormData): Promise<void> {
  const jar = await cookies();
  const applicant = jar.get(APPLICANT_COOKIE_NAME)?.value;
  if (!applicant) {
    redirect('/apply?error=NO_APPLICANT');
  }

  const res = await fetch(`${BACKEND_BASE_URL}/submissions`, {
    method: 'POST',
    headers: {
      'X-Marlbro-Applicant': applicant,
    },
    body: formData,
  });

  const body = (await res.json()) as {
    ok: boolean;
    publicUid?: string;
    errorCode?: string;
    message?: string;
  };

  if (!body.ok || !body.publicUid) {
    const params = new URLSearchParams();
    params.set('applyError', body.errorCode ?? 'UNKNOWN');
    if (body.message) params.set('applyMessage', body.message);
    redirect(`/apply?${params.toString()}`);
  }

  redirect(`/apply/confirmation/${body.publicUid}`);
}
