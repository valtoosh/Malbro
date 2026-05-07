// components/ui/ChevronDivider.tsx
import { forwardRef, type SVGAttributes } from 'react';
import { cn } from '@marlbro/shared/cn';

type ChevronVariant = 'ink' | 'red';

export interface ChevronDividerProps extends SVGAttributes<SVGSVGElement> {
  variant?: ChevronVariant;
}

const fills: Record<ChevronVariant, string> = {
  ink: 'fill-ink',
  red: 'fill-marlbro',
};

export const ChevronDivider = forwardRef<SVGSVGElement, ChevronDividerProps>(
  function ChevronDivider({ variant = 'ink', className, ...props }, ref) {
    return (
      <svg
        ref={ref}
        viewBox="0 0 100 28"
        preserveAspectRatio="none"
        aria-hidden="true"
        className={cn('block w-full h-[28px]', fills[variant]!, className)}
        {...props}
      >
        <polygon points="0,0 100,0 50,28" />
      </svg>
    );
  },
);
