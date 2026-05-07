// apps/frontend/app/bounties/page.tsx
import { PageShell, BountyCard } from '@marlbro/ui';
import { backendJson } from '@/lib/api';
import type { Bounty } from '@marlbro/shared/sampleData';

export const metadata = { title: 'Bounty Board' };
export const dynamic = 'force-dynamic';

interface DbBountyShape {
  id: string;
  number: number;
  title: string;
  brief: string;
  payoutMarlbro: string | number;
  payoutSol: string | number;
  maxClaims: number | null;
  claimsUsed: number;
  status: string;
  deadline: string | null;
  locationConstraint: string | null;
}

function dbToView(b: DbBountyShape): Bounty {
  return {
    id: b.id,
    number: b.number,
    title: b.title,
    brief: b.brief,
    payoutMarlbro: Number(b.payoutMarlbro),
    payoutSol: Number(b.payoutSol),
    maxClaims: b.maxClaims,
    claimsUsed: b.claimsUsed,
    status: b.status === 'live' ? 'live' : (b.status as 'paused' | 'exhausted' | 'expired'),
    deadline: b.deadline ? new Date(b.deadline).toISOString().slice(0, 10) : null,
    locationConstraint: b.locationConstraint,
  };
}

export default async function BountiesPage() {
  const { bounties: list } = await backendJson<{ bounties: DbBountyShape[] }>('/bounties');
  const bounties = list.map(dbToView);

  return (
    <PageShell schedule="Schedule R-7 · Form 042-B">
      <header className="mb-12">
        <p className="font-mono text-eyebrow uppercase mb-4">§02 — BOUNTY BOARD</p>
        <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
          BOUNTY BOARD
        </h1>
        <p className="text-bodyL mt-5 max-w-[720px]">
          A registry of curated discretionary grants currently open for application. Each posting
          constitutes a Statement of Work pursuant to Schedule R-7 §11(a).
        </p>
      </header>
      {bounties.length === 0 ? (
        <p className="font-mono text-body-s text-ink-2">
          The Foundation has no active grants at this time. Pursuant to Schedule R-7, please consult the Open Grant lane.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bounties.map((bounty) => (
            <BountyCard key={bounty.id} bounty={bounty} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
