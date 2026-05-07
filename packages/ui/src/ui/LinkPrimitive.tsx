// components/ui/LinkPrimitive.tsx
import NextLink from 'next/link';
import type { AnchorHTMLAttributes } from 'react';
import { cn } from '@marlbro/shared/cn';

export interface LinkPrimitiveProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

const base =
  'underline underline-offset-[3px] decoration-2 decoration-ink ' +
  'hover:text-marlbro hover:decoration-marlbro transition-colors';

function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

export function LinkPrimitive({ href, className, children, ...props }: LinkPrimitiveProps) {
  const composed = cn(base, className);
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={composed} {...props}>
        {children}
      </a>
    );
  }
  return (
    <NextLink href={href} className={composed} {...props}>
      {children}
    </NextLink>
  );
}
