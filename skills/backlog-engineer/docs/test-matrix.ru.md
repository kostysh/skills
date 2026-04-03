# Матрица тестов утилиты `@kostysh/backlog-engineer-cli`

Документ фиксирует тестовый контракт утилиты:

- какие уровни тестов обязательны;
- что именно должно покрываться на каждом уровне;
- какие фикстуры нужны;
- какие инварианты считаются критичными;
- какие команды и модули должны иметь минимальный набор тестов.

Документ опирается на:

- `process-cli.ru.md`
- `utility-spec.ru.md`
- `schemas-and-types.ru.md`
- `module-interfaces.ru.md`

## 1. Цели тестовой матрицы

Матрица должна гарантировать, что:

1. authored inputs валидируются строго и предсказуемо;
2. mutation-команды меняют backlog state только по зафиксированным правилам;
3. read-команды не создают semantic drift;
4. hidden maintenance rebuild восстанавливает runtime-state без изменения бизнес-смысла;
5. dry-run проходит тот же semantic pipeline, что и реальная команда;
6. queue, attention, gaps и ready-state вычисляются стабильно;
7. CLI возвращает machine-readable JSON и корректные exit codes.

## 2. Классификация тестов

| Уровень | Цель | Что должен ловить |
| --- | --- | --- |
| `schema-level` | строгая shape-валидация через `zod@v4` | неизвестные поля, invalid enums, invalid timestamps, broken patch contracts |
| `semantic-validation` | проверка содержательной корректности authored inputs до mutation | duplicate keys, dangling references, immutable context conflicts, invalid source links |
| `state-transition-validation` | проверка допустимости перехода из текущего state в новый | new-only packet rule, patch target existence, remove_todo ownership, destructive confirm |
| `unit` | isolated logic конкретного модуля или сервиса | ошибки алгоритма, ordering, dedup, derived-state bugs |
| `adapter-level` | работа `artifacts` и других I/O adapters с in-memory FS | path handling, canonical filenames, JSON persistence, atomic write policy |
| `command-level` | orchestration конкретной команды без shell | неправильные reads/writes, плохой summary, неверный scope |
| `cli-process` | built artifact как пользовательский процесс | argv parsing, help/version, JSON printing, exit codes |
| `recovery` | rebuild и hidden maintenance behavior | расхождение runtime snapshot с canonical artifacts, dry-run persistence bugs |

Правило:

- баг, который можно поймать unit-тестом, не должен проверяться только через CLI-process test;
- process tests не заменяют unit и command-level tests.

## 3. Общие тестовые правила

1. Все тесты должны быть детерминированными.
2. Все timestamps должны задаваться через deterministic `ClockPort`.
3. Все UUID должны задаваться через deterministic `UuidPort`.
4. Все hashes должны задаваться через deterministic `HashPort` или через контролируемые fixture contents.
5. Unit tests не должны зависеть от реальной файловой системы.
6. Process tests должны запускать built artifact из `scripts/`, а не `src/`.
7. Любая mutating команда должна иметь минимум один pair-тест:
   - реальный apply;
   - тот же сценарий через `--dry-run`.
8. Для read-команд нужен минимум один тест с hidden maintenance rebuild.

## 4. Набор обязательных фикстур

## 4.1. Базовые фикстуры backlog root

Нужны как минимум такие fixture-группы:

| Фикстура | Назначение |
| --- | --- |
| `empty-backlog` | только результат `init` |
| `single-branch-backlog` | простой линейный граф |
| `multi-branch-backlog` | несколько root-веток для `queue` |
| `context-heavy-backlog` | backlog с `claims`, `contracts`, `data_domains`, `quality_attributes`, `policy_decisions` |
| `refreshable-backlog` | backlog с зарегистрированными source files и изменяемым hash |
| `corrupted-state-backlog` | корректные canonical artifacts + сломанный `state.json` |
| `stale-state-backlog` | валидный по схеме `state.json`, но расходящийся с canonical replay |
| `broken-registry-backlog` | missing or invalid `.backlog/sources.json` / `.backlog/applied.json` |
| `missing-canonical-artifact-backlog` | applied registry ссылается на отсутствующий packet/patch file |
| `ordering-tiebreak-backlog` | backlog для tie-break ordering в `queue` и `attention` |
| `todo-dedup-backlog` | backlog для semantic dedup `todo` при разном порядке related keys/sources |
| `context-linked-cleanup-backlog` | backlog с item-linked context refs для cleanup after `remove-item` |

