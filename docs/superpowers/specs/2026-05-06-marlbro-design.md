# Marlbro — Design Spec

**Status:** Draft for review
**Date:** 2026-05-06
**Author:** Brainstorm session output

---

## 1 · Project overview

Marlbro ($MARLBRO) is a meme-token launch on Solana with a single deliverable product: a website that operates a grants program. The grants reimburse — symbolically, in $MARLBRO and SOL — users who post evidence of having bought and smoked a Marlboro Red, with the photo + tweet acting as both qualification and viral fuel.

The website never sells, ships, or otherwise touches tobacco. It is exclusively a grant-application portal.

The project is positioned as a parody of Marlboro Red brand identity, framed in deadpan bureaucratic voice, and themed around a polemic against the modern emasculation of nicotine consumption (vapes as degradation, the cigarette as recovered masculine glory).

## 2 · Project thesis

The Marlbro Foundation is presented as if it were a real grant-issuing institution. All copy, page titles, error states, and admin internals adopt government-form register: "Schedule R-7," "Form 042-A," "Pursuant to Section §14(b)(ii)," etc.

The manifesto frames the program as a corrective to a generational decline: a substitution of cigarette for vape that the Foundation describes as a degradation of masculine carriage. The voice never breaks frame — there is no winking, no self-aware "lol just kidding," no emoji. The deadpan IS the joke.

## 3 · Brand posture

**Posture: Parody (moderate IP risk).** The visual system uses Marlboro Red's palette and the chevron silhouette of the pack, but the wordmark is visibly deformed (lowercase "marlbro," intentional asymmetry, hand-drawn star/stamp accents). The site reads as homage, not counterfeit, sustaining a parody defense.

Explicitly rejected directions: (1) "Tribute" — pixel-faithful copy of the real pack, which invites takedown; (2) "Absurdist" — only the red is borrowed, which loses the recognition hook.

## 4 · Sitemap

| Route | Purpose |
|---|---|
| `/` | Home — hero, ticker, contract address, three featured bounties, primary CTAs |
| `/bounties` | Bounty Board — grid of curated active grants |
| `/bounties/[number]` | Bounty Detail — full brief + Claim form |
| `/apply` | Open Grant — always-on application lane |
| `/wall` | Wall of Grants — public gallery of approved posters |
| `/wall/[displayNumber]` | Single approved poster, OG-optimized for sharing |
| `/manifesto` | Lore + thesis (the long-form joke) |
| `/faq` | How it works, anti-fud, disclaimers |
| `/admin/*` | Private — auth-walled review/admin |

Out of v1 scope: leaderboard, referral program, holders-only gating, newsletter, user-suggested bounties.

## 5 · Architecture

Three deployable units, deliberately separated so treasury logic is isolated from the public web tier.

### 5.1 Frontend
- **Stack:** Next.js 15 (App Router, TypeScript, Server Components), Tailwind CSS, deployed to Vercel.
- **Responsibilities:** all public pages, OAuth UI, application form submission, public reads of bounties + wall (cached at edge with on-demand revalidation), admin UI shell.
- **No Solana SDK in browser** for v1.

### 5.2 Backend API + worker
- **Stack:** Hono on Node, deployed to Railway (single service). Postgres connection pool, in-process worker queue (e.g., `pg-boss` or simple `setInterval` job runner).
- **Responsibilities:** REST endpoints for submission intake, public reads, Twitter OAuth, admin actions; in-process worker for tweet verification, OG-image generation, stale-submission expiry, payout polling.
- **Domain:** `api.marlbro.com`, fronted by Cloudflare for L7 protection + Turnstile.

### 5.3 Data + storage + secrets
- **Postgres:** Neon (branchable, cheap, native Vercel/Railway integration).
- **Object storage:** Cloudflare R2 for receipt photos and generated poster OG images.
- **Solana RPC:** Helius (paid tier — for reliable rate limits).
- **Treasury:** Squads protocol multisig. The backend holds a *proposer* keypair only; signing-threshold members are real human-controlled wallets on phones (Squads mobile app).

### 5.4 Service interaction diagram

```
Browser ──► Vercel (Next.js, RSC, edge cache)
              │
              └── REST/JSON ──► Cloudflare ──► Railway (Hono API + worker)
                                                  │
                                                  ├── Neon Postgres
                                                  ├── R2 (receipts, OG images)
                                                  ├── Twitter API v2
                                                  ├── Resend (email)
                                                  └── Helius RPC
                                                        └── Squads multisig
                                                              └── 2-of-3 phone signers
```

