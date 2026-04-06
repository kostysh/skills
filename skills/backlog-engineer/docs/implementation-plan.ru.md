# План имплементации утилиты `@kostysh/backlog-engineer-cli`

Документ задаёт инженерный порядок реализации утилиты на основе:

- [process-cli.ru.md](process-cli.ru.md)
- [utility-spec.ru.md](utility-spec.ru.md)
- [schemas-and-types.ru.md](schemas-and-types.ru.md)
- [module-interfaces.ru.md](module-interfaces.ru.md)
- [test-matrix.ru.md](test-matrix.ru.md)

Этот план не описывает частичные релизы. Он нужен только для одного:

- последовательно реализовать **полную** систему без пропусков, временных упрощений и скрытого техдолга.

## 1. Основной принцип плана

Порядок ниже — это не продуктовая фазность и не roadmap. Это только **техническая последовательность сборки** одной полноценной системы.

Правильная трактовка:

- система считается готовой только когда реализован весь контракт из концепции и спецификаций;
- промежуточные состояния нужны только как инженерные checkpoint-ы;
- ни один промежуточный checkpoint не считается “готовой утилитой”.

## 1.1. Правила выполнения плана

Во время имплементации нужно соблюдать следующие правила без исключений:

1. Выполнять только один work package за раз.
2. Не переходить к следующему work package, пока текущий полностью не прошёл приёмку.
3. После завершения имплементации work package обязательно проверить все правила приёмки этого пакета.
4. После локальной приёмки каждого work package сначала запускать внешний review на соответствие спецификациям с использованием `spec-conformance-reviewer`.
5. Не запускать `code-reviewer` и `security-reviewer`, пока `spec-conformance-reviewer` не вернул `PASS` для текущего work package.
6. После `PASS` от `spec-conformance-reviewer` запускать внешний code review и security review агентами наивысшей доступной квалификации.
7. Каждый внешний review запускать только с чётко определёнными scope и context:
   - перечислить нормативные источники и/или правила приёмки пакета;
   - перечислить точный changed surface, включая новые untracked файлы;
   - кратко перечислить уже согласованные фиксы и закрытые находки, чтобы reviewer не тратил время на stale-проблемы;
   - явно указать ожидаемый verdict (`PASS`, `PARTIAL`, `FAIL`).
8. Все согласованные находки внешнего ревью устранять до тех пор, пока пакет не получит чистый результат без оставшихся замечаний.
9. Только после успешного внешнего ревью делать отдельный commit, закрывающий один work package.
10. Вести инкрементальный лог имплементации и решений в отдельном файле [implementation-log.ru.md](implementation-log.ru.md).
11. Любое решение или допущение, принятое во время имплементации за пределами существующей концепции или спецификаций, обязательно фиксировать в [implementation-log.ru.md](implementation-log.ru.md) как отдельную пометку.

## 1.2. Единые правила приёмки work package

Любой work package считается принятым только если одновременно выполнено всё ниже:

1. Реализована вся область ответственности пакета из разделов `Что реализовать` и `Обязательные свойства`.
2. Полностью выполнен `Definition of done` для конкретного пакета.
3. Закрыты все тесты, явно назначенные этому пакету.
4. Не осталось placeholder behavior, временных shim-слоёв, `TODO`, `FIXME`, `not implemented` или “доделаем потом” внутри зоны ответственности пакета.
5. Код отформатирован и проходит обязательные проверки:
   - `pnpm run format`
   - `pnpm run lint`
   - `pnpm run typecheck`
   - релевантные тесты пакета
6. Внешний review на соответствие спецификациям (`spec-conformance-reviewer`) завершён успешно.
7. После этого внешний code review и security review для пакета также завершены успешно.
8. Результат и принятые решения записаны в [implementation-log.ru.md](implementation-log.ru.md).

## 2. Финальный результат

По завершении имплементации должны одновременно существовать:

1. Полный CLI surface из концепции:
   - `init`
   - `register-source`
   - `list-sources`
   - `template`
   - `packet`
   - `patch-item`
   - `remove-item`
   - `refresh`
   - `status`
   - `report`
   - `items`
   - `search`
   - `gaps`
   - `queue`
   - `attention`
   - `delete-backlog`
