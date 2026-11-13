# Requirements check (PRD sections 2, 5.1 to 5.9, 9)

Audit date: 2026-11-13. Branch `main`, no code or config changed.
Statuses: **Done**, **Partial**, **Missing**, **Changed** (deliberately different, e.g. mock billing instead of Stripe).

## Automated checks

| Check | Result |
| --- | --- |
| `npm run lint` | Pass (exit 0) |
| `npm run typecheck` | Pass (exit 0) |
| `npm test` | Pass: 17 files, 143 tests |
| `npm run build` | Pass (Next.js 16.4.6). Route list has no `/api/stripe/webhook`, no settings page, no reset-password page |

## Playwright checks (text results only)

Run against the dev server already on `localhost:3000` (Neon database), using fresh browser contexts.

| # | Check | Result |
| --- | --- | --- |
| 1 | Sign up, create a space, open the public link logged out | Pass. Signup lands on `/dashboard` (empty state "Create your first space" shown). Public `/s/<slug>` returns 200 and shows the title with no login. No "Powered by" text. Public page sends `X-Frame-Options: DENY`. |
| 2 | Submit a testimonial, see it in the inbox | Pass. Funny message plus a GIF shown. Inbox row shows name, email, text, date and "Can share". A `<b>` tag typed in the text shows as literal text. |
| 3 | Open the embed page | Pass. `/embed/<slug>` returns 200 with the testimonial, rating and no email. `Access-Control-Allow-Origin: *`. No "Powered by". The `Cache-Control` seen was `no-store`, because this is the dev server (Fast Refresh in the console log); `next.config.ts` sets `max-age=60`, which this audit did not observe on a production server. Unknown slug shows a friendly page but with HTTP 200. |
| 4 | Mock upgrade | Pass. Free plan showed an Upgrade link. After "Pay $9.99 (demo)" the app went to `/dashboard/billing?success=1` with "Upgrade complete" and "You're on Pro" plus a renewal date. Dashboard showed "1 of 25 spaces" and the upgrade banner was gone. No "Manage subscription" button (a Cancel button instead). |
| 5 | Second account isolation | Pass, with a positive control. Account B saw no spaces and no testimonials of account A. `/dashboard/spaces/<A id>/edit` and `/created` showed 404. `?space=<A id>` on inbox and embed builder leaked nothing. Account A still saw its own data. Logged-out `/dashboard/spaces` redirects to `/login`. |

Not checked in a browser: console errors, mobile viewport, `embed.js` on an external page, carousel style, favorite/hide/delete persistence (covered only by unit tests).

Test accounts `audit-a-*@example.com` and `audit-b-*@example.com` (several from this run) now exist in the Neon database. They were not deleted, because deleting is outside this audit's scope.

## Requirements table