### 5.5 Treasury isolation property
Backend's `SQUADS_PROPOSER_SK` can *propose* multisig transactions but cannot execute. Compromise of Railway → at worst, an attacker fills the Squads inbox with fake proposals that admins decline on their phones. No funds move without two human signatures.

The hot multisig holds only ~1 week of expected payouts; the cold multisig (3-of-5, signers offline) holds the reserved supply and is replenished into hot manually on a quarterly cadence.

## 6 · Tokenomics & launch

- **Chain:** Solana.
- **Launch model:** pump.fun-style standard bonded launch. ~5–10% of supply reserved off-curve for the grants treasury, vested into the cold multisig.
- **Payout currencies:** both $MARLBRO and SOL.
  - **Open lane default:** 5,000 $MARLBRO per approved submission, no SOL. Tunable via admin config.
  - **Bounty lane:** per-bounty configuration. Headline bounties may pay 25,000–250,000 $MARLBRO and/or 0.5–10 SOL.
- **Lifetime caps per applicant** (wallet AND twitter ID): 100,000 $MARLBRO + 2 SOL total, tunable.

## 7 · Data model (Postgres)

### 7.1 Tables

```
bounties
  id (uuid pk)
  number (int unique autoinc — display "#042")
  title, brief (markdown), location_constraint (text nullable)
  payout_marlbro (numeric), payout_sol (numeric)
  max_claims (int, null = unlimited), claims_used (int, default 0)
  deadline (timestamptz nullable)
  status (enum: draft | live | paused | exhausted | expired)
  poster_image_url (R2 path)
  created_by (fk admins), created_at, updated_at

submissions
  id (uuid pk)
  lane (enum: bounty | open)
  bounty_id (fk bounties, nullable)
  applicant_twitter_handle (text, lowercased)
  applicant_twitter_id (text, immutable from OAuth)
  applicant_wallet_address (text, base58 32–44 check)
  tweet_url (text), tweet_id (text)
  tweet_verified_at (timestamptz nullable)
  tweet_verification_payload (jsonb)
  receipt_image_r2_key (text)
  receipt_hash (text — sha256 hex)
  ip_address (text — sha256(salt+ip))
  notes (text nullable)
  status (enum: pending | verifying | review_ready | approved | rejected | expired | flagged)
  rejection_reason (text nullable)
  reviewed_by (fk admins, nullable), reviewed_at (timestamptz)
  created_at

approved_grants
  id (uuid pk)
  display_number (int unique autoinc)
  submission_id (fk submissions, unique)
  bounty_id (fk bounties, nullable)
  payout_marlbro (numeric), payout_sol (numeric)
  payout_status (enum: queued | proposed | executed | failed)
  squads_proposal_pubkey (text nullable)
  payout_tx_signature (text nullable)
  poster_og_image_url (text)
  approved_at, paid_at

twitter_accounts
  twitter_id (text pk)
  handle (text)
  access_token_enc, refresh_token_enc (bytea)
  email (text nullable, from OAuth scope)
  first_seen_at, last_used_at

rate_limit_events
  id (uuid pk)
  key (text — e.g. "wallet:5n3...", "twitter:42389", "ip:hash")
  kind (enum: submission | approval)
  created_at

receipts_seen
  receipt_hash (text pk)
  first_submission_id (fk submissions)
  first_seen_at

bounty_claims_lock
  id (uuid pk)
  bounty_id (fk bounties)
  submission_id (fk submissions, unique)  -- one lock row per submission
  locked_until (timestamptz)
  -- index: btree on (bounty_id, locked_until)
  -- enforcement is at INSERT time via conditional insert (see §7.3)

admins
  id (uuid pk)
  email (text unique)
  display_name (text)
  role (enum: reviewer | approver | superadmin)
  totp_secret_enc (bytea nullable)
  active (bool), created_at

audit_log
  id (uuid pk)
  admin_id (fk admins)
  action (enum: many — bounty_create, submission_approve, etc.)
  target_type, target_id, payload (jsonb)
  ip_hash, at (timestamptz)

config
  key (text pk)
  value (jsonb)
  updated_by, updated_at
  -- for tunables: cooldown days, lifetime caps, default payouts
```

