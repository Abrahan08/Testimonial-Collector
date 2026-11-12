# Testimonial-Collector

Minimal freemium testimonial SaaS. Requirements live in `docs/PRD.md`;
the schema design is in `docs/data-model.md`.

## Stack

Next.js (App Router) + TypeScript (strict), Tailwind CSS + shadcn/ui,
PostgreSQL on Neon + Prisma 7 (`@prisma/adapter-pg` driver adapter), Zod, Vitest.

## Setup

Requires Node.js 20.9+ and npm.

### 1. Create a free Neon database

1. Sign up at <https://neon.tech> (the free tier is enough).
2. Click **New Project**, give it a name, pick the region closest to you, and create it.
3. On the project dashboard click **Connect**.
4. Turn **Connection pooling off** so you get the *direct* connection string
   (its host does **not** contain `-pooler`). Prisma migrations need the direct one.
5. Copy the string. It looks like
   `postgresql://USER:PASSWORD@ep-xxxx.REGION.aws.neon.tech/neondb?sslmode=require`.

### 2. Configure environment

```bash
cp .env.example .env
```

Paste the Neon string into `DATABASE_URL` in `.env`. Never commit `.env`.
The other variables (auth, Stripe) are not needed until those features exist.

### 3. Install and run

```bash
npm install            # also runs `prisma generate` (needs DATABASE_URL in .env)
npm run dev            # http://localhost:3000
```

No migrations have been created yet. When the schema is ready, run
`npx prisma migrate dev --name init` to create and apply the first one.

## Scripts

| Command             | What it does                        |
| ------------------- | ----------------------------------- |
| `npm run dev`       | Start the dev server                |
| `npm run build`     | Production build                    |
| `npm run lint`      | ESLint                              |
| `npm run typecheck` | `tsc --noEmit`                      |
| `npm test`          | Vitest unit tests                   |
| `npx prisma studio` | Browse the database                 |
