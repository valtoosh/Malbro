# Marlbro · Plan 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a deployed Next.js 15 site with the full Marlbro brand system applied — every sitemap route reachable as a styled placeholder, every base UI primitive built and tested, CI + Vercel preview deploys working. Outcome at end of plan: a public URL serving the cream-paper-and-Marlbro-red shell on every page.

**Architecture:** Next.js 15 App Router, TypeScript strict, Tailwind v3 with CSS custom properties as the canonical token source, Vitest + Testing Library for component tests, GitHub Actions CI, Vercel auto-deploy on push to main.

**Tech Stack:** Next.js 15, React 19, TypeScript 5.4+, Tailwind 3.4, Vitest 1.6, @testing-library/react, @testing-library/jest-dom, Inter / Inter Tight / IBM Plex Mono via `next/font/google`, Lucide-react NOT used (we ship our own SVGs).

**Spec reference:** `docs/superpowers/specs/2026-05-06-marlbro-design.md` — especially §10 (brand & visual system), §10.10 (SVG asset inventory), §4 (sitemap), §12 (tech stack).

---

## File Structure (created by this plan)

```
package.json
tsconfig.json
next.config.mjs
tailwind.config.ts
postcss.config.mjs
.eslintrc.json
.prettierrc
vitest.config.ts
vitest.setup.ts
.github/workflows/ci.yml
.env.example
README.md

app/
  layout.tsx                    Root layout, font loading, metadata
  page.tsx                      / — Home (placeholder hero)
  globals.css                   CSS custom properties + base reset
  not-found.tsx                 404 page
  bounties/page.tsx             /bounties placeholder
  apply/page.tsx                /apply placeholder
  wall/page.tsx                 /wall placeholder
  manifesto/page.tsx            /manifesto placeholder
  faq/page.tsx                  /faq placeholder

components/
  ui/
    Button.tsx                  Brutalist button primitive
    Button.test.tsx
    Input.tsx                   Form input primitive
    Input.test.tsx
    Card.tsx                    Bordered card with shadow
    Card.test.tsx
    Tag.tsx                     Mono-caps chip
    Tag.test.tsx
    Stamp.tsx                   Rotated stamp SVG primitive
    Stamp.test.tsx
    ChevronDivider.tsx          The recurring chevron motif
    ChevronDivider.test.tsx
  layout/
    TopBar.tsx                  Red top-bar with Foundation branding
    TopBar.test.tsx
    Footer.tsx                  Ink footer with disclaimers
    Footer.test.tsx
    PageShell.tsx               Wraps all pages — TopBar + main + Footer
  icons/
    index.ts                    Barrel — re-exports all icons
    Chevron.tsx
    CigaretteLit.tsx
    PackOutline.tsx
    XMark.tsx                   Twitter "X" mark, single color
    SolscanMark.tsx
    CopyMark.tsx
    ExternalLink.tsx
    Info.tsx
    Warning.tsx
    Success.tsx
    Error.tsx

lib/
  tokens.ts                     Design tokens as TS — single source of truth
  cn.ts                         clsx+tailwind-merge helper

public/
  favicon.ico
  og-default.png                Default OG image (will be replaced later)
```

## Test Strategy

Each component gets a colocated `.test.tsx` covering: (1) renders without crashing, (2) applies expected classes / accessibility attributes, (3) responds to interactions where applicable. Snapshot tests are deliberately avoided — we'll assert visible behavior, not markup churn.

For pages, we don't unit-test placeholder content; we cover them via a single integration check that every sitemap route returns 200 (Task 25).

---

## Task 1: Initialize Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `next-env.d.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `postcss.config.mjs`, `tailwind.config.ts`, `.eslintrc.json`

- [ ] **Step 1: Run create-next-app with explicit options**

```bash
cd /Users/valtoosh/Malbro-red
npx create-next-app@latest . \
  --ts \
  --tailwind \
  --app \
  --src-dir false \
  --import-alias "@/*" \
  --eslint \
  --use-npm \
  --no-turbopack \
  --skip-install
```

Expected: Files created in current directory. Note: project root already has `.git/`, `.gitignore`, and `docs/` — `create-next-app` should not clobber those. If it asks about overwriting `.gitignore`, choose to merge by overwriting then re-applying our existing `.gitignore` content.

- [ ] **Step 2: Reapply our `.gitignore` after create-next-app**

Re-write `.gitignore` to merge Next.js defaults with our existing entries. Final content:

```
# Brainstorm session artifacts (visual companion)
.superpowers/

# Dependencies
node_modules/
.pnpm-store/

# Build outputs
.next/
dist/
build/
out/

# Environment
.env
.env.local
.env.*.local

# OS
.DS_Store
Thumbs.db

# Editors
.vscode/
.idea/
*.swp

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Caches
.cache/
.turbo/
.vercel/
next-env.d.ts
```

- [ ] **Step 3: Install dependencies**

```bash
npm install
```

Expected: lockfile created, no errors.

- [ ] **Step 4: Verify dev server starts**

```bash
npm run dev &
sleep 5
curl -s http://localhost:3000 | head -20
kill %1
```

Expected: HTML response. Kill server.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 15 project with TypeScript and Tailwind"
```

---

## Task 2: Install runtime dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime deps**

```bash
npm install clsx tailwind-merge
```

Expected: `clsx` and `tailwind-merge` added to `dependencies` in `package.json`.

- [ ] **Step 2: Install dev deps for testing**

```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @types/react @types/react-dom @types/node prettier prettier-plugin-tailwindcss
```

Expected: dev dependencies added.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install runtime + test dependencies"
```

---

## Task 3: Configure Vitest

**Files:**
- Create: `vitest.config.ts`, `vitest.setup.ts`
- Modify: `package.json` (scripts), `tsconfig.json` (include test setup)

- [ ] **Step 1: Write `vitest.config.ts`**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    include: ['**/*.test.{ts,tsx}'],
    css: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

- [ ] **Step 2: Install `@vitejs/plugin-react`**

```bash
npm install -D @vitejs/plugin-react
```

- [ ] **Step 3: Write `vitest.setup.ts`**

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
```

- [ ] **Step 4: Add test scripts to `package.json`**

Replace the existing `"scripts"` block with:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:ui": "vitest --ui",
  "format": "prettier --write \"**/*.{ts,tsx,css,md}\""
}
```

- [ ] **Step 5: Add Prettier config**

Create `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

- [ ] **Step 6: Verify Vitest runs (no tests yet — it should report 0 tests)**

```bash
npm test
```

Expected: `No test files found` is acceptable; non-zero exit code from "no tests" is acceptable. If Vitest itself fails to run with a config error, fix it before continuing.

- [ ] **Step 7: Commit**

```bash
git add vitest.config.ts vitest.setup.ts package.json package-lock.json .prettierrc
git commit -m "chore: configure Vitest + Prettier"
```

---

## Task 4: Define design tokens

**Files:**
- Create: `lib/tokens.ts`
- Create: `lib/cn.ts`
- Test: `lib/tokens.test.ts`

This file is the **single source of truth** for design tokens. CSS custom properties (Task 5) and Tailwind config (Task 6) both consume from this module's exported constants.

- [ ] **Step 1: Write the failing test**

```typescript
// lib/tokens.test.ts
import { describe, it, expect } from 'vitest';
import { COLOR, TYPE, SHADOW, BORDER } from './tokens';