### 7.2 Key invariants
- `submissions.applicant_wallet_address` constrained to base58 length 32–44.
- `approved_grants.submission_id` UNIQUE — one approval per submission, ever.
- `bounty_claims_lock.submission_id` UNIQUE — at most one lock row per submission.
- `receipts_seen.receipt_hash` PK — prevents image-byte-level duplicates.
- `audit_log` is append-only at the application layer (no UPDATE or DELETE endpoints).

### 7.3 Bounty cap enforcement (atomic conditional insert)

`max_claims` is per-bounty and may be > 1, so cap enforcement cannot use a partial unique index. We use an atomic conditional insert in the intake transaction (Postgres serializable or `READ COMMITTED` is fine — the `INSERT … SELECT … WHERE` is atomic):

```sql
WITH bounty AS (
  SELECT id, max_claims FROM bounties WHERE id = $1 AND status = 'live'
),
active_count AS (
  SELECT count(*) AS n FROM bounty_claims_lock
  WHERE bounty_id = $1 AND locked_until > now()
)
INSERT INTO bounty_claims_lock (bounty_id, submission_id, locked_until)
SELECT $1, $2, now() + interval '72 hours'
WHERE EXISTS (SELECT 1 FROM bounty)
  AND (SELECT n FROM active_count) <
      COALESCE((SELECT max_claims FROM bounty), 2147483647)
RETURNING id;
```

If the `RETURNING` yields zero rows, the bounty is full — backend returns `409 BOUNTY_FULLY_CLAIMED`. Concurrent inserts may both pass the count check at `READ COMMITTED`, so the table is wrapped with a per-bounty advisory lock at intake to fully serialize: `SELECT pg_advisory_xact_lock(hashtext('bounty:' || $1));`. Locks release on `submissions` reaching a terminal state (approved → keep until grant paid out then expire; rejected/expired → release immediately by setting `locked_until = now()`).

`bounties.claims_used` is incremented only when an `approved_grants` row is created (`Stage 4` of §8), not on lock insertion.

## 8 · Core flow: submission → review → payout → wall

### Stage 1 — Intake (synchronous)

1. Twitter OAuth 2.0 sign-in (PKCE), creates/updates `twitter_accounts` row, sets session cookie.
2. Form submitted to `POST /api/submissions` with: wallet, tweet URL, receipt image, optional notes, optional bounty number.
3. Backend pipeline (single transaction):
   - Pre-flight rate-limit gate against `rate_limit_events`. If trip → `429 {error_code, retry_after}`.
   - Receipt hash dedup against `receipts_seen`. Duplicate → `409`.
   - For bounty lane: insert into `bounty_claims_lock`. (N+1)th insert violates partial unique index → `409 BOUNTY_FULLY_CLAIMED`.
   - Persist `submissions` row in `verifying` state.
   - Upload receipt to R2 at deterministic key `receipts/{yyyy}/{mm}/{hash}.{ext}`.
   - Record `rate_limit_events`, `receipts_seen`.
   - Enqueue verify job.
4. Return `201 {submission_uid}`. UI navigates to `/applications/[uid]` confirmation page.

### Stage 2 — Twitter verification (async worker)

Worker picks up the job within seconds:
1. `GET https://api.twitter.com/2/tweets/:id?expansions=attachments.media_keys&media.fields=type,url`.
2. Validate: tweet exists, `author_id == applicant_twitter_id`, has ≥1 photo, text contains `@marlbrotoken` (case-insensitive, configurable mention via `config.required_mention`), tweet age ≤ 7 days, not a retweet.
3. Snapshot response into `submissions.tweet_verification_payload`, set `tweet_verified_at`.
4. State transition: pass → `review_ready`; fail → `flagged` with `rejection_reason`.
5. Twitter API failure: exponential backoff (1m, 5m, 15m, 30m), then surface in admin queue as "verification stuck."

### Stage 3 — Manual review (admin dashboard)

Reviewer at `/admin/queue`:
- Newest-first list of `review_ready` submissions.
- Each card shows: receipt thumbnail (full-res on click), embedded tweet preview, applicant handle (Twitter profile click-through), wallet (Solscan click-through), bounty link if any, submitted-at, verification payload diff, all cluster/anti-fraud signal badges (see §9.4).
- **Approve** button (with editable payout amounts pre-filled from bounty or open-lane default).
- **Reject** button (requires `rejection_reason` from dropdown + free-text).
- **Flag for second review** (routes to superadmin queue).
- All actions write `audit_log`.
- 5-minute "rollback approval" window before Squads proposal goes out.

