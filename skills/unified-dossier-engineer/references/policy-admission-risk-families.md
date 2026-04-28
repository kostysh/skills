# Policy/admission risk families

Use this reference when `plan-slice` or implementation readiness touches policy admission, replay, evidence binding, release policy, or runtime gating.

Use it together with:

- [Delivery workflow layer](delivery-workflow-layer.md)
- [Commandized stage control](commandized-stage-control.md)
- [Audit handoff recipes](audit-handoff-recipes.md)
- [Implementation pre-review checklists](implementation-pre-review-checklists.md)

## Purpose

Policy/admission classification is a `plan-slice` readiness gate for work where execution must be denied, admitted, replayed, released, or runtime-gated according to explicit evidence.

The goal is to force negative evidence into planning before implementation material freezes. This gate is not semantic automation: the runtime records explicit agent input and validates shape, while external review validates sufficiency.

## Taxonomy

The bounded UDE taxonomy is:

| Risk family | Use when |
| --- | --- |
| `admission` | A request, job, decision, item, or action must be explicitly allowed or denied before side effects. |
| `replay` | Repeated, concurrent, conflicting, or resumed execution must fail closed or remain idempotent. |
| `evidence` | The decision depends on persisted evidence, freshness anchors, audit facts, or durable traceability. |
| `release-policy` | The change controls rollout, deployment, release gates, rollback policy, or operator approval gates. |
| `runtime-gating` | A shipped runtime path, invocation boundary, dependency wiring, scheduler, request path, or cell/deployment identity authorizes execution. |

Other skills may reference this guidance by the `unified-dossier-engineer` skill name, but this taxonomy lives inside UDE so the UDE folder remains portable and usable in isolation.

## Classification Contract

Every `plan-slice --ready-for-close` records one classification:

- `policy_admission_risk_profile: "not_applicable" | "applicable"`
- `policy_admission_risk_rationale`
- `policy_admission_risk_families`
- `policy_admission_negative_matrix`
- `policy_admission_matrix_status`
- `policy_admission_matrix_blockers`

`not_applicable` is valid only when:

- no policy/admission risk family applies;
- no `--policy-admission-risk` values are supplied;
- `--policy-admission-risk-rationale <text>` explains the negative classification as bounded machine-readable text.

`applicable` is valid only when:

- at least one bounded risk family is declared;
- every declared family has at least one negative-matrix row;
- every row contains acceptance criterion, risk, negative test, production path, and evidence source.

The runtime must not infer the classification from filenames, diffs, source code, keywords, review findings, dossier prose, or chat summaries.

## Negative Matrix

The matrix shape is:

```text
AC -> risk -> negative test -> production path -> evidence source
```

CLI input uses repeatable DSL rows:

```text
ac=<id>;risk=<admission|replay|evidence|release-policy|runtime-gating>;negative_test=<text>;production_path=<path-or-behavior>;evidence=<path-or-command>
```

Rules:

- `ac` identifies the acceptance criterion or equivalent requirement anchor.
- `risk` must be one of the bounded taxonomy ids above and must be declared through `--policy-admission-risk`.
- `negative_test` names the denial, fail-closed, or blocked path being proven.
- `production_path` names the shipped path, behavior, invocation boundary, or release gate that would otherwise execute.
- `evidence` names the repo-relative artifact, test command, or verification source that proves the negative case.

Runtime validation proves row shape and declared-risk coverage only. It does not prove semantic AC completeness or that evidence is sufficient; required external review owns that judgment.

## Readiness Rules

`plan-slice --ready-for-close` must fail before writing `stage_state: ready_for_close` when classification is missing, `not_applicable` lacks a rationale, an unknown risk id is supplied, an applicable risk has no matrix row, or a row lacks required fields.

`implementation --ready-for-close` rechecks the linked `plan-slice` state. Canonical lookup is `.dossier/stages/<feature_id>/plan-slice.json` for the same `feature_id`; if helper-managed state is absent, the runtime may fall back to the latest `plan-slice` stage log for the same `feature_id`. The linked `plan-slice` must match the implementation `feature_cycle_id`; mismatched cycle identity is stale and blocks readiness. If no linked `plan-slice` state or log exists, legacy/non-commandized flows are treated as `not_required` rather than inventing a policy/admission requirement. When `plan-slice` declared applicable policy/admission risks, implementation readiness remains blocked until the matrix status is `complete`.

Implementation pre-review checklist evidence remains separate. `policy-admission-governance` checklist entries are author-side implementation readiness evidence; they do not replace the `plan-slice` negative matrix and do not satisfy external audit requirements.

## Handoff Expectations

When policy/admission risk is applicable, reviewer handoff should include:

- the selected classification and risk families;
- the negative matrix rows;
- related verification artifacts;
- prior non-PASS review artifacts and process misses, if any.

If a policy/admission FAIL is returned in prose or trace but no immutable FAIL review artifact exists, correction work must stop until the reviewer records the FAIL with `review-artifact --verdict FAIL --must-fix ... --evidence ...`, or the authoring agent records a structured process miss when the original reviewer-owned accounting is unrecoverable.

## Negative Rules

- do not treat `not_applicable` as the default when policy/admission scope was not evaluated;
- do not let implementation material freeze before applicable risk families have matrix coverage;
- do not synthesize historical FAIL review artifacts on behalf of reviewers;
- do not use this planning gate as a substitute for external `spec-conformance-reviewer`, `code-reviewer`, or `security-reviewer` audits.
