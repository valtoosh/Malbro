// apps/frontend/app/admin/(authed)/bounties/page.tsx
import Link from 'next/link';
import { Button, Tag } from '@marlbro/ui';
import { backendJson } from '@/lib/api';

export const metadata = { title: 'Admin · Bounty Management' };
export const dynamic = 'force-dynamic';

interface AdminBounty {
  id: string;
  number: number;
  title: string;
  payoutMarlbro: string | number;
  payoutSol: string | number;
  claimsUsed: number;
  maxClaims: number | null;
  status: string;
}

export default async function AdminBountiesListPage() {
  const { bounties: list } = await backendJson<{ bounties: AdminBounty[] }>(
    '/admin/bounties',
    {},
    { auth: 'admin' },
  );

  return (
    <>
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <p className="font-mono text-eyebrow uppercase mb-2">§01 — BOUNTY MANAGEMENT</p>
          <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
            BOUNTIES
          </h1>
        </div>
        <Button asChild>
          <Link href="/admin/bounties/new">+ NEW BOUNTY</Link>
        </Button>
      </div>

      <div className="border-4 border-ink bg-paper">
        <table className="w-full text-bodyS">
          <thead className="bg-ink text-paper">
            <tr className="font-mono uppercase text-eyebrow tracking-[0.1em]">
              <th className="px-4 py-3 text-left">№</th>
              <th className="px-4 py-3 text-left">TITLE</th>
              <th className="px-4 py-3 text-left">PAYOUT</th>
              <th className="px-4 py-3 text-left">CLAIMS</th>
              <th className="px-4 py-3 text-left">STATUS</th>
              <th className="px-4 py-3 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-2 font-mono">
                  No bounties recorded.
                </td>
              </tr>
            )}
            {list.map((b) => (
              <tr key={b.id} className="border-t-2 border-ink">
                <td className="px-4 py-3 font-mono">№{b.number}</td>
                <td className="px-4 py-3 font-display font-bold">{b.title}</td>
                <td className="px-4 py-3 font-mono">
                  {Number(b.payoutMarlbro).toLocaleString()} $M
                  {Number(b.payoutSol) > 0 ? ` + ${b.payoutSol} SOL` : ''}
                </td>
                <td className="px-4 py-3 font-mono">
                  {b.claimsUsed}/{b.maxClaims ?? '∞'}
                </td>
                <td className="px-4 py-3">
                  <Tag variant={b.status === 'live' ? 'default' : 'muted'}>
                    {b.status.toUpperCase()}
                  </Tag>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/bounties/${b.id}`}
                    className="font-mono text-eyebrow uppercase tracking-[0.1em] underline"
                  >
                    EDIT
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
