# Спецификация: maintenance source registry

Этот документ задаёт целевое поведение для backlog-side управления уже зарегистрированными источниками:

- удаление source record из registry, если source file удалён из репозитория;
- смена `path` у зарегистрированного source, если документ переехал.

Документ нужен потому, что текущий skill и CLI умеют только:

- регистрировать source через `register-source`;
- перечислять source records через `list-sources`;
- обновлять hash и derived review state через `refresh`.

Сейчас утилита не умеет:

- удалить source record и одновременно безопасно убрать его из backlog truth;
- безопасно сменить `path` у source при сохранении того же `source_id`.

Из-за этого у агента нет канонического workflow для двух реальных случаев:

1. документ был перемещён или переименован, и backlog должен продолжить ссылаться на тот же logical source;
2. source file был удалён, и backlog должен перестать на него ссылаться, сохранив affected work в review-required state.

## Базовая информация, на которую опирается спецификация

- [SKILL.md](../SKILL.md)
- [Command Reference](../references/command-reference.md)
- [CLI Contract](../references/cli-contract.md)
- [Data Model](../references/data-model.md)
- [utility-spec.ru.md](utility-spec.ru.md)
- [test-matrix.ru.md](test-matrix.ru.md)

## Критические текущие инварианты

- `source_id` — utility-owned stable technical identifier;
- item-level traceability (`origin_source_ids`, `specification_source_ids`, `plan_source_ids`, `implementation_source_ids`, `test_source_ids`) должна продолжать ссылаться на тот же `source_id`, если source остаётся логически тем же;
- context entities (`claims`, `quality_attributes`, `policy_decisions`) тоже могут ссылаться на `source_id`;
- rebuild собирает durable backlog truth из canonical packets/patches и валидирует все source references через `.backlog/sources.json`.

Из этого следует:

- смена `path` должна сохранять `source_id`;
- удаление source не может быть просто registry rewrite:
  - utility должна сначала убрать этот `source_id` из durable backlog truth;
  - затем оставить affected work в explicit review-required state;
  - и только после этого удалить source record из registry.

## Цели

1. Дать агенту literal maintenance workflow для source registry.
2. Сохранить стабильность `source_id` при relocation source file.
3. Не допустить silent corruption, при которой registry теряет source record, а backlog truth продолжает ссылаться на его `source_id`.
4. Дать оператору понятный command-level UX для source relocation и source removal.
5. Сохранить текущую mental model skill-а:
   - source discovery -> `register-source`
   - source inspection -> `list-sources`
   - source-derived review update -> `refresh`
   - source registry maintenance -> новые явные команды

## Non-goals

В этот цикл не входят:

- batch source maintenance;
- редактирование `kind`, `authority`, `note` у существующего source;
- автоматическое переопределение dossier artifacts;
- generic `edit-source` command для произвольного metadata editing.

## Operator use cases

| Ситуация | Нужное действие |
| --- | --- |
| Файл ADR или architecture doc переехал, но это всё ещё тот же canonical source | Сменить `path`, сохранив `source_id` |
| Source file переехал и содержимое одновременно изменилось | Сменить `path`, затем выполнить refresh-like review update |
| Source file удалён из репозитория и backlog должен перестать на него ссылаться | Убрать source references из affected backlog truth, пометить affected work для review, затем удалить source record |
| Оператор пытается сменить `path` на уже зарегистрированный путь другого source | Вернуть понятную ошибку о path collision |
| Utility не может безопасно materialize полный cleanup удаляемого source under current maintenance model | Вернуть explicit fail-closed error с impacted scope |

## Предлагаемый command surface

### `update-source-path`

Назначение:

- переназначить filesystem path уже зарегистрированного source;
- сохранить тот же `source_id`;
- при необходимости выполнить refresh-like review update, если hash нового файла отличается.

Поддерживаемые selectors:

- `--source-id <source_id>` — preferred
- `--source-label <source_label>`
- `--source-path <current_path>`

Обязательный аргумент:

- `--new-path <path>`

Опциональный аргумент:

- `--dry-run`

### `remove-source`

Назначение:

- снять удалённый source с backlog truth;
- перевести affected work в explicit review-required state;
- только затем удалить source record из registry.

Поддерживаемые selectors:

- `--source-id <source_id>` — preferred
- `--source-label <source_label>`
- `--source-path <path>`

Опциональный аргумент:

- `--dry-run`

## Почему две команды, а не один generic edit-source

Причины:

- текущая потребность узкая и literal;
- `path` relocation и source removal имеют разную семантику;
- `update-source-path` может потребовать refresh-like review branch;
- `remove-source` должен делать controlled cleanup backlog truth, а не просто редактировать metadata.

## Detailed contract: `update-source-path`

### Input

