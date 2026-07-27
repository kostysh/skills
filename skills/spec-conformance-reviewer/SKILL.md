---
name: spec-conformance-reviewer
description: Review code against authoritative specs, contracts, ADRs, tickets,
  PRDs, RFCs, migrations, and acceptance criteria. Build requirement-to-code
  traceability, identify compliance gaps or ambiguities, and issue an
  implementation-versus-spec verdict limited by source authority and evidence.
metadata:
  source-version: 0.1.7
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: bbd3dbd28d2c6f37d8894a1024578afc59e594c23aad4235dad373b9868388e6
---

# spec-conformance-reviewer

## Start here

1. Confirm the request asks for implementation-versus-normative-source conformance, not general review, security analysis, concept review, or spec authoring.
2. Fix a read-only review scope and stable identities for the implementation snapshot and every candidate normative source before reaching conclusions.
3. Read the required methodology for every review and the reporting reference before assigning statuses or a verdict.
4. Establish source ownership, approval, version, applicability, supersession, and project-declared precedence; do not infer authority from artifact type alone.
5. For remediation re-audit, fix the prior findings, remediation delta, original requirement failure paths, and adjacent regression surface; do not repeat unchanged previously verified requirements.
6. Load optional references only when their stated trigger applies.

## When to use this skill

- "implementation vs spec", "spec compliance review", or "does this match the spec"
- Verifying a PR, module, or behavior against a feature spec, ADR, RFC, OpenAPI contract, schema, or acceptance criteria
- Producing a requirement extraction table, traceability matrix, verification gaps list, or compliance verdict
- Separating confirmed non-compliance from ambiguity, missing evidence, or pre-existing issues

## When NOT to use this skill

- General merge-risk or bug-hunting review without normative sources: use `code-reviewer`
- Security-first review: use `security-reviewer`
- Architecture, performance, or style review unless those concerns are explicit in the normative sources
- Authoring or refining a spec instead of checking implementation against it

## Overview

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

## Workflow stages

### Workflow stage: Establish the review basis

Make the read-only scope, source authority, and reviewed snapshot reproducible before judging conformance.

1. Record the implementation commit, diff plus base, aggregate hash, or equivalent immutable identity and the layers included in scope.
2. Record each candidate normative source's owner, approval state, version, applicability, supersession, and any explicit project or user precedence.
3. For remediation re-audit, record the prior snapshot and findings, current stable remediation delta, unchanged verified requirements excluded from repetition, and blast-radius boundary.
4. Classify missing, lower-authority, generated, stale, or conflicting inputs and stop if the reviewed snapshot moves.

Validation:

- Another reviewer can reconstruct the implementation and normative source surface from the recorded identities.
- Artifact type alone never selects the normative authority.
- The reviewer has not modified the reviewed implementation or normative sources.

### Workflow stage: Trace requirements and evidence

Map atomic requirements to the actual enforcement boundaries without accepting substrate as broader runtime capability.

1. Extract atomic requirements with separate modality and origin fields, preserving derivation basis and confidence.
2. Trace each requirement to implementation, runtime or boundary evidence, and tests in both directions.
3. In remediation re-audit, re-evaluate the fixed requirements and adjacent contracts only; widen to a fresh conformance review when normative authority, requirement meaning, public behavior, or material scope changed or blast radius cannot be bounded.
4. Assign fulfilled, partial, not-fulfilled, ambiguous, or cannot-determine status according to the observed evidence surface.

Validation:

- Every material conclusion cites an authoritative requirement and either observed implementation evidence or the exact missing evidence surface.
- Substrate satisfies only an atomic substrate requirement; broader runtime behavior requires boundary-matched evidence.
- A derived requirement retains its independent must, should, or optional modality.

### Workflow stage: Derive and hand off the verdict

Produce a deterministic verdict whose strength does not exceed source authority or mandatory implementation evidence.

1. Apply the reporting aggregation rules to mandatory statuses, confirmed deviations, ambiguities, and verification gaps.
2. Start with one plain-language outcome sentence, then report snapshot identity, source authority, coverage limits, blocked inputs, findings, routed observations, and the final verdict.
3. Name the owner of clarification or remediation without resolving product intent or editing the reviewed surface.

Validation:

- Compliant and compliant-with-minor-gaps are impossible while any mandatory requirement is ambiguous or cannot be determined.
- Confirmed deviations remain distinct from missing proof and source ambiguity.
- Any material change to the reviewed implementation or normative source invalidates the verdict.

