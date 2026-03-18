# Feature Dossier Template (SSoT)

> Use this file as the canonical “one file per feature” format.  
> Rule: **Acceptance criteria text exists only here.** Everywhere else (issues/PRs) link to AC IDs.

## Frontmatter (required, machine-readable)

Copy this block and update values:

```yaml
---
id: F-0001
title: Password reset (email)
status: proposed            # proposed | shaped | planned | in_progress | done | parked
owners: ["@you"]
area: auth                  # short stable area tag (auth, billing, onboarding, ...)
depends_on: []              # list of F-IDs
impacts: [client, server, db]
created: 2026-03-04
updated: 2026-03-04
links:
  issue: ""                 # optional: tracker reference (e.g., GH-123)
  pr: []                    # list of PR URLs/IDs
  docs: []                  # extra docs if needed (should be rare)
---
```

## 1. Context & Goal

- **User problem:** Describe the user’s pain in 2–5 sentences.
- **Goal (what “success” means):** Describe observable outcomes.
- **Non-goals:** Explicitly list what is out of scope to prevent scope creep.

Example:
- User problem: Users forget passwords and can’t sign in.
- Success: A user can request a reset email, receive a time-limited token, and set a new password.
- Non-goals: Changing login UI flows beyond adding “Forgot password”.

## 2. Scope

### In scope
- Bullet list of deliverables (functional slices), not implementation tasks.

### Out of scope
- Bullet list.

### Constraints
- Hard constraints: security/compliance, existing auth provider, rate limits, etc.

## 3. Requirements & Acceptance Criteria (SSoT)

> Each AC must be **testable** and have a stable ID.  
> Use short, behavior-focused wording.

- **AC-F0001-01:** Requesting a reset for an existing account sends a reset email within 30 seconds.
- **AC-F0001-02:** Reset tokens are single-use and expire after 30 minutes.
- **AC-F0001-03:** Requesting a reset for a non-existing email returns a generic success response (no account enumeration).
- **AC-F0001-04:** Rate limiting prevents more than N reset requests per user per hour.

## 4. Non-functional requirements (NFR)

- **Security:** token entropy, storage, no enumeration, audit log events.
- **Reliability:** email retries, idempotency, failure modes.
- **Performance:** response times, DB indexes.
- **Observability:** metrics/logs/traces that confirm AC outcomes.

## 5. Design (compact)

### 5.1 API surface
- Endpoint(s), request/response DTOs, status codes, error cases.

### 5.2 Data model changes
- Tables/collections impacted; migration notes.

### 5.3 UI changes (if any)
- Minimal description; link to design assets if needed.

### 5.4 Edge cases
- Token reuse, concurrent requests, email delays, etc.

## 6. Slicing plan (2–6 increments)

> Each slice should produce something testable and should cite which AC IDs it covers.

### Slice SL-F0001-01: Token issuance + persistence
Covers: AC-F0001-02, AC-F0001-03

### Slice SL-F0001-02: Email sending pipeline
Covers: AC-F0001-01

### Slice SL-F0001-03: Rate limiting
Covers: AC-F0001-04

## 7. Task list (implementation units)

> Tasks must reference AC IDs or Slice IDs.  
> Do **not** restate AC text here.

- **T-F0001-01:** Add `POST /auth/password-reset/request` (Slice SL-F0001-01).
- **T-F0001-02:** Add token table + TTL index (Slice SL-F0001-01).
- **T-F0001-03:** Implement email sender integration (Slice SL-F0001-02).
- **T-F0001-04:** Add rate limiter + tests (Slice SL-F0001-03).

## 8. Test plan & Coverage map

> Contract: Every AC ID must appear in tests (test name or `// Covers: AC-...`).

| AC ID | Test reference | Status |
|---|---|---|
| AC-F0001-01 | `src/server/auth/passwordReset.test.ts` → `it("AC-F0001-01 ...")` | planned |
| AC-F0001-02 | `src/server/auth/passwordReset.test.ts` → `it("AC-F0001-02 ...")` | planned |
| AC-F0001-03 | `src/server/auth/passwordReset.test.ts` → `it("AC-F0001-03 ...")` | planned |
| AC-F0001-04 | `src/server/auth/passwordResetRateLimit.test.ts` → `it("AC-F0001-04 ...")` | planned |

## 9. Decision log (ADR blocks)

> Add only architecturally significant forks.

### ADR-F0001-01: Store reset tokens hashed
- Status: Proposed | Accepted | Superseded
- Context: Tokens are bearer secrets; DB compromise risk.
- Decision: Store only hashed tokens; compare by hashing presented token.
- Alternatives: Store raw tokens; store encrypted tokens.
- Consequences: Cannot resend same token; must issue new token.

## 10. Progress & links

- Status: proposed → shaped → planned → in_progress → done
- Issue: GH-123
- PRs:
  - PR-456 (Slice 1)
  - PR-457 (Slice 2)

## 11. Change log

> This is how you keep iterative changes traceable.

- **v1.0 (2026-03-04):** Initial dossier created (intake).
- **v1.1 (2026-03-05):** Added AC-F0001-04 rate limiting requirement after security review.