describe('design tokens', () => {
  it('exposes the seven brand colors with stable hex values', () => {
    expect(COLOR.paper).toBe('#F4ECD6');
    expect(COLOR.paper2).toBe('#EBDFC0');
    expect(COLOR.ink).toBe('#0A0A0A');
    expect(COLOR.ink2).toBe('#1A1411');
    expect(COLOR.marlbro).toBe('#C2161A');
    expect(COLOR.marlbroDeep).toBe('#8B0E12');
    expect(COLOR.gold).toBe('#C9A227');
    expect(COLOR.stampRed).toBe('#A11C1F');
  });

  it('exposes the type scale in px units', () => {
    expect(TYPE.scale.d1).toBe('96px');
    expect(TYPE.scale.body).toBe('16px');
    expect(TYPE.scale.eyebrow).toBe('10px');
  });

  it('exposes solid offset shadows with no blur', () => {
    expect(SHADOW.sm).toBe('4px 4px 0 #0A0A0A');
    expect(SHADOW.md).toBe('6px 6px 0 #0A0A0A');
    expect(SHADOW.lg).toBe('10px 10px 0 #0A0A0A');
  });

  it('exposes border weights', () => {
    expect(BORDER.default).toBe('2px');
    expect(BORDER.card).toBe('4px');
    expect(BORDER.poster).toBe('6px');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- lib/tokens.test.ts
```

Expected: FAIL with module-not-found / undefined exports.

- [ ] **Step 3: Implement `lib/tokens.ts`**

```typescript
// lib/tokens.ts
// Single source of truth for Marlbro design tokens.
// CSS custom properties (app/globals.css) and Tailwind config
// (tailwind.config.ts) MUST consume from this module — never hard-code.

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
```

- [ ] **Step 4: Implement `lib/cn.ts`**

```typescript
// lib/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
npm test -- lib/tokens.test.ts
```

Expected: PASS, 4 tests.

- [ ] **Step 6: Commit**

```bash
git add lib/tokens.ts lib/tokens.test.ts lib/cn.ts
git commit -m "feat(tokens): add design tokens module with full brand palette and type scale"
```

---

## Task 5: Wire CSS custom properties to globals.css

**Files:**
- Modify: `app/globals.css` (replace contents from create-next-app)

- [ ] **Step 1: Replace `app/globals.css` contents**

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Color tokens — keep in sync with lib/tokens.ts */
    --paper: #f4ecd6;
    --paper-2: #ebdfc0;
    --ink: #0a0a0a;
    --ink-2: #1a1411;
    --marlbro: #c2161a;
    --marlbro-deep: #8b0e12;
    --gold: #c9a227;
    --stamp-red: #a11c1f;

    /* Border weights */
    --border-default: 2px;
    --border-card: 4px;
    --border-poster: 6px;

    /* Solid offset shadows (no blur — brutalism) */
    --shadow-sm: 4px 4px 0 var(--ink);
    --shadow-md: 6px 6px 0 var(--ink);
    --shadow-lg: 10px 10px 0 var(--ink);
  }

  html {
    background: var(--paper);
    color: var(--ink);
    -webkit-font-smoothing: antialiased;
  }

  body {
    font-family: var(--font-inter), system-ui, sans-serif;
    font-size: 16px;
    line-height: 1.5;
  }

  /* Brutalism never rounds corners */
  *,
  *::before,
  *::after {
    border-radius: 0 !important;
  }

  /* Halftone overlay utility — applied to red panels */
  .halftone-overlay {
    position: relative;
  }
  .halftone-overlay::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image: radial-gradient(var(--ink) 1px, transparent 1px);
    background-size: 6px 6px;
    opacity: 0.12;
  }
}
```

- [ ] **Step 2: Visually verify (manual)**

```bash
npm run dev &
sleep 5
curl -s http://localhost:3000 | grep -i "marlbro\|paper" || true
kill %1
```

Expected: dev server starts; the body should now render on cream paper background. CSS custom properties don't show in HTML grep — visual verification is via the page rendering, which we'll do after Task 6.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(tokens): wire color, border, and shadow CSS variables into globals.css"
```

---

## Task 6: Configure Tailwind

**Files:**
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Replace `tailwind.config.ts`**

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'var(--paper)',
        'paper-2': 'var(--paper-2)',
        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        marlbro: 'var(--marlbro)',
        'marlbro-deep': 'var(--marlbro-deep)',
        gold: 'var(--gold)',
        'stamp-red': 'var(--stamp-red)',
      },
      fontFamily: {
        display: ['var(--font-inter-tight)', 'sans-serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'monospace'],
      },
      fontSize: {
        eyebrow: ['10px', { lineHeight: '1', letterSpacing: '0.12em' }],
        caption: ['12px', { lineHeight: '1.3', letterSpacing: '0.04em' }],
        bodyS: ['14px', { lineHeight: '1.5' }],
        body: ['16px', { lineHeight: '1.5' }],
        bodyL: ['18px', { lineHeight: '1.5' }],
        h3: ['24px', { lineHeight: '1.2' }],
        h2: ['32px', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        h1: ['48px', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        d2: ['72px', { lineHeight: '1', letterSpacing: '-0.03em' }],
        d1: ['96px', { lineHeight: '1', letterSpacing: '-0.04em' }],
      },
      borderWidth: {
        DEFAULT: '2px',
        card: '4px',
        poster: '6px',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        none: 'none',
      },
      borderRadius: {
        none: '0',
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 2: Verify Tailwind compiles**

```bash
npm run build 2>&1 | tail -20
```

Expected: build succeeds. If a missing dependency error appears for `tailwindcss`, ensure it was installed by `create-next-app` — version should be `^3.4`.

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat(tokens): map design tokens into Tailwind theme"
```

---

## Task 7: Configure fonts in root layout

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Replace `app/layout.tsx`**

```tsx
// app/layout.tsx
import type { Metadata } from 'next';
import { Inter, Inter_Tight, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '700'],
  display: 'swap',
});

const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-inter-tight',
  weight: ['700', '900'],
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-plex-mono',
  weight: ['500'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'The Marlbro Foundation',
    template: '%s · The Marlbro Foundation',
  },
  description:
    'The Marlbro Foundation provides discretionary subsidies to qualifying applicants pursuant to Schedule R-7.',
  metadataBase: new URL('https://marlbro.com'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${interTight.variable} ${plexMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Verify build still passes**

```bash
npm run build 2>&1 | tail -10
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat(layout): load Inter, Inter Tight, IBM Plex Mono via next/font"
```

---

## Task 8: Build the Button component

**Files:**
- Create: `components/ui/Button.tsx`
- Test: `components/ui/Button.test.tsx`

Button spec from §10.5: 4px ink border, 6px ink shadow, paper or red fill. Hover: shadow → 2px, transform → translate(2px, 2px). Click: shadow → 0, transform → translate(6px, 6px). Two variants: `primary` (red fill) and `ghost` (paper fill).

- [ ] **Step 1: Write the failing test**

```tsx
// components/ui/Button.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Apply for grant</Button>);
    expect(screen.getByRole('button', { name: 'Apply for grant' })).toBeInTheDocument();
  });

  it('applies primary variant classes by default', () => {
    render(<Button>x</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toMatch(/bg-marlbro/);
    expect(btn.className).toMatch(/text-paper/);
    expect(btn.className).toMatch(/border-card/);
  });

  it('applies ghost variant classes when variant="ghost"', () => {
    render(<Button variant="ghost">x</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toMatch(/bg-paper/);
    expect(btn.className).toMatch(/text-ink/);
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    let clicked = false;
    render(<Button onClick={() => (clicked = true)}>x</Button>);
    await user.click(screen.getByRole('button'));
    expect(clicked).toBe(true);
  });

  it('respects disabled prop', () => {
    render(<Button disabled>x</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('forwards type prop', () => {
    render(<Button type="submit">x</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- components/ui/Button.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `components/ui/Button.tsx`**

```tsx
// components/ui/Button.tsx
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const base =
  'inline-flex items-center justify-center px-[22px] py-[14px] ' +
  'font-display text-body uppercase tracking-[0.04em] font-black ' +
  'border-card border-ink shadow-md ' +
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
  { variant = 'primary', className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], className)}
      {...props}
    />
  );
});
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test -- components/ui/Button.test.tsx
```

Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add components/ui/Button.tsx components/ui/Button.test.tsx
git commit -m "feat(ui): add Button primitive with primary and ghost variants"
```

---

## Task 9: Build the Input component

**Files:**
- Create: `components/ui/Input.tsx`
- Test: `components/ui/Input.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/ui/Input.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input aria-label="wallet" />);
    expect(screen.getByLabelText('wallet')).toBeInTheDocument();
  });

  it('uses mono font by default', () => {
    render(<Input aria-label="x" />);
    expect(screen.getByLabelText('x').className).toMatch(/font-mono/);
  });

  it('uses sans font when variant="prose"', () => {
    render(<Input aria-label="x" variant="prose" />);
    expect(screen.getByLabelText('x').className).toMatch(/font-sans/);
  });

  it('accepts user typing', async () => {
    const user = userEvent.setup();
    render(<Input aria-label="x" />);
    const input = screen.getByLabelText('x');
    await user.type(input, 'hello');
    expect(input).toHaveValue('hello');
  });

  it('respects disabled prop', () => {
    render(<Input aria-label="x" disabled />);
    expect(screen.getByLabelText('x')).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- components/ui/Input.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `components/ui/Input.tsx`**

```tsx
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
  'focus:outline-none focus:border-card focus:shadow-[6px_6px_0_var(--marlbro)] ' +
  'transition-shadow duration-[80ms] ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

const variants: Record<InputVariant, string> = {
  mono: 'font-mono text-bodyS tracking-[0.04em]',
  prose: 'font-sans text-body',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { variant = 'mono', className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(base, variants[variant], className)} {...props} />;
});
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test -- components/ui/Input.test.tsx
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add components/ui/Input.tsx components/ui/Input.test.tsx
git commit -m "feat(ui): add Input primitive with mono and prose variants"
```

---

## Task 10: Build the Card component

**Files:**
- Create: `components/ui/Card.tsx`
- Test: `components/ui/Card.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/ui/Card.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>content</Card>);
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('applies card border and shadow by default', () => {
    render(
      <Card>
        <span>x</span>
      </Card>,
    );
    const card = screen.getByText('x').parentElement!;
    expect(card.className).toMatch(/border-card/);
    expect(card.className).toMatch(/shadow-md/);
  });

  it('uses poster border when variant="poster"', () => {
    render(
      <Card variant="poster">
        <span>x</span>
      </Card>,
    );
    const card = screen.getByText('x').parentElement!;
    expect(card.className).toMatch(/border-poster/);
    expect(card.className).toMatch(/shadow-lg/);
  });

  it('forwards arbitrary props (e.g. id)', () => {
    render(
      <Card id="grant-1">
        <span>x</span>
      </Card>,
    );
    const card = screen.getByText('x').parentElement!;
    expect(card).toHaveAttribute('id', 'grant-1');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- components/ui/Card.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `components/ui/Card.tsx`**

```tsx
// components/ui/Card.tsx
import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type CardVariant = 'card' | 'poster';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variants: Record<CardVariant, string> = {
  card: 'border-card border-ink shadow-md bg-paper',
  poster: 'border-poster border-ink shadow-lg bg-paper',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'card', className, ...props },
  ref,
) {
  return <div ref={ref} className={cn(variants[variant], className)} {...props} />;
});
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test -- components/ui/Card.test.tsx
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add components/ui/Card.tsx components/ui/Card.test.tsx
git commit -m "feat(ui): add Card primitive with card and poster variants"
```

---

## Task 11: Build the Tag component

**Files:**
- Create: `components/ui/Tag.tsx`
- Test: `components/ui/Tag.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/ui/Tag.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Tag } from './Tag';

describe('Tag', () => {
  it('renders children in uppercase mono', () => {
    render(<Tag>new account</Tag>);
    const tag = screen.getByText(/new account/i);
    expect(tag.className).toMatch(/font-mono/);
    expect(tag.className).toMatch(/uppercase/);
  });

  it('uses paper bg with ink border by default', () => {
    render(<Tag>x</Tag>);
    const tag = screen.getByText('x');
    expect(tag.className).toMatch(/bg-paper/);
    expect(tag.className).toMatch(/border-ink/);
  });

  it('uses red theme when variant="alert"', () => {
    render(<Tag variant="alert">x</Tag>);
    const tag = screen.getByText('x');
    expect(tag.className).toMatch(/bg-marlbro/);
    expect(tag.className).toMatch(/text-paper/);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- components/ui/Tag.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `components/ui/Tag.tsx`**

```tsx
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
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test -- components/ui/Tag.test.tsx
```

Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add components/ui/Tag.tsx components/ui/Tag.test.tsx
git commit -m "feat(ui): add Tag primitive with default, alert, and muted variants"
```

---

## Task 12: Build the Stamp component

**Files:**
- Create: `components/ui/Stamp.tsx`
- Test: `components/ui/Stamp.test.tsx`

Per §10.5: rotated rect with text inside, color stamp-red, hand-drawn-feel via slight transform irregularity. Used for status: APPROVED, REJECTED, PAID, etc.

- [ ] **Step 1: Write the failing test**

```tsx
// components/ui/Stamp.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Stamp } from './Stamp';

describe('Stamp', () => {
  it('renders the label', () => {
    render(<Stamp label="OFFICIALLY DISBURSED" />);
    expect(screen.getByText('OFFICIALLY DISBURSED')).toBeInTheDocument();
  });

  it('uses stamp-red color and ink-style border by default', () => {
    render(<Stamp label="PAID" />);
    const stamp = screen.getByText('PAID').parentElement!;
    expect(stamp.className).toMatch(/text-stamp-red/);
    expect(stamp.className).toMatch(/border-stamp-red/);
  });

  it('applies rotation via inline style from rotate prop', () => {
    render(<Stamp label="VOID" rotate={-15} />);
    const stamp = screen.getByText('VOID').parentElement!;
    expect(stamp.style.transform).toContain('rotate(-15deg)');
  });

  it('defaults to -12deg rotation', () => {
    render(<Stamp label="DRAFT" />);
    const stamp = screen.getByText('DRAFT').parentElement!;
    expect(stamp.style.transform).toContain('rotate(-12deg)');
  });

  it('uses ink color when variant="ink"', () => {
    render(<Stamp label="X" variant="ink" />);
    const stamp = screen.getByText('X').parentElement!;
    expect(stamp.className).toMatch(/text-ink/);
    expect(stamp.className).toMatch(/border-ink/);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- components/ui/Stamp.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `components/ui/Stamp.tsx`**

```tsx
// components/ui/Stamp.tsx
import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type StampVariant = 'stamp' | 'ink';

export interface StampProps extends HTMLAttributes<HTMLSpanElement> {
  label: string;
  rotate?: number;
  variant?: StampVariant;
}

const base =
  'inline-flex items-center px-[8px] py-[5px] border-[3px] bg-paper/95 ' +
  'font-display font-black text-[9px] uppercase tracking-[0.18em] ' +
  'pointer-events-none select-none';

const variants: Record<StampVariant, string> = {
  stamp: 'text-stamp-red border-stamp-red',
  ink: 'text-ink border-ink',
};

export const Stamp = forwardRef<HTMLSpanElement, StampProps>(function Stamp(
  { label, rotate = -12, variant = 'stamp', className, style, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(base, variants[variant], className)}
      style={{ transform: `rotate(${rotate}deg)`, ...style }}
      {...props}
    >
      <span>{label}</span>
    </span>
  );
});
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test -- components/ui/Stamp.test.tsx
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add components/ui/Stamp.tsx components/ui/Stamp.test.tsx
git commit -m "feat(ui): add Stamp primitive with rotation and stamp/ink variants"
```

---

## Task 13: Build the ChevronDivider component

**Files:**
- Create: `components/ui/ChevronDivider.tsx`
- Test: `components/ui/ChevronDivider.test.tsx`

The Marlboro pack chevron — single triangular notch, used as section divider. SVG-based.

- [ ] **Step 1: Write the failing test**

```tsx
// components/ui/ChevronDivider.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChevronDivider } from './ChevronDivider';

describe('ChevronDivider', () => {
  it('renders an svg with the chevron-divider role/test-id', () => {
    render(<ChevronDivider data-testid="chevron" />);
    expect(screen.getByTestId('chevron').tagName.toLowerCase()).toBe('svg');
  });

  it('uses ink fill by default', () => {
    render(<ChevronDivider data-testid="x" />);
    expect(screen.getByTestId('x').className.baseVal).toMatch(/fill-ink/);
  });

  it('uses marlbro fill when variant="red"', () => {
    render(<ChevronDivider variant="red" data-testid="x" />);
    expect(screen.getByTestId('x').className.baseVal).toMatch(/fill-marlbro/);
  });

  it('renders with explicit aria-hidden', () => {
    render(<ChevronDivider data-testid="x" />);
    expect(screen.getByTestId('x')).toHaveAttribute('aria-hidden', 'true');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- components/ui/ChevronDivider.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `components/ui/ChevronDivider.tsx`**

```tsx
// components/ui/ChevronDivider.tsx
import { forwardRef, type SVGAttributes } from 'react';
import { cn } from '@/lib/cn';

type ChevronVariant = 'ink' | 'red';

export interface ChevronDividerProps extends SVGAttributes<SVGSVGElement> {
  variant?: ChevronVariant;
}

const fills: Record<ChevronVariant, string> = {
  ink: 'fill-ink',
  red: 'fill-marlbro',
};

export const ChevronDivider = forwardRef<SVGSVGElement, ChevronDividerProps>(
  function ChevronDivider({ variant = 'ink', className, ...props }, ref) {
    return (
      <svg
        ref={ref}
        viewBox="0 0 100 28"
        preserveAspectRatio="none"
        aria-hidden="true"
        className={cn('block w-full h-[28px]', fills[variant], className)}
        {...props}
      >
        <polygon points="0,0 100,0 50,28" />
      </svg>
    );
  },
);
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test -- components/ui/ChevronDivider.test.tsx
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add components/ui/ChevronDivider.tsx components/ui/ChevronDivider.test.tsx
git commit -m "feat(ui): add ChevronDivider with ink and red variants"
```

---

## Task 14: Build the SVG icon library

**Files:**
- Create: `components/icons/Chevron.tsx`, `CigaretteLit.tsx`, `PackOutline.tsx`, `XMark.tsx`, `SolscanMark.tsx`, `CopyMark.tsx`, `ExternalLink.tsx`, `Info.tsx`, `Warning.tsx`, `Success.tsx`, `Error.tsx`
- Create: `components/icons/index.ts`
- Test: `components/icons/icons.test.tsx`

Per §10.10: all icons are single-color SVG, sized by `width`/`height` props (defaults to 1em), color by `currentColor`, semantic markup. **No emojis ever.** All icons are accessible — they accept `aria-label` for meaningful icons or default to `aria-hidden="true"` decoratively.

- [ ] **Step 1: Write the failing test**

```tsx
// components/icons/icons.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  Chevron,
  CigaretteLit,
  PackOutline,
  XMark,
  SolscanMark,
  CopyMark,
  ExternalLink,
  Info,
  Warning,
  Success,
  Error,
} from './index';

describe('icon library', () => {
  const allIcons = [
    ['Chevron', Chevron],
    ['CigaretteLit', CigaretteLit],
    ['PackOutline', PackOutline],
    ['XMark', XMark],
    ['SolscanMark', SolscanMark],
    ['CopyMark', CopyMark],
    ['ExternalLink', ExternalLink],
    ['Info', Info],
    ['Warning', Warning],
    ['Success', Success],
    ['Error', Error],
  ] as const;

  it.each(allIcons)('renders %s as svg', (_, Icon) => {
    const { container } = render(<Icon />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it.each(allIcons)('%s uses currentColor for fill or stroke', (_, Icon) => {
    const { container } = render(<Icon />);
    const svg = container.querySelector('svg')!;
    const html = svg.outerHTML;
    expect(html).toMatch(/currentColor/);
  });

  it.each(allIcons)('%s defaults to aria-hidden when no label given', (_, Icon) => {
    const { container } = render(<Icon />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('aria-hidden')).toBe('true');
  });

  it.each(allIcons)('%s uses role="img" with aria-label when labeled', (_, Icon) => {
    const { container } = render(<Icon aria-label="test label" />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('test label');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- components/icons/icons.test.tsx
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Create the shared `IconBase` helper**

Create `components/icons/_base.tsx`:

```tsx
// components/icons/_base.tsx
import type { SVGAttributes } from 'react';

export interface IconProps extends SVGAttributes<SVGSVGElement> {
  size?: number | string;
}

export function svgProps({ size = '1em', ...rest }: IconProps): SVGAttributes<SVGSVGElement> {
  const labeled = rest['aria-label'] !== undefined;
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    role: labeled ? 'img' : undefined,
    'aria-hidden': labeled ? undefined : true,
    ...rest,
  } as SVGAttributes<SVGSVGElement>;
}
```

- [ ] **Step 4: Implement each icon**

Create `components/icons/Chevron.tsx`:

```tsx
import { svgProps, type IconProps } from './_base';

export function Chevron(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <polygon points="0,0 24,0 12,24" fill="currentColor" />
    </svg>
  );
}
```

Create `components/icons/CigaretteLit.tsx`:

```tsx
import { svgProps, type IconProps } from './_base';

export function CigaretteLit(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      {/* cigarette body */}
      <rect x="2" y="13" width="14" height="3" fill="currentColor" />
      {/* filter */}
      <rect x="2" y="13" width="3" height="3" fill="currentColor" opacity="0.5" />
      {/* ember */}
      <rect x="16" y="13" width="2" height="3" fill="currentColor" />
      {/* smoke */}
      <path
        d="M19 12 Q 21 9 19 6 Q 17 3 19 0"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />
    </svg>
  );
}
```

Create `components/icons/PackOutline.tsx`:

```tsx
import { svgProps, type IconProps } from './_base';

export function PackOutline(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      {/* outer pack */}
      <rect x="4" y="4" width="16" height="18" stroke="currentColor" strokeWidth="2" fill="none" />
      {/* chevron flap */}
      <polygon points="4,4 20,4 12,11" fill="currentColor" />
    </svg>
  );
}
```

Create `components/icons/XMark.tsx`:

```tsx
import { svgProps, type IconProps } from './_base';

export function XMark(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path
        d="M3.5 3 L 13 13 L 3.5 22 H 6 L 14.2 14 L 19 22 H 21.5 L 14.5 13 L 21.5 3 H 19 L 13 11 L 6 3 H 3.5 Z"
        fill="currentColor"
      />
    </svg>
  );
}
```

Create `components/icons/SolscanMark.tsx`:

```tsx
import { svgProps, type IconProps } from './_base';

export function SolscanMark(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <rect x="3" y="6" width="18" height="3" fill="currentColor" />
      <rect x="3" y="11" width="14" height="3" fill="currentColor" />
      <rect x="7" y="16" width="14" height="3" fill="currentColor" />
    </svg>
  );
}
```

Create `components/icons/CopyMark.tsx`:

```tsx
import { svgProps, type IconProps } from './_base';

export function CopyMark(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <rect x="8" y="4" width="12" height="14" stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="4" y="8" width="12" height="14" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  );
}
```

Create `components/icons/ExternalLink.tsx`:

```tsx
import { svgProps, type IconProps } from './_base';

export function ExternalLink(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <polyline points="14,4 20,4 20,10" stroke="currentColor" strokeWidth="2" fill="none" />
      <line x1="20" y1="4" x2="11" y2="13" stroke="currentColor" strokeWidth="2" />
      <polyline
        points="18,14 18,20 4,20 4,6 10,6"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}
```

Create `components/icons/Info.tsx`:

```tsx
import { svgProps, type IconProps } from './_base';

export function Info(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <rect x="3" y="3" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="11" y="7" width="2" height="2" fill="currentColor" />
      <rect x="11" y="11" width="2" height="6" fill="currentColor" />
    </svg>
  );
}
```

Create `components/icons/Warning.tsx`:

```tsx
import { svgProps, type IconProps } from './_base';

export function Warning(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <polygon
        points="12,3 22,21 2,21"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <rect x="11" y="9" width="2" height="6" fill="currentColor" />
      <rect x="11" y="17" width="2" height="2" fill="currentColor" />
    </svg>
  );
}
```

Create `components/icons/Success.tsx`:

```tsx
import { svgProps, type IconProps } from './_base';

export function Success(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <rect x="3" y="3" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" />
      <polyline
        points="7,12 11,16 17,8"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}
```

Create `components/icons/Error.tsx`:

```tsx
import { svgProps, type IconProps } from './_base';

export function Error(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <rect x="3" y="3" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" />
      <line x1="7" y1="7" x2="17" y2="17" stroke="currentColor" strokeWidth="2" />
      <line x1="17" y1="7" x2="7" y2="17" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
```

- [ ] **Step 5: Create the barrel `index.ts`**

```tsx
// components/icons/index.ts
export { Chevron } from './Chevron';
export { CigaretteLit } from './CigaretteLit';
export { PackOutline } from './PackOutline';
export { XMark } from './XMark';
export { SolscanMark } from './SolscanMark';
export { CopyMark } from './CopyMark';
export { ExternalLink } from './ExternalLink';
export { Info } from './Info';
export { Warning } from './Warning';
export { Success } from './Success';
export { Error } from './Error';
export type { IconProps } from './_base';
```

- [ ] **Step 6: Run the test to verify it passes**

```bash
npm test -- components/icons/icons.test.tsx
```

Expected: PASS, 44 tests (4 assertions × 11 icons).

- [ ] **Step 7: Commit**

```bash
git add components/icons
git commit -m "feat(icons): add SVG icon library with 11 single-color icons"
```

---

## Task 15: Build the TopBar layout component

**Files:**
- Create: `components/layout/TopBar.tsx`
- Test: `components/layout/TopBar.test.tsx`

Per §10 brand preview: red top-bar with "The Marlbro Foundation · Est. 2026" on left and "Schedule R-7 · Form 042-A" on right, mono caps, gold underline.

- [ ] **Step 1: Write the failing test**

```tsx
// components/layout/TopBar.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopBar } from './TopBar';

describe('TopBar', () => {
  it('shows the foundation name', () => {
    render(<TopBar />);
    expect(screen.getByText(/The Marlbro Foundation/i)).toBeInTheDocument();
  });

  it('shows a schedule reference', () => {
    render(<TopBar />);
    expect(screen.getByText(/Schedule R-7/i)).toBeInTheDocument();
  });

  it('uses the brand red background', () => {
    render(<TopBar data-testid="topbar" />);
    expect(screen.getByTestId('topbar').className).toMatch(/bg-marlbro/);
  });

  it('accepts an override schedule prop', () => {
    render(<TopBar schedule="Form 999-Z" />);
    expect(screen.getByText(/Form 999-Z/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- components/layout/TopBar.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `components/layout/TopBar.tsx`**

```tsx
// components/layout/TopBar.tsx
import { cn } from '@/lib/cn';

export interface TopBarProps {
  schedule?: string;
  className?: string;
  'data-testid'?: string;
}

export function TopBar({
  schedule = 'Schedule R-7 · Form 042-A',
  className,
  ...rest
}: TopBarProps) {
  return (
    <header
      className={cn(
        'relative bg-marlbro text-paper border-b-card border-ink',
        'px-7 py-3.5 flex justify-between items-center',
        'font-mono text-eyebrow uppercase tracking-[0.12em]',
        className,
      )}
      {...rest}
    >
      <span>The Marlbro Foundation · Est. 2026</span>
      <span>{schedule}</span>
      {/* Gold rule beneath */}
      <span
        aria-hidden="true"
        className="absolute left-0 right-0 -bottom-[10px] h-[6px] bg-gold border-b-card border-ink"
      />
    </header>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test -- components/layout/TopBar.test.tsx
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add components/layout/TopBar.tsx components/layout/TopBar.test.tsx
git commit -m "feat(layout): add TopBar with foundation branding and gold underline"
```

---

## Task 16: Build the Footer layout component

**Files:**
- Create: `components/layout/Footer.tsx`
- Test: `components/layout/Footer.test.tsx`

Per §10 preview: ink black background, mono caps text, "All applications subject to Schedule R-7" left, "NOT FINANCIAL ADVICE · NOT TAX ADVICE" right.

- [ ] **Step 1: Write the failing test**

```tsx
// components/layout/Footer.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer', () => {
  it('shows schedule reference', () => {
    render(<Footer />);
    expect(screen.getByText(/Schedule R-7/i)).toBeInTheDocument();
  });

  it('shows the not-financial-advice disclaimer', () => {
    render(<Footer />);
    expect(screen.getByText(/NOT FINANCIAL ADVICE/i)).toBeInTheDocument();
  });

  it('uses ink background and paper text', () => {
    render(<Footer data-testid="footer" />);
    const footer = screen.getByTestId('footer');
    expect(footer.className).toMatch(/bg-ink/);
    expect(footer.className).toMatch(/text-paper/);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- components/layout/Footer.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `components/layout/Footer.tsx`**

```tsx
// components/layout/Footer.tsx
import { cn } from '@/lib/cn';
import { ChevronDivider } from '@/components/ui/ChevronDivider';

export interface FooterProps {
  className?: string;
  'data-testid'?: string;
}

export function Footer({ className, ...rest }: FooterProps) {
  return (
    <>
      <ChevronDivider />
      <footer
        className={cn(
          'bg-ink text-paper px-7 py-3.5',
          'font-mono text-eyebrow uppercase tracking-[0.12em]',
          'flex justify-between items-center flex-wrap gap-3',
          className,
        )}
        {...rest}
      >
        <span>§ All applications subject to Schedule R-7</span>
        <span>NOT FINANCIAL ADVICE · NOT TAX ADVICE</span>
      </footer>
    </>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test -- components/layout/Footer.test.tsx
```

Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add components/layout/Footer.tsx components/layout/Footer.test.tsx
git commit -m "feat(layout): add Footer with chevron divider and disclaimer text"
```

---

## Task 17: Build the PageShell wrapper

**Files:**
- Create: `components/layout/PageShell.tsx`

The PageShell wraps the entire page: TopBar at top, main content area in middle, Footer at bottom. Pages compose with `<PageShell>{...content}</PageShell>`.

- [ ] **Step 1: Implement `components/layout/PageShell.tsx`**

No dedicated test — exercised indirectly by every page integration test in Task 25.

```tsx
// components/layout/PageShell.tsx
import { TopBar } from './TopBar';
import { Footer } from './Footer';

export interface PageShellProps {
  children: React.ReactNode;
  schedule?: string;
}

export function PageShell({ children, schedule }: PageShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <TopBar schedule={schedule} />
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-8 md:px-16 py-12">
        {children}
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build 2>&1 | tail -15
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/layout/PageShell.tsx
git commit -m "feat(layout): add PageShell wrapper composing TopBar + main + Footer"
```

---

## Task 18: Build the Home page placeholder

**Files:**
- Modify: `app/page.tsx` (replace from create-next-app default)

Per §10.8: hero is right-half framed poster (image area) with type stack on left ~40%. For Plan 1 we render a placeholder image area with a labeled empty Card pending the real Marlbro Girl asset (Plan 6 / Phase 12).

- [ ] **Step 1: Replace `app/page.tsx`**

```tsx
// app/page.tsx
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';

export default function HomePage() {
  return (
    <PageShell>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section className="lg:col-span-5">
          <p className="font-mono text-eyebrow uppercase tracking-[0.12em] mb-4">
            §01 — APPLICATION
          </p>
          <h1 className="font-display font-black text-h1 lg:text-d2 leading-[0.95] tracking-[-0.04em]">
            RIDE FOR THE
            <br />
            <span className="text-marlbro">MARLBRO</span>.
          </h1>
          <p className="text-bodyL mt-5 max-w-[520px] text-ink-2">
            The Foundation provides discretionary subsidies, denominated in $MARLBRO and SOL, to
            applicants who furnish documentation of authentic engagement with the namesake article.
            Pursuant to Schedule R-7, all submissions are subject to manual review.
          </p>
          <div className="flex gap-4 mt-8 flex-wrap">
            <Button asChild={false}>
              <Link href="/apply" className="inline-block">
                Apply for grant
              </Link>
            </Button>
            <Button variant="ghost">
              <Link href="/bounties" className="inline-block">
                View bounties
              </Link>
            </Button>
          </div>
        </section>

        <section className="lg:col-span-7">
          <Card variant="poster" className="aspect-[4/5] flex items-center justify-center">
            <p className="font-mono text-caption uppercase tracking-[0.12em] text-ink/40">
              Figure 1 — to be furnished
            </p>
          </Card>
        </section>
      </div>
    </PageShell>
  );
}
```

Note: `<Button asChild={false}>` — Button doesn't currently support `asChild`; we wrap `Link` *inside* the button as children. The button wraps a Link tag; this is acceptable for placeholder phase. (If Plan 2 wants Radix-style polymorphic Button, that's a Plan 2 decision.)

Actually, simpler — just render the link as the button itself with className:

Replace the Buttons block with:

```tsx
<div className="flex gap-4 mt-8 flex-wrap">
  <Link
    href="/apply"
    className="inline-flex items-center justify-center px-[22px] py-[14px] font-display text-body uppercase tracking-[0.04em] font-black border-card border-ink shadow-md transition-[transform,box-shadow] duration-[80ms] ease-out hover:shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] bg-marlbro text-paper"
  >
    Apply for grant
  </Link>
  <Link
    href="/bounties"
    className="inline-flex items-center justify-center px-[22px] py-[14px] font-display text-body uppercase tracking-[0.04em] font-black border-card border-ink shadow-md transition-[transform,box-shadow] duration-[80ms] ease-out hover:shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] bg-paper text-ink"
  >
    View bounties
  </Link>
</div>
```

This duplicates the Button styling — not ideal. Plan 2 will refactor Button to be polymorphic via a small `asChild`/`render` pattern. For Plan 1, we ship this duplication and note the debt.

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -10
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat(home): build homepage placeholder with hero type stack and figure card"
```

---

## Task 19: Build placeholder pages for /bounties, /apply, /wall, /manifesto, /faq

**Files:**
- Create: `app/bounties/page.tsx`, `app/apply/page.tsx`, `app/wall/page.tsx`, `app/manifesto/page.tsx`, `app/faq/page.tsx`

Each page: PageShell with eyebrow label, page title (D2 size), brief deadpan paragraph, a Tag indicating phase status. Demonstrates that the brand system applies consistently across routes.

- [ ] **Step 1: Implement `app/bounties/page.tsx`**

```tsx
// app/bounties/page.tsx
import { PageShell } from '@/components/layout/PageShell';
import { Tag } from '@/components/ui/Tag';

export const metadata = { title: 'Bounty Board' };

export default function BountiesPage() {
  return (
    <PageShell schedule="Schedule R-7 · Form 042-B">
      <p className="font-mono text-eyebrow uppercase tracking-[0.12em] mb-4">
        §02 — BOUNTY BOARD
      </p>
      <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
        BOUNTY BOARD
      </h1>
      <p className="text-bodyL mt-5 max-w-[720px]">
        A registry of curated discretionary grants currently open for application. Each posting
        constitutes a Statement of Work pursuant to Schedule R-7 §11(a).
      </p>
      <div className="mt-8">
        <Tag variant="muted">FORTHCOMING — PLAN 2 IMPLEMENTATION</Tag>
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 2: Implement `app/apply/page.tsx`**

```tsx
// app/apply/page.tsx
import { PageShell } from '@/components/layout/PageShell';
import { Tag } from '@/components/ui/Tag';

export const metadata = { title: 'Open Grant Application' };

export default function ApplyPage() {
  return (
    <PageShell schedule="Schedule R-7 · Form 042-A">
      <p className="font-mono text-eyebrow uppercase tracking-[0.12em] mb-4">
        §03 — OPEN GRANT
      </p>
      <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
        FORM 042-A · OPEN GRANT APPLICATION
      </h1>
      <p className="text-bodyL mt-5 max-w-[720px]">
        The standard application instrument for the Open Grant lane. The applicant shall furnish
        documentation of an authenticated transaction.
      </p>
      <div className="mt-8">
        <Tag variant="muted">FORTHCOMING — PLAN 3 IMPLEMENTATION</Tag>
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 3: Implement `app/wall/page.tsx`**

```tsx
// app/wall/page.tsx
import { PageShell } from '@/components/layout/PageShell';
import { Tag } from '@/components/ui/Tag';

export const metadata = { title: 'Wall of Grants' };

export default function WallPage() {
  return (
    <PageShell schedule="Schedule R-7 · Form 042-W">
      <p className="font-mono text-eyebrow uppercase tracking-[0.12em] mb-4">
        §04 — WALL OF GRANTS
      </p>
      <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
        WALL OF GRANTS
      </h1>
      <p className="text-bodyL mt-5 max-w-[720px]">
        A perpetually-updated public registry of disbursed grants. Each entry reflects a
        successfully executed disbursement on the Solana ledger.
      </p>
      <div className="mt-8">
        <Tag variant="muted">FORTHCOMING — PLAN 5 IMPLEMENTATION</Tag>
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 4: Implement `app/manifesto/page.tsx`**

```tsx
// app/manifesto/page.tsx
import { PageShell } from '@/components/layout/PageShell';
import { Tag } from '@/components/ui/Tag';

export const metadata = { title: 'Manifesto' };

export default function ManifestoPage() {
  return (
    <PageShell schedule="Schedule R-7 · Disclosure §14">
      <p className="font-mono text-eyebrow uppercase tracking-[0.12em] mb-4">
        §05 — MANIFESTO
      </p>
      <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
        ON THE MATTER OF GLORY.
      </h1>
      <p className="text-bodyL mt-5 max-w-[720px]">
        The Foundation observes a generational decline in masculine carriage, attributable in part
        to the substitution of the cigarette by the rechargeable nicotine vaporizer — an article of
        demonstrably non-Marlbro-compatible aesthetic.
      </p>
      <div className="mt-8">
        <Tag variant="muted">FORTHCOMING — FULL TEXT IN PLAN 2</Tag>
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 5: Implement `app/faq/page.tsx`**

```tsx
// app/faq/page.tsx
import { PageShell } from '@/components/layout/PageShell';
import { Tag } from '@/components/ui/Tag';

export const metadata = { title: 'Frequently Asked Questions' };

export default function FaqPage() {
  return (
    <PageShell schedule="Schedule R-7 · Disclosure §F">
      <p className="font-mono text-eyebrow uppercase tracking-[0.12em] mb-4">
        §06 — FREQUENTLY ASKED QUESTIONS
      </p>
      <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
        FREQUENTLY ASKED QUESTIONS
      </h1>
      <p className="text-bodyL mt-5 max-w-[720px]">
        General disclosures. The information furnished herein does not constitute financial advice,
        tax advice, or medical advice.
      </p>
      <div className="mt-8">
        <Tag variant="muted">FORTHCOMING — PLAN 2 IMPLEMENTATION</Tag>
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 6: Verify build**

```bash
npm run build 2>&1 | tail -20
```

Expected: build succeeds, all 5 routes listed in build output.

- [ ] **Step 7: Commit**

```bash
git add app/bounties/page.tsx app/apply/page.tsx app/wall/page.tsx app/manifesto/page.tsx app/faq/page.tsx
git commit -m "feat(routes): scaffold placeholder pages for bounties, apply, wall, manifesto, faq"
```

---

## Task 20: Build the 404 page

**Files:**
- Create: `app/not-found.tsx`

Per §10.8: 404 page features the Marlbro Girl with a clipboard. For Plan 1, we render the deadpan copy + APPLICATION NOT FOUND stamp. The image lands in Plan 6.

- [ ] **Step 1: Implement `app/not-found.tsx`**

```tsx
// app/not-found.tsx
import { PageShell } from '@/components/layout/PageShell';
import { Stamp } from '@/components/ui/Stamp';
import Link from 'next/link';

export const metadata = { title: 'Application Not Found' };

export default function NotFound() {
  return (
    <PageShell schedule="Schedule R-7 · Form 404">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section className="lg:col-span-7">
          <p className="font-mono text-eyebrow uppercase tracking-[0.12em] mb-4">
            §404 — RECORD NOT ON FILE
          </p>
          <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
            APPLICATION NOT FOUND.
          </h1>
          <p className="text-bodyL mt-5 max-w-[560px]">
            The Foundation has reviewed its records and is unable to locate the requested
            instrument. The applicant may consult the Bounty Board or file a fresh Form 042-A.
          </p>
          <div className="mt-8 inline-block">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-[22px] py-[14px] font-display text-body uppercase tracking-[0.04em] font-black border-card border-ink shadow-md transition-[transform,box-shadow] duration-[80ms] ease-out hover:shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] bg-marlbro text-paper"
            >
              Return to Home
            </Link>
          </div>
        </section>
        <section className="lg:col-span-5 flex items-start justify-center pt-8">
          <Stamp label="APPLICATION NOT FOUND" rotate={-8} />
        </section>
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -10
```

Expected: build succeeds; `/not-found` shown in route output.

- [ ] **Step 3: Commit**

```bash
git add app/not-found.tsx
git commit -m "feat(404): build Application Not Found page with stamp"
```

---

## Task 21: Add ESLint + TypeScript strict config

**Files:**
- Modify: `.eslintrc.json`, `tsconfig.json`

- [ ] **Step 1: Replace `.eslintrc.json` (or `eslint.config.mjs` if present)**

If `.eslintrc.json` exists:

```json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

If `create-next-app` generated `eslint.config.mjs` instead, leave its base intact and add the rules block in the `rules` section of the exported config.

- [ ] **Step 2: Tighten `tsconfig.json`**

Modify the `compilerOptions` block of `tsconfig.json` to include:

```json
"strict": true,
"noUncheckedIndexedAccess": true,
"noImplicitOverride": true,
"noFallthroughCasesInSwitch": true
```

(Merge into the existing `compilerOptions` block — do not remove other settings created by Next.js.)

- [ ] **Step 3: Run typecheck — fix any new errors**

```bash
npm run typecheck
```

Expected: no errors. If `noUncheckedIndexedAccess` produces errors in template code, narrow the access (use `?.` or explicit guards) — do not loosen the config.

- [ ] **Step 4: Run lint**

```bash
npm run lint
```

Expected: 0 errors, 0 warnings.

- [ ] **Step 5: Commit**

```bash
git add .eslintrc.json eslint.config.mjs tsconfig.json 2>/dev/null || true
git add -A
git commit -m "chore: enable strict TypeScript and ESLint rules"
```

---

## Task 22: Run full test suite

**Files:** none

- [ ] **Step 1: Run all tests**

```bash
npm test
```

Expected: all tests pass. Exit code 0.

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: 0 errors.

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: 0 errors.

- [ ] **Step 4: Run production build**

```bash
npm run build
```

Expected: build succeeds, all routes (`/`, `/bounties`, `/apply`, `/wall`, `/manifesto`, `/faq`, `/_not-found`) are listed in the route table.

- [ ] **Step 5: No commit needed** — this task is a validation gate only.

---

## Task 23: Add GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Implement the CI workflow**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    name: typecheck · lint · test · build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Typecheck
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm test

      - name: Build
        run: npm run build
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow for typecheck, lint, test, build"
```

- [ ] **Step 3: Push branch and verify CI runs**

```bash
git push origin main
```

Then check `gh run list --limit 1` to confirm the workflow started:

```bash
sleep 10
gh run list --limit 1
```

Expected: at least one workflow run for the latest commit. If it fails, fix locally and push again — do not skip CI.

---

## Task 24: Configure Vercel project (manual handoff)

**Files:** none — this task is a runbook for the human operator. Subagent should pause here and surface the steps.

The subagent cannot perform this task itself (Vercel auth is interactive). The agent should output the runbook below as a deliverable, ask the operator to complete it, and continue once the operator confirms.

- [ ] **Step 1: Output the runbook to the operator**

Print:

```
=== Vercel deploy setup — operator action required ===

1. Go to https://vercel.com/new
2. Import the GitHub repo: valtoosh/Malbro
3. Framework preset: Next.js (auto-detected)
4. Root Directory: ./
5. Build Command: (leave default — `next build`)
6. Output Directory: (leave default — `.next`)
7. Install Command: (leave default — `npm install`)
8. Environment variables: none required for Plan 1
9. Click Deploy
10. Once deployed, set up the production domain (marlbro.com or chosen alt) under Project Settings → Domains. Defer DNS if not ready.

After deployment succeeds, paste the preview URL here and the agent will verify it loads.
```

- [ ] **Step 2: Wait for operator to provide deployed URL.**

- [ ] **Step 3: Verify deployed URL responds**

```bash
curl -s -o /dev/null -w "%{http_code}\n" $DEPLOYED_URL/
curl -s -o /dev/null -w "%{http_code}\n" $DEPLOYED_URL/bounties
curl -s -o /dev/null -w "%{http_code}\n" $DEPLOYED_URL/apply
curl -s -o /dev/null -w "%{http_code}\n" $DEPLOYED_URL/wall
curl -s -o /dev/null -w "%{http_code}\n" $DEPLOYED_URL/manifesto
curl -s -o /dev/null -w "%{http_code}\n" $DEPLOYED_URL/faq
curl -s -o /dev/null -w "%{http_code}\n" $DEPLOYED_URL/totally-not-a-real-route
```

Expected: 200, 200, 200, 200, 200, 200, 404.

---

## Task 25: Integration test — every route returns 200 in dev

**Files:**
- Create: `tests/integration/routes.test.ts`

A simple smoke test that verifies the build output includes every expected route. We avoid spinning up a dev server in CI for speed; instead, we rely on Next.js's static analysis of the App Router, which fails the build if a page has a runtime error.

- [ ] **Step 1: Write the integration test**

```typescript
// tests/integration/routes.test.ts
import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';

describe('app router structure', () => {
  const root = process.cwd();
  const routes = [
    'app/page.tsx',
    'app/bounties/page.tsx',
    'app/apply/page.tsx',
    'app/wall/page.tsx',
    'app/manifesto/page.tsx',
    'app/faq/page.tsx',
    'app/not-found.tsx',
    'app/layout.tsx',
  ];

  it.each(routes)('has %s on disk', (route) => {
    expect(existsSync(join(root, route))).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it passes**

```bash
npm test -- tests/integration/routes.test.ts
```

Expected: PASS, 8 tests.

- [ ] **Step 3: Commit**

```bash
git add tests/integration/routes.test.ts
git commit -m "test: add route structure smoke test"
```

---

## Task 26: Write README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write `README.md`**

```markdown
# Marlbro

> The Marlbro Foundation provides discretionary subsidies, denominated in $MARLBRO and SOL, to applicants who furnish documentation of authentic engagement with the namesake article. Pursuant to Schedule R-7, all submissions are subject to manual review.

## Status

This is **Plan 1 (Foundation)** of a multi-plan build. See `docs/superpowers/plans/` for the active build plan and `docs/superpowers/specs/2026-05-06-marlbro-design.md` for the full design spec.

## Tech stack

- Next.js 15 (App Router, TypeScript)
- Tailwind v3 with CSS custom-property design tokens
- Vitest + Testing Library for unit tests
- Vercel for deploys, GitHub Actions for CI

## Local dev

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | What |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |

## Project structure

```
app/                     Next.js App Router routes
components/ui/           Generic primitives (Button, Card, Stamp, ...)
components/layout/       TopBar, Footer, PageShell
components/icons/        Custom SVG icons (no emojis ever)
lib/tokens.ts            Design tokens — single source of truth
docs/superpowers/specs/  Design specs
docs/superpowers/plans/  Build plans
```

## Brand rules (high-level)

- All icons / status badges / glyphs are custom SVG. No emojis anywhere.
- Border radius is always 0.
- Drop shadows are solid offset, never blurred.
- No dark mode.
- See `docs/superpowers/specs/2026-05-06-marlbro-design.md` §10 for the full system.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with project overview, scripts, and brand rules"
```

---

## Task 27: Final push + validate

**Files:** none

- [ ] **Step 1: Push all commits**

```bash
git push origin main
```

- [ ] **Step 2: Verify CI passes**

```bash
sleep 30
gh run list --limit 1 --json status,conclusion,name
```

Expected: `status: completed`, `conclusion: success`. If failed, fetch logs:

```bash
gh run view --log-failed
```

Fix locally and push again.

- [ ] **Step 3: Done — output a summary**

The agent should output:

```
=== PLAN 1 COMPLETE ===

Foundation shipped. The site is deployed and every sitemap route is reachable
with the full brand system applied.

Components built (with tests): Button, Input, Card, Tag, Stamp, ChevronDivider,
TopBar, Footer, PageShell, plus 11 SVG icons.

Routes scaffolded: /, /bounties, /apply, /wall, /manifesto, /faq, /not-found.

CI: GitHub Actions running typecheck + lint + test + build on every push.
Deploy: Vercel auto-deploy on push to main.

Known debt to address in Plan 2:
- Button is not yet polymorphic (Link-as-button uses inlined classnames).
- No `<a>` link styling primitive yet.
- No Footnote or DisclosureList primitives yet.
- No content rendering for /bounties, /apply, /wall, /manifesto, /faq.

Ready for Plan 2.
```

---

## Self-Review

**Spec coverage:**
- §10.1 color tokens — covered in Task 4 (lib/tokens.ts) + Task 5 (globals.css) + Task 6 (Tailwind).
- §10.2 typography — covered in Task 4 + Task 6 (Tailwind fontSize) + Task 7 (font loading).
- §10.3 grid + spacing — partially covered (max-width 1280, padding clamped via Tailwind responsive prefixes in PageShell). 8px baseline is implicit via Tailwind defaults.
- §10.4 borders + shadows — Task 4 + Task 6.
- §10.5 component primitives — Button (Task 8), Input (9), Card (10), Tag (11), Stamp (12). Poster card primitive deferred to Plan 5 (Wall) — no need in Plan 1. Footnote deferred to Plan 2.
- §10.6 motifs — Chevron (Task 13). Halftone utility class added in globals.css (Task 5). Cigarette burn assets deferred (Plan 6 brand asset task). Schedule references are in placeholder copy.
- §10.7 imagery rules — enforced by content (no images yet, no emojis, no mascot).
- §10.8 hero brand asset — placeholder figure card (Task 18). Real asset in Plan 6.
- §10.9 voice + copy — placeholder copy follows the deadpan register (Task 18, 19, 20).
- §10.10 SVG asset inventory — 11 of the listed icons built (Task 14). Status stamps are produced via Stamp primitive (Task 12). Cluster/anti-fraud badges and remaining decorative assets deferred to Plan 4 (admin) and Plan 6 (brand assets).
- §10.11 microinteractions — button press effect (Task 8). Stamp slam (Plan 5). Loading ETAs (Plan 3).
- §10.12 forbidden list — enforced via `border-radius: 0 !important` in globals.css (Task 5). No gradients, no glassmorphism, no emojis, no spinners — none introduced.
- §4 sitemap — all 6 public placeholder routes scaffolded (Task 18, 19, 20). Admin route deferred to Plan 2.
- §12 tech stack — Next.js 15, Tailwind, Vitest, Vercel, GitHub Actions all configured.

Missing from Plan 1 (intentionally deferred to subsequent plans):
- Backend, database, Solana, Squads, Twitter — Plans 2–5.
- Hero/manifesto/404 image assets — Plan 6.
- Bounty/grant/wall content — Plans 2, 3, 5.

**Placeholder scan:** No "TBD" / "TODO" / "implement later" / "fill in details" in any task body. Every step has runnable commands or complete code blocks. The Vercel deploy task (24) is explicitly a runbook for the operator with concrete steps, not "configure Vercel" hand-waving.

**Type consistency:** All component props match across tests and implementations: `Button.variant`, `Input.variant`, `Card.variant`, `Stamp.{label, rotate, variant}`, `ChevronDivider.variant`, `Tag.variant`, `TopBar.schedule`, `PageShell.{children, schedule}`. Token names match between `lib/tokens.ts` exports, CSS custom properties, and Tailwind config.

---

*End of Plan 1.*
