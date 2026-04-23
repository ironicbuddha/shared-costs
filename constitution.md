# shared-costs Constitution

This repo is a simple shared-expense tracker built as a Next.js app with a Neon
Postgres backend and Vercel deployment.

## Project Profile

- Project type: `web-app`
- Primary language: `TypeScript`
- Frontend stack: `Next.js`
- Backend shape: `Next.js server actions/routes + Neon Postgres`
- Package manager: `pnpm`
- Deployment target: `Vercel`
- Data sensitivity: `moderate`
- Runtime versions: `Node 22.x`

## Core Standards

### Code And Dependencies

- TypeScript runs in strict mode.
- Use one package manager and one lockfile: `pnpm` and `pnpm-lock.yaml`.
- Keep database access server-side; never expose Neon credentials to client
  bundles.
- Validate request, form, and database boundaries explicitly before persisting
  shared-expense data.
- Document major architectural decisions when they affect persistence, auth,
  permissions, or deployment.

### Testing

- Business rules for balances, settlements, and participant shares get unit
  tests.
- Neon/database boundaries get integration coverage once schema and migrations
  exist.
- Critical flows such as adding an expense and viewing balances get smoke or
  end-to-end coverage before production use.
- Behavior changes ship with test changes.

### Deployment And Release

- Local development setup stays documented in `README.md`.
- Environment variables are documented in `.env.example`; secrets live in Neon,
  Vercel, or 1Password, never in Git.
- Database migrations must be versioned and reviewed before production deploys.
- Release path: preview deploys for pull requests, production deploys from the
  main release branch.

### Security And Operations

- Logs must not leak connection strings, tokens, or sensitive personal expense
  details.
- Production database access uses least privilege where Neon roles allow it.
- User-facing failures should be observable through Vercel logs and future error
  tracking.

## Delivery Gates

Pull requests should not merge unless these pass:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm format:check`

Deployable changes also require a Vercel preview and migration validation when
database schema changes are involved.

## Versioning

- Version: `0.1.0`
- Ratified: `2026-04-23`
- Last amended: `2026-04-23`
