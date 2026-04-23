## ADDED Requirements

### Requirement: Protected ledger access redirects to login

The system MUST redirect unauthenticated access to protected ledger routes to
`/login`. Request-time proxy checks MAY perform the optimistic redirect, but
render-time and server-action checks MUST also redirect to `/login` instead of
surfacing an unhandled server error.

#### Scenario: Unauthenticated request for the ledger

- **WHEN** a user without a valid session requests `/`
- **THEN** the system redirects the user to `/login` before protected ledger
  content is shown

#### Scenario: Invalid session during server-side execution

- **WHEN** a server component or server action calls the auth fallback with a
  missing, expired, or invalid session
- **THEN** the system redirects the user to `/login`

#### Scenario: Authenticated user requests the login page

- **WHEN** a user with a valid session requests `/login`
- **THEN** the system redirects the user to `/`

### Requirement: Secret verification uses timing-safe comparison

The system MUST use timing-safe comparison semantics for shared-passcode
verification and session-token signature verification. Malformed, tampered, or
length-mismatched inputs MUST be rejected without throwing an unhandled
exception.

#### Scenario: Invalid passcode fails closed

- **WHEN** a user submits an incorrect passcode, including one with a different
  byte length than the stored passcode
- **THEN** authentication fails without an unhandled exception and the user is
  not granted a session

#### Scenario: Tampered session token fails closed

- **WHEN** session-token validation receives a tampered or malformed token
- **THEN** validation returns a failed authentication result without granting
  access or throwing an unhandled exception

### Requirement: Core ledger rules are covered by unit tests

The system MUST maintain unit tests for core settlement, validation, rounding,
and session-token behavior. The default `pnpm test` command MUST fail if no
matching test files are present.

#### Scenario: Settlement rules are covered

- **WHEN** the unit test suite runs
- **THEN** it covers zero balance, Carlo owing Warren, Warren owing Carlo, and
  a 100 percent allocation to one participant for settlement calculation

#### Scenario: Expense validation boundaries are covered

- **WHEN** the unit test suite runs
- **THEN** it covers valid input, missing title, zero amount, `carloShare`
  greater than `amount`, and `carloShare` equal to `amount`

#### Scenario: Session token rules are covered

- **WHEN** the unit test suite runs
- **THEN** it covers token creation, valid token acceptance, expired token
  rejection, malformed token rejection, and signature tampering rejection

#### Scenario: Missing tests fail the quality gate

- **WHEN** `pnpm test` runs without any discovered test files
- **THEN** the command exits with a non-zero status

### Requirement: Ledger schema is managed by reviewed migrations

The system MUST create and evolve ledger tables through reviewed, versioned
migrations that run before normal request handling. Ledger reads and writes MUST
NOT execute schema-creation DDL as part of request processing.

#### Scenario: Migration command initializes an empty database

- **WHEN** the migration command runs against an empty database
- **THEN** it creates the required ledger schema and records applied migration
  state

#### Scenario: Migration command is safe to re-run

- **WHEN** the migration command runs against a database that already has the
  applied migrations
- **THEN** it applies only pending migrations and leaves the existing schema
  intact

#### Scenario: Runtime ledger operations avoid DDL

- **WHEN** the application reads or mutates ledger data during a request
- **THEN** it uses the existing schema without issuing `CREATE TABLE` statements
  in the request path
