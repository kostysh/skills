# План рефакторинга 12: fail-closed canonical backlog access

Дата: `2026-04-16`
Компонент: `dossier-engineer`
Основание: [issues/improvement-proposal-20260416-1.md](issues/improvement-proposal-20260416-1.md)
Скоп: `SKILL.md`, workflow summary, cross-skill process model, repo `AGENTS` template, example repo overlay, docs-contract tests

## Цель

Закрыть process gap, при котором агент может начать с корректных canonical backlog commands, но затем самовольно обогатить ответ чтением `.backlog/*` или packet/patch artifacts вместо продолжения через canonical read surface `backlog-engineer`.

После рефакторинга агент должен:

- читать текущий backlog truth только через canonical `backlog-engineer` read commands;
- отвечать на вопрос "what can be taken next" через `queue`, а если после этого нужны full task cards или fields beyond chain structure, переходить к `items --item-keys ...`;
- считать `.backlog/*`, packet files, patch files и drafts raw utility artifacts, а не operator-facing source of truth, кроме debugging backlog utility или прямого запроса оператора на raw artifact inspection;
- fail-closed признать ограничение, если canonical output недостаточен, вместо компенсации через repo file inspection;
- сохранить `backlog-engineer` владельцем backlog read semantics, а `dossier-engineer` оставить только downstream interop hardening без создания второго backlog command reference.

## Нормативные источники

- [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)
- [../SKILL.md](../SKILL.md)
- [../references/workflow.md](../references/workflow.md)
- [../references/REPO_AGENTS_TEMPLATE.md](../references/REPO_AGENTS_TEMPLATE.md)
- [../../backlog-engineer/SKILL.md](../../backlog-engineer/SKILL.md)
- [../../backlog-engineer/references/command-reference.md](../../backlog-engineer/references/command-reference.md)
- [issues/improvement-proposal-20260416-1.md](issues/improvement-proposal-20260416-1.md)

## Не цели

- Не добавлять новые CLI commands ни в `dossier-engineer`, ни в `backlog-engineer`.
- Не менять runtime behavior `scripts/dossier.mjs` или backlog utility, кроме возможной пересборки перед tests, если package scripts этого требуют.
- Не переносить полный command reference `backlog-engineer` внутрь `dossier-engineer`.
- Не запрещать raw artifact inspection для debugging backlog utility или когда оператор явно просит показать/разобрать внутренние backlog files.
- Не превращать `report` в обычный dialog read model; он остается explicit file-output path, когда оператор просит артефакт на диске.
- Не вводить новые backlog-side lifecycle semantics; меняется только строгость downstream interop guidance.

## Базовые решения

1. Основная normative policy живет в `SKILL.md` как компактный блок `Canonical backlog access` рядом с backlog ownership / actualization rules.
2. `references/workflow.md` и `cross-skill-process-model.ru.md` усиливают choreography и negative rules, но остаются process-level guidance, а не вторым command reference.
3. Политика фиксирует только interop guardrail:
   - use canonical backlog-engineer read commands;
   - use `queue -> items --item-keys ...` when full task cards or fields beyond chain structure are needed;
   - do not answer backlog truth questions via raw utility artifacts;
   - fail closed on insufficient canonical output.
4. План не перечисляет и не замораживает почти полный backlog read surface в downstream docs/tests; owned field-level semantics и подробное command routing остаются в `backlog-engineer`.
5. Fallback разрешен только как замена command prefix (`backlog-engineer ...` -> `node .../scripts/backlog-engineer.mjs ...`), но не как оправдание raw file parsing.
6. Repo template получает только короткий reinforcement block; полный default policy по-прежнему живет в skill contract, а не в repo overlay.
7. Docs-contract tests защищают literal wording в `SKILL.md`, `workflow.md`, `cross-skill-process-model.ru.md`, template и example repo, чтобы процесс не деградировал обратно в implicit hints.

## Ожидаемые эффекты и риски

Ожидаемые эффекты:

- provenance backlog answers станет прозрачнее: оператор сможет понимать, что ответ получен из canonical CLI surface, а не из implementation details;
- future refactors backlog utility станут безопаснее, потому что downstream docs перестанут молча легализовывать зависимость от `.backlog/*`;
- `queue` compact output перестанет провоцировать самодельные enrichments через state files;
- mixed-skill repos получат guardrail уже на bootstrap / template layer.

