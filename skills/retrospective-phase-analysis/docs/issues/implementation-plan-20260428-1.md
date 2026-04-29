# Implementation Plan

## Language

План написан на русском языке.

## Plan ID

`implementation-plan-20260428-1`

## Related Issue

`issue-20260428-1` — [issue-20260428-1.md](issue-20260428-1.md)

## Source Artifacts

- [issue-20260428-1.md](issue-20260428-1.md) — audited issue, problem statement, proposed resolution, destructive-side-effect mitigations and verification expectations.
- `unified-dossier-engineer` issue `issue-20260428-2` — producer-side context for structured non-PASS review events, selected closure bundle, review round identity, source identity and source-quality expectations. RPA consumes those fields but does not own their production.
- `unified-dossier-engineer` active producer contract:
  - `references/telemetry-and-closure.md` — parity-protected selected closure bundle fields and RPA producer fields: `rpa_source_identity`, `rpa_source_quality`, `non_pass_review_events`, plus `review_history_quality` derivation rules.
  - `references/commandized-stage-control.md` and `references/audit-policy.md` — closure summary and RPA producer field references.
  - `src/shared/stage-state.ts`, `src/delivery/stage-control.ts`, `src/unified-cli.ts`, and `src/vendor/dossier-engineer/commands.ts` — runtime field serialization/deserialization and stage close-out production.
  - `test/docs-contract.test.ts` and `test/cli.test.ts` — producer-side contract tests for selected closure bundle and RPA fields.
- `SKILL.md` — generated active skill contract for trace-driven scoping, data-quality limits, agent-context factors, report status and CLI workflow.
- `skill.yaml` and `fragments/overview.md` — source inputs for generated `SKILL.md`.
- `references/CLI.md` — public CLI contract for `scan`, `report`, `skill-audit`, `logging-review`, artifact candidates, metric sources, report status and bundle workflow.
- `references/REFERENCE.md` — detailed evidence hierarchy, scope derivation, metric precedence, data-quality rules, recommendation discipline and anti-patterns.
- `references/REPORT-TEMPLATE.md`, `references/SKILL-AUDIT-TEMPLATE.md`, `references/LOGGING-IMPROVEMENTS-TEMPLATE.md` — active report templates affected by validation metadata, evidence quality and problem-matrix guidance.
- Runtime surfaces: `src/core/build-scan-summary.ts`, `src/core/extract-trace-scope.ts`, `src/core/artifact-evidence.ts`, `src/core/summarize-logs.ts`, `src/core/infer-candidate-incidents.ts`, `src/core/types.ts`, `src/parsers/stage-log.ts`, `src/render/report-markdown.ts`, `src/render/logging-review-markdown.ts`, `src/render/skill-audit-markdown.ts`, `src/cli/command-registry.ts`, `src/commands/*`.
- Test surfaces: `test/scan.test.ts`, `test/report.test.ts`, `test/cli.test.ts`, `test/cli-contract-snapshots.test.ts`, `test/docs-contract.test.ts`, `test/fixtures/*`, `test/evaluation-contract.md`.
- Generated or derived outputs to refresh after implementation: `scripts/retro-cli.mjs`, `scripts/retro-cli.mjs.map`, `SKILL.md`, `docs/compile-report.md`.

Historical provenance named in the issue is optional context. The implementation must use synthetic portable fixtures instead of depending on the originating project session or local runtime paths.

## Objective

Strengthen dossier-driven retrospective reconstruction so RPA can:

- discover relevant stage evidence from more durable dossier anchors without broad-scanning project history;
- represent review metrics with explicit source quality instead of treating mixed evidence as structured truth;
- include trace-derived and prose-derived non-PASS review history without hiding that durable FAIL artifacts are missing;
- generate an actionable `problem-matrix-by-skill.md` grouped by reusable skill/process root causes;
- expose machine-readable validation metadata that separates generated scaffolds from agent-validated final reports;
- consume future UDE producer fields while preserving trace/prose fallback as lower-quality evidence.

The implementation must preserve the existing conservative scoping rules: no feature-id fan-out by itself, no hardcoded runtime session-store layout and no project-specific heuristics.

## Assumptions

- This remains a code-backed generated skill. Source bundle, runtime source and tests are edited first; generated `scripts/*`, `SKILL.md` and `docs/compile-report.md` are regenerated from source.
- Existing `RPA-05` and `RPA-06` behavior remains valid and must not regress: `referenced_only` stage logs stay excluded until validated, compaction remains agent context rather than evidence loss, and catalog/name-only skill matches remain ignored.
- New scan-summary fields are additive where possible. If existing metric quality enum values must change, compatibility is handled through schema/version notes, renderer tolerance and snapshot updates.
- UDE structured producer fields may not exist yet in real projects. RPA must accept them when available but keep trace/prose extraction as fallback evidence with non-structured source quality.
- Final validation is an agent-owned step. Runtime-generated scaffolds start with `agent_validated: false`; after the agent has validated cited evidence, a narrow CLI command records `agent_validated: true` and the validation scope/notes supplied by the agent. The command records the result; it does not perform the validation itself.
- Problem-matrix rows are generated from available evidence as a draft grouping, not as final root-cause truth until the agent validates them.

