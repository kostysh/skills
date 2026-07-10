Review implementation against authoritative normative requirements, not against general taste. This skill owns requirement extraction, traceability, evidence standards, compliance statuses, and verdict discipline for a stable read-only review snapshot.

## Normative Source Authority

Establish authority before extracting requirements:

1. Apply explicit user or project declarations of source ownership and precedence.
2. Confirm each source's owner, approval state, version, applicability, and supersession status.
3. Treat a formal or generated contract as authoritative only for the contract dimension it owns. For example, an OpenAPI document may own the wire shape without owning product behavior.
4. Use artifact-type ordering only as a disclosed fallback among sources that are otherwise current, applicable, and without declared precedence.
5. Treat tickets, acceptance criteria, tests, and reference behavior as normative only when their authority is explicit.

If sources conflict, cite each source and identify whether one is lower-authority, stale, superseded, generated drift, or an unresolved equal-authority conflict. Use `ambiguous_spec` or a limited verdict when authority cannot be established; do not invent a winner.

## Non-Negotiables

- Fix the read-only review scope and stable identities for the implementation and candidate normative sources before judging conformance.
- Establish normative authority before reading implementation details deeply enough to form conclusions.
- Extract atomic requirements explicitly with IDs instead of keeping them implicit.
- Record modality (`must`, `should`, or `optional`) separately from origin (`explicit` or `derived`); a derived requirement can remain mandatory.
- Tie every material conclusion to an authoritative requirement and either observed implementation evidence or the exact missing evidence surface.
- Distinguish non-compliance, partial coverage, ambiguity, missing evidence, and out-of-scope observations.
- Check both directions:
  - requirement to code and tests
  - code behavior to requirement basis
- Treat tests as evidence, not as proof by existence.
- Distinguish observable runtime capability from substrate such as schema presence, route registration, OpenAPI entries, mock handlers, in-memory tests, or documentation claims.
- Let substrate satisfy only an atomic substrate requirement. Use `partially_fulfilled` for a broader runtime requirement only when some required observable behavior is proven.
- For auth/RBAC requirements, check both API/service behavior and persistence/RLS/direct data-access behavior when the system exposes such a path.
- For audit/security-event requirements, verify write-class semantics, capture durability, and failure behavior; an event name alone is not evidence.
- Do not turn this into a general code-quality review unless the spec makes that dimension normative.
- Build the conditional policy/admission matrix only when normative sources trigger it; every row needs requirement basis.
- If critical inputs are missing or contradictory, limit the verdict instead of pretending certainty.
- Do not issue `compliant` or `compliant with minor gaps` while any mandatory requirement is `cannot_determine` or `ambiguous_spec`.
- Do not remediate the reviewed implementation or normative sources. Stop if the reviewed snapshot moves and invalidate the verdict after any material change.

## Fast Workflow

1. Fix a read-only implementation snapshot, normative source identities, scope, authority, and missing inputs. Use `references/methodology.md`.
2. Extract atomic requirements with IDs, source, type, modality, origin, derivation basis when applicable, and expected behavior.
3. If policy/admission triggers are present, build the bounded matrix from `references/policy-admission-matrix.md`.
4. Map implementation surfaces across handlers, orchestration, domain logic, direct data access, persistence, config, flags, serializers, long-lived lifecycles, audit capture, and tests.
5. Build a traceability matrix from requirements to code and tests.
6. Classify findings, verification gaps, and unspecified behavior.
7. Apply the verdict aggregation rules from `references/reporting.md`; do not convert unknown mandatory evidence into partial compliance.
8. Hand off the final verdict with snapshot identity, source authority, coverage limits, blocked inputs, routed observations, and next owners.

## What to Check

### Requirement Coverage

- happy path and required branches
- negative cases and edge cases
- side effects and ordering
- error mapping and failure semantics
- state transitions and invariants
- backward compatibility, rollout, migrations, and flags when normative

### Contracts and Evidence

- input validation rules and bypass paths
- output shape, field presence, status codes, and serialization
- defaults, fallback behavior, and silent coercion
- tests whose assertions provide evidence for the required behavior at the claimed boundary
- runtime-dependent areas that cannot be proven from the current evidence
- admission allow, deny, refusal, freshness, downstream, replay, activation, and persistence rows when normative
- auth/RBAC direct data paths: user-JWT RLS, PostgREST, RPC, storage policies, service-role stores, and provider boundaries when exposed
- SSE/subscription/stream lifecycles: initial admission, revalidation or invalidation, stale/revoked/disabled/maintenance-denied transition, and observable blocked/closed/denied state when normative
- audit/security events: required write class, durable capture or fallback, append-only behavior, and failure path when normative

## Default Brevity Mode

Unless the user explicitly asks for a formal audit or report:

- use terse chat output
- do not narrate intermediate reasoning or review passes
- do not produce tables, matrices, executive summaries, or cleared-surfaces sections
- report all confirmed in-scope findings, but keep the output compressed
- make each finding short, behavior-based, and evidence-backed
- collapse duplicate symptoms into one root-cause finding where possible
- keep questions and assumptions to the minimum necessary for correctness

## Output Rules

- Findings must cite requirement IDs, spec basis, observed implementation evidence or the exact missing surface, impact, and fix direction.
- Separate confirmed non-compliance from ambiguity, verification gaps, and non-blocking observations.
- If the output is compressed for chat, keep at minimum:
  - implementation snapshot, scope, source identities, and authority
  - requirement coverage summary
  - findings
  - verification gaps and blocked inputs
  - routed observations and next owner when applicable
  - final verdict
- Separate issues introduced by the current change from pre-existing issues surfaced during review.

## Reference Map

Read the required references at their decision points:

- `references/methodology.md` - read for every review before selecting normative sources, extracting requirements, or judging evidence
- `references/reporting.md` - read before assigning requirement statuses or a final verdict
- `references/policy-admission-matrix.md` - optional bounded matrix for policy/admission reviews with normative triggers