| Requirement (PRD section) | Status | Evidence / notes |
| --- | --- | --- |
| 2: Free 3 spaces / 100 per space, Pro 25 / 1,000 | Done | `lib/plans.ts` (`PLAN_LIMITS`), `lib/limits.ts`; dashboard showed "1 of 25 spaces" after upgrade |
| 2: Limits enforced server-side | Done | `app/dashboard/spaces/actions.ts` (owner row locked, count, 403 state); `app/s/[slug]/actions.ts` (space locked, 409 state) |
| 2: Free plan shows "Powered by" badge on public page and embed; Pro removes it | Missing | No "Powered by" anywhere in `app/`, `components/`, `public/`. Playwright checks 1 and 3 show none |
| 2: Space limit blocks creation and shows an upgrade prompt | Partial | Blocked with message and "Upgrade to Pro" link, but only after submitting the form (`space-form.tsx`). "New space" does not open a prompt first |
| 2: Testimonial limit: public page says "not accepting responses right now" | Done | `lib/limits.ts` `CLOSED_MESSAGE`; `app/s/[slug]/page.tsx` renders `ClosedNotice` |
| 2: Pro cancel keeps data; over-limit items become read-only | Partial | Nothing is deleted (`lib/billing.ts` `applyCancel`). Read-only is only a warning in `cancel-button.tsx`; spaces beyond 3 can still be edited and managed. Cancel drops to Free immediately (see 5.7) |
| 5.1: Sign up, log in, log out; unique email | Done | `app/(auth)/actions.ts`; duplicate email handled via `USER_ALREADY_EXISTS`; Playwright 1 |
| 5.1: `/dashboard/*` needs a session; public pages do not | Done | `proxy.ts` plus `requireUser()` in `lib/session.ts`; Playwright 1 and 5 |
| 5.1: Password min 8; httpOnly cookie, 30 days | Done | `lib/validators/auth.ts`, `lib/auth.ts` (`expiresIn` 30 days). httpOnly is the Better Auth default; cookie flags not inspected |
| 5.1: Forgot / reset password by emailed link | Missing | No route under `app/(auth)` other than login and signup; no `sendResetPassword` in `lib/auth.ts`; no email provider in `package.json` or `.env.example` |
| 5.1: Account settings: edit name | Missing | No `/dashboard/settings`; not in `app/dashboard/nav-links.tsx` |
| 5.1: Account settings: change password | Missing | Same as above |
| 5.1: Account settings: delete account (cancel subscription, remove data, typed confirmation) | Missing | Same as above. Schema cascades exist (`prisma/schema.prisma` `onDelete: Cascade`), but nothing calls them |
| 5.2: Counters (total, unique customers, spaces, average rating, favorites, wall of love) | Done | `app/dashboard/page.tsx`, `lib/dashboard-queries.ts` |
| 5.2: Time-series chart with granularity, range and space filters | Done | `components/dashboard/submissions-chart.tsx`, `overview-filters.tsx` |
| 5.2: Recent submissions and plan-usage meter | Done | `app/dashboard/page.tsx` |
| 5.2: Free-plan upgrade banner linking to Billing | Done | `UpgradeBanner` in `app/dashboard/page.tsx`; gone after upgrade. Shown on Overview only, not on every page |
| 5.3: Fields: name, title, subtitle, ask | Done | `app/dashboard/spaces/space-form.tsx` |
| 5.3: Collect rating toggle | Done | `space-form.tsx` |
| 5.3: Fields configurator (Name and Email locked; company, social link, photo with on/off and required) | Done | `space-form.tsx` `FixedRow` and `OPTIONAL_FIELDS`; forced server-side in `actions.ts` `readFields`. The photo switch has no effect (see 5.4 photo row) |
| 5.3: Four themes (Light, Dark, Sunset, Ocean) | Done | `lib/themes.ts` |
| 5.3: Live preview of the public page | Done | `PublicFormView` used in `space-form.tsx` |
| 5.3: Success page with public link and copy button | Done | `app/dashboard/spaces/[id]/created/page.tsx`; Playwright 1 |
| 5.3: QR code on success page (nice to have) | Missing | Page has no svg, canvas or img (Playwright 1 count 0); no QR package in `package.json` |
| 5.3: Space cards (name, count, link, created date, edit, delete) | Done | `app/dashboard/spaces/space-card.tsx`. Link is shown as text, no copy button on the card |
| 5.3: Slug from name, kebab-case, random suffix, immutable | Done | `lib/slug.ts`; slug field is read-only in edit and not written by `updateSpaceAction` |
| 5.3: Editing allowed; turning a field off only hides it | Done | `updateSpaceAction` writes only the `fields` JSON; testimonials untouched |
| 5.3: Delete needs typed confirmation, removes testimonials | Done | `delete-space-dialog.tsx`, `deleteSpaceAction`; cascade in schema |
| 5.4: No login, mobile-first | Done | Single-column `max-w-xl` layout in `app/s/[slug]/page.tsx`; Playwright 1. Mobile viewport not tested |
| 5.4: Title, subtitle, ask, fields with required validation, rating, text, consent checkbox | Done | `components/space/public-form-view.tsx`. Consent label reads "shared publicly" without the PRD's "/ on social media" |
| 5.4: Funny confirmation with message and local meme GIF, fallback to message | Done | `public-form-client.tsx`, `lib/funny-messages.ts`; Playwright 2 showed message and image. Only one GIF in `public/gifs/` (PRD says "a few") |
| 5.4: Anti-spam: honeypot, per-IP rate limit, server validation, max length | Done | `app/s/[slug]/actions.ts`, `lib/rate-limit.ts`, 1,000-char cap. Rate-limit store is in memory per process, so it will not hold across multiple server instances |
| 5.4 / 5.3: Profile photo upload (JPG/PNG/WebP, max 2 MB) | Missing | `public-form-view.tsx` comment: "photo is left out of the public form until uploads are built"; no upload library; `photoUrl` is read in the inbox but never written; `.env.example` has no upload variables |
| 5.5: Inbox per space with space selector | Done | `app/dashboard/inbox/page.tsx`, `inbox-filters.tsx` |
| 5.5: Favorite (star), pinned to top | Done | `testimonial-row.tsx`, `lib/inbox-query.ts` `buildInboxOrder` |
| 5.5: Wall of Love heart toggle | Done | `testimonial-row.tsx`, `setWallOfLoveAction` |
| 5.5: Ellipsis menu: Edit, Hide/Unhide, Delete with confirmation | Done | `testimonial-row.tsx`, `edit-testimonial-dialog.tsx`, `delete-testimonial-dialog.tsx` |
| 5.5: Status filter, search, newest first, 20 per page, row details and consent badge | Done | `lib/inbox-query.ts`, `lib/validators/inbox.ts` (`PAGE_SIZE`); Playwright 2 showed the consent badge. Avatar is initials only, since photos cannot be uploaded |
| 5.6: Style (Masonry/Carousel), dark mode, animation, background colour, source | Done | `app/dashboard/embed/embed-builder.tsx` |
| 5.6: Live preview updates on every change | Done | `embed-builder.tsx` renders `TestimonialWall` from local state |
| 5.6: Script and iframe snippets with copy buttons | Done | `lib/embed-snippets.ts` (matches PRD format), `embed-builder.tsx` |
| 5.6: Embed shows only non-hidden, consented testimonials, favorites first | Done | `lib/embed-query.ts` (`buildEmbedWhere`, `EMBED_ORDER`, `EMBED_SELECT`); Playwright 3 showed no email |
| 5.6: Wall-of-Love heart affects the embed | Done | `buildEmbedWhere` adds `isWallOfLove` when source is `wall_of_love`. The source is not in the snippets, so it only applies after the owner clicks Save (`embedConfig`) |
| 5.6: Script injects auto-resizing iframe; CORS; ~60s cache | Done | `public/embed.js`, `components/embed/embed-height-reporter.tsx`, `next.config.ts` headers, `"use cache"` 60s in `app/embed/[slug]/page.tsx`. CORS seen in Playwright 3; production cache header not observed |
| 5.7: Plans side by side, current highlighted, Upgrade on Free | Done | `app/dashboard/billing/page.tsx`; Playwright 4 |
| 5.7: Upgrade creates a Stripe Checkout Session ($9.99/month) | Changed | Mock checkout: `app/dashboard/billing/checkout/*`, `actions.ts` `upgradeToPro`. No Stripe SDK in `package.json` |
| 5.7: Return to `/dashboard/billing?success=1` shows success message | Done | Playwright 4: "Upgrade complete" |
| 5.7: Webhooks at `/api/stripe/webhook` with StripeEvent idempotency | Changed | Not built; mock server actions write `User.plan` directly (`lib/billing.ts`). `StripeEvent` model exists in schema but is unused |
| 5.7: Pro view: "You're on Pro", renewal date | Done | Playwright 4 |
| 5.7: Manage subscription button (Customer Portal) | Changed | Replaced by a Cancel button (`cancel-button.tsx`) |
| 5.7: Cancel keeps Pro until period end | Changed | Cancel drops to Free at once, documented in `lib/billing.ts` |
| 5.7: `past_due` keeps Pro and shows "payment failed" banner | Changed | No payment-failure path in the mock |
| 5.7: `?canceled=1` neutral message from cancelled Checkout | Changed | No external Checkout to return from; the page ignores `canceled` |
| 5.8: No notification emails; Stripe receipts only from Stripe | Done | No email code in the repo |
| 5.8: Toasts for success and error on every action | Partial | No toast library. Inline messages exist for some actions ("Saved", "Space updated.", billing success, row errors). Delete space, favorite, hide and wall-of-love give no success feedback |
| 5.9: No spaces yet → "Create your first space" | Done | `app/dashboard/page.tsx`; Playwright 1 |
| 5.9: Space has no testimonials → inbox empty state with link and copy | Done | `app/dashboard/inbox/page.tsx` (code only; not driven in Playwright) |
| 5.9: Embed with nothing → preview "No testimonials yet", live widget renders nothing | Done | `embed-builder.tsx` `emptyMessage`; `testimonial-wall.tsx` returns `null` without it |
| 5.9: Space limit → upgrade prompt; server rejects with 403 | Partial | Server rejects (403 in action state, `spaces/actions.ts`; Server Actions cannot set an HTTP status). Prompt appears after submit, not on "New space" |
| 5.9: Testimonial limit → warning at 90% and 100%, public message, 409 | Done | `lib/inbox-query.ts` `countWarning`, `inbox/page.tsx`; `s/[slug]/page.tsx`; 409 in action state |
| 5.9: Unknown or deleted slug → friendly 404 | Partial | Friendly pages exist (`app/s/[slug]/not-found.tsx`, `app/embed/[slug]/not-found.tsx`) but the dev server answered HTTP 200 for both. Foreign dashboard ids show the default Next 404 text |
| 5.9: Invalid input → inline per-field errors, client and server | Done | `public-form-view.tsx`, `space-form.tsx`, auth forms, Zod schemas in `lib/validators/` |
| 5.9: Submit failed / rate limited → friendly retry, text preserved | Done | `app/s/[slug]/actions.ts` returns 429/500 messages and echoes `values` |
| 5.9: Photo upload failed → clear message | Missing | No upload exists |
| 5.9: Unexpected error → error boundary with retry | Missing | No `error.tsx` or `global-error.tsx` anywhere under `app/` |
| 9: Sign up, create space, public link within a minute | Done | Playwright 1 |
| 9: Customer submits without login; appears in inbox | Done | Playwright 2 |
| 9: Favorite, wall-of-love, edit, hide, delete work and persist | Done | `app/dashboard/inbox/actions.ts`, `actions.test.ts`. Not driven in a browser here |
| 9: Embed renders on an external page, script and iframe, both styles | Done | `embed-demo/index.html`, `public/embed.js`, `testimonial-wall.tsx`. This audit only loaded `/embed/<slug>` directly (masonry default) |
| 9: Free blocked at 3 spaces and 100 testimonials; Stripe test payment makes Pro (25 / 1,000) | Changed | Limits and mock upgrade work (`lib/limits.test.ts`, Playwright 4); payment is the demo flow, not Stripe test mode |
| 9: Billing and dashboard reflect plan after return | Done | Playwright 4 |
| 9: Every state in 5.9 implemented and reachable | Partial | Missing: error boundary, photo upload failure. Partial: space-limit prompt, 404 status |
| 9: Automated tests for plan limits and Stripe webhook handling | Partial | Plan limits covered (`lib/limits.test.ts`, `lib/plans.test.ts`, `lib/billing.test.ts`). No webhook, so no webhook tests. No Playwright specs in the repo |
| 9: Works on mobile and desktop, no console errors, clean production build | Partial | Build passes. Mobile viewport and console errors were not checked |
| 9: Seed data, `.env.example`, README (local setup, Stripe CLI webhook testing) | Partial | `prisma/seed.ts` and `.env.example` exist. README is out of date ("No migrations have been created yet", auth variables "not needed"), does not mention `npx prisma db seed`, and has no Stripe CLI section (Stripe not used) |