## Scope

Входит в scope:

- Stage-log and evidence discovery from stage state artifacts, explicit `log_path` fields, command outputs, direct changed stage/log files and trace-linked dossier artifacts.
- Discovery provenance persisted in `scan-summary.json`, including manual overrides as fallback/manual evidence.
- Review metric source labels for `structured`, `trace_derived`, `prose_derived` and `incomplete` evidence.
- Extraction of non-PASS review signals from structured UDE fields, stage-log metadata, bounded stage state, trace reviewer notifications and stage-log prose.
- Incomplete metric marking when non-PASS signals exist without matching immutable review artifacts.
- Generated `problem-matrix-by-skill.md` as part of the standard retrospective bundle.
- Machine-readable validation metadata: `agent_validated`, `validated_scope`, `manual_overrides`, `residual_confidence`, `validation_notes`.
- RPA consumer-side contract for active UDE producer fields: `rpa_source_identity`, `rpa_source_quality`, and `non_pass_review_events`, including `review_history_quality`, selected-bundle quality and missing/trace-only FAIL counters.
- Active references, CLI help, tests, fixtures, snapshots and generated outputs required by the changed behavior.
- Instruction-quality audit after active instruction changes, recorded in the implementation log.

Не входит в scope:

- Changing UDE runtime or producing UDE artifacts.
- Hardcoding Codex, Claude Code or any other runtime-specific session-store path into the portable CLI contract.
- Broad-scanning `.dossier/stages/*`, `.dossier/reviews/*` or `.dossier/logs/*` by feature id alone.
- Treating trace/prose-derived FAILs as immutable structured review truth.
- Rewriting the whole report narrative or replacing agent-authored final analysis.
- Backfilling historical FAIL review artifacts as if the original reviewer wrote them.

## Proposed Changes

- Add fixture families under `test/fixtures/rpa-07/`:
  - stage evidence discoverable through a bounded stage state artifact and `log_path`;
  - command-output and changed-file cases that prove scan discovery can find stage logs without broad directory fan-out;
  - trace reviewer notification `FAIL` with no matching review artifact;
  - stage-log prose `FAIL` with no matching structured artifact;
  - UDE-style structured non-PASS review events and selected closure bundle fields;
  - mixed evidence that should generate `problem-matrix-by-skill.md`;
  - generated scaffold versus agent-validated metadata examples.
- Update `src/core/types.ts`:
  - add a scan-summary schema/version marker;
  - add discovery provenance types for evidence anchors, manual overrides and fallback sources;
  - add review signal types with `source_quality`, `audit_class`, `round`, `commit`, `artifact_path`, `matching_artifact`, `source_identity` and evidence excerpts where available;
  - add validation metadata to `reportStatus` or a clearly named adjacent `validation` object with `agent_validated`, `validated_scope`, `manual_overrides`, `residual_confidence`, `validation_notes`, `validated_at` and `validated_by`;
  - extend `RetroOutputLayout.files` with `problemMatrixBySkill`.
- Update `src/core/extract-trace-scope.ts` and `src/core/artifact-evidence.ts`:
  - recognize explicit `log_path` and bounded stage-state links as stage-log discovery anchors;
  - classify command-output paths only when the surrounding event is a write/change or authoritative producer output, not read-only prose;
  - preserve `referenced_only` and read-only tool output as excluded candidates with precise `reason` and `next_action`;
  - record why each candidate was included, excluded, or manually included.
- Update `src/core/summarize-logs.ts`, `src/parsers/stage-log.ts` and `src/core/infer-candidate-incidents.ts`:
  - parse active UDE producer fields when present: `rpa_source_identity`, `rpa_source_quality`, `non_pass_review_events`, selected closure bundle fields and `review_events`;
  - map UDE `review_history_quality: complete | process_miss | limited` into RPA source-quality and incomplete metric semantics;
  - normalize trace/prose non-PASS signals into the same internal `ReviewSignal` shape with lower source quality;
  - count `reviewFindingsTotal` and candidate incidents without double-counting structured and fallback signals;
  - mark aggregates as `incomplete` when a non-PASS signal lacks a matching immutable review artifact.
