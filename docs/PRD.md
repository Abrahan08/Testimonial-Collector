# Testimonial Collector — MVP PRD

*A minimal testimonial.to-style SaaS. Written for handoff to an AI coding agent.*

## 1. Overview

A freemium web app where business owners create **Spaces**, share a public link, and collect testimonials from customers without those customers needing an account. Owners manage testimonials in an inbox, and display them on any website through an embeddable widget.

**Goals:** ship a small, working end-to-end product: sign up, create space, collect, manage, embed, upgrade.

**Out of scope (v1):** video testimonials, team seats, custom domains, email campaigns, AI features, multiple paid tiers, email notifications, i18n, social-media auto-posting, a public API, importing from other tools.

### 1.1 User Roles

| Role | Who | Can do |
| --- | --- | --- |
| Owner | Signed-in account holder (Free or Pro) | Everything in the dashboard, for their own spaces only |
| Customer | Anonymous person with a space link | Open the public space page and submit one testimonial |
| Visitor | Anyone viewing a page with the embed | See embedded testimonials (read-only) |
| System | Stripe webhooks | Update plan and subscription status |

No admin, team, or staff roles in v1.

## 2. Plans & Limits

|  | Free | Pro ($9.99/month) |
| --- | --- | --- |
| Spaces | 3 | 25 |
| Testimonials per space | 100 | 1,000 |

- Limits are enforced **server-side** (never UI-only). The Free plan shows a "Powered by" badge on the public page and in the embed; Pro removes it.
- When the owner hits the space limit, creation is blocked and an upgrade prompt is shown.
- When a space hits its testimonial limit, the public page shows a friendly "not accepting responses right now" message.
- If a Pro user cancels, existing data is kept. Anything over the Free limits becomes read-only. Nothing is deleted.

## 3. Recommended Tech Stack

Defaults for the agent; swap if needed.

- Next.js (App Router) + TypeScript, Tailwind CSS + shadcn/ui
- PostgreSQL + Prisma
- Auth: Auth.js or Better Auth (email + password; Google optional)
- Stripe (Checkout, Customer Portal, webhooks)
- Recharts for dashboard graphs
- Image upload for profile photos: UploadThing or S3/R2 (max 2 MB, JPG/PNG/WebP)

## 4. Data Model

**User**: id, name, email, passwordHash (or provider), plan (`free` | `pro`), stripeCustomerId, stripeSubscriptionId, subscriptionStatus, currentPeriodEnd, createdAt

**Space**: id, ownerId, slug (unique, used in the public URL), name, title, subtitle, ask (the question/prompt text), collectRating (bool), theme (enum), fields (JSON: `[{key, enabled, required}]`), createdAt

**Testimonial**: id, spaceId, name, email, text, rating (nullable), company (nullable), socialLink (nullable), photoUrl (nullable), consentToShare (bool), isFavorite, isWallOfLove, isHidden, createdAt, updatedAt

**EmbedConfig**: id, spaceId, style (`masonry` | `carousel`), darkMode, animation, backgroundColor, source (`wall_of_love` | `all_visible`)

**StripeEvent**: id (Stripe event id), processedAt — for webhook idempotency

## 5. Functional Requirements

### 5.1 Auth

- Anyone can sign up, log in, and log out. Email must be unique.
- All `/dashboard/*` routes require a session. Public pages (`/s/[slug]`, `/embed/*`) do not.

* Password rules: minimum 8 characters. Sessions use an httpOnly cookie (30 days).
* **Forgot / reset password** via a time-limited emailed link. This is the only transactional email in v1 (no notification emails).
* **Account settings page:** edit name, change password, delete account. Deleting an account cancels any active Stripe subscription first, then removes all spaces and testimonials, after a typed confirmation.

### 5.2 Dashboard

- Counters: total testimonials, unique customers (distinct emails), spaces, average rating, favorites, wall-of-love count.
- Time-series chart of testimonials collected. Filters: granularity (day / week / month), range (7 / 30 / 90 days), and space (all or one).
- Recent submissions list and a plan-usage meter (e.g. "2 of 3 spaces").
- Free plan only: a persistent upgrade banner linking to Billing.

### 5.3 Spaces — create and edit

Fields on the form:

- Space name, title, subtitle, and the ask (text shown to customers)
- **Collect rating** toggle (1–5 stars)
- **Fields configurator:** Name and Email are always on and always required (locked). Optional predefined fields: company name, social link, profile photo. Each has an on/off switch and a required toggle.
- **Theme:** pick from 4 predefined themes (Light, Dark, Sunset, Ocean).
- Live preview of the public page while editing.

