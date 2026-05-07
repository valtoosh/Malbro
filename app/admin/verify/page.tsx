// app/admin/verify/page.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { PageShell } from '@/components/layout/PageShell';
import { Stamp } from '@/components/ui/Stamp';
import { Button } from '@/components/ui/Button';
import { verifyMagicLinkToken } from '@/lib/auth/magicLink';
import { encodeSession, SESSION_COOKIE } from '@/lib/auth/session';
import { getDb } from '@/db/client';
import { admins } from '@/db/schema';

export const metadata = { title: 'Verifying Access' };

interface SearchParams {
  token?: string;
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return renderError('No instrument was furnished with this request.');
  }

  let email: string;
  try {
    const verified = await verifyMagicLinkToken(token);
    email = verified.email.toLowerCase();
  } catch {
    return renderError('The furnished instrument is invalid or has expired.');
  }

  const db = await getDb();
  const [admin] = await db.select().from(admins).where(eq(admins.email, email)).limit(1);

  if (!admin || !admin.active) {
    return renderError(
      'No active administrative record exists for the furnished address. Pursuant to Schedule R-7 §11(d), access is denied.',
    );
  }

  const session = await encodeSession({
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, session, {
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
