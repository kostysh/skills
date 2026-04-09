---
id: F-0001
title: Password reset (email)
status: planned
coverage_gate: deferred
owners: ["@you"]
area: auth
depends_on: []
impacts: [client, server, db]
created: 2026-03-04
updated: 2026-03-04
links:
  issue: "GH-123"
  pr: []
  docs: []
---

# F-0001 Password reset (email)

## 1. Context & Goal

Users forget passwords and get locked out. We need a reset flow that is secure, observable, and testable.

**Success looks like:**
- A user can request a reset, receive an email, and set a new password.
- Tokens are short-lived, single-use, and never stored in plaintext.
- The flow is rate-limited.

**Non-goals:**
- Changing the full sign-in UX beyond adding reset entry points.
- Supporting SMS reset.

**Current substrate / baseline:**
- Node.js backend with `node:test`.
- Existing transactional email adapter and user identity store are already available.

### Terms & thresholds
- `reset request`: starts when the API accepts the request and ends when the email job is handed off.
- `within 30 seconds`: measured from accepted request to queue handoff.

## 2. Scope

### In scope
- Reset request endpoint
- Token persistence + expiry
- Email dispatch integration
- Password update endpoint
- Rate limiting + audit events

### Out of scope
- SMS reset
- Account recovery for users without email access

### Constraints
- Generic success response must prevent account enumeration.
- Runtime must stay on the existing Node.js auth service path.

### Assumptions
- Existing email adapter retries delivery after accepted queue handoff.

### Open questions
- None at planning time.

## 3. Requirements & Acceptance Criteria (SSoT)

- **AC-F0001-01:** Requesting a reset for an existing account sends a reset email within 30 seconds.
- **AC-F0001-02:** Requesting a reset for a non-existing email returns a generic success response.
- **AC-F0001-03:** Issued reset tokens expire after 30 minutes.
- **AC-F0001-04:** A reset token can be used successfully at most once.
- **AC-F0001-05:** Rate limiting prevents more than 5 reset requests per account per hour.

## 4. NFR

- Security: generic success responses prevent enumeration; audit event `auth.password_reset.requested` is emitted for every accepted request.
- Reliability: duplicate request submissions are safe to retry; confirm flow remains single-use under concurrent submits.
- Performance: reset request handoff to the email queue completes within 30 seconds.
- Observability: metric `auth.password_reset.requested`, metric `auth.password_reset.completed`, and an audit log entry for every accepted request.

## 5. Design (compact)

### 5.1 API
- Boundary trigger: inline contract is required because this feature adds HTTP endpoints.
- `POST /auth/password-reset/request`
  - body: `{ email: string }`
  - response: `{ ok: true }` always
  - error model: malformed payload returns validation error; accepted requests remain generic regardless of account existence
  - retry/idempotency: duplicate requests are safe; rate limit still applies
- `POST /auth/password-reset/confirm`
  - body: `{ token: string, newPassword: string }`
  - response: `{ ok: true }` or `{ ok: false, code: "INVALID_TOKEN" | "EXPIRED_TOKEN" | "TOKEN_ALREADY_USED" }`
  - retry/idempotency: confirm is not idempotent; a previously successful confirm must not succeed again

### 5.2 Runtime / deployment surface
- Runs on the existing auth API process.
- Uses the existing email adapter queue and audit log pipeline.

### 5.3 Data model changes
Table: `password_reset_tokens`
- `id` (uuid)
- `user_id`
- `token_hash`
- `expires_at`
- `used_at` nullable
Indexes: `(user_id, expires_at)`, `(token_hash)` unique
Invariants:
- `token_hash` remains unique.
- A token transitions from unused to used at most once.

### 5.4 Edge cases and failure modes
- Invalid email payload: reject with validation error before any side effects.
- Token replay: reject if `used_at` is already set.
- Expired token: reject.
- Concurrent confirm: atomic update where `used_at IS NULL`.
- Email adapter timeout: request remains generic and auditable.
- Duplicate reset request: safe to retry; downstream rate limit still enforces the hourly ceiling.

### 5.5 Verification surface / initial verification plan
- AC-F0001-01: integration + smoke.
- AC-F0001-02: integration.
- AC-F0001-03, AC-F0001-04: integration.
- AC-F0001-05: unit + integration.

### 5.6 Representation upgrades
- No decision table is needed; validation logic has one primary condition group.
- No full state table is needed; token lifecycle has one critical guard: `used_at IS NULL`.

### 5.7 Definition of Done
- All ACs have proof paths in tests or smoke checks.
- Reset request remains generic for both existing and unknown accounts.
- Token lifecycle invariants are enforced under expiry and concurrent confirm.
- Operators can verify request volume and completion via metrics/audit logs.

## 6. Slicing plan

Slices are forecast increments ordered prerequisite-first and risk-first.

### Slice SL-F0001-01: token issuance + persistence
Covers: AC-F0001-02, AC-F0001-03
Verification: integration
Assumes: the existing auth storage seam can persist single-use token metadata without a wider schema split.
Fallback: keep issuance on the existing auth path until storage invariants are confirmed.

### Slice SL-F0001-02: email dispatch
Covers: AC-F0001-01
Verification: integration, smoke
Assumes: the existing email adapter accepts queue handoff from the auth service.
Fallback: keep the reset request generic and emit an audit signal if queue handoff fails.

### Slice SL-F0001-03: confirm endpoint + password update
Covers: AC-F0001-04
Verification: integration

### Slice SL-F0001-04: rate limiting + audit
Covers: AC-F0001-05
Verification: unit, integration

## 7. Tasks

- **T-F0001-01:** Add request endpoint (SL-F0001-01).
- **T-F0001-02:** Add DB migration + indexes (SL-F0001-01).
- **T-F0001-03:** Implement email sender adapter integration (SL-F0001-02).
- **T-F0001-04:** Add confirm endpoint (SL-F0001-03).
- **T-F0001-05:** Implement rate limiting (SL-F0001-04).
- **T-F0001-06:** Add `node:test` coverage for all ACs.

## 8. Test plan & Coverage map

| AC ID | Test reference | Status |
|---|---|---|
| AC-F0001-01 | `src/server/auth/passwordReset.test.ts` → `it("AC-F0001-01 sends reset email for existing account", ...)` | planned |
| AC-F0001-02 | `src/server/auth/passwordReset.test.ts` → `it("AC-F0001-02 request is generic for unknown email", ...)` | planned |
| AC-F0001-03 | `src/server/auth/passwordReset.test.ts` → `it("AC-F0001-03 tokens expire after 30 minutes", ...)` | planned |
| AC-F0001-04 | `src/server/auth/passwordReset.test.ts` → `it("AC-F0001-04 confirm rejects token replay", ...)` | planned |
| AC-F0001-05 | `src/server/auth/passwordResetRateLimit.test.ts` → `it("AC-F0001-05 rate limits reset requests", ...)` | planned |

## 9. Decision log

### ADR-F0001-01: Store reset tokens hashed
- Status: Accepted
- Date: 2026-03-04
- Context: Tokens are bearer secrets; DB compromise must not reveal usable tokens.
- Decision: Store only `token_hash` and compare using constant-time compare.
- Consequences: Cannot resend the same token; must issue a new token.

## 10. Progress & links

- Issue: GH-123
- PRs: (none yet)
- Process artifacts: not created yet in this example repo.

## 11. Change log

- **v1.0 (2026-03-04):** Intake + compact spec + slicing plan.
- **v1.1 (2026-03-05) [risk discovery]:** Added explicit fallback notes for delivery-risk slices.
