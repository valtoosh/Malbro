// app/admin/(authed)/page.tsx
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';

export const metadata = { title: 'Administrative Dashboard' };

export default function AdminDashboard() {
  return (
    <>
      <p className="font-mono text-eyebrow uppercase mb-4">§00 — DASHBOARD</p>
      <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
        ADMINISTRATIVE DASHBOARD
      </h1>
      <p className="text-bodyL mt-5 max-w-[720px] text-ink-2">
        Welcome to the Foundation&apos;s administrative console. Module access is governed by the
        role-based provisions of Schedule R-7 §11.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
        <Card className="p-6">
          <p className="font-mono text-eyebrow uppercase mb-3">MODULE</p>
          <h3 className="font-display font-black text-h3 leading-tight">BOUNTY MANAGEMENT</h3>
          <p className="text-bodyS text-ink-2 mt-2">Create, edit, pause, and retire grants on the public Bounty Board.</p>
          <div className="mt-4">
            <Tag variant="muted">FORTHCOMING — PLAN 4</Tag>
          </div>
        </Card>

        <Card className="p-6">
          <p className="font-mono text-eyebrow uppercase mb-3">MODULE</p>
          <h3 className="font-display font-black text-h3 leading-tight">REVIEW QUEUE</h3>
          <p className="text-bodyS text-ink-2 mt-2">Approve, reject, or flag pending grant applications.</p>
          <div className="mt-4">
            <Tag variant="muted">FORTHCOMING — PLAN 5</Tag>
          </div>
        </Card>

        <Card className="p-6">
          <p className="font-mono text-eyebrow uppercase mb-3">MODULE</p>
          <h3 className="font-display font-black text-h3 leading-tight">AUDIT LOG</h3>
          <p className="text-bodyS text-ink-2 mt-2">View administrative action history with filtering.</p>
          <div className="mt-4">
            <Tag variant="muted">FORTHCOMING — PLAN 4</Tag>
          </div>
        </Card>
      </div>

      <p className="font-mono text-caption uppercase tracking-[0.12em] mt-12 text-ink-2">
        <Link href="/" className="underline underline-offset-2">↩ RETURN TO PUBLIC SITE</Link>
      </p>
    </>
  );
}
