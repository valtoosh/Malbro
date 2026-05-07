// app/page.tsx
import Link from 'next/link';
import { PageShell } from '@/components/layout/PageShell';
import { Card } from '@/components/ui/Card';
import { BountyCard } from '@/components/ui/BountyCard';
import { Button } from '@/components/ui/Button';
import { ChevronDivider } from '@/components/ui/ChevronDivider';
import { SAMPLE_BOUNTIES } from '@/lib/sampleData';

export default function HomePage() {
  const featured = SAMPLE_BOUNTIES.filter((b) => b.maxClaims !== null).slice(0, 3);

  return (
    <PageShell>
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5">
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
            <Button asChild>
              <Link href="/apply">Apply for grant</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/bounties">View bounties</Link>
            </Button>
          </div>
          <p className="font-mono text-caption uppercase tracking-[0.12em] mt-6 text-ink-2">
            CONTRACT ADDRESS · TBD AT LAUNCH
          </p>
        </div>

        <div className="lg:col-span-7">
          <Card variant="poster" className="aspect-[4/5] flex items-center justify-center bg-marlbro halftone-overlay relative">
            <p className="font-mono text-caption uppercase text-paper/60 z-10 relative">
              Figure 1 — to be furnished
            </p>
          </Card>
        </div>
      </section>

      <ChevronDivider className="mt-20 mb-16 h-[20px]" />

      <section>
        <header className="mb-8 flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="font-mono text-eyebrow uppercase mb-3">§02 — BOUNTY BOARD · FEATURED</p>
            <h2 className="font-display font-black text-h2 lg:text-h1 leading-[1.05] tracking-[-0.02em]">
              CURRENT GRANTS UNDER FOUNDATION REVIEW
            </h2>
          </div>
          <Link
            href="/bounties"
            className="font-mono text-eyebrow uppercase tracking-[0.12em] underline underline-offset-[3px]"
          >
            VIEW ALL BOUNTIES →
          </Link>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featured.map((b) => (
            <BountyCard key={b.id} bounty={b} />
          ))}
        </div>
      </section>

      <section className="mt-20 bg-ink text-paper p-12 border-4 border-ink shadow-lg">
        <p className="font-mono text-eyebrow uppercase mb-3 text-paper/60">§03 — OPEN GRANT</p>
        <h2 className="font-display font-black text-h2 lg:text-h1 leading-[1.05] tracking-[-0.02em] max-w-[680px]">
          Apply for the standard subsidy in three steps.
        </h2>
        <ol className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 list-none">
          <li>
            <p className="font-mono text-caption uppercase tracking-[0.12em] text-paper/60">STEP 1</p>
            <p className="font-display font-bold text-bodyL mt-2 leading-tight">
              Procure one (1) pack of Marlboro Reds at a lawful retail establishment.
            </p>
          </li>
          <li>
            <p className="font-mono text-caption uppercase tracking-[0.12em] text-paper/60">STEP 2</p>
            <p className="font-display font-bold text-bodyL mt-2 leading-tight">
              Publish a corresponding photograph and post on X tagging @marlbrotoken.
            </p>
          </li>
          <li>
            <p className="font-mono text-caption uppercase tracking-[0.12em] text-paper/60">STEP 3</p>
            <p className="font-display font-bold text-bodyL mt-2 leading-tight">
              File Form 042-A. The Foundation issues 5,000 $MARLBRO upon approval.
            </p>
          </li>
        </ol>
        <div className="mt-10">
          <Button asChild>
            <Link href="/apply">FILE FORM 042-A</Link>
          </Button>
        </div>
      </section>
    </PageShell>
  );
}
