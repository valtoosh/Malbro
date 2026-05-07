// apps/frontend/app/bounties/[number]/not-found.tsx
import Link from 'next/link';
import { PageShell, Stamp } from '@marlbro/ui';

export default function BountyNotFound() {
  return (
    <PageShell schedule="Schedule R-7 · Form 404-B">
      <p className="font-mono text-eyebrow uppercase mb-4">§404 — GRANT NOT ON FILE</p>
      <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
        GRANT NOT FOUND.
      </h1>
      <p className="text-bodyL mt-5 max-w-[640px]">
        The Foundation has reviewed its bounty registry and is unable to locate a grant by the
        requested identifier. Please consult the Bounty Board for an inventory of currently active
        grants.
      </p>
      <div className="mt-8 flex items-center gap-6">
        <Link
          href="/bounties"
          className="font-display font-black text-body uppercase tracking-[0.04em] inline-flex items-center justify-center px-[22px] py-[14px] border-4 border-ink shadow-md bg-marlbro text-paper"
        >
          BOUNTY BOARD
        </Link>
        <Stamp label="GRANT NOT FOUND" rotate={-9} />
      </div>
    </PageShell>
  );
}