## 4.2. Authored fixture files

Нужны authored fixtures:

- valid `packet` с новыми задачами;
- invalid `packet` с duplicate `item_key`;
- valid `patch-item` patch;
- invalid `patch-item` patch с `remove_item`;
- valid `remove-item` patch;
- invalid `remove-item` patch с incomplete coverage;
- glossary conflict packet;
- immutable context conflict packet;
- packet с dangling dependency;
- packet с self-dependency;
- patch с duplicate `patch_id`;
- patch с non-monotonic `sequence`;
- patch с invalid `remove_todo` ownership;
- packet/patch для dry-run scenarios.

## 4.3. Source fixtures

Нужны file fixtures:

- source file `A` с hash `h1`;
- та же source file `A` после изменения с hash `h2`;
- missing source path;
- два разных пути, которые нормализуются в один relative path.

## 5. Инварианты, которые должны проверяться повторно

Эти инварианты должны быть покрыты несколькими уровнями тестов, а не только одним:

1. `packet` не меняет существующие задачи.
2. `patch-item` не создаёт новые задачи.
3. `remove-item` удаляет задачу и чистит dangling references.
4. context entities immutable по ключу.
5. `source_id` используется везде консистентно.
6. `attention_reason_codes` и `attention_reasons` идут в одном и том же порядке.
7. `gaps` блокируют `ready_for_next_step`.
8. open `todo` по source/dependency/context дают `needs_attention = true`.
9. hidden maintenance rebuild не создаёт новых semantic side effects.
10. dry-run не пишет ничего на диск.

## 6. Schema-level тесты

## 6.1. Scalar and artifact schemas

Обязательные кейсы:

- accept valid `.backlog.json`
- reject `.backlog.json` with unknown field
- reject non-UTC timestamp like `2026-04-03T12:00:00+02:00`
- accept valid `SourceRecord`
- reject invalid `Sha256Hex`
- accept valid `StateFile`
- reject `StateItem` without derived fields
- accept valid `ErrorPayload`
- reject output object with unknown field where schema is exact

## 6.2. Packet schemas

Обязательные кейсы:

- accept valid packet
- reject packet with unknown top-level field
- reject packet item with derived field
- reject packet where `items` is missing
- reject packet with invalid context entity key shape
- reject `GlossaryEntry.aliases` that are non-unique after trim

## 6.3. Patch schemas

Обязательные кейсы:

- reject patch with empty `patch_id`
- reject patch with empty `target_item_keys`
- reject patch with non-unique `target_item_keys`
- reject patch with empty `operations`
- reject invalid `sequence`
- reject invalid `kind`
- reject `replace_fields` operation with empty `fields`

## 6.4. Command DTO schemas

Обязательные кейсы:

- accept `RefreshCommandInput` for all supported scope selectors
- reject invalid mixed `RefreshCommandInput`
- accept `ItemsCommandInput` with several keys
- reject `SearchCommandInput` with unknown field
- accept `StatusCommandInput` with `refresh: true`
- reject invalid `DeleteBacklogCommandInput`

## 7. Semantic-validation тесты

Эти тесты проверяют authored inputs после schema parse, но до state transition.

## 7.1. Packet semantic validation

Обязательные кейсы:

- reject packet with duplicate `item_key`
- reject packet with self-dependency
- reject packet with dangling dependency
- reject packet with invalid `*_source_ids` against `sources.json`
- reject packet with glossary conflict
- reject packet with immutable context conflict
- reject packet with invalid item-linked context references:
  - `quality_attributes[].applies_to_item_keys`
  - `policy_decisions[].related_item_keys`

## 7.2. Patch semantic validation

Обязательные кейсы:

- reject patch operation whose `item_key` is outside `target_item_keys`
- reject `patch-item` with `remove_item`
- reject `remove-item` patch with incomplete coverage of `target_item_keys`
- reject `remove-item` patch with non-`remove_item` operation
- reject invalid `remove_todo` ownership
- reject duplicate `patch_id` against applied registry
- reject non-monotonic `sequence` against applied registry

