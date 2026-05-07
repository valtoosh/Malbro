// components/ui/Footnote.tsx
const SUPERSCRIPT_DIGITS: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
};

function toSuperscript(n: number): string {
  if (n < 1 || n > 9) return `(${n})`;
  return SUPERSCRIPT_DIGITS[String(n)] ?? `(${n})`;
}

export interface FootnoteProps {
  n: number;
}

export function Footnote({ n }: FootnoteProps) {
  return (
    <sup className="font-mono text-[0.7em] mx-[1px]">
      <a
        href={`#fn-${n}`}
        className="no-underline hover:underline decoration-marlbro hover:text-marlbro"
      >
        {toSuperscript(n)}
      </a>
    </sup>
  );
}
