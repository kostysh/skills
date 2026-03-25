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

## 3. Requirements & Acceptance Criteria (SSoT)

- **AC-F0001-01:** Requesting a reset for an existing account sends a reset email within 30 seconds.
- **AC-F0001-02:** Reset tokens are single-use and expire after 30 minutes.
- **AC-F0001-03:** Requesting a reset for a non-existing email returns a generic success response.
- **AC-F0001-04:** Rate limiting prevents more than 5 reset requests per account per hour.

## 4. NFR

- Security: no enumeration, hashed tokens, audit log for reset requests.
- Reliability: email retries and idempotent request handler.
- Observability: metric `auth.password_reset.requested` and `auth.password_reset.completed`.

## 5. Design (compact)

### 5.1 API
- `POST /auth/password-reset/request`
  - body: `{ email: string }`
  - response: `{ ok: true }` always
- `POST /auth/password-reset/confirm`
  - body: `{ token: string, newPassword: string }`
  - response: `{ ok: true }` or `{ ok: false, code: "INVALID_TOKEN" }`

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

### 5.4 Edge cases and failure modes
- Token replay: reject if `used_at` is already set.
- Expired token: reject.
- Concurrent confirm: atomic update where `used_at IS NULL`.
- Email adapter timeout: request remains generic and auditable.

### 5.5 Verification surface
- Unit tests for token expiry and rate limiting.
- Integration tests for request/confirm flow.
- Smoke verification for email adapter wiring.

## 6. Slicing plan

### Slice SL-F0001-01: token issuance + persistence
Covers: AC-F0001-02, AC-F0001-03
Verification: integration

### Slice SL-F0001-02: email dispatch
Covers: AC-F0001-01
Verification: integration, smoke

### Slice SL-F0001-03: confirm endpoint + password update
Covers: AC-F0001-02
Verification: integration

### Slice SL-F0001-04: rate limiting + audit
Covers: AC-F0001-04
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
| AC-F0001-02 | `src/server/auth/passwordReset.test.ts` → `it("AC-F0001-02 tokens are single-use and expire", ...)` | planned |
| AC-F0001-03 | `src/server/auth/passwordReset.test.ts` → `it("AC-F0001-03 request is generic for unknown email", ...)` | planned |
| AC-F0001-04 | `src/server/auth/passwordResetRateLimit.test.ts` → `it("AC-F0001-04 rate limits reset requests", ...)` | planned |

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
