# Implementation pre-review checklists

Use this reference when implementation work declares a high-risk family that needs author-side readiness evidence before external review.

Use it together with:

- [Delivery workflow layer](delivery-workflow-layer.md)
- [Commandized stage control](commandized-stage-control.md)
- [Audit policy](audit-policy.md)
- [Audit handoff recipes](audit-handoff-recipes.md)
- [Telemetry and closure](telemetry-and-closure.md)

## Purpose

Implementation pre-review checklists are author-side readiness evidence for explicit high-risk implementation families.

They exist to move obvious high-risk branch checks before external review handoff. They are not correctness proof, not audit evidence, not launch-mode proof, and not a replacement for required external independent audits.

`implementation-discipline` remains general coding discipline. The pre-review checklist mechanism belongs to dossier workflow readiness because it records durable implementation-stage evidence under `.dossier/stages/*` and mirrored implementation log frontmatter.

Protected side-effect preset guidance in `plan-slice` handoff is separate audit-scope content. It does not become a pre-review checklist unless the implementation agent explicitly declares a risk family through the implementation stage controller.

## Explicit declaration rule

Risk-family declarations are explicit agent input.

Rules:

- the runtime must not infer risk families from keywords, filenames, source code, diff heuristics, chat summaries, review findings, or dossier prose;
- undeclared-risk implementation stages do not require pre-review checklist evidence;
- low-risk, documentation-only, and artifact-only implementation stages must not receive irrelevant checklist gates unless the agent explicitly declares a risk family;
- `--risk-family <id>` values are bounded stable identifiers, not prose labels.

## Stage-state schema

The implementation stage state may carry:

- `pre_review_risk_families: string[]`
- `pre_review_checklists: PreReviewChecklistEntry[]`
- `pre_review_checklist_status: "not_required" | "missing" | "blocked" | "complete"`
- `pre_review_checklist_blockers: string[]`

Checklist entry schema:

- `risk_family`
- `id`
- `status: "pass" | "not_applicable" | "blocked"`
- `summary`
- `evidence`
- optional `test_refs: string[]`

`summary`, `evidence`, ids, and test refs must stay bounded single-line machine fields. Narrative detail may live in the stage log body, but it is not the machine source of truth.

The schema and DSL snippets here are runtime command/input contracts for `implementation` stage readiness. They are not prompts for free-form model output; use the stage-controller command and let runtime validation accept or reject the entries.

## CLI input

Only the `implementation` stage-controller accepts checklist inputs:

```text
--risk-family <id>
--pre-review-check <dsl>
```

Checklist DSL:

```text
risk_family=<id>;id=<id>;status=<pass|not_applicable|blocked>;summary=<text>;evidence=<text>;test_refs=<comma-list>
```

Rules:

- `--risk-family` and `--pre-review-check` are rejected on other stage-controller commands;
- checklist entries must reference a declared risk family;
- malformed entries fail before stage artifacts are written;
- repeated entries use stable `(risk_family, id)` identity and the latest explicit value wins inside one stage cycle.

## Built-in policy-admission-governance checklist

The built-in `policy-admission-governance` risk family requires these checklist ids:

- `explicit-allow-deny`
- `deny-or-failed-admission-no-invocation`
- `conflicting-request-replay-fail-closed`
- `ambiguous-stale-unsupported-evidence`
- `freshness-timestamp-required`
- `active-scope-concurrency-model`
- `append-only-decision-audit-facts`
- `regression-test-paths`

These ids cover explicit allow/deny behavior, failed-admission no-invocation behavior, conflicting replay fail-closed behavior, missing or stale evidence behavior, freshness timestamp handling, active-scope concurrency, append-only decision/audit facts, and regression test paths.

## Custom risk families

Custom risk families are allowed without core runtime domain changes.

Generic runtime behavior:

- the runtime does not know domain-required ids for custom families;
- each declared custom family requires at least one `pass` or `not_applicable` checklist entry;
- any `blocked` checklist entry makes the family blocked;
- richer custom-family semantics belong in project-level docs or tests, not in this generic runtime contract.

## Readiness evaluation

Readiness status is evaluated on each `implementation` stage-controller write:

- no declared risk families -> `not_required`;
- declared family with missing required evidence -> `missing`;
- any `blocked` entry -> `blocked`;
- declared families with complete non-blocked evidence -> `complete`.

`implementation --ready-for-close` must fail before writing `stage_state: ready_for_close` when checklist status is `missing` or `blocked`.

Complete checklist evidence only means the author-side readiness gate is satisfied. External reviewers may use it as context, but required `spec-conformance-reviewer`, `code-reviewer`, and `security-reviewer` audits remain governed solely by [Audit policy](audit-policy.md).
