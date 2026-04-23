# Implementation Log 1: artifact-driven retrospective scan hardening

## Scope

Реализован [issues/improvement-proposal-20260423-1.md](issues/improvement-proposal-20260423-1.md).

Цель изменения:

- уменьшить routine manual overrides за счет artifact-linked discovery;
- сохранить conservative gating для слабых artifact candidates;
- выводить same-session boundary из сильных stage artifact timestamps, когда они есть;
- fail-closed при ambiguous same-session follow-up без сильного boundary evidence;
- предпочитать structured metrics перед prose fallback;
- зафиксировать source/quality metrics и validation-required статус для unvalidated fallback.

## Runtime contract

Обновлены:

- [../src/core/artifact-evidence.ts](../src/core/artifact-evidence.ts)
- [../src/core/build-scan-summary.ts](../src/core/build-scan-summary.ts)
- [../src/core/extract-trace-scope.ts](../src/core/extract-trace-scope.ts)
- [../src/core/summarize-logs.ts](../src/core/summarize-logs.ts)
- [../src/core/summarize-session.ts](../src/core/summarize-session.ts)
- [../src/core/infer-candidate-incidents.ts](../src/core/infer-candidate-incidents.ts)
- [../src/core/types.ts](../src/core/types.ts)
- [../src/commands/scan.ts](../src/commands/scan.ts)

Решение:

- stage logs остаются первичным bounded entrypoint: анализируются только trace/manual included logs;
- helper-managed `.dossier/stages/<feature>/<stage>.json` читается только по bounded path, выведенному из уже включенного stage log;
- explicit `review_artifact(s)`, `verification_artifact(s)` и `step_artifact(s)` из stage metadata превращаются в `stage_artifact_link` candidates только при existing project-scoped target и verified scope match;
- feature-id matching alone не включает review/verification/step artifacts;
- `artifact_identity` добавлен в `scan-summary` и сужает noisy trace mentions через `primary_feature_id`, `primary_backlog_item_key`, `phase_scope`;
- `artifact_derived` phase boundary применяется до final scope/metrics extraction, если structured stage completion timestamp исключает later same-session work;
- ambiguous later retrospective follow-up без strong boundary вызывает usage/error с требованием `--until-line` или `--until-ts`;
- manual artifact overrides остаются evidence exceptions и не заменяют boundary resolution;
- `process_misses`, `process_misses_total`, `skills_used` имеют приоритет над prose/legacy fallback;
- `stageLogs.metrics.sources` фиксирует source quality, а unvalidated prose fallback оставляет `reportStatus` в `draft_requires_agent_validation`;
- Markdown scaffolds показывают source/quality для process misses, skill references и candidate incidents.

## Active docs

Обновлены:

- [../SKILL.md](../SKILL.md)
- [../references/CLI.md](../references/CLI.md)
- [../references/REFERENCE.md](../references/REFERENCE.md)
- [../references/PROJECT-ADAPTATION.md](../references/PROJECT-ADAPTATION.md)

Решение:

- active guidance фиксирует agent-owned session resolution boundary;
- docs запрещают broad `.dossier/stages/*` scan и auto-inclusion by feature-id alone;
- docs описывают artifact-derived boundary и fail-closed ambiguity;
- docs фиксируют structured metrics first и validation-required status для unvalidated prose fallback.

## Tests

Обновлены:

- [../test/scan.test.ts](../test/scan.test.ts)
- [../test/docs-contract.test.ts](../test/docs-contract.test.ts)
- [../test/fixtures/contracts/scan-summary-golden.json](../test/fixtures/contracts/scan-summary-golden.json)

Покрытие:

- artifact-linked review/verification discovery без manual overrides;
- weak feature-id-only review/verification artifacts остаются candidates;
- artifact identity сужает noisy multi-feature trace mentions;
- artifact-derived same-session boundary исключает later retrospective work;
- ambiguous same-session follow-up fails closed, manual override не подменяет boundary;
- structured process-miss metrics выигрывают у prose и не double-count;
- prose fallback metrics требуют agent validation;
- docs-contract защищает новые active rules и public scan schema.

## Verification

Status: local checks passed, external audits passed

Выполнены проверки:

- `pnpm --filter @kostysh/retrospective-phase-analysis-cli format` — pass.
- `pnpm --filter @kostysh/retrospective-phase-analysis-cli lint` — pass.
- `pnpm --filter @kostysh/retrospective-phase-analysis-cli typecheck` — pass.
- `pnpm --filter @kostysh/retrospective-phase-analysis-cli test` — pass, 65 tests.

## External audit

Status: reviewed

Выполнены внешние аудиты:

- `spec-conformance-reviewer` — `PASS`.
- `code-reviewer` — `PASS`.
- `security-reviewer` — `PASS`.

Ключевые результаты:

- Первый `spec-conformance-reviewer` аудит нашел blocker: prose review fallback мог дублировать structured `review_findings_total`, а `candidate_incidents` source quality не учитывал prose fallback review incidents. Исправлено: structured review findings suppress prose review fallback; candidate incident source quality теперь учитывает prose fallback and keeps validation-required status.
- Первый `security-reviewer` аудит нашел blocker: symlink escape для bounded stage state / linked artifact preview и wholesale merge stage-state JSON. Исправлено: `lstat` + `realpath` guard, symlink rejection, allowlist stage-state fields и scope validation before merge.
- Первый `code-reviewer` аудит нашел blockers: mismatched stage state мог менять scope, same-session boundary fail-closed был слишком узким, renderers падали на legacy summaries без `metrics.sources`. Исправлено: mismatched state rejected as ambiguity, later ordinary work-item mentions after strong artifact evidence require explicit/artifact boundary, renderers tolerate legacy metric sources.
- Повторные `spec-conformance-reviewer`, `code-reviewer` и `security-reviewer` аудиты подтвердили `PASS`.
