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
pnpm dev
```

Set `DATABASE_URL` in `.env.local` to the pooled Neon connection string for the
development database.

Set `SHARED_COSTS_PASSWORD` to the shared passcode you want Carlo and Warren to
use, and set `SHARED_COSTS_SESSION_SECRET` to a long random secret used to sign
session cookies.

## Quality Gates

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

## Deploy

Create a Vercel project for this repo and add the same `DATABASE_URL` secret in
Vercel environment variables. Also add `SHARED_COSTS_PASSWORD` and
`SHARED_COSTS_SESSION_SECRET` in Vercel so production access is gated. Use
Vercel preview deployments for pull requests and production deployments from the
main release branch.
