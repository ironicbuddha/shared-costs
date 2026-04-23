## 1. Auth hardening

- [x] 1.1 Update `requireAuthenticatedSession()` so invalid sessions redirect to
      `/login` in server components and server actions.
- [x] 1.2 Keep request-time auth in `src/proxy.ts` and verify unauthenticated
      `/` requests and authenticated `/login` requests still redirect correctly.
- [x] 1.3 Introduce timing-safe comparison behavior for passcode and
      session-token checks, including malformed and length-mismatched input cases.

## 2. Persistence lifecycle

- [x] 2.1 Extract the current ledger DDL into reviewed, versioned SQL migration
      files.
- [x] 2.2 Add a migration runner and `pnpm db:migrate` script for local and
      deployment use.
- [x] 2.3 Remove request-time schema bootstrap logic from `src/lib/ledger.ts`
      once migrations are authoritative.

## 3. Test gates

- [x] 3.1 Add unit tests for `roundCurrency`, `validateExpenseInput`, and
      `getSettlement` covering zero balance, both debtor directions, and full-share
      boundaries.
- [x] 3.2 Add unit tests for session-token creation and validation, including
      success, expiry, malformed input, and tampering cases.
- [x] 3.3 Remove `--passWithNoTests` from the default `pnpm test` script so the
      quality gate fails when tests are missing.

## 4. Verification and docs

- [x] 4.1 Update local setup and deployment notes to document the migration
      workflow and test expectations.
- [x] 4.2 Run `pnpm test` and `pnpm build` to verify the refactor after the
      implementation tasks are complete.
