# Блочный аудит подозрительного code-surface `architecture-backlog-engineer`

Дата фиксации: 2026-03-30

Этот документ покрывает только шаг 3 recovery-процедуры:

- второй проход по `suspicious` code-surface;
- разложение изменений по смысловым блокам;
- фиксация того, что реально было изменено, без попытки уже сейчас решать `keep / rewrite / drop`.

Источник сравнения: `HEAD` в репозитории `/home/kostysh/.codex/skills/custom`.

## Действующие ограничения

До отдельного решения по каждому блоку:

1. `wrong`-слой из [change-audit-registry.ru.md](./change-audit-registry.ru.md) считается недоверенным.
2. Этот аудит не подтверждает корректность ни одного блока; он только восстанавливает карту изменений.
3. Любая связь с текущим operator-facing contract считается подозрительной, пока не будет заново сверена с исходной методикой.

## Блоки

| Блок | Файлы |
| --- | --- |
| `A. Source runtime и discover ingestion` | `src/discovery/source-runtime.ts`, `src/discovery/discover-run.ts` |
| `B. Shared schema, validation и drift` | `src/discovery/common.ts`, `src/discovery/validate-run.ts`, `src/discovery/drift-state.ts` |
| `C. CLI output и generated read model` | `src/cli.ts`, `src/discovery/status-run.ts`, `src/discovery/delta-run.ts`, `src/discovery/render-views.ts`, `src/discovery/roadmap-matrix.ts` |
| `D. Lifecycle, repair, rebaseline и lineage` | `src/discovery/init-run.ts`, `src/discovery/repair-run.ts`, `src/discovery/rebaseline-run.ts`, `src/discovery/bundle-repair.ts`, `src/discovery/command-lineage.ts` |

## A. Source runtime и discover ingestion

### Файлы

- `src/discovery/source-runtime.ts`
- `src/discovery/discover-run.ts`

### Что существовало до правок

- `source-runtime.ts` уже умел читать source refs.
- `source-runtime.ts` уже умел парсить только machine-readable payload:
  - чистый JSON packet;
  - fenced JSON packet blocks в markdown.
- `discover-run.ts` уже:
  - резолвил sources;
  - загружал explicit packet refs;
  - merge-ил packets в `backlog.json`;
  - запускал refresh/repair/validate;
  - отдельно вызывал render.

Это соответствует текущему runtime в:

- `src/discovery/source-runtime.ts:372`
- `src/discovery/source-runtime.ts:401`
- `src/discovery/discover-run.ts:179`

### Что было изменено

1. В packet schema добавлен `packet_provenance` и режимы `planning_overlay` / `source_driven_refresh`.
2. Добавлена нормализация и жёсткая валидация `packet.source.source_id` против runtime-only `sourceId`.
3. Добавлены ограничения на `replace_sections`, `source_refs_managed`, packet source keys и packet provenance keys.
4. Добавлена нормализация explicit packet source через source-authority identity и auto-derivation `source_id`.
5. `discover-run.ts` лишён собственного `render` toggle и `reportPath` результата.
6. `discover-run.ts` начал прокидывать `commandRunId` в `init`, journal event и `validate`.

Ключевые точки в текущем коде:

- `src/discovery/source-runtime.ts:210`
- `src/discovery/source-runtime.ts:521`
- `src/discovery/source-runtime.ts:573`
- `src/discovery/discover-run.ts:31`
- `src/discovery/discover-run.ts:200`
- `src/discovery/discover-run.ts:224`

### Почему блок подозрителен

- В этот блок встроены жёсткие packet/provenance semantics, которые были зафиксированы уже после искажения operator/runtime contract.
- Сам packet parser не превратился в prose semantic extractor, но вокруг него навешан новый нормативный смысл, который может быть ложным или чрезмерным.
- Поэтому здесь нельзя автоматически считать ошибкой весь код, но и нельзя считать его корректным без отдельной проверки против исходной роли CLI.

