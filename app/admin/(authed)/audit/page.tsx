// app/admin/(authed)/audit/page.tsx
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { listAudit } from '@/db/queries/audit';
import { admins } from '@/db/schema';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export const metadata = { title: 'Admin · Audit Log' };
export const dynamic = 'force-dynamic';

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdmin('superadmin');
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1);
  const limit = 50;
  const offset = (page - 1) * limit;

  const db = await getDb();
  const entries = await listAudit(db, { limit, offset });

  // Build a map of admin_id → email for display
  const adminIds = Array.from(new Set(entries.map((e) => e.adminId).filter((x): x is string => !!x)));
  const adminMap = new Map<string, string>();
  for (const id of adminIds) {
    const [a] = await db.select().from(admins).where(eq(admins.id, id)).limit(1);
    if (a) adminMap.set(a.id, a.email);
  }

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
                <td colSpan={5} className="px-4 py-8 text-center text-ink-2 font-mono">No entries.</td>
              </tr>
            )}
            {entries.map((e) => (
              <tr key={e.id} className="border-t-2 border-ink align-top">
                <td className="px-4 py-3 font-mono whitespace-nowrap">
                  {e.at.toISOString().replace('T', ' ').slice(0, 19)}
                </td>
                <td className="px-4 py-3 font-mono">{e.adminId ? adminMap.get(e.adminId) ?? e.adminId : '—'}</td>
                <td className="px-4 py-3 font-display font-bold">{e.action}</td>
                <td className="px-4 py-3 font-mono">{e.targetType ? `${e.targetType}:${e.targetId ?? ''}` : '—'}</td>
                <td className="px-4 py-3 font-mono text-bodyS">
                  <pre className="whitespace-pre-wrap max-w-[480px]">{e.payload ? JSON.stringify(e.payload, null, 2) : '—'}</pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav className="mt-6 flex gap-4 font-mono text-eyebrow uppercase tracking-[0.12em]">
        {page > 1 && (
          <a href={`/admin/audit?page=${page - 1}`} className="underline">← PREV</a>
        )}
        {entries.length === limit && (
          <a href={`/admin/audit?page=${page + 1}`} className="underline">NEXT →</a>
        )}
      </nav>
    </>
  );
}