## Interop priority

- **requirement extraction, implementation traceability, compliance statuses, evidence limits, and the final implementation-versus-spec verdict:** spec-conformance-reviewer. This skill owns the conformance decision while preserving the authority and evidence supplied by upstream and domain owners.
- **authoring, approving, clarifying, or changing normative product and software requirements:** spec-engineer or the named product and requirement owner. Upstream owners resolve ambiguity and establish authority; this reviewer records blockers and must not invent or rewrite intent.
- **whether requirements or implementation deliver the established product or system concept beyond literal spec compliance:** concept-conformance-reviewer. Concept conformance owns the broader capability boundary; this skill owns only implementation-versus-authoritative-requirement conformance.
- **general merge risk, bugs, regressions, maintainability, and non-spec implementation concerns:** code-reviewer. Route non-spec findings to code-reviewer while retaining any direct requirement-backed deviation in this verdict.
- **exploitability, attack paths, vulnerability classification, and security risk not explicitly defined by a normative requirement:** security-reviewer. Security-reviewer owns security judgment; this skill may consume its sourced facts without transferring the spec verdict.
- **stack-specific correctness facts and implementation remediation:** the relevant domain skill or implementation owner. Domain owners supply specialized facts and implement accepted corrections; this reviewer remains read-only and preserves traceability.

## Gotchas

- **high** — Do not treat a delivery issue body as the normative source when PRD, SPEC, PD, architecture, or validation artifacts define the contract.
- **high** — Do not mark conformance PASS when acceptance can be satisfied by mock screens, storybook stories, generated artifacts, docs, or tests without the claimed runtime behavior.
- **high** — A formal or generated contract is not automatically more authoritative than its owning approved requirement; establish ownership, version, applicability, and supersession first.
- **high** — Do not issue compliant or compliant with minor gaps while a mandatory requirement is ambiguous or lacks sufficient implementation evidence.
- **high** — Stop when the reviewed implementation or normative source changes; the prior scope identity and verdict are no longer valid.

## Policies

### Trace to source policy
Conformance review must trace public contracts, statuses, routes, payloads, and UX claims to their owning artifacts and name any unmatched behavior as drift, not as an implementation choice.

### Authority before artifact type
Explicit project or user source ownership, approval, version, applicability, and supersession win over generic artifact-type precedence; use type-based ordering only as a disclosed fallback among otherwise applicable sources.

### Read-only stable snapshot
Review a reproducible implementation and normative-source snapshot without remediation; stop on movement and invalidate the verdict after any material change.

### Verdict ceiling
The final verdict cannot exceed the weakest unresolved mandatory requirement basis or implementation evidence surface.

### Repeated-failure escalation
If a follow-up review after remediation repeats the same or a materially related blocking deviation, require root-cause investigation of assumptions, the full requirement-to-behavior path, adjacent contracts and surfaces, and remediation scope before another point fix.

### Bounded remediation re-audit
Re-audit fixed prior findings on a new stable snapshot against their original requirements, remediation delta, closure evidence, and adjacent contracts. Do not re-evaluate unchanged verified requirements or accept cosmetic edits as closure; widen when authority, requirement meaning, public behavior, or material scope changed or blast radius is unbounded.

## Required active references
- [Methodology](references/methodology.md) — Read this for every review before selecting normative sources, extracting requirements, or judging implementation evidence.
- [Reporting](references/reporting.md) — Read this before assigning requirement statuses or issuing any final verdict.

## Optional references
- [Policy/admission matrix](references/policy-admission-matrix.md) — Read this when normative sources mention policy decisions, admission gates, external consultant invocation, fail-closed behavior, activation decisions, or refusal semantics.

## Bundled assets

- `assets/fixtures/consultant-admission-policy.md` — Portable worked regression oracle for consultant admission policy matrix behavior; not blind or independent behavioral evidence.

## Portability rules

- Do not reference machine-specific absolute paths or local files outside this skill folder.
- Keep all mandatory spec-conformance-reviewer guidance inside this skill folder.
- Use relative links for local references, assets, scripts, tests, and supporting docs.

## Portability checklist before finishing

- Run the skill-source-compiler check command after regeneration.
- Search the skill folder for absolute local paths before finishing.
- Confirm every required reference listed by SKILL.md exists inside this skill folder.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
