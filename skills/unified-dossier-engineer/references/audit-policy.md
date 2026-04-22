# Audit policy

Use this reference when maintaining required dossier-stage audits, audit bundles, or truthful close-out semantics in this skill.

Use it together with:

- [Delivery workflow layer](delivery-workflow-layer.md)
- [Commandized stage control](commandized-stage-control.md)
- [Telemetry and closure](telemetry-and-closure.md)

## Purpose

This skill keeps one canonical audit policy for all mutating dossier stages.

This policy defines:

- which audit classes are required;
- when external independence is mandatory;
- when a stage may truthfully close;
- how freshness and invalidation work;
- how helper commands persist already obtained audit evidence.

## Audit classes

This skill recognizes exactly three blocking audit classes:

- `spec-conformance-reviewer`
- `code-reviewer`
- `security-reviewer`

External independence is a required property of any audit that policy marks as required. It is not a fourth audit type.

## Stage-wide mutating-stage baseline

Every mutating dossier stage requires at least one external independent audit before truthful closure:

- `feature-intake`
- `spec-compact`
- `plan-slice`
- `implementation`
- `change-proposal`

Rules:

- self-review never satisfies a required audit;
- `review-artifact` records already obtained audit evidence/result and does not perform the audit;
- `dossier-step-close` must block truthful closure while any required audit is missing, stale, invalidated, or not external.

## Stage-to-audit mapping

The baseline required audit class for non-code mutating dossier stages is:

- `feature-intake` -> `spec-conformance-reviewer`
- `spec-compact` -> `spec-conformance-reviewer`
- `plan-slice` -> `spec-conformance-reviewer`
- `change-proposal` -> `spec-conformance-reviewer`

These are still external independent audits. They are not self-checks.

## Implementation audit policy

`implementation` always requires the stage-wide external-review baseline. On top of that, it has a stronger bundle policy.

### Non-code implementation scope

When implementation work is genuinely non-code and does not change any executable path, runtime behavior, or trust boundary, the required audit bundle is:

- `spec-conformance-reviewer`

The `non-code` versus `code-bearing` scope must be recorded by `implementation --ready-for-close` into the current helper-managed implementation stage state before helper commands persist review evidence or close the stage. It is not a free-form close-out override, and helper validation must not trust human-authored log frontmatter as the policy oracle.

Fail-closed rule:

- helper commands may accept the recorded `non-code` scope only when the runtime can mechanically confirm that the implementation change set since stage entry is documentation-only;
- if that confirmation is unavailable or fails, helper commands must treat the scope as `code-bearing`.

### Code-bearing implementation scope

When implementation work contains any code or executable behavior surface, the required audit bundle is:

1. `spec-conformance-reviewer`
2. `code-reviewer`
3. `security-reviewer`

This ordering is mandatory.

Code-bearing scope includes any of:

- source code;
- runtime wiring;
- file-system or path handling;
- parsing or serialization logic;
- auth/authz behavior;
- trust-boundary behavior;
- secret handling;
- external process or network interaction;
- scripts that execute behavior;
- tests that define executable behavior expectations;
- build/runtime configuration that changes executable behavior.

If any of those are present, both `code-reviewer` and `security-reviewer` are mandatory. There is no discretionary opt-out.

## Early security checkpoint

If the first working implementation increment changes a security-sensitive seam, run an early narrow `security-reviewer` checkpoint before more work accumulates around that seam.

This checkpoint:

- is required when the trigger fires;
- is narrower than the final security audit;
- never replaces the final security audit.

## External independence

Every required audit must be executed as a separate independent external audit.

Rules:

- blocking audits use spawned external reviewer agents;
- `fork_context: false` is the default;
- weak or mini models do not satisfy blocking audit requirements;
- reviewer prompts must remain read-only;
- if a reviewer mutates files or changes `HEAD`, invalidate that audit and rerun it.

Those launch constraints are active process rules. The canonical runtime mechanically enforces only the durable subset it can validate from review artifacts and helper-managed stage telemetry:

- external-versus-degraded review mode;
- reviewer identity and reviewer skill;
- freshness via commit trace;
- explicit invalidation state.
- reviewer thread provenance from the current runtime when available, for same-thread rejection.

This is a process-trust policy, not a tamper-resistant attestation system. Repo-local stage state and review artifacts are used to coordinate and validate the managed workflow, not to provide cryptographic proof against hostile manual tampering.

Launch-mode details such as `fork_context`, prompt mutability, and model tier must still be honored during audit execution, but they are not inferred from prose and are not treated as silently self-validating runtime facts.

## Review freshness and invalidation

Any material change after a completed audit invalidates that audit for the changed scope.

Material changes include:

- source changes;
- runtime behavior changes;
- contract changes;
- test changes that alter executable expectations;
- backlog-follow-up mutations that change truth relevant to the audited stage;
- helper or closure rewrites that materially change the stage result.

Helper-owned accounting artifacts such as stage logs, review artifacts, verification artifacts, step artifacts, lifecycle snapshots, stage-state refreshes, operational locks, backlog reports, and backlog support files like `.dossier/backlog/.gitignore` or `.dossier/backlog/AGENTS.md` do not invalidate audits by themselves. Canonical backlog truth artifacts under `.dossier/backlog/` such as `state.json`, `sources.json`, `applied.json`, `source-review/*`, `packets/*`, and `patches/*` remain material.

Stale or invalidated audits do not satisfy closure policy.

## Review-artifact and dossier-step-close boundary

Helper command roles stay narrow:

- `review-artifact` persists one already obtained audit result for one audit class;
- `dossier-step-close` validates that the required audit bundle exists and is still valid;
- neither helper performs the audit itself.

Truthful close-out requires the policy-defined audit bundle for the stage and scope being closed.

## Minimum persisted audit evidence

Durable review evidence must preserve enough structure to answer:

- which stage was audited;
- which audit class was executed;
- whether the audit was external;
- who the reviewer was;
- which reviewer skill / agent identity produced it when available;
- which reviewer thread provenance was stamped by the runtime when available;
- whether the audit is invalidated or degraded;
- which audit classes were required versus executed;
- which helper-managed stage state recorded the audit bundle for the current stage cycle;
- for implementation, whether security review was required and why.

This must remain mechanically observable without prose inference.
