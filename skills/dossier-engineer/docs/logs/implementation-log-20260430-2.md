# Implementation log 2026-04-30-2

## Задача

Создать англоязычный active reference на основе `docs/operator-ux.ru.md` и встроить его в `dossier-engineer` для ситуации, когда оператор спрашивает агента о возможностях скила и способах его применения.

## Capability vs substrate

Наблюдаемая способность: агент, использующий `dossier-engineer`, должен находить operator-facing reference при вопросах вида “что умеет dossier-engineer?”, “как попросить агента использовать dossier-engineer?” и “какой workflow подходит для моей ситуации?”.

Субстрат: новый Markdown-файл, запись в `skill.yaml`, regenerated `SKILL.md` и `docs/compile-report.md`. Эти файлы не считаются достаточными без явного trigger в optional references.

## Выполнено

- Добавлен `references/operator-capabilities.md`.
- В `skill.yaml` добавлен optional reference `ref-operator-capabilities` с trigger для вопросов оператора о возможностях, workflow и prompt patterns.
- В `whenToUse` добавлен сценарий объяснения возможностей `dossier-engineer`.
- В `whenNotToUse` добавлено исключение для operator-facing usage questions, чтобы оно не конфликтовало с запретом на обычное chat-only planning.
- Корневой `README.md` обновлён и переведён на английский как supporting package overview.
- `docs/README.md` обновлён ссылкой на этот implementation log.
- `SKILL.md` и `docs/compile-report.md` регенерированы из source bundle.

## Проверка

- `node ../skill-source-compiler/scripts/skill-source-compiler.mjs regenerate .`
- `node ../skill-source-compiler/scripts/skill-source-compiler.mjs check .`
- `pnpm run lint`
- `pnpm test`
- `git diff --check` для изменённых tracked файлов
- `git diff --no-index --check /dev/null references/operator-capabilities.md`
- Поиск кириллицы в корневом `README.md`
- Поиск абсолютных локальных путей в `SKILL.md`, `references/operator-capabilities.md` и `skill.yaml`

## Instruction quality audit

PASS.

- Outcome-first behavior is explicit: answer operator questions about capability and usage by loading the operator capability reference.
- Reference trigger is concrete and does not require loading the file for ordinary delivery work.
- The change does not promote `docs/operator-ux.ru.md` into active guidance.
- No new runtime command, workflow stage, or closure rule is invented.

## Остаточные риски

- `pnpm run format:check` не прошёл из-за уже существующего форматирования runtime-файлов (`package.json`, `src/*`, `test/*`, `tsconfig.json`, `vite.config.ts`). Исправление потребовало бы широкого unrelated runtime diff, поэтому не выполнялось в этой правке.
