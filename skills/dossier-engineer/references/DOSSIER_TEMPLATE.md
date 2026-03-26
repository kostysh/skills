# Feature Dossier Template (SSoT)

> Use this file as the canonical “one file per feature” format.  
> Rule: **Acceptance criteria text exists only here.** Everywhere else links to AC IDs.

## Frontmatter (required, machine-readable)

Copy this block and update values:

```yaml
---
id: F-0001
title: Password reset (email)
status: proposed            # proposed | shaped | planned | in_progress | done | parked
coverage_gate: deferred     # deferred | strict
owners: ["@you"]
area: auth
depends_on: []
impacts: [client, server, db]
created: 2026-03-04
updated: 2026-03-04
links:
  issue: ""
  pr: []
  docs: []
---
```

Notes:

- `status` tracks **workflow maturity**.
- `coverage_gate` tracks **coverage enforcement strictness**.
- Default policy is usually `deferred` for `proposed|shaped|planned` and `strict` for `in_progress|done`, unless repo overlays say otherwise.

## 1. Context & Goal

- **User problem:** Describe the user’s pain in 2–5 sentences.
- **Goal:** Describe observable outcomes.
- **Non-goals:** List what is explicitly out of scope.
- **Current substrate / baseline:** Record which runtime, deployment, data, or platform seams are assumed to already exist.

## 2. Scope

### In scope
- Deliverables, not implementation tasks.

### Out of scope
- Explicit exclusions.

### Constraints
- Security, compliance, deployment, compatibility, operational, or repo-overlay constraints.

## 3. Requirements & Acceptance Criteria (SSoT)

> Each AC must be **testable** and have a stable ID.

- **AC-F0001-01:** Requesting a reset for an existing account sends a reset email within 30 seconds.
- **AC-F0001-02:** Reset tokens are single-use and expire after 30 minutes.
- **AC-F0001-03:** Requesting a reset for a non-existing email returns a generic success response.
- **AC-F0001-04:** Rate limiting prevents more than N reset requests per account per hour.

## 4. Non-functional requirements (NFR)

- **Security:** token entropy, storage, anti-enumeration, audit log events.
- **Reliability:** retries, idempotency, compensation/rollback expectations.
- **Performance:** response-time budgets, queueing budgets, indexing assumptions.
- **Observability:** metrics/logs/traces that confirm AC outcomes.

## 5. Design (compact)

### 5.1 API surface
- Routes, DTOs, status codes, error cases.

### 5.2 Runtime / deployment surface
- Entrypoints, services, workers, jobs, containers, startup assumptions, env contract.

### 5.3 Data model changes
- Tables/collections impacted; migration notes.

### 5.4 Edge cases and failure modes
- Retries, timeouts, duplicate delivery, cancellation, partial side effects, crash/restart boundaries.

### 5.5 Verification surface
- Unit, integration, smoke, manual/operator, or migration verification paths.

## 6. Slicing plan (2–6 increments)

> Each slice should produce something testable and cite the AC IDs it covers.

### Slice SL-F0001-01: Token issuance + persistence
Covers: AC-F0001-02, AC-F0001-03
Verification: integration

### Slice SL-F0001-02: Email sending pipeline
Covers: AC-F0001-01
Verification: integration, smoke

### Slice SL-F0001-03: Rate limiting
Covers: AC-F0001-04
Verification: unit, integration

## 7. Task list (implementation units)

> Tasks reference AC IDs or Slice IDs. Do **not** restate AC text here.

- **T-F0001-01:** Add `POST /auth/password-reset/request` (SL-F0001-01).
- **T-F0001-02:** Add token storage + expiry handling (SL-F0001-01).
- **T-F0001-03:** Implement email sender integration (SL-F0001-02).
- **T-F0001-04:** Add rate limiter + verification (SL-F0001-03).

## 8. Test plan & Coverage map

> Contract: Every AC ID must appear in tests or a `// Covers:` comment.

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
- Date: YYYY-MM-DD
- Context: Tokens are bearer secrets; DB compromise risk exists.
- Decision: Store only hashed tokens.
- Alternatives: Store raw tokens; store encrypted tokens.
- Consequences: Cannot resend the same token; must issue a new one.

## 10. Progress & links

- Status progression: `proposed -> shaped -> planned -> in_progress -> done`
- Issue: GH-123
- PRs:
  - PR-456 (Slice 1)
  - PR-457 (Slice 2)
- Optional process artifacts:
  - `.dossier/verification/<feature>/...`
  - `.dossier/reviews/<feature>/...`
  - `.dossier/steps/<feature>/...`

## 11. Change log

- **v1.0 (2026-03-04):** Initial dossier created.
- **v1.1 (2026-03-05):** Added rate-limiting requirement after security review.
