// app/admin/(authed)/layout.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { decodeSession, SESSION_COOKIE, type SessionPayload } from '@/lib/auth/session';

export default async function AuthedAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await currentAdmin();
  if (!session) {
    redirect('/admin/login');
  }
  return <AdminFrame session={session}>{children}</AdminFrame>;
}

async function currentAdmin(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return await decodeSession(token);
  } catch {
    return null;
  }
}

function AdminFrame({ session, children }: { session: SessionPayload; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <header className="bg-ink text-paper border-b-4 border-ink px-7 py-3.5 flex justify-between items-center font-mono text-eyebrow uppercase tracking-[0.12em] flex-wrap gap-3">
        <span>The Marlbro Foundation · Administrative Console</span>
        <span className="flex items-center gap-4">
          <span>{session.email}</span>
          <span className="bg-marlbro text-paper px-2 py-0.5">{session.role.toUpperCase()}</span>
          <form action="/admin/signout" method="post">
            <button type="submit" className="underline underline-offset-2 hover:text-marlbro">
              SIGN OUT
            </button>
          </form>
        </span>
      </header>
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-8 md:px-12 py-10">{children}</main>
    </div>
  );
}