Основные риски и как их гасить:

- риск случайно продублировать backlog command semantics в `dossier-engineer`;
  mitigation: ограничиться interop guardrail и literal `queue -> items` rule, не перечислять полный read surface и не копировать field-by-field contracts.
- риск слишком широко назвать command surface и случайно переопределить `report`;
  mitigation: отдельно оговорить, что `report` остается explicit file-output path, а не обычным dialog read surface.
- риск превратить repo template в дубликат default skill contract;
  mitigation: держать template reinforcement коротким и overlay-ready.
- риск, что fail-closed wording сделает некоторые ответы короче;
  mitigation: принять это как intentional process-correctness tradeoff, а не как regression.

## Package 1. `SKILL.md`: compact fail-closed policy for canonical backlog access

### Смысл

Нужен явный operator-facing policy block, который делает canonical backlog read discipline видимой без чтения historical docs или backlog-side references.

### Файлы

- `SKILL.md`
- `test/docs-contract.test.ts`

### Изменения

1. Добавить раздел `## Canonical backlog access` рядом с уже существующими cross-skill statements про backlog ownership / actualization.
2. Зафиксировать, что вопросы о current backlog truth отвечаются только через canonical `backlog-engineer` read commands.
3. Сделать это без перечисления почти полного command surface и без копирования backlog-side field semantics.
4. Зафиксировать literal choreography:
   - `queue` используется для "what can be taken next";
   - если после `queue` нужны fields beyond chain structure, агент обязан вызвать `items --item-keys ...`.
5. Допустить только один дополнительный precision note:
   - `report` остается отдельным file-output path, когда оператор явно просит артефакт на диске; он не превращается в обычный dialog read model.
6. Добавить negative rule:
   - не отвечать на backlog status/queue/attention/blocker questions через `.backlog/*`, packet files, patch files или drafts.
7. Добавить fail-closed rule:
   - если canonical output недостаточен, агент должен явно назвать ограничение вместо raw file inspection.
8. Удержать блок на уровне interop policy, не превращая его в второй `backlog-engineer` command reference.

### Acceptance

- `SKILL.md` содержит отдельный explicit block, а не только implied ownership.
- Блок literally содержит правило `queue -> items --item-keys ...`.
- Блок явно запрещает internal artifact reads для operator-facing backlog truth.
- Блок явно говорит, что insufficient canonical output не оправдывает raw file parsing.
- Блок не дублирует полный command reference `backlog-engineer`.

## Package 2. `workflow.md` и `cross-skill-process-model.ru.md`: operational choreography without a competing semantics source

### Смысл

Workflow guide и active process model должны сделать shortcut невозможным в обычном downstream flow и при этом не превратиться во вторую backlog reference.

### Файлы

- `references/workflow.md`
- `docs/cross-skill-process-model.ru.md`
- `test/docs-contract.test.ts`

### Изменения

1. В `Role in the cross-skill process` или в коротком dedicated subsection усилить правило, что backlog questions отвечаются через canonical `backlog-engineer` read commands, а не через repo artifact inspection.
2. Добавить только минимально необходимый choreography rule:
   - `queue` для вопроса "what can be taken next";
   - `items --item-keys ...` когда после `queue` нужны full cards или fields beyond chain structure.
3. В `cross-skill-process-model.ru.md` синхронизировать ту же fail-closed мысль на уровне нормативной process narrative:
   - canonical backlog reads only;
   - no `.backlog/*` / raw artifact shortcut for operator-facing backlog truth;
   - insufficient canonical output is surfaced as limitation instead of raw inspection.
4. Добавить negative/fail-closed note:
   - `.backlog/*`, packet/patch/draft files не являются substitute для canonical command output;
   - insufficient canonical output должно surfaced as limitation, а не приводить к internal artifact inspection.
5. В `CLI command: next-step` при необходимости усилить wording, что dossier-local output не заменяет backlog-side canonical reads.

### Acceptance

- `workflow.md` и `cross-skill-process-model.ru.md` повторяют то же правило без создания second semantics source.
- `queue -> items` path явно виден в active process docs.
- Negative rule и insufficiency rule присутствуют в active workflow surface, а не только в `SKILL.md`.
- `next-step` остается dossier-local; новые backlog orchestration semantics в него не переезжают.

