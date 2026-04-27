# Implementation Plan

## Language

План написан на русском языке.

## Plan ID

`implementation-plan-20260425-1`

## Related Issue

`RPA-06` — [issue-20260425-1.md](issue-20260425-1.md)

## Source Artifacts

- [issue-20260425-1.md](issue-20260425-1.md) — audited issue, acceptance criteria, constraints, risks and non-goals.
- `SKILL.md` — generated active skill contract for evidence hierarchy, data-quality limits, phase boundary and report structure.
- `AGENTS.md` — code-backed generated skill maintenance contract: source bundle first, then regenerate generated outputs.
- `skill.yaml` and `fragments/overview.md` — source inputs for generated `SKILL.md`.
- `references/REFERENCE.md` — active detailed method reference for evidence hierarchy, confidence, recommendation structure and anti-patterns.
- `references/REPORT-TEMPLATE.md` — active main report template where `Data-quality limits` currently has no separate agent-context section.
- `references/LOGGING-IMPROVEMENTS-TEMPLATE.md` — active logging review template where schema changes need explicit existing-mechanism checks first.
- `references/CLI.md` — public CLI/reporting contract for `scan`, `report`, `logging-review`, `reportStatus`, data-quality notes and scaffold behavior.
- Runtime surfaces: `src/core/summarize-session.ts`, `src/core/build-scan-summary.ts`, `src/core/types.ts`, `src/render/report-markdown.ts`, `src/render/logging-review-markdown.ts`.
- Test surfaces: `test/report.test.ts`, `test/scan.test.ts`, `test/docs-contract.test.ts`, `test/cli-contract-snapshots.test.ts`, `test/fixtures/*`, `test/evaluation-contract.md`.
- Generated or derived outputs to refresh after implementation: `SKILL.md`, `docs/compile-report.md`, `scripts/retro-cli.mjs`, `scripts/retro-cli.mjs.map`.

Historical evidence from the source retrospective is referenced by the issue and is not a portable prerequisite for this plan.

## Objective

Разделить в активных инструкциях, CLI-generated Markdown и regression coverage два разных понятия:

- `Data quality` — доступность и надежность evidence sources.
- `Agent-context factors` — факторы контекста исполнения, которые могли повлиять на поведение агента, но не означают потерю evidence.

После реализации `compacted` при доступном и успешно parsed raw trace не должен попадать в data-quality limitations, но может быть отображен как agent-context factor. Рекомендации по logging/schema должны сначала проверять existing canonical artifacts, workflow sequencing and prompt recipes, а schema/log expansion предлагать только после такой проверки.

## Assumptions

- Навык остается code-backed generated skill; правки идут сначала в source bundle, runtime and tests, затем обновляются generated artifacts.
- `compacted` является agent-context factor только когда raw trace доступен и parsed; если trace missing или has parse errors, это остается real data-quality limit.
- Runtime может сохранить текущие `dataQuality` fields и добавить только additive agent-context representation, чтобы не ломать существующих consumers.
- Default report должен остаться компактным: agent-context section перечисляет только material factors или коротко говорит, что автоматический scaffold их не обнаружил.
- Recommendation discipline не запрещает schema changes; она требует видимого preference order и justification after existing mechanisms are checked.
- Regression fixtures должны быть synthetic and portable; real historical `yaagi:` artifacts из issue не копируются в test fixtures.

## Scope

Входит в scope:

- Отдельный `Agent-context factors` guidance в active report reference and generated report scaffold.
- Data-quality guidance, сфокусированный только на raw trace presence, parse errors, phase boundary reliability, missing expected artifacts, manual overrides and evidence quality.
- Regression fixture for available raw trace with a `compacted` event and no parse errors.
- Runtime/render behavior preventing `compacted` from appearing in `Data-quality limits` when trace is present and parsed.
- Logging recommendation discipline in active docs and generated logging-review scaffold: existing artifacts/workflows/prompts first, schema/log changes only when they do not solve the problem.
- Tests and docs-contract coverage that protect the distinction.
- Source-bundle regeneration and generated artifact parity.
- `docs/README.md` navigation update and later implementation-log placeholder planning for the implementation phase.

