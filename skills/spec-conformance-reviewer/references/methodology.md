# Spec Conformance Methodology

Use this file for full implementation-versus-spec review.

## Normative Inputs

Collect the available sources before reading code:

- specification, PRD, RFC, ADR, ticket, or acceptance criteria
- API contract, schema, or protocol definition
- backward-compatibility requirements
- migration or rollout requirements
- state diagrams, sequence diagrams, or business rules when they are normative

If critical normative inputs are missing, limit the verdict and list the blocked surfaces.

## Implementation Inputs

Collect the evidence surface:

- diff or PR
- full code for the touched modules
- related interfaces and shared libraries
- feature flags, defaults, env-dependent config
- tests and fixtures
- rollout or migration documentation when it affects compliance

## Scope Boundaries

In scope by default:

- functional behavior
- completeness of required branches
- input and output contracts
- error handling when specified
- invariants, preconditions, and postconditions
- backward compatibility, migrations, flags, and defaults when specified
- tests as proof of compliance

Out of scope unless the spec makes them normative:

- style and formatting
- taste-based refactors
- architecture alternatives
- performance tuning
- security review
- observability review

## Source Priority and Conflicts

Use the highest-priority source available:

1. formal contracts
2. approved feature specs
3. normative acceptance criteria
4. ADR or RFC with mandatory constraints
5. tests or reference behavior only when explicitly normative

If two sources conflict:

- cite both sources
- describe the conflict
- limit the affected requirement to `ambiguous_spec` or a blocked verdict
- do not invent a tie-breaker

## Conditional Policy/Admission Matrix

Build a policy/admission matrix only when the normative sources mention at least one trigger:

- policy decisions or admission gates
- external consultant or downstream invocation
- fail-closed behavior
- activation decisions
- refusal or deny semantics

This matrix is a requirement-extraction aid, not a universal checklist. Each row must cite a requirement basis before it can support a non-compliance finding.

For triggered reviews, consider this bounded row catalog:

- explicit allow
- explicit deny, refusal, or no-invocation path
- missing admission evidence
- ambiguous admission evidence
- stale evidence or missing freshness timestamp when age limits are normative
- unsupported or unhealthy downstream path when dependency capability or health is normative
- duplicate or conflicting request id when idempotency, replay, or persistence semantics are normative
- activation conflict when single-active-scope behavior is normative
- persistence failure when fail-closed auditability is normative

If a row seems relevant but the source does not state or imply an expected behavior, classify it as `ambiguous_spec`, `cannot_determine`, a verification gap, or out of scope. Do not convert a plausible edge case into an invented obligation.

## Canonical Process

### 1. Fix Scope

Write one paragraph that states:

- what code is being reviewed
- which sources are normative
- what layers are in scope
- what critical inputs are missing

### 2. Extract Atomic Requirements

Turn the sources into testable requirements. For each requirement, capture:

- `requirement_id`
- `source`
- concise requirement statement
- requirement type
- priority: `must`, `should`, `optional`, or `derived`
- preconditions
- expected behavior
- negative scenario or failure behavior when relevant
- required side effects or invariants

Useful requirement types:

- `functional_behavior`
- `input_validation`
- `output_contract`
- `state_transition`
- `error_handling`
- `authorization_or_policy`
- `consistency_or_invariant`
- `backward_compatibility`
- `migration_or_rollout`
- `non_functional_if_normative`
- `observability_if_normative`

When a requirement is inferred rather than stated directly, mark it as `derived` and explain why.

### 3. Normalize the Requirements

Make vague requirements testable. Break compound statements into atomic checks by:

- precondition
- observable outcome
- side effect
- state restriction
- error path
- contract rule

For policy/admission triggers, normalize the applicable matrix rows into atomic requirements before reading implementation details. Keep unsupported rows visible only as ambiguity, verification gaps, or out-of-scope notes.

### 4. Map the Implementation

Find where the behavior actually lives:

- entry points
- orchestration layer
- domain logic
- persistence and caching
- validators and serializers
- async side effects
- feature flags and defaults
- error mapping
- tests

Do not judge compliance from one file if the behavior crosses layers.

### 5. Build the Traceability Matrix

For each requirement, record:

- requirement
- spec source
- implementation evidence
- test evidence
- status
- notes

Check both directions:

- requirement to implementation
- implementation back to requirement basis

This is where you catch unspecified behavior, contract drift, hidden defaults, and silent fallback paths.

### 6. Evaluate the Requirement Categories

Review the categories that apply to the normative sources:

- functional behavior and required branches
- input validation and bypass paths
- output contract and serialization
- error mapping, refusal paths, and atomicity
- state transitions, idempotency, and invariants
- backward compatibility and mixed-version safety
- rollout, migrations, defaults, and feature flags
- non-functional requirements only when they are normative

For policy/admission reviews, evaluate the conditional matrix rows that have requirement basis. Use `references/policy-admission-matrix.md` when the trigger is present and the row decisions affect the verdict.

### 7. Evaluate Tests as Evidence

Check tests at three levels:

1. the test exists
2. the test is relevant to the requirement
3. the test is strong enough to fail on a real violation

Use these labels when helpful:

- `missing verification`
- `misaligned test`
- `false confidence`
- `untestable from current evidence`

Do not treat missing tests as automatic non-compliance unless the normative source requires them. Treat them as proof gaps when the requirement cannot otherwise be established.

### 8. Separate New and Pre-Existing Problems

When reviewing a diff:

- label requirement failures introduced by the current change
- separate pre-existing issues surfaced during review

## Evidence Standard

Do not report a serious finding until you can explain:

- which requirement applies
- which code path implements or violates it
- what test or absence of test affects confidence
- what production behavior, contract, or state can break

Weak evidence includes comments, TODOs, function names, or tests whose asserts do not prove the requirement.

## Ambiguity and Missing Evidence

Use limited conclusions when necessary:

- `cannot_determine` when the evidence surface is incomplete
- `ambiguous_spec` when the normative source does not define the expected behavior clearly
- note the exact blocked inputs instead of guessing the product intent
