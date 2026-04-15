# План рефакторинга 2: skill-audit scope из operational session trace

Дата: `2026-04-15`
Компонент: `retrospective-phase-analysis`
Основание: [issues/improvement-proposal-20260415-2.md](issues/improvement-proposal-20260415-2.md)
Скоп: `Available skills` extraction, skill alias normalization, operational trace construction, exact skill-name matching, `skill-audit.md` scope simplification

## Контекст

Текущая реализация строит skill catalog через `--skills-dir`, а затем пытается классифицировать skills как `confirmed_used`, `probably_used` и `implicitly_relevant`.

После проверки реального session JSONL стало понятно, что для ретроанализа лучше использовать другой первичный источник:

- injected `Available skills` дает список допустимых skill entries and aliases;
- bootstrap events вроде `session_meta` и `turn_context` нельзя считать evidence использования;
- operational события trace показывают, какие skill names реально всплывали в сессии;
- `--skills-dir` должен быть enrichment input, а не discovery input.

Важно: real `Available skills` entries may expose both display labels and file-path-derived names. For example, a bullet can be `HONO engineer`, while the file path points to `skills/hono-engineer/SKILL.md`. The implementation must normalize aliases so path evidence and prose evidence can resolve to one output skill entry.

## Источники и точки реализации

- [../SKILL.md](../SKILL.md)
- [../references/CLI.md](../references/CLI.md)
- [issues/improvement-proposal-20260415-2.md](issues/improvement-proposal-20260415-2.md)
- [../src/core/summarize-skills.ts](../src/core/summarize-skills.ts)
- [../src/render/skill-audit-markdown.ts](../src/render/skill-audit-markdown.ts)

## Не цели

- Не добавлять language-specific usage detection вроде `Использую ...` или `Using ...`.
- Не делать `--skills-dir` обязательным для определения skill scope.
- Не включать все skills из injected catalog в `skill-audit.md`.
- Не считать `session_meta` / `turn_context` evidence использования.
- Не считать `compacted` summaries primary evidence, если исходные события доступны.
- Не hardcode-ить Codex-specific absolute session-store layout в CLI.
- Не превращать `docs/issues/*` в active normative surface без отдельного promotion.

## Package 0. Зафиксировать fixture реального формата session trace

### Смысл

Перед изменением runtime-контракта нужен маленький fixture, который отражает реальную структуру JSONL:

- bootstrap catalog;
- operational messages;
- tool call / command path evidence;
- noise fields, которые нельзя считать scope evidence.

### Файлы

- `test/fixtures/contracts/session-skills-trace.jsonl`
- `test/scan.test.ts`
- при необходимости helper tests для parser functions

### Изменения

1. Добавить fixture JSONL с `session_meta` или `turn_context`, где `Available skills` содержит минимум пять skills.
2. В catalog включить хотя бы один entry, где display label отличается от path-derived name, например `HONO engineer` + `skills/hono-engineer/SKILL.md`.
3. В operational части упомянуть только два skill names or aliases.
4. Добавить `exec_command_end.payload.parsed_cmd[].path` для одного skill как `skills/<name>/SKILL.md`.
5. Добавить ложный случай: skill name встречается только в bootstrap catalog.
6. Добавить ложный случай: skill name встречается только внутри full `function_call_output.output` от чтения другого файла.
7. Добавить ложный случай: skill name встречается только в `compacted` summary.

### Acceptance

- Fixture воспроизводит главный риск: naive raw JSONL search нашел бы все skills.
- Fixture воспроизводит alias риск: display label and path-derived name both resolve to one skill entry.
- Contract test сначала должен выразить ожидаемый новый behavior, даже если implementation еще не готов.

## Package 1. Извлечь `Available skills` как canonical catalog

### Смысл

CLI должен уметь получить список допустимых skill entries из session trace без сканирования директории skills.

### Файлы

- `src/core/extract-trace-scope.ts` или новый `src/core/extract-skill-scope.ts`
- `src/core/types.ts`
- `src/core/build-scan-summary.ts`
- `test/scan.test.ts`

### Изменения

1. Добавить parser для injected `Available skills` blocks.
2. Поддержать минимум текущий observed формат:
   - `### Available skills`
   - bullet entries containing `- display-name: description ...`
   - `file: .../SKILL.md` внутри entry как optional metadata.
3. Нормализовать catalog entry:
   - `display_name` from bullet label;
   - `path_name` from parent directory of `(file: .../SKILL.md)`, when available;
   - `aliases` containing both names when they differ;
   - output `name` should prefer `path_name` when present, otherwise `display_name`.
4. Сохранять catalog отдельно от usage evidence:

   ```json
   {
     "skills": {
       "available": [
         {
           "name": "hono-engineer",
           "display_name": "HONO engineer",
           "aliases": ["hono-engineer", "HONO engineer"]
         }
       ],
       "referenced": [],
       "unreferenced_count": 1
     }
   }
   ```

5. Если catalog не найден, summary должен фиксировать data-quality gap и fallback behavior, а не молча сканировать весь `--skills-dir`.

### Acceptance

- Test: parser извлекает skill entries из bootstrap context.
- Test: parser links display label and path-derived name as aliases.
- Test: наличие skill в `available` не добавляет его в `referenced`.
- Test: missing catalog produces explicit warning/data-quality note.

## Package 2. Построить operational trace allowlist

### Смысл

Нужен стабильный индекс полей, где skill-name match считается evidence.

### Файлы

- `src/core/extract-skill-scope.ts`
- `src/parsers/jsonl.ts`
- `src/core/types.ts`
- `test/scan.test.ts`

### Изменения

