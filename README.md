# Marlbro

> The Marlbro Foundation provides discretionary subsidies, denominated in $MARLBRO and SOL, to applicants who furnish documentation of authentic engagement with the namesake article. Pursuant to Schedule R-7, all submissions are subject to manual review.

## Monorepo layout

```
apps/
  frontend/        Next.js 16 — public site + admin UI shell
  backend/         Hono on Node — REST API + worker
packages/
  db/              Drizzle schema + queries (shared)
  ui/              UI primitives (Button, Card, PosterCard, etc.)
  shared/          tokens, cn, sampleData, session JWT helpers
```

## Local dev

```bash
# From repo root
npm install

# Start backend (port 3001)
npm run dev --workspace=@marlbro/backend

# In another terminal — start frontend (port 3000)
npm run dev --workspace=@marlbro/frontend
```

Open http://localhost:3000 — frontend will fetch backend at http://localhost:3001.

## Scripts (workspace-aware)

```bash
npm run typecheck       # all workspaces
npm run lint            # all workspaces
npm run test            # all workspaces
npm run build           # all workspaces
```

Or per-workspace: `npm run <script> --workspace=@marlbro/<name>`.

## Deployment

- **Frontend** → Vercel. In Vercel project settings: set Root Directory to `apps/frontend`. Set env var `NEXT_PUBLIC_BACKEND_URL` to the public backend URL.
- **Backend** → Railway. Uses `railway.json` at repo root. Set all backend env vars (see `.env.example`). Backend domain expected: `api.marlbro.com`.

## Filling in stub credentials

Stubs activate when env vars are missing. To go live:

| Env var | What changes |
|---|---|
| `DATABASE_URL` | Switches backend from PGlite to Neon Postgres |
| `RESEND_API_KEY` | Magic-link emails delivered via Resend instead of console.log |
| `TWITTER_CLIENT_ID` + `TWITTER_CLIENT_SECRET` | Real X OAuth |
| `TWITTER_BEARER_TOKEN` | Real tweet content verification (Plan 6+) |
| `R2_ACCESS_KEY_ID` + `R2_SECRET_ACCESS_KEY` + `R2_BUCKET` + `R2_PUBLIC_URL` | Receipts uploaded to Cloudflare R2 |
| `SQUADS_PROPOSER_SK` + `SQUADS_MULTISIG_PUBKEY` | Real Solana on-chain payouts via Squads multisig |

## Brand rules (high-level)

- All icons / status badges / glyphs are custom SVG. No emojis.
- Border radius is always 0.
- Drop shadows are solid offset, never blurred.
- No dark mode.
- See `docs/superpowers/specs/2026-05-06-marlbro-design.md` §10 for the full system.

## Plans

See `docs/superpowers/plans/` for the iteration plan history.
