// apps/frontend/app/admin/(authed)/queue/page.tsx
import Link from 'next/link';
import { Card, Tag } from '@marlbro/ui';
import { backendJson } from '@/lib/api';

export const metadata = { title: 'Admin · Review Queue' };
export const dynamic = 'force-dynamic';

interface PendingSubmission {
  id: string;
  publicUid: string;
  applicantTwitterHandle: string;
  applicantWalletAddress: string;
  tweetUrl: string;
  lane: string;
  createdAt: string;
}

export default async function ReviewQueuePage() {
  const { submissions: pending } = await backendJson<{ submissions: PendingSubmission[] }>(
    '/admin/queue',
    {},
    { auth: 'admin' },
  );

  return (
    <>
      <p className="font-mono text-eyebrow uppercase mb-4">§02 — REVIEW QUEUE</p>
      <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em] mb-8">
        REVIEW QUEUE
      </h1>
      <p className="font-mono text-caption uppercase tracking-[0.12em] text-ink-2 mb-8">
        {pending.length} submission{pending.length === 1 ? '' : 's'} awaiting review
      </p>

      {pending.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="font-mono text-bodyL text-ink-2">No submissions in queue.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {pending.map((s) => (
            <Link key={s.id} href={`/admin/queue/${s.id}`} className="block group">
              <Card className="p-6 group-hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between gap-6 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-mono text-eyebrow uppercase mb-2">
                      FILING {s.publicUid.slice(0, 8)}
                    </p>
                    <h3 className="font-display font-bold text-h3 leading-tight">
                      @{s.applicantTwitterHandle}
                    </h3>
                    <p className="font-mono text-bodyS mt-2 break-all opacity-70">
                      {s.applicantWalletAddress}
                    </p>
                    <p className="font-mono text-caption mt-2">
                      <a
                        href={s.tweetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline break-all"
                      >
                        {s.tweetUrl}
                      </a>
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 items-end shrink-0">
                    <Tag>{s.lane.toUpperCase()}</Tag>
                    <p className="font-mono text-caption text-ink-2">
                      {new Date(s.createdAt).toISOString().slice(0, 10)}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
