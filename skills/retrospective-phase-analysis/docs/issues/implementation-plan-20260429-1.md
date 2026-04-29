# Implementation Plan

## Language

Русский.

## Plan ID

`implementation-plan-20260429-1`

## Related Issue

`issue-20260429-1` - `docs/issues/issue-20260429-1.md`.

## Source Artifacts

- `docs/issues/issue-20260429-1.md`.
- `AGENTS.md`.
- `skill.yaml`, `fragments/*`, `references/*`, `src/*`, `test/*`, `package.json`.
- Generated `SKILL.md`, `docs/compile-report.md`, `scripts/retro-cli.mjs`.
- `references/CLI.md`.
- `src/core/types.ts`.
- `src/core/build-scan-summary.ts`.
- `src/core/infer-candidate-incidents.ts`.
- `src/core/summarize-logs.ts`.
- `src/core/extract-trace-scope.ts`.
- `src/render/report-markdown.ts`.
- `src/render/logging-review-markdown.ts`.
- `src/render/problem-matrix-markdown.ts`.
- `test/scan.test.ts` and contract/snapshot fixtures touched by scan output.

## Objective

`retrospective-phase-analysis scan` должен сохранять duplicate trace-only non-PASS review signals as context, но классифицировать earlier duplicates as `historical` или `superseded` when complete bounded stage evidence already covers the same review scope. Такие context-only duplicates не должны завышать actionable metrics, `CandidateIncident`, `reportStatus.reasons` или problem matrix, while late/unmatched/uncertain signals remain active and validation-required.

## Assumptions

- Skill is code-backed generated: implementation updates source bundle first, regenerates `SKILL.md`, `docs/compile-report.md`, and built `scripts/*`.
- Complete bounded stage evidence means `rpa_source_quality.review_history_quality: complete`.
- Matching must be conservative. If scope, audit class, round, commit, timestamp/order, or artifact identity is missing or ambiguous, the signal remains `active_unmatched`.
- Classification is additive or contract-versioned so existing consumers can handle it safely.
- Trace-derived source quality remains visible; classification must not rewrite trace-only evidence into structured review truth.

## Scope

Входит в scope:

- `ReviewSignal` type/schema extension or adjacent compatible field for `classification: active_unmatched | historical | superseded`;
- matching logic for duplicate trace-only review signals against complete bounded stage evidence;
- filtering for `reviewFindingsTotal`, `CandidateIncident`, `stageLogs.metrics.sources.candidate_incidents`, `reportStatus.reasons`, and problem matrix;
- Markdown rendering for historical/superseded context and unresolved active signals;
- `stage_log_candidates[].next_action` / `reportStatus.reasons` guidance for `referenced_only` candidates needing `--stage-log ... --artifact-evidence ...`;
- `references/CLI.md`, help/snapshots, tests, generated outputs, and built CLI parity.

Не входит в scope:

- changing UDE producer artifacts;
- treating trace-only mentions as structured review truth;
- broad-scanning `.dossier/stages/*`;
- adding a new sidecar validation document;
- removing agent validation requirement for uncertain or unmatched signals.

## Proposed Changes

1. Extend `ReviewSignal` contract:
   - add `classification` or compatible field with values `active_unmatched`, `historical`, `superseded`;
   - preserve `source_quality: trace_derived`;
   - preserve `matching_artifact: false` when no immutable artifact matched.
2. Build conservative duplicate matching:
   - complete state source: included stage log/stage state with `rpa_source_quality.review_history_quality: complete`;
   - compare strongest available fields: feature/backlog id, stage, audit class, round/artifact identity, commit/event commit, timestamp/order, finding count/verdict summary;
   - classify earlier duplicate trace-only signal as `historical` or `superseded`;
   - classify later, different, incomplete, or ambiguous signal as `active_unmatched`.
3. Update scan aggregation:
   - historical/superseded duplicates remain in `reviewSignals` context;
   - they do not increase actionable/unresolved `reviewFindingsTotal`;
   - they do not create `CandidateIncident`;
   - they do not degrade `stageLogs.metrics.sources.candidate_incidents`;
   - they do not add blocking `reportStatus.reasons`.
4. Keep active signals actionable:
   - `active_unmatched`, uncertain, later timestamp/order, different audit class, different round, different commit, or ambiguous scope continue to affect metrics, candidate incidents, report status, and problem matrix.
5. Update rendering:
   - `report-markdown` and `logging-review-markdown` display historical/superseded trace-only signals separately from unresolved unmatched signals;
   - `problem-matrix-markdown` uses unresolved unmatched signals for actionable gaps and historical/superseded signals only as context.
