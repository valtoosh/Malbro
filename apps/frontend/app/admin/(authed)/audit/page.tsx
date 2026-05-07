// apps/frontend/app/admin/(authed)/audit/page.tsx
import { backendJson } from '@/lib/api';

export const metadata = { title: 'Admin · Audit Log' };
export const dynamic = 'force-dynamic';

interface AuditEntry {
  id: string;
  at: string;
  adminId: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  payload: unknown;
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1);
  const limit = 50;

  const { entries, adminMap } = await backendJson<{
    entries: AuditEntry[];
    adminMap: Record<string, string>;
  }>(`/admin/audit?page=${page}`, {}, { auth: 'admin' });

  return (
    <>
      <p className="font-mono text-eyebrow uppercase mb-4">§99 — AUDIT LOG</p>
      <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em] mb-8">
        AUDIT LOG
      </h1>

      <div className="border-4 border-ink bg-paper">
        <table className="w-full text-bodyS">
          <thead className="bg-ink text-paper">
            <tr className="font-mono uppercase text-eyebrow tracking-[0.1em]">
              <th className="px-4 py-3 text-left">TIME</th>
              <th className="px-4 py-3 text-left">ADMIN</th>
              <th className="px-4 py-3 text-left">ACTION</th>
              <th className="px-4 py-3 text-left">TARGET</th>
              <th className="px-4 py-3 text-left">PAYLOAD</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-2 font-mono">
                  No entries.
                </td>
              </tr>
            )}
            {entries.map((e) => (
              <tr key={e.id} className="border-t-2 border-ink align-top">
                <td className="px-4 py-3 font-mono whitespace-nowrap">
                  {new Date(e.at).toISOString().replace('T', ' ').slice(0, 19)}
                </td>
                <td className="px-4 py-3 font-mono">
                  {e.adminId ? (adminMap[e.adminId] ?? e.adminId) : '—'}
                </td>
                <td className="px-4 py-3 font-display font-bold">{e.action}</td>
                <td className="px-4 py-3 font-mono">
                  {e.targetType ? `${e.targetType}:${e.targetId ?? ''}` : '—'}
                </td>
                <td className="px-4 py-3 font-mono text-bodyS">
                  <pre className="whitespace-pre-wrap max-w-[480px]">
                    {e.payload ? JSON.stringify(e.payload, null, 2) : '—'}
                  </pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav className="mt-6 flex gap-4 font-mono text-eyebrow uppercase tracking-[0.12em]">
        {page > 1 && (
          <a href={`/admin/audit?page=${page - 1}`} className="underline">
            ← PREV
          </a>
        )}
        {entries.length === limit && (
          <a href={`/admin/audit?page=${page + 1}`} className="underline">
            NEXT →
          </a>
        )}
      </nav>
    </>
  );
}
