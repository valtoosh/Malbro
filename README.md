# Marlbro

> The Marlbro Foundation provides discretionary subsidies, denominated in $MARLBRO and SOL, to applicants who furnish documentation of authentic engagement with the namesake article. Pursuant to Schedule R-7, all submissions are subject to manual review.

## Status

This is **Plan 1 (Foundation)** of a multi-plan build. See `docs/superpowers/plans/` for the active build plan and `docs/superpowers/specs/2026-05-06-marlbro-design.md` for the full design spec.

## Tech stack

- Next.js 16 (App Router, TypeScript)
- Tailwind v4 with CSS `@theme` design tokens
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
