// app/wall/page.tsx
import Link from 'next/link';
import { PageShell } from '@/components/layout/PageShell';
import { PosterCard } from '@/components/ui/PosterCard';
import { SAMPLE_POSTERS } from '@/lib/sampleData';
import { getDb } from '@/db/client';
import { listExecutedAsPosters } from '@/db/queries/approvedGrants';

export const metadata = { title: 'Wall of Grants' };
export const dynamic = 'force-dynamic';

export default async function WallPage() {
  const db = await getDb();
  const dbPosters = await listExecutedAsPosters(db);
  const posters = dbPosters.length > 0 ? dbPosters : SAMPLE_POSTERS;

  return (
    <PageShell schedule="Schedule R-7 · Form 042-W">
      <header className="mb-12">
        <p className="font-mono text-eyebrow uppercase mb-4">§04 — WALL OF GRANTS</p>
        <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
          WALL OF GRANTS
        </h1>
        <p className="text-bodyL mt-5 max-w-[720px]">
          A perpetually-updated public registry of disbursed grants. Each entry reflects an
          executed disbursement on the Solana ledger, recorded by the Foundation in accordance
          with Schedule R-7 §22.
        </p>
        <p className="font-mono text-caption uppercase tracking-[0.12em] mt-4 text-ink-2">
          {posters.length} GRANTS ON RECORD
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {posters.map((poster) => (
          <Link key={poster.id} href={`/wall/${poster.id}`} className="block group">
            <div className="transition-transform duration-[80ms] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px]">
              <PosterCard {...poster} />
            </div>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
