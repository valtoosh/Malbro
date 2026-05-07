// lib/auth/sendMagicLink.ts
import { generateMagicLinkToken } from './magicLink';
import { Resend } from 'resend';

export interface SendResult {
  delivered: 'resend' | 'console';
  url: string;
}

export async function sendMagicLink(email: string): Promise<SendResult> {
  const token = await generateMagicLinkToken(email);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const url = `${baseUrl}/admin/verify?token=${encodeURIComponent(token)}`;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(
      `\n[Marlbro Foundation] Magic link for ${email}:\n  ${url}\n` +
        `  (Email delivery not configured — set RESEND_API_KEY to send via Resend)\n`,
    );
    return { delivered: 'console', url };
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM ?? 'Marlbro Foundation <onboarding@resend.dev>';
  await resend.emails.send({
    from,
    to: email,
    subject: 'The Marlbro Foundation — Administrative Access',
    html:
      `<p>Pursuant to Schedule R-7 §11(c), the bearer of this instrument is granted single-use ` +
      `administrative access to the Foundation's portal.</p>` +
      `<p><a href="${url}">${url}</a></p>` +
      `<p style="font-family: monospace; font-size: 12px; color: #666;">` +
      `LINK EXPIRES IN 15 MINUTES. NOT TRANSFERABLE. SCHEDULE R-7 §11(c).</p>`,
    text: `Marlbro Foundation administrative access:\n\n${url}\n\nLink expires in 15 minutes.`,
  });
  return { delivered: 'resend', url };
}