## 7.3. Search and source semantic validation

Обязательные кейсы:

- reject `template patch` when any `--item-keys` do not exist
- reject `refresh --source-path` when path cannot be resolved to registered source
- repeated `register-source` for same path does not скрыто update `hash`

## 8. State-transition-validation тесты

Эти тесты проверяют допустимость перехода из текущего state в новый.

## 8.1. Packet transitions

Обязательные кейсы:

- reject packet that attempts to add already existing `item_key`
- accept packet that adds only new tasks
- packet does not create `todo` for upstream tasks only because new task depends on them

## 8.2. Patch transitions

Обязательные кейсы:

- reject `patch-item` for non-existing target item
- reject `remove-item` for non-existing target item
- `remove_todo` removes only currently open todo
- `remove-item` triggers referential-integrity cleanup after deletion
- `patch-item` and `remove-item` preserve item/context referential integrity after mutation

## 8.3. Destructive and confirmation transitions

Обязательные кейсы:

- `delete-backlog` without confirm is rejected with blocking error
- destructive command with confirm proceeds

## 9. Unit-тесты модулей

## 9.1. `errors`

Обязательные кейсы:

- `create()` produces stable code/message/details/hint
- `toPayload()` preserves code/message/details/hint
- `toExitCode()` returns expected mapping for each error class
- unknown thrown value maps to generic internal error payload

## 9.2. `sources`

### `path-normalizer`

Кейсы:

- normalize relative source path into backlog-relative posix path
- normalize absolute source path into backlog-relative posix path
- reject path escaping backlog root semantics if policy forbids
- two equivalent paths normalize to same persisted path

### `source-registry-service`

Кейсы:

- `resolveCliSourcePath()` returns `absolute_path`, `relative_path`, `source_label`
- `buildSourceRecord()` derives `source_label` from `relativePath`
- `registerSource()` returns `created: false` for same path
- `resolveSourceScope()` by `source_id`
- `resolveSourceScope()` by `source_label`
- `resolveSourceScope()` by `source_path`

### `source-hash-service`

Кейсы:

- stable hash for same content
- different hash after content change

## 9.3. `templates`

Кейсы:

- backlog `AGENTS.md` template renders non-empty stable content
- packet template renders empty canonical skeleton
- patch template renders `target_item_keys`, `patch_id`, `sequence`
- packet template does not prefill undocumented fields

## 9.4. `graph-service`

Кейсы:

- assert new-only packet rule
- apply packet adds new tasks only
- apply patch updates allowed fields only
- remove-item removes target item keys
- reverse dependency index is correct
- cleanup removes deleted item from context references

## 9.5. `context-service`

Кейсы:

- merge glossary without conflict
- reject glossary conflict
- accept repeated identical immutable context entity
- reject conflicting immutable context entity by same key
- preserve `target_system` and `as_built` merge rules from spec

## 9.6. `todo-service`

Кейсы:

- create source-change todo
- create dependency-change todo
- create context-change todo
- merge duplicate todo by semantic effect
- remove todo by id
- remove only open todo entries

## 9.7. `derived-state-service`

Кейсы:

- `needs_attention = true` when gaps exist
- `needs_attention = true` when open review todo exists
- `attention_reason_codes` and `attention_reasons` have same ordering
- `ready_for_next_step = false` when task has gaps
- `ready_for_next_step = false` when task has open todo
- `ready_for_next_step = false` when dependency stage is insufficient
- `ready_for_next_step = true` only for stage-aligned tasks

## 9.8. `search-service`

Кейсы:

- filter by `source_ids`
- filter by `delivery_state`
- filter by `needs_attention`
- filter by `ready_for_next_step`
- filter by context keys
- deterministic ordering for same state
- compact result only, no full item cards

## 9.9. `items-service`

Кейсы:

- returns full cards for known keys
- includes reverse dependencies
- includes source summaries
- includes computed state
- includes open todo
- fails on unknown key according to command contract

## 9.10. `queue-service`

Кейсы:

