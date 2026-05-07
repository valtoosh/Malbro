// app/wall/[id]/not-found.tsx
import Link from 'next/link';
import { PageShell } from '@/components/layout/PageShell';
import { Stamp } from '@/components/ui/Stamp';

export default function PosterNotFound() {
  return (
    <PageShell schedule="Schedule R-7 · Form 404-W">
      <p className="font-mono text-eyebrow uppercase mb-4">§404 — RECORD NOT ON FILE</p>
      <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
        RECORD NOT FOUND.
      </h1>
      <p className="text-bodyL mt-5 max-w-[640px]">
        The Foundation has reviewed its disbursement records and is unable to locate the requested
        grant. The applicant may consult the Wall of Grants for the public registry.
      </p>
      <div className="mt-8 flex items-center gap-6">
        <Link
          href="/wall"
          className="font-display font-black text-body uppercase tracking-[0.04em] inline-flex items-center justify-center px-[22px] py-[14px] border-4 border-ink shadow-md bg-marlbro text-paper"
        >
          WALL OF GRANTS
        </Link>
        <Stamp label="RECORD NOT FOUND" rotate={-9} />
      </div>
    </PageShell>
  );
}
