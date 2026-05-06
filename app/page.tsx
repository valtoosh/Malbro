// app/page.tsx
import Link from 'next/link';
import { PageShell } from '@/components/layout/PageShell';
import { Card } from '@/components/ui/Card';

export default function HomePage() {
  return (
    <PageShell>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section className="lg:col-span-5">
          <p className="font-mono text-eyebrow uppercase mb-4">§01 — APPLICATION</p>
          <h1 className="font-display font-black text-h1 lg:text-d2 leading-[0.95] tracking-[-0.04em]">
            RIDE FOR THE
            <br />
            <span className="text-marlbro">MARLBRO</span>.
          </h1>
          <p className="text-bodyL mt-5 max-w-[520px] text-ink-2">
            The Foundation provides discretionary subsidies, denominated in $MARLBRO and SOL, to
            applicants who furnish documentation of authentic engagement with the namesake article.
            Pursuant to Schedule R-7, all submissions are subject to manual review.
          </p>
          <div className="flex gap-4 mt-8 flex-wrap">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center px-[22px] py-[14px] font-display text-body uppercase tracking-[0.04em] font-black border-4 border-ink shadow-md transition-[transform,box-shadow] duration-[80ms] ease-out hover:shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] bg-marlbro text-paper"
            >
              Apply for grant
            </Link>
            <Link
              href="/bounties"
              className="inline-flex items-center justify-center px-[22px] py-[14px] font-display text-body uppercase tracking-[0.04em] font-black border-4 border-ink shadow-md transition-[transform,box-shadow] duration-[80ms] ease-out hover:shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] bg-paper text-ink"
            >
              View bounties
            </Link>
          </div>
        </section>

        <section className="lg:col-span-7">
          <Card variant="poster" className="aspect-[4/5] flex items-center justify-center">
            <p className="font-mono text-caption uppercase text-ink/40">
              Figure 1 — to be furnished
            </p>
          </Card>
        </section>
      </div>
    </PageShell>
  );
}