## Missing or partial

Ordered by importance:

1. **Password reset (5.1)**: Missing. No forgot or reset flow and no email provider, so a user who forgets a password is locked out.
2. **Account settings (5.1)**: Missing. No edit name, change password or delete account (the delete flow is also the only way for a user to remove their data).
3. **Free-plan "Powered by" badge (2)**: Missing on the public page and the embed. Pro has no visible benefit on these surfaces.
4. **Error boundary (5.9)**: Missing. No `error.tsx` or `global-error.tsx`, so an unexpected error has no retry screen.
5. **Profile photo upload (5.3, 5.4, 5.9)**: Missing. The photo switch exists in the space form but does nothing; the failed-upload message does not exist.
6. **Unknown slug 404 (5.9)**: Partial. Friendly pages exist but return HTTP 200 on the running server.
7. **Space-limit upgrade prompt (2, 5.9)**: Partial. Shown only after submitting the form, not when clicking "New space".
8. **Toasts (5.8)**: Partial. No toast library; many actions give no success feedback.
9. **Read-only over limit after cancel (2)**: Partial. Only a warning text; nothing is enforced.
10. **QR code on the success page (5.3)**: Missing (nice to have).
11. **Tests and README (9)**: Partial. No webhook tests (no webhook), no Playwright specs, README out of date, no seed instructions.
12. **Mobile and console-error check (9)**: Not verified in this audit.
13. **Rate limiting (5.4)**: Works, but the store is in memory per process, so it will not hold across multiple server instances.