On save, show a **success page** with the public link (`/s/[slug]`), a copy button, and a QR code (nice to have).

**Space list and lifecycle:**

- A spaces page lists each space as a card: name, testimonial count, public link, created date, and edit / delete actions.
- The slug is generated from the name (kebab-case, random suffix if taken) and is **immutable**, so shared links never break.
- Editing a space later is allowed. Turning a field off only hides it on the public form; testimonials already collected keep that data.
- Deleting a space requires typed confirmation and permanently deletes its testimonials.

### 5.4 Public collection page `/s/[slug]`

- No login. Mobile-first.
- Shows title, subtitle, ask, and the configured fields (with required validation), the star rating if enabled, the testimonial text, and a **consent checkbox**: "I allow this testimonial to be shared publicly / on social media".
- On submit, show a **funny confirmation screen**: a random funny message plus a meme GIF (bundle a few GIFs as local assets to avoid hotlinking; fall back to the message alone).
- Anti-spam: honeypot field, per-IP rate limit, server-side validation, max text length (e.g. 1,000 chars).

### 5.5 Inbox

List testimonials per space (with a space filter) showing submitter name, text, rating, date, and status badges. Per-item actions:

- **Favorite** (star): favorited items are pinned to the top of the space's list.
- **Wall of Love** (heart icon toggle): marks it for the embed/wall.
- **Ellipsis menu (⋯):** Edit (text, name, rating), Hide/Unhide (hidden from all public output), Delete (with confirmation).

**List behavior:** a space selector (required), a status filter (All / Favorites / Wall of Love / Hidden), search by name or text, newest first with favorites pinned on top, and pagination (20 per page). Each row shows avatar, name, email, company, rating, text, date, and a consent badge.

### 5.6 Embed builder

A page where the owner picks a space and configures the widget:

- **Style:** Masonry or Carousel
- Dark mode on/off, animation on/off, background color picker
- Source: Wall-of-Love only, or all visible testimonials
- **Live preview** that updates instantly on every change
- Output two snippets with copy buttons:
  - JavaScript: `<script src="{APP_URL}/embed.js" data-space="SLUG" data-style="masonry" data-dark="false" data-animation="true" data-bg="#ffffff"></script>`
  - iframe: `<iframe src="{APP_URL}/embed/SLUG?style=masonry&dark=false&animation=true&bg=ffffff" width="100%" style="border:0"></iframe>`
- Rules: the embed only shows testimonials that are **not hidden** and have **consent = true**. Favorites appear first. The script version injects an auto-resizing iframe. Serve with CORS enabled and cache for \~60s.

### 5.7 Billing

- Page showing both plans side by side, current plan highlighted, and an **Upgrade** button on Free.
- Upgrade creates a Stripe **Checkout Session** (subscription mode, $9.99/month price) and redirects. Return URL: `/dashboard/billing?success=1` shows a success message.
- **Webhooks** at `/api/stripe/webhook` (verify signature, idempotent via StripeEvent): `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`. The webhook, not the redirect, is the source of truth for plan status.
- If already subscribed, Billing shows "You're on Pro", renewal date, and a **Manage subscription** button (Stripe Customer Portal).

* **Lifecycle:** new accounts start on Free. Cancelling in the Customer Portal keeps Pro until the period ends, then the account drops to Free. `past_due` keeps Pro during Stripe's retry window and shows a "payment failed, update your card" banner.
* Returning from a cancelled Checkout goes to `/dashboard/billing?canceled=1` with a neutral message and no plan change.

### 5.8 Notifications

- **No email notifications in v1.** Owners see new testimonials in the Inbox and dashboard counters.
- In-app feedback only: toasts for success and error on every action, and the upgrade banner and limit warnings described below.
- Stripe sends its own payment receipts; the app sends none.

### 5.9 Empty, Error and Limit States

| Situation | Behavior |
| --- | --- |
| No spaces yet | Dashboard empty state with a "Create your first space" button |
| Space has no testimonials | Inbox empty state showing the public link with a copy button |
| Embed has nothing to show | Preview says "No testimonials yet"; the live widget renders nothing |
| Space limit reached | "New space" opens an upgrade prompt; server rejects with 403 |
| Testimonial limit reached | Owner sees a warning at 90% and 100%; public page shows "This space isn't accepting testimonials right now"; server rejects with 409 |
| Unknown or deleted slug | Friendly 404 page |
| Invalid form input | Inline per-field errors; required fields checked on client and server |
| Submit failed or rate limited | Friendly retry message; the customer's text is preserved |
| Photo upload failed | Clear message (over 2 MB or wrong type) |
| Unexpected error | Error boundary with retry; no stack traces shown |

