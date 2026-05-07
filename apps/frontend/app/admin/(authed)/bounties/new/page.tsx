// apps/frontend/app/admin/(authed)/bounties/new/page.tsx
import Link from 'next/link';
import { Button, Input, Card } from '@marlbro/ui';
import { createBountyAction } from './actions';

export const metadata = { title: 'Admin · New Bounty' };

export default async function NewBountyPage() {
  return (
    <>
      <Link
        href="/admin/bounties"
        className="font-mono text-eyebrow uppercase tracking-[0.12em] inline-block mb-6 underline underline-offset-[3px]"
      >
        ← BOUNTIES
      </Link>
      <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em] mb-8">
        NEW BOUNTY
      </h1>
      <Card className="p-8 bg-paper-2">
        <form
          action={createBountyAction as unknown as (formData: FormData) => void}
          className="space-y-6"
        >
          <Field label="TITLE" name="title" required />
          <TextField label="BRIEF (STATEMENT OF WORK)" name="brief" required rows={5} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="PAYOUT — $MARLBRO" name="payoutMarlbro" required defaultValue="5000" />
            <Field label="PAYOUT — SOL" name="payoutSol" required defaultValue="0" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="MAX CLAIMS (BLANK = UNLIMITED)" name="maxClaims" type="number" />
            <Field label="DEADLINE (YYYY-MM-DD, OPTIONAL)" name="deadline" type="date" />
          </div>
          <Field label="LOCATION CONSTRAINT (OPTIONAL)" name="locationConstraint" />
          <div>
            <span className="block font-mono text-eyebrow uppercase tracking-[0.12em] mb-2">
              STATUS
            </span>
            <select
              name="status"
              defaultValue="draft"
              className="block w-full px-[14px] py-[12px] bg-paper-2 border-2 border-ink font-mono text-bodyS"
            >
              <option value="draft">DRAFT</option>
              <option value="live">LIVE</option>
              <option value="paused">PAUSED</option>
            </select>
          </div>
          <Button type="submit">CREATE BOUNTY</Button>
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
}: {
  label: string;
  name: string;
  required?: boolean;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="block font-mono text-eyebrow uppercase tracking-[0.12em] mb-2">{label}</span>
      <textarea
        name={name}
        required={required}
        rows={rows}
        className="block w-full px-[14px] py-[12px] bg-paper-2 border-2 border-ink font-sans text-body"
      />
    </label>
  );
}
