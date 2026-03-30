# Решение по восстановлению `architecture-backlog-engineer`

Дата фиксации: 2026-03-30

Этот документ фиксирует актуальное решение по recovery после пофайловой проверки блоков `A/B/C/D`.

- решение опирается на код, тесты и реальную роль CLI, а не на прежний недоверенный operator-facing contract;
- раннее provisional-решение `B/C/D = drop` признано слишком жёстким и снято;
- текущая цель: сохранить и локально исправить только те изменения, которые подтверждаются кодом, тестами и принятой role split baseline.

## Принципы решения

1. `keep` разрешён только там, где изменение можно защитить напрямую от кода, тестов и реальной роли CLI.
2. `rewrite` применяется только к тем местам, где найден конкретный дефект, а не как blanket-реакция на загрязнение docs/contract layer.
3. `drop` применяется только тогда, когда блок действительно не удаётся защитить ни кодом, ни тестами, ни accepted baseline.
4. Generated artifacts не являются источником истины, но сохраняются, если они синхронизированы с текущим source tree и входят в штатный bundle утилиты.

## Актуальные решения по блокам

| Блок | Решение | Почему |
| --- | --- | --- |
| `A. Source runtime и discover ingestion` | `keep` | Блок подтверждён как реальное ядро CLI. Потребовался только targeted rewrite embedded-source identity path; после фикса и тестов блок сохраняется. |
| `B. Shared schema, validation и drift` | `keep` | Блок не смешивает роли агента и CLI. Он считает drift и валидирует уже materialized canonical state. Оснований для rewrite/drop не найдено. |
| `C. CLI output и generated read model` | `keep` | Это read-model и operator output layer поверх canonical state. Семантика подтверждается кодом и существующим тестовым покрытием. |
| `D. Lifecycle, repair, rebaseline и lineage` | `keep` | Блок реализует детерминированный lifecycle/journal contract поверх canonical artifacts и подтверждён тестами на `command_run_id`, rebaseline, render lineage и recovery-render. |

## Обоснование по блокам

### A. Source runtime и discover ingestion -> `keep`

### Что подтверждено

- CLI действительно умеет:
  - читать source refs;
  - ingest-ить explicit packet refs;
  - ingest-ить embedded packet blocks из source documents;
  - merge-ить packets в `backlog.json`.
- Это подтверждено кодом в:
  - `src/discovery/source-runtime.ts`
  - `src/discovery/discover-run.ts`
- Это подтверждено тестами на:
  - embedded packet ingest;
  - mixed ingest `embedded + --source-packet`;
  - packet guardrails.

### Что было проблемным

- Единственный подтверждённый дефект был в embedded-source identity path:
  - embedded packet мог подменять identity контейнерного source слишком широко.
- Это не следовало ни из baseline, ни из transport semantics embedded packet blocks.

### Что исправлено

- Исправлено правило:
  - embedded packet может canonicalize `source_id` для того же physical source;
  - embedded packet может переносить metadata `precedence` и `notes`;
  - embedded packet не может переписывать `ref`, `kind`, `authority` контейнерного source.
- Под это добавлены и обновлены тесты.

### Итог

- После targeted rewrite блок сохраняется как `keep`.

## B. Shared schema, validation и drift -> `keep`

### Что проверено

- Проверены:
  - `common.ts`
  - `validate-run.ts`
  - `drift-state.ts`
- Подтверждено, что блок:
  - fixed `assessment.stats`;
  - `stale_review_artifacts`;
  - `rebaseline_readiness`;
  - delivery evidence source constraints;
  - negative-scope restrictions;
  - drift calculation поверх canonical state.

### Почему это не требует rewrite/drop

- Блок не интерпретирует prose и не расширяет роль CLI за пределы deterministic validation/drift.
- Он валидирует уже materialized graph.
- Проверенные guardrails (`delivery_state`, `negative_scope`, `stale_review_artifacts`, `rebaseline_readiness`) оказались внутренне консистентными и совпадающими с очищенным docs layer.

### Итог

- Оснований для переписывания или сноса блока не найдено. Решение — `keep`.

## C. CLI output и generated read model -> `keep`

### Что проверено

- Проверены:
  - `cli.ts`
  - `status-run.ts`
  - `delta-run.ts`
  - `render-views.ts`
  - `roadmap-matrix.ts`
- Подтверждено, что блок рендерит:
  - `Summary metrics`
  - `Rebaseline readiness`
  - `New stale since last change`
  - `Human-readable diff`
  - `Item Summary Index`
  - `Item Detail Sections`
  - `Rebaseline Readiness`
  - `New Stale Since Last Change`
- Все эти surfaces строятся из `manifest + backlog + assessment`, а не из operator shortcut-ов.

### Почему это не требует rewrite/drop

- `status` работает как read-only surface после refresh + validate.
- `delta` строит human-readable diff только из baseline projection и current graph.
- `render` остаётся recovery-render из canonical state.
- `roadmap-matrix` считается детерминированно из items/relations.
- Существующие тесты уже покрывают operator output, render sections, `baseline_projection`, `render_reason` и manifest timestamps.

### Итог

- Оснований для сноса блока не найдено. Решение — `keep`.

## D. Lifecycle, repair, rebaseline и lineage -> `keep`

### Что проверено

- Проверены:
  - `init-run.ts`
  - `repair-run.ts`
  - `rebaseline-run.ts`
  - `bundle-repair.ts`
  - `command-lineage.ts`
- Подтверждено, что блок реализует:
  - `commandRunId`;
  - bundle recovery;
  - canonical derivable repair;
  - baseline projection journaling;
  - stale snapshot lineage;
  - mutating vs recovery render separation.

### Почему это не требует rewrite/drop

- Блок работает поверх canonical artifacts и не подменяет роль агента.
- `repair` ограничен derivable state.
- `rebaseline` пересчитывает baseline из canonical graph и journal.
- `command-lineage` только нормализует и читает journal semantics.
- Это всё уже подтверждено тестами на:
  - `command_run_id` continuity;
  - `rebaseline_started` / `rebaseline_completed`;
  - `baseline_projection`;
  - `stale_snapshot` / `new_stale_snapshot`;
  - recovery-render separation.

### Итог

- Оснований для сноса блока не найдено. Решение — `keep`.

## Отдельные файлы вне блочного решения

| Файл | Решение | Почему |
| --- | --- | --- |
| `scripts/architecture-backlog.mjs` | `keep` | Это bundled generated artifact текущего source tree; он остаётся синхронизированным и тестируется косвенно через CLI. |
| `scripts/architecture-backlog.mjs.map` | `keep` | Производный build artifact bundled CLI, сохраняется вместе с актуальным source tree. |
| `references/artifact-model.md` | `keep` | Документ уже переписан под accepted transport model: explicit packets и embedded packet blocks как capability без ложного semantic-discovery narrative. |

## Итоговое решение

Актуальный путь восстановления завершён так:

1. Contract/docs layer был очищен отдельно от runtime-кода.
2. Блок `A` получил targeted rewrite по embedded-source identity semantics и после этого сохранён.
3. Блоки `B`, `C` и `D` прошли пофайловую проверку и сохраняются как `keep`.
4. Generated bundle и reference docs сохраняются как часть актуального tree.

Главный вывод: исходное provisional-решение `B/C/D = drop` оказалось чрезмерным. После очистки docs layer и пофайловой инспекции кодовая база не требует массового отката. Нужна была только локальная коррекция блока `A`, а остальная runtime-модель сохраняется.
