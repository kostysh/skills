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
- Slices and tasks are **forecast by default**. Commitment usually lives in ACs, Definition of Done, verification/coverage gates, and explicit rollout constraints.

## 1. Context & Goal

- **User problem:** Describe the user’s pain in 2–5 sentences.
- **Goal:** Describe observable outcomes.
- **Non-goals:** List what is explicitly out of scope.
- **Current substrate / baseline:** Record which runtime, deployment, data, or platform seams are assumed to already exist.

### Terms & thresholds (optional, max 3–5 bullets)

> Add this only when the feature introduces new roles, states, statuses, or time/size limits that could be read in more than one way.
> Example:

- `reset request`: starts when the API accepts the request and ends when the email job is handed off.
- `within 30 seconds`: measured from accepted request to queue handoff.

## 2. Scope

### In scope
- Deliverables, not implementation tasks.

### Out of scope
- Explicit exclusions.

### Constraints
- Security, compliance, deployment, compatibility, operational, or repo-overlay constraints.

### Assumptions (optional)
- Existing substrate or external-system behavior that this dossier relies on.

### Open questions (optional)
- Unresolved items with an owner/date, `needed_by: before_planned|before_implementation|before_done`, and an explicit next decision path.
- `needed_by: before_planned` blocks promotion to `status: planned`.

## 3. Requirements & Acceptance Criteria (SSoT)

> Each AC must be **testable**, **atomic**, and have a stable ID.
> One AC = one obligation. If one sentence carries multiple independent outcomes, split it.
> Prefer behavior and externally visible effects over mechanism.
> Example ACs:

- **AC-F0001-01:** Requesting a reset for an existing account sends a reset email within 30 seconds.
- **AC-F0001-02:** Requesting a reset for a non-existing email returns a generic success response.
- **AC-F0001-03:** Issued reset tokens expire after 30 minutes.
- **AC-F0001-04:** A reset token can be used successfully at most once.
- **AC-F0001-05:** Rate limiting prevents more than N reset requests per account per hour.

## 4. Non-functional requirements (NFR)

> Keep only NFRs that materially constrain design or block `done`.
> Each normative NFR should include a metric, budget/threshold, or explicit observable signal.
> Example NFRs:

- **Security:** Reset request responses never reveal account existence; audit event `auth.password_reset.requested` is emitted for every accepted request.
- **Reliability:** Duplicate request submissions are safe to retry; confirm flow remains single-use under concurrent submits.
- **Performance:** Reset request handoff to the email queue completes within 30 seconds.
- **Observability:** Metrics/logs/traces exist that let an operator confirm AC outcomes.

## 5. Design (compact)

### 5.1 API surface
- Trigger: if the feature changes a request, response, event, webhook, or external payload, include an inline contract sketch or a link to the canonical contract/schema/OpenAPI/protocol.
- Routes, DTOs, status codes, error model, and backward-compat notes when relevant.
- Retry/idempotency or duplicate-delivery semantics when the operation can be repeated.

### 5.2 Runtime / deployment surface
- Entrypoints, services, workers, jobs, containers, startup assumptions, env contract.

### 5.3 Data model changes
- Tables/collections impacted; invariants and migration notes when relevant.

### 5.4 Edge cases and failure modes
- Invalid input, retries, timeouts, duplicate delivery, cancellation, partial side effects, crash/restart boundaries.

### 5.5 Verification surface / initial verification plan
- For each AC or AC group, name the proof type: unit, integration, smoke, manual/operator, or migration.

### 5.6 Representation upgrades (triggered only when needed)
- Add a decision table/list when a rule has 2+ independent conditions.
- Add a state list/table when the feature has named states, transitions, or guards.
- Add a schema/contract snippet or link when DTOs/events/requests/responses cross a boundary.

### 5.7 Definition of Done
- Delivered behavior, proof artifacts, and operational signals required before the implementation step can claim closure.

### 5.8 Rollout / activation note (triggered only when needed)
- Add this only when migration, feature flag, cutover, backfill, user-visible activation order, or irreversible side effects make release order matter.
- Record activation order, rollback limits, and any “must happen before/after” steps.

## 6. Slicing plan (2–6 increments)

> Treat slices/tasks as forecast, not commitment.
> Order slices prerequisite-first and risk-first.
> Each slice should produce something testable and cite the AC IDs it covers.
> Each slice should be small enough to verify and review in one coherent increment.
> Add `Depends on`, `Assumes`, `Fallback`, and `Approval path` only when triggered.
> Example slices:

### Slice SL-F0001-01: Token issuance + persistence
Covers: AC-F0001-02, AC-F0001-03
Verification: integration
Assumes: existing auth storage can persist single-use token metadata without schema fan-out.
Fallback: keep token issuance behind the existing auth service path until the storage seam is confirmed.

### Slice SL-F0001-02: Email sending pipeline
Covers: AC-F0001-01
Verification: integration, smoke
Assumes: existing email adapter accepts queue handoff from the auth service.
Fallback: keep the request response generic and emit an audit signal if queue handoff fails.

### Slice SL-F0001-03: Rate limiting
Covers: AC-F0001-04
Verification: unit, integration

Optional slice notes when triggered:
- `Depends on:` another dossier, external team, or shared subsystem, plus owner and unblock condition.
- `Assumes:` a high-risk assumption the slice relies on.
- `Fallback:` what happens if that assumption fails.
- `Approval path:` repo ADR, architecture update, owner sign-off, or linked follow-up for shared runtime/contract/migration surfaces.

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

- Use short reason tags for planning-affecting changes after the initial entry:
  `[clarification]`, `[scope realignment]`, `[dependency realignment]`, `[risk discovery]`, `[contract drift]`
- **v1.0 (2026-03-04):** Initial dossier created.
- **v1.1 (2026-03-05) [risk discovery]:** Added rate-limiting requirement after security review.
