# Лог имплементации `@kostysh/backlog-engineer-cli`

Документ ведётся инкрементально во время реализации плана из [implementation-plan.ru.md](implementation-plan.ru.md).

## Правила ведения лога

- Одна завершённая запись соответствует одному завершённому work package.
- Запись добавляется до коммита пакета и обновляется после внешнего ревью.
- В логе фиксируются только факты и принятые решения, которые важны для следующих пакетов.
- Любое решение или допущение за пределами текущей концепции, спецификаций и утверждённых контрактов фиксируется отдельной явной пометкой.
- Лог не заменяет git history, а дополняет её инженерным контекстом.
- Начиная с work package `E`, для каждого пакета обязательны три внешних ревью в фиксированном порядке:
  1. `spec-conformance-reviewer`
  2. после `PASS` — `code-reviewer`
  3. после `PASS` — `security-reviewer`

## Формат записи

### Work package `<буква>` — `<название>`

- Статус:
- Дата:
- Коммит:
- Что сделано:
- Ключевые решения:
- Допущения вне спецификации:
- Проверки приёмки:
- Внешнее ревью:
- Следующий пакет:

## Записи

## Общие решения по процессу

- С 2026-04-06, начиная с work package `E`, обязательный внешний review-контур включает:
  1. `spec-conformance-reviewer`
  2. после `PASS` — `code-reviewer`
  3. после `PASS` — `security-reviewer`
- Для текущего work package `D` сохраняется ранее действовавший review-контур:
  - `code-reviewer`
  - `security-reviewer`

### Work package `A` — `Structural bootstrap`

- Статус: завершён
- Дата: 2026-04-06
- Коммит: `refactor(backlog-engineer): complete work package A structural bootstrap`
- Что сделано:
  - текущий scaffold разложен по модульной структуре `src/`
  - `src/cli.ts` стал тонким entrypoint
  - CLI registry и run-loop вынесены в `src/cli/`
  - command scaffold разложен по `src/commands/*`
  - создан file-level каркас модулей `runtime`, `core`, `artifacts`, `sources`, `templates`, `reports`, `schemas`, `errors`, `hooks`
  - exit codes вынесены в `src/errors/exit-codes.ts`
  - добавлен локальный `biome.json`, который сохраняет coverage по `src` и `test`, но точечно игнорирует intentionally broken JSON fixtures
- Ключевые решения:
  - package A не вводит новую business logic и не меняет поведение scaffold-команд
  - file-level skeleton создан сразу полностью, чтобы следующие пакеты не начинались с неполного дерева `src/`
  - ownership exit codes закреплён сразу в `errors`, чтобы не допустить drift process-level concerns в `commands`
  - локальный `biome.json` выбран вместо shell-specific scripts, чтобы не делать workflow POSIX-specific и сохранить единый lint/format boundary для TypeScript source и test файлов
- Допущения вне спецификации:
  - нет
- Проверки приёмки:
  - `pnpm --dir skills/backlog-engineer run format` — OK
  - `pnpm --dir skills/backlog-engineer run lint` — OK
  - `pnpm --dir skills/backlog-engineer run test` — OK
- Внешнее ревью:
  - code review — PASS
  - security review — PASS
- Следующий пакет: `B — Schemas and errors`

### Work package `B` — `Schemas and errors`

- Статус: завершён
- Дата: 2026-04-06
- Коммит:
- Что сделано:
  - реализован полный schema/type слой на `zod@v4` для scalar values, `packet`, `patch`, utility-owned artifacts и command DTO
  - реализован error catalog, machine-readable payload, default messages и exit-code mapping
  - зафиксирован public process contract для usage errors через `EXIT_USAGE = 2`
  - все source imports в `src/` переведены на `.ts`, чтобы тесты и source-run path работали через встроенный Node TypeScript runtime
  - тесты переведены с ванильного JS на TypeScript и запускаются через `node --experimental-strip-types --test`
  - добавлен schema/error test seam по реальным fixtures, negative parse cases и DTO edge cases из матрицы
  - `BacklogError` теперь runtime-санацирует `details` до JSON-safe payload
- Ключевые решения:
  - package B закрывает весь authored/public contract до начала реализации runtime и command semantics
  - generic `normalizeError()` больше не классифицирует любой `SyntaxError` как `BE_INVALID_JSON`; JSON-specific mapping остаётся только у явной parse boundary
  - schema tests пишутся на TypeScript и работают напрямую по source `.ts`, а не через отдельную промежуточную компиляцию