- returns chains, not flat list
- excludes implemented items
- excludes items with gaps
- excludes items with open review todo
- excludes items with unresolved dependency stage
- chain ordering across roots is deterministic
- ordering inside chain:
  - depth
  - downstream dependency count
  - `item_key`
- multiple root branches form multiple chains

## 9.11. `attention-service`

Кейсы:

- includes items with review todos
- includes items with gaps
- excludes items without attention
- reason ordering:
  - `source_changed`
  - `dependency_changed`
  - `context_changed`
  - `gaps`

## 9.12. `reports`

Кейсы:

- report model includes metrics
- report model includes global mermaid graph
- report model includes local mermaid graphs when graph is large
- report model uses `ItemCard[]` for item catalog
- markdown renderer produces all required operator sections
- report uses fallback summary rules for `target_system` / `as_built`
- report applies grouping/threshold logic for large backlog mode
- mermaid renderer is deterministic for same state

## 10. Adapter-level тесты

## 10.1. `artifacts` with in-memory FS

Обязательные кейсы:

- create backlog layout
- write/read `.backlog.json`
- write/read `.backlog/sources.json`
- write/read `.backlog/applied.json`
- write/read `.backlog/state.json`
- `writeInitialArtifacts()` writes all initial files
- `writeAgentsFile()` writes backlog `AGENTS.md`
- canonical import filename for packet
- canonical import filename for patch
- `writeTemplateOutput()` writes to explicit file path
- `writeTemplateOutput()` writes inside output directory with default basename
- `writeReportFiles()` writes markdown and graph files
- `deleteBacklog()` removes backlog directory
- atomic write policy does not leave half-written JSON

## 10.2. `runtime` with in-memory adapters

Обязательные кейсы:

- `createContext()` finds backlog root
- `createContext()` fails for non-`init` command without backlog root
- `ctx.ensureQueryState()` uses existing valid `state.json`
- `ctx.ensureQueryState()` rebuilds missing `state.json`
- `ctx.ensureQueryState()` rebuilds corrupted `state.json`
- `ctx.ensureQueryState()` rebuilds valid-but-divergent `state.json`
- `ctx.ensureMutationState()` rejects unrecoverable canonical artifact corruption
- `rebuildState()` reproduces same state as live apply sequence
- `rebuildState()` fails fast for missing canonical packet/patch files
- `rebuildState()` fails fast for broken registries
- rebuild does not mutate `sources.json` or `applied.json`
- rebuild does not rehash sources

## 11. Command-level тесты

## 11.1. `init`

Кейсы:

- creates empty layout
- writes initial `state.json`, `sources.json`, `applied.json`
- writes backlog `AGENTS.md`
- fails on existing backlog root
- fails on non-empty directory without backlog marker

## 11.2. `register-source`

Кейсы:

- registers new source
- returns existing source for same normalized path
- stores `source_id`, relative path, label, hash
- repeated registration of same path does not silently refresh stored `hash`
- invokes hook after registration
- fails on missing source file

## 11.3. `list-sources`

Кейсы:

- lists all sources
- filters by `item_key`
- filters by `path`
- ordering is deterministic by `source_label`
- does not mutate registries or state

## 11.4. `template`

Кейсы:

- `template packet` writes `packet.template.json`
- `template patch` computes `sequence = max + 1`
- `template patch` validates `--item-keys`
- output path may be file or directory
- invalid output target returns expected error code
- command does not mutate backlog state

## 11.5. `packet`

Кейсы:

- adds only new tasks
- rejects existing `item_key`
- validates source references through source registry
- merges packet context
- preserves referential integrity after apply
- summary contains exact fields from `PacketCommandOutput`
- writes canonical packet copy and applied entry
- dry-run returns same summary counts without writes

## 11.6. `patch-item`

Кейсы:

- updates allowed fields
- rejects non-existing target item
- can update several tasks in one patch
- may remove todo via `remove_todo`
- preserves referential integrity after apply
- summary contains exact fields from `PatchItemCommandOutput`
- writes canonical patch copy and applied entry
- dry-run parity with real apply

## 11.7. `remove-item`

Кейсы:

- removes one task
- removes several tasks
- cleans dependent references
- cleans item-linked context references
- updates or creates downstream todo when needed
- summary contains exact fields from `RemoveItemCommandOutput`
- writes canonical patch copy and applied entry
- dry-run parity with real apply

