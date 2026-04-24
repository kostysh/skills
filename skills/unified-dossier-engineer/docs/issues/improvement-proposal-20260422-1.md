# Improvement Proposal: Restore Mandatory Dossier Audit Policy

## Problem

The current active contract of `unified-dossier-engineer` preserves only a generic requirement for `independent review in fail-closed mode`, but no longer preserves:

- the stage-wide mandatory external review policy that used to apply to all mutating dossier stages;
- the richer implementation audit stack that used to apply on top of that baseline.

As a result, an authoring agent can now incorrectly conclude that:

- only `implementation` really needs review discipline;
- `feature-intake`, `spec-compact`, `plan-slice`, or `change-proposal` can be self-reviewed or closed without required external review;
- self-review is an acceptable substitute until explicitly challenged;
- `spec-conformance` plus general code review is sufficient;
- `security-reviewer` is optional for implementation work unless the operator asks for it explicitly.

That is a real regression relative to the old skill.

This regression is serious because it weakens:

- independent defect detection;
- upstream stage quality before implementation even begins;
- security review coverage;
- review freshness discipline;
- operator trust in `implementation` close-out.

## Why This Is A Regression

### Old skill: stage-wide external review baseline plus explicit implementation audit stack

The last shipped `dossier-engineer` required:

- external independent review for every mutating delivery step;
- and, additionally, a richer implementation audit stack for `Workflow stage: implementation`.

For `Workflow stage: implementation`, it required all of the following:

1. `spec-conformance` review first
2. nested `code-reviewer`
3. nested `security-reviewer`
4. explicit prohibition on silently substituting self-review
5. external spawned reviewer agents for required audits

Sources in git history:

- `skills/dossier-engineer/references/workflow-stage-implementation.md`
- `skills/dossier-engineer/references/implementation-audit-policy.md`
- `skills/dossier-engineer/SKILL.md`

Relevant preserved text from the old skill:

- step closure contract: every mutating delivery step required independent external review before truthful closure;
- implementation step 14: `spec-conformance` audit first
- implementation step 15: `code-reviewer` and `security-reviewer` required for executable code / runtime wiring / trust-boundary changes
- implementation audit policy: blocking audits are executed via spawned external agents
- skill-wide review model: do not silently substitute self-review or emulated review for required independent review
- old stage exit checklist explicitly required passed `code-reviewer` and `security-reviewer` checks for executable/trust-boundary scope

### New skill: only generic independent review survived

In the current `unified-dossier-engineer`, the active contract explicitly keeps:

- `independent review in fail-closed mode`

but it does **not** explicitly keep:

- mandatory external review for every mutating dossier stage from `feature-intake` through `implementation`;
- mandatory `spec-conformance -> code-reviewer -> security-reviewer` ordering;
- the trigger conditions that make `code-reviewer` and `security-reviewer` required;
- explicit self-review prohibition for required external review;
- early security checkpoint for first security-sensitive working increment;
- operational launch guardrails as part of active implementation policy.

Current active references that show the reduced contract:

- [SKILL.md](../../SKILL.md)
- [references/delivery-workflow-layer.md](../../references/delivery-workflow-layer.md)

The current active surface says `independent review in fail-closed mode`, but it no longer says that implementation closure requires the full audit stack.

## Old vs New Contract Matrix

| Review-policy aspect | Old `dossier-engineer` | Current `unified-dossier-engineer` | Problem |
| --- | --- | --- | --- |
| External independent review required for every mutating dossier stage | Yes, explicit | Not explicit in active merged refs | Regression |
| Self-review cannot replace required independent review | Yes, explicit | Not explicit in active merged refs | Regression |
| `spec-conformance` is first blocking audit | Yes, explicit | Not explicit in active merged refs | Regression |
| `code-reviewer` required for executable/runtime/trust-boundary scope | Yes, explicit | Not explicit in active merged refs | Regression |
| `security-reviewer` required for executable/runtime/trust-boundary scope | Yes, explicit | Not explicit in active merged refs | Regression |
| Early security seam checkpoint | Yes, explicit | Missing | Regression |
| `review-artifact` persists already obtained external audit evidence/result and does not perform the audit | Yes, explicit in old review flow | Partially implicit | Weakened |
| Weak/mini model cannot satisfy blocking audit | Yes, explicit | Missing from active merged refs | Regression |
| `fork_context: false` by default for audits | Yes, explicit | Missing from active merged refs | Regression |
| Read-only reviewer requirement and invalidation on mutation | Yes, explicit | Missing from active merged refs | Regression |