- Допущения вне спецификации:
  - для встроенного Node TypeScript runtime source files переведены на `.ts`-спецификаторы и `tsconfig.json` переключён на `NodeNext` + `allowImportingTsExtensions`; это implementation/tooling решение, не описанное отдельно в концепте
  - runtime-санация `BacklogError.details` использует фиксированную политику преобразования не-JSON значений:
    - `Date` -> ISO string
    - `Error` -> `{ name, message }`
    - non-finite numbers -> string form (`NaN`, `Infinity`)
    - circular references -> `\"[Circular]\"`
    - прочие неподдерживаемые значения -> `\"[Unsupported value]\"`
- Проверки приёмки:
  - `pnpm --dir skills/backlog-engineer run format` — OK
  - `pnpm --dir skills/backlog-engineer run lint` — OK
  - `pnpm --dir skills/backlog-engineer run test` — OK
- Внешнее ревью:
  - code review — PASS
  - security review — PASS
- Следующий пакет: `C — CLI public API foundation`

### Work package `C` — `CLI public API foundation`

- Статус: завершён
- Дата: 2026-04-06
- Коммит:
- Что сделано:
  - реализован final CLI process contract для глобальных сценариев:
    - `--help`
    - `help <command>`
    - `command --help`
    - `--version`
    - `unknown command`
    - `usage errors`
  - CLI переведён на JSON-first поведение:
    - success payloads идут в `stdout`
    - error payloads идут в `stderr`
    - exit codes мапятся только через error catalog и public contract
  - command layer переведён на typed adapters:
    - у каждой команды есть `usage`, `options`, `parseArgs`, `inputSchema`, `outputSchema`
    - argv parsing и usage validation теперь происходят до business logic
  - добавлены CLI-level schemas для:
    - global help output
    - command help output
    - version output
  - введён общий machine-readable usage error code для argv-конфликтов
  - процессные tests на built artifact переписаны под финальный JSON contract
  - добавлены unit-tests для:
    - `parseCliIntent`
    - command registry
    - help/version builders
- Ключевые решения:
  - CLI остаётся тонким и знает только:
    - global intent parsing
    - command registry
    - success/error serialization
    - help/version rendering
  - command adapters уже принимают final DTO even while command semantics in later packages remain placeholder-backed
  - `delete-backlog` уже на CLI/command boundary возвращает `BE_DELETE_CONFIRM_REQUIRED`, потому что это публичное destructive guard behavior, а не внутренняя business detail
  - built artifact `scripts/backlog-engineer.mjs` проверяется process tests, а не только source-level unit-tests
- Допущения вне спецификации:
  - спецификация требовала JSON для всех успешных ответов, но не задавала отдельные DTO для `--help` и `--version`; поэтому добавлены явные CLI-level JSON payloads для:
    - global help
    - command help
    - version
  - в существующем error catalog не было общего stable code для argv/usage conflicts, поэтому добавлен `BE_USAGE_INVALID` с exit code `2`; это implementation-level уточнение общего usage-error класса
- Проверки приёмки:
  - `pnpm --dir skills/backlog-engineer run format` — OK
  - `pnpm --dir skills/backlog-engineer run lint` — OK
  - `pnpm --dir skills/backlog-engineer run typecheck` — OK
  - `pnpm --dir skills/backlog-engineer run test` — OK
- Внешнее ревью:
  - code review — PASS
  - security review — PASS
- Следующий пакет: `D — Runtime foundation and orchestration boundary`

### Work package `D` — `Runtime foundation and orchestration boundary`

- Статус: завершён
- Дата: 2026-04-06
- Коммит:
- Что сделано:
  - реализованы shared runtime types и runtime ports:
    - `FileSystemPort`
    - `PathPort`
    - `ClockPort`
    - `UuidPort`
    - `HashPort`
    - `ProcessIoPort`
  - реализованы Node adapters и сборка default runtime dependency bag
  - реализован backlog-root discovery по `.backlog.json`
  - реализован fail-fast no-op hooks registry с безопасными default return values
  - введены typed module entrypoints для `artifacts`, `sources`, `templates`, `reports`, `core`, `schemas`, `errors`, `hooks`
  - реализованы `SchemaModule` и `ErrorModule` как concrete runtime services
  - реализованы `RuntimeStateCoordinator` contract и runtime-level command context
  - `runCli()` теперь создаёт runtime/context и вызывает top-level command hooks только для реальных command executions
  - добавлены runtime tests на:
    - root discovery
    - `createContext()`
    - no-op hooks
    - wiring `ensureQueryState()` / `ensureMutationState()` / `rebuildState()`
  - добавлен прямой unit-test на `beforeCommand` / `afterCommand` orchestration в `runCli()`, чтобы hook flow был покрыт не только косвенными process tests