### Stage 4 — Payout (Squads two-phase)

On approve:
1. Backend creates `approved_grants` row, status `queued`. Generates poster OG image via Satori → uploads to R2.
2. Backend uses `SQUADS_PROPOSER_SK` to call Squads SDK and create proposal: SPL transfer of `payout_marlbro` + optional `SystemProgram.transfer` of `payout_sol`, batched in one Squads transaction. Memo: `marlbro:grant:{approved_grants.id}`. Store `squads_proposal_pubkey`, set status `proposed`.
3. Approver(s) open Squads mobile app, review proposal (wallet, amounts, memo), tap Approve. Threshold 2-of-3 reached → Squads executes on-chain.
4. Backend polling job (every 60s) lists recent executed Squads transactions, matches by memo to `approved_grants.squads_proposal_pubkey`. On match → status `executed`, `payout_tx_signature` stored, `paid_at` set.
5. **Wall visibility gate:** `approved_grants` only renders on `/wall` when `payout_status = executed`.

### Stage 5 — Public surface materializes

- New executed grant → worker hits Next.js on-demand revalidation API for `/wall` and `/wall/[displayNumber]`.
- Applicant receives Resend email with grant link, OG-optimized for re-tweet.

### Stage 6 — Failure paths

| Failure | Handling |
|---|---|
| Tweet deleted between verify and review | Reviewer sees stored snapshot in `tweet_verification_payload`; default policy: approve based on snapshot unless suspicious. |
| Squads proposal expires before threshold | Admin clicks "retry payout" → backend creates fresh proposal; old pubkey kept in `audit_log`. |
| On-chain execution fails (insufficient hot balance, etc.) | Status → `failed`, Discord webhook fires, admin tops up multisig, retries. |
| Receipt upload fails mid-form | Client retries once with fresh presigned URL. Persistent fail → form errors; no `submissions` row. |
| Bounty filled at race-condition edge | Partial unique index causes second commit to fail; user sees `BOUNTY_FULLY_CLAIMED`. |
| Twitter API completely unavailable | Worker switches to "manual verification" mode (config flag); admin sees raw URL instead of payload, opens manually. |

## 9 · Anti-fraud + rate limiting

### 9.1 Pre-intake hard gates

| Dimension | Rule | Configurable |
|---|---|---|
| Wallet, open lane | 1 approved grant / 7 days | `OPEN_LANE_WALLET_COOLDOWN_DAYS` |
| Twitter ID, open lane | 1 approved grant / 7 days | same |
| IP (hashed) submissions | Max 5 / 24h | yes |
| Receipt hash | Permanent ban on duplicate | no |
| Wallet lifetime | 100,000 $MARLBRO + 2 SOL total | yes |
| Twitter ID lifetime | same | yes |
| Bounty | `max_claims` slot reserve | per bounty |
| Concurrent bounty claims per wallet | Max 3 unresolved | yes |

Trip → `429 {error_code, retry_after}`. UI message in deadpan voice: *"Application denied. Form 042-W: Subsequent applications from wallet 5n3X···k7p4 may be filed on or after 2026-05-13."*

### 9.2 Bot prevention on the form
- Cloudflare Turnstile invisible CAPTCHA.
- Twitter OAuth required.
- Honeypot field (hidden `website` input, silent reject if filled).
- Time-on-page ≥ 3s required.

### 9.3 Twitter content checks (auto, in worker)

**Hard requirements** (failing → auto-flag): author match, ≥1 photo, mention present, age ≤ 7d, not a retweet.

