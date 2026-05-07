// components/ui/DisclosureList.tsx
import type { ReactNode } from 'react';

export interface DisclosureItem {
  question: ReactNode;
  answer: ReactNode;
}

export interface DisclosureListProps {
  items: DisclosureItem[];
  defaultOpen?: boolean;
}

export function DisclosureList({ items, defaultOpen = false }: DisclosureListProps) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <details
          key={i}
          open={defaultOpen}
          className="border-2 border-ink bg-paper-2 group"
        >
          <summary className="cursor-pointer px-5 py-4 flex items-center justify-between gap-4 list-none [&::-webkit-details-marker]:hidden font-display font-bold text-bodyL leading-tight">
            <span>{item.question}</span>
            <span
              aria-hidden="true"
              className="font-mono font-black text-h3 transition-transform group-open:rotate-45 select-none"
            >
              +
            </span>
          </summary>
          <div className="px-5 pt-1 pb-5 text-body text-ink-2 border-t-2 border-ink">
            {item.answer}
          </div>
        </details>
      ))}
    </div>
  );
}