2. Полный набор utility-owned artifacts:
   - `.backlog.json`
   - `.backlog/sources.json`
   - `.backlog/applied.json`
   - `.backlog/state.json`
   - canonical imports в `packets/` и `patches/`
   - `reports/`
   - backlog-local `AGENTS.md`
3. Полный schema/type layer на `zod@v4`.
4. Полный error contract с machine-readable кодами и корректными exit codes.
5. Полный runtime:
   - hidden maintenance rebuild
   - source hashing
   - immutable packet/patch application
   - todo generation/removal
   - derived state
   - deterministic queue/attention/search/items
6. Полный report pipeline.
7. Полный test contract из матрицы.

## 3. Что не считается готовностью

Следующие состояния считаются незавершёнными и не принимаются как результат:

- scaffolded команды с `not implemented`;
- команды без `--dry-run`, если по концепции dry-run обязателен;
- runtime без hidden maintenance rebuild;
- `packet` или `patch` без canonical import и applied registry;
- read-команды, которые не выдают зафиксированные DTO;
- queue без chain semantics;
- attention без `attention_reason_codes` и `attention_reasons`;
- реализация без полного обязательного тестового покрытия;
- “потом доделаем report/delete-backlog/recovery”.

## 4. Ограничения, которые нельзя нарушать по ходу реализации

1. `packet` добавляет только новые задачи.
2. Изменение и удаление существующих задач — только через patch.
3. Context entities immutable по ключу.
4. `todo` создаёт только утилита.
5. Закрытый `todo` удаляется, а не архивируется в state.
6. Read-команды не делают semantic mutation.
7. Hidden maintenance rebuild не равен `refresh`.
8. Все успешные ответы — JSON.
9. Все внешние shapes идут через `schemas`.
10. Вся business logic живёт вне `cli` и вне `commands`.
11. Work package закрывается только после форматирования, линтинга, typecheck, тестов и внешнего аудита.

## 5. Порядок реализации

Ниже перечислены work packages. Они должны выполняться по порядку, потому что каждый следующий пакет опирается на предыдущий.

## 5.1. Work package A — Structural bootstrap

**Цель**

Подготовить кодовую структуру пакета под модульную архитектуру из [module-interfaces.ru.md](module-interfaces.ru.md).

**Что создать**

- `src/cli/`
- `src/commands/`
- `src/runtime/`
- `src/core/`
- `src/artifacts/`
- `src/sources/`
- `src/templates/`
- `src/reports/`
- `src/schemas/`
- `src/errors/`
- `src/hooks/`

**Что перенести**

- текущий scaffold из `src/cli.ts` и `src/commands.ts` разложить по новой структуре;
- сохранить существующий built-entry contract для `scripts/backlog-engineer.mjs`.

**Критически важно**

- не добавлять business logic в `cli`;
- не создавать временный “общий util.ts”, который начнёт смешивать слои.

**Definition of done**

- структура `src/` соответствует module interfaces;
- `build`, `typecheck`, `lint` и `test` продолжают запускаться;
- built CLI по-прежнему собирается.

## 5.2. Work package B — Schemas and errors

**Цель**

Завершить строгий внешний и внутренний контракт утилиты в коде.

**Что реализовать**

- scalar schemas;
- packet schemas;
- patch schemas;
- artifact schemas;
- command DTO schemas;
- error payload schema;
- error code catalog;
- exit code mapping;
- error factory layer.

**Что нельзя откладывать**

- exact object policy;
- `source_id` everywhere;
- `attention_reason_codes` / `attention_reasons` alignment;
- `PatchFile` invariants;
- `RootMarkerFile`, `SourceRegistryFile`, `AppliedRegistryFile`, `StateFile`.

**Тесты**

- schema-level tests из матрицы;
- error mapping tests;
- negative parse tests для invalid fixture files.

**Definition of done**

- все DTO и artifacts валидируются через реальные `zod` schemas;
- ошибки сериализуются в final machine-readable contract;
- command handlers получают уже normalised validated DTO, а не raw argv fragments.

