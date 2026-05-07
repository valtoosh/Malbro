// app/apply/page.tsx
import Link from 'next/link';
import { cookies } from 'next/headers';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import { submitApplication } from './actions';

export const metadata = { title: 'Open Grant Application' };
export const dynamic = 'force-dynamic';

const APPLICANT_COOKIE = 'marlbro_applicant';

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ bounty?: string; error?: string; applyError?: string; applyMessage?: string }>;
}) {
  const sp = await searchParams;
  const jar = await cookies();
  const applicantRaw = jar.get(APPLICANT_COOKIE)?.value;
  let applicant: { handle: string; twitterId: string } | null = null;
  if (applicantRaw) {
    try {
      applicant = JSON.parse(applicantRaw);
    } catch {
      applicant = null;
    }
  }

  const isStubMode = !process.env.TWITTER_CLIENT_ID || !process.env.TWITTER_CLIENT_SECRET;

  return (
    <PageShell schedule="Schedule R-7 · Form 042-A">
      <div className="max-w-[760px] mx-auto">
        <p className="font-mono text-eyebrow uppercase mb-4">§03 — OPEN GRANT</p>
        <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
          {sp.bounty ? `CLAIM GRANT №${sp.bounty}` : 'FORM 042-A · OPEN GRANT APPLICATION'}
        </h1>
        <p className="text-bodyL mt-5 text-ink-2">
          The applicant shall furnish documentation of an authenticated transaction. All fields are
          mandatory unless explicitly designated as optional.
        </p>

        {!applicant && (
          <Card className="mt-10 p-8 bg-paper-2">
            <p className="font-mono text-eyebrow uppercase mb-3">§(I) — IDENTITY VERIFICATION</p>
            <p className="text-body mb-6">
              Pursuant to Schedule R-7 §11(b), the applicant shall verify identity via the X
              platform prior to filing.
              {isStubMode && (
                <span className="block mt-2 font-mono text-caption text-marlbro-deep">
                  [DEV MODE: Twitter API not configured. Sign-in uses a stub applicant
                  (@dev_marlbro_applicant) for testing.]
                </span>
              )}
            </p>
            <Button asChild>
              <Link href={`/api/twitter/login?next=${encodeURIComponent(`/apply${sp.bounty ? `?bounty=${sp.bounty}` : ''}`)}`}>
                SIGN IN WITH X
              </Link>
            </Button>
          </Card>
        )}

        {applicant && (
          <Card className="mt-10 p-8 bg-paper-2">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <p className="font-mono text-eyebrow uppercase mb-1">SIGNED IN AS</p>
                <p className="font-display font-bold text-bodyL">@{applicant.handle}</p>
              </div>
              <Tag variant="muted">VERIFIED</Tag>
            </div>

            <form action={submitApplication} className="space-y-6" encType="multipart/form-data">
              {sp.bounty && <input type="hidden" name="bountyNumber" value={sp.bounty} />}

              <label className="block">
                <span className="block font-mono text-eyebrow uppercase tracking-[0.12em] mb-2">SOLANA WALLET ADDRESS</span>
                <Input name="walletAddress" required placeholder="5n3X9pK4rT2QmL8vWYxZdNbF7HjAuC1k7p4q" />
                <span className="block font-mono text-caption text-ink-2 mt-2">
                  The Foundation cannot recover funds sent to incorrectly-furnished addresses.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" name="walletConfirmed" required className="mt-1.5 w-4 h-4 accent-marlbro" />
                <span className="font-mono text-bodyS">
                  I confirm I control the wallet specified above. Foundation policy under Schedule
                  R-7 §11(e) prohibits recovery of mis-addressed disbursements.
                </span>
              </label>

              <label className="block">
                <span className="block font-mono text-eyebrow uppercase tracking-[0.12em] mb-2">TWEET URL</span>
                <Input name="tweetUrl" required placeholder="https://x.com/.../status/..." />
              </label>

              <label className="block">
                <span className="block font-mono text-eyebrow uppercase tracking-[0.12em] mb-2">RECEIPT PHOTOGRAPH</span>
                <input
                  type="file"
                  name="receipt"
                  accept="image/*"
                  required
                  className="block w-full p-3 bg-paper border-2 border-ink font-mono text-bodyS"
                />
                <span className="block font-mono text-caption text-ink-2 mt-2">
                  JPG / PNG · ≤8 MB
                </span>
              </label>

              <label className="block">
                <span className="block font-mono text-eyebrow uppercase tracking-[0.12em] mb-2">NOTES TO REVIEWER (OPTIONAL)</span>
                <textarea name="notes" rows={3} className="block w-full px-[14px] py-[12px] bg-paper border-2 border-ink font-sans text-body" />
              </label>

              <Button type="submit" className="w-full">FILE FORM 042-A</Button>
            </form>
          </Card>
        )}

        {sp.error && (
          <p className="mt-6 font-mono text-caption text-marlbro-deep">
            Sign-in error: {sp.error}. Please retry.
          </p>
        )}

        {sp.applyError && (
          <p className="mt-6 font-mono text-caption text-marlbro-deep">
            Error [{sp.applyError}]: {sp.applyMessage}
          </p>
        )}
      </div>
    </PageShell>
  );
}