Не входит в scope:

- Changing session trace discovery policy.
- Changing phase-boundary or artifact-inclusion rules.
- Redesigning the whole report narrative style.
- Changing `unified-dossier-engineer` or canonical review artifact semantics.
- Reclassifying skill-audit catalog/noise behavior already covered by `RPA-05`.

## Proposed Changes

- Add focused `RPA-06` fixtures under `test/fixtures/rpa-06/`:
  - a session trace with `session_meta`, an included stage-log write/change evidence path, a `compacted` event, no parse errors and available skills catalog when needed;
  - matching project/stage-log fixture so stage logs are available and included;
  - a missing-trace or parse-error control case only if existing fixtures do not already prove real data-quality limits remain visible.
- Update `src/core/summarize-session.ts` and `src/core/types.ts` with a small additive agent-context summary if needed for persisted `scan-summary.json`, for example compacted event count plus existing long-gap and aborted/restarted counts. Keep existing `session.sampleEventTypes`, `session.longGaps`, and `session.abortedTurns` stable.
- Update `src/core/build-scan-summary.ts` only to populate the additive context field if introduced; do not move `compacted` into `dataQuality`.
- Update `src/render/report-markdown.ts`:
  - replace the broad executive data-quality note with evidence-source wording;
  - keep `## Data-quality limits` limited to session trace availability, parse errors, phase-boundary reliability, missing stage/skill evidence, excluded candidates and manual overrides;
  - add `## Agent-context factors` for compacted context, long gaps, interrupted/resumed turns and similar execution-context factors;
  - ensure the compacted fixture renders compaction only in this new section.
- Update `src/render/logging-review-markdown.ts`:
  - add a concise recommendation-discipline section before schema suggestions;
  - make schema/log field suggestions conditional on checking existing canonical artifacts, workflow sequencing and prompt recipes first;
  - preserve useful logging suggestions when the check shows existing mechanisms are insufficient.
- Update active references:
  - `references/REFERENCE.md`: define the distinction and add recommendation preference order.
  - `references/REPORT-TEMPLATE.md`: add separate `Agent-context factors` section and tighten `Data-quality limits`.
  - `references/LOGGING-IMPROVEMENTS-TEMPLATE.md`: add "existing mechanisms checked" before schema changes.
  - `references/CLI.md`: document generated report/logging-review scaffold behavior if runtime output changes.
  - `test/evaluation-contract.md`: add the compacted/raw-trace regression as a minimal quality scenario.
- Update source bundle:
  - `fragments/overview.md` and `skill.yaml` if generated `SKILL.md` needs the distinction in Start here, report quality bar, or gotchas.
  - Keep active references declared and reachable from `skill.yaml`.
- Refresh generated outputs after source/runtime edits:
  - run the package build to update `scripts/retro-cli.mjs` and map;
  - run skill-source-compiler regenerate/check for `SKILL.md` and `docs/compile-report.md`.
- Update `docs/README.md` with this plan and, during implementation, the corresponding implementation log.

## Implementation Steps

1. Add the `RPA-06` compacted-with-raw-trace fixture and any minimal project/stage-log fixture needed for a high-confidence report scaffold.
2. Add failing runtime tests first:
   - `test/report.test.ts` proves `compacted` appears under `Agent-context factors` and not under `Data-quality limits`;
   - `test/scan.test.ts` proves raw trace present, zero parse errors and stage-log availability remain ordinary data-quality facts despite `compacted`;
   - missing-trace or parse-error assertions remain covered by existing tests or a new narrow control case.
3. Add failing docs-contract tests for the new active terms:
   - `Data-quality limits` is evidence-source focused;
   - `Agent-context factors` exists in the report template/guidance;
   - recommendation order says existing artifact/workflow/prompt first, schema/log expansion only when necessary.
4. Implement the smallest runtime data change:
   - prefer deriving agent-context factors from existing serialized `ScanSummary`;
   - add an additive persisted context field only if the generated report cannot reliably identify compaction from existing fields.
