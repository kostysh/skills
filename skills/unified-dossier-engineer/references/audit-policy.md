# Audit policy

Use this reference when maintaining required dossier-stage audits, audit bundles, or truthful close-out semantics in this skill.

Use it together with:

- [Delivery workflow layer](delivery-workflow-layer.md)
- [Audit handoff recipes](audit-handoff-recipes.md)
- [Commandized stage control](commandized-stage-control.md)
- [Implementation pre-review checklists](implementation-pre-review-checklists.md)
- [Policy/admission risk families](policy-admission-risk-families.md)
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
- blocking audits must not inherit the authoring agent's full working context or full conversation history;
- in Codex, blocking audits must use `fork_context: false`; in another runtime, use the equivalent execution mode that does not fork or inherit full authoring context;
- reviewer delegation with forked context or full-history inheritance does not satisfy external independent audit requirements;
- reviewers must use an approved reviewer-grade profile for the audit class and stage scope; degraded, unapproved, or task-incapable reviewers do not satisfy blocking audit requirements;
- reviewer prompts must remain read-only;
- if an audit was launched with forked/full-history context, invalidate that audit and rerun it with a valid external execution mode;
- if a reviewer mutates files or changes `HEAD`, invalidate that audit and rerun it.

Delegation availability rule:

- if the runtime requires operator permission before launching an independent reviewer and that permission is unavailable, denied, or cannot be obtained in the current turn, leave the stage open or blocked;
- if independent reviewer execution is unavailable in the current environment, leave the stage open or blocked;
- do not replace a required external independent audit with self-review, local verification, implementation pre-review checklist evidence, or chat-only reasoning.

Use [Audit handoff recipes](audit-handoff-recipes.md) when launching required external audits. The recipes make scope, audit class, shared risk map, reviewer focus, read-only analysis boundary, and PASS/FAIL `review-artifact` recording explicit instead of leaving each authoring agent to reconstruct the handoff.

Read-only audit analysis means the reviewer must not change product/source/test/backlog truth files and must not change `HEAD`. After the reviewer decides PASS or FAIL, a narrow helper-owned `review-artifact` accounting write is allowed when it is limited to managed review artifact / stage-state evidence and does not mutate material scope. Any other reviewer mutation invalidates the audit and requires rerun.

A blocking audit round is not complete until `review-artifact` records the immutable attempt artifact for that audit class and verdict.

For a FAIL verdict, `review-artifact` must preserve actionable reviewer-owned accounting: at least one `must_fix` finding and at least one `evidence` reference. Correction work after prose-only or trace-only FAIL must not continue as if the round were durably accounted; either rerun reviewer-owned FAIL accounting or record a structured process miss when the original artifact is unrecoverable.

Those launch constraints are active process rules. The canonical runtime mechanically enforces only the durable subset it can validate from review artifacts and helper-managed stage telemetry:

- external-versus-degraded review mode;
- reviewer identity and reviewer skill;
- freshness via commit trace;
- explicit invalidation state.
- reviewer thread provenance from the current runtime when available, for same-thread rejection.

This is a process-trust policy, not a tamper-resistant attestation system. Repo-local stage state and review artifacts are used to coordinate and validate the managed workflow, not to provide cryptographic proof against hostile manual tampering.

Launch-mode details such as `fork_context`, prompt mutability, and model tier must still be honored during audit execution, but they are not inferred from prose and are not treated as silently self-validating runtime facts. Runtime and artifact state must not claim to prove launch-mode independence beyond the observable provenance they actually record.

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

- `review-artifact` persists one immutable already obtained audit attempt for one audit class;
- FAIL `review-artifact` writes require both `must_fix` and `evidence`; PASS artifacts must not carry `must_fix`;
- later attempts supersede earlier attempts for closure only through policy validation, never by overwriting earlier evidence;
- `dossier-step-close` validates that the required audit bundle exists and is still valid;
- neither helper performs the audit itself.

Truthful close-out requires the policy-defined audit bundle for the stage and scope being closed.

Implementation pre-review checklist evidence is reviewer context and author-side readiness evidence only. It is not audit evidence, not correctness proof, not reviewer launch-mode proof, and not a substitute for required `spec-conformance-reviewer`, `code-reviewer`, or `security-reviewer` audits.

## Minimum persisted audit evidence

Durable review evidence must preserve enough structure to answer:

- which stage was audited;
- which audit class was executed;
- whether the audit was external;
- who the reviewer was;
- which reviewer skill / agent identity produced it when available;
- which reviewer thread provenance was stamped by the runtime when available;
- whether the audit is invalidated or degraded;
- the review attempt identity: `review_attempt_id`, `review_round_id`, `review_round_number`, and immutable `artifact_path`;
- FAIL findings: full `must_fix` and `evidence` live in the immutable review artifact, while stage state/log may store bounded links and counts such as `must_fix_count` and `evidence_count`;
- any compatibility latest copy path as a convenience pointer, not as the sole evidence;
- which audit classes were required versus executed;
- which helper-managed stage state recorded the audit bundle for the current stage cycle;
- for implementation, whether security review was required and why.
- for policy/admission scopes, which classification, declared risk families, negative matrix, prior non-PASS artifacts, and process misses were handed to reviewers.

This must remain mechanically observable without prose inference.

## Selected Bundle Closure

`dossier-step-close` must select only the final valid PASS bundle required by the policy-defined audit order.

Rules:

- selected artifacts must resolve to managed immutable attempts, even when the operator passes a latest-copy path;
- selected artifacts must be latest recorded valid attempts for their audit class in current helper-managed stage state;
- selected artifacts must be policy ordered, stage/feature/scope compatible, external, PASS, not degraded, not invalidated, not stale, and not same-thread when reviewer thread provenance is available;
- in git repositories, selected review artifact `event_commit` values and selected verification artifact `event_commit` are material-scope freshness anchors and must match the reviewed/current material scope when present or expected;
- no-commit repositories do not invent commit-anchor requirements solely because git metadata is absent;
- stage-level commit frontmatter such as `final_delivery_commit` and `final_closure_commit` is trace context only and must not be used as closure proof.

Successful closure records the selected bundle summary: `closure_bundle_id`, `closure_bundle_rounds_by_audit_class`, compatibility `closure_bundle_round`, `selected_review_artifacts`, `selected_verification_artifact`, `selected_step_artifact`, and `selected_closure_ts`.