## 11.8. `refresh`

Кейсы:

- global refresh
- item-scoped refresh
- source-scoped refresh by `source_id`
- source-scoped refresh by `source_label`
- source-scoped refresh by `source_path`
- changed source creates review todo
- unchanged refresh produces no semantic changes
- `refresh` does not auto-remove `review_context_change`
- summary contains exact fields from `RefreshCommandOutput`
- updates `last_refresh_at`

## 11.9. `status`

Кейсы:

- returns short summary from current state
- `status --refresh` runs refresh first
- includes `last_refresh_at`
- exact `StatusCommandOutput` shape is preserved
- hidden maintenance rebuild before read does not create semantic drift

## 11.10. `report`

Кейсы:

- writes report to fixed report path
- writes mermaid graph file
- includes required operator sections
- exact `ReportCommandOutput` shape is preserved
- uses hooks for system summary and decorated sections

## 11.11. `items`

Кейсы:

- one key returns array with one card
- several keys return several cards
- preserves requested key ordering
- unknown key behavior matches exact command contract and error code
- hidden maintenance rebuild can happen before read

## 11.12. `search`

Кейсы:

- each supported filter works
- combined filters intersect correctly
- returns compact summaries only
- search without filters returns all tasks
- returns `match_reasons`
- deterministic ordering

## 11.13. `gaps`

Кейсы:

- returns all gap-bearing tasks
- returns scoped gaps for one item
- excludes tasks without gaps

## 11.14. `queue`

Кейсы:

- returns chains
- excludes blocked tasks
- reflects current derived state after mutation

## 11.15. `attention`

Кейсы:

- returns tasks needing review
- includes gap-only tasks
- ordering is severity, then `item_key`
- reason ordering is stable

## 11.16. `delete-backlog`

Кейсы:

- requires explicit confirm
- deletes backlog directory when confirmed
- returns exact `DeleteBacklogCommandOutput`

## 12. Output-contract coverage

Этот блок обязателен поверх command-level tests. Он проверяет machine-readable DTO как публичный контракт.

Обязательные кейсы:

- для каждой команды, у которой есть output DTO, `schemas.parseCommandOutput(...)` принимает реальный success payload;
- output не содержит неизвестных полей;
- mutation summaries имеют exact field set и exact count/list semantics;
- `next_commands` имеет exact структуру:
  - `command`
  - `args`
  - `reason`
- `items` returns `ItemCard[]` exact shape;
- `search` returns exact `SearchResult[]` shape;
- `attention` returns exact `AttentionEntry[]` shape;
- `queue` returns exact `QueueChain[]` shape;
- `status` and `report` return exact DTO shape;
- `attention_reason_codes` and `attention_reasons` stay aligned in every DTO that exposes them.

## 13. CLI process tests

Обязательные кейсы:

- `--help`
- `--version`
- unknown command
- invalid flags for known command
- successful command prints JSON to stdout only
- failed command prints JSON error to stderr only
- validation error returns non-zero exit code
- destructive command without confirm returns blocking exit code
- `report --out` or other unsupported argv surface returns usage error if parser receives it
- built artifact happy-path chain `init -> register-source -> packet -> status`
- built artifact mutation chain `template patch -> patch-item --dry-run -> patch-item -> items`
- built artifact refresh chain `refresh --source-id -> attention -> report`
- built artifact query after deleting `state.json` triggers hidden maintenance rebuild and still succeeds
- built artifact dry-run chain leaves canonical artifacts unchanged on disk

## 14. Recovery and rebuild tests

Это отдельная группа, не сводимая к обычным command tests.

Обязательные кейсы:

