// app/bounties/page.tsx
import { PageShell } from '@/components/layout/PageShell';
import { BountyCard } from '@/components/ui/BountyCard';
import { SAMPLE_BOUNTIES } from '@/lib/sampleData';

export const metadata = { title: 'Bounty Board' };

export default function BountiesPage() {
  return (
    <PageShell schedule="Schedule R-7 · Form 042-B">
      <header className="mb-12">
        <p className="font-mono text-eyebrow uppercase mb-4">§02 — BOUNTY BOARD</p>
        <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
          BOUNTY BOARD
        </h1>
        <p className="text-bodyL mt-5 max-w-[720px]">
          A registry of curated discretionary grants currently open for application. Each posting
          constitutes a Statement of Work pursuant to Schedule R-7 §11(a). The Foundation
          reserves discretionary judgement on all approvals.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SAMPLE_BOUNTIES.map((bounty) => (
          <BountyCard key={bounty.id} bounty={bounty} />
        ))}
      </div>
    </PageShell>
  );
}
