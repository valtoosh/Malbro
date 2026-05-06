// app/apply/page.tsx
import { PageShell } from '@/components/layout/PageShell';
import { Tag } from '@/components/ui/Tag';

export const metadata = { title: 'Open Grant Application' };

export default function ApplyPage() {
  return (
    <PageShell schedule="Schedule R-7 · Form 042-A">
      <p className="font-mono text-eyebrow uppercase mb-4">§03 — OPEN GRANT</p>
      <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
        FORM 042-A · OPEN GRANT APPLICATION
      </h1>
      <p className="text-bodyL mt-5 max-w-[720px]">
        The standard application instrument for the Open Grant lane. The applicant shall furnish
        documentation of an authenticated transaction.
      </p>
      <div className="mt-8">
        <Tag variant="muted">FORTHCOMING — PLAN 3 IMPLEMENTATION</Tag>
      </div>
    </PageShell>
  );
}