- rebuild canonical state from `.backlog/sources.json`, `.backlog/applied.json`, `packets/`, `patches/`
- rebuilt state equals live state after same apply sequence
- corrupted `state.json` is replaced by rebuild result
- valid-but-divergent `state.json` is replaced by rebuild result
- missing `state.json` is rebuilt before read command
- missing `.backlog/sources.json` causes fail-fast instead of rebuild
- invalid `.backlog/sources.json` causes fail-fast instead of rebuild
- missing `.backlog/applied.json` causes fail-fast instead of rebuild
- invalid `.backlog/applied.json` causes fail-fast instead of rebuild
- missing canonical packet file causes fail-fast instead of rebuild
- missing canonical patch file causes fail-fast instead of rebuild
- invalid canonical packet file causes fail-fast instead of rebuild
- invalid canonical patch file causes fail-fast instead of rebuild
- duplicate `patch_id` in applied registry is detected
- `apply_index` collision in applied registry is detected
- invalid patch `sequence` ordering in applied registry is detected
- hidden maintenance rebuild does not change:
  - `sources.json`
  - `applied.json`
  - packet/patch ordering
- hidden maintenance rebuild does not change source hashes
- hidden maintenance rebuild does not create new todo if canonical inputs did not change
- rebuild replay does not invoke top-level command hooks
- dry-run does not appear in `applied.json`
- dry-run does not create canonical packet/patch copies
- patch sequence ordering remains deterministic across rebuild

## 15. Dry-run parity tests

Для `packet`, `patch-item`, `remove-item` обязательна отдельная parity-группа:

1. Выполнить команду с `--dry-run`.
2. Сохранить returned summary.
3. Убедиться, что canonical artifacts не изменились.
4. Выполнить ту же команду без `--dry-run`.
5. Сравнить semantic summary:
   - `counts`
   - changed item lists
   - `todo_created`
   - `todo_updated`
   - `todo_removed`

Допустимое различие:

- только `dry_run` flag.

## 16. Hook-тесты

Нужны как минимум integration-like tests with no-op and recording hooks.

Обязательные кейсы:

- `beforeCommand` and `afterCommand` are invoked
- `afterSourceRegistered` is invoked
- `afterPacketApplied` is invoked
- `afterPatchApplied` is invoked for both `patch-item` and `remove-item`
- `afterRefresh` is invoked
- `buildSystemSummary` contributes to report model
- `decorateReportSections` can transform section list
- hook failure is surfaced according to error policy

## 17. Матрица минимального покрытия

| Зона | Schema | Unit | Adapter | Command | CLI | Recovery |
| --- | --- | --- | --- | --- | --- | --- |
| `schemas` | mandatory | optional | no | no | no | no |
| `errors` | no | mandatory | no | no | optional | no |
| `sources` | optional | mandatory | optional | mandatory | optional | optional |
| `templates` | optional | mandatory | optional | mandatory | optional | no |
| `artifacts` | no | optional | mandatory | mandatory | optional | mandatory |
| `core` services | optional | mandatory | no | mandatory | optional | mandatory |
| `runtime` | no | optional | mandatory | mandatory | optional | mandatory |
| `commands` | no | optional | optional | mandatory | optional | optional |
| built CLI | no | no | no | optional | mandatory | optional |

## 18. Что можно не тестировать отдельно

На этом этапе не требуется отдельное покрытие для:

- performance benchmarks;
- concurrent file writes;
- extremely large backlog pagination;
- colorized terminal output;
- non-default hook implementations beyond recording/dummy variants.

Если позже появится такой scope, это должна быть отдельная матрица.

## 19. Критерии готовности тестового контура

Тестовый контур считается достаточным для старта реализации, если:

1. Есть fixture builder для backlog root и source files.
2. Есть deterministic adapters для `fs`, `clock`, `uuid`, `hash`.
3. Есть schema-level tests для всех authored inputs и utility-owned artifacts.
4. Есть unit tests для всех `core` services и `sources`.
5. Есть command-level tests для всех mutating команд.
6. Есть хотя бы минимальные tests для `status`, `items`, `search`, `queue`, `attention`.
7. Есть recovery tests и dry-run parity tests.
8. Есть process tests built CLI на help/error/success path.

## 20. Итог

Эта матрица нужна, чтобы реализация не свелась к “несколько happy-path integration tests”.

Правильный порядок следующий:

1. schemas and adapters;
2. unit tests core/sources/templates/reports;
3. command-level orchestration tests;
4. recovery and dry-run parity;
5. built CLI process tests.

Такой порядок даёт быстрый feedback и не заставляет ловить доменные ошибки только через shell-процессы.
