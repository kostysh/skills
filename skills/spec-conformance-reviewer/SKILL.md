---
name: spec-conformance-reviewer
description: |
  Review code against normative requirements from specs, contracts, ADRs, tickets, and acceptance
  criteria. Use when asked whether an implementation matches a specification, API contract, PRD,
  RFC, or migration requirement, produce a requirement-to-code traceability matrix, identify
  compliance gaps or ambiguities, or issue an implementation-versus-spec verdict.
---

# Spec Conformance Reviewer

Review implementation against normative requirements, not against general taste. This skill owns requirement extraction, traceability, evidence standards, compliance statuses, and verdict discipline.

## When to Use

- "implementation vs spec", "spec compliance review", or "does this match the spec"
- Verifying a PR, module, or behavior against a feature spec, ADR, RFC, OpenAPI contract, schema, or acceptance criteria
- Producing a requirement extraction table, traceability matrix, verification gaps list, or compliance verdict
- Separating confirmed non-compliance from ambiguity, missing evidence, or pre-existing issues

## When NOT to Use

- General merge-risk or bug-hunting review without normative sources: use `code-reviewer`
- Security-first review: use `security-reviewer`
- Architecture, performance, or style review unless those concerns are explicit in the normative sources
- Authoring or refining a spec instead of checking implementation against it

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
- Do not turn this into a general code-quality review unless the spec makes that dimension normative.
- If critical inputs are missing or contradictory, limit the verdict instead of pretending certainty.

## Fast Workflow

1. Fix the scope and normative sources. Use `references/methodology.md`.
2. Extract atomic requirements with IDs, source, type, priority, and expected behavior.
3. Map implementation surfaces across handlers, orchestration, domain logic, persistence, config, flags, serializers, and tests.
4. Build a traceability matrix from requirements to code and tests.
5. Classify findings, verification gaps, and unspecified behavior.
6. Issue one final verdict using `references/reporting.md`.
7. If the user wants a formal artifact, use the report template in `references/reporting.md`.

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
