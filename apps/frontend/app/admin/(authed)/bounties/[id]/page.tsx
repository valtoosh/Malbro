// apps/frontend/app/admin/(authed)/bounties/[id]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Card, Tag } from '@marlbro/ui';
import { backendJson } from '@/lib/api';
import type { ApiError } from '@/lib/api';
import { updateBountyAction } from './actions';

export const metadata = { title: 'Admin · Edit Bounty' };
export const dynamic = 'force-dynamic';

interface AdminBounty {
  id: string;
  number: number;
  title: string;
  brief: string;
  payoutMarlbro: string | number;
  payoutSol: string | number;
  claimsUsed: number;
  maxClaims: number | null;
  status: string;
  createdAt: string;
  deadline: string | null;
  locationConstraint: string | null;
}

export default async function EditBountyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let b: AdminBounty;
  try {
    const data = await backendJson<{ bounty: AdminBounty }>(
      `/admin/bounties/${id}`,
      {},
      { auth: 'admin' },
    );
    b = data.bounty;
  } catch (err) {
    const apiErr = err as ApiError;
    if (apiErr.status === 404) notFound();
    throw err;
  }

  const deadlineISO = b.deadline ? new Date(b.deadline).toISOString().slice(0, 10) : '';

  return (
    <>
      <Link
        href="/admin/bounties"
        className="font-mono text-eyebrow uppercase tracking-[0.12em] inline-block mb-6 underline underline-offset-[3px]"
      >
        ← BOUNTIES
      </Link>
      <div className="flex items-baseline gap-4 mb-8 flex-wrap">
        <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
          GRANT №{b.number}
        </h1>
        <Tag variant={b.status === 'live' ? 'default' : 'muted'}>{b.status.toUpperCase()}</Tag>
      </div>
      <p className="font-mono text-caption uppercase tracking-[0.12em] mb-8 text-ink-2">
        {b.claimsUsed} / {b.maxClaims ?? '∞'} claims used · created{' '}
        {new Date(b.createdAt).toISOString().slice(0, 10)}
      </p>

      <Card className="p-8 bg-paper-2">
        <form
          action={updateBountyAction as unknown as (formData: FormData) => void}
          className="space-y-6"
        >
          <input type="hidden" name="id" value={b.id} />
          <Field label="TITLE" name="title" required defaultValue={b.title} />
          <TextField
            label="BRIEF (STATEMENT OF WORK)"
            name="brief"
            required
            defaultValue={b.brief}
            rows={5}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field
              label="PAYOUT — $MARLBRO"
              name="payoutMarlbro"
              required
              defaultValue={String(b.payoutMarlbro)}
            />
            <Field
              label="PAYOUT — SOL"
              name="payoutSol"
              required
              defaultValue={String(b.payoutSol)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field
              label="MAX CLAIMS (BLANK = UNLIMITED)"
              name="maxClaims"
              type="number"
              defaultValue={b.maxClaims !== null ? String(b.maxClaims) : ''}
            />
            <Field label="DEADLINE (OPTIONAL)" name="deadline" type="date" defaultValue={deadlineISO} />
          </div>
          <Field
            label="LOCATION CONSTRAINT (OPTIONAL)"
            name="locationConstraint"
            defaultValue={b.locationConstraint ?? ''}
          />
          <div>
            <span className="block font-mono text-eyebrow uppercase tracking-[0.12em] mb-2">
              STATUS
            </span>
            <select
              name="status"
              defaultValue={b.status}
              className="block w-full px-[14px] py-[12px] bg-paper-2 border-2 border-ink font-mono text-bodyS"
            >
              <option value="draft">DRAFT</option>
              <option value="live">LIVE</option>
              <option value="paused">PAUSED</option>
              <option value="exhausted">EXHAUSTED</option>
              <option value="expired">EXPIRED</option>
            </select>
          </div>
          <Button type="submit">SAVE CHANGES</Button>
        </form>
      </Card>
    </>
  );
}

function Field({
  label,
  name,
  type = 'text',
  required = false,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="block font-mono text-eyebrow uppercase tracking-[0.12em] mb-2">{label}</span>
      <Input name={name} type={type} required={required} defaultValue={defaultValue} variant="prose" />
    </label>
  );
}

function TextField({
  label,
  name,
  required = false,
  rows = 4,
  defaultValue,
}: {
  label: string;
  name: string;
  required?: boolean;
  rows?: number;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="block font-mono text-eyebrow uppercase tracking-[0.12em] mb-2">{label}</span>
      <textarea
        name={name}
        required={required}
        rows={rows}
        defaultValue={defaultValue}
        className="block w-full px-[14px] py-[12px] bg-paper-2 border-2 border-ink font-sans text-body"
      />
    </label>
  );
}
