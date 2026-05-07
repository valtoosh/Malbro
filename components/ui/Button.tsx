// components/ui/Button.tsx
import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
} from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  asChild?: boolean;
}

const base =
  'inline-flex items-center justify-center px-[22px] py-[14px] ' +
  'font-display text-body uppercase tracking-[0.04em] font-black ' +
  'border-4 border-ink shadow-md ' +
  'transition-[transform,box-shadow] duration-[80ms] ease-out ' +
  'hover:shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] ' +
  'active:shadow-none active:translate-x-[6px] active:translate-y-[6px] ' +
  'disabled:opacity-50 disabled:cursor-not-allowed ' +
  'disabled:hover:shadow-md disabled:hover:translate-x-0 disabled:hover:translate-y-0 ' +
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-marlbro';

const variants: Record<Variant, string> = {
  primary: 'bg-marlbro text-paper',
  ghost: 'bg-paper text-ink',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', className, type = 'button', asChild, children, ...props },
  ref,
) {
  const composed = cn(base, variants[variant]!, className);

  if (asChild) {
    const child = Children.only(children) as ReactElement<{ className?: string }>;
    if (!isValidElement(child)) {
      throw new Error('Button asChild requires a single React element child');
    }
    return cloneElement(child, {
      ...props,
      ref,
      className: cn(composed, child.props.className),
    } as object);
  }

  return (
    <button ref={ref} type={type} className={composed} {...props}>
      {children}
    </button>
  );
});
