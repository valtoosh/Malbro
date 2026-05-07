import { notFound } from 'next/navigation';
import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { getDb } from '@/db/client';
import { submissions, approvedGrants } from '@/db/schema';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { approveSubmission, rejectSubmission, markGrantExecuted } from './actions';

export const metadata = { title: 'Admin · Review' };
export const dynamic = 'force-dynamic';

export default async function ReviewSubmissionPage({
  params,
  searchParams,
}: {
  params: Promise<{ submissionId: string }>;
  searchParams: Promise<{ ok?: string; grantId?: string }>;
}) {
  await requireAdmin('reviewer');
  const { submissionId } = await params;
  const sp = await searchParams;
  const db = await getDb();
  const [sub] = await db.select().from(submissions).where(eq(submissions.id, submissionId)).limit(1);
  if (!sub) notFound();

  // Fetch any associated approved_grant
  const [grant] = await db.select().from(approvedGrants).where(eq(approvedGrants.submissionId, sub.id)).limit(1);

  return (
    <>
      <Link href="/admin/queue" className="font-mono text-eyebrow uppercase tracking-[0.12em] inline-block mb-6 underline underline-offset-[3px]">
        ← REVIEW QUEUE
      </Link>

      <p className="font-mono text-eyebrow uppercase mb-2">FILING {sub.publicUid}</p>
      <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em] mb-6">
        @{sub.applicantTwitterHandle}
      </h1>
      <div className="flex flex-wrap gap-2 mb-8">
        <Tag>{sub.status.toUpperCase()}</Tag>
        <Tag variant="muted">{sub.lane.toUpperCase()} LANE</Tag>
      </div>

      {sp.ok === 'approved' && (
        <div className="mb-6 p-4 border-2 border-ink bg-paper-2">
          <p className="font-mono text-bodyS">Submission approved. Grant ID {sp.grantId}. Squads proposal queued.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6">
            <h3 className="font-mono text-eyebrow uppercase mb-3">RECEIPT</h3>
            <a href={`/api/uploads/${encodeURI(sub.receiptImageR2Key)}`} target="_blank" rel="noopener noreferrer" className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/uploads/${encodeURI(sub.receiptImageR2Key)}`}
                alt="Receipt"
                className="border-2 border-ink max-w-full"
              />
            </a>
          </Card>

          <Card className="p-6">
            <h3 className="font-mono text-eyebrow uppercase mb-3">TWEET</h3>
            <a href={sub.tweetUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-bodyS break-all underline">
              {sub.tweetUrl}
            </a>
            <p className="font-mono text-caption mt-3">tweet ID: {sub.tweetId}</p>
            {sub.tweetVerificationPayload ? (
              <pre className="mt-3 p-3 bg-paper-2 border-2 border-ink overflow-x-auto text-bodyS font-mono">
                {JSON.stringify(sub.tweetVerificationPayload, null, 2)}
              </pre>
            ) : (
              <p className="font-mono text-caption mt-3 text-marlbro-deep">[NO VERIFICATION PAYLOAD — Twitter API stub]</p>
            )}
          </Card>

          {sub.notes && (
            <Card className="p-6">
              <h3 className="font-mono text-eyebrow uppercase mb-3">APPLICANT NOTES</h3>
              <p className="text-body whitespace-pre-wrap">{sub.notes}</p>
            </Card>
          )}
        </div>

        <aside className="lg:col-span-5 space-y-6">
          <Card className="p-6 bg-paper-2">
            <h3 className="font-mono text-eyebrow uppercase mb-3">RECIPIENT</h3>
            <p className="font-mono text-bodyS break-all">{sub.applicantWalletAddress}</p>
          </Card>

          {sub.status === 'review_ready' && (
            <>
              <Card className="p-6">
                <h3 className="font-mono text-eyebrow uppercase mb-3">APPROVE</h3>
                <form action={approveSubmission} className="space-y-4">
                  <input type="hidden" name="submissionId" value={sub.id} />
                  <label className="block">
                    <span className="block font-mono text-eyebrow uppercase tracking-[0.12em] mb-2">PAYOUT — $MARLBRO</span>
                    <Input name="payoutMarlbro" required defaultValue="5000" />
                  </label>
                  <label className="block">
                    <span className="block font-mono text-eyebrow uppercase tracking-[0.12em] mb-2">PAYOUT — SOL</span>
                    <Input name="payoutSol" required defaultValue="0" />
                  </label>
                  <Button type="submit" className="w-full">APPROVE + PROPOSE PAYOUT</Button>
                </form>
              </Card>

              <Card className="p-6">
                <h3 className="font-mono text-eyebrow uppercase mb-3">REJECT</h3>
                <form action={rejectSubmission} className="space-y-4">
                  <input type="hidden" name="submissionId" value={sub.id} />
                  <textarea
                    name="reason"
                    required
                    rows={3}
                    placeholder="Pursuant to Schedule R-7 §17(a), …"
                    className="block w-full px-[14px] py-[12px] bg-paper border-2 border-ink font-sans text-body"
                  />
                  <Button type="submit" variant="ghost" className="w-full">REJECT</Button>
                </form>
              </Card>
            </>
          )}

          {grant && (
            <Card className="p-6 bg-paper-2">
              <h3 className="font-mono text-eyebrow uppercase mb-3">APPROVED GRANT</h3>
              <p className="font-mono text-bodyS">№{grant.displayNumber}</p>
              <p className="font-mono text-caption mt-2">status: {grant.payoutStatus}</p>
              {grant.squadsProposalPubkey && (
                <p className="font-mono text-caption mt-1 break-all">proposal: {grant.squadsProposalPubkey}</p>
              )}
              {grant.payoutTxSignature && (
                <p className="font-mono text-caption mt-1 break-all">tx: {grant.payoutTxSignature}</p>
              )}
              {grant.payoutStatus === 'proposed' && (
                <form action={markGrantExecuted} className="mt-4 space-y-3">
                  <input type="hidden" name="grantId" value={grant.id} />
                  <label className="block">
                    <span className="block font-mono text-eyebrow uppercase tracking-[0.12em] mb-2">TX SIGNATURE (after Squads execution)</span>
                    <Input name="txSignature" required placeholder="5KqW1..." />
                  </label>
                  <Button type="submit" className="w-full">MARK EXECUTED</Button>
                </form>
              )}
            </Card>
          )}

          {sub.rejectionReason && (
            <Card className="p-6 border-stamp-red">
              <h3 className="font-mono text-eyebrow uppercase mb-3 text-stamp-red">REJECTION REASON</h3>
              <p className="text-body whitespace-pre-wrap">{sub.rejectionReason}</p>
            </Card>
          )}
        </aside>
      </div>
    </>
  );
}
