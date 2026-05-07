// components/ui/PosterCard.tsx
import { Card } from './Card';
import { Stamp } from './Stamp';

export interface PosterCardProps {
  displayNumber: number;
  paidAt: string;
  tweetQuote: string;
  payoutMarlbro: number;
  payoutSol: number;
  walletShort: string;
  applicantHandle: string;
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export function PosterCard({
  displayNumber,
  paidAt,
  tweetQuote,
  payoutMarlbro,
  payoutSol,
  walletShort,
  applicantHandle,
}: PosterCardProps) {
  return (
    <Card variant="poster" className="aspect-[4/5] flex flex-col bg-paper relative overflow-hidden">
      <div className="bg-marlbro text-paper px-4 py-2 border-b-[3px] border-ink flex justify-between items-baseline font-mono text-eyebrow uppercase tracking-[0.1em]">
        <span className="font-display font-black text-[14px] tracking-normal">GRANT №{displayNumber}</span>
        <span>{paidAt}</span>
      </div>
      <div className="flex-1 px-4 py-4 border-b-2 border-ink font-display font-bold text-bodyL leading-tight tracking-[-0.01em]">
        &ldquo;{tweetQuote}&rdquo;
      </div>
      <div className="px-4 py-3 border-b-2 border-ink font-display font-black text-h2 leading-none tracking-[-0.02em]">
        {formatNumber(payoutMarlbro)} <span className="text-eyebrow font-mono tracking-[0.1em] opacity-70">$MARLBRO</span>
        {payoutSol > 0 && (
          <span className="block text-h3 font-display font-black mt-1">
            +{payoutSol} <span className="text-eyebrow font-mono tracking-[0.1em] opacity-70">SOL</span>
          </span>
        )}
      </div>
      <div className="px-4 py-2 flex justify-between items-center font-mono text-eyebrow uppercase tracking-[0.06em]">
        <span>{walletShort}</span>
        <span>@{applicantHandle}</span>
      </div>
      <div className="absolute bottom-3 right-3 pointer-events-none">
        <Stamp label="OFFICIALLY DISBURSED" rotate={-12} />
      </div>
    </Card>
  );
}
