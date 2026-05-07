// app/admin/login/actions.ts
'use server';

import { sendMagicLink } from '@/lib/auth/sendMagicLink';
import { z } from 'zod';

const inputSchema = z.object({
  email: z.string().email('A valid email address must be furnished'),
});

export interface ActionResult {
  ok: boolean;
  message: string;
}

export async function requestMagicLink(formData: FormData): Promise<ActionResult> {
  const parsed = inputSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  // Always return success to avoid email enumeration. Real admin check
  // happens at verify time.
  await sendMagicLink(parsed.data.email);
  return {
    ok: true,
    message:
      'If the furnished address is on file, a single-use access instrument has been dispatched. The instrument expires in 15 minutes.',
  };
}