**Soft signals** (don't block; surface as SVG badges in admin queue):
- Account age < 30d → `NEW ACCOUNT` badge.
- Follower count < 10 → `NO FOLLOWERS` badge.
- Account has zero non-$MARLBRO content → `SINGLE-USE` badge.
- Tweet text Levenshtein-similar (< 5) to a previously rejected tweet → `COPYCAT` badge.

### 9.4 Cluster detection (manual review aid)

Per-submission, computed at queue load:
- IP cluster (>3 submissions / 7d / same ip_hash) → `IP CLUSTER` badge.
- Wallet cluster (>2 wallets / 7d / same ip_hash) → `WALLET CLUSTER` badge.
- Bounty submission spike (sudden volume on one bounty) → `BOUNTY SPIKE` badge.
- Funding-source cluster — DEFERRED to v2 (requires on-chain indexer).

### 9.5 Receipt sanity (non-blocking)
- Full-res display in admin queue.
- EXIF extracted: date, GPS (if present), camera. Date > 30d old → `STALE RECEIPT` badge.
- No OCR in v1.

### 9.6 Backpressure
If `submissions WHERE status = review_ready` count > 500 (configurable), open lane form on public site shows: *"The Foundation is currently processing a high volume of applications. The Open Grant lane is temporarily closed."* Bounty lane stays open.

### 9.7 Observability
- Daily Discord webhook digest: submissions, approval rate, rejection-reason histogram, badge counts.
- All admin actions in `audit_log`, attributable.

### 9.8 Out of v1
ML fraud scoring, KYC, phone verification, IP geofencing — all rejected.

## 10 · Brand & visual system

### 10.1 Color tokens

| Token | Hex | Use |
|---|---|---|
| `--paper` | #F4ECD6 | Page background |
| `--paper-2` | #EBDFC0 | Panel backgrounds, alternating rows |
| `--ink` | #0A0A0A | Borders, body text, structural |
| `--ink-2` | #1A1411 | Body text on light panels (warmer) |
| `--marlbro` | #C2161A | Brand red |
| `--marlbro-deep` | #8B0E12 | Shadow red, hover red |
| `--gold` | #C9A227 | Pack-stripe accent — single-pixel rules only |
| `--stamp-red` | #A11C1F | Rubber-stamp ink |
| `--halftone` | #0A0A0A @ 12% | Texture overlay on red panels |

No gradients. No translucent overlays. No grays beyond paper/ink variants.

### 10.2 Typography

All free, all on Google Fonts.

- **Display:** Inter Tight 900, tracking -0.04em.
- **Subdisplay:** Inter Tight 700, tracking -0.02em.
- **Body:** Inter (400 / 500 / 700), tracking 0.
- **Mono:** IBM Plex Mono 500 — wallet/contract/form-number/code.

**Type scale (8pt baseline, modular 1.333):**

```
D1   96 / 100% / -0.04em      hero
D2   72 / 100% / -0.03em      page titles
H1   48 / 105% / -0.02em
H2   32 / 110% / -0.01em
H3   24 / 120% /  0
BodyL 18 / 150%
Body  16 / 150%
BodyS 14 / 150%
Caption 12 / 130% / 0.04em UPPERCASE
Eyebrow 10 / 100% / 0.12em UPPERCASE
```

### 10.3 Grid + spacing
12-column, 8px baseline, 24px gutters, max content width 1280px, margins clamp 32→64→96. **Border-radius is always 0.**

### 10.4 Borders + shadows

```
shadow-sm:  4px 4px 0  var(--ink)
shadow-md:  6px 6px 0  var(--ink)
shadow-lg: 10px 10px 0 var(--ink)
```

Border weights: 2 (default), 4 (cards/buttons), 6 (posters/heroes). Shadows are solid offset, never blurred. Hover states translate by the shrunk offset (the "press down" feel).

### 10.5 Component primitives
- **Button.** 4px ink border, 6px ink shadow, paper or red fill. Hover: shadow → 2px, transform → translate(2px, 2px). Click: shadow → 0, transform → translate(6px, 6px).
- **Form input.** 2px ink border, paper-2 fill, mono for codes / sans for prose. Focus: 4px border, red shadow.
- **Card.** 4px ink border, 6px shadow, optional halftone overlay.
- **Poster card** (Wall): vertical 4:5 ratio. Top — red bar with grant number + ISO date in mono. Middle — tweet quote in subdisplay, receipt thumbnail at 8° rotation. Bottom — payout in D-scale mono, truncated wallet, OFFICIALLY DISBURSED rubber stamp at -12°. 6px border, 10px shadow.
- **Stamp.** SVG, hand-drawn-feel rounded rect with text inside, rotated 6–18°. Variants: APPROVED / REJECTED / PAID / DRAFT / VOID / OFFICIALLY DISBURSED / NOT FINANCIAL ADVICE / APPLICATION NOT FOUND.
- **Tag/chip.** Mono caps text, 2px ink border, paper fill, no shadow.
- **Footnote.** Superscript number → "Disclosures" section at page bottom.

### 10.6 Recurring motifs
- **Chevron** (Marlboro pack chevron silhouette): SVG primitive used as section dividers, page footer, top of homepage hero. The geometric signature.
- **Halftone:** 12% black radial-gradient dot pattern, applied as overlay on red panels for newsprint feel.
- **Cigarette burn:** small char-mark PNGs (6 variations); max 1–2 per page.
- **Schedule references** in copy and metadata: Schedule R-7, Form 042-A, Disclosure §14(b)(ii), etc.
- **Rubber stamps** liberally on posters, admin UI, FAQ disclaimers, 404.

### 10.7 Imagery rules
- **No stock photos. Ever.**
- **No emojis. Ever.** Every icon, status badge, social mark is a **custom SVG**. (See §10.10.)
- **No mascot illustrations** — the chevron is the only repeated visual motif, except for the single hero asset (§10.8).
- All other imagery is user-submitted (receipts) or generated (poster cards, OG images).

### 10.8 Hero brand asset — "the Marlbro Girl"

A single AI-generated character anchors three specific pages. Anime-pulp pin-up smoking a cigarette, in Marlboro Red palette, Showa-era retro-poster aesthetic (1960s Japanese cigarette ad meets American Marlboro pin-up).

**Three canonical variants only:**

1. **Hero (`/`)** — cigarette in hand, half-lit, looking at viewer. **Composition: right-half framed poster.** Type stack on left ~40% of viewport, image on right ~60% inside a 6px ink border with 10px shadow. Mobile: image stacks below type at full width, framed.

2. **Manifesto (`/manifesto`)** — full-bleed, full-body, smoking dramatically against red sky. Halftone + CMYK off-register treatment applied. Type sits in a Swiss-brutalist black box overlaid.

3. **404** — holding a clipboard with APPLICATION NOT FOUND stamped diagonally across.

**Asset pipeline:**
- Generation: external (user-managed; e.g., Midjourney v7 / Flux Pro / SDXL pipeline). Spec doc supplies a base prompt template per variant.
- Master output: 3000×4000 PNG.
- Color-grade pass: match `--marlbro` (#C2161A) exactly via Photoshop or similar; saturation/hue clamped to palette.
- Web export: AVIF + WebP fallback. Hero 1600px wide, Manifesto 2400px wide, 404 800px wide.
- Storage: `/public/hero/` in Next.js repo (static CDN delivery beats R2 for hero assets).
- Performance: LQIP blur placeholder via `next/image` `placeholder="blur"`. Target CLS = 0.
- Alt text in deadpan voice: *"Figure 1 — representative grantee. Furnished by the Foundation's recruitment division for illustrative purposes only."*

This is the **only** "mascot" allowance in the system. The asset never appears on `/bounties`, `/wall`, `/apply`, `/faq`, or `/admin`.

### 10.9 Voice + copy
- Page titles as form numbers: `FORM 042-A · OPEN GRANT APPLICATION`.
- Bureaucratic register: "The applicant shall," "Pursuant to," "In accordance with."
- Numbers as fixed-decimal with thousands commas + units: `5,000.00 $MARLBRO`.
- Wallet addresses: `5n3X···k7p4` in mono.
- Dates: ISO `2026-05-06` everywhere. No prose dates.
- All-caps only in eyebrow labels and stamps. Never in body.
- No emojis. No exclamation points. No "ser" / "anon" / crypto-Twitter shorthand.

### 10.10 SVG asset inventory (no emojis allowed)

All built as single-color SVG, sizable, color-controlled by `currentColor`. Stored in `/components/icons/`.

**Brand glyphs:** chevron, deformed Marlbro wordmark, cigarette silhouette, lit-cigarette with smoke, ashtray, pack outline.

**Status stamps (rotated rect with text):** APPROVED, REJECTED, PAID, DRAFT, VOID, OFFICIALLY DISBURSED, NOT FINANCIAL ADVICE, APPLICATION NOT FOUND.

**Cluster / anti-fraud badges (small rect tag with mono caps):** NEW ACCOUNT, NO FOLLOWERS, SINGLE-USE, COPYCAT, IP CLUSTER, WALLET CLUSTER, BOUNTY SPIKE, STALE RECEIPT, VERIFIED.

**Social / utility:** Twitter X mark (single-color), Solscan mark, copy icon, external-link icon, info glyph, warning glyph, success glyph, error glyph (all single-color, geometric).

**Decorative:** 6 cigarette-burn marks, 3 halftone patches, 1 chevron repeating tile.

### 10.11 Microinteractions
- Buttons depress on click (shadow shrink + translate).
- New poster on `/wall`: 200ms "stamp slam" — scale 1.2 → 1, rotate 4° → 0, on first paint only.
- Page transitions: instant, no fade.
- Loading: bureaucratic phrases, never spinners. *"PROCESSING SUBMISSION — ETA 14s"*

### 10.12 Forbidden list

| ❌ | Reason |
|---|---|
| Gradients | Anti-Swiss |
| Glassmorphism | Anti-everything |
| Border-radius > 0 | Anti-brutalist |
| Drop-shadow with blur | Anti-brutalist |
| Dark mode | Project is *paper*; paper isn't dark |
| Confetti / celebration FX | Anti-deadpan |
| Spinners | Use bureaucratic ETAs |
| Emojis | Use custom SVG |
| Lorem ipsum | Use government-form filler |
| Stock photos | Generate or use user-submitted only |

## 11 · Admin / Auth / Security

### 11.1 Public auth (applicants)
- Twitter OAuth 2.0 with PKCE. Scope: `tweet.read users.read offline.access`.
- Optional email captured (used for grant-issuance notifications).
- No wallet-connect required to apply — applicant pastes wallet address.
- **Wallet address verification UX (anti-typo safeguard):** address validated client-side as base58 32–44 chars. UI displays the parsed address with first-4 / last-4 chars highlighted in mono, with a required confirmation checkbox: *"I confirm I control wallet 5n3X···k7p4. The Foundation cannot recover funds sent to incorrect addresses."* Form will not submit without checkbox.
- Session: httpOnly + Secure + SameSite=Lax cookie, HS256-signed, 7-day TTL.

### 11.2 Admin auth
- Magic link via Resend, addresses must be in `admins` table.
- **Roles:**
  - `reviewer` — approve/reject submissions only.
  - `approver` — reviewer privileges + bounty CRUD + can initiate Squads proposals.
  - `superadmin` — approver privileges + admin CRUD + config CRUD + audit log access.
- **Step-up:** destructive actions (admin role change, bounty deletion, mass operations) require fresh magic-link auth within last 5 minutes.
- Session: 12-hour TTL, idle 30min, IP-bound.
- TOTP optional, **enforced for `superadmin`**.

### 11.3 Squads multisig
- Signer model decoupled from website admin roles.
- Threshold 2-of-3 at launch (founder phone, ops phone, cold paper recovery).
- Server `SQUADS_PROPOSER_SK` can only propose, not execute.
- Memo convention: `marlbro:grant:{approved_grants.id}`.
- Treasury split: cold multisig (3-of-5, signers offline) holds reserved supply; hot multisig holds ~1 week of payouts; quarterly manual replenishment.

### 11.4 Secrets inventory

| Secret | Stored | Rotation |
|---|---|---|
| `DATABASE_URL` | Railway env | On admin compromise |
| R2 access keys | Railway env | Quarterly |
| Twitter API bearer + OAuth client secret | Railway env | On Twitter API key change |
| Resend API key | Railway env | Quarterly |
| Helius RPC key | Railway env | Quarterly |
| `SQUADS_PROPOSER_SK` | Railway env | On admin compromise |
| Magic-link signing key (HS256) | Railway env | Annual + on suspicion |
| Twitter token encryption key | Railway env (separate from above) | Annual + on suspicion |
| Squads multisig signer keys | Phones only — NEVER on server | Per Squads policy |

### 11.5 Edge security
- HTTPS everywhere, HSTS preload-eligible.
- Strict CSP (template in repo): `default-src 'self'; img-src 'self' R2_DOMAIN abs.twimg.com data:; script-src 'self' 'sha256-...'; frame-src platform.twitter.com; connect-src 'self' API_DOMAIN`.
- Cloudflare in front of `api.marlbro.com` for L7 + bot management + Turnstile.
- Vercel WAF: rate-limit `/api/submissions` at 10/min/IP at edge.
- All cookies `Secure; HttpOnly; SameSite=Lax`.

### 11.6 Privacy & retention
- IP addresses **never stored raw**. Hashed with server-side salt before insertion.
- Twitter tokens encrypted at rest (libsodium `secretbox`).
- Refresh tokens deleted after submission's terminal state.
- Receipt photos retained 90 days post-approval, then auto-deleted via R2 lifecycle rule. Approved-grant poster image retained indefinitely.
- `audit_log` retained 1 year hot, archived to R2 cold indefinitely.
- Right-to-deletion handled manually; approved-grant rows pseudonymized but kept (on-chain payout is public anyway).

### 11.7 Backups
- Postgres: Neon PITR (7-day window) + nightly pg_dump → encrypted → R2 cold (30-day retention).
- R2: versioning enabled on receipts bucket; lifecycle deletes versions > 90 days.
- Squads recovery runbook stored offline.

### 11.8 Audit logging
Every state-changing admin action writes to `audit_log` with: who, what, when, target, before/after JSON snapshot. Surfaced in `/admin/audit` to superadmins. Append-only at app layer.

### 11.9 Incident response

| Incident | Response |
|---|---|
| `SQUADS_PROPOSER_SK` leaks | Rotate keypair, update Squads to remove old proposer, audit recent proposals. No funds at risk (humans must sign). |
| Postgres compromise | Rotate `DATABASE_URL`, revoke admin sessions, force re-auth, audit `audit_log` for fake approvals in window. |
| Hot multisig drained | Cold multisig untouched. Investigate signer compromise. Replace signers, fresh hot multisig. |
| Twitter API access pulled | Worker switches to manual verification (config flag); admin opens tweets manually. |
| Vercel/Railway outage | Public site goes down; queued submissions persist; already-proposed Squads payouts still execute. |

### 11.10 Out of v1
SAML/SSO, KMS-backed key management, public bug bounty, SOC 2.

## 12 · Tech stack summary

| Layer | Choice |
|---|---|
| Frontend framework | Next.js 15 (App Router, TS) |
| CSS | Tailwind v3, custom design tokens via CSS vars |
| Backend framework | Hono on Node |
| Hosting (frontend) | Vercel |
| Hosting (backend) | Railway |
| Database | Neon Postgres |
| ORM | Drizzle |
| Object storage | Cloudflare R2 |
| Email | Resend |
| Solana RPC | Helius |
| Solana SDKs | `@solana/web3.js`, `@solana/spl-token`, `@sqds/multisig` |
| Twitter | Twitter API v2 (paid Basic tier) |
| OG image generation | Satori + `@vercel/og` |
| Bot prevention | Cloudflare Turnstile |
| CDN / WAF | Cloudflare in front of API; Vercel for site |
| Monitoring | Sentry + Discord webhooks |
| Job queue | `pg-boss` (Postgres-backed, no extra infra) |

## 13 · v1 build phases (high-level)

The detailed implementation plan is the next deliverable, produced via `writing-plans`. High-level phasing:

1. Foundation: repo, design tokens, Tailwind, base components, deploy CI.
2. Public site shell: home, manifesto, FAQ — no submission flow yet.
3. Data layer + admin auth + admin shell.
4. Bounty Board (public read + admin CRUD).
5. Submission flow: form, intake, R2 upload, Twitter OAuth, rate-limit gates.
6. Worker: tweet verification, OG image generation, polling.
7. Admin queue + approve/reject + audit log.
8. Squads integration: proposer keypair, propose-on-approve, polling executed proposals.
9. Wall of Grants — public gallery, single-poster pages, OG.
10. Anti-fraud cluster signals + backpressure + observability.
11. Hardening: CSP, Turnstile, rate limit at edge, backup runbooks tested, incident-response dry run.
12. Brand asset integration: hero/manifesto/404 image production + integration.
13. Pre-launch: load test, manual end-to-end test on devnet multisig, mainnet treasury setup.

## 14 · Open / deferred

| Item | Status |
|---|---|
| Token contract launchpad choice (pump.fun vs four.meme vs Believe) | Defer to launch week — doesn't affect site build. |
| Specific bounty roster for launch | Out of design scope; content task before launch. |
| Final lifetime cap numbers | Tunable post-launch via `config` table. |
| Funding-source cluster detection | v2 (requires indexer). |
| Email-notification copy | Draft during build; deadpan-voice templates. |
| Marlbro Girl prompt template per variant | Draft during build; iteration with image-gen tool. |

---

*End of spec.*
