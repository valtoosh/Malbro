# Marlbro · Plan 2 — Public Site Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan.

**Goal:** Ship a fully-readable public site — every page has real content, primitives missing from Plan 1 are added, sample data drives /bounties and /wall so the site looks alive even before the database lands. Outcome at end of plan: a visitor can navigate the site end-to-end, read the manifesto, browse sample bounties, see the wall of grants — all static / sample-data-driven, no DB, no auth, no Solana yet.

**Architecture:** Pure frontend additions on top of Plan 1's foundation. Sample data lives in a single `lib/sampleData.ts` module so Plan 4 can swap it for DB calls cleanly. Polymorphic Button via Radix-style `asChild` pattern (no Radix dep — small inline implementation).

**Tech Stack:** Same as Plan 1. Adds: nothing new. Pure code additions.

**Spec reference:** `docs/superpowers/specs/2026-05-06-marlbro-design.md` — especially §10.5 (component primitives), §10.9 (voice + copy), §3 (sitemap), §11 (manifesto thesis).

**Plan 1 debt this plan resolves:**
- Polymorphic Button (Link rendered as Button)
- Link / `<a>` styling primitive
- Footnote primitive (the "§14(b)(ii)" deadpan-voice device)
- DisclosureList primitive (FAQ accordion)
- PosterCard primitive (used for /bounties cards + /wall posters)
- Real content for /manifesto and /faq
- Sample data driving /bounties and /wall

---

## File Structure (created/modified by this plan)

```
lib/
  sampleData.ts                  Sample bounties + sample wall posters
  sampleData.test.ts

components/ui/
  Button.tsx                     [modified] — adds asChild prop
  Button.test.tsx                [modified] — tests asChild
  LinkPrimitive.tsx              Styled <a> primitive (named to avoid Next collision)
  LinkPrimitive.test.tsx
  Footnote.tsx                   Superscript footnote with collector context
  Footnote.test.tsx
  FootnoteList.tsx               Renders the collected disclosures section
  FootnoteList.test.tsx
  DisclosureList.tsx             FAQ accordion, no-JS-friendly via <details>
  DisclosureList.test.tsx
  PosterCard.tsx                 Vertical 4:5 poster card
  PosterCard.test.tsx
  BountyCard.tsx                 Bounty Board card variant
  BountyCard.test.tsx

app/
  page.tsx                       [modified] — featured bounties strip, polished CTAs
  bounties/page.tsx              [modified] — read sample bounties, render BountyCard grid
  bounties/[number]/page.tsx     New — bounty detail page
  bounties/[number]/not-found.tsx
  wall/page.tsx                  [modified] — read sample posters, render PosterCard grid
  wall/[id]/page.tsx             New — single poster detail
  wall/[id]/not-found.tsx
  manifesto/page.tsx             [modified] — full content
  faq/page.tsx                   [modified] — DisclosureList of FAQ entries
```

---

## Task 1: Polymorphic Button (asChild support)

**Files:** Modify `components/ui/Button.tsx`, `components/ui/Button.test.tsx`.

We add an `asChild` prop. When `asChild` is true, Button renders the *first child element* with the Button's classes merged in (instead of a `<button>`). Lets `<Link>` (or `<a>`) be a Button without duplicating classNames.

- [ ] **Step 1: Append new tests to `components/ui/Button.test.tsx`** (after existing `describe` block):

```tsx
import { describe as describePoly, it as itPoly, expect as expectPoly } from 'vitest';
import { render as renderPoly, screen as screenPoly } from '@testing-library/react';
import { Button as ButtonPoly } from './Button';

describePoly('Button asChild', () => {
  itPoly('renders the child element with button classes when asChild', () => {
    renderPoly(
      <ButtonPoly asChild>
        <a href="/x" data-testid="anchor">click me</a>
      </ButtonPoly>,
    );
    const a = screenPoly.getByTestId('anchor');
    expectPoly(a.tagName.toLowerCase()).toBe('a');
    expectPoly(a.className).toMatch(/bg-marlbro/);
    expectPoly(a.className).toMatch(/border-4/);
    expectPoly(a).toHaveAttribute('href', '/x');
  });

  itPoly('preserves child variant via Button variant prop', () => {
    renderPoly(
      <ButtonPoly asChild variant="ghost">
        <a href="/y" data-testid="anchor">x</a>
      </ButtonPoly>,
    );
    const a = screenPoly.getByTestId('anchor');
    expectPoly(a.className).toMatch(/bg-paper/);
    expectPoly(a.className).toMatch(/text-ink/);
  });

  itPoly('throws or warns sensibly with multiple children', () => {
    // React.Children.only will throw — we want to surface the error early.
    expectPoly(() => {
      renderPoly(
        <ButtonPoly asChild>
          <a href="/x">a</a>
          <span>b</span>
        </ButtonPoly>,
      );
    }).toThrow();
  });
});
```

- [ ] **Step 2: Run test, expect FAIL** — `npm test -- components/ui/Button.test.tsx`

- [ ] **Step 3: Modify `components/ui/Button.tsx`**:

```tsx
// components/ui/Button.tsx
import { Children, cloneElement, forwardRef, isValidElement, type ButtonHTMLAttributes, type ReactElement } from 'react';
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
    <button
      ref={ref}
      type={type}
      className={composed}
      {...props}
    >
      {children}
    </button>
  );
});
```

- [ ] **Step 4: Run tests** — all Button tests pass (6 original + 3 new = 9).

- [ ] **Step 5: Commit**

```bash
git add components/ui/Button.tsx components/ui/Button.test.tsx
git commit -m "feat(ui): add Button asChild for polymorphic rendering"
```

---

## Task 2: LinkPrimitive component

**Files:** Create `components/ui/LinkPrimitive.tsx`, `components/ui/LinkPrimitive.test.tsx`.

A styled inline link. Uses Next.js `<Link>` for internal hrefs, native `<a>` for external (auto-detected). Underlines on hover, marlbro-red on hover.

- [ ] **Step 1: Test**

```tsx
// components/ui/LinkPrimitive.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LinkPrimitive } from './LinkPrimitive';

describe('LinkPrimitive', () => {
  it('renders an anchor with the href', () => {
    render(<LinkPrimitive href="/x">click</LinkPrimitive>);
    expect(screen.getByRole('link', { name: 'click' })).toHaveAttribute('href', '/x');
  });

  it('treats absolute http(s) links as external', () => {
    render(<LinkPrimitive href="https://example.com">x</LinkPrimitive>);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('does not set target on internal links', () => {
    render(<LinkPrimitive href="/x">x</LinkPrimitive>);
    expect(screen.getByRole('link')).not.toHaveAttribute('target');
  });

  it('applies underline + marlbro hover classes', () => {
    render(<LinkPrimitive href="/x">x</LinkPrimitive>);
    const cls = screen.getByRole('link').className;
    expect(cls).toMatch(/underline/);
    expect(cls).toMatch(/hover:text-marlbro/);
  });
});
```

- [ ] **Step 2: Run tests, expect FAIL.**

- [ ] **Step 3: Implement `components/ui/LinkPrimitive.tsx`**:

```tsx
// components/ui/LinkPrimitive.tsx
import NextLink from 'next/link';
import type { AnchorHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface LinkPrimitiveProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

const base = 'underline underline-offset-[3px] decoration-2 decoration-ink hover:text-marlbro hover:decoration-marlbro transition-colors';

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
```

- [ ] **Step 4: Run tests, expect PASS (4 tests).**

- [ ] **Step 5: Commit**

```bash
git add components/ui/LinkPrimitive.tsx components/ui/LinkPrimitive.test.tsx
git commit -m "feat(ui): add LinkPrimitive for inline links"
```

---

## Task 3: Footnote + FootnoteList primitives

Two coupled primitives. `<Footnote>` produces a superscript number where it appears AND registers itself with a context. `<FootnoteList>` reads the context and renders the collected disclosures at the bottom. Designed to render without JS (server components stay possible for the consumer page).