- Ключевые решения:
  - argv validation и command-local `parseArgs` выполняются до `runtime.createContext()`, чтобы usage errors не зависели от наличия backlog root
  - hooks для `beforeCommand` / `afterCommand` не вызываются для `--help`, `help <command>` и `--version`; они относятся только к реальным command executions
  - `schemas` и `errors` оформлены как concrete runtime modules уже на package D, потому что дальше все command contexts должны получать единый service bundle, а не raw namespace imports
- Допущения вне спецификации:
  - до реализации concrete `artifacts` / `sources` / `templates` / `reports` / `core` runtime подставляет fail-fast module proxies, которые явно падают с `BE_INTERNAL_STATE_CORRUPT`, если кто-то попытается вызвать ещё не реализованный module surface
  - до реализации state recovery semantics `ensureQueryState()` / `ensureMutationState()` / `rebuildState()` делегируются в explicit unconfigured state coordinator, который так же fail-fast падает с `BE_INTERNAL_STATE_CORRUPT`; это временная runtime guard policy для сохранения архитектурной границы без преждевременной реализации rebuild logic
  - для точной проверки CLI hook orchestration в `runCli()` добавлен внутренний dependency seam только для unit-tests: optional injection `findCommand` и `createRuntime`; production path по умолчанию использует те же concrete зависимости и не меняет публичный CLI contract
- Проверки приёмки:
  - `pnpm --dir skills/backlog-engineer run format` — OK
  - `pnpm --dir skills/backlog-engineer run lint` — OK
  - `pnpm --dir skills/backlog-engineer run typecheck` — OK
  - `pnpm --dir skills/backlog-engineer run test` — OK
- Внешнее ревью:
  - code review — PASS
  - security review — PASS
- Следующий пакет: `E — Artifacts bootstrap and layout ownership`
- Дополнительная пометка:
  - начиная с work package `E`, кроме `code-reviewer` и `security-reviewer` обязателен также внешний review через `spec-conformance-reviewer`

### Work package `E` — `Artifact stores and backlog layout`

- Статус: завершён
- Дата: 2026-04-06
- Коммит:
- Что сделано:
  - реализован concrete `ArtifactsModule` как единая точка владения utility-owned артефактами backlog root
  - реализованы backlog layout constants и path helpers для:
    - `.backlog.json`
    - `.backlog/`
    - `packets/`
    - `patches/`
    - `reports/`
    - `AGENTS.md`
  - реализованы stores для:
    - root marker
    - source registry
    - applied registry
    - runtime state
    - canonical packet/patch imports
    - report outputs
  - реализованы atomic JSON/text writes через temp sibling file + rename
  - реализована artifact operation для удаления только штатных backlog-артефактов и удаления root только если он пуст после cleanup
  - runtime по умолчанию теперь wires concrete `artifacts` module вместо fail-fast proxy
  - добавлены adapter-level tests с in-memory FS для layout creation, round-trip, canonical imports, report writes, template outputs и destructive delete
- Ключевые решения:
  - все utility-owned JSON artifacts читаются и пишутся только через artifact stores; командный слой не знает layout напрямую
  - root discovery больше не держит собственную строковую константу marker basename и использует единый artifact-owned export
  - canonical imports сохраняют исходное имя файла, но получают стабильный hash-prefix для дедупликации и аудита
  - `writeInitialArtifacts()` собирает init-time bootstrap как единый artifact workflow, а не разрозненный набор writes
- Допущения вне спецификации:
  - `template --out`, указывающий на ещё не существующий путь с завершающим `/` или `\\`, интерпретируется как явный directory target: утилита создаёт директорию и записывает туда файл с каноническим basename шаблона
- Проверки приёмки:
  - `pnpm --dir skills/backlog-engineer run format` — OK
  - `pnpm --dir skills/backlog-engineer run lint` — OK
  - `pnpm --dir skills/backlog-engineer run typecheck` — OK
  - `pnpm --dir skills/backlog-engineer run test` — OK
- Внешнее ревью:
  - spec conformance review — PASS
  - code review — PASS
  - security review — PASS
- Дополнительные согласованные решения:
  - `delete-backlog` удаляет только штатные backlog-артефакты утилиты и отказывается работать, если в backlog root есть посторонние entry; это решение было отдельно согласовано и затем перенесено в концепт и спецификации
