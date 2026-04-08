# Спецификация утилиты `dossier-engineer`

## Статус документа

Нормативным источником истины для поведения CLI остаётся код:

- [`src/cli.ts`](../src/cli.ts)
- [`src/commands.ts`](../src/commands.ts)
- [`src/core/`](../src/core)
- [`src/lib/`](../src/lib)

Документ фиксирует фактический контракт утилиты в текущем состоянии.

## 1. Назначение

`dossier-engineer` — это единый CLI для поддержки docs-as-code workflow вокруг Feature Dossier.
Утилита работает с:

- markdown-досье в `docs/features`
- глобальным индексом `docs/ssot/index.md`
- машинно-проверяемыми JSON-артефактами в `.dossier/`
- состоянием git-репозитория

Backlog graph, backlog selection, and backlog lifecycle actualization остаются вне этой утилиты и принадлежат `backlog-engineer`.

Утилита не хранит собственную базу данных и не использует внешний сервис как источник истины. Все вычисления строятся поверх файлов репозитория и, при необходимости, состояния git.

## 2. Границы ответственности

Утилита отвечает за:

- чтение и валидацию Feature Dossier
- генерацию и обновление SSOT index
- проверку покрытия AC ссылками в тестах
- поиск явных debt markers
- аудит drift между изменённым досье и кодовым follow-up
- запись review / verification / step-close артефактов
- вычисление dossier-local следующего шага workflow

Утилита не отвечает за:

- редактирование самих досье по содержанию
- выполнение доменных тестовых фреймворков напрямую, кроме запуска собственных проверок и внешних команд в `dossier-verify`
- принятие архитектурных решений вне артефактов workflow

## 3. Основные сущности

### 3.1 Feature Dossier

Feature Dossier — markdown-файл в `docs/features`, который:

- имеет frontmatter
- содержит feature id вида `F-0001`
- содержит AC id вида `AC-F0001-01`
- может содержать coverage map и workflow-секции

### 3.2 DossierRecord

Внутреннее нормализованное представление dossier:

- `absPath`
- `relPath`
- `markdown`
- `frontmatter`
- `coverageGate`
- `acIds`
- `coverageIds`

### 3.3 Workflow artifacts

Утилита пишет следующие типы артефактов:

- drift artifact
- review artifact
- verification artifact
- step-close artifact

Все артефакты хранятся в `.dossier/` и сериализуются в JSON.

## 4. Глобальный CLI-контракт

### 4.1 Имя и запуск

Генерируемый runtime запускается командой:

```bash
node scripts/dossier.mjs <command> [options]
```

Также поддерживается:

```bash
node scripts/dossier.mjs help [command]
node scripts/dossier.mjs --help
node scripts/dossier.mjs --version
```

### 4.2 Глобальные коды завершения

Утилита использует следующие базовые коды завершения:

| Код | Значение |
|---|---|
| `0` | Успешное завершение |
| `1` | Фатальная runtime-ошибка |
| `2` | Ошибка использования CLI или блокирующий policy/result для большинства команд |
| `3` | Специальный blocking result команды `coverage-audit` |

Важно: код `2` перегружен. Он используется как для `UsageError`, так и для некоторых осмысленных негативных результатов, например:

- ошибки `lint-dossiers`
- найденные маркеры в `debt-audit`
- `requires_follow_up=yes` в `contract-drift-audit`
- blockers в `dossier-step-close`
- `fail` в `dossier-verify`

### 4.3 Глобальные правила разрешения путей

- `--root` по умолчанию равен `cwd`
- относительные пути разрешаются относительно `--root`
- путь к досье сохраняется в артефактах в repo-relative виде, если он был вычислен от корня репозитория

## 5. Стандартные файловые локации

