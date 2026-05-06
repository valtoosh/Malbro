// app/bounties/page.tsx
import { PageShell } from '@/components/layout/PageShell';
import { Tag } from '@/components/ui/Tag';

export const metadata = { title: 'Bounty Board' };

export default function BountiesPage() {
  return (
    <PageShell schedule="Schedule R-7 · Form 042-B">
      <p className="font-mono text-eyebrow uppercase mb-4">§02 — BOUNTY BOARD</p>
      <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
        BOUNTY BOARD
      </h1>
      <p className="text-bodyL mt-5 max-w-[720px]">
        A registry of curated discretionary grants currently open for application. Each posting
        constitutes a Statement of Work pursuant to Schedule R-7 §11(a).
      </p>
      <div className="mt-8">
        <Tag variant="muted">FORTHCOMING — PLAN 2 IMPLEMENTATION</Tag>
      </div>
    </PageShell>
  );
}
