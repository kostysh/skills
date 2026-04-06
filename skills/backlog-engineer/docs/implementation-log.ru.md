# Лог имплементации `@kostysh/backlog-engineer-cli`

Документ ведётся инкрементально во время реализации плана из [implementation-plan.ru.md](implementation-plan.ru.md).

## Правила ведения лога

- Одна завершённая запись соответствует одному завершённому work package.
- Запись добавляется до коммита пакета и обновляется после внешнего ревью.
- В логе фиксируются только факты и принятые решения, которые важны для следующих пакетов.
- Любое решение или допущение за пределами текущей концепции, спецификаций и утверждённых контрактов фиксируется отдельной явной пометкой.
- Лог не заменяет git history, а дополняет её инженерным контекстом.

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
  - локальный `biome.json` выбран вместо shell-specific scripts, чтобы не делать workflow POSIX-specific и не урезать lint/format boundary до `*.test.mjs`
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