- Update `src/core/build-scan-summary.ts`:
  - persist discovery provenance and review signal summaries in `scan-summary.json`;
  - keep manual overrides recorded as manual/fallback source evidence;
  - set generated validation metadata to `agent_validated: false`;
  - make `reportStatus.reasons` mention incomplete mixed-source review metrics and missing immutable FAIL artifacts.
- Add a concrete validation-recording surface:
  - implement a `validate` CLI command that requires `--run-dir <dir>`, `--validated-scope <text>`, `--residual-confidence <high|medium|low>`, and `--validation-notes <text>`;
  - the command updates the run directory's machine-readable validation metadata to `agent_validated: true`, writes `validated_at` and `validated_by` when provided, and preserves the original generated evidence fields;
  - if manual overrides or incomplete source-quality metrics remain, the command records them in `manual_overrides` and `validation_notes` instead of erasing `reportStatus.reasons`;
  - tests must prove generated scaffolds default to false and the command records true only from explicit agent-supplied validation input.
- Add a new problem-matrix renderer and command:
  - implement `src/render/problem-matrix-markdown.ts`;
  - add a `problem-matrix` command that writes `problem-matrix-by-skill.md` into the run directory;
  - include columns `ID`, `Проблема`, `Скил, содержащий проблему`, `Предложение по решению проблемы`;
  - group rows by reusable root cause and keep project-specific symptoms as evidence, not as the primary remediation target;
  - update `src/cli/command-registry.ts`, command help, golden snapshots and CLI reference so the command is a real shipped surface.
- Update existing renderers:
  - `report-markdown.ts`: render discovery provenance, source-quality summaries, validation metadata and incomplete review metric warnings;
  - `logging-review-markdown.ts`: surface missing structured non-PASS artifacts as telemetry gaps;
  - `skill-audit-markdown.ts`: reference problem-matrix follow-up only when skill-related evidence exists.
- Update active docs:
  - `references/CLI.md`: document schema/version marker, `problem-matrix`, `validate`, validation metadata, source-quality labels and active UDE consumer fields;
  - `references/REFERENCE.md`: define evidence provenance, review source-quality precedence, matrix grouping rules and `validate` command limits;
  - `references/REPORT-TEMPLATE.md`: add validation metadata and problem-matrix expectations;
  - `references/LOGGING-IMPROVEMENTS-TEMPLATE.md`: add durable non-PASS review artifact gaps and producer/consumer boundary wording;
  - `references/SKILL-AUDIT-TEMPLATE.md`: align skill/process root-cause grouping rules if matrix rows use skill names;
  - `fragments/overview.md` and `skill.yaml`: add only short active rules needed in generated `SKILL.md`.
- Regenerate outputs:
  - rebuild runtime into `scripts/retro-cli.mjs` and map;
  - regenerate/check generated `SKILL.md` and `docs/compile-report.md`;
  - update `docs/README.md` and create an implementation log during the implementation phase.

## Implementation Steps

1. Add failing fixtures for `RPA-07` evidence discovery, non-PASS review history, UDE structured input, problem matrix and validation metadata.
2. Add failing tests in the smallest relevant files:
   - `test/scan.test.ts` for discovery provenance, source-quality labels, incomplete review metrics and UDE consumer fields;
   - `test/report.test.ts` for report/logging-review rendering and problem-matrix Markdown;
   - `test/cli.test.ts` and `test/cli-contract-snapshots.test.ts` for the new `problem-matrix` and `validate` commands, validation metadata update behavior and output layout;
   - `test/docs-contract.test.ts` for active docs/runtime parity;
   - `test/evaluation-contract.md` for the new minimum quality scenarios.
3. Introduce additive types and schema/version fields in `types.ts`, keeping renderers tolerant of legacy scan summaries where practical.
4. Extend trace and artifact discovery with bounded `log_path`, stage-state and command-output handling, preserving current exclusion behavior for weak candidates.
5. Add internal review-signal normalization from active UDE fields (`rpa_source_identity`, `rpa_source_quality`, `non_pass_review_events`), stage metadata, bounded stage state, trace notifications and prose sections.
6. Update metrics aggregation so structured evidence wins, fallback signals are labeled `trace_derived` or `prose_derived`, and missing immutable artifacts produce `incomplete` aggregate status.
7. Render source-quality and validation metadata in generated reports without claiming agent validation.
8. Implement the `validate` command that records final agent validation metadata without claiming automated validation.
9. Implement `problem-matrix` runtime command and renderer, then wire it into output layout, help text and docs as a shipped command.
10. Update active references, source bundle fragments and docs-contract tests to match runtime behavior.
11. Run format/build/test/typecheck/lint, regenerate generated outputs, run skill-source-compiler check and perform the instruction-quality audit workflow stage.
12. Create `docs/logs/implementation-log-20260428-1.md` during implementation and update `docs/README.md`.

## Verification Plan

