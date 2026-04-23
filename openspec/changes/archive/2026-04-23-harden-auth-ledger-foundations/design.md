## Context

The current app has a working request-time auth gate in `src/proxy.ts`, but its
server-side fallback still throws `Error('Unauthorized')`, which would surface a
500 instead of returning the user to `/login`. The review also correctly
identified direct string comparison in session-token verification, missing unit
tests for business rules, and request-time schema creation in `src/lib/ledger.ts`.

Two review items do not hold for this repo as written:

- Finding 1 assumes pre-Next.js 16 middleware naming. The bundled docs at
  `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` state
  that Middleware is now called Proxy and `proxy.ts` is the supported file
  convention. A fresh `pnpm build` in this repo reports `Proxy (Middleware)`,
  which confirms that `src/proxy.ts` is registered.
- Finding 7 assumes `initialLedger` is permanently stale after
  `router.refresh()`. Next.js 16 docs for `router.refresh()` state that the
  router makes a new request, re-renders Server Components, and merges the
  updated payload into the client tree. This app also calls `revalidatePath('/')`
  after successful mutations. There is no current repro that justifies a spec
  change here.

Current flow:

```text
request
  -> src/proxy.ts
     -> optimistic redirect to /login or /
  -> app/page.tsx or server action
     -> requireAuthenticatedSession()
        -> must redirect to /login on invalid session
  -> ledger data access
     -> must rely on migrated schema, not request-time DDL
```

## Goals / Non-Goals

**Goals:**

- Keep request-time auth checks compatible with Next.js 16.
- Make server-render and server-action auth failure return users to `/login`
  instead of generating generic server errors.
- Remove timing-sensitive direct comparisons from passcode and session-token
  validation.
- Restore the constitution's unit-test expectations for money logic and session
  handling.
- Make database schema creation explicit, versioned, and deploy-time driven.

**Non-Goals:**

- Replacing the simple shared-passcode model with a third-party auth provider.
- Redesigning the ledger UI or changing expense/settlement behavior.
- Introducing a full ORM if a lighter migration approach satisfies the needs.
- Refactoring client-side ledger refresh behavior without a reproducible defect.

## Decisions

### 1. Keep the Next.js 16 proxy entrypoint

The refactor will preserve `src/proxy.ts` and treat it as the request-time
auth gate. The implementation should verify behavior with `pnpm build` and
runtime redirects, not by renaming files to `middleware.ts`.

Alternative considered: rename the file to `middleware.ts`.
Rejected because it follows stale guidance and conflicts with the Next.js 16
docs bundled in this repo.

### 2. Make render-time auth the authoritative fallback

`src/proxy.ts` stays as the optimistic guard that prevents unauthenticated page
loads early, but `requireAuthenticatedSession()` becomes the authoritative
server-side fallback. Missing, expired, or invalid sessions must redirect to
`/login` anywhere the helper is used.

Alternative considered: keep throwing and rely on error boundaries.
Rejected because the desired user outcome is re-authentication, not an error UI.

### 3. Centralize timing-safe comparison semantics

Passcode comparison in `src/app/login/actions.ts` and signature comparison in
`src/lib/session-token.ts` should share the same security rule: invalid inputs
fail closed without unhandled exceptions and without direct equality checks that
short-circuit on the first mismatch.

Alternative considered: patch each comparison ad hoc.
Rejected because it duplicates security-sensitive logic and makes regressions
more likely.

### 4. Use lightweight versioned SQL migrations

The current data layer already uses raw Neon SQL, so the least disruptive path
is to extract the existing DDL into reviewed SQL migration files plus a small
migration runner and npm script. This satisfies the constitution without
introducing Prisma or duplicating the schema in another abstraction.

Alternative considered: keep `CREATE TABLE IF NOT EXISTS` in request handling.
Rejected because it hides schema state in runtime code and performs DDL on first
request for each cold instance.

Alternative considered: adopt Prisma migrations.
Rejected for now because the migration requirement can be met without expanding
the stack surface area.

### 5. Treat finding 7 as a non-spec item until reproduced

The current spec will not require a client-state refactor for
`canUndoLastSettlement`. If the team later reproduces stale undo state after a
refresh, that can become a separate change with a concrete failing scenario.

## Risks / Trade-offs

- Build-time or deploy-time migrations require `DATABASE_URL` to be available in
  the environment that runs the migration command.
  Mitigation: document the requirement and fail fast when the variable is
  missing.
- Removing runtime DDL means an uninitialized local database will fail until the
  migration command is run.
  Mitigation: add `pnpm db:migrate` to setup/deploy docs and verify it on an
  empty database.
- Timing-safe comparison helpers can throw if implemented with unequal buffer
  lengths.
  Mitigation: add malformed-input tests and require helpers to fail closed.
- Turbopack's middleware manifest is empty in this repo even when the proxy is
  registered.
  Mitigation: use build output and observed redirect behavior as the acceptance
  check instead of the manifest heuristic from the review.

## Migration Plan

1. Capture the current `expenses` and `settlements` DDL in an initial versioned
   migration.
2. Add a migration runner and a `pnpm db:migrate` script.
3. Run the migration command before removing request-time schema bootstrap code.
4. Wire the migration command into the release workflow used by Vercel or the
   build pipeline that prepares deployments.
5. Roll back code independently from schema creation if needed; the initial
   migration should be additive and idempotent rather than destructive.

## Open Questions

- Should `pnpm db:migrate` run in the Vercel build command or as a distinct
  pre-deploy step in the release workflow?
- Should the timing-safe comparison behavior live in a shared utility module or
  stay inside the auth/session modules with duplicated wrappers?
- Do we want an integration test for the migration runner in this change, or is
  unit coverage plus manual migration verification sufficient for the first cut?