## 5.3. Work package C — CLI public API foundation

**Цель**

Реализовать внешний процессный контракт CLI как first-class слой, а не оставлять его на финальный hardening.

**Что реализовать**

- command registry;
- argv parsing;
- unknown command handling;
- help / help-for-command / version;
- unsupported flags and usage errors;
- stdout/stderr split;
- success/error process envelope;
- built artifact entry contract for `scripts/backlog-engineer.mjs`.

**Обязательные свойства**

- CLI не содержит business logic;
- CLI знает только command registry, DTO parsing entrypoints и error-to-exit mapping;
- process contract соответствует `utility-spec.ru.md`;
- unknown command, invalid args и usage conflicts оформляются как final public behavior, а не temporary messages.

**Тесты**

- CLI process tests для:
  - help;
  - version;
  - unknown command;
  - unsupported flags;
  - stdout/stderr separation;
  - exit codes;
- unit-tests command registry and argv parsing.

**Definition of done**

- built CLI artifact already follows final public API contract for global behavior:
  - help;
  - version;
  - unknown command handling;
  - usage errors;
  - stdout/stderr split;
  - exit codes;
- CLI layer does not need later architectural rewrite.

## 5.4. Work package D — Runtime foundation and orchestration boundary

**Цель**

Собрать базовый инфраструктурный слой и явно зафиксировать runtime boundary, через который будут проходить все команды.

**Что реализовать**

- runtime ports:
  - `FileSystemPort`
  - `PathPort`
  - `ClockPort`
  - `UuidPort`
  - `HashPort`
  - `ProcessIoPort`
- runtime dependency bag;
- root discovery;
- базовые JSON helpers;
- deterministic path helpers;
- no-op hooks registry;
- `createRuntime()`;
- `createContext()`.

**Обязательные свойства**

- любой command handler запускается через command context;
- `commands` не вызывают rebuild или stores напрямую в обход runtime;
- hidden maintenance rebuild позже будет входить в runtime boundary только как orchestration entrypoint, но не как логика этого work package;
- hook registry и command context создаются централизованно, а не локально по командам.

**Тесты**

- unit-tests для root discovery и context wiring;
- runtime tests для:
  - `createContext()`
  - root discovery
  - runtime dependency bag
  - no-op hook registry

**Definition of done**

- runtime foundation и command context существуют в коде;
- любой дальнейший command handler подключается только через этот boundary;
- следующий слой может добавлять state guards и rebuild semantics без перестройки runtime architecture.

## 5.5. Work package E — Artifact stores and backlog layout

**Цель**

Реализовать utility-owned артефакты и policy их чтения/записи.

**Что реализовать**

- `root-marker-store`
- `source-registry-store`
- `applied-registry-store`
- `state-store`
- `canonical-import-store`
- `report-store`
- `backlog-layout`
- `delete-backlog`

**Обязательные свойства**

- atomic writes;
- canonical import filenames;
- поддержка file-or-directory output для `template`;
- backlog-local `AGENTS.md` copy;
- `reports/` как стандартная часть layout-а.

**Тесты**

- adapter-level tests с in-memory FS;
- canonical filename generation;
- write/read round-trips;
- scoped delete behavior for utility-owned artifacts only.

**Definition of done**

- утилита умеет полностью создать и прочитать backlog layout;
- все utility-owned JSON artifacts читаются/пишутся через один слой;
- командный слой не знает расположение файлов напрямую.

## 5.6. Work package F — `init` command

**Цель**

Закрыть первый полностью завершённый command slice: создание backlog root с final output contract и полным набором отрицательных сценариев.

**Что реализовать**

- command handler `init`;
- minimal `templates` surface, required by `init`:
  - `renderBacklogAgentsTemplate()`
- вызов layout creation;
- запись `.backlog.json`;
- запись initial `.backlog/state.json`;
- запись initial `.backlog/sources.json`;
- запись initial `.backlog/applied.json`;
- копирование backlog-local `AGENTS.md`;
- final `InitCommandOutput`.

**Обязательные свойства**