- один source selector;
- `--new-path`;
- optional `--dry-run`.

### Writes

Всегда, если `dry_run = false` и command не является strict no-op:

- `.backlog/sources.json`
- `.backlog/state.json`

Причина:

- path change меняет `source_label`;
- persisted source summaries и source-linked read models должны синхронизироваться сразу, а не ждать следующего rebuild.

### Algorithm

1. Resolve selector to exactly one registered source.
2. Normalize `--new-path` relative to backlog root using the same path-normalization rules as `register-source` and `refresh --source-path`.
3. Validate that the new file exists and can be safely read under the same file-safety rules as `register-source`.
4. If normalized new path is identical to the current stored path:
   - return deterministic no-op response;
   - do not rewrite registry;
   - do not mutate state.
5. If another registered source already owns the normalized new path and has a different `source_id`, fail with `BE_SOURCE_PATH_CONFLICT`.
6. Hash the new file.
7. Rewrite the source record:
   - preserve `source_id`;
   - preserve `kind`, `authority`, `note`, `registered_at`;
   - update `path`;
   - update `source_label` to the new normalized path;
   - update `hash`;
   - update `last_checked_at`.
8. Synchronize current state so that persisted source summaries and other source-labeled read models use the new `source_label`.
9. If `new_hash === old_hash`:
   - write updated registry and synchronized state;
   - do not create new review todo;
   - report mechanical source-label sync in `todo_updated` when existing source-linked todo/read models changed;
   - keep `next_commands` empty because no semantic source review was introduced;
   - do not advance `last_refresh_at`.
10. If `new_hash !== old_hash`:
   - treat the command as `path update + scoped refresh semantics` for the same `source_id`;
   - recompute review todo effects for impacted items using the same source-change semantics as `refresh`;
   - persist updated state;
   - advance `last_refresh_at`.
11. Return compact mutation summary and absolute machine-facing paths.

### Required output shape

Минимальный ожидаемый shape:

```json
{
  "dry_run": false,
  "source_id": "<uuid>",
  "source_label": "<new_label>",
  "previous_path": "<absolute_old_path>",
  "path": "<absolute_new_path>",
  "kind": "<source_kind>",
  "authority": "<source_authority>",
  "note": "<readable_note>",
  "hash": "<new_hash>",
  "hash_changed": true,
  "counts": {
    "changed_sources": 1,
    "todo_created": 0,
    "todo_updated": 0,
    "todo_removed": 0
  },
  "next_commands": []
}
```

Дополнительные правила:

- `previous_path` и `path` в output всегда absolute;
- `hash_changed = false` должен быть literal signal для агента, что path changed without semantic source change;
- при `hash_changed = false`, `todo_updated` может отражать только mechanical label sync existing todo/read models; это не требует automatic follow-up reads, поэтому `next_commands` остаётся empty;
- если `hash_changed = true`, `counts` и `next_commands` должны следовать той же compact mutation discipline, что и `refresh`.

### Error contract

| Code | Когда |
| --- | --- |
| `BE_SOURCE_NOT_FOUND` | selector не находит source |
| `BE_SOURCE_FILE_MISSING` | `--new-path` не существует |
| `BE_SOURCE_READ_FAILED` | `--new-path` существует, но небезопасен для чтения |
| `BE_SOURCE_PATH_CONFLICT` | другой source уже зарегистрирован на этом normalized path |
| `BE_MUTATION_LOCKED` | backlog root занят другой mutating command |
| `BE_PLATFORM_UNSUPPORTED` | host runtime не поддерживает safe anchored writes |

### Agent interpretation rule

После `update-source-path`:

- если `hash_changed = false`, agent не обязан автоматически делать extra backlog reads;
- если `hash_changed = true` и появились `todo_created`/`todo_updated`, normal follow-up — `attention` или `items` по returned scope, как и после `refresh`.

## Detailed contract: `remove-source`

### Input

- один source selector;
- optional `--dry-run`.

### Writes

Если `dry_run = false`:

- canonical maintenance mutation artifact in `patches/`
- `.backlog/applied.json`
- `.backlog/state.json`
- `.backlog/sources.json`

Причина:

- rebuild собирает durable backlog truth из canonical packets/patches;
- rebuild валидирует все item/context `source_id` against `.backlog/sources.json`;
- значит `remove-source` не может ограничиться переписыванием registry или только runtime state.

### Algorithm

1. Resolve selector to exactly one registered source.
2. Inspect current canonical truth and identify every place where the source participates:
   - item `origin_source_ids`
   - item `specification_source_ids`
   - item `plan_source_ids`
   - item `implementation_source_ids`
   - item `test_source_ids`
   - context entity `source_ids` where applicable
