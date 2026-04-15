# План рефакторинга 1: phase boundary и trace-confirmed retrospective extraction

Дата: `2026-04-15`
Компонент: `retrospective-phase-analysis`
Основание: [issues/improvement-proposal-20260415-1.md](issues/improvement-proposal-20260415-1.md)
Скоп: active-session retrospective boundary, trace-confirmed artifact extraction, manual evidence overrides, draft/final report status

## Контекст

Privacy-safe persisted output, `run_dir` reuse и language inheritance уже были реализованы в отдельном commit перед созданием этого плана. Этот план не должен повторно реализовывать P0, но должен сохранить и проверить этот baseline при дальнейших изменениях.

Оставшаяся проблема: ретроанализ может быть методически слабым, если active session trace содержит действия самого ретроанализа, stage logs не извлекаются как trace-confirmed evidence, или generated Markdown выглядит финальным при degraded evidence quality.

## Нормативные источники

- [../SKILL.md](../SKILL.md)
- [../references/CLI.md](../references/CLI.md)
- [../references/PROJECT-ADAPTATION.md](../references/PROJECT-ADAPTATION.md)
- [../references/REFERENCE.md](../references/REFERENCE.md)
- [issues/improvement-proposal-20260415-1.md](issues/improvement-proposal-20260415-1.md)

## Не цели

- Не делать CLI ответственным за поиск session trace в runtime session store.
- Не начинать ретроанализ с repo-wide reading.
- Не включать все `.dossier/logs` по feature-id alone.
- Не хардкодить язык оператора.
- Не сохранять абсолютные локальные runtime paths в committed artifacts.

## Package 0. Baseline verification: privacy-safe output

### Смысл

Убедиться, что уже сделанное исправление остается рабочим после следующих пакетов.

### Файлы

- `SKILL.md`
- `references/CLI.md`
- `src/core/shared.ts`
- command render paths
- `test/cli.test.ts`

### Изменения

Новых изменений не требуется, если текущий baseline уже есть. При имплементации следующих пакетов сохранить invariant:

- persisted `scan-summary.json` and Markdown reports use display-safe paths;
- exact operational paths may appear only in stdout or runtime variables;
- tests fail if persisted artifacts contain local absolute prefixes.

### Acceptance

- Existing privacy tests still pass.
- Existing canonical `run_dir` reuse tests still pass: first `scan` creates one bundle, follow-up commands with `--run-dir` reuse it, and no sibling bundle appears.
- Existing language inheritance tests still pass: `scan-summary.json` stores `operator_language` / `report_language`, and `report`, `skill-audit`, `logging-review` inherit language through `--run-dir`.
- New boundary/extraction features do not reintroduce absolute path leakage.

## Package 1. Active-session phase boundary

### Смысл

Если ретроанализ запускается в той же сессии, что и анализируемая работа, нужно отделить исходную phase от действий самого ретроанализа.

### Файлы

- `SKILL.md`
- `references/CLI.md`
- `src/commands/scan.ts`
- `src/commands/types.ts`
- `src/core/summarize-session.ts`
- `src/core/build-scan-summary.ts`
- `src/core/types.ts`
- `test/cli.test.ts`
- fixtures for active-session boundary

### Изменения

1. В `SKILL.md` добавить explicit active-session rule:
   - if retrospective request is inside the same active session, establish phase boundary before substantive scan;
   - events after boundary are excluded from primary retrospective scope;
   - if boundary cannot be determined, stop and ask operator.
2. В `scan` добавить inputs:
   - `--until-line <n>`
   - `--until-ts <iso>`
3. В session summary применять boundary before scope extraction and metrics.
4. В `scan-summary.json` добавить:
   - `phase_boundary.mode`
   - `phase_boundary.until_line`
   - `phase_boundary.until_ts`
   - `phase_boundary.reason`
   - `phase_boundary.excluded_events_count`
5. Help output and CLI reference должны объяснять, что boundary нужен только когда анализируемая phase не занимает весь trace.

### Acceptance

- Test: same-session trace contains implementation events and later retrospective events; `--until-ts` excludes retrospective events.
- Test: `--until-line` excludes later events deterministically.
- Invalid line or timestamp fails with usage error.
- Without boundary historical trace behavior remains unchanged.