For simplicity (and because we don't yet need cross-component context across server boundaries), we'll use a *manual* counter pattern: the consumer passes the footnote text as a prop and gets back the rendered superscript + the entry, both via separate exports. A simpler "manual numbering" pattern works for the current page count.

**Files:** Create `components/ui/Footnote.tsx`, `components/ui/Footnote.test.tsx`, `components/ui/FootnoteList.tsx`, `components/ui/FootnoteList.test.tsx`.

- [ ] **Step 1: Test for Footnote**

```tsx
// components/ui/Footnote.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footnote } from './Footnote';

describe('Footnote', () => {
  it('renders a superscript with the number', () => {
    render(<Footnote n={3} />);
    const sup = screen.getByText('³', { exact: false });
    expect(sup.tagName.toLowerCase()).toBe('sup');
  });

  it('uses superscript characters for 1-9', () => {
    const { container, rerender } = render(<Footnote n={1} />);
    expect(container.textContent).toBe('¹');
    rerender(<Footnote n={9} />);
    expect(container.textContent).toBe('⁹');
  });

  it('falls back to digits with parens for n > 9', () => {
    const { container } = render(<Footnote n={12} />);
    expect(container.textContent).toContain('(12)');
  });

  it('links to the footnote anchor', () => {
    render(<Footnote n={4} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '#fn-4');
  });
});
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement `components/ui/Footnote.tsx`**:

```tsx
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
      <a href={`#fn-${n}`} className="no-underline hover:underline decoration-marlbro hover:text-marlbro">
        {toSuperscript(n)}
      </a>
    </sup>
  );
}
```

- [ ] **Step 4: Run tests, expect PASS (4 tests).**

- [ ] **Step 5: Test for FootnoteList**

```tsx
// components/ui/FootnoteList.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FootnoteList } from './FootnoteList';

