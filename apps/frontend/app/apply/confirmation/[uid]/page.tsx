// apps/frontend/app/apply/confirmation/[uid]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageShell, Card, Tag, Stamp } from '@marlbro/ui';
import { backendJson } from '@/lib/api';
import type { ApiError } from '@/lib/api';

export const metadata = { title: 'Application Filed' };
export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  pending: 'PENDING INTAKE',
  verifying: 'AWAITING VERIFICATION',
  review_ready: 'PENDING REVIEW',
  approved: 'APPROVED — DISBURSEMENT PENDING',
  rejected: 'REJECTED',
  expired: 'EXPIRED',
  flagged: 'FLAGGED FOR ADDITIONAL REVIEW',
};

interface SubmissionView {
  status: string;
  applicantTwitterHandle: string;
  applicantWalletAddress: string;
  tweetUrl: string;
  createdAt: string;
  rejectionReason: string | null;
}

export default async function ConfirmationPage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;

  let sub: SubmissionView;
  try {
    const data = await backendJson<{ submission: SubmissionView }>('/submissions/' + uid);
    sub = data.submission;
  } catch (err) {
    const apiErr = err as ApiError;
    if (apiErr.status === 404) notFound();
    throw err;
  }

  return (
    <PageShell schedule={`Schedule R-7 · Form 042-A · Filing ${uid.slice(0, 8)}`}>
      <div className="max-w-[760px] mx-auto">
        <p className="font-mono text-eyebrow uppercase mb-4">§03 — APPLICATION FILED</p>
        <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
          APPLICATION RECEIVED.
        </h1>
        <p className="text-bodyL mt-5 text-ink-2">
          Pursuant to Schedule R-7 §11, the Foundation has recorded the applicant&apos;s submission.
          Manual review is in progress.
        </p>

        <Card className="mt-10 bg-paper-2 p-8">
          <p className="font-mono text-eyebrow uppercase mb-3">FILING REFERENCE</p>
          <p className="font-mono text-bodyL break-all">{uid}</p>

          <div className="mt-6">
            <Tag
              variant={
                sub.status === 'approved'
                  ? 'default'
                  : sub.status === 'rejected'
                    ? 'alert'
                    : 'muted'
              }
            >
              STATUS · {STATUS_LABELS[sub.status] ?? sub.status.toUpperCase()}
            </Tag>
          </div>

          <dl className="grid grid-cols-2 gap-y-3 gap-x-6 mt-8 text-body">
            <dt className="font-mono text-caption uppercase">Applicant</dt>
            <dd>@{sub.applicantTwitterHandle}</dd>
            <dt className="font-mono text-caption uppercase">Wallet</dt>
            <dd className="font-mono text-bodyS break-all">{sub.applicantWalletAddress}</dd>
            <dt className="font-mono text-caption uppercase">Tweet</dt>
            <dd>
              <a
                className="underline break-all"
                href={sub.tweetUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {sub.tweetUrl}
              </a>
            </dd>
            <dt className="font-mono text-caption uppercase">Filed</dt>
            <dd>{new Date(sub.createdAt).toISOString().slice(0, 10)}</dd>
          </dl>

          {sub.rejectionReason && (
            <div className="mt-6 p-4 border-2 border-stamp-red">
              <p className="font-mono text-eyebrow uppercase mb-2 text-stamp-red">
                REJECTION REASON
              </p>
              <p className="text-body">{sub.rejectionReason}</p>
            </div>
          )}
        </Card>

        <div className="mt-10 flex items-center gap-6 flex-wrap">
          <Link
            href="/wall"
            className="font-mono text-eyebrow uppercase tracking-[0.12em] underline underline-offset-[3px]"
          >
            WALL OF GRANTS
          </Link>
          <Stamp
            label={
              sub.status === 'approved'
                ? 'APPROVED'
                : sub.status === 'rejected'
                  ? 'REJECTED'
                  : 'UNDER REVIEW'
            }
            rotate={-9}
          />
        </div>
      </div>
    </PageShell>
  );
}
