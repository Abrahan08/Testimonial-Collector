# Testimonial Collector

A minimal freemium testimonial app: owners create Spaces, share a public link, collect testimonials, manage them in an Inbox and embed them on any site. There are Free and Pro plans; Pro billing is a demo (no Stripe).

## Tech stack

- Next.js 16.4.6 (App Router), React 19.3, TypeScript
- Tailwind CSS 4, shadcn/ui (Base UI), Recharts
- PostgreSQL on Neon, Prisma 7 (`@prisma/adapter-pg`)
- Better Auth, Zod 4
- Vitest for tests; Playwright is installed, but the repo has no Playwright specs

## How to run

### Prerequisites

- Node.js and npm. The Node version is not pinned in `package.json`; use a current LTS that Next.js 16 supports.
- A free PostgreSQL database on [Neon](https://neon.tech). Use the direct (non-pooled) connection string.
- No Docker and no Stripe account are needed.

### Install

```bash
git clone <repo-url>
cd Testimonial-Collector
npm install        # also runs `prisma generate`
cp .env.example .env
```

Fill in `.env` (never commit it):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon direct connection string, e.g. `<your-neon-connection-string>` |
| `AUTH_SECRET` | Secret used by Better Auth to sign sessions |
| `APP_URL` | Public base URL of the app, no trailing slash (`http://localhost:3000` locally) |

### Database

```bash
npx prisma migrate deploy   # apply the migrations
npx prisma db seed          # optional: load demo data (prisma/seed.ts)
```

### Run, test, build

```bash
npm run dev         # http://localhost:3000
npm test            # Vitest
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run build       # production build
```

### Try it

1. Sign up at `/signup`. You land on the dashboard.
2. Create a space. The success page shows its public link (`/s/<slug>`).
3. Open the public link in a logged-out window and submit a testimonial.
4. Open the Inbox in the dashboard to find it; favorite, hide, edit or delete it.
5. Open the Embed page to build a widget and copy the snippet; `embed-demo/index.html` is a sample page for the embed. Then open Billing, choose Upgrade and use "Pay $9.99 (demo)" to switch to Pro (any card is accepted).

## Features

Status comes from [docs/requirements-check.md](docs/requirements-check.md) (audit date 2026-11-13). Keep this table in sync with that file.

| Area | Status | Notes |
| --- | --- | --- |
| Auth | Partial | Done: sign up, log in, log out, unique email, protected `/dashboard/*`, password minimum, 30-day session. Not done (deliberately not built): password reset (forgot/reset by emailed link), account settings (edit name, change password, delete account). |
| Spaces | Partial | Done: create, edit with live preview, four themes, field configurator, success page with copy button, immutable slug, delete with typed confirmation. Not done (deliberately not built): QR code on the success page (nice to have). |
| Public page | Partial | Done: no login, validation, consent checkbox, funny confirmation, honeypot, per-IP rate limit, 1,000-character cap. Not done (deliberately not built): profile photo upload. |
| Inbox | Done | Space selector, favorite, Wall of Love, edit, hide, delete, status filter, search, 20 per page. |
| Dashboard | Done | Counters, time-series chart with filters, recent submissions, plan-usage meter, upgrade banner on Overview. |
| Embed | Done | Builder with live preview, masonry and carousel, script and iframe snippets, `embed.js`, CORS, 60 s cache configured. |
| Billing | Partial | Demo only: plans page, mock checkout, upgrade, cancel. See "Differences from the PRD". |
| Limits | Partial | Done: Free and Pro limits enforced server-side, "Powered by" badge on Free, space-limit upgrade prompt, closed public page at the testimonial limit. Not done (deliberately not built): read-only handling of over-limit spaces after cancel (the check marks it Partial: nothing is deleted and a warning text is shown). |
| Notifications and states | Partial | Done: empty states, inline field errors, retry on failed or rate-limited submit, error boundary. Not done (deliberately not built): toast notifications (the check marks it Partial: inline messages exist for some actions), photo upload failure message (no upload exists). Partial: unknown-slug 404 returns HTTP 200. |

## Differences from the PRD

Rows marked Changed in the requirements check:

- Billing is a demo: a mock checkout that accepts any card. No Stripe SDK, no Stripe account needed.
- No webhooks: there is no `/api/stripe/webhook`. The `StripeEvent` model exists in the schema but is unused; server actions write `User.plan` directly.
- Cancel replaces "Manage subscription" and drops to Free immediately, not at period end.
- No `past_due` / payment-failed path, and `?canceled=1` is ignored (there is no external Checkout to return from).

Other differences noted in the check:

- The rate limiter is in-memory per process. It resets on restart and does not hold across multiple server instances.
- Unknown or deleted slugs show a friendly page but with HTTP 200 (a decision, because of how Next streams with `cacheComponents`).

## Agentic tools used

| Tool | Where | What it did | Evidence |
| --- | --- | --- | --- |
| CLAUDE.md and the plan, implement, verify workflow | `CLAUDE.md` | Holds project rules (ownership scoping, server-side limits, Zod validation, plain-text rendering, framing and CORS) and requires a plan, approval, implementation, then lint, typecheck and tests for each feature. | The requirements check records lint, typecheck and build passing and 143 tests in 17 files. |
| Playwright MCP server | `.mcp.json` (stdio, `@playwright/mcp@latest`) | Drove a real browser to check the app. | About 198 calls in one usage window (author-reported). The requirements check lists five browser checks. Page snapshots are committed under `.playwright-mcp/` on `feat/embed` and `feat/billing`. |
| security-reviewer subagent | `.claude/agents/security-reviewer.md` | Read-only reviewer (Read, Grep, Glob) for changed files. Checks `ownerId` scoping, server-side plan limits, Zod validation, leaks of emails, consent or hidden items in public output, and `dangerouslySetInnerHTML` on user content. | Findings per feature: none recorded. |
| protect-files hook | `.claude/settings.json`, `.claude/hooks/protect-files.js` | PreToolUse hook that blocks edits to `.env*` files (except `.env.example`) and `prisma/migrations/`. Edit tools are checked by file path. Shell tools (Bash, PowerShell) get a conservative text scan of the command for those same paths. This is pattern matching, so indirect shell writes can slip through. | It blocked real edit attempts during normal work (author-reported). |
| frontend-design plugin (Anthropic) | `.claude/settings.json` (`enabledPlugins`: `frontend-design@claude-code-plugins`) | Installed with `/plugin marketplace add anthropics/claude-code` and `/plugin install frontend-design@claude-code-plugins`. Used to choose the design direction ([docs/design.md](docs/design.md)) and apply the design tokens, fonts and shared component styles. | `docs/design.md`; the plugin is enabled in `.claude/settings.json`. |

## Parallel work

The embed builder and the mock billing were built at the same time in two git worktrees. Both branches forked from `8ea0ae3` (dashboard overview) and, per `git diff`, touched no files in common:

- `feat/embed` (`6ffd491`): `app/dashboard/embed/`, `app/embed/[slug]/`, `components/embed/`, `lib/embed-query.ts`, `lib/embed-snippets.ts`, `lib/validators/embed.ts` (with tests), `lib/urls.ts`, `next.config.ts`, `public/embed.js`, `embed-demo/index.html`.
- `feat/billing` (`a14c59a`): `app/dashboard/billing/` (page, actions, cancel button, checkout), `lib/billing.ts` and its test, `app/dashboard/spaces/space-form.tsx`.

Both were merged with `--no-ff`: `1d1fddf Merge feat/embed`, then `37fe8dc Merge feat/billing`.

Two more branches followed, next to `feat/embed` and `feat/billing`:

- `fix/batch-a` (merge `5e25905 Merge fix/batch-a`): the fixes that followed the requirements check.
- `design/ui` (merge `1ff5270 Merge design/ui`): the design work described below.

## Design

The direction is "Clear Signal" ([docs/design.md](docs/design.md)): crisp, calm, instrument-panel precision, with Bricolage Grotesque headings, Figtree body text and one blue accent defined as color tokens. Space themes style only the public page and the embed, never the dashboard.

The `design/ui` branch was merged with `--no-ff`.

Honest note: the design was applied at foundation level (fonts, color tokens, shared components, dashboard header). The landing, login, signup and public pages were not restyled one by one.

## Known limitations and not done

These were deliberately not built (Not done):

- Password reset: no forgot/reset flow and no email provider, so a user who forgets a password is locked out.
- Account settings: edit name, change password, delete account.
- Profile photo upload (the photo switch in the space form has no effect) and no upload-failure message.
- Toast notifications: no toast library; some actions (delete space, favorite, hide, Wall of Love) give no success feedback.
- QR code on the space success page.
- Read-only handling over the limit after cancel: after cancelling Pro, over-limit spaces are not made read-only.

Other gaps:


- No Playwright specs and no webhook tests (there is no webhook).
- Mobile viewport and browser console errors were not checked.
- Only one meme GIF ships in `public/gifs/`.

## Docs

- [docs/PRD.md](docs/PRD.md): requirements
- [docs/data-model.md](docs/data-model.md): schema design
- [docs/requirements-check.md](docs/requirements-check.md): audit against the PRD