describe('FootnoteList', () => {
  it('renders a list of disclosures with anchor IDs', () => {
    render(
      <FootnoteList
        items={[
          { n: 1, text: 'First disclosure.' },
          { n: 2, text: 'Second disclosure.' },
        ]}
      />,
    );
    expect(screen.getByText('First disclosure.')).toBeInTheDocument();
    expect(screen.getByText('Second disclosure.')).toBeInTheDocument();
    const list = screen.getByRole('list');
    expect(list.querySelector('#fn-1')).not.toBeNull();
    expect(list.querySelector('#fn-2')).not.toBeNull();
  });

  it('shows the "DISCLOSURES" heading', () => {
    render(<FootnoteList items={[{ n: 1, text: 'x' }]} />);
    expect(screen.getByText(/DISCLOSURES/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run, expect FAIL.**

- [ ] **Step 7: Implement `components/ui/FootnoteList.tsx`**:

```tsx
// components/ui/FootnoteList.tsx
export interface FootnoteEntry {
  n: number;
  text: React.ReactNode;
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
          <li key={item.n} id={`fn-${item.n}`} className="font-mono text-caption text-ink-2 flex gap-3">
            <span className="font-bold text-ink shrink-0">[{item.n}]</span>
            <span>{item.text}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
```

- [ ] **Step 8: Run tests, expect PASS (2 tests).**

- [ ] **Step 9: Commit**

```bash
git add components/ui/Footnote.tsx components/ui/Footnote.test.tsx components/ui/FootnoteList.tsx components/ui/FootnoteList.test.tsx
git commit -m "feat(ui): add Footnote and FootnoteList primitives"
```

---

## Task 4: DisclosureList component

A no-JS-friendly accordion using native `<details>` + `<summary>`. Used on /faq.

**Files:** Create `components/ui/DisclosureList.tsx`, `components/ui/DisclosureList.test.tsx`.

- [ ] **Step 1: Test**

```tsx
// components/ui/DisclosureList.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DisclosureList } from './DisclosureList';

describe('DisclosureList', () => {
  it('renders each item as a details element', () => {
    render(
      <DisclosureList
        items={[
          { question: 'Q1', answer: 'A1' },
          { question: 'Q2', answer: 'A2' },
        ]}
      />,
    );
    expect(screen.getAllByRole('group')).toHaveLength(2);
  });

  it('renders question as the summary', () => {
    render(<DisclosureList items={[{ question: 'What?', answer: 'Yes.' }]} />);
    expect(screen.getByText('What?')).toBeInTheDocument();
  });

  it('renders answer in the body', () => {
    render(<DisclosureList items={[{ question: 'Q', answer: 'Specific answer.' }]} />);
    expect(screen.getByText('Specific answer.')).toBeInTheDocument();
  });

  it('opens by default when defaultOpen is true', () => {
    const { container } = render(
      <DisclosureList defaultOpen items={[{ question: 'Q', answer: 'A' }]} />,
    );
    const details = container.querySelector('details')!;
    expect(details.hasAttribute('open')).toBe(true);
  });
});
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement `components/ui/DisclosureList.tsx`**:

```tsx
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
            <span aria-hidden="true" className="font-mono font-black text-h3 transition-transform group-open:rotate-45 select-none">
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
```

- [ ] **Step 4: Run tests, expect PASS (4 tests).**

- [ ] **Step 5: Commit**

```bash
git add components/ui/DisclosureList.tsx components/ui/DisclosureList.test.tsx
git commit -m "feat(ui): add DisclosureList component using native details/summary"
```

---

## Task 5: Sample data module

**Files:** Create `lib/sampleData.ts`, `lib/sampleData.test.ts`.

The shape lines up with what Plan 4 will use as the DB row types.

- [ ] **Step 1: Test**

```tsx
// lib/sampleData.test.ts
import { describe, it, expect } from 'vitest';
import { SAMPLE_BOUNTIES, SAMPLE_POSTERS, getBountyByNumber, getPosterById } from './sampleData';

describe('sampleData', () => {
  it('exposes a non-empty list of bounties', () => {
    expect(SAMPLE_BOUNTIES.length).toBeGreaterThanOrEqual(4);
  });

  it('exposes a non-empty list of wall posters', () => {
    expect(SAMPLE_POSTERS.length).toBeGreaterThanOrEqual(5);
  });

  it('every bounty has a unique number', () => {
    const numbers = SAMPLE_BOUNTIES.map((b) => b.number);
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it('every poster has a unique displayNumber', () => {
    const ns = SAMPLE_POSTERS.map((p) => p.displayNumber);
    expect(new Set(ns).size).toBe(ns.length);
  });

  it('getBountyByNumber returns the matching bounty', () => {
    const first = SAMPLE_BOUNTIES[0]!;
    expect(getBountyByNumber(first.number)).toEqual(first);
  });

  it('getBountyByNumber returns undefined for unknown number', () => {
    expect(getBountyByNumber(99999)).toBeUndefined();
  });

  it('getPosterById returns the matching poster', () => {
    const p = SAMPLE_POSTERS[0]!;
    expect(getPosterById(p.id)).toEqual(p);
  });
});
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement `lib/sampleData.ts`**:

```tsx
// lib/sampleData.ts
// Static sample data driving /bounties and /wall pre-database.
// Plan 4 swaps these with DB queries.

export type BountyStatus = 'live' | 'paused' | 'exhausted' | 'expired';

export interface Bounty {
  id: string;
  number: number;
  title: string;
  brief: string;
  payoutMarlbro: number;
  payoutSol: number;
  maxClaims: number | null;
  claimsUsed: number;
  status: BountyStatus;
  deadline: string | null;
  locationConstraint: string | null;
}

export interface PosterGrant {
  id: string;
  displayNumber: number;
  bountyNumber: number | null;
  applicantHandle: string;
  walletShort: string;
  tweetQuote: string;
  payoutMarlbro: number;
  payoutSol: number;
  paidAt: string;
}

export const SAMPLE_BOUNTIES: ReadonlyArray<Bounty> = [
  {
    id: '00000001-0000-0000-0000-000000000001',
    number: 1,
    title: 'Standard Pack Disbursement',
    brief: 'The applicant shall furnish a photographic record of the procurement of one (1) pack of Marlboro Reds and an associated post on X tagging @marlbrotoken.',
    payoutMarlbro: 5000,
    payoutSol: 0,
    maxClaims: null,
    claimsUsed: 412,
    status: 'live',
    deadline: null,
    locationConstraint: null,
  },
  {
    id: '00000001-0000-0000-0000-000000000042',
    number: 42,
    title: 'Trans-Continental Carriage Demonstration',
    brief: 'Photograph the applicant smoking a Marlbro Red at a recognised intercontinental landmark. Foundation reviewers reserve discretionary judgement.',
    payoutMarlbro: 250000,
    payoutSol: 1.5,
    maxClaims: 3,
    claimsUsed: 1,
    status: 'live',
    deadline: '2026-06-30',
    locationConstraint: 'Recognised intercontinental landmark',
  },
  {
    id: '00000001-0000-0000-0000-000000000074',
    number: 74,
    title: 'Vape Renunciation Ceremony',
    brief: 'Documented surrender of one (1) rechargeable nicotine vaporizer to a Foundation-approved disposal vessel, accompanied by ignition of one (1) Marlbro Red.',
    payoutMarlbro: 50000,
    payoutSol: 0.25,
    maxClaims: 25,
    claimsUsed: 11,
    status: 'live',
    deadline: '2026-09-30',
    locationConstraint: null,
  },
  {
    id: '00000001-0000-0000-0000-000000000091',
    number: 91,
    title: 'Generational Bridge Demonstration',
    brief: 'Photograph the applicant in the company of a relative aged 65 or older, both partaking. Subject to verification of familial relation.',
    payoutMarlbro: 75000,
    payoutSol: 0.5,
    maxClaims: 10,
    claimsUsed: 2,
    status: 'live',
    deadline: null,
    locationConstraint: null,
  },
  {
    id: '00000001-0000-0000-0000-000000000113',
    number: 113,
    title: 'Open Road Carriage',
    brief: 'A photograph of the applicant smoking a Marlbro Red at the wheel of a stationary American manufactured automobile of model year 1995 or earlier.',
    payoutMarlbro: 35000,
    payoutSol: 0,
    maxClaims: 50,
    claimsUsed: 18,
    status: 'live',
    deadline: null,
    locationConstraint: 'United States',
  },
  {
    id: '00000001-0000-0000-0000-000000000200',
    number: 200,
    title: 'Sunset Disbursement',
    brief: 'Photograph the act at golden hour. Foundation prefers natural light; supplementary illumination disqualifies.',
    payoutMarlbro: 25000,
    payoutSol: 0,
    maxClaims: null,
    claimsUsed: 47,
    status: 'live',
    deadline: null,
    locationConstraint: null,
  },
];

export const SAMPLE_POSTERS: ReadonlyArray<PosterGrant> = [
  {
    id: 'poster-001',
    displayNumber: 1,
    bountyNumber: 1,
    applicantHandle: 'degenrider',
    walletShort: '5n3X···k7p4',
    tweetQuote: 'smoked one for the boys who can\'t anymore. lit it with the same match my grandfather used.',
    payoutMarlbro: 5000,
    payoutSol: 0,
    paidAt: '2026-04-12',
  },
  {
    id: 'poster-002',
    displayNumber: 2,
    bountyNumber: 42,
    applicantHandle: 'transcontinent',
    walletShort: '9hVa···2NBs',
    tweetQuote: 'eiffel tower at 3am. the marlbro burned slower in the cold.',
    payoutMarlbro: 250000,
    payoutSol: 1.5,
    paidAt: '2026-04-15',
  },
  {
    id: 'poster-003',
    displayNumber: 3,
    bountyNumber: 1,
    applicantHandle: 'last_real_man',
    walletShort: 'B4qP···kC1V',
    tweetQuote: 'first cigarette in 8 years. my hands remembered.',
    payoutMarlbro: 5000,
    payoutSol: 0,
    paidAt: '2026-04-20',
  },
  {
    id: 'poster-004',
    displayNumber: 4,
    bountyNumber: 74,
    applicantHandle: 'vape_quitter_4',
    walletShort: 'D7zQ···8XqA',
    tweetQuote: 'threw the elf bar in the gutter. struck the match. felt american again.',
    payoutMarlbro: 50000,
    payoutSol: 0.25,
    paidAt: '2026-04-22',
  },
  {
    id: 'poster-005',
    displayNumber: 5,
    bountyNumber: 91,
    applicantHandle: 'grandson_of_a_marine',
    walletShort: 'G3rT···Mn7P',
    tweetQuote: 'pop hadn\'t had one in 30 years. doctor said no. doctor wasn\'t there.',
    payoutMarlbro: 75000,
    payoutSol: 0.5,
    paidAt: '2026-04-26',
  },
  {
    id: 'poster-006',
    displayNumber: 6,
    bountyNumber: 1,
    applicantHandle: 'corner_store_poet',
    walletShort: 'H8vQ···r2kY',
    tweetQuote: 'the man behind the counter saw me buy a pack and just nodded. i\'ve been buying gum from him for years.',
    payoutMarlbro: 5000,
    payoutSol: 0,
    paidAt: '2026-04-28',
  },
  {
    id: 'poster-007',
    displayNumber: 7,
    bountyNumber: 113,
    applicantHandle: 'el_camino_88',
    walletShort: 'J2nW···p4CR',
    tweetQuote: 'parked at the overlook. windows down. smoke went where the radio used to.',
    payoutMarlbro: 35000,
    payoutSol: 0,
    paidAt: '2026-05-01',
  },
  {
    id: 'poster-008',
    displayNumber: 8,
    bountyNumber: 200,
    applicantHandle: 'last_light_2026',
    walletShort: 'K9bF···m1ZQ',
    tweetQuote: 'caught the last light off the silo. one for me, one for the dog.',
    payoutMarlbro: 25000,
    payoutSol: 0,
    paidAt: '2026-05-04',
  },
];

export function getBountyByNumber(n: number): Bounty | undefined {
  return SAMPLE_BOUNTIES.find((b) => b.number === n);
}

export function getPosterById(id: string): PosterGrant | undefined {
  return SAMPLE_POSTERS.find((p) => p.id === id);
}
```

- [ ] **Step 4: Run tests, expect PASS (7 tests).**

- [ ] **Step 5: Commit**

```bash
git add lib/sampleData.ts lib/sampleData.test.ts
git commit -m "feat(data): add sample bounties and wall posters"
```

---

## Task 6: PosterCard component

The Wall poster — vertical 4:5 aspect, red header bar with grant number + ISO date, tweet quote middle, payout + wallet + handle bottom, OFFICIALLY DISBURSED stamp.

**Files:** Create `components/ui/PosterCard.tsx`, `components/ui/PosterCard.test.tsx`.

- [ ] **Step 1: Test**

```tsx
// components/ui/PosterCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PosterCard } from './PosterCard';

const sample = {
  displayNumber: 42,
  paidAt: '2026-05-06',
  tweetQuote: 'a sample quote',
  payoutMarlbro: 5000,
  payoutSol: 0,
  walletShort: '5n3X···k7p4',
  applicantHandle: 'degenrider',
};

describe('PosterCard', () => {
  it('renders the grant number with a # prefix', () => {
    render(<PosterCard {...sample} />);
    expect(screen.getByText(/№\s*42/)).toBeInTheDocument();
  });

  it('renders the date', () => {
    render(<PosterCard {...sample} />);
    expect(screen.getByText('2026-05-06')).toBeInTheDocument();
  });

  it('renders the tweet quote', () => {
    render(<PosterCard {...sample} />);
    expect(screen.getByText('a sample quote', { exact: false })).toBeInTheDocument();
  });

  it('renders the payout in $MARLBRO with comma formatting', () => {
    render(<PosterCard {...sample} payoutMarlbro={250000} />);
    expect(screen.getByText(/250,000/)).toBeInTheDocument();
  });

  it('shows SOL when payoutSol > 0', () => {
    render(<PosterCard {...sample} payoutSol={1.5} />);
    expect(screen.getByText(/1\.5/)).toBeInTheDocument();
    expect(screen.getByText(/SOL/)).toBeInTheDocument();
  });

  it('does not show SOL when payoutSol is 0', () => {
    render(<PosterCard {...sample} payoutSol={0} />);
    expect(screen.queryByText(/SOL/)).toBeNull();
  });

  it('renders the wallet short', () => {
    render(<PosterCard {...sample} />);
    expect(screen.getByText(/5n3X···k7p4/)).toBeInTheDocument();
  });

  it('renders the applicant handle prefixed with @', () => {
    render(<PosterCard {...sample} />);
    expect(screen.getByText('@degenrider')).toBeInTheDocument();
  });

  it('renders the OFFICIALLY DISBURSED stamp', () => {
    render(<PosterCard {...sample} />);
    expect(screen.getByText(/OFFICIALLY DISBURSED/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement `components/ui/PosterCard.tsx`**:

```tsx
// components/ui/PosterCard.tsx
import { Card } from './Card';
import { Stamp } from './Stamp';

export interface PosterCardProps {
  displayNumber: number;
  paidAt: string;
  tweetQuote: string;
  payoutMarlbro: number;
  payoutSol: number;
  walletShort: string;
  applicantHandle: string;
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export function PosterCard({
  displayNumber,
  paidAt,
  tweetQuote,
  payoutMarlbro,
  payoutSol,
  walletShort,
  applicantHandle,
}: PosterCardProps) {
  return (
    <Card variant="poster" className="aspect-[4/5] flex flex-col bg-paper relative overflow-hidden">
      <div className="bg-marlbro text-paper px-4 py-2 border-b-[3px] border-ink flex justify-between items-baseline font-mono text-eyebrow uppercase tracking-[0.1em]">
        <span className="font-display font-black text-[14px] tracking-normal">GRANT №{displayNumber}</span>
        <span>{paidAt}</span>
      </div>
      <div className="flex-1 px-4 py-4 border-b-2 border-ink font-display font-bold text-bodyL leading-tight tracking-[-0.01em]">
        &ldquo;{tweetQuote}&rdquo;
      </div>
      <div className="px-4 py-3 border-b-2 border-ink font-display font-black text-h2 leading-none tracking-[-0.02em]">
        {formatNumber(payoutMarlbro)} <span className="text-eyebrow font-mono tracking-[0.1em] opacity-70">$MARLBRO</span>
        {payoutSol > 0 && (
          <span className="block text-h3 font-display font-black mt-1">
            +{payoutSol} <span className="text-eyebrow font-mono tracking-[0.1em] opacity-70">SOL</span>
          </span>
        )}
      </div>
      <div className="px-4 py-2 flex justify-between items-center font-mono text-eyebrow uppercase tracking-[0.06em]">
        <span>{walletShort}</span>
        <span>@{applicantHandle}</span>
      </div>
      <div className="absolute bottom-3 right-3 pointer-events-none">
        <Stamp label="OFFICIALLY DISBURSED" rotate={-12} />
      </div>
    </Card>
  );
}
```

- [ ] **Step 4: Run tests, expect PASS (9 tests).**

- [ ] **Step 5: Commit**

```bash
git add components/ui/PosterCard.tsx components/ui/PosterCard.test.tsx
git commit -m "feat(ui): add PosterCard for the Wall of Grants gallery"
```

---

## Task 7: BountyCard component

A grid card for the Bounty Board. Shows: grant number, title, brief excerpt, payout, claims-left or "unlimited", deadline, location constraint badge. Clickable.

**Files:** Create `components/ui/BountyCard.tsx`, `components/ui/BountyCard.test.tsx`.

- [ ] **Step 1: Test**

```tsx
// components/ui/BountyCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BountyCard } from './BountyCard';
import type { Bounty } from '@/lib/sampleData';

const bounty: Bounty = {
  id: 'b1',
  number: 42,
  title: 'Sample Bounty',
  brief: 'A sample brief description',
  payoutMarlbro: 250000,
  payoutSol: 1.5,
  maxClaims: 3,
  claimsUsed: 1,
  status: 'live',
  deadline: '2026-06-30',
  locationConstraint: 'Eiffel Tower',
};

describe('BountyCard', () => {
  it('shows grant number', () => {
    render(<BountyCard bounty={bounty} />);
    expect(screen.getByText(/№\s*42/)).toBeInTheDocument();
  });

  it('shows title', () => {
    render(<BountyCard bounty={bounty} />);
    expect(screen.getByText('Sample Bounty')).toBeInTheDocument();
  });

  it('shows payout in marlbro and sol', () => {
    render(<BountyCard bounty={bounty} />);
    expect(screen.getByText(/250,000/)).toBeInTheDocument();
    expect(screen.getByText(/1\.5/)).toBeInTheDocument();
  });

  it('shows claims left when capped', () => {
    render(<BountyCard bounty={bounty} />);
    expect(screen.getByText(/2 LEFT/i)).toBeInTheDocument();
  });

  it('shows UNLIMITED when maxClaims is null', () => {
    render(<BountyCard bounty={{ ...bounty, maxClaims: null, claimsUsed: 100 }} />);
    expect(screen.getByText(/UNLIMITED/i)).toBeInTheDocument();
  });

  it('shows EXHAUSTED when claimsUsed >= maxClaims', () => {
    render(<BountyCard bounty={{ ...bounty, claimsUsed: 3 }} />);
    expect(screen.getByText(/EXHAUSTED/i)).toBeInTheDocument();
  });

  it('shows deadline when present', () => {
    render(<BountyCard bounty={bounty} />);
    expect(screen.getByText(/2026-06-30/)).toBeInTheDocument();
  });

  it('shows location tag when present', () => {
    render(<BountyCard bounty={bounty} />);
    expect(screen.getByText('Eiffel Tower')).toBeInTheDocument();
  });

  it('links to /bounties/[number]', () => {
    render(<BountyCard bounty={bounty} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/bounties/42');
  });
});
```

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement `components/ui/BountyCard.tsx`**:

```tsx
// components/ui/BountyCard.tsx
import Link from 'next/link';
import { Card } from './Card';
import { Tag } from './Tag';
import type { Bounty } from '@/lib/sampleData';

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export interface BountyCardProps {
  bounty: Bounty;
}

export function BountyCard({ bounty }: BountyCardProps) {
  const left = bounty.maxClaims !== null ? Math.max(0, bounty.maxClaims - bounty.claimsUsed) : null;
  const isExhausted = bounty.maxClaims !== null && bounty.claimsUsed >= bounty.maxClaims;
  const claimsLabel = bounty.maxClaims === null ? 'UNLIMITED' : isExhausted ? 'EXHAUSTED' : `${left} LEFT`;
  const claimsVariant: 'default' | 'alert' | 'muted' = isExhausted ? 'alert' : 'default';

  return (
    <Link href={`/bounties/${bounty.number}`} className="block group">
      <Card className="h-full flex flex-col transition-transform duration-[80ms] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] group-hover:shadow-lg">
        <div className="bg-marlbro text-paper px-4 py-2 border-b-[3px] border-ink flex justify-between items-baseline font-mono text-eyebrow uppercase tracking-[0.1em]">
          <span className="font-display font-black text-[14px] tracking-normal">GRANT №{bounty.number}</span>
          {bounty.deadline && <span>DUE {bounty.deadline}</span>}
        </div>
        <div className="flex-1 p-4 flex flex-col gap-3">
          <h3 className="font-display font-black text-h3 leading-tight">{bounty.title}</h3>
          <p className="text-bodyS text-ink-2 leading-snug line-clamp-3">{bounty.brief}</p>
          <div className="mt-auto flex flex-wrap gap-2">
            <Tag variant={claimsVariant}>{claimsLabel}</Tag>
            {bounty.locationConstraint && <Tag variant="muted">{bounty.locationConstraint}</Tag>}
          </div>
        </div>
        <div className="px-4 py-3 border-t-2 border-ink font-display font-black text-h2 leading-none tracking-[-0.02em] bg-paper-2">
          {formatNumber(bounty.payoutMarlbro)} <span className="text-eyebrow font-mono tracking-[0.1em] opacity-70">$MARLBRO</span>
          {bounty.payoutSol > 0 && (
            <span className="block text-h3 mt-1">
              +{bounty.payoutSol} <span className="text-eyebrow font-mono tracking-[0.1em] opacity-70">SOL</span>
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 4: Run tests, expect PASS (9 tests).**

- [ ] **Step 5: Commit**

```bash
git add components/ui/BountyCard.tsx components/ui/BountyCard.test.tsx
git commit -m "feat(ui): add BountyCard for the Bounty Board grid"
```

---

## Task 8: /bounties page — render the grid

**Files:** Modify `app/bounties/page.tsx`.

```tsx
// app/bounties/page.tsx
import { PageShell } from '@/components/layout/PageShell';
import { BountyCard } from '@/components/ui/BountyCard';
import { SAMPLE_BOUNTIES } from '@/lib/sampleData';

export const metadata = { title: 'Bounty Board' };

export default function BountiesPage() {
  return (
    <PageShell schedule="Schedule R-7 · Form 042-B">
      <header className="mb-12">
        <p className="font-mono text-eyebrow uppercase mb-4">§02 — BOUNTY BOARD</p>
        <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
          BOUNTY BOARD
        </h1>
        <p className="text-bodyL mt-5 max-w-[720px]">
          A registry of curated discretionary grants currently open for application. Each posting
          constitutes a Statement of Work pursuant to Schedule R-7 §11(a). The Foundation
          reserves discretionary judgement on all approvals.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SAMPLE_BOUNTIES.map((bounty) => (
          <BountyCard key={bounty.id} bounty={bounty} />
        ))}
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 1: Verify build**

```bash
npm run build 2>&1 | tail -10
```

- [ ] **Step 2: Commit**

```bash
git add app/bounties/page.tsx
git commit -m "feat(bounties): render bounty grid from sample data"
```

---

## Task 9: /bounties/[number] dynamic route

**Files:** Create `app/bounties/[number]/page.tsx`, `app/bounties/[number]/not-found.tsx`.

- [ ] **Step 1: Implement `app/bounties/[number]/page.tsx`**

```tsx
// app/bounties/[number]/page.tsx
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/layout/PageShell';
import { Tag } from '@/components/ui/Tag';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { getBountyByNumber, SAMPLE_BOUNTIES } from '@/lib/sampleData';

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export function generateStaticParams() {
  return SAMPLE_BOUNTIES.map((b) => ({ number: String(b.number) }));
}

export async function generateMetadata({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const bounty = getBountyByNumber(Number.parseInt(number, 10));
  if (!bounty) return { title: 'Bounty Not Found' };
  return { title: `Grant №${bounty.number} · ${bounty.title}` };
}

export default async function BountyDetailPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const n = Number.parseInt(number, 10);
  if (Number.isNaN(n)) notFound();
  const bounty = getBountyByNumber(n);
  if (!bounty) notFound();

  const left = bounty.maxClaims !== null ? Math.max(0, bounty.maxClaims - bounty.claimsUsed) : null;
  const isExhausted = bounty.maxClaims !== null && bounty.claimsUsed >= bounty.maxClaims;
  const claimsLabel = bounty.maxClaims === null ? 'UNLIMITED CLAIMS' : isExhausted ? 'EXHAUSTED' : `${left} CLAIM${left === 1 ? '' : 'S'} REMAINING`;

  return (
    <PageShell schedule={`Schedule R-7 · Form 042-B · Grant ${bounty.number}`}>
      <Link href="/bounties" className="font-mono text-eyebrow uppercase tracking-[0.12em] inline-block mb-6 underline underline-offset-[3px]">
        ← BOUNTY BOARD
      </Link>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <article className="lg:col-span-8">
          <p className="font-mono text-eyebrow uppercase mb-4">GRANT №{bounty.number}</p>
          <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
            {bounty.title}
          </h1>
          <div className="flex flex-wrap gap-2 mt-6">
            <Tag variant={isExhausted ? 'alert' : 'default'}>{claimsLabel}</Tag>
            {bounty.deadline && <Tag>DEADLINE {bounty.deadline}</Tag>}
            {bounty.locationConstraint && <Tag variant="muted">{bounty.locationConstraint}</Tag>}
          </div>

          <section className="mt-10">
            <h2 className="font-mono text-eyebrow uppercase mb-3">STATEMENT OF WORK</h2>
            <p className="text-bodyL leading-relaxed">{bounty.brief}</p>
          </section>

          <section className="mt-10">
            <h2 className="font-mono text-eyebrow uppercase mb-3">SUBMISSION REQUIREMENTS</h2>
            <ol className="space-y-2 text-body list-none">
              <li>1. The applicant shall furnish a photograph satisfying the Statement of Work.</li>
              <li>2. The applicant shall publish a corresponding post on X tagging @marlbrotoken.</li>
              <li>3. The applicant shall provide a Solana wallet address for disbursement.</li>
              <li>4. The applicant shall complete Form 042-B (this instrument).</li>
            </ol>
          </section>
        </article>

        <aside className="lg:col-span-4">
          <Card className="bg-paper-2 sticky top-8">
            <div className="px-5 pt-5">
              <p className="font-mono text-eyebrow uppercase mb-2">DISBURSEMENT</p>
              <p className="font-display font-black text-h1 leading-none tracking-[-0.02em]">
                {formatNumber(bounty.payoutMarlbro)}
                <span className="block text-eyebrow font-mono tracking-[0.1em] mt-2 opacity-70">$MARLBRO</span>
              </p>
              {bounty.payoutSol > 0 && (
                <p className="font-display font-black text-h2 leading-none tracking-[-0.02em] mt-4 pt-4 border-t-2 border-ink">
                  +{bounty.payoutSol}
                  <span className="block text-eyebrow font-mono tracking-[0.1em] mt-2 opacity-70">SOL</span>
                </p>
              )}
            </div>
            <div className="px-5 pt-5 pb-5 mt-5 border-t-2 border-ink">
              <Button asChild={!isExhausted} disabled={isExhausted} className="w-full">
                {isExhausted ? <>FILLED</> : <Link href={`/apply?bounty=${bounty.number}`}>CLAIM THIS GRANT</Link>}
              </Button>
            </div>
          </Card>
        </aside>
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 2: Implement `app/bounties/[number]/not-found.tsx`**

```tsx
// app/bounties/[number]/not-found.tsx
import { PageShell } from '@/components/layout/PageShell';
import { Stamp } from '@/components/ui/Stamp';
import Link from 'next/link';

export default function BountyNotFound() {
  return (
    <PageShell schedule="Schedule R-7 · Form 404-B">
      <p className="font-mono text-eyebrow uppercase mb-4">§404 — GRANT NOT ON FILE</p>
      <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
        GRANT NOT FOUND.
      </h1>
      <p className="text-bodyL mt-5 max-w-[640px]">
        The Foundation has reviewed its bounty registry and is unable to locate a grant by the
        requested identifier. Please consult the Bounty Board for an inventory of currently active grants.
      </p>
      <div className="mt-8 flex items-center gap-6">
        <Link href="/bounties" className="font-display font-black text-body uppercase tracking-[0.04em] inline-flex items-center justify-center px-[22px] py-[14px] border-4 border-ink shadow-md bg-marlbro text-paper">
          BOUNTY BOARD
        </Link>
        <Stamp label="GRANT NOT FOUND" rotate={-9} />
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 3: Verify build** — `npm run build` should now generate static pages for each bounty number from `generateStaticParams`.

- [ ] **Step 4: Commit**

```bash
git add app/bounties/[number]
git commit -m "feat(bounties): add dynamic bounty detail page with not-found"
```

---

## Task 10: /wall page — render poster grid

**Files:** Modify `app/wall/page.tsx`.

```tsx
// app/wall/page.tsx
import { PageShell } from '@/components/layout/PageShell';
import { PosterCard } from '@/components/ui/PosterCard';
import Link from 'next/link';
import { SAMPLE_POSTERS } from '@/lib/sampleData';

export const metadata = { title: 'Wall of Grants' };

export default function WallPage() {
  return (
    <PageShell schedule="Schedule R-7 · Form 042-W">
      <header className="mb-12">
        <p className="font-mono text-eyebrow uppercase mb-4">§04 — WALL OF GRANTS</p>
        <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
          WALL OF GRANTS
        </h1>
        <p className="text-bodyL mt-5 max-w-[720px]">
          A perpetually-updated public registry of disbursed grants. Each entry reflects an
          executed disbursement on the Solana ledger, recorded by the Foundation in accordance
          with Schedule R-7 §22.
        </p>
        <p className="font-mono text-caption uppercase tracking-[0.12em] mt-4 text-ink-2">
          {SAMPLE_POSTERS.length} GRANTS ON RECORD
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {SAMPLE_POSTERS.map((poster) => (
          <Link key={poster.id} href={`/wall/${poster.id}`} className="block group">
            <div className="transition-transform duration-[80ms] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px]">
              <PosterCard {...poster} />
            </div>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 1: Verify build** — should succeed.

- [ ] **Step 2: Commit**

```bash
git add app/wall/page.tsx
git commit -m "feat(wall): render Wall of Grants gallery from sample posters"
```

---

## Task 11: /wall/[id] dynamic route

**Files:** Create `app/wall/[id]/page.tsx`, `app/wall/[id]/not-found.tsx`.

- [ ] **Step 1: Implement `app/wall/[id]/page.tsx`**

```tsx
// app/wall/[id]/page.tsx
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/layout/PageShell';
import { PosterCard } from '@/components/ui/PosterCard';
import Link from 'next/link';
import { getPosterById, SAMPLE_POSTERS } from '@/lib/sampleData';

export function generateStaticParams() {
  return SAMPLE_POSTERS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const poster = getPosterById(id);
  if (!poster) return { title: 'Grant Not Found' };
  return { title: `Grant №${poster.displayNumber}` };
}

export default async function PosterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const poster = getPosterById(id);
  if (!poster) notFound();

  return (
    <PageShell schedule={`Schedule R-7 · Disbursement Record ${poster.displayNumber}`}>
      <Link href="/wall" className="font-mono text-eyebrow uppercase tracking-[0.12em] inline-block mb-6 underline underline-offset-[3px]">
        ← WALL OF GRANTS
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <article className="lg:col-span-7">
          <p className="font-mono text-eyebrow uppercase mb-4">GRANT №{poster.displayNumber}</p>
          <h1 className="font-display font-black text-h1 lg:text-d1 leading-[0.9] tracking-[-0.04em]">
            DISBURSEMENT RECORD
          </h1>

          <section className="mt-10">
            <h2 className="font-mono text-eyebrow uppercase mb-3">STATEMENT OF GRANTEE</h2>
            <blockquote className="text-bodyL font-display font-bold leading-tight border-l-[6px] border-marlbro pl-6 py-2">
              &ldquo;{poster.tweetQuote}&rdquo;
            </blockquote>
            <p className="font-mono text-caption mt-4">— @{poster.applicantHandle}</p>
          </section>

          <section className="mt-10">
            <h2 className="font-mono text-eyebrow uppercase mb-3">DISBURSEMENT PARTICULARS</h2>
            <dl className="grid grid-cols-2 gap-y-3 gap-x-6 text-body">
              <dt className="font-mono text-caption uppercase">Date of disbursement</dt>
              <dd>{poster.paidAt}</dd>
              <dt className="font-mono text-caption uppercase">Recipient wallet</dt>
              <dd className="font-mono text-bodyS">{poster.walletShort}</dd>
              <dt className="font-mono text-caption uppercase">Marlbro disbursed</dt>
              <dd className="font-display font-bold">{poster.payoutMarlbro.toLocaleString('en-US')} $MARLBRO</dd>
              {poster.payoutSol > 0 && (
                <>
                  <dt className="font-mono text-caption uppercase">SOL disbursed</dt>
                  <dd className="font-display font-bold">{poster.payoutSol} SOL</dd>
                </>
              )}
              {poster.bountyNumber !== null && (
                <>
                  <dt className="font-mono text-caption uppercase">Pursuant to bounty</dt>
                  <dd>
                    <Link href={`/bounties/${poster.bountyNumber}`} className="underline">
                      Grant №{poster.bountyNumber}
                    </Link>
                  </dd>
                </>
              )}
            </dl>
          </section>
        </article>

        <aside className="lg:col-span-5 sticky top-8">
          <PosterCard {...poster} />
        </aside>
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 2: Implement `app/wall/[id]/not-found.tsx`**

```tsx
// app/wall/[id]/not-found.tsx
import { PageShell } from '@/components/layout/PageShell';
import { Stamp } from '@/components/ui/Stamp';
import Link from 'next/link';

export default function PosterNotFound() {
  return (
    <PageShell schedule="Schedule R-7 · Form 404-W">
      <p className="font-mono text-eyebrow uppercase mb-4">§404 — RECORD NOT ON FILE</p>
      <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
        RECORD NOT FOUND.
      </h1>
      <p className="text-bodyL mt-5 max-w-[640px]">
        The Foundation has reviewed its disbursement records and is unable to locate the requested
        grant. The applicant may consult the Wall of Grants for the public registry.
      </p>
      <div className="mt-8 flex items-center gap-6">
        <Link href="/wall" className="font-display font-black text-body uppercase tracking-[0.04em] inline-flex items-center justify-center px-[22px] py-[14px] border-4 border-ink shadow-md bg-marlbro text-paper">
          WALL OF GRANTS
        </Link>
        <Stamp label="RECORD NOT FOUND" rotate={-9} />
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 3: Build + commit**

```bash
npm run build 2>&1 | tail -10
git add app/wall/[id]
git commit -m "feat(wall): add dynamic poster detail page with not-found"
```

---

## Task 12: /manifesto — full content

**Files:** Modify `app/manifesto/page.tsx`. Use Footnote + FootnoteList primitives.

```tsx
// app/manifesto/page.tsx
import { PageShell } from '@/components/layout/PageShell';
import { Footnote } from '@/components/ui/Footnote';
import { FootnoteList } from '@/components/ui/FootnoteList';
import { ChevronDivider } from '@/components/ui/ChevronDivider';

export const metadata = { title: 'Manifesto' };

export default function ManifestoPage() {
  return (
    <PageShell schedule="Schedule R-7 · Disclosure §14">
      <article className="max-w-[760px] mx-auto">
        <p className="font-mono text-eyebrow uppercase mb-4">§05 — MANIFESTO</p>
        <h1 className="font-display font-black text-h1 lg:text-d1 leading-[0.9] tracking-[-0.04em]">
          ON THE MATTER OF GLORY.
        </h1>

        <p className="font-mono text-caption uppercase tracking-[0.12em] mt-6">
          A POSITION PAPER OF THE MARLBRO FOUNDATION
        </p>

        <ChevronDivider className="mt-8 mb-12 h-[16px]" />

        <div className="space-y-6 text-bodyL leading-relaxed text-ink-2">
          <p>
            The Foundation observes a generational decline in masculine carriage, attributable in
            part to the substitution of the cigarette by the rechargeable nicotine vaporizer
            <Footnote n={1} /> — an article of demonstrably non-Marlbro-compatible aesthetic and
            of questionable structural integrity. This document articulates the corrective
            program by which the Foundation intends to address the matter.
          </p>

          <p>
            The Marlbro Foundation does not regard itself as nostalgic. The Foundation is, in the
            strictest sense, restorative. The cigarette — and specifically the Marlboro Red, hereby
            tributed in this Foundation&apos;s nominal misspelling
            <Footnote n={2} /> — is held to constitute the symbolic apparatus of a particular
            register of bearing, comportment, and grit which the Foundation finds the present
            generation insufficiently equipped to perform.
          </p>

          <h2 className="font-display font-black text-h2 leading-tight tracking-[-0.02em] pt-6">
            I. ON THE VAPE.
          </h2>

          <p>
            The vape is not a cigarette. The vape does not produce ash. The vape does not
            require a match, a windbreak, a hand to cup the flame. The vape does not communicate
            anything about its operator beyond the operator&apos;s fluorescent dependence. The vape,
            in its essential nature, is a USB-rechargeable plastic dummy
            <Footnote n={3} />.
          </p>

          <p>
            The Foundation does not legislate against the vape. The Foundation does not seize
            vapes from the citizenry, although the Foundation observes that the citizenry has, in
            many cases, surrendered them voluntarily upon contemplation of the alternative. The
            Foundation merely observes that the substitution is incomplete, and that the
            substitution&apos;s continued prevalence has wrought a measurable decline in the carriage
            of the modern American (and, increasingly, global) male.
          </p>

          <h2 className="font-display font-black text-h2 leading-tight tracking-[-0.02em] pt-6">
            II. ON THE MARLBRO RED.
          </h2>

          <p>
            The Foundation prefers the Marlboro Red. The Foundation does not endorse any tobacco
            product
            <Footnote n={4} />. The Foundation cites the Marlboro Red as the canonical referent
            because of its historical association with a particular archetype — the man at
            distance, in weather, in possession of his own time — which the Foundation regards as
            instructive.
          </p>

          <p>
            The Foundation&apos;s namesake (Marlbro) is rendered with one fewer &lsquo;o&rsquo; than the
            tobacco product (Marlboro). This is intentional. The Foundation is not the Marlboro
            Company. The Foundation has no commercial relationship with Altria, Philip Morris
            International, or any tobacco enterprise. The Foundation operates exclusively as a
            grant-issuing instrument denominated in $MARLBRO and SOL.
          </p>

          <h2 className="font-display font-black text-h2 leading-tight tracking-[-0.02em] pt-6">
            III. ON THE GRANT PROGRAM.
          </h2>

          <p>
            The Foundation issues two classes of grant. The first, the Bounty Board, comprises
            curated discretionary subsidies attached to specified acts of carriage. The second,
            the Open Grant, is an instrument by which any qualifying applicant may seek a
            standardized disbursement upon furnishing documentation of an authentic transaction.
            All grants are subject to manual review pursuant to Schedule R-7 §11
            <Footnote n={5} />.
          </p>

          <p>
            The Foundation does not regard its program as transactional. The Foundation does not
            regard itself as a vendor. The Foundation regards each disbursement as a small
            inscription on the public ledger
            <Footnote n={6} /> — a record, in perpetuity, that one (1) man, on one (1) day, lit
            one (1) Marlbro Red and made the small private gesture by which the entire prior
            century carried itself.
          </p>

          <h2 className="font-display font-black text-h2 leading-tight tracking-[-0.02em] pt-6">
            IV. ON GLORY.
          </h2>

          <p>
            Glory, as the Foundation uses the term, refers to the unrecorded majority of small
            instances in which the prior generations of men comported themselves with dignity in
            unsupervised conditions. Glory is the unrecognized photograph. Glory is the smoke
            curling out the truck window at the rest stop on a Wednesday in 1983. Glory is the
            specific cadence by which a man, having just buried his father, lights one against
            the wind without commentary.
          </p>

          <p>
            The Foundation cannot manufacture glory. The Foundation can, however, fund its
            documentation. This is the program.
          </p>

          <p className="font-mono text-caption uppercase tracking-[0.12em] pt-12 text-ink">
            — THE BOARD OF DIRECTORS, THE MARLBRO FOUNDATION
          </p>
          <p className="font-mono text-caption uppercase tracking-[0.12em] text-ink-2">
            FILED THIS 6TH DAY OF MAY, 2026
          </p>
        </div>

        <FootnoteList
          items={[
            { n: 1, text: 'The rechargeable nicotine vaporizer (colloquially "vape") is a battery-operated handheld device which aerosolizes a flavored nicotine solution for inhalation. The Foundation expresses no view on its medical implications, only on its aesthetic.' },
            { n: 2, text: 'The Marlbro Foundation is not affiliated with the Marlboro brand, Altria Group Inc., or Philip Morris International. The misspelling is intentional and constitutes the Foundation\'s sole legal distinction.' },
            { n: 3, text: 'Plastic; sometimes metal-cased. The Foundation does not regard the casing material as exculpatory.' },
            { n: 4, text: 'Schedule R-7 §3(a): "The Foundation explicitly disclaims endorsement of any tobacco or nicotine product. Reference to the Marlboro Red is referential, not promotional. The Foundation does not, will not, and cannot encourage tobacco consumption."' },
            { n: 5, text: 'Schedule R-7 §11(a)–(g): the manual review procedure. Submissions are reviewed by Foundation officers; approval triggers an irrevocable on-chain disbursement.' },
            { n: 6, text: 'The Solana ledger. Disbursements are public, transparent, and immutable, in keeping with the Foundation\'s commitment to perpetual record-keeping.' },
          ]}
        />
      </article>
    </PageShell>
  );
}
```

- [ ] **Step 1: Verify build.**

- [ ] **Step 2: Commit**

```bash
git add app/manifesto/page.tsx
git commit -m "feat(manifesto): add full deadpan polemic with footnotes"
```

---

## Task 13: /faq — DisclosureList content

**Files:** Modify `app/faq/page.tsx`.

```tsx
// app/faq/page.tsx
import { PageShell } from '@/components/layout/PageShell';
import { DisclosureList } from '@/components/ui/DisclosureList';
import { LinkPrimitive } from '@/components/ui/LinkPrimitive';
import { Stamp } from '@/components/ui/Stamp';

export const metadata = { title: 'Frequently Asked Questions' };

export default function FaqPage() {
  return (
    <PageShell schedule="Schedule R-7 · Disclosure §F">
      <header className="mb-12">
        <p className="font-mono text-eyebrow uppercase mb-4">§06 — FREQUENTLY ASKED QUESTIONS</p>
        <h1 className="font-display font-black text-h1 lg:text-d2 leading-[1.0] tracking-[-0.03em]">
          FREQUENTLY ASKED QUESTIONS
        </h1>
        <p className="text-bodyL mt-5 max-w-[720px]">
          General disclosures pertaining to the Marlbro Foundation grant program. The information
          herein does not constitute financial advice, tax advice, or medical advice.
        </p>
      </header>

      <div className="max-w-[820px]">
        <DisclosureList
          items={[
            {
              question: 'What is the Marlbro Foundation?',
              answer: (
                <p>
                  The Marlbro Foundation is a discretionary grant-issuing instrument denominated in
                  $MARLBRO and SOL on the Solana blockchain. It is not affiliated with the Marlboro
                  brand, Altria Group, or Philip Morris International. The misspelling is intentional.
                </p>
              ),
            },
            {
              question: 'How does the grant program work?',
              answer: (
                <p>
                  The Foundation issues two classes of grant. The Bounty Board lists curated
                  discretionary subsidies attached to specified acts. The Open Grant is a standardized
                  application available to any qualifying applicant. All grants require documentation
                  of a transaction (a receipt) plus a corresponding post on X (formerly Twitter)
                  tagging @marlbrotoken.
                </p>
              ),
            },
            {
              question: 'Does the Foundation sell cigarettes?',
              answer: (
                <p>
                  No. The Foundation does not sell, ship, distribute, or otherwise touch tobacco
                  products. The Foundation is exclusively a grant-application portal. Applicants
                  procure cigarettes through ordinary lawful retail channels.
                </p>
              ),
            },
            {
              question: 'Who reviews the applications?',
              answer: (
                <p>
                  All applications are subject to manual review by Foundation officers pursuant to
                  Schedule R-7 §11. The Foundation reserves discretionary judgement in all matters
                  of approval, rejection, and disbursement.
                </p>
              ),
            },
            {
              question: 'How are payouts made?',
              answer: (
                <p>
                  Payouts are executed on the Solana blockchain via the Squads multisig protocol.
                  Approved grants result in an irrevocable on-chain disbursement of $MARLBRO
                  and/or SOL to the wallet address provided by the applicant.
                </p>
              ),
            },
            {
              question: 'How frequently may I apply?',
              answer: (
                <p>
                  Applications to the Open Grant lane are subject to a per-wallet and per-Twitter-ID
                  cooldown of 7 days. Lifetime caps also apply. The Bounty Board permits at most 3
                  unresolved bounty submissions per wallet at a given time. The Foundation may
                  adjust these limits without notice.
                </p>
              ),
            },
            {
              question: 'What constitutes a fraudulent application?',
              answer: (
                <p>
                  Any application furnishing falsified documentation, duplicating a prior submission,
                  using a coordinated cluster of accounts to inflate volume, or otherwise contravening
                  Schedule R-7 §17. Fraudulent applications result in permanent disqualification of
                  the wallet and Twitter account in question.
                </p>
              ),
            },
            {
              question: 'Is the $MARLBRO token an investment?',
              answer: (
                <p>
                  No. $MARLBRO is a meme token. It carries no expectation of return, no claim on
                  Foundation assets, no governance rights, and no representations of future value.
                  See Schedule R-7 §4 (NOT FINANCIAL ADVICE).
                </p>
              ),
            },
            {
              question: 'Where can I view the on-chain disbursements?',
              answer: (
                <p>
                  Each approved grant appears on the{' '}
                  <LinkPrimitive href="/wall">Wall of Grants</LinkPrimitive>, which is updated upon
                  successful execution of the on-chain transaction. The transaction signature is
                  recorded with each disbursement for independent verification.
                </p>
              ),
            },
            {
              question: 'Does the Foundation endorse smoking?',
              answer: (
                <p>
                  No. The Foundation does not endorse, recommend, encourage, or advocate for the
                  consumption of tobacco or nicotine in any form. References to the Marlboro Red
                  are aesthetic and referential, not promotional. Smoking remains a leading cause
                  of preventable death.
                </p>
              ),
            },
            {
              question: 'What if I sent the grant to the wrong wallet address?',
              answer: (
                <p>
                  The Foundation cannot recover funds sent to incorrectly-furnished wallet addresses.
                  All applications require the applicant to confirm the correctness of the address
                  prior to submission. The Foundation strongly recommends double-verification before
                  filing Form 042-A or Form 042-B.
                </p>
              ),
            },
            {
              question: 'How do I contact the Foundation?',
              answer: (
                <p>
                  The Foundation does not maintain a public contact address. The Foundation may be
                  observed conducting business on X via{' '}
                  <LinkPrimitive href="https://twitter.com/marlbrotoken">
                    @marlbrotoken
                  </LinkPrimitive>
                  . The Foundation does not engage in private direct messages regarding grant
                  status; all communications are conducted via the application portal.
                </p>
              ),
            },
          ]}
        />
      </div>

      <div className="mt-16 flex items-center gap-6 flex-wrap">
        <Stamp label="NOT FINANCIAL ADVICE" rotate={-7} />
        <Stamp label="NOT TAX ADVICE" rotate={4} variant="ink" />
        <Stamp label="NOT MEDICAL ADVICE" rotate={-12} />
      </div>
    </PageShell>
  );
}
```

- [ ] **Step 1: Verify build.**

- [ ] **Step 2: Commit**

```bash
git add app/faq/page.tsx
git commit -m "feat(faq): add 12-item disclosure list with deadpan answers"
```

---

## Task 14: Refine homepage with featured bounties strip

**Files:** Modify `app/page.tsx`.

```tsx
// app/page.tsx
import Link from 'next/link';
import { PageShell } from '@/components/layout/PageShell';
import { Card } from '@/components/ui/Card';
import { BountyCard } from '@/components/ui/BountyCard';
import { Button } from '@/components/ui/Button';
import { ChevronDivider } from '@/components/ui/ChevronDivider';
import { SAMPLE_BOUNTIES } from '@/lib/sampleData';

export default function HomePage() {
  const featured = SAMPLE_BOUNTIES.filter((b) => b.maxClaims !== null).slice(0, 3);

  return (
    <PageShell>
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5">
          <p className="font-mono text-eyebrow uppercase mb-4">§01 — APPLICATION</p>
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
            <Button asChild>
              <Link href="/apply">Apply for grant</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/bounties">View bounties</Link>
            </Button>
          </div>
          <p className="font-mono text-caption uppercase tracking-[0.12em] mt-6 text-ink-2">
            CONTRACT ADDRESS · TBD AT LAUNCH
          </p>
        </div>

        <div className="lg:col-span-7">
          <Card variant="poster" className="aspect-[4/5] flex items-center justify-center bg-marlbro halftone-overlay relative">
            <p className="font-mono text-caption uppercase text-paper/60 z-10 relative">
              Figure 1 — to be furnished
            </p>
          </Card>
        </div>
      </section>

      <ChevronDivider className="mt-20 mb-16 h-[20px]" />

      <section>
        <header className="mb-8 flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="font-mono text-eyebrow uppercase mb-3">§02 — BOUNTY BOARD · FEATURED</p>
            <h2 className="font-display font-black text-h2 lg:text-h1 leading-[1.05] tracking-[-0.02em]">
              CURRENT GRANTS UNDER FOUNDATION REVIEW
            </h2>
          </div>
          <Link href="/bounties" className="font-mono text-eyebrow uppercase tracking-[0.12em] underline underline-offset-[3px]">
            VIEW ALL BOUNTIES →
          </Link>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featured.map((b) => (
            <BountyCard key={b.id} bounty={b} />
          ))}
        </div>
      </section>

      <section className="mt-20 bg-ink text-paper p-12 border-4 border-ink shadow-lg">
        <p className="font-mono text-eyebrow uppercase mb-3 text-paper/60">§03 — OPEN GRANT</p>
        <h2 className="font-display font-black text-h2 lg:text-h1 leading-[1.05] tracking-[-0.02em] max-w-[680px]">
          Apply for the standard subsidy in three steps.
        </h2>
        <ol className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 list-none">
          <li>
            <p className="font-mono text-caption uppercase tracking-[0.12em] text-paper/60">STEP 1</p>
            <p className="font-display font-bold text-bodyL mt-2 leading-tight">
              Procure one (1) pack of Marlboro Reds at a lawful retail establishment.
            </p>
          </li>
          <li>
            <p className="font-mono text-caption uppercase tracking-[0.12em] text-paper/60">STEP 2</p>
            <p className="font-display font-bold text-bodyL mt-2 leading-tight">
              Publish a corresponding photograph and post on X tagging @marlbrotoken.
            </p>
          </li>
          <li>
            <p className="font-mono text-caption uppercase tracking-[0.12em] text-paper/60">STEP 3</p>
            <p className="font-display font-bold text-bodyL mt-2 leading-tight">
              File Form 042-A. The Foundation issues 5,000 $MARLBRO upon approval.
            </p>
          </li>
        </ol>
        <div className="mt-10">
          <Button asChild>
            <Link href="/apply">FILE FORM 042-A</Link>
          </Button>
        </div>
      </section>
    </PageShell>
  );
}
```

- [ ] **Step 1: Verify build.**

- [ ] **Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat(home): add featured bounties strip and three-step CTA section"
```

---

## Task 15: Final validation + push

- [ ] **Step 1:** `npm test` — all tests must pass (Plan 1's 96 + new tests added in this plan; rough total ~140).
- [ ] **Step 2:** `npm run typecheck` — clean.
- [ ] **Step 3:** `npm run lint` — clean.
- [ ] **Step 4:** `npm run build` — must succeed; route table should include `/bounties/[number]`, `/wall/[id]`.
- [ ] **Step 5:** `git push origin main` — push everything.
- [ ] **Step 6:** `gh run watch` — wait for CI to pass.

---

## Self-Review

**Spec coverage:**
- §10.5 component primitives — Plan 2 adds Footnote, FootnoteList, DisclosureList, PosterCard, BountyCard, LinkPrimitive, polymorphic Button.
- §10.9 voice + copy — manifesto, FAQ, bounty briefs, poster pages all in deadpan register with Schedule R-7 references.
- §3 sitemap — all routes now have content (placeholder data only for `/apply`; Plan 3 adds the form).
- §11 manifesto thesis — fully written into `/manifesto`.

**Placeholder scan:** No TBDs. The "TBD AT LAUNCH" on home is intentional (real contract address comes at token launch).

**Type consistency:** `Bounty`, `PosterGrant` types in `lib/sampleData.ts` are the canonical shapes. `BountyCard` and `PosterCard` consume these directly. Plan 4 will replace the static arrays with DB queries returning the same types.

---

*End of Plan 2.*