## Package 2. Trace-confirmed artifact candidate model

### Смысл

Scan должен показывать, почему artifact включен или не включен в scope.

### Файлы

- `src/core/extract-trace-scope.ts`
- `src/core/types.ts`
- `src/core/build-scan-summary.ts`
- renderers if they show evidence manifests
- tests and fixtures for trace writes, patch targets, shell writes, referenced-only mentions

### Изменения

1. Заменить plain `candidate_stage_logs: string[]` на structured candidates или добавить рядом structured field без резкого breaking:
   - `path`
   - `evidence_kind`
   - `event_ref`
   - `included`
   - `reason`
2. Поддержать evidence kinds:
   - `trace_write`
   - `trace_patch_target`
   - `trace_shell_write`
   - `tool_output_path`
   - `referenced_only`
3. Inclusion rule:
   - only trace-confirmed write/change evidence enters analyzed stage logs automatically;
   - `referenced_only` remains candidate but not analyzed by default;
   - feature-id matching alone does not include review/verification artifacts.
4. Maintain backward-compatible summary fields if existing tests or downstream docs still expect arrays; if kept, arrays must be derived from included candidates only.

### Acceptance

- Existing strict tests for stage-log scope still pass.
- New tests show candidate not included when only referenced in prose.
- New tests show candidate included for apply_patch target and shell write target.
- Summary explains inclusion reason.

## Package 3. Controlled manual overrides

### Смысл

Если trace не дает надежного machine-readable event, агент должен иметь controlled way to include evidence without widening to repo-wide reading.

### Файлы

- command option parsing
- `src/commands/scan.ts`
- `src/commands/types.ts`
- `src/core/build-scan-summary.ts`
- `src/core/types.ts`
- tests for override behavior

### Изменения

1. Добавить options:
   - `--stage-log <path>` repeatable if parser supports it, otherwise comma-separated or multiple accepted form with deterministic parser update;
   - `--review-artifact <path>`;
   - `--verification-artifact <path>`;
   - `--artifact-evidence <text>`.
2. Manual override without `--artifact-evidence` fails.
3. Summary distinguishes:
   - `auto_included`
   - `manual_included`
4. Scope confidence downgrades or records ambiguity when manual override was needed.

### Acceptance

- Manual stage log without evidence fails.
- Manual review artifact without evidence fails.
- Manual verification artifact without evidence fails.
- Manual stage log with evidence is included and marked manual.
- Manual review artifact with evidence is included and marked manual.
- Manual verification artifact with evidence is included and marked manual.
- Summary distinguishes manual inclusion per artifact kind, not only globally.
- Scope confidence or data-quality notes reflect manual inclusion for each artifact kind.
- Existing automatic extraction behavior remains unchanged.

## Package 4. Draft/final status model for generated Markdown

### Смысл

CLI-generated Markdown is a scaffold unless evidence quality is complete and validated.

### Файлы

- `src/core/types.ts`
- `src/core/build-scan-summary.ts`
- Markdown renderers
- `SKILL.md`
- `references/CLI.md`
- tests for degraded draft marker

### Изменения

1. Add report status model:
   - `draft_requires_agent_validation`
   - `ready_for_agent_finalization` if evidence quality is strong enough.
2. Set draft marker when:
   - data quality degraded;
   - no stage logs analyzed but trace indicates dossier activity;
   - unresolved scope ambiguities exist;
   - manual overrides were used;
   - phase boundary is ambiguous;
   - language scaffold unavailable or manually authored.
3. Render Markdown marker:
   - `Status: draft, requires agent validation`
4. Skill must state that final report is agent responsibility, not CLI responsibility.

### Acceptance

- Degraded scan report contains draft marker.
- Clean fixture may omit marker or mark ready depending on chosen model.
- Tests protect that generated Markdown does not pretend to be final when evidence is partial.

## Проверки

- `pnpm --filter @kostysh/retrospective-phase-analysis-cli test`
- `pnpm --filter @kostysh/retrospective-phase-analysis-cli lint`
- targeted tests for privacy after all packages
- `rg` на абсолютные локальные пути в changed docs/goldens
- `git diff --check`

## Review plan

Перед имплементацией выполнить внешний spec-conformance/UX review этого плана против proposal. После правок добиться PASS на узком scope измененного plan doc.
