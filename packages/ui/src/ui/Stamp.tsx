// components/ui/Stamp.tsx
import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@marlbro/shared/cn';

type StampVariant = 'stamp' | 'ink';

export interface StampProps extends HTMLAttributes<HTMLSpanElement> {
  label: string;
  rotate?: number;
  variant?: StampVariant;
}

const base =
  'inline-flex items-center px-[8px] py-[5px] border-[3px] bg-paper/95 ' +
  'font-display font-black text-[9px] uppercase tracking-[0.18em] ' +
  'pointer-events-none select-none';

const variants: Record<StampVariant, string> = {
  stamp: 'text-stamp-red border-stamp-red',
  ink: 'text-ink border-ink',
};

export const Stamp = forwardRef<HTMLSpanElement, StampProps>(function Stamp(
  { label, rotate = -12, variant = 'stamp', className, style, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(base, variants[variant]!, className)}
      style={{ transform: `rotate(${rotate}deg)`, ...style }}
      {...props}
    >
      <span>{label}</span>
    </span>
  );
});
