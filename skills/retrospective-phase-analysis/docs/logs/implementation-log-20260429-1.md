# Implementation Log

## Log ID

`implementation-log-20260429-1`

## Related Issue

`issue-20260429-1` - `docs/issues/issue-20260429-1.md`.

## Related Plan

`implementation-plan-20260429-1` - `docs/issues/implementation-plan-20260429-1.md`.

## Operator Request

Последовательно выполнить implementation всех подготовленных планов по скилам, вести логи, довести implementation до независимого audit `PASS`, затем закоммитить.

## Summary

Реализована классификация trace-derived non-PASS review signals в `retrospective-phase-analysis scan`.

Trace-only duplicate signals теперь сохраняются в `reviewSignals` как context, но попадают в `historical` или `superseded` только при консервативном совпадении с complete bounded stage evidence. Active, late, ambiguous или неполные trace signals остаются `active_unmatched` и продолжают влиять на metrics, `CandidateIncident`, `reportStatus.reasons` и problem matrix.

## Changes Made

- `src/core/types.ts`: добавлен `ReviewSignalClassification` и поле `ReviewSignal.classification`.
- `src/core/review-signals.ts`: добавлены helpers `isActionableReviewSignal` и `isContextReviewSignal`.
- `src/core/build-scan-summary.ts`: добавлена классификация trace review signals, conservative matching against complete structured evidence, explicit trace scope extraction, active-only report-status filtering и разделение explicit finding count от metric fallback.
- `src/core/summarize-logs.ts`: structured/prose review signals получают `active_unmatched`; metric quality и fallback findings учитывают только actionable signals.
- `src/core/infer-candidate-incidents.ts`: historical/superseded review signals не создают candidate incidents.
- `src/core/extract-trace-scope.ts`: `referenced_only` stage-log guidance теперь явно указывает rerun с `--stage-log <path> --artifact-evidence <justification>`.
- `src/render/report-markdown.ts`: review evidence показывает classification и отдельный context section для historical/superseded signals.
- `src/render/logging-review-markdown.ts`: unresolved artifact count считает только actionable signals и показывает количество context-only signals.
- `src/render/problem-matrix-markdown.ts`: actionable review-history row создается только для active unmatched signals.
- `test/scan.test.ts`: добавлены regression tests для historical duplicate и active unmatched cases against complete evidence: later timestamp, different audit class, different round, different commit, ambiguous scope, missing count.
- `references/CLI.md`: описан `reviewSignals.classification` и явная manual inclusion guidance.
- `skill.yaml`: поднята source-version до `0.1.2`, добавлен portable copy для `src/core/review-signals.ts`.
- `package.json`: версия runtime поднята до `0.1.2`.
- `SKILL.md`, `docs/compile-report.md`, `scripts/retro-cli.mjs`, `scripts/retro-cli.mjs.map`: regenerated/built outputs синхронизированы с source bundle.

## Decisions

- `historical`/`superseded` classification применяется только к trace-derived signals. Structured/prose signals остаются `active_unmatched`.
- Matching fail-closed: для suppression обязательны audit class, round, commit, explicit finding count, timestamp/order, stage и однозначный feature/backlog scope.
- Missing explicit count остается active. Fallback count `1` применяется только для active trace metrics, но не используется как strong matching evidence.
- Ambiguous scope in trace blocks `historical`/`superseded` classification.
- Context-only signals не удаляются из `reviewSignals`, чтобы сохранить evidence-quality history.

## Verification Performed

- `pnpm --dir skills/retrospective-phase-analysis format` - PASS.
- `pnpm --dir skills/retrospective-phase-analysis build` - PASS.
- `pnpm --dir skills/retrospective-phase-analysis typecheck` - PASS.
- `pnpm --dir skills/retrospective-phase-analysis lint` - PASS.
- `pnpm --dir skills/retrospective-phase-analysis test` - PASS, 78/78.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/retrospective-phase-analysis` - PASS.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/retrospective-phase-analysis` - PASS.

External audit:

- Code review audit, Pascal, `gpt-5.5` medium: `PASS`.
- Initial spec-conformance audit, Arendt, `gpt-5.5` medium: `FAIL`; required conservative matching and active-case tests.
- Focused spec re-audit, Gauss, `gpt-5.5` medium: `PASS`.
- Initial security audit, Poincare, `gpt-5.5` medium: `FAIL`; same optional round/commit/ambiguous-scope defect.
- Focused security re-audit, James, `gpt-5.5` medium: `FAIL`; found fallback count `1` could hide missing explicit count.
- Focused security re-audit #2, Kant, `gpt-5.5` medium: `PASS`.

## Deviations From Plan

- Implementation became stricter than the first local version after audit feedback: missing round, commit, scope, explicit finding count, or ambiguous scope now always keeps trace signal active.
- Added `src/core/review-signals.ts` to keep active/context filtering centralized instead of duplicating predicates in every renderer.

## Side Effects

- `scan-summary.json` now emits additive `reviewSignals[].classification`.
- Runtime version/source-version changed from `0.1.1` to `0.1.2`.
- Built CLI bundle size increased slightly due to classification and matching logic.

## Follow-up

Нет обязательных follow-up items после PASS-аудитов.

## Final Status

PASS.
