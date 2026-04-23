# shared-costs

A simple Next.js app for tracking shared expenses, backed by Neon Postgres and
deployed on Vercel.

## Stack

- Next.js App Router with TypeScript
- Tailwind CSS
- Neon Postgres via `@neondatabase/serverless`
- Vercel for previews and production deploys
- pnpm for package management

## Local Setup

```bash
pnpm install
cp .env.example .env.local
pnpm db:migrate
pnpm dev
```

Set `DATABASE_URL` in `.env.local` to the pooled Neon connection string for the
development database.

If available, set `DATABASE_URL_UNPOOLED` to the direct Neon connection string
for migrations and admin tasks. The migration runner prefers
`DATABASE_URL_UNPOOLED` and falls back to `DATABASE_URL`.

Set `SHARED_COSTS_PASSWORD` to the shared passcode you want Carlo and Warren to
use, and set `SHARED_COSTS_SESSION_SECRET` to a long random secret used to sign
session cookies.

## Database Migrations

Ledger schema changes now live in `db/migrations/` and are applied with:

```bash
pnpm db:migrate
```

Run this before `pnpm dev` against a fresh local database, and before deploying
code that depends on a new schema version.

## Quality Gates

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm format:check
```

## E2E Tests

Playwright is wired in as the browser test runner for smoke coverage.

```bash
pnpm test:e2e:install
pnpm test:e2e
```

The Playwright config starts `pnpm dev` automatically, supplies fallback auth
secrets for the login flow, and currently covers the protected-route redirect
plus the login screen. If you want authenticated or database-backed flows, keep
your `.env.local` populated so the app can reuse the real local settings.

## Deploy

Create a Vercel project for this repo and add `DATABASE_URL`,
`DATABASE_URL_UNPOOLED`, `SHARED_COSTS_PASSWORD`, and
`SHARED_COSTS_SESSION_SECRET` in Vercel so production access is gated and
migrations can use the direct database connection. Use Vercel preview
deployments for pull requests and production deployments from the main release
branch.

Make sure migrations run before the app handles traffic. A simple Vercel setup
is to use:

```bash
pnpm db:migrate && pnpm build
```

as the build command, or run `pnpm db:migrate` in an equivalent pre-deploy step.
