# Spec Conformance Methodology

Use this file for full implementation-versus-spec review.

## Review Basis and Side-Effect Boundary

Before judging conformance, record:

- a stable implementation identity: commit, diff plus base, aggregate content hash, or equivalent immutable revision;
- included modules, layers, environments, flags, migrations, and explicitly excluded surfaces;
- an identity for every candidate normative source, including owner, approval state, version or content hash, applicability, and supersession status;
- explicit user or project source-of-truth and precedence declarations;
- critical implementation or source inputs that are missing.

Keep the review read-only. Do not edit the implementation or normative sources while producing the verdict. Stop when a reviewed surface moves; any material source or implementation change invalidates the prior verdict and requires a new review identity.

## Remediation Re-audit Scope

On a new stable snapshot, bind remediation re-audit to the fixed prior findings, their authoritative requirements, exact remediation delta, original failure paths, closure evidence, and adjacent contracts identified by a blast-radius check. Record unchanged previously verified requirements as excluded; do not re-read or re-evaluate their full implementation surface.

Widen to a fresh conformance review when normative authority, requirement meaning, public behavior, or material scope changed, when unrelated changes overlap the requirement boundary, or when the blast radius cannot be bounded. A cosmetic or prose-only diff does not close a behavioral deviation without evidence against the original requirement failure path.

## Normative Inputs

Collect the available sources before reading code:

- specification, PRD, RFC, ADR, ticket, or acceptance criteria
- API contract, schema, or protocol definition
- backward-compatibility requirements
- migration or rollout requirements
- state diagrams, sequence diagrams, or business rules when they are normative

Do not infer authority from an artifact's format. A contract, ticket, test, or generated document is normative only for the behavior or contract dimension it is declared to own.

If critical normative inputs are missing, limit the verdict and list the blocked surfaces.

## Implementation Inputs

Collect the evidence surface:

- diff or PR
- full code for the touched modules
- related interfaces and shared libraries
- feature flags, defaults, env-dependent config
- tests and fixtures
- real persistence/RLS/RPC/provider-boundary evidence when those layers implement the requirement
- rollout or migration documentation when it affects compliance

If the available implementation surface cannot establish a mandatory requirement at its enforcement boundary, record the missing surface instead of substituting mocks, tests, documentation, or inference.

## Scope Boundaries

In scope by default:

- functional behavior
- completeness of required branches
- input and output contracts
- error handling when specified
- invariants, preconditions, and postconditions
- backward compatibility, migrations, flags, and defaults when specified
- tests as evidence whose strength must match the claimed requirement boundary

Out of scope unless the spec makes them normative:

- style and formatting
- taste-based refactors
- architecture alternatives
- performance tuning
- security review
- observability review

## Capability Vs Substrate Evidence

Classify evidence before assigning a requirement status.

Observable capability evidence shows the required runtime behavior through the layer that must enforce it. Substrate can support a capability but does not prove it by itself.

Treat these as substrate unless paired with runtime or other boundary-matched evidence:

- schema, table, policy, or migration exists;
- route, handler, OpenAPI entry, or SDK method is registered;
- mock handler returns success;
- in-memory test passes;
- documentation or comments claim completion;
- audit/security event name is declared but capture semantics are unproven.

Substrate may fulfill an atomic requirement that explicitly requires that artifact to exist, but it does not fulfill a broader runtime or user-visible requirement. For broader behavior:

- use `partially_fulfilled` only when evidence proves some required observable behavior while another required branch, constraint, or side effect is absent;
- use `not_fulfilled` when the complete reviewed implementation visibly omits or contradicts required behavior;
- use `cannot_determine` when the relevant implementation, runtime configuration, persistence, provider, or other enforcement surface is unavailable or incomplete.

Do not mark a requirement `fulfilled` from substrate alone.

## Source Authority and Conflicts

Resolve source authority in this order:

1. Apply explicit user or project declarations of ownership and precedence.
2. Exclude or demote sources that are unapproved, stale, superseded, out of scope, or generated from another owning source.
3. Respect dimension-specific ownership: a protocol or schema may own wire compatibility while a product requirement owns user-visible behavior.
4. Only when no precedence is declared and the remaining sources are equally current and applicable, use this disclosed fallback: formal contract for its owned contract dimension, approved feature spec, explicitly normative acceptance criteria, mandatory ADR or RFC, then explicitly normative tests or reference behavior.

Tickets and delivery issue bodies are normative only when the project explicitly grants them that authority. Otherwise, use them to locate the owning source and classify unmatched ticket wording as lower-authority context.

If sources conflict:

- cite both sources and their identity, owner, status, and applicability;
- classify lower-authority, stale, superseded, or generated differences as drift relative to the owning source;
- use `ambiguous_spec` when equally authoritative applicable sources remain unresolved;
- limit the affected coverage and verdict rather than inventing a tie-breaker.

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

- the immutable implementation identity
- what code is being reviewed
- which source identities are normative and why they are authoritative
- what layers are in scope
- what critical inputs are missing
- that the review is read-only and what change would invalidate it

### 2. Extract Atomic Requirements

Turn the sources into testable requirements. For each requirement, capture:

- `requirement_id`
- `source`
- concise requirement statement
- requirement type
- modality: `must`, `should`, or `optional`
- origin: `explicit` or `derived`
- derivation basis and confidence when origin is `derived`
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

When a requirement is inferred rather than stated directly, mark its origin as `derived`, cite the source statements that imply it, and explain the derivation and confidence. Preserve its independent modality; a derived invariant may still be `must`.

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
- API/service authorization and direct data-access authorization when both exist
- persistence and caching
- RLS policies, RPC functions, storage policies, provider gates, or service-role stores when they enforce the requirement
- validators and serializers
- long-lived stream/subscription lifecycle when permission can change after admission
- audit/security event capture path when events are required
- async side effects
- feature flags and defaults
- error mapping
- tests

Do not judge compliance from one file if the behavior crosses layers.

### 5. Build the Traceability Matrix

For each requirement, record:

- requirement
- spec source
- observed implementation evidence or exact missing evidence surface
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
- auth/RBAC requirements across API/service and persistence/RLS/direct data paths
- SSE, stream, subscription, or WebSocket-like lifecycle behavior: initial admission, heartbeat/revalidation or explicit invalidation, stale/revoked/disabled/maintenance-denied transition, and observable close/block/deny state
- audit/security-event requirements: write class, same-transaction capture, durable fallback or fail-closed design, append-only constraints, and failure behavior
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

If tests rely on mocks or in-memory stores, classify what they prove. API-flow tests with doubles may prove routing or service behavior, but they do not prove persistence, RLS, RPC, provider-gate, service-role, or security-event durability semantics unless the same boundary is exercised or covered by a contract suite.

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

For `cannot_determine`, cite the authoritative requirement and the exact unavailable surface instead of inventing implementation evidence. Missing proof is a verification gap, not a confirmed violation.

Weak evidence includes comments, TODOs, function names, or tests whose asserts do not prove the requirement.

## Ambiguity and Missing Evidence

Use limited conclusions when necessary:

- `cannot_determine` when the evidence surface is incomplete
- `ambiguous_spec` when the normative source does not define the expected behavior clearly
- note the exact blocked inputs instead of guessing the product intent
- never aggregate a mandatory `cannot_determine` or `ambiguous_spec` into `compliant` or `compliant with minor gaps`
