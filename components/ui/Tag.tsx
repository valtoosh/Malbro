// components/ui/Tag.tsx
import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type TagVariant = 'default' | 'alert' | 'muted';

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant;
}

const base =
  'inline-flex items-center px-[8px] py-[3px] border-2 ' +
  'font-mono text-eyebrow uppercase tracking-[0.12em] ' +
  'whitespace-nowrap';

const variants: Record<TagVariant, string> = {
  default: 'bg-paper text-ink border-ink',
  alert: 'bg-marlbro text-paper border-ink',
  muted: 'bg-paper-2 text-ink border-ink',
};

export const Tag = forwardRef<HTMLSpanElement, TagProps>(function Tag(
  { variant = 'default', className, ...props },
  ref,
) {
  return <span ref={ref} className={cn(base, variants[variant], className)} {...props} />;
});