- `init` — единственная команда, которая работает без существующего backlog root;
- `init` падает на existing backlog root;
- `init` падает на non-empty directory без backlog marker, если это запрещено contract-ом;
- backlog-local `AGENTS.md` создаётся уже здесь через канонический template renderer, а не через placeholder copy behavior;
- output paths соответствуют DTO буквально.

**Тесты**

- unit-tests for `renderBacklogAgentsTemplate()`;
- command-level tests for all positive and negative `init` cases;
- CLI process tests for `init`;
- adapter-level verification created layout.

**Definition of done**

- `init` реализован как полноценная команда, а не implicit side effect других work packages;
- `renderBacklogAgentsTemplate()` уже существует как канонический template entrypoint для `init`;
- negative scenarios из test matrix покрыты;
- после `init` backlog root соответствует final layout contract.

## 5.7. Work package G — Sources and templates slice

**Цель**

Сделать первый полноценный vertical slice после `init`, который уже полезен сам по себе и опирается только на foundation и artifact layer.

**Что реализовать**

- `register-source`
- `list-sources`
- `template packet`
- `template patch`
- hook point `afterSourceRegistered`

**Обязательные свойства**

- deterministic `source_label`;
- stable path normalization;
- hash calculation;
- no hidden hash refresh on repeated `register-source`;
- `template patch` uses current `max(sequence) + 1`;
- `template patch` validates `item_keys`.

**Тесты**

- unit-tests for `sources/*`;
- unit-tests for packet/patch template renderers;
- command-level tests for `register-source`, `list-sources`, `template`;
- CLI process smoke tests for these commands.

**Definition of done**

- можно зарегистрировать source;
- можно получить packet/patch templates;
- команды выдают final DTO shapes, а не placeholder text.

## 5.8. Work package H — Core graph model

**Цель**

Реализовать чистый domain layer без командной оркестрации.

**Что реализовать**

- `context-service`
- `graph-service`
- `todo-service`
- `derived-state-service`
- `mutation-service`

**Что должно поддерживаться**

- merge context без конфликтов;
- reject glossary conflict;
- reject immutable context conflict;
- add/remove/update items;
- reverse dependency calculation;
- item-linked context cleanup;
- todo deduplication;
- `needs_attention`;
- `attention_reason_codes`;
- `attention_reasons`;
- stage-aligned `ready_for_next_step`.

**Особо важно**

- derived state должен быть полностью deterministic;
- mutation services и rebuild должны использовать один и тот же domain pipeline;
- cleanup логика `remove-item` не должна дублироваться по нескольким командам.

**Тесты**

- unit-tests для `graph-service`, `context-service`, `todo-service`, `derived-state-service`, `mutation-service`.

**Definition of done**

- можно чисто в памяти собрать backlog state из packet/patch и получить final derived state без участия CLI или FS.

## 5.9. Work package I — Mutation commands and mutation-state guard

**Цель**

Реализовать mutation command surface поверх готовых core pipelines и закрыть state-guard contract для mutating команд.

**Что реализовать**

- command handlers:
  - `packet`
  - `patch-item`
  - `remove-item`
- `ensureMutationState()`
- mutation summaries
- `--dry-run`
- hook points:
  - `beforeCommand`
  - `afterCommand`
  - `afterPacketApplied`
  - `afterPatchApplied`
- error propagation rules for mutation hook failures.

**Обязательные свойства**

- mutating команды используют `ensureMutationState()` перед применением;
- `ensureMutationState()` имеет final fail-fast contract для broken canonical artifacts;
- no-op hooks остаются базовой реализацией, но реальные invocation points уже существуют;
- hooks не могут мутировать каноническое состояние напрямую;
- failures hooks конвертируются в final error contract без silent swallow.

**Тесты**

- semantic-validation tests;
- state-transition-validation tests;
- runtime-with-in-memory-adapters tests for `ensureMutationState()`;
- command-level tests for all mutation commands;
- dry-run parity tests;
- command-level tests for mutation hook invocation points.

**Definition of done**

- все mutation-команды работают через один общий engine;
- нет расхождения между real apply и dry-run, кроме записи на диск;
- registries и canonical imports полностью консистентны.

## 5.10. Work package J — Refresh and query-state recovery

