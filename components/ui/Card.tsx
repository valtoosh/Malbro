// components/ui/Card.tsx
import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type CardVariant = 'card' | 'poster';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variants: Record<CardVariant, string> = {
  card: 'border-4 border-ink shadow-md bg-paper',
  poster: 'border-[6px] border-ink shadow-lg bg-paper',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'card', className, ...props },
  ref,
) {
  return <div ref={ref} className={cn(variants[variant], className)} {...props} />;
});