| Назначение | Путь по умолчанию |
|---|---|
| Досье | `docs/features` |
| SSOT index | `docs/ssot/index.md` |
| Drift artifacts | `.dossier/drift/<feature-id>/...` |
| Review artifacts | `.dossier/reviews/<feature-id>/...` |
| Verification artifacts | `.dossier/verification/<feature-id>/...` |
| Step artifacts | `.dossier/steps/<feature-id>/...` |

## 6. Спецификация команд

## 6.1 `feature-intake`

### Назначение

Создать новый Feature Dossier для уже выбранной backlog work.

Команда не выбирает backlog work сама. Она принимает уже выбранную работу как вход и materialize-ит dossier-side intake.

### Входы

- `--root <path>`
- `--title <text>`; обязательный
- `--selected-work <text>`; обязательный
- `--area <name>`; обязательный
- repeatable `--owner <name>`; минимум один
- repeatable `--impact <name>`; минимум один
- repeatable `--depends-on <id>`
- `--slug <slug>`
- `--output <path>`
- `--json`

### Поведение

Команда:

1. определяет следующий свободный `F-XXXX`
2. ожидает, что selected backlog work уже был выбран через `backlog-engineer`
3. создаёт новый dossier markdown file в `docs/features/F-XXXX-<slug>.md`, если не задан `--output`
4. заполняет deterministic frontmatter:
   - `id`
   - `title`
   - `status: proposed`
   - `coverage_gate: deferred`
   - `owners`
   - `area`
   - `depends_on`
   - `impacts`
   - `created`
   - `updated`
   - `links`
5. добавляет selected backlog work в dossier body как handoff context
6. запускает `sync-index`

### Ограничения и валидация

- `--output`, если задан, должен указывать на валидный dossier filename для выделенного `F-XXXX`
- `--output`, если задан, должен оставаться внутри `docs/features`
- существующий dossier файл не перезаписывается
- команда не читает backlog artifacts и не пытается проверить backlog readiness сама

### Выход

Если задан `--json`, возвращается объект:

```json
{
  "dossier": "docs/features/F-0001-password-reset.md",
  "feature_id": "F-0001",
  "selected_work": "auth-password-reset",
  "workflow_next": "spec-compact"
}
```

Без `--json` команда печатает:

- созданный путь dossier
- feature id
- selected backlog work
- следующий dossier-local шаг (`spec-compact`)

### Коды завершения

- `0` при успешном intake
- `2` при ошибке использования или при конфликте с уже существующим dossier
- `1` при фатальной ошибке

## 6.2 `sync-index`

### Назначение

Перегенерировать `docs/ssot/index.md` из текущих dossier frontmatter.

### Входы

- `--root <path>`
- `--dossiers-dir <path>`; по умолчанию `docs/features`
- `--index-file <path>`; по умолчанию `docs/ssot/index.md`

### Поведение

Команда:

1. читает все dossier из каталога
2. строит markdown-таблицу Features
3. строит Mermaid dependency graph
4. обновляет в index-файле только блоки между маркерами:

```md
<!-- BEGIN GENERATED FEATURES -->
<!-- END GENERATED FEATURES -->

<!-- BEGIN GENERATED DEP_GRAPH -->
<!-- END GENERATED DEP_GRAPH -->
```

Если index-файл отсутствует, создаётся skeleton со стандартными секциями:

- `Features`
- `Dependency graph`
- `Red flags`

Также обновляется строка `_Last sync: ..._`.

### Выход

- `stdout`: сообщение `Updated ...` или `already up to date`
- код `0`

### Побочные эффекты

- может создать или переписать index-файл

## 6.3 `index-refresh`

### Назначение

Последовательно выполнить:

1. `sync-index`
2. `lint-dossiers --update-index`

### Поведение

- если `sync-index` завершился неуспешно, `lint-dossiers` не запускается
- если `--update-index` не был передан, команда добавляет его сама при вызове `lint-dossiers`

### Выход

- код завершения проксируется из `sync-index` или `lint-dossiers`

## 6.4 `lint-dossiers`

### Назначение

Проверить dossier на структурные и workflow-правила и, опционально, обновить Red flags block в индексе.

