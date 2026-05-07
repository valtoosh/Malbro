// lib/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Tailwind v4 + our custom @theme tokens. tailwind-merge's default config
// only knows the built-in font-size tokens (text-xs..text-9xl), so it
// misclassifies our custom text-eyebrow / text-d1 / etc. as font-size
// AND treats text-paper / text-marlbro as font-size too. We extend the
// font-size group with our exact names so it can correctly tell font-size
// utilities from text-color utilities.
const customFontSizes = [
  'eyebrow',
  'caption',
  'body-s',
  'body',
  'body-l',
  'h3',
  'h2',
  'h1',
  'd2',
  'd1',
];

const twMerge = extendTailwindMerge({
  override: {
    classGroups: {
      'font-size': [{ text: customFontSizes }],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
