// app/admin/signout/route.ts
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/lib/auth/session';

export async function POST() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect('/admin/login');
}