### Входы

- `--root <path>`
- `--dossiers-dir <path>`
- `--index-file <path>`
- `--update-index`

### Проверки

Команда валидирует, в частности:

- обязательные frontmatter keys
- формат `id: F-0001`
- допустимость `status`
- непустой массив `owners`
- допустимость `coverage_gate`
- наличие AC ids
- согласованность AC ids с feature numeric id
- согласованность coverage map и coverage gate
- наличие Change log
- наличие Definition of Done и verification cues для shaped/planned+ dossier
- compact-spec и planning nudges из `src/core/lint-dossiers.ts`

### Выход

- `stdout`: агрегированная сводка по всем findings
- если `--update-index` задан, утилита обновляет блок:

```md
<!-- BEGIN GENERATED RED_FLAGS -->
<!-- END GENERATED RED_FLAGS -->
```

### Коды завершения

| Код | Условие |
|---|---|
| `0` | Нет ошибок уровня `error` |
| `2` | Есть хотя бы одна ошибка уровня `error` |
| `1` | Фатальная ошибка чтения или исполнения |

Предупреждения `warn` сами по себе не переводят команду в non-zero.

## 6.5 `dependency-graph`

### Назначение

Вывести Mermaid dependency graph, вычисленный по `depends_on` во frontmatter.

### Поведение

Для каждого dossier формируется node:

- node id: feature id без дефисов, например `F0001`
- label: `<feature-id> <title>`

Для каждого `depends_on` формируется ребро `from --> dependency`.

### Выход

- `stdout`: fenced block ```mermaid ... graph TD ... ```
- код `0`

## 6.6 `coverage-audit`

### Назначение

Проверить, что каждый AC id из dossier встречается в тестах, и обнаружить orphan references.

### Входы

- `--root <path>`
- `--dossier <path>`
- `--dossiers-dir <path>`
- `--changed-only`
- `--base <ref>`
- `--strict-statuses <csv>`
- `--orphans-scope auto|dossier|repo|none`

### Ограничения аргументов

- `--dossier` и `--changed-only` взаимоисключающие
- `--changed-only` требует git-репозиторий

### Правила выбора dossier

- если задан `--dossier`, проверяется один dossier
- если задан `--changed-only`, выбираются:
  - изменённые dossier-файлы
  - dossier, на которые ссылаются изменённые тесты через AC ids
- иначе проверяются все dossier из каталога

### Правила выбора test files

Файл считается тестовым, если:

- имя заканчивается на `.test.*` или `.spec.*`
- либо путь содержит каталог `test` или `tests`

### Правила matching

AC считается покрытым, если literal AC id встречается в тексте тестового файла.
Отдельной семантической интерпретации тестов команда не выполняет.

### Orphan scope

Если `--orphans-scope=auto`, применяется правило:

- `dossier`, если задан `--dossier` или `--changed-only`
- `repo`, если аудит глобальный

### Выход

Команда печатает:

- общую строку summary
- секцию по каждому dossier
- секцию orphan AC references, если они есть

### Коды завершения

| Код | Условие |
|---|---|
| `0` | Нет blocking missing AC ids |
| `3` | Есть missing AC ids в dossier с `coverageGate=strict` |
| `2` | Ошибка использования |
| `1` | Фатальная ошибка |

Informational missing для non-strict dossier не делают команду blocking.

## 6.7 `debt-audit` / `marker-audit`

### Назначение

Найти явные unresolved debt markers:

- `TODO`
- `FIXME`
- `HACK`
- `XXX`

`marker-audit` — alias для `debt-audit`.

### Входы

- `--root <path>`
- `--changed-only`
- `--base <ref>`
- `--paths <csv>`

### Источники сканирования

При отсутствии `--paths` и `--changed-only` команда сканирует стандартные корни:

- `src`
- `apps`
- `packages`
- `infra`
- `scripts`
- `test`
- `docs`
- `.github`
- `AGENTS.md`
- `README.md`
- `package.json`
- workspace / tsconfig / linter config файлы

