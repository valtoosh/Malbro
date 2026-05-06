// components/layout/TopBar.tsx
import { cn } from '@/lib/cn';

export interface TopBarProps {
  schedule?: string;
  className?: string;
  'data-testid'?: string;
}

export function TopBar({
  schedule = 'Schedule R-7 · Form 042-A',
  className,
  ...rest
}: TopBarProps) {
  return (
    <header
      className={cn(
        'relative bg-marlbro text-paper border-b-4 border-ink',
        'px-7 py-3.5 flex justify-between items-center',
        'font-mono text-eyebrow uppercase tracking-[0.12em]',
        className,
      )}
      {...rest}
    >
      <span>The Marlbro Foundation · Est. 2026</span>
      <span>{schedule}</span>
      <span
        aria-hidden="true"
        className="absolute left-0 right-0 -bottom-[10px] h-[6px] bg-gold border-b-4 border-ink"
      />
    </header>
  );
}
