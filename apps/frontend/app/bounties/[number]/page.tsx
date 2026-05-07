// apps/frontend/app/bounties/[number]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageShell, Tag, Button, Card } from '@marlbro/ui';
import { backendJson } from '@/lib/api';
import type { ApiError } from '@/lib/api';

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

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  try {
    const { bounty: b } = await backendJson<{ bounty: DbBountyShape }>(
      '/bounties/' + number,
    );
    return { title: `Grant №${b.number} · ${b.title}` };
  } catch {
    return { title: 'Bounty Not Found' };
  }
}

export default async function BountyDetailPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const n = Number.parseInt(number, 10);
  if (Number.isNaN(n)) notFound();

  let b: DbBountyShape;
  try {
    const data = await backendJson<{ bounty: DbBountyShape }>('/bounties/' + n);
    b = data.bounty;
  } catch (err) {
    const apiErr = err as ApiError;
    if (apiErr.status === 404) notFound();
    throw err;
  }

  const left = b.maxClaims !== null ? Math.max(0, b.maxClaims - b.claimsUsed) : null;
  const isExhausted = b.maxClaims !== null && b.claimsUsed >= b.maxClaims;
  const claimsLabel =
    b.maxClaims === null
      ? 'UNLIMITED CLAIMS'
      : isExhausted
        ? 'EXHAUSTED'
        : `${left} CLAIM${left === 1 ? '' : 'S'} REMAINING`;
  const payoutMarlbroNum = Number(b.payoutMarlbro);
  const payoutSolNum = Number(b.payoutSol);
  const deadlineISO = b.deadline ? new Date(b.deadline).toISOString().slice(0, 10) : null;

  return (
    <PageShell schedule={`Schedule R-7 · Form 042-B · Grant ${b.number}`}>
      <Link
        href="/bounties"
        className="font-mono text-eyebrow uppercase tracking-[0.12em] inline-block mb-6 underline underline-offset-[3px]"
      >
        ← BOUNTY BOARD
      </Link>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <article className="lg:col-span-8">
          <p className="font-mono text-eyebrow uppercase mb-4">GRANT №{b.number}</p>
          <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
            {b.title}
          </h1>
          <div className="flex flex-wrap gap-2 mt-6">
            <Tag variant={isExhausted ? 'alert' : 'default'}>{claimsLabel}</Tag>
            {deadlineISO && <Tag>DEADLINE {deadlineISO}</Tag>}
            {b.locationConstraint && <Tag variant="muted">{b.locationConstraint}</Tag>}
          </div>
          <section className="mt-10">
            <h2 className="font-mono text-eyebrow uppercase mb-3">STATEMENT OF WORK</h2>
            <p className="text-bodyL leading-relaxed whitespace-pre-wrap">{b.brief}</p>
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
                {formatNumber(payoutMarlbroNum)}
                <span className="block text-eyebrow font-mono tracking-[0.1em] mt-2 opacity-70">
                  $MARLBRO
                </span>
              </p>
              {payoutSolNum > 0 && (
                <p className="font-display font-black text-h2 leading-none tracking-[-0.02em] mt-4 pt-4 border-t-2 border-ink">
                  +{payoutSolNum}
                  <span className="block text-eyebrow font-mono tracking-[0.1em] mt-2 opacity-70">
                    SOL
                  </span>
                </p>
              )}
            </div>
            <div className="px-5 pt-5 pb-5 mt-5 border-t-2 border-ink">
              {isExhausted ? (
                <Button disabled className="w-full">
                  FILLED
                </Button>
              ) : (
                <Button asChild className="w-full">
                  <Link href={`/apply?bounty=${b.number}`}>CLAIM THIS GRANT</Link>
                </Button>
              )}
            </div>
          </Card>
        </aside>
      </div>
    </PageShell>
  );
}
