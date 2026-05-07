// app/bounties/[number]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageShell } from '@/components/layout/PageShell';
import { Tag } from '@/components/ui/Tag';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getBountyByNumber, SAMPLE_BOUNTIES } from '@/lib/sampleData';

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export function generateStaticParams() {
  return SAMPLE_BOUNTIES.map((b) => ({ number: String(b.number) }));
}

export async function generateMetadata({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const bounty = getBountyByNumber(Number.parseInt(number, 10));
  if (!bounty) return { title: 'Bounty Not Found' };
  return { title: `Grant №${bounty.number} · ${bounty.title}` };
}

export default async function BountyDetailPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const n = Number.parseInt(number, 10);
  if (Number.isNaN(n)) notFound();
  const bounty = getBountyByNumber(n);
  if (!bounty) notFound();

  const left = bounty.maxClaims !== null ? Math.max(0, bounty.maxClaims - bounty.claimsUsed) : null;
  const isExhausted = bounty.maxClaims !== null && bounty.claimsUsed >= bounty.maxClaims;
  const claimsLabel = bounty.maxClaims === null
    ? 'UNLIMITED CLAIMS'
    : isExhausted
      ? 'EXHAUSTED'
      : `${left} CLAIM${left === 1 ? '' : 'S'} REMAINING`;

  return (
    <PageShell schedule={`Schedule R-7 · Form 042-B · Grant ${bounty.number}`}>
      <Link
        href="/bounties"
        className="font-mono text-eyebrow uppercase tracking-[0.12em] inline-block mb-6 underline underline-offset-[3px]"
      >
        ← BOUNTY BOARD
      </Link>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <article className="lg:col-span-8">
          <p className="font-mono text-eyebrow uppercase mb-4">GRANT №{bounty.number}</p>
          <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
            {bounty.title}
          </h1>
          <div className="flex flex-wrap gap-2 mt-6">
            <Tag variant={isExhausted ? 'alert' : 'default'}>{claimsLabel}</Tag>
            {bounty.deadline && <Tag>DEADLINE {bounty.deadline}</Tag>}
            {bounty.locationConstraint && <Tag variant="muted">{bounty.locationConstraint}</Tag>}
          </div>

          <section className="mt-10">
            <h2 className="font-mono text-eyebrow uppercase mb-3">STATEMENT OF WORK</h2>
            <p className="text-bodyL leading-relaxed">{bounty.brief}</p>
          </section>

          <section className="mt-10">
            <h2 className="font-mono text-eyebrow uppercase mb-3">SUBMISSION REQUIREMENTS</h2>
            <ol className="space-y-2 text-body list-none">
              <li>1. The applicant shall furnish a photograph satisfying the Statement of Work.</li>
              <li>2. The applicant shall publish a corresponding post on X tagging @marlbrotoken.</li>
              <li>3. The applicant shall provide a Solana wallet address for disbursement.</li>
              <li>4. The applicant shall complete Form 042-B (this instrument).</li>
            </ol>
          </section>
        </article>

        <aside className="lg:col-span-4">
          <Card className="bg-paper-2 sticky top-8">
            <div className="px-5 pt-5">
              <p className="font-mono text-eyebrow uppercase mb-2">DISBURSEMENT</p>
              <p className="font-display font-black text-h1 leading-none tracking-[-0.02em]">
                {formatNumber(bounty.payoutMarlbro)}
                <span className="block text-eyebrow font-mono tracking-[0.1em] mt-2 opacity-70">$MARLBRO</span>
              </p>
              {bounty.payoutSol > 0 && (
                <p className="font-display font-black text-h2 leading-none tracking-[-0.02em] mt-4 pt-4 border-t-2 border-ink">
                  +{bounty.payoutSol}
                  <span className="block text-eyebrow font-mono tracking-[0.1em] mt-2 opacity-70">SOL</span>
                </p>
              )}
            </div>
            <div className="px-5 pt-5 pb-5 mt-5 border-t-2 border-ink">
              {isExhausted ? (
                <Button disabled className="w-full">FILLED</Button>
              ) : (
                <Button asChild className="w-full">
                  <Link href={`/apply?bounty=${bounty.number}`}>CLAIM THIS GRANT</Link>
                </Button>
              )}
            </div>
          </Card>
        </aside>
      </div>
    </PageShell>
  );
}
