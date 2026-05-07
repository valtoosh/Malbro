// apps/frontend/app/not-found.tsx
import Link from 'next/link';
import { PageShell, Stamp } from '@marlbro/ui';

export const metadata = { title: 'Application Not Found' };

export default function NotFound() {
  return (
    <PageShell schedule="Schedule R-7 · Form 404">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section className="lg:col-span-7">
          <p className="font-mono text-eyebrow uppercase mb-4">§404 — RECORD NOT ON FILE</p>
          <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
            APPLICATION NOT FOUND.
          </h1>
          <p className="text-bodyL mt-5 max-w-[560px]">
            The Foundation has reviewed its records and is unable to locate the requested
            instrument. The applicant may consult the Bounty Board or file a fresh Form 042-A.
          </p>
          <div className="mt-8 inline-block">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-[22px] py-[14px] font-display text-body uppercase tracking-[0.04em] font-black border-4 border-ink shadow-md transition-[transform,box-shadow] duration-[80ms] ease-out hover:shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] bg-marlbro text-paper"
            >
              Return to Home
            </Link>
          </div>
        </section>
        <section className="lg:col-span-5 flex items-start justify-center pt-8">
          <Stamp label="APPLICATION NOT FOUND" rotate={-8} />
        </section>
      </div>
    </PageShell>
  );
}
