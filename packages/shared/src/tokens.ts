// lib/tokens.ts
// Single source of truth for Marlbro design tokens.
// CSS custom properties (app/globals.css) consume from this module.

export const COLOR = {
  paper: '#F4ECD6',
  paper2: '#EBDFC0',
  ink: '#0A0A0A',
  ink2: '#1A1411',
  marlbro: '#C2161A',
  marlbroDeep: '#8B0E12',
  gold: '#C9A227',
  stampRed: '#A11C1F',
} as const;

export const TYPE = {
  family: {
    display: 'var(--font-inter-tight), sans-serif',
    body: 'var(--font-inter), sans-serif',
    mono: 'var(--font-plex-mono), monospace',
  },
  scale: {
    d1: '96px',
    d2: '72px',
    h1: '48px',
    h2: '32px',
    h3: '24px',
    bodyL: '18px',
    body: '16px',
    bodyS: '14px',
    caption: '12px',
    eyebrow: '10px',
  },
  tracking: {
    d1: '-0.04em',
    d2: '-0.03em',
    h1: '-0.02em',
    h2: '-0.01em',
    h3: '0',
    body: '0',
    caption: '0.04em',
    eyebrow: '0.12em',
  },
} as const;

export const SHADOW = {
  sm: `4px 4px 0 ${COLOR.ink}`,
  md: `6px 6px 0 ${COLOR.ink}`,
  lg: `10px 10px 0 ${COLOR.ink}`,
} as const;

export const BORDER = {
  default: '2px',
  card: '4px',
  poster: '6px',
} as const;