## 6. Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | public | Landing page with sign-up CTA |
| `/login`, `/signup` | public | Auth |
| `/forgot-password`, `/reset-password` | public | Request and complete a password reset (emailed, time-limited link) |
| `/dashboard` | auth | Stats and charts |
| `/dashboard/spaces` | auth | Space list (cards with count, link, edit / delete) |
| `/dashboard/spaces/new`, `/dashboard/spaces/[id]` | auth | Create / edit space |
| `/dashboard/spaces/[id]/created` | auth | Success page with public link |
| `/dashboard/inbox` | auth | Testimonial management |
| `/dashboard/embed` | auth | Embed builder |
| `/dashboard/billing` | auth | Plans and upgrade |
| `/dashboard/settings` | auth | Account settings: name, password, delete account |
| `/s/[slug]` | public | Testimonial submission page |
| `/embed/[slug]`, `/embed.js` | public | Widget |
| `/api/stripe/webhook` | Stripe | Webhook receiver |

## 7. Authorization, Security & Non-Functional Requirements

- Passwords hashed (argon2/bcrypt); CSRF-safe; all inputs validated with Zod.
- Sanitize testimonial text on render (no raw HTML) to prevent XSS, especially in the embed.
- Owners can only access their own spaces and testimonials (authorization check on every query).
- Responsive on mobile; accessible (labels, contrast, keyboard navigation).
- Env vars: `DATABASE_URL`, `AUTH_SECRET`, `APP_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`, plus the chosen image-upload and email providers' keys (documented in `.env.example`).
- Include a seed script with demo data and a README with local setup and Stripe CLI webhook testing steps.

**Authorization rules:**

- Every dashboard query and mutation is scoped to the signed-in owner (`ownerId` check on spaces, and on testimonials through their space). Another owner's ids return 404.
- Public endpoints are limited to: read a space's public config, submit a testimonial, and read embed data.
- Customer emails and the consent flag are never exposed in public or embed output.
- Rate limit submissions per IP and per space; honeypot field on the public form.
- Embed routes allow framing from any site and CORS; all other routes deny framing.
- Stripe webhooks verify the signature and use event ids for idempotency. Secrets live only in environment variables.

## 8. Suggested Build Order

1. Project setup, DB schema, auth
2. Spaces CRUD + fields/theme config + success page
3. Public submission page + confirmation screen
4. Inbox + actions (favorite, wall of love, edit, hide, delete)
5. Dashboard stats and chart
6. Embed builder + `embed.js` + `/embed/[slug]`
7. Plan limit enforcement
8. Stripe billing, webhooks, upgrade banner
9. Polish, empty states, seed data, README

## 9. Definition of Done

- A new user can sign up, create a space, and get a working public link within a minute.
- A customer can submit a testimonial without logging in, and it appears in the owner's inbox.
- Favorite, wall-of-love, edit, hide, and delete all work and persist.
- The embed renders correctly on an external HTML page, in both script and iframe form, in both styles.
- A Free user is blocked at 3 spaces and at 100 testimonials per space. After a test-mode Stripe payment, they become Pro, and the limits become 25 and 1,000.
- Billing and dashboard reflect the plan correctly after returning from Stripe.

* Every state in section 5.9 is implemented and reachable.
* Plan limits and Stripe webhook handling have automated tests.
* The app works on mobile and desktop with no console errors, and builds cleanly for production.
* Seed data, `.env.example`, and a README (local setup, Stripe CLI webhook testing) are included.

## 10. Assumptions & Decisions

**Confirmed assumptions:**

- "Missionary style" in the brief was read as **Masonry**.
- "SAS" was read as **SaaS**.
- Pro is billed monthly. No annual plan and no free trial.
- Email + password auth, with Google sign-in optional.
- Only testimonials with customer consent appear in public embeds.

**Decisions:**

1. No email notifications in v1 (owners check the inbox and dashboard).
2. App name, logo, and colors: the coding agent picks them.
3. The Free plan shows a small "Powered by" badge on the public page and embed; Pro removes it.