### Правила детекции

Маркер фиксируется, если:

- найден в comment-like контексте, либо
- найден в markdown-like файле как отдельный пункт / текстовая пометка

Команда специально ограничена явными markers и не претендует на полный аудит технического долга.

### Выход

- `stdout`: summary о количестве просканированных файлов и scope
- `stderr`: список найденных markers с путём, строкой и типом

### Коды завершения

| Код | Условие |
|---|---|
| `0` | Маркеры не найдены |
| `2` | Найден хотя бы один marker или ошибка использования |
| `1` | Фатальная ошибка |

## 6.8 `contract-drift-audit`

### Назначение

Обнаружить drift в исполняемом контракте dossier без сопутствующих code/test/runtime follow-up изменений.

### Входы

- `--root <path>`
- `--dossier <path>`; обязательный
- `--base <ref>`
- `--before-file <path>`
- `--output <path>`

### Baseline resolution

Baseline берётся в порядке:

1. `--before-file`, если задан
2. снимок из git:
   - `HEAD`, если dossier изменён относительно `HEAD`
   - `merge-base(HEAD, baseRef)`, если доступен
   - `HEAD~1`, если доступен

Если baseline не удалось разрешить, команда завершается ошибкой использования.

### Что считается executable contract change

Изменение считается значимым, если есть хотя бы одно из:

- добавлены AC ids
- удалены AC ids
- изменены executable sections
- изменены frontmatter keys:
  - `depends_on`
  - `impacts`
  - `coverage_gate`

### Что считается follow-up

Команда анализирует изменённые файлы git и выделяет:

- `code_follow_up_files`: всё, что не находится в `docs/`, `.dossier/` и не равно `AGENTS.md`
- `architecture_follow_up_files`: `docs/architecture/system.md` и `docs/adr/*`

### Правило блокировки

`requires_follow_up=true`, если одновременно:

- изменился executable contract
- maturity status dossier входит в `planned | in_progress | done`
- в change set нет code follow-up files

### Артефакт

По умолчанию пишется в:

```text
.dossier/drift/<feature-id>/<timestamp>.json
```

Базовая структура:

```json
{
  "version": 1,
  "created_at": "ISO timestamp",
  "feature_id": "F-0001",
  "dossier": "docs/features/F-0001.md",
  "current_commit": "sha|null",
  "baseline": "label",
  "executable_contract_changed": true,
  "maturity_requires_audit": true,
  "added_ac_ids": [],
  "removed_ac_ids": [],
  "changed_executable_sections": [],
  "frontmatter_changes": [],
  "changed_files": [],
  "code_follow_up_files": [],
  "architecture_follow_up_files": [],
  "requires_follow_up": true
}
```

### Коды завершения

| Код | Условие |
|---|---|
| `0` | Follow-up не требуется |
| `2` | `requires_follow_up=true` или ошибка использования |
| `1` | Фатальная ошибка |

## 6.9 `review-artifact`

### Назначение

Сохранить независимый review result как долговечный workflow artifact.

### Входы

- `--root <path>`
- `--dossier <path>`; обязательный
- `--step <name>`; обязательный
- `--verdict PASS|FAIL`; обязательный
- `--reviewer <name>`
- `--reviewed-commit <sha>`
- `--notes <text>`
- `--output <path>`
- repeatable:
  - `--must-fix <text>`
  - `--should-fix <text>`
  - `--evidence <text>`

### Правила валидации

- `--verdict` допускает только `PASS` или `FAIL`
- `PASS` не может содержать `--must-fix`
- если commit нельзя получить из git, требуется `--reviewed-commit`

### Артефакт

Путь по умолчанию:

```text
.dossier/reviews/<feature-id>/<step>-<commit12>.json
```

Структура:

