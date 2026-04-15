# Предложение по улучшению 20260415-2: строить skill-audit scope из operational session trace

## Контекст

Поводом стало обсуждение того, как `retrospective-phase-analysis` должен определять список skills для `skill-audit.md`.

Текущая модель опирается на `--skills-dir`: CLI сканирует директорию skills, находит все `SKILL.md`, читает frontmatter и затем пытается классифицировать relevance. Это приводит к лишней сложности:

- каталог skills может быть неизвестен или не передан;
- наличие skill в директории не означает участие в анализируемой сессии;
- классификация `confirmed_used` / `probably_used` / `implicitly_relevant` пытается компенсировать слишком широкий discovery scope;
- `implicitly_relevant` создает шум, потому что подмешивает skills, которые не всплывали в session trace.

Проверка реального session JSONL показала другое доступное основание:

- список доступных skills уже присутствует в injected `Available skills`;
- этот список попадает в bootstrap-события trace, такие как `session_meta` и `turn_context`;
- структурного runtime-события `skill_used` нет;
- факт обращения к skill может проявляться в operational событиях: agent messages, tool calls, command arguments, parsed command paths вроде `skills/<name>/SKILL.md`.

## Проблема

Искать skill names по сырому JSONL нельзя: bootstrap-контекст содержит полный `Available skills`, поэтому naive search найдет все skills.

Но сканировать весь `--skills-dir` как primary discovery тоже неправильно: это расширяет scope за пределы фактической сессии.

Нужен промежуточный контракт:

1. брать canonical skill names из `Available skills`;
2. исключать bootstrap-контекст;
3. искать skill names только в operational trace;
4. использовать найденный список как единственный scope для `skill-audit.md`.

## Предлагаемый контракт

```text
Skill audit scope = names from Available skills that appear in the operational session trace.
```

`Available skills` используется только как словарь допустимых имен. Само наличие skill в `Available skills` не является evidence.

Operational trace должен исключать:

- `session_meta`;
- `turn_context`;
- полные injected system/developer instructions;
- блоки, которые просто перечисляют все available skills;
- duplicate completion wrappers вроде `task_complete.last_agent_message`, если тот же текст уже учтен как agent message.

Operational trace может включать:

- user messages;
- agent messages;
- assistant tool call arguments;
- command strings;
- `exec_command_end.payload.parsed_cmd[].path`;
- trace-linked stage/intake/log artifacts, если они уже включены в scan scope.

## Scope extraction rules

1. Extract `availableSkills` from the injected `Available skills` block.
2. Build a normalized operational text/index stream from non-bootstrap events.
3. Match exact skill names from `availableSkills` against that operational stream.
4. Record evidence for each matched skill:

   ```json
   {
     "name": "retrospective-phase-analysis",
     "evidence": [
       {
         "line": 16,
         "field": "event_msg.payload.message",
         "excerpt": "..."
       },
       {
         "line": 21,
         "field": "exec_command_end.payload.parsed_cmd.path",
         "excerpt": "skills/retrospective-phase-analysis/SKILL.md"
       }
     ]
   }
   ```

5. Generate `skill-audit.md` only for matched skills.
6. Do not include skills that appear only in bootstrap catalog events.

## What to remove or simplify

Remove the current relevance taxonomy from generated skill audit scope:

- `confirmed_used`;
- `probably_used`;
- `implicitly_relevant`.

Remove the separate `implicitly_relevant` list.

Stop treating `--skills-dir` as a primary source for deciding which skills belong to the retrospective.

## Role of `--skills-dir`

`--skills-dir` may remain as optional enrichment:

- open matched `SKILL.md` files for detailed audit;
- read descriptions or frontmatter;
- validate that a matched skill name has a local file when the directory is known.

But `--skills-dir` must not decide primary audit scope.

If `--skills-dir` is absent, the CLI should still be able to produce:

- `scan-summary.json` with `availableSkills` and matched referenced skills;
- `skill-audit.md` scaffold listing matched skills and evidence excerpts;
- explicit data-quality notes when the local skill body cannot be inspected.

## Suggested `scan-summary.json` shape

```json
{
  "skills": {
    "available": ["retrospective-phase-analysis", "git-engineer"],
    "referenced": [
      {
        "name": "retrospective-phase-analysis",
        "evidence": [
          {
            "line": 16,
            "field": "event_msg.payload.message",
            "excerpt": "..."
          }
        ]
      }
    ],
    "unreferenced_count": 1
  }
}
```

This replaces catalog-wide `skills` output for skill-audit purposes.

## Matching considerations

Use exact skill-name matching rather than language-specific phrases.

Do not rely on phrases like:

- `Использую ...`;
- `Using ...`;
- `I will use ...`.

Those are operator/runtime/language dependent and should only appear as ordinary evidence text if matched by exact skill name.

Prefer matching:

- standalone skill name tokens;
- Markdown-code skill names, for example `` `git-engineer` ``;
- paths ending in `<skill-name>/SKILL.md`;
- paths containing `skills/<skill-name>/`.

Avoid matching:

- substrings inside larger identifiers;
- the injected `Available skills` catalog itself;
- unrelated mentions in full tool outputs that came from reading large files, unless the field is explicitly part of operational evidence.

## Tests

Add contract tests using fixture JSONL traces:

1. `Available skills` contains five skills, operational trace mentions two, summary contains only those two in `skills.referenced`.
2. A skill appears only in `session_meta` / `turn_context`; it is not included.
3. A skill appears in `exec_command_end.payload.parsed_cmd[].path` as `skills/<name>/SKILL.md`; it is included.
4. A skill appears only inside a full `function_call_output.output` blob from reading another file; it is not included unless that field is explicitly accepted as operational evidence.
5. `skill-audit.md` renders sections only for `skills.referenced`.
6. CLI can produce a degraded but useful `skill-audit.md` without `--skills-dir`, using session evidence only.

## Expected effect

The audit becomes simpler and more faithful to the actual session:

- no directory-wide skill fan-out;
- no `implicitly_relevant` noise;
- no language-specific usage phrase detection;
- no requirement to know the skill directory before determining scope;
- better portability across operators and runtimes that expose session JSONL with injected skill catalog.

## Open implementation points

- Define one parser for extracting `Available skills` from bootstrap context.
- Define the exact operational event allowlist in `references/CLI.md`.
- Decide whether `function_call_output.output` should be excluded by default or included only for small structured outputs.
- Update `src/core/summarize-skills.ts` or replace it with session-trace skill scope extraction.
- Update `src/render/skill-audit-markdown.ts` to consume the new simple `skills.referenced` list.
- Update docs/runtime/tests together because this changes the `scan-summary.json` contract.
