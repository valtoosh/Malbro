// app/admin/login/page.tsx
'use client';

import { useState, useTransition } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Stamp } from '@/components/ui/Stamp';
import { requestMagicLink, type ActionResult } from './actions';

export default function AdminLoginPage() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  return (
    <PageShell schedule="Schedule R-7 · Form 042-S · Administrative Access">
      <div className="max-w-[520px] mx-auto pt-8">
        <p className="font-mono text-eyebrow uppercase mb-4">§07 — ADMINISTRATIVE ACCESS</p>
        <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
          ADMIN ENTRY
        </h1>
        <p className="text-bodyL mt-5 text-ink-2">
          Pursuant to Schedule R-7 §11(c), administrative access is granted via single-use
          instrument dispatched to the address on file.
        </p>

        <Card className="mt-10 p-8 bg-paper-2">
          <form
            action={(fd) =>
              startTransition(async () => {
                const r = await requestMagicLink(fd);
                setResult(r);
              })
            }
          >
            <label className="block">
              <span className="block font-mono text-eyebrow uppercase tracking-[0.12em] mb-2">
                ADMINISTRATIVE EMAIL ADDRESS
              </span>
              <Input
                name="email"
                type="email"
                required
                placeholder="admin@marlbro.com"
                disabled={pending}
                variant="prose"
              />
            </label>
            <Button type="submit" disabled={pending} className="w-full mt-6">
              {pending ? 'DISPATCHING…' : 'DISPATCH ACCESS INSTRUMENT'}
            </Button>
          </form>

          {result && (
            <div
              className={`mt-6 p-4 border-2 ${
                result.ok ? 'border-ink bg-paper' : 'border-stamp-red bg-paper'
              }`}
            >
              <p className="font-mono text-bodyS">{result.message}</p>
            </div>
          )}
        </Card>

        <div className="mt-12 flex items-center gap-4">
          <Stamp label="OFFICIAL USE ONLY" rotate={-7} />
          <p className="font-mono text-caption uppercase tracking-[0.12em] text-ink-2">
            Schedule R-7 §11(c) — single-use, 15-minute expiry, non-transferable.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