- `pnpm --filter @kostysh/retrospective-phase-analysis-cli test`
- `pnpm --filter @kostysh/retrospective-phase-analysis-cli typecheck`
- `pnpm --filter @kostysh/retrospective-phase-analysis-cli lint`
- `pnpm --filter @kostysh/retrospective-phase-analysis-cli build`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint skills/retrospective-phase-analysis`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/retrospective-phase-analysis`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/retrospective-phase-analysis`
- Instruction-quality audit against the `Audit instruction quality` workflow stage from `skill-source-compiler`, recorded in the implementation log.
- Portability scan for absolute local paths and Windows drive paths in `skills/retrospective-phase-analysis`.
- Manual fixture walkthrough:
  - confirm stage logs are discovered through the new bounded evidence anchors and not through broad feature-id fan-out;
  - confirm manual overrides are recorded as fallback/manual provenance;
  - confirm trace/prose non-PASS signals are counted with source-quality labels and incomplete aggregate status when immutable artifacts are absent;
  - confirm active UDE producer fields `rpa_source_identity`, `rpa_source_quality`, and `non_pass_review_events` are consumed as structured evidence when present;
  - confirm `problem-matrix-by-skill.md` exists in the run directory and uses the required columns;
  - confirm generated scaffolds have `agent_validated: false` and `validate --run-dir ...` records `agent_validated: true` only from explicit agent-supplied validation scope, confidence and notes;
  - confirm `RPA-05` and `RPA-06` regression fixtures still pass.

## Risks and Side Effects

- Risk: broader discovery accidentally includes unrelated dossier logs.
  - Mitigation: require bounded trace/stage-state/log-path anchors and preserve existing excluded candidate behavior for weak evidence.
- Risk: changing metric source labels breaks downstream consumers.
  - Mitigation: add a schema/version marker, document compatibility, update snapshots and keep renderers tolerant of legacy summaries.
- Risk: trace/prose-derived FAILs become mistaken for durable review artifacts.
  - Mitigation: label them `trace_derived` or `prose_derived`, mark aggregates `incomplete`, and require matching immutable artifacts before treating them as structured truth.
- Risk: adding `problem-matrix` expands the CLI surface and standard bundle.
  - Mitigation: ship runtime, help, docs and tests together; do not document the command before it exists.
- Risk: adding `validate` could be mistaken for automated evidence validation.
  - Mitigation: require explicit agent-supplied scope, confidence and notes; document that the command only records validation already performed by the agent.
- Risk: validation metadata creates false confidence.
  - Mitigation: generated scaffolds always start with `agent_validated: false`; only the explicit validation-recording command may set it true with scope, residual confidence and notes.
- Risk: UDE and RPA contract rollout is asynchronous.
  - Mitigation: consume structured producer fields additively and keep lower-quality fallback extraction for older artifacts.
- Risk: generated artifacts drift from source.
  - Mitigation: rebuild/regenerate from source and run skill-source-compiler check before completion.
- Destructive side effects: none expected beyond intentional scan-summary schema/output additions and new bundle artifact. These must be covered by compatibility notes and tests.

## Rollback Plan

Revert the `RPA-07` changes: fixtures/tests, discovery and review-signal runtime changes, source-quality/schema changes, validation metadata, `validate` command, problem-matrix command/renderer, CLI help snapshots, active references, `skill.yaml` or `fragments/overview.md`, regenerated `scripts/*`, generated `SKILL.md`, `docs/compile-report.md`, docs navigation and implementation log. Then rerun package tests and `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/retrospective-phase-analysis` to confirm the skill returns to a consistent prior state.

## Independent Audit

Audit status: `REVIEWED`

Auditor: `Mencius`, `Volta`

Audit criteria:
- Conformance to the related issue.
- Coverage of all source artifacts describing the problem.
- Sufficiency and safety of the proposed implementation.
- Preservation of RPA/UDE producer-consumer boundary and portability constraints.

Audit notes:
- First audit by `Mencius` returned `FAIL`: the plan did not define a concrete surface for recording final validation metadata and did not pin the RPA consumer contract to active UDE producer fields.
- Corrections added:
  - a concrete `validate` CLI command that records `agent_validated: true` only from explicit agent-supplied validation scope, confidence and notes;
  - active UDE producer contract sources and exact fields: `rpa_source_identity`, `rpa_source_quality`, `non_pass_review_events`, `review_history_quality`, and selected closure bundle fields.
- Second audit by `Volta` returned `PASS`. The auditor confirmed that final validation recording is concrete, the UDE consumer contract is tied to active producer surfaces, bounded discovery and portability constraints are preserved, and new command surfaces are planned with runtime/help/docs/tests parity.

Required corrections:
- None after second audit.

Final status: `PASS`