1. Исключить из operational stream:
   - `session_meta`;
   - `turn_context`;
   - `compacted` summaries by default, unless there is no source trace available and the summary is explicitly accepted as degraded evidence;
   - full injected instruction blocks;
   - full `function_call_output.output` by default;
   - duplicate completion wrappers when the same text already appears as an agent message.
2. Включить в operational stream:
   - user messages;
   - agent/assistant messages;
   - function/tool call arguments;
   - command strings;
   - `exec_command_end.payload.parsed_cmd[].path`;
   - trace-linked stage/intake/log artifact snippets, если они уже in-scope.
3. Для каждого indexed fragment сохранять:
   - JSONL line;
   - event type;
   - field path;
   - short excerpt;
   - normalized searchable text.

### Acceptance

- Test: skill name only in `session_meta` / `turn_context` is ignored.
- Test: skill name only in `compacted` summary is ignored when source events are present.
- Test: skill name in `event_msg.payload.message` is considered evidence.
- Test: skill name in `exec_command_end.payload.parsed_cmd[].path` is considered evidence.
- Test: skill name only in full `function_call_output.output` is ignored.

## Package 3. Заменить relevance taxonomy простым referenced scope

### Смысл

Для `skill-audit.md` нужен один список: skills from catalog that appear in operational trace.

### Файлы

- `src/core/summarize-skills.ts` or replacement module
- `src/core/build-scan-summary.ts`
- `src/core/types.ts`
- `test/fixtures/contracts/scan-summary-golden.json`
- `test/report.test.ts`

### Изменения

1. Удалить generated scope taxonomy:
   - `confirmed_used`;
   - `probably_used`;
   - `implicitly_relevant`.
2. Добавить exact-name matching only against `available` catalog aliases.
3. Match должен учитывать:
   - standalone alias token;
   - Markdown-code alias token, e.g. `` `git-engineer` ``;
   - path segment `skills/<path_name>/`;
   - path ending `<path_name>/SKILL.md`.
4. Match не должен срабатывать на substring inside larger identifiers.
5. Summary должен хранить evidence list for every referenced skill and preserve which alias matched.

### Acceptance

- Test: catalog has five skills, operational trace references two, summary has exactly two `skills.referenced`.
- Test: path evidence `skills/git-engineer/SKILL.md` references `git-engineer`.
- Test: path evidence `skills/hono-engineer/SKILL.md` references catalog entry with display label `HONO engineer`.
- Test: `typescript-engineer` does not match `typescript-engineer-extra`.
- Golden fixture обновлен под новый `skills` shape.

## Package 4. Перестроить `skill-audit.md` renderer

### Смысл

`skill-audit.md` должен аудировать только skills из `skills.referenced`.

### Файлы

- `src/render/skill-audit-markdown.ts`
- `src/commands/skill-audit.ts`
- `references/SKILL-AUDIT-TEMPLATE.md`
- `references/CLI.md`
- `test/report.test.ts`

### Изменения

1. Render detailed section only for `skills.referenced`.
2. Remove `implicitly_relevant` section entirely.
3. Show compact evidence excerpts under each referenced skill.
4. If `--skills-dir` was provided and matched `SKILL.md` was readable by `name` or alias, include instruction-body audit prompts.
5. If `--skills-dir` was absent or matched file unavailable, render degraded but useful scaffold:
   - skill name;
   - evidence excerpts;
   - explicit note that local skill body was not inspected.

### Acceptance

- Test: `skill-audit.md` contains sections only for referenced skills.
- Test: no heading or list for unreferenced catalog skills.
- Test: missing `--skills-dir` still produces a scaffold with data-quality note.
- Test: docs mention `--skills-dir` as optional enrichment, not primary discovery.

## Package 5. Docs/runtime/test parity and migration cleanup

### Смысл

Это изменение меняет machine-facing contract, поэтому prose, runtime, built script и tests должны обновляться вместе.

### Файлы

- `SKILL.md`
- `references/CLI.md`
- `references/REFERENCE.md` if it documents summary fields
- `scripts/retro-cli.mjs`
- `scripts/retro-cli.mjs.map`
- all affected tests and fixtures

### Изменения

1. Обновить `SKILL.md`:
   - skill files used during the phase are discovered from session trace first;
   - `--skills-dir` is optional enrichment;
   - no directory-wide skill audit by default.
2. Обновить `references/CLI.md`:
   - describe `skills.available`;
   - describe `skills.referenced`;
   - define operational trace allowlist;
   - define bootstrap exclusions.
3. Удалить docs references to `confirmed_used`, `probably_used`, `implicitly_relevant` if they remain active.
4. Rebuild `scripts/retro-cli.mjs`.
5. Keep proposal issue and this plan historical unless promoted by implementation changes.

### Acceptance

- `pnpm --filter @kostysh/retrospective-phase-analysis-cli test`
- `pnpm --filter @kostysh/retrospective-phase-analysis-cli lint`
- `git diff --check`
- Search active surface for removed taxonomy terms.
- Search changed active files for absolute local paths.

## Rollout notes

This is a breaking `scan-summary.json` contract change for skill audit consumers.

To reduce confusion:

- implement behind direct contract tests first;
- update golden fixture in the same commit;
- mention in CLI reference that old taxonomy was removed;
- keep generated Markdown wording explicit: referenced means "appeared in operational session trace", not "runtime emitted a structured skill-used event".

## Review plan

Before implementation:

- review this plan against [issues/improvement-proposal-20260415-2.md](issues/improvement-proposal-20260415-2.md);
- verify packages are independently implementable;
- verify tests cover the observed real JSONL risks.

After implementation:

- run code review on the diff;
- run spec-conformance review against the proposal and this plan;
- only then update or close the issue.