## Root Cause

During the merge, review discipline was over-compressed into a generic closure rule:

- `debt review`
- `independent review in fail-closed mode`
- `review freshness validation`

That wording kept the idea of external review, but it dropped both:

- the stage-wide mutating-step review baseline;
- the concrete implementation audit policy that previously made the process deterministic and safe.

This is exactly the kind of regression that lets agents improvise review behavior.

## Required Fix

The merged skill must restore one first-class active reference for audit policy:

- `references/audit-policy.md`

That reference must include:

- the stage-wide dossier audit baseline;
- the stronger implementation-specific audit stack.

It must not rely on:

- vague `independent review` wording;
- operator memory;
- historical docs from deleted skills;
- ad hoc reviewer choice by the authoring agent.

## Required Dossier Audit Policy

For every mutating dossier stage:

- `feature-intake`
- `spec-compact`
- `plan-slice`
- `implementation`
- `change-proposal`

truthful close-out must require at least one mandatory external independent audit.

### 1. Stage-wide mandatory external review baseline

The minimum stage-wide policy must be:

- every mutating dossier stage requires external independent review before truthful closure;
- self-review cannot satisfy this requirement;
- `review-artifact` records already obtained review evidence/result and does not perform the review;
- `dossier-step-close` must not treat a mutating stage as truthfully closable while the required external review is missing, invalidated, or stale.

### 2. Stage-specific baseline audit classes

The default required audit class for non-code mutating dossier stages must be:

- `feature-intake` -> `spec-conformance-reviewer`
- `spec-compact` -> `spec-conformance-reviewer`
- `plan-slice` -> `spec-conformance-reviewer`
- `change-proposal` -> `spec-conformance-reviewer`

These are still external independent audits. They are not self-checks.

## Required Implementation Audit Policy

For `Workflow stage: implementation`, the active policy must become:

### 3. Mandatory audit order for implementation

For implementation close-out, use this blocking order:

1. `spec-conformance-reviewer`
2. `code-reviewer`
3. `security-reviewer`

This order is mandatory whenever the changed scope includes executable code, runtime wiring, or trust-boundary changes.

For non-code scope:

- `spec-conformance-reviewer` remains mandatory when normative behavior or process contract changed;
- `code-reviewer` and `security-reviewer` are not required only when the change is genuinely non-code and does not alter any executable path, runtime behavior, or trust boundary;
- every audit that is required by policy still remains an external independent audit.

### 4. Self-review prohibition

The authoring agent must not satisfy any required external audit by reviewing its own change.

Rules:

- self-review does not count as `spec-conformance`;
- self-review does not count as `code-reviewer`;
- self-review does not count as `security-reviewer`;

If a separate reviewer agent cannot be used, the step is blocked unless the operator explicitly approves degraded review mode.

### 5. Code review and security review are mandatory for code-bearing implementation scope

If the changed scope contains any code or executable behavior surface, then both:

- `code-reviewer`
- `security-reviewer`

are mandatory.

There is no discretionary opt-out.

Code-bearing scope includes any of:

- source code;
- runtime wiring;
- file-system or path handling;
- parsing or serialization logic;
- auth/authz-related behavior;
- trust-boundary behavior;
- secret handling;
- external process or network interaction;
- container/runtime/bootstrap behavior;
- scripts that execute behavior;
- tests that exercise or redefine executable behavior expectations;
- build/runtime configuration that changes executable behavior.

If any of those are present, `code-reviewer` and `security-reviewer` are both required.

### 6. Early security seam checkpoint

If the first working implementation increment changes a security-sensitive seam, run an early narrow `security-reviewer` checkpoint before more work accumulates around that seam.

