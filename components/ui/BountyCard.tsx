// components/ui/BountyCard.tsx
import Link from 'next/link';
import { Card } from './Card';
import { Tag } from './Tag';
import type { Bounty } from '@/lib/sampleData';

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export interface BountyCardProps {
  bounty: Bounty;
}

export function BountyCard({ bounty }: BountyCardProps) {
  const left = bounty.maxClaims !== null ? Math.max(0, bounty.maxClaims - bounty.claimsUsed) : null;
  const isExhausted = bounty.maxClaims !== null && bounty.claimsUsed >= bounty.maxClaims;
  const claimsLabel = bounty.maxClaims === null
    ? 'UNLIMITED'
    : isExhausted
      ? 'EXHAUSTED'
      : `${left} LEFT`;
  const claimsVariant: 'default' | 'alert' | 'muted' = isExhausted ? 'alert' : 'default';

  return (
    <Link href={`/bounties/${bounty.number}`} className="block group">
      <Card className="h-full flex flex-col transition-transform duration-[80ms] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] group-hover:shadow-lg">
        <div className="bg-marlbro text-paper px-4 py-2 border-b-[3px] border-ink flex justify-between items-baseline font-mono text-eyebrow uppercase tracking-[0.1em]">
          <span className="font-display font-black text-[14px] tracking-normal">GRANT №{bounty.number}</span>
          {bounty.deadline && <span>DUE {bounty.deadline}</span>}
        </div>
        <div className="flex-1 p-4 flex flex-col gap-3">
          <h3 className="font-display font-black text-h3 leading-tight">{bounty.title}</h3>
          <p className="text-bodyS text-ink-2 leading-snug line-clamp-3">{bounty.brief}</p>
          <div className="mt-auto flex flex-wrap gap-2">
            <Tag variant={claimsVariant}>{claimsLabel}</Tag>
            {bounty.locationConstraint && <Tag variant="muted">{bounty.locationConstraint}</Tag>}
          </div>
        </div>
        <div className="px-4 py-3 border-t-2 border-ink font-display font-black text-h2 leading-none tracking-[-0.02em] bg-paper-2">
          {formatNumber(bounty.payoutMarlbro)} <span className="text-eyebrow font-mono tracking-[0.1em] opacity-70">$MARLBRO</span>
          {bounty.payoutSol > 0 && (
            <span className="block text-h3 mt-1">
              +{bounty.payoutSol} <span className="text-eyebrow font-mono tracking-[0.1em] opacity-70">SOL</span>
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