3. Materialize one durable maintenance mutation that removes the `source_id` from every affected item and context entity.
4. Apply that maintenance mutation through the same canonical persistence discipline as other mutating commands.
5. Create or update review-required state for affected items:
   - affected items must become `needs_attention = true` through explicit open todo;
   - the todo message must literally explain that the source was removed;
   - these todos must be `managed_by: mutation`, so they remain valid after registry deletion.
6. Remove the source record from `.backlog/sources.json`.
7. Persist final state and registry.
8. Return compact confirmation payload.

### Required output shape

Минимальный ожидаемый shape:

```json
{
  "dry_run": false,
  "source_id": "<uuid>",
  "source_label": "<label>",
  "path": "<absolute_path>",
  "removed": true,
  "counts": {
    "updated": 0,
    "todo_created": 0,
    "todo_updated": 0,
    "todo_removed": 0
  },
  "updated_item_keys": ["<item_key>"],
  "next_commands": []
}
```

Где:

- `updated_item_keys` = tasks whose source lists were changed by maintenance cleanup;
- `counts.updated` = number of affected items whose durable truth changed;
- `todo_created` / `todo_updated` describe source-removal review signals created for those items.

### Error contract

| Code | Когда |
| --- | --- |
| `BE_SOURCE_NOT_FOUND` | selector не находит source |
| `BE_MUTATION_LOCKED` | backlog root занят другой mutating command |
| `BE_PLATFORM_UNSUPPORTED` | host runtime не поддерживает safe anchored writes |
| `BE_SOURCE_REMOVE_UNSUPPORTED` | utility не может безопасно записать полный cleanup affected truth under current maintenance model |

Для `BE_SOURCE_REMOVE_UNSUPPORTED` payload должен быть пригоден для operator explanation:

- `details.source_id`
- `details.source_label`
- `details.path`
- `details.referencing_item_keys`
- `details.referencing_context_keys`, если есть
- `hint`, который объясняет, что command требует более широкой maintenance support для canonical truth cleanup

## Shared invariants

### Stable `source_id`

- `update-source-path` не меняет `source_id`;
- item-level traceability не должна требовать patch-а только ради relocation source file.

### No silent orphaning

- `remove-source` никогда не должен оставлять items или context entities, которые ссылаются на отсутствующий `source_id`;
- если full cleanup нельзя выполнить детерминированно, command обязан fail-closed.

### Utility-owned durable maintenance mutation is allowed

- `remove-source` может materialize utility-owned canonical maintenance mutation;
- agent не должен вручную author patch только ради source cleanup.

### No hidden agent-side choreography inside one response

Command может предложить `next_commands`, но не должен:

- silently author packet;
- silently delete or rewrite dossier artifacts.

### Consistent selectors

Новые команды должны использовать ту же selector mental model, что и `refresh`:

- `source_id`
- `source_label`
- `source_path`

## Изменения в skill/docs contract

После имплементации нужно обновить:

- [SKILL.md](../SKILL.md)
- [references/command-reference.md](../references/command-reference.md)
- [references/cli-contract.md](../references/cli-contract.md)
- [docs/utility-spec.ru.md](utility-spec.ru.md)
- [docs/schemas-and-types.ru.md](schemas-and-types.ru.md)
- [docs/test-matrix.ru.md](test-matrix.ru.md)

## Минимальный test scope

### `update-source-path`

- success: path changed, hash unchanged
- success: path changed, hash changed, refresh-like todo delta created
- no-op when new normalized path equals current path
- reject missing new file
- reject unsafe/symlinked new file
- reject selector miss with `BE_SOURCE_NOT_FOUND`
- reject collision with existing registered path via `BE_SOURCE_PATH_CONFLICT`
- built CLI help/output contract
- dry-run parity with real apply

### `remove-source`

- success: source removed after durable cleanup of affected item source lists
- success: source removed after durable cleanup of affected context entity source lists
- success: affected items receive mutation-managed review todo with source-removal message
- reject selector miss with `BE_SOURCE_NOT_FOUND`
- fail closed with `BE_SOURCE_REMOVE_UNSUPPORTED` when full cleanup cannot be materialized safely
- built CLI help/output contract
- dry-run parity with real apply

## Рекомендуемая фаза имплементации

1. Нормативные docs и schemas
2. source-registry service additions
3. durable maintenance mutation model for `remove-source`
4. command implementations
5. tests
6. built CLI/help sync

## Решения, принятые этой спецификацией

- нужны две отдельные команды: `update-source-path` и `remove-source`;
- для смены path сохраняется тот же `source_id`;
- `update-source-path` может запускать scoped refresh semantics, если content hash изменился;
- `remove-source` должен сначала удалить `source_id` из durable backlog truth, затем пометить affected work для review и только потом удалить source record из registry;
- forced delete without cleanup не вводится.