5. Update `buildReportMarkdown` to render separate data-quality and agent-context sections with concise wording.
6. Update `buildLoggingReviewMarkdown` to render the recommendation discipline before schema/log field suggestions.
7. Update `references/*`, `fragments/overview.md`, `skill.yaml` and `test/evaluation-contract.md` for docs/runtime/test parity.
8. Update CLI contract snapshots only if public help/output shape changes; otherwise keep snapshots stable.
9. Run formatting if needed, then build, tests, typecheck, skill-source-compiler regenerate/check and portability scan.
10. During implementation, create `docs/logs/implementation-log-20260425-1.md` from the repository template and update `docs/README.md`.

## Verification Plan

- `pnpm --filter @kostysh/retrospective-phase-analysis-cli test`
- `pnpm --filter @kostysh/retrospective-phase-analysis-cli typecheck`
- `pnpm --filter @kostysh/retrospective-phase-analysis-cli lint`
- `pnpm --filter @kostysh/retrospective-phase-analysis-cli build`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint skills/retrospective-phase-analysis`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/retrospective-phase-analysis`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/retrospective-phase-analysis`
- Portability scan for absolute local paths and Windows drive paths in `skills/retrospective-phase-analysis`.
- Manual fixture walkthrough:
  - confirm `compacted` is not named as a data-quality limitation when raw trace exists and parse errors are zero;
  - confirm `compacted` is visible as an agent-context factor when material;
  - confirm real missing trace, parse errors, unreliable phase boundary, missing artifacts and manual overrides remain data-quality limits;
  - confirm logging recommendations check existing canonical artifacts/workflows/prompts before schema/log changes;
  - confirm generated `SKILL.md`, `docs/compile-report.md` and `scripts/*` match source edits.

## Risks and Side Effects

- Risk: hiding real evidence problems while fixing the compacted classification.
  - Mitigation: keep missing trace, parse errors, unreliable boundary, missing artifacts and manual overrides in `Data-quality limits`, with regression coverage.
- Risk: reports become longer by default.
  - Mitigation: keep the agent-context section concise and include only material factors or a one-line empty state.
- Risk: additive scan-summary fields affect consumers or golden snapshots.
  - Mitigation: prefer deriving from existing fields; if a field is added, make it additive, document it and update contract tests.
- Risk: recommendation discipline could be misread as banning schema changes.
  - Mitigation: phrase it as preference order and justification requirement, not prohibition.
- Risk: generated skill artifacts drift from source.
  - Mitigation: regenerate and run skill-source-compiler check before completion.
- Destructive side effects: none expected; changes are scoped to this skill's docs, runtime, tests, fixtures and generated artifacts.

## Rollback Plan

Revert the `RPA-06` changes: fixtures/tests, runtime rendering or additive summary fields, active reference updates, `skill.yaml`/`fragments/overview.md` edits, regenerated `SKILL.md`, `docs/compile-report.md`, `scripts/*`, docs navigation and implementation log. Then rerun package tests and `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/retrospective-phase-analysis` to confirm the skill returns to the previous consistent state.

## Independent Audit

Audit status: `REVIEWED`

Auditor: `Pascal`

Audit criteria:
- Conformance to the related issue.
- Coverage of all source artifacts describing the problem.
- Sufficiency and safety of the proposed implementation.

Audit notes:
- Verdict: `PASS`.
- The plan covers all `RPA-06` acceptance criteria: separate `Data quality` and `Agent-context factors`, prevent `compacted` from being treated as a data-quality limitation when raw trace is available and parsed, preserve real data-quality limits, add runtime/render regression coverage, and keep docs/runtime/test parity.
- The plan does not weaken phase-boundary or artifact-inclusion rules and keeps session trace discovery out of scope.
- Portability is preserved by using synthetic fixtures and not copying historical `yaagi:` artifacts.
- Recommendation discipline is framed as a preference order and justification requirement, not a ban on schema changes.
- Residual implementation risk: do not rely only on `sampleEventTypes` for detecting `compacted` unless that remains complete enough; add an explicit additive context field/count if needed.
- Residual verification risk: final implementation checks must run after generated artifacts are regenerated so docs-contract/runtime tests validate the final state.

Required corrections:
- None.

Final status: `PASS`
