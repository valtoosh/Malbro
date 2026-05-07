// apps/frontend/app/admin/signout/route.ts
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE_NAME } from '@/lib/api';

export async function POST() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE_NAME);
  redirect('/admin/login');
}
