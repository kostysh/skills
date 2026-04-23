# Improvement Proposal: move auth-admission security concerns earlier in the skill stack

Issue ID: `ISS-05`

Primary owner skill: `security-reviewer`

Affected skills:

- `HONO engineer`
- `security-reviewer`
- `typescript-test-engineer`

## Problem

For auth-admission work, important security concerns were discovered too late in the cycle.

The grouped problems are intentionally one cross-skill issue:

- `HONO engineer` does not surface a compact enough route-admission checklist early enough;
- `security-reviewer` guidance is strong at review time, but it does not push enough of its threat model into planning or early implementation prompts for auth-admission slices;
- `typescript-test-engineer` does not require a clear statement of which replay/rate-limit risk a regression test is supposed to lock down.

Together, these gaps allow late discovery of:

- bounded body-read issues;
- quota-isolation issues;
- replay/availability semantics;
- tests that cover something nearby but not the intended failure mode.

## Why This Matters

This is not a request for a broad new security framework.

The issue is narrower:

- auth-admission slices are high-risk enough that missing a small checklist early creates review churn later;
- late discovery of these concerns increases rerounds close to `ready_for_close`;
- test coverage can look present while still missing the exact risk that needed to be fixed.

## Current Active Surface

Relevant active references inside `security-reviewer`:

- [Methodology](../../references/methodology.md)
- [API auth input](../../references/api-auth-input.md)
- [Domain handoffs](../../references/domain-handoffs.md)

This issue also requires aligned changes in the affected companion skills named above. Those skill-specific changes should remain bounded to the auth-admission concern family described here.

## Required Correction

Add a small, explicit early-stage checklist stack for auth-admission work.

The solution should remain narrow and role-aligned:

- `security-reviewer` owns the early threat checklist and timing guidance;
- `HONO engineer` owns the Hono route-admission/domain framing cues needed by implementation agents;
- `typescript-test-engineer` owns the test-design cue that makes replay/rate-limit regressions name the exact risk they are locking down.

For this issue, `auth-admission` means slices that change protected route admission, replay/idempotency controls, pre-auth resource consumption, or closely related authorization-boundary handling for those routes.

## What Must Change

### 1. `security-reviewer`

Add explicit guidance that auth-admission slices should surface the core threat checklist before late review loops.

The rule must appear in the skill's early-use workflow surface, not only in a deep reference section.

That checklist should cover, at minimum:

- trust boundary of the route;
- pre-auth versus post-auth resource consumption;
- replay and idempotency expectations when relevant;
- bounded request-body handling on high-risk routes.

### 2. `HONO engineer`

Add a compact route-admission checklist or guardrail language for Hono-backed auth/admission work.

The rule must appear in the skill's early-use guidance, not only as low-visibility optional detail.

The guidance should remain concise and focused on the identified concerns:

- bounded body reads;
- quota isolation;
- replay behavior;
- preservation of the touched route's admission boundary.

### 3. `typescript-test-engineer`

Add a narrow regression-test rule for replay/rate-limit style fixes:

- the test change must make clear which concrete risk or failure mode it is intended to lock down;
- the exercised scenario or assertions must actually reflect that named risk or failure mode, not only a nearby behavior or prose label.

This does not require a new general test taxonomy. It only needs enough guidance to stop near-miss coverage from passing as adequate.

## External Spec-Conformance Review

Status: reviewed

Verdict on initial draft: `mixed`

Key review outcome:

- the cross-skill ownership split was accepted as bounded and mostly non-excessive;
- the draft needed stronger timing/placement requirements so the checklist appears in early-use workflow surfaces;
- the test rule needed to bind the named replay/rate-limit risk to exercised scenarios or assertions, not only to prose;
- the Hono wording needed narrowing so it stays on admission-boundary preservation rather than broad generic authorization scope.

## Acceptance Criteria

This issue is fixed only when:

- `security-reviewer` explicitly instructs earlier auth-admission threat surfacing for the bounded concern set described here, and places that rule in an early-use workflow surface;
- `HONO engineer` adds compact auth-admission guidance for bounded body reads, quota isolation, replay behavior, and preservation of the touched route's admission boundary, with that guidance visible in an early-use workflow surface;
- `typescript-test-engineer` adds a narrow rule that replay/rate-limit regression tests must state the targeted risk or failure mode and reflect that target in the exercised scenario or assertions;
- the changes remain concise and role-aligned rather than duplicating entire frameworks across all three skills;
- docs-contract coverage protects the new guidance where applicable.

## Mandatory Planning And Implementation Constraint

Any future planning or implementation for this issue must stay tightly scoped to the auth-admission concern family described here.

Mandatory boundaries:

- make only the smallest documentation and test-contract changes needed to introduce this early checklist stack;
- do not broaden the issue into a full security rewrite of the affected skills;
- do not duplicate large sections of one skill inside another;
- do not add unrelated auth, webhook, CI, or general testing methodology improvements under this issue;
- if implementation reveals a separate concern outside this bounded checklist family, record a new follow-up instead of extending this issue.

## Non-Goals

- Do not turn `security-reviewer` into a generic planning skill.
- Do not duplicate full Hono architecture or testing methodology inside this issue.
- Do not require every test change in the skill to carry new metadata beyond the bounded replay/rate-limit regression cue described here.
