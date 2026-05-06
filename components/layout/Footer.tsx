// components/layout/Footer.tsx
import { cn } from '@/lib/cn';
import { ChevronDivider } from '@/components/ui/ChevronDivider';

export interface FooterProps {
  className?: string;
  'data-testid'?: string;
}

const base =
  'bg-ink text-paper px-7 py-3.5 ' +
  'font-mono text-eyebrow uppercase tracking-[0.12em] ' +
  'flex justify-between items-center flex-wrap gap-3';

export function Footer({ className, ...rest }: FooterProps) {
  return (
    <>
      <ChevronDivider />
      <footer
        className={cn(base, className)}
        {...rest}
      >
        <span>§ All applications subject to Schedule R-7</span>
        <span>NOT FINANCIAL ADVICE · NOT TAX ADVICE</span>
      </footer>
    </>
  );
}
