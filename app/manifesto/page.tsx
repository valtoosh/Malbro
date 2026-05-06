// app/manifesto/page.tsx
import { PageShell } from '@/components/layout/PageShell';
import { Tag } from '@/components/ui/Tag';

export const metadata = { title: 'Manifesto' };

export default function ManifestoPage() {
  return (
    <PageShell schedule="Schedule R-7 · Disclosure §14">
      <p className="font-mono text-eyebrow uppercase mb-4">§05 — MANIFESTO</p>
      <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
        ON THE MATTER OF GLORY.
      </h1>
      <p className="text-bodyL mt-5 max-w-[720px]">
        The Foundation observes a generational decline in masculine carriage, attributable in part
        to the substitution of the cigarette by the rechargeable nicotine vaporizer — an article of
        demonstrably non-Marlbro-compatible aesthetic.
      </p>
      <div className="mt-8">
        <Tag variant="muted">FORTHCOMING — FULL TEXT IN PLAN 2</Tag>
      </div>
    </PageShell>
  );
}