## Package 3. Repo template and example repo reinforcement

### Смысл

Mixed-skill repositories должны получать этот guardrail сразу на bootstrap/template layer.

### Файлы

- `references/REPO_AGENTS_TEMPLATE.md`
- `assets/example-repo/AGENTS.md`
- `test/docs-contract.test.ts`

### Изменения

1. В `Backlog workflow` добавить короткий reinforcement block:
   - backlog questions must be answered through canonical `backlog-engineer` commands;
   - utility-owned internal backlog files are not operator-facing source of truth;
   - use `queue -> items --item-keys ...` when full task cards are needed after `queue`.
2. Удержать этот block коротким, чтобы template оставался overlay-oriented и не копировал весь default skill contract.
3. Зеркально обновить `assets/example-repo/AGENTS.md`, чтобы template и bootstrap example не разошлись.

### Acceptance

- Template и example repo содержат guardrail verbatim или near-verbatim.
- Wording не ломает принцип "repo overlays only", потому что reinforcement остается компактным.
- Template не превращается в дубликат backlog command reference.

## Package 4. Docs-contract tests for canonical backlog access

### Смысл

Нужны узкие assertions, чтобы новое правило нельзя было тихо убрать из active normative surface.

### Файлы

- `test/docs-contract.test.ts`

### Изменения

1. Расширить backlog actualization / handoff tests или добавить отдельный dedicated test для canonical backlog access.
2. Защитить literal presence:
   - section `Canonical backlog access` в `SKILL.md`;
   - aligned wording in `references/workflow.md`;
   - aligned wording in `docs/cross-skill-process-model.ru.md`;
   - wording про `queue -> items --item-keys ...`;
   - explicit prohibition on `.backlog/*`, packet, patch, or draft parsing for backlog truth;
   - explicit fail-closed insufficiency wording;
   - repo template / example repo reinforcement lines.
3. Оставить tests phrase-based и narrow, без snapshot of whole paragraphs.

### Acceptance

- Tests падают, если canonical-read guardrail исчезает из любой active surface.
- Tests покрывают `workflow.md`, `cross-skill-process-model.ru.md`, template и example repo, а не только `SKILL.md`.
- Tests не переусложняются и не зависят от incidental prose.

## Package 5. Cross-skill consistency pass

### Смысл

Нужен финальный wording review, чтобы новый policy block harden-ил interop, но не менял backlog-layer semantics и не создавал drift между skill-ами.

### Файлы

- `SKILL.md`
- `references/workflow.md`
- `docs/cross-skill-process-model.ru.md`
- `references/REPO_AGENTS_TEMPLATE.md`
- `assets/example-repo/AGENTS.md`
- `test/docs-contract.test.ts`
- reference reads from `../../backlog-engineer/SKILL.md` and `../../backlog-engineer/references/command-reference.md`

### Изменения

1. Проверить, что wording не противоречит backlog-side split:
   - current truth reads from utility, not from packet/patch files;
   - `queue -> items` choreography сохраняет backlog-side ownership of detailed read semantics;
   - `report` remains explicit file-output path.
2. Проверить, что dossier docs не начинают претендовать на authority over backlog field semantics или output shapes.
3. Держать explicit wording достаточно коротким, чтобы future backlog command additions не делали `dossier-engineer` stale automatically.

### Acceptance

- Новый policy clearly remains downstream interop guidance, not backlog-layer spec duplication.
- `report` не переопределен как ordinary dialog read surface.
- Ни один touched text не возвращает ambiguity между backlog `queue/status/gaps/attention` и dossier `next-step`.

## Recommended implementation order

1. `SKILL.md`
2. `references/workflow.md` и `docs/cross-skill-process-model.ru.md`
3. `references/REPO_AGENTS_TEMPLATE.md` и `assets/example-repo/AGENTS.md`
4. `test/docs-contract.test.ts`
5. narrow cross-skill wording review against `backlog-engineer`

## Validation

- `node --experimental-strip-types --test skills/dossier-engineer/test/docs-contract.test.ts`
- targeted readback of `SKILL.md`, `workflow.md`, `cross-skill-process-model.ru.md`, template, and example repo after edits

Поскольку план docs-only и не предполагает runtime changes, дополнительные CLI tests, lint или typecheck нужны только если реализация неожиданно затронет executable code.
