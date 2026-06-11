---
name: spec-conformance-reviewer
description: >-
  Review code against normative requirements from specs, contracts, ADRs,
  tickets, and acceptance

  criteria. Use when asked whether an implementation matches a specification,
  API contract, PRD,

  RFC, or migration requirement, produce a requirement-to-code traceability
  matrix, identify

  compliance gaps or ambiguities, or issue an implementation-versus-spec
  verdict.
metadata:
  source-version: 0.1.2
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 38e07b71d9bccb7b0bde0285181104fe05bb1fc6934bd23d5887e0735ad478b8
---

# spec-conformance-reviewer

## Start here

1. Confirm the task matches spec-conformance-reviewer's applicability criteria.
2. Use the preserved overview guidance as the normative workflow for this skill.
3. Load only the active references that match the current task.
4. Preserve existing project conventions unless the overview explicitly requires a stricter invariant.

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

Review implementation against normative requirements, not against general taste. This skill owns requirement extraction, traceability, evidence standards, compliance statuses, and verdict discipline.

## Skill Interop (Priority)

- This skill owns normative source priority, requirement extraction, traceability, compliance statuses, verification gaps, and implementation-versus-spec verdicts.
- `code-reviewer` owns general merge-risk findings, non-spec regressions, and lightweight intent checks.
- `security-reviewer` owns exploitability, attack paths, and vulnerability classification.
- Domain skills own stack-specific correctness facts and remediation detail.
- If both this skill and `code-reviewer` are active, keep spec-backed findings here and move non-spec findings to `code-reviewer`.

## Normative Source Priority

Use the highest-priority source available:

1. Formal contracts: OpenAPI, GraphQL schema, protobuf, JSON Schema, protocol spec, database contract
2. Approved feature spec or product requirements document
3. Acceptance criteria that are explicitly treated as normative
4. ADR, RFC, or design doc that defines mandatory behavior or constraints
5. Tests or reference behavior only when they are explicitly normative

If sources conflict, do not silently choose one. Record the conflict, cite both sources, and downgrade the affected requirement to `ambiguous_spec` or a blocked verdict.

## Non-Negotiables

- Read the normative sources before reading implementation details.
- Extract atomic requirements explicitly with IDs instead of keeping them implicit.
- Tie every conclusion to both a requirement source and implementation evidence.
- Distinguish non-compliance, partial coverage, ambiguity, missing evidence, and out-of-scope observations.
- Check both directions:
  - requirement to code and tests
  - code behavior to requirement basis
- Treat tests as evidence, not as proof by existence.
- Distinguish observable runtime capability from substrate such as schema presence, route registration, OpenAPI entries, mock handlers, in-memory tests, or documentation claims.
- For auth/RBAC requirements, check both API/service behavior and persistence/RLS/direct data-access behavior when the system exposes such a path.
- For audit/security-event requirements, verify write-class semantics, capture durability, and failure behavior; an event name alone is not evidence.
- Do not turn this into a general code-quality review unless the spec makes that dimension normative.
- Build the conditional policy/admission matrix only when normative sources trigger it; every row needs requirement basis.
- If critical inputs are missing or contradictory, limit the verdict instead of pretending certainty.

## Fast Workflow

1. Fix the scope and normative sources. Use `references/methodology.md`.
2. Extract atomic requirements with IDs, source, type, priority, and expected behavior.
3. If policy/admission triggers are present, build the bounded matrix from `references/policy-admission-matrix.md`.
4. Map implementation surfaces across handlers, orchestration, domain logic, direct data access, persistence, config, flags, serializers, long-lived lifecycles, audit capture, and tests.
5. Build a traceability matrix from requirements to code and tests.
6. Classify findings, verification gaps, and unspecified behavior.
7. Issue one final verdict using `references/reporting.md`.
8. If the user wants a formal artifact, use the report template in `references/reporting.md`.

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
- tests that actually prove the required behavior
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

- Findings must cite requirement IDs, spec basis, implementation evidence, impact, and fix direction.
- Separate confirmed non-compliance from ambiguity, verification gaps, and non-blocking observations.
- If the output is compressed for chat, keep at minimum:
  - scope and sources
  - requirement coverage summary
  - findings
  - verification gaps
  - final verdict
- Separate issues introduced by the current change from pre-existing issues surfaced during review.

## Reference Map

Read only what you need:

- `references/methodology.md` - source priority, scope rules, extraction workflow, traceability, evidence, and ambiguity handling
- `references/reporting.md` - statuses, severities, verdicts, report template, and wording rules
- `references/policy-admission-matrix.md` - optional bounded matrix for policy/admission reviews with normative triggers

## Workflow stages

### Workflow stage: Apply spec-conformance-reviewer guidance

Apply the preserved spec-conformance-reviewer guidance without changing its domain behavior.

1. Match the request to the applicability criteria.
2. Follow the preserved overview sections for the concrete work.
3. Read the smallest relevant active reference before using detailed guidance from it.
4. Run the relevant verification from the overview or report why it could not be run.

Validation:

- The outcome follows the preserved skill guidance and any loaded reference constraints.

## Required active references
- [Methodology](references/methodology.md) — Read this when you need source priority, scope rules, extraction workflow, traceability, evidence, and ambiguity handling.
- [Reporting](references/reporting.md) — Read this when you need statuses, severities, verdicts, report template, and wording rules.

## Optional references
- [Policy/admission matrix](references/policy-admission-matrix.md) — Read this when normative sources mention policy decisions, admission gates, external consultant invocation, fail-closed behavior, activation decisions, or refusal semantics.

## Bundled assets

- `assets/fixtures/consultant-admission-policy.md` — Portable review fixture for consultant admission policy matrix behavior.

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