- Следующий пакет: `F — init command`

### Work package `F` — `init command`

- Статус: локальная имплементация завершена, идёт внешний review
- Дата: 2026-04-06
- Коммит:
- Что сделано:
  - реализована полноценная команда `init` вместо placeholder handler
  - runtime context дополнен semantic host helpers:
    - `resolveCliPath(...)`
    - `nowIsoUtc()`
  - реализован concrete `TemplatesModule` и канонический `renderBacklogAgentsTemplate()`
  - `ArtifactsModule` получил orchestration entrypoint `initializeBacklogRoot(...)` для init-time bootstrap
  - `init` теперь:
    - нормализует CLI path через runtime host
    - создаёт root marker, `sources.json`, `applied.json`, `state.json`
    - пишет backlog-local `AGENTS.md`
    - возвращает final `InitCommandOutput`
  - добавлены тесты на:
    - unit equality `renderBacklogAgentsTemplate()` vs canonical asset
    - command-level positive/negative `init` scenarios
    - CLI process happy-path и negative non-empty-root scenario
- Ключевые решения:
  - команда `init` осталась тонким orchestrator-ом; init-time bootstrap вынесен в `artifacts.initializeBacklogRoot(...)`, потому что именно `artifacts` владеет layout и utility-owned bootstrap files
  - `renderBacklogAgentsTemplate()` возвращает встроенную каноническую строку, а отдельный unit-test гарантирует полное совпадение с asset-файлом `assets/backlog-agents.template.md`
- Допущения вне спецификации:
  - `CommandExecutionContext` расширен semantic helper-слоем `host`, чтобы команды не обращались напрямую к `fs/path/clock` и не использовали `node:path` или `new Date()` в обход runtime boundary
  - `ArtifactsModule` расширен методом `initializeBacklogRoot(...)` как artifact-owned bootstrap orchestration для `init`; это решение затем синхронизировано в `module-interfaces.ru.md`
- Проверки приёмки:
  - `pnpm --dir skills/backlog-engineer run format` — OK
  - `pnpm --dir skills/backlog-engineer run lint` — OK
  - `pnpm --dir skills/backlog-engineer run typecheck` — OK
  - `pnpm --dir skills/backlog-engineer run test` — OK
- Внешнее ревью:
  - spec conformance review — pending
  - code review — pending
  - security review — pending
- Следующий пакет: `G — Sources and templates slice`

### Cross-package correction — `delete-backlog` public command surface

- Статус: локальная доработка завершена, начинается внешний review
- Дата: 2026-04-06
- Коммит:
- Что сделано:
  - `delete-backlog` перестал быть placeholder-командой и теперь реализует реальный success-path через `artifacts.deleteBacklog(...)`
  - добавлены command-level tests для:
    - confirmed delete happy-path
    - confirmed refusal при посторонних entry в backlog root
    - восстановление `cwd` при отказе
    - отказ для backlog root с чужим `tool_name`
  - добавлены CLI process tests для:
    - `delete-backlog --confirm` success-path
    - `delete-backlog --confirm` refusal при посторонних entry
    - `delete-backlog --confirm` refusal при symlinked managed entry
    - `delete-backlog --confirm` refusal для backlog root с чужим `tool_name`
  - `artifacts.deleteBacklog(...)` теперь валидирует все present managed entries на expected type / no-symlink до начала удаления
  - runtime root discovery больше не принимает symlinked `.backlog.json` marker
- Ключевые решения:
  - публичная destructive-команда не должна оставаться placeholder, если для неё уже есть нормативный contract, даже если её основной work package расположен позже в implementation plan
- Допущения вне спецификации:
  - `delete-backlog` перед финальным удалением пустого backlog root переводит процесс в родительскую директорию backlog root, если команда была запущена из самого backlog root или из его вложенной директории; это нужно, чтобы built CLI корректно завершался после удаления текущей рабочей директории
  - `delete-backlog` дополнительно доказывает tool ownership через parsed root marker metadata (`tool_name`, `schema_version`, `layout_version`) перед destructive delete; это усиливает security boundary сверх исходной формулировки концепта
- Проверки приёмки:
  - `pnpm --dir skills/backlog-engineer run format` — OK
  - `pnpm --dir skills/backlog-engineer run lint` — OK
  - `pnpm --dir skills/backlog-engineer run test` — OK
- Внешнее ревью:
  - spec conformance review — PASS
  - code review — PASS
  - security review — PASS