**Цель**

Реализовать всё, что связано с source changes и hidden rebuild.

**Что реализовать**

- source-scoped refresh:
  - all
  - item
  - `source_id`
  - `source_label`
  - `source_path`
- `ensureQueryState()`
- hidden maintenance rebuild;
- rebuild from canonical artifacts through the same semantic mutation pipelines, что и live `packet` / `patch-item` / `remove-item`;
- divergence detection;
- fail-fast behavior for broken registries / missing canonical files / invalid canonical files.
- hook point `afterRefresh`

**Обязательные свойства**

- `refresh` updates source hashes and runtime state;
- read-commands may rebuild runtime state, but must not perform semantic refresh;
- rebuild must not mutate `sources.json` or `applied.json`;
- rebuild must not rehash sources;
- `status --refresh` must be implemented as explicit composed behavior.

**Тесты**

- recovery tests from matrix;
- runtime-with-in-memory-adapters tests for `ensureQueryState()` and `rebuildState()`;
- command-level tests for `refresh` and `status --refresh`;
- failure-mode tests for broken registries and canonical artifacts.
- command-level tests for `afterRefresh`.

**Definition of done**

- runtime can recover from broken or stale `state.json`;
- refresh scopes behave exactly as in concept/spec;
- read path and refresh path are clearly separated in code and tests.

## 5.11. Work package K — Read model commands

**Цель**

Реализовать весь read surface поверх готового state/query layer.

**Что реализовать**

- `status`
- `items`
- `search`
- `gaps`
- `queue`
- `attention`

**Обязательные свойства**

- `status` = short summary;
- `items` = full cards for known keys;
- `search` = filtered compact list when keys are not yet known;
- `queue` = chains, not flat list;
- `attention` = deterministic ordering of reasons;
- `gaps` = explicit blocker listing.

**Что не должно попасть сюда**

- duplicated business logic;
- direct file layout knowledge;
- hidden refresh.

**Тесты**

- unit-tests for `search-service`, `items-service`, `queue-service`, `attention-service`;
- command-level tests for read commands;
- CLI process tests for JSON outputs.
- `status --refresh` integration tests against recovery engine.

**Definition of done**

- весь read surface соответствует DTO contracts;
- scoped UX работает как в концепте;
- агент может решать все операторские read-сценарии только этими командами.

## 5.12. Work package L — Reporting and report hooks

**Цель**

Реализовать полноценный операторский report pipeline.

**Что реализовать**

- report model builder;
- markdown renderer;
- Mermaid renderer;
- report file writer;
- standard output location under `reports/`;
- Mermaid sidecar file generation;
- report hook integration:
  - `buildSystemSummary`
  - `decorateReportSections`

**Обязательные свойства**

- краткое описание системы;
- backlog metrics;
- global mermaid graph;
- local graphs for large backlog mode;
- attention section;
- `Ready For Next Step` section;
- full item catalog;
- fallback summary rules for `target_system` and `as_built`;
- grouping / threshold logic for large backlog mode;
- deterministic report sections and file names.

**Тесты**

- unit-tests for report model and renderers;
- adapter-level tests for report writes;
- command-level tests for `report`.
- dedicated tests for report hook invocation and report section decoration.

**Definition of done**

- `report` generates final operator document on disk without manual post-processing;
- output is deterministic for same state;
- report output literally matches the documented operator contract.

## 5.13. Work package M — Destructive command

**Цель**

Завершить CLI surface последней destructive-командой.

**Что реализовать**

- `delete-backlog --confirm`

**Обязательные свойства**

- без подтверждения команда блокируется;
- с подтверждением удаляются только штатные backlog-артефакты утилиты;
- если после удаления штатных артефактов backlog root пуст, root тоже удаляется;
- если в backlog root есть посторонние entry, команда завершается ошибкой и ничего не удаляет;
- exit code и error payload соответствуют contract.

**Тесты**

- state-transition tests for destructive confirm;
- command-level tests;
- CLI process tests.

**Definition of done**

- CLI surface закрыт полностью;
- больше не остаётся scaffolded command placeholders.

## 5.14. Work package N — Full hardening pass

