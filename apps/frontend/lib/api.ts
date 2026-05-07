// apps/frontend/lib/api.ts
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';
const SESSION_COOKIE = 'marlbro_session';
const APPLICANT_COOKIE = 'marlbro_applicant';

export interface ApiError {
  status: number;
  errorCode?: string;
  message?: string;
  body: unknown;
}

export async function backendFetch(
  path: string,
  init: RequestInit = {},
  options: { auth?: 'admin' | 'applicant' | 'none' } = { auth: 'none' },
): Promise<Response> {
  const headers = new Headers(init.headers as HeadersInit);

  if (options.auth === 'admin') {
    const jar = await cookies();
    const session = jar.get(SESSION_COOKIE)?.value;
    if (session) headers.set('Authorization', `Bearer ${session}`);
  } else if (options.auth === 'applicant') {
    const jar = await cookies();
    const applicant = jar.get(APPLICANT_COOKIE)?.value;
    if (applicant) headers.set('X-Marlbro-Applicant', applicant);
  }

  return fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });
}

export async function backendJson<T>(
  path: string,
  init: RequestInit = {},
  options: { auth?: 'admin' | 'applicant' | 'none' } = { auth: 'none' },
): Promise<T> {
  const res = await backendFetch(path, init, options);
  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    const err: ApiError = { status: res.status, body };
    if (typeof body === 'object' && body !== null) {
      const b = body as Record<string, unknown>;
      if (typeof b.errorCode === 'string') err.errorCode = b.errorCode;
      if (typeof b.message === 'string') err.message = b.message;
    }
    throw err;
  }
  return (await res.json()) as T;
}

export const APPLICANT_COOKIE_NAME = APPLICANT_COOKIE;
export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export const BACKEND_BASE_URL = BACKEND_URL;
