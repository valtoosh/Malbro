// components/ui/FootnoteList.tsx
import type { ReactNode } from 'react';

export interface FootnoteEntry {
  n: number;
  text: ReactNode;
}

export interface FootnoteListProps {
  items: FootnoteEntry[];
}

export function FootnoteList({ items }: FootnoteListProps) {
  if (items.length === 0) return null;
  return (
    <section className="mt-16 pt-6 border-t-2 border-ink">
      <h2 className="font-mono text-eyebrow uppercase tracking-[0.12em] mb-4">DISCLOSURES</h2>
      <ol className="space-y-2 list-none">
        {items.map((item) => (
          <li
            key={item.n}
            id={`fn-${item.n}`}
            className="font-mono text-caption text-ink-2 flex gap-3"
          >
            <span className="font-bold text-ink shrink-0">[{item.n}]</span>
            <span>{item.text}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