**Цель**

Довести имплементацию до финального качества и снять все остаточные расхождения.

**Что обязательно сделать**

- пройти все обязательные тесты из [test-matrix.ru.md](test-matrix.ru.md);
- проверить built artifact из `scripts/`;
- проверить help/version/usage;
- вычистить все `TODO`, `FIXME`, `not implemented`, временные alias и shim layers;
- проверить portability skill package;
- проверить, что command outputs соответствуют DTO буквально.

**Definition of done**

- `pnpm run format`
- `pnpm run lint`
- `pnpm run typecheck`
- `pnpm run build`
- `pnpm run test`

все зелёные;

- нет scaffold placeholders;
- нет незакрытых разрывов между концептом, спецификацией и кодом;
- CLI соответствует документам полностью.

## 5.15. Ownership hook points

Этот раздел фиксирует не отдельный work package, а распределение уже существующих hook points по пакетам реализации.

- Work package D:
  - hook contracts;
  - no-op hooks registry;
  - runtime-level hook wiring.
- Work package G:
  - `afterSourceRegistered`
- Work package I:
  - `beforeCommand`
  - `afterCommand`
  - `afterPacketApplied`
  - `afterPatchApplied`
- Work package J:
  - `afterRefresh`
- Work package L:
  - `buildSystemSummary`
  - `decorateReportSections`

Hook point считается реализованным только в том work package, где появляется его реальный invocation path и обязательные тесты. Нельзя считать hook “готовым” только потому, что для него уже существует type contract или no-op registry.

## 6. Рекомендуемый порядок коммитов

Это не product phasing. Это способ не смешивать несвязанные изменения в одном диффе.

1. `refactor(backlog-engineer): split scaffold into module layout`
2. `feat(backlog-engineer): add schema and error foundation`
3. `feat(backlog-engineer): implement cli public api foundation`
4. `feat(backlog-engineer): implement runtime boundary and orchestration`
5. `feat(backlog-engineer): implement artifact stores and backlog layout`
6. `feat(backlog-engineer): implement init command`
7. `feat(backlog-engineer): implement source registry and template commands`
8. `feat(backlog-engineer): implement core graph and derived state services`
9. `feat(backlog-engineer): implement mutation commands and mutation-state guard`
10. `feat(backlog-engineer): implement refresh and query-state recovery`
11. `feat(backlog-engineer): implement read commands`
12. `feat(backlog-engineer): implement report pipeline`
13. `feat(backlog-engineer): implement delete-backlog`
14. `test(backlog-engineer): complete full coverage matrix`

## 7. Порядок запуска работ

Если начать прямо сейчас, практический порядок действий такой:

1. Разложить scaffold по module layout.
2. Сразу реализовать `schemas` и `errors`.
3. Затем закрыть CLI public API foundation.
4. Затем реализовать runtime boundary: `createRuntime`, `createContext`, ports, root discovery и command context.
5. Затем сделать artifact stores и backlog layout.
6. Затем реализовать `init` как отдельный завершённый slice.
7. Затем закрыть `register-source`, `list-sources`, `template`.
8. После этого идти в `core`.
9. Потом mutation commands вместе с `ensureMutationState()` и mutation hook points.
10. Потом refresh/rebuild вместе с `ensureQueryState()` и `afterRefresh`.
11. Потом read commands.
12. Потом report вместе с report hooks.
13. Потом `delete-backlog`.
14. В конце — полный hardening pass по матрице тестов.

## 8. Контрольные вопросы перед стартом каждого work package

Перед началом любого следующего work package нужно ответить `да` на все вопросы:

1. Предыдущий пакет закрыл свой definition of done полностью?
2. Нет ли временного shim-а, который планируется “потом выкинуть”?
3. Текущий шаг уменьшает сложность следующего, а не переносит её вперёд?
4. Есть ли под этот шаг явные unit/command tests?
5. Не протекает ли business logic в `commands` или `cli`?
6. Не дублируется ли shape, уже принадлежащий `schemas`?
7. Не появится ли после этого шага новый вид технического долга?

Если хотя бы на один вопрос ответ `нет`, work package нельзя считать завершённым.
