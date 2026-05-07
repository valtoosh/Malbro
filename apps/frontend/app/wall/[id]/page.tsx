// apps/frontend/app/wall/[id]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageShell, PosterCard } from '@marlbro/ui';
import { getPosterById, SAMPLE_POSTERS } from '@marlbro/shared/sampleData';
import { backendJson } from '@/lib/api';
import type { ApiError } from '@/lib/api';
import type { PosterGrant } from '@marlbro/shared/sampleData';

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return SAMPLE_POSTERS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const data = await backendJson<{ poster: PosterGrant }>('/wall/' + id);
    return { title: `Grant №${data.poster.displayNumber}` };
  } catch {
    const sample = getPosterById(id);
    if (sample) return { title: `Grant №${sample.displayNumber}` };
    return { title: 'Grant Not Found' };
  }
}

export default async function PosterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let poster: PosterGrant | undefined;
  try {
    const data = await backendJson<{ poster: PosterGrant }>('/wall/' + id);
    poster = data.poster;
  } catch (err) {
    const apiErr = err as ApiError;
    if (apiErr.status === 404) {
      poster = getPosterById(id);
    } else {
      poster = getPosterById(id);
    }
  }

  if (!poster) notFound();

  return (
    <PageShell schedule={`Schedule R-7 · Disbursement Record ${poster.displayNumber}`}>
      <Link
        href="/wall"
        className="font-mono text-eyebrow uppercase tracking-[0.12em] inline-block mb-6 underline underline-offset-[3px]"
      >
        ← WALL OF GRANTS
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <article className="lg:col-span-7">
          <p className="font-mono text-eyebrow uppercase mb-4">GRANT №{poster.displayNumber}</p>
          <h1 className="font-display font-black text-h1 lg:text-d1 leading-[0.9] tracking-[-0.04em]">
            DISBURSEMENT RECORD
          </h1>

          <section className="mt-10">
            <h2 className="font-mono text-eyebrow uppercase mb-3">STATEMENT OF GRANTEE</h2>
            <blockquote className="text-bodyL font-display font-bold leading-tight border-l-[6px] border-marlbro pl-6 py-2">
              &ldquo;{poster.tweetQuote}&rdquo;
            </blockquote>
            <p className="font-mono text-caption mt-4">— @{poster.applicantHandle}</p>
          </section>

          <section className="mt-10">
            <h2 className="font-mono text-eyebrow uppercase mb-3">DISBURSEMENT PARTICULARS</h2>
            <dl className="grid grid-cols-2 gap-y-3 gap-x-6 text-body">
              <dt className="font-mono text-caption uppercase">Date of disbursement</dt>
              <dd>{poster.paidAt}</dd>
              <dt className="font-mono text-caption uppercase">Recipient wallet</dt>
              <dd className="font-mono text-bodyS">{poster.walletShort}</dd>
              <dt className="font-mono text-caption uppercase">Marlbro disbursed</dt>
              <dd className="font-display font-bold">
                {poster.payoutMarlbro.toLocaleString('en-US')} $MARLBRO
              </dd>
              {poster.payoutSol > 0 && (
                <>
                  <dt className="font-mono text-caption uppercase">SOL disbursed</dt>
                  <dd className="font-display font-bold">{poster.payoutSol} SOL</dd>
                </>
              )}
              {poster.bountyNumber !== null && (
                <>
                  <dt className="font-mono text-caption uppercase">Pursuant to bounty</dt>
                  <dd>
                    <Link href={`/bounties/${poster.bountyNumber}`} className="underline">
                      Grant №{poster.bountyNumber}
                    </Link>
                  </dd>
                </>
              )}
            </dl>
          </section>
        </article>

        <aside className="lg:col-span-5 sticky top-8">
          <PosterCard {...poster} />
        </aside>
      </div>
    </PageShell>
  );
}
