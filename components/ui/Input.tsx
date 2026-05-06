// components/ui/Input.tsx
import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type InputVariant = 'mono' | 'prose';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant;
}

const base =
  'block w-full px-[14px] py-[12px] bg-paper-2 border-2 border-ink text-ink ' +
  'placeholder:text-ink/40 ' +
  'focus:outline-none focus:border-4 focus:shadow-[6px_6px_0_var(--color-marlbro)] ' +
  'transition-shadow duration-[80ms] ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

const variants: Record<InputVariant, string> = {
  mono: 'font-mono text-body-s tracking-[0.04em]',
  prose: 'font-sans text-body',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { variant = 'mono', className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(base, variants[variant], className)} {...props} />;
});
