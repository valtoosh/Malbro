// apps/frontend/app/admin/verify/page.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { PageShell, Stamp, Button } from '@marlbro/ui';
import { BACKEND_BASE_URL, SESSION_COOKIE_NAME } from '@/lib/api';

export const metadata = { title: 'Verifying Access' };

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) return renderError('No instrument was furnished with this request.');

  let body: { ok: boolean; session?: string; errorCode?: string };
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/admin/login/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    body = (await res.json()) as typeof body;
  } catch {
    return renderError('Verification service unavailable.');
  }

  if (!body.ok || !body.session) {
    return renderError(
      body.errorCode === 'NO_ADMIN'
        ? 'No active administrative record exists for the furnished address. Pursuant to Schedule R-7 §11(d), access is denied.'
        : 'The furnished instrument is invalid or has expired.',
    );
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, body.session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  });

  redirect('/admin');
}

function renderError(message: string) {
  return (
    <PageShell schedule="Schedule R-7 · Form 042-S · Access Denied">
      <div className="max-w-[640px] mx-auto pt-8">
        <p className="font-mono text-eyebrow uppercase mb-4">§07 — ACCESS DENIED</p>
        <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
          ACCESS DENIED.
        </h1>
        <p className="text-bodyL mt-5">{message}</p>
        <div className="mt-8 flex items-center gap-6">
          <Button asChild>
            <Link href="/admin/login">REQUEST NEW INSTRUMENT</Link>
          </Button>
          <Stamp label="ACCESS DENIED" rotate={-9} />
        </div>
      </div>
    </PageShell>
  );
}