```json
{
  "version": 1,
  "created_at": "ISO timestamp",
  "reviewer": "name",
  "step": "implementation",
  "dossier": "docs/features/F-0001.md",
  "feature_id": "F-0001",
  "reviewed_commit": "sha",
  "verdict": "PASS",
  "findings": {
    "must_fix": [],
    "should_fix": [],
    "evidence": []
  },
  "notes": ""
}
```

### Выход

- `stdout`: путь к артефакту и summary по verdict/step/feature/commit
- код `0`

## 6.10 `dossier-step-close`

### Назначение

Зафиксировать machine-checkable closure gate для mutating dossier step.

### Входы

- `--root <path>`
- `--dossier <path>`; обязательный
- `--step <name>`; обязательный
- `--verify-artifact <path>`; обязательный
- `--review-artifact <path>`; обязательный
- `--next-step <name>`
- `--output <path>`
- `--allow-dirty`

### Что проверяет команда

Команда собирает blockers, если:

- verification artifact не читается
- review artifact не читается
- `verify.status !== pass`
- шаги в артефактах не совпадают с `--step`
- feature id в артефактах не совпадает с dossier
- review verdict не `PASS`
- в review artifact есть `must_fix`
- review или verification stale относительно текущего commit
- worktree dirty вне `.dossier/`, если не задан `--allow-dirty`

### Артефакт

Путь по умолчанию:

```text
.dossier/steps/<feature-id>/<step>.json
```

Структура:

```json
{
  "version": 1,
  "created_at": "ISO timestamp",
  "feature_id": "F-0001",
  "dossier": "docs/features/F-0001.md",
  "step": "implementation",
  "dossier_status": "planned",
  "current_commit": "sha|null",
  "verification_artifact": ".dossier/verification/...",
  "review_artifact": ".dossier/reviews/...",
  "review_fresh_for_commit": true,
  "process_complete": true,
  "blockers": [],
  "next_step": "implementation"
}
```

`next_step` вычисляется как:

- `--next-step`, если явно задан
- иначе `defaultNextStep(dossier.status, step)`

### Коды завершения

| Код | Условие |
|---|---|
| `0` | Blockers нет |
| `2` | Есть blockers или ошибка использования |
| `1` | Фатальная ошибка |

## 6.11 `dossier-verify`

### Назначение

Запустить canonical verification bundle и сохранить его JSON artifact.

### Входы

- `--root <path>`
- `--step <name>`; по умолчанию `implementation`
- `--dossier <path>`
- `--changed-only`
- `--base <ref>`
- `--output <path>`
- `--skip-sync-index`
- `--skip-diff-check`
- `--coverage-orphans-scope <scope>`
- repeatable `--extra <command>`

### Ограничения аргументов

- `--dossier` и `--changed-only` взаимоисключающие

### Состав verification bundle

Если не задан `--skip-sync-index`:

1. `sync-index`

Всегда:

2. `lint-dossiers`
3. `coverage-audit`
4. `debt-audit`

Дополнительно:

5. `git diff --check`, если доступен git и не задан `--skip-diff-check`
6. repeatable внешние команды из `--extra`

### Специфика запуска вложенных проверок

- внутренние команды запускаются как buffered CLI invocations
- внешние команды запускаются через `spawnSync`
- каждая проверка даёт отдельную запись с `stdout`, `stderr`, `exit_code`, `duration_ms`, `status`

### Артефакт

Путь по умолчанию:

```text
.dossier/verification/<feature-id>/<step>-<commit12|workspace>.json
```

Структура:

```json
{
  "version": 1,
  "created_at": "ISO timestamp",
  "step": "implementation",
  "feature_id": "F-0001|global",
  "dossier": "docs/features/F-0001.md|null",
  "current_commit": "sha|null",
  "status": "pass|fail",
  "checks": [
    {
      "name": "sync-index",
      "command": "node scripts/dossier.mjs sync-index ...",
      "exit_code": 0,
      "stdout": "",
      "stderr": "",
      "duration_ms": 12,
      "status": "pass"
    }
  ]
}
```