### Твёрдый факт по блоку

В доступном diff нет признаков того, что CLI научилась semantic extraction из произвольного prose. В блоке подтверждается только packet parsing и deterministic merge поверх machine-readable packet content.

## B. Shared schema, validation и drift

### Файлы

- `src/discovery/common.ts`
- `src/discovery/validate-run.ts`
- `src/discovery/drift-state.ts`

### Что было изменено

1. В shared schema добавлены:
  - `Manifest.baseline_issue_item_links`
  - `Manifest.current_issue_item_links`
  - `DeltaSummary.stale_review_artifact_ids`
  - фиксированный `AssessmentStats`
  - `AssessmentFile.stale_review_artifacts`
  - `AssessmentFile.rebaseline_readiness`
2. В `validate-run.ts` добавлены:
  - `ValidateDiscoveryRunOptions`
  - `commandRunId` plumbing
  - `DELIVERY_EVIDENCE_SOURCE_KINDS`
  - `MANUAL_ONLY_NEGATIVE_SCOPE_CLASSES`
  - новая сериализация `stale_review_artifacts`
  - новая сериализация `rebaseline_readiness`
  - новые fixed stats counters
3. В `drift-state.ts` добавлены:
  - issue-entry hashing по `gap` / `contradiction` / `unknown`
  - `buildIssueItemLinks`
  - `collectAffectedIssueItemIds`
  - baseline/current issue-item links
  - `stale_review_artifact_ids` в delta summary

Ключевые точки:

- `src/discovery/common.ts:238`
- `src/discovery/common.ts:844`
- `src/discovery/common.ts:896`
- `src/discovery/common.ts:935`
- `src/discovery/validate-run.ts:260`
- `src/discovery/validate-run.ts:266`
- `src/discovery/validate-run.ts:358`
- `src/discovery/validate-run.ts:7511`
- `src/discovery/validate-run.ts:7523`
- `src/discovery/drift-state.ts:37`
- `src/discovery/drift-state.ts:367`
- `src/discovery/drift-state.ts:431`
- `src/discovery/drift-state.ts:777`

### Почему блок подозрителен

- Это самый крупный слой новой семантики.
- Здесь смешаны потенциально ценные улучшения:
  - fixed stats;
  - stale review artifacts;
  - readiness;
  - issue-to-item drift invalidation.
- Но они были введены в тот же проход, где уже был испорчен operator contract, поэтому автоматически доверять им нельзя.
- Особенно высокий риск у `validate-run.ts`: это самый большой semantic gate, и любое неверное предположение в нём превращается в machine-checked “истину”.

### Твёрдый факт по блоку

Этот блок действительно изменяет вычислительную логику, а не только документацию. Поэтому именно его нельзя оценивать по текстам; его нужно будет отдельно сверять с исходной методикой и ролью runtime.

## C. CLI output и generated read model

### Файлы

- `src/cli.ts`
- `src/discovery/status-run.ts`
- `src/discovery/delta-run.ts`
- `src/discovery/render-views.ts`
- `src/discovery/roadmap-matrix.ts`

### Что было изменено

1. `cli.ts` получил новый command-output surface:
  - `Summary metrics`
  - `Rebaseline readiness`
  - `New stale since last change`
  - `Human-readable diff`
2. Из help убраны `--no-render` для `discover` и `repair`.
3. `status` теперь рендерится через `renderDiscoveryStatusOutput(...)`.
4. `delta-run.ts` получил `HumanReadableDelta` и baseline-projection-based diff.
5. `render-views.ts` получил новые generated sections:
  - `Item Summary Index`
  - `Item Detail Sections`
  - `Rebaseline Readiness`
  - `New Stale Since Last Change`
6. `render-views.ts` стал писать `report_rendered` journal event с `render_reason`, `stale_snapshot` и `new_stale_snapshot`.

Ключевые точки:

