# CLAUDE.md

## Project
Testimonial Collector: a minimal freemium testimonial SaaS (testimonial.to-style).
Owners create Spaces, share a public link, collect testimonials, manage them in an
Inbox, and embed them on any site. Free and Pro ($9.99/month) plans via Stripe.

**Source of truth:** `docs/Testimonial Collector — MVP PRD.md` (requirements; the
schema is in its section 4). Read the relevant PRD section before starting any
feature. If the PRD and the code disagree, tell me instead of silently choosing.

## Stack
Next.js (App Router) + TypeScript (strict), Tailwind + shadcn/ui, PostgreSQL + Prisma,
Auth.js (or Better Auth), Stripe, Recharts, Zod, Vitest, Playwright.

**Image upload** (profile photos): UploadThing or S3/R2, max 2 MB, JPG/PNG/WebP
(PRD section 3). **Email:** one transactional provider for the password-reset link
only (PRD section 5.1); no notification emails. Add the chosen providers' variables
to `.env.example`.

**Database:** hosted PostgreSQL on Neon (free tier), reached through `DATABASE_URL`
(use the direct, non-pooled connection string). No Docker. Do not add Docker files.

## Commands
```bash
npm install
npm run dev            # start dev server on http://localhost:3000
npm run build          # production build
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
npm test               # Vitest unit/integration tests
npx playwright test    # end-to-end tests
npx prisma migrate dev # create/apply a migration
npx prisma db seed     # load demo data
npx prisma studio      # browse the database
stripe listen --forward-to localhost:3000/api/stripe/webhook   # local webhooks
```

## Environment variables
Defined in `.env.example` (copy to `.env`). Never commit `.env`.
`DATABASE_URL`, `AUTH_SECRET`, `APP_URL`, `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`.

## Project layout
```
app/(marketing)      landing page
app/(auth)           login, signup, reset password
app/dashboard        owner area: overview, spaces, inbox, embed, billing, settings
app/s/[slug]         public testimonial submission page
app/embed/[slug]     embeddable widget page (iframe target)
app/api              route handlers, including stripe/webhook
public/embed.js      script that injects the embed iframe
lib/plans.ts         PLAN_LIMITS, the single source of plan numbers
lib/                 db client, auth helpers, validators (Zod), stripe helpers
prisma/              schema.prisma, migrations, seed.ts
docs/                PRD.md (requirements), data-model.md (schema design)
```

## Rules
1. **Ownership:** every dashboard query and mutation must be scoped by the signed-in
   owner (`ownerId` on spaces; testimonials through their space). Other owners' ids
   return 404.
2. **Plan limits are server-side.** Check limits in the route handler or server action
   using `lib/plans.ts`. Never rely on the UI alone. Free: 3 spaces, 100 testimonials
   per space. Pro: 25 spaces, 1,000 per space. Space limit reached returns 403;
   testimonial limit reached returns 409.
3. **Validate all input with Zod** on the server, including the public form.
4. **Public output never includes** customer emails or the consent flag. Public pages
   and the embed show only testimonials that are not hidden and have consent = true.
5. **Stripe:** the webhook is the source of truth for plan status, not the success
   redirect. Verify signatures and keep handlers idempotent (StripeEvent table).
6. **Render testimonial text as plain text.** Never use `dangerouslySetInnerHTML`
   for user content.
7. **No secrets in code or commits.** Use environment variables.
8. **Anti-spam on the public form:** honeypot field, rate limit per IP and per space,
   max testimonial text length 1,000 characters.
9. **Framing and CORS:** `/embed/[slug]` and `/embed.js` allow framing from any site
   and CORS, with ~60s caching. Every other route denies framing.
10. **Slugs are immutable.** Generated from the name (kebab-case, random suffix if
    taken) and never changed, so shared links never break.
11. Keep changes small and focused: one feature or fix per branch and commit.

## Workflow
For each feature: **plan, then implement, then verify.**
- Plan: list files you'll touch and wait for my approval.
- Implement: follow the PRD section; reuse existing helpers and components.
- Verify: run `npm run lint && npm run typecheck && npm test`, check the UI with
  Playwright where relevant, and report anything that does not match the PRD.
- Do not mark a task done until lint, typecheck, and tests pass.
- When finished, list what is done and what is not.

## Definition of Done
See PRD section 9 and the states table in section 5.9.
