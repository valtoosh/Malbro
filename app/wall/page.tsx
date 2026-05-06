// app/wall/page.tsx
import { PageShell } from '@/components/layout/PageShell';
import { Tag } from '@/components/ui/Tag';

export const metadata = { title: 'Wall of Grants' };

export default function WallPage() {
  return (
    <PageShell schedule="Schedule R-7 · Form 042-W">
      <p className="font-mono text-eyebrow uppercase mb-4">§04 — WALL OF GRANTS</p>
      <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
        WALL OF GRANTS
      </h1>
      <p className="text-bodyL mt-5 max-w-[720px]">
        A perpetually-updated public registry of disbursed grants. Each entry reflects a
        successfully executed disbursement on the Solana ledger.
      </p>
      <div className="mt-8">
        <Tag variant="muted">FORTHCOMING — PLAN 5 IMPLEMENTATION</Tag>
      </div>
    </PageShell>
  );
}
