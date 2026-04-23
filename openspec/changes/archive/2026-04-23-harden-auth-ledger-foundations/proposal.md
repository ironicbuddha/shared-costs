## Why

The review surfaced real hardening gaps in auth fallback behavior, secret
comparison, test coverage, and schema lifecycle management. It also included
outdated framework advice for this Next.js 16 codebase, so the refactor needs a
spec that captures the valid issues and rejects incorrect remediation before any
implementation starts.

## What Changes

- Preserve request-time auth gating through the framework-supported Next.js 16
  proxy entrypoint instead of renaming `src/proxy.ts` to `middleware.ts`.
- Change server-render and server-action auth fallback behavior from unhandled
  errors to redirects to `/login`.
- Replace direct or early-return secret comparisons with timing-safe comparison
  behavior for both session tokens and the shared passcode.
- Add unit coverage for shared-cost business rules and session-token helpers,
  and make the default `pnpm test` quality gate fail when no tests are found.
- Move ledger schema creation out of request handling into reviewed, versioned
  migrations that run before runtime.
- Record which review findings are accepted and which are rejected so the
  implementation follows current framework behavior rather than stale advice.

## Capabilities

### New Capabilities

- `ledger-foundations-hardening`: Hardens authenticated access, secure secret
  verification, migration-based schema lifecycle, and mandatory unit-test
  coverage for the ledger's core rules.

### Modified Capabilities

- None.

## Impact

- Affected code: `src/proxy.ts`, `src/lib/auth.ts`, `src/lib/session-token.ts`,
  `src/app/login/actions.ts`, `src/lib/ledger.ts`, `src/lib/shared-costs.ts`,
  `src/app/actions.ts`
- New artifacts: unit test files, SQL migration files, migration runner/script
- Tooling and deploy flow: `pnpm test`, migration execution in local and Vercel
  environments, README/deployment notes
- Verification: `pnpm test`, `pnpm build`, migration execution against an empty
  and already-initialized database