This checkpoint:

- is required when the trigger fires;
- is narrower than the final security audit;
- never replaces the final security audit.

### 7. External independence remains mandatory

Every audit that is required by policy must be executed as a separate independent external audit.

Important:

- `spec-conformance-reviewer`, `code-reviewer`, and `security-reviewer` are the audit classes;
- external independence is a required property of those audit classes, not a fourth audit type;
- `review-artifact` persists durable review evidence/result for the required audit bundle;
- `review-artifact` does not perform the review itself.

### 8. Mandatory spawn policy for blocking audits

Every blocking audit/review must:

- use a separate spawned reviewer agent;
- launch with `fork_context: false` by default;
- use a read-only brief;
- declare model and reasoning effort when the runtime supports that;
- reject weak/mini models as valid blocking-audit evidence.

If a reviewer mutates files or changes `HEAD`, invalidate the review and rerun it with a fresh reviewer.

### 9. Review freshness rule

Any material change after any completed audit invalidates that audit for the changed scope.

Material changes include:

- source code;
- tests;
- runtime or deployment configuration;
- dossier/process content that changes executable behavior or verification expectations;
- architecture or ADR constraints that change the allowed implementation path.

### 10. Completion gates

For every mutating non-code dossier stage, `process_complete` must not be truthful until:

- the required external audit for that stage passed;
- any required follow-up or actualization is resolved;
- `dossier-step-close` completed truthfully.

For implementation with executable scope, `implementation` must not be treated as process-complete until all of the following are true:

- verification passed;
- `spec-conformance-reviewer` passed;
- `code-reviewer` passed;
- `security-reviewer` passed;
- backlog follow-up, if required, is resolved;
- `dossier-step-close` completed truthfully.

## Concrete Changes Needed In The Merged Skill

### Active references

Restore one canonical active reference:

- `references/audit-policy.md`

Update active references so that:

- [references/audit-policy.md](../../references/audit-policy.md)
- [references/delivery-workflow-layer.md](../../references/delivery-workflow-layer.md)
- [references/commandized-stage-control.md](../../references/commandized-stage-control.md)
- [references/telemetry-and-closure.md](../../references/telemetry-and-closure.md)
- [SKILL.md](../../SKILL.md)

all point consistently to:

- the stage-wide mutating-step review baseline;
- the stronger implementation audit policy section where applicable.

### Utility spec and runtime semantics

The maintainer-facing utility spec must align with this policy:

- stage-specific required audit classes must be representable by the artifact/runtime model;
- `review-artifact` persists already-obtained review evidence/result for the required audit bundle;
- it must not be described as a fourth review type or in a way that lets an agent treat it as the whole review stack;
- helper/runtime docs must make it obvious that nested blocking audits are separate process obligations.

### Logging / telemetry

Logs and telemetry must make the dossier-stage audit policy observable.

Minimum required review telemetry:

- required audit classes per stage;
- actually executed audit classes per stage;
- which stage-level required external audit is still pending or blocked;
- which reviewer skills were used;
- which external reviewer agent produced each required audit;
- whether any review was invalidated for freshness.

Additional required telemetry for `implementation`:

- whether security review was required and why;
- whether any degraded mode was used;

## Acceptance Criteria

This issue is fixed only when:

- active merged refs explicitly restore mandatory external review for every mutating dossier stage;
- active merged refs explicitly restore the mandatory implementation audit stack;
- the active contract explicitly forbids satisfying required external review via self-review;
- `security-reviewer` is explicitly mandatory for executable/runtime/trust-boundary implementation scope;
- the early security checkpoint is restored;
- `review-artifact` semantics remain narrow and unambiguous and do not introduce a fictitious fourth review type;
- the merged skill once again gives agents only one truthful interpretation of review obligations.

## Non-Goals

- Do not make every prose-only stage run all audits automatically.
- Do not weaken the independent-review requirement into “any review is fine”.
- Do not make security review discretionary for executable implementation work.
- Do not hide mandatory review policy only in `docs/*` without promoting it into the active skill surface.
