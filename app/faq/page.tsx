// app/faq/page.tsx
import { PageShell } from '@/components/layout/PageShell';
import { Tag } from '@/components/ui/Tag';

export const metadata = { title: 'Frequently Asked Questions' };

export default function FaqPage() {
  return (
    <PageShell schedule="Schedule R-7 · Disclosure §F">
      <p className="font-mono text-eyebrow uppercase mb-4">§06 — FREQUENTLY ASKED QUESTIONS</p>
      <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
        FREQUENTLY ASKED QUESTIONS
      </h1>
      <p className="text-bodyL mt-5 max-w-[720px]">
        General disclosures. The information furnished herein does not constitute financial advice,
        tax advice, or medical advice.
      </p>
      <div className="mt-8">
        <Tag variant="muted">FORTHCOMING — PLAN 2 IMPLEMENTATION</Tag>
      </div>
    </PageShell>
  );
}