### Коды завершения

| Код | Условие |
|---|---|
| `0` | Все checks имеют `status=pass` |
| `2` | Хотя бы один check имеет `status=fail` или ошибка использования |
| `1` | Фатальная ошибка |

## 6.12 `next-step`

### Назначение

Вернуть dossier-local ответ на вопрос “что делать дальше?” по состоянию dossier и process artifacts.

### Входы

- `--root <path>`
- `--dossier <path>`
- `--json`

### Правила выбора target dossier

- если задан `--dossier`, используется он
- иначе выбирается active dossier по приоритету статусов:
  - `in_progress`
  - `planned`
  - `shaped`
  - `proposed`
  - `parked`
  - `done`

### Workflow next resolution

`workflow_next` вычисляется так:

1. если latest step artifact существует и `process_complete === false`, берётся `latestStepArtifact.next_step`
2. иначе, если есть target dossier, применяется mapping по status:
   - `proposed -> spec-compact`
   - `shaped -> plan-slice`
   - `planned -> implementation`
   - `in_progress -> implementation`
   - `done -> none`
   - `parked -> resume-or-discard`
   - прочее -> `null`
3. иначе результат `null`, а в `blocking_gate` добавляется явное указание вернуться к `backlog-engineer` и сначала выбрать backlog work / создать dossier через `feature-intake`

### Review freshness

Если есть latest review artifact, команда сообщает:

- `valid for commit <sha>`, если reviewed commit совпадает с текущим
- `stale for current commit <sha>`, если не совпадает

### Выход

Если задан `--json`, возвращается объект:

```json
{
  "target_dossier": "docs/features/F-0001.md|null",
  "dossier_status": "planned|null",
  "workflow_next": "implementation|null",
  "blocking_gate": [],
  "uncommitted_work": false,
  "review_freshness": "valid for commit ...",
  "process_complete": true
}
```

Без `--json` команда печатает ту же информацию в текстовом виде.

Важно:

- команда не выбирает backlog item;
- команда не эмулирует backlog selection при отсутствии dossier;
- при отсутствии active dossier она возвращает dossier-local blocking explanation и отправляет оператора обратно в `backlog-engineer`.

### Коды завершения

- `0` при успешном вычислении ответа
- `2` при ошибке использования
- `1` при фатальной ошибке

## 7. Спецификация generated index

`sync-index` и `lint-dossiers --update-index` предполагают, что `docs/ssot/index.md` содержит marker-based структуру.

Поддерживаемые generated blocks:

```md
<!-- BEGIN GENERATED FEATURES -->
<!-- END GENERATED FEATURES -->

<!-- BEGIN GENERATED DEP_GRAPH -->
<!-- END GENERATED DEP_GRAPH -->

<!-- BEGIN GENERATED RED_FLAGS -->
<!-- END GENERATED RED_FLAGS -->
```

Если markers отсутствуют, `replaceBlock(...)` дописывает соответствующий блок в конец контента.

## 8. Нормативные правила обработки ошибок

### Usage errors

Если команда сталкивается с ошибкой использования, она:

- пишет сообщение в `stderr`
- печатает command-specific help text, если он доступен
- возвращает код `2`

### Fatal errors

Если произошла непойманная runtime-ошибка, утилита:

- пишет `[<command>] FATAL: ...` в `stderr`
- возвращает код `1`

## 9. Нормативные ограничения реализации

Из текущей реализации следуют следующие ограничения:

- matching AC coverage строится только на literal string inclusion
- утилита не интерпретирует AST тестов и не понимает семантику assertions
- debt scan покрывает только явные маркеры
- drift audit не доказывает корректность follow-up, а лишь проверяет наличие сопутствующих изменений в change set
- `next-step` использует только один latest artifact на feature, а не полную историю артефактов

Эти ограничения являются частью текущего фактического контракта и должны считаться осознанными, пока не изменена сама реализация.
