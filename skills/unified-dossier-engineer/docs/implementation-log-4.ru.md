# Лог реализации `Package 6.1`

Дата: 2026-04-21

## Что реализовано

В этой волне source bundle `unified-dossier-engineer` получил отдельный active reference для commandized stage-control model:

- `references/commandized-stage-control.md`

Также были обновлены:

- `skill.yaml`
- `references/delivery-workflow-layer.md`
- `references/telemetry-and-closure.md`
- `references/unified-architecture.md`
- `docs/README.md`
- generated `SKILL.md`
- generated `docs/compile-report.md`

## Что зафиксировано

### Primary delivery stage-controller commands

Как future first-class commands закреплены:

- `feature-intake`
- `spec-compact`
- `plan-slice`
- `implementation`
- `change-proposal`

### Separate helper command family

Отдельно и явно сохранены helper boundaries:

- `contract-drift-audit`
- `dossier-verify`
- `review-artifact`
- `dossier-step-close`
- `lifecycle-refresh`
- `next-step`

### Authority boundary

Ключевая зафиксированная граница:

- stage-controller commands могут доводить stage только до `ready_for_close`
- authoritative `closed` state и closure timestamps не materialize-ятся на их уровне
- authoritative closure truth остаётся у `dossier-step-close`
- lifecycle truth после closure остаётся у `lifecycle-refresh`

### Logging model

Для future stage-controller commands закреплена минимальная deterministic transition surface:

- `stage_state`
- `entered_ts`
- `ready_for_close_ts`
- `transition_events[]`

При этом:

- repeated block/resume history должна жить в `transition_events[]`
- ambiguous singleton timestamps вроде `blocked_ts` и `resumed_ts` не входят в target model без явно derived semantics

### Backlog interaction

Stage-controller commands не мутируют backlog truth напрямую.

Они materialize-ят explicit follow-up requirement:

- `backlog_followup_required`
- `backlog_followup_kind`
- `backlog_followup_resolved`

Truthful stage closure остаётся fail-closed, пока required backlog actualization не завершён.

## Что сознательно НЕ делалось

В этой волне не проектировались:

- точный help surface будущих commands
- exact output schema
- exact transition event schema
- final field naming for runtime artifacts

Причина:

- это уже scope `Package 7` (`utility specification`)
- `Package 6.1` фиксирует upstream design boundary, а не final shipped contract

## Валидация

После правок должны проходить:

- `skill-source-compiler lint`
- compile в temp output и перенос generated `SKILL.md` + `docs/compile-report.md` обратно в source bundle
- `skill-source-compiler check` против temp compiled bundle
- `git diff --check`

Внешний audit для этой волны:

- `spec-conformance-reviewer` против:
  - `docs/issues/unified-dossier-engineer-concept-2026-04-20.md`
  - `docs/refactoring-plan-1.ru.md`
- `code-reviewer` и `security-reviewer` допустимо маркировать как `N/A`, если wave остаётся docs-only и не меняет runtime/code surface