6. Update manual stage-log guidance:
   - `referenced_only` candidate next action instructs rerun with explicit `--stage-log ... --artifact-evidence ...`;
   - `reportStatus.reasons`, generated Markdown, `references/CLI.md`, and help/snapshot fixtures stay aligned.

## Implementation Steps

1. Add classification type in `src/core/types.ts` and update serialization/golden expectations.
2. Implement a small pure classifier near scan-summary construction, with isolated tests for complete bounded stage evidence and trace-derived signals.
3. Wire classifier into `build-scan-summary` before metrics/incidents/report status are finalized.
4. Update `logSummaryWithTraceReviewSignals` or equivalent aggregation so context-only duplicates do not change unresolved/actionable counts.
5. Update `infer-candidate-incidents` to ignore historical/superseded duplicates and keep active_unmatched trace signals actionable.
6. Update `buildReportStatus` to ignore historical/superseded duplicates for blocking reasons and keep active_unmatched reasons.
7. Update renderers and problem matrix generation to show context separately and filter actionable rows correctly.
8. Update `extract-trace-scope` / scan output guidance for `referenced_only` candidates if current next action is not explicit enough.
9. Update `references/CLI.md`, help/snapshot/golden fixtures, `skill.yaml` or fragments if active instructions change.
10. Build/regenerate generated outputs and review generated diff.
11. Run focused tests, then full package verification.

## Verification Plan

- Unit/regression test: complete bounded stage state plus earlier trace-only non-PASS mention produces `classification: historical` or `superseded`, no unresolved `reportStatus.reasons`, no trace-derived `CandidateIncident`, no double count in `reviewFindingsTotal`, and no degraded `stageLogs.metrics.sources.candidate_incidents`.
- Unit/regression tests: later timestamp/order, different audit class, different round, different commit, and ambiguous scope each produce `classification: active_unmatched`, keep `draft_requires_agent_validation`, create `CandidateIncident`, and keep problem matrix row.
- Golden/snapshot update for `scan-summary.json` containing classification field or compatible output.
- Markdown tests for report/logging review showing historical/superseded context separately from unresolved unmatched signals.
- Problem matrix tests verifying historical/superseded context is not emitted as an actionable row.
- `referenced_only` fixture verifies `stage_log_candidates[].next_action`, `reportStatus.reasons`, and rendered guidance include `--stage-log ... --artifact-evidence ...`.
- `references/CLI.md` and help/snapshots reflect output contract changes.
- `skill-source-compiler regenerate` for `skills/retrospective-phase-analysis`.
- `skill-source-compiler check` for `skills/retrospective-phase-analysis`.
- `pnpm --filter @kostysh/retrospective-phase-analysis-cli typecheck`.
- `pnpm --filter @kostysh/retrospective-phase-analysis-cli lint`.
- `pnpm --filter @kostysh/retrospective-phase-analysis-cli test`.
- Portability check: no absolute local paths and no required external files outside the skill folder.
- External independent audit of the implementation package before final close.

## Risks and Side Effects

- Misclassification can hide a real late or different review. Mitigation: conservative matching; uncertain/different/later signals remain `active_unmatched`.
- New field can break consumers. Mitigation: additive or versioned output contract, docs update, golden fixtures, and compatibility review.
- Metrics can remain noisy if only rendering changes. Mitigation: test aggregation, incidents, report status, and problem matrix together.
- Source quality can be lost. Mitigation: preserve `source_quality: trace_derived`, `matching_artifact`, and rendered context.
- Generated/built artifacts can drift. Mitigation: source-first edits, build/regenerate, package tests, compiler check.

## Rollback Plan

Revert the implementation commit touching `skill.yaml`, `fragments/*`, `references/*`, `src/*`, `test/*`, generated `SKILL.md`, `docs/compile-report.md`, built `scripts/*`, snapshots, and package/version files. If output contract was consumed externally before rollback, add a rollback note that `classification` is no longer emitted and trace-only review signals return to previous active-unmatched behavior.

## Independent Audit

Audit status: `PASS`

Auditor: Hilbert, external agent audit, `gpt-5.5` medium.

Audit criteria:
- Conformance to the related issue.
- Coverage of all source artifacts describing the problem.
- Sufficiency and safety of the proposed implementation.

Audit notes: Проверены issue, implementation plan, template, оба `AGENTS.md`, `SKILL.md`, `references/CLI.md`, core path `reviewSignals -> reviewFindingsTotal -> CandidateIncident -> candidate_incidents -> reportStatus.reasons`, renderers, problem matrix, `test/scan.test.ts` и contract/snapshot fixtures. План соответствует issue, учитывает code-backed-generated maintenance, source-first regeneration, docs/runtime/tests parity, and protects late/unmatched/uncertain signals through `active_unmatched`.

Required corrections: Нет.

Final status: `PASS`