- `src/cli.ts:19`
- `src/cli.ts:424`
- `src/cli.ts:474`
- `src/cli.ts:488`
- `src/cli.ts:856`
- `src/discovery/status-run.ts:85`
- `src/discovery/status-run.ts:107`
- `src/discovery/status-run.ts:132`
- `src/discovery/delta-run.ts:20`
- `src/discovery/render-views.ts:488`
- `src/discovery/render-views.ts:520`
- `src/discovery/render-views.ts:1590`
- `src/discovery/render-views.ts:1600`
- `src/discovery/render-views.ts:1899`

### Почему блок подозрителен

- Это в основном operator-facing surface.
- Он напрямую обслуживает тот contract layer, который уже признан искажённым.
- Даже если отдельные output improvements полезны, сейчас нельзя автоматически считать, что они отвечают на правильные operator questions правильным способом.

### Твёрдый факт по блоку

Этот блок не доказывает появления prose extraction. Он меняет главным образом presentation, report shape и command-output semantics.

## D. Lifecycle, repair, rebaseline и lineage

### Файлы

- `src/discovery/init-run.ts`
- `src/discovery/repair-run.ts`
- `src/discovery/rebaseline-run.ts`
- `src/discovery/bundle-repair.ts`
- `src/discovery/command-lineage.ts`

### Что было изменено

1. `init-run.ts`:
  - получил `commandRunId`;
  - инициализирует `stale_review_artifacts`, `rebaseline_readiness`, fixed stats;
  - инициализирует `baseline_issue_item_links` / `current_issue_item_links`.
2. `repair-run.ts`:
  - получил `commandRunId` plumbing для repair events.
3. `rebaseline-run.ts`:
  - получил `commandRunId`;
  - начал обновлять issue-item linkage snapshots;
  - пишет `baseline_projection` в `rebaseline_completed`.
4. `bundle-repair.ts`:
  - начал восстанавливать новые manifest fields.
5. Добавлен новый модуль `command-lineage.ts`:
  - `createCommandRunId(...)`
  - чтение последних mutating stale snapshots
  - чтение `baseline_projection`
  - логика around `report_rendered` lineage

Ключевые точки:

- `src/discovery/init-run.ts:33`
- `src/discovery/init-run.ts:153`
- `src/discovery/init-run.ts:238`
- `src/discovery/repair-run.ts:38`
- `src/discovery/repair-run.ts:283`
- `src/discovery/rebaseline-run.ts:28`
- `src/discovery/rebaseline-run.ts:146`
- `src/discovery/rebaseline-run.ts:176`
- `src/discovery/bundle-repair.ts:76`
- `src/discovery/command-lineage.ts:148`
- `src/discovery/command-lineage.ts:191`
- `src/discovery/command-lineage.ts:324`

### Почему блок подозрителен

- Здесь сосредоточены новые lifecycle assumptions:
  - command grouping;
  - mutating vs recovery render;
  - baseline projection lineage;
  - stale snapshot diffing.
- Этот блок может оказаться полезным сам по себе.
- Но он завязан на весь remediation-pass и на новый operator-facing stale contract, поэтому пока не может считаться доверенным.

### Твёрдый факт по блоку

Этот блок меняет именно lifecycle and journaling semantics, а не source parsing. Его нужно будет оценивать отдельно от extraction-boundary ошибки.

## Итог шага 3

После блочного разбиения видно следующее:

1. Основной источник повреждения находится не в одном файле, а в двух связанных слоях:
  - `wrong`-слой docs/help/spec/tests;
  - `suspicious`-слой новой runtime/logging/validation semantics.
2. Наиболее опасные для повторной проверки блоки:
  - `B. Shared schema, validation и drift`
  - `C. CLI output и generated read model`
3. Наименее двусмысленный факт сейчас такой:
  - packet parsing существовал и раньше;
  - semantic extraction из произвольного prose этим аудитом не подтверждается;
  - искажение произошло прежде всего в contract layer, а затем частично было закреплено в runtime/tests.
