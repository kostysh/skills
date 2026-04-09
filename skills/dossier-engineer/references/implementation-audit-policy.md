# Implementation Audit Policy

This reference defines the external audit stack for `Workflow stage: implementation`.

Use it together with [workflow.md](workflow.md) and the `implementation` stage in [../SKILL.md](../SKILL.md).

## Purpose

The implementation stage has three distinct control layers:

- internal stage-completion checks inside the skill;
- external audits run through spawned agents;
- durable artifacts that record verification, review freshness, and step closure.

Do not collapse them into one concept.

- Internal checklists are self-check and completion gates.
- External audits test the changed scope from different angles.
- Durable artifacts record the result; they do not replace the audit itself.

## Audit stack

For implementation changes, use this order:

1. `spec-conformance`
2. `code`
3. `security`
4. independent review artifact capture

Meaning:

- `spec-conformance` checks that the implementation still matches dossier truth, overlays, approved changes, and relevant contracts.
- `code` checks correctness, maintainability, lifecycle handling, and contract integrity in the changed scope.
- `security` checks trust boundaries, auth/authz, input handling, secret handling, and exploitability in the changed scope.
- `review-artifact` persists the independent review verdict after the review happened; it is not the review itself.

If the changed scope is prose-only and does not change executable behavior, do not automatically run `code` or `security`.
If the changed scope includes executable code, runtime wiring, or trust-boundary changes, `code` and `security` are required after `spec-conformance` passes.
Do not auto-trigger `code` or `security` only because follow-up work touched tests, typing, or other non-normative internals.

## Spawned agents only

When the process requires an external audit:

- run it through a spawned external agent;
- assign the agent an explicit role;
- explicitly recommend the correct review skill:
  - `spec-conformance-reviewer`
  - `code-reviewer`
  - `security-reviewer`
- define the review scope narrowly;
- close the review agent immediately after PASS if it is no longer needed.

If the environment requires explicit operator approval before spawning an audit agent, ask, stop, and wait.

## Review brief template

Every audit request should contain these fields:

- `Role`
- `Required skill`
- `Scope`
- `Normative basis`
- `Changed files`
- `Explicit exclusions`
- `Already known or already fixed findings`
- `Review question`

Recommended wording constraints:

- ask for a concise answer;
- brief, precise, no filler;
- no tables, matrices, executive summaries, or other expanded formats unless they are explicitly needed for this audit.

Also ask the reviewer to:

- watch small contract details;
- watch side effects of the changed scope;
- watch for drift against already accepted fixes.

## Minimal audit output shape

Preferred answer shape:

- one verdict line;
- findings only when present;
- for each finding:
  - severity;
  - concrete issue;
  - evidence with file reference;
  - why it matters.

Do not ask for broad narrative unless the current audit really needs it.

## Findings handling

When an audit returns findings:

- if the fix would go beyond the current specification or accepted process model, stop and ask the operator;
- if the fix stays within the current specification/process model, apply it and rerun only the audits that are still relevant to the narrow follow-up scope.

Continue this fix -> narrow re-audit cycle until the relevant audit returns PASS.

## Follow-up re-audit classifier

Choose re-audits by the class of the follow-up change.

### 1. Normative/process/docs contract changes

Examples:

- wording that changes the process contract;
- command/help text that changes machine- or operator-facing interpretation;
- dossier/process rules that affect closure semantics.

Required re-audit:

- narrow `spec-conformance`

### 2. Runtime/code/trust-boundary changes

Examples:

- changed executable code;
- changed verification bundle behavior;
- changed artifact validation;
- path, ownership, symlink, or boundary hardening fixes.

Required re-audit:

- narrow `code`
- narrow `security`
- narrow `spec-conformance` too if the fix could affect the normative contract

### 3. Tests/typing/non-normative internal changes

Examples:

- tests rewritten to match already accepted behavior;
- types tightened without changing behavior;
- refactors that do not alter the process or command contract.

Required re-audit:

- rerun only the audits still relevant to those changes
- do not rerun `spec-conformance` automatically

### 4. Docs polish with no normative impact

Examples:

- grammar;
- formatting;
- non-contract examples that do not change interpretation.

Required re-audit:

- no automatic external re-audit
- unless the touched text is still part of a normative/process surface

## Independent review

Implementation closure still requires independent review.

Rules:

- use a separate reviewer agent when the environment supports it;
- do not silently downgrade to self-review;
- if a separate reviewer cannot be used and the operator has not approved degraded mode, leave the step blocked;
- persist the verdict with `review-artifact` after the independent review is complete.

## What this policy does not replace

This policy does not replace:

- dossier-local completeness review;
- `dossier-verify`;
- `review-artifact`;
- `dossier-step-close`;
- backlog actualization through `backlog-engineer` when implementation changed backlog truth.
