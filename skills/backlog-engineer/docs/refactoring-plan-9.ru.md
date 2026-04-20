# План рефакторинга 9: deterministic dossier-side backlog actualization

Дата: `2026-04-20`
Компонент: `backlog-engineer`
Основание: [issues/improvement-proposal-20260420-1.md](issues/improvement-proposal-20260420-1.md)
Скоп: `SKILL.md`, `references/operator-workflows.md`, `references/command-reference.md`, `references/packet-and-patch.md`, `references/data-model.md`, `references/examples-and-templates.md`, docs-contract tests, `docs/README.md`

## Цель

Убрать процедурную хрупкость dossier-side backlog actualization на truthful closure boundary без разрушения текущей backlog model и без premature CLI surface expansion.

После цикла агент должен:

- видеть одну canonical dossier-side actualization model с двумя literal branch families:
  - lifecycle actualization after `spec-compact`, `plan-slice`, and `implementation`;
  - backlog-impact actualization after `change-proposal`;
- проходить deterministic branch preparation на существующей command surface, а не собирать mutation choreography по памяти;
- явно различать lifecycle `patch-item` vs `refresh + patch`, а также `source update` и `new backlog item` в `change-proposal`;
- не путать mutation-managed и refresh-managed closure semantics;
- завершать actualization не на `patch applied`, а на `actualized and confirmed clean`.

## Нормативные источники

- [../SKILL.md](../SKILL.md)
- [../references/operator-workflows.md](../references/operator-workflows.md)
- [../references/command-reference.md](../references/command-reference.md)
- [../references/packet-and-patch.md](../references/packet-and-patch.md)
- [../references/data-model.md](../references/data-model.md)
- [../references/examples-and-templates.md](../references/examples-and-templates.md)
- [issues/improvement-proposal-20260420-1.md](issues/improvement-proposal-20260420-1.md)

## Связанный контекст и compatibility notes

Эти материалы важны для cross-skill совместимости, но не являются нормативным основанием backlog-engineer semantics:

- [../../dossier-engineer/SKILL.md](../../dossier-engineer/SKILL.md)
- [../../dossier-engineer/references/workflow.md](../../dossier-engineer/references/workflow.md)

## Не цели

- Не менять packet model.
- Не превращать `refresh` в неявную замену patch workflows.
- Не разрешать patch workflows authoring brand-new backlog work.
- Не размывать retention contract canonical patch artifacts.
- Не добавлять новый helper command или wrapper в этом цикле, если deterministic reproducibility достигается через существующие команды и docs-contract.
- Не заставлять CLI анализировать dossier prose или выводить semantic verdict по closure readiness.
- Не переносить dossier-local closure ownership в `backlog-engineer`.

## Базовые решения

1. В этом цикле deterministic branch preparation реализуется как canonical agent workflow на существующей command surface, а не как новый CLI command.
2. Existing deterministic building blocks already exist and must become literal workflow steps:
   - target scope resolution through `items` / `search`;
   - collision-safe patch draft through `template patch`;
   - validation and no-disk preview through `patch-item --dry-run`;
   - source-derived recalculation through scoped `refresh`;
   - clean confirmation through:
     - required scoped truth read via `items` whenever item-level truth changed or closure depends on item-card fields;
     - required integrity confirmation via `status` or `status --refresh`.
3. Для dossier-side lifecycle actualization `patch-item` and `refresh + patch` are the only truthful closure branches:
   - `patch-item` actualizes explicit backlog truth on known items;
   - `refresh + patch` is the branch when source-derived state must be recalculated before explicit backlog truth can be patched cleanly;
   - plain `refresh` may support source-derived maintenance, but it is not a truthful lifecycle closure branch when dossier stage completion changed backlog truth.
4. For dossier stage `change-proposal`, canonical backlog branch family stays wider than `patch/refresh/refresh+patch`:
   - `no-op`
   - `patch existing item`
   - `source update`
   - `new backlog item`
   Source-update handling keeps backlog-owned maintenance branches:
   - `register-source`
   - `update-source-path`
   - `remove-source`
   - scoped `refresh`
   - dependent-item patching when still needed after source maintenance.
5. `Mutation-managed` and `refresh-managed` todo are different closure classes and must stay visibly different across the active docs.
6. `Clean dossier-side closure` means:
   - canonical backlog action was executed;
   - scoped backlog truth is confirmed on the relevant scope;
   - artifact integrity is confirmed through a command surface that actually returns integrity state;
   - canonical artifact integrity is clean;
   - no known impacted items remain in partial sync.
7. Because this change is meant to reduce closeout instability, the canonical recipe must be short, operator-facing, and repeated consistently across active refs and examples.

## Ожидаемые эффекты и риски

Ожидаемые эффекты:

- меньше procedural rerounds на already-almost-done dossier closure;
- меньше ошибок с `metadata.sequence`, patch scope и todo-management class;
- оператор видит one-path actualization recipe вместо scattered rules;
- `backlog-engineer` остается owner backlog truth without turning into dossier-local workflow engine.

Основные риски и mitigation:

- риск расползтись в новую CLI surface;
  mitigation: current cycle uses existing commands and docs hardening first.
- риск смешать source-driven refresh и mutation-driven patch semantics;
  mitigation: negative rules and examples become literal in active refs.
- риск сделать recipe слишком длинным и бюрократичным;
  mitigation: keep one compact operator-facing flow and a short decision table, not a prose-heavy essay.
- риск ввести cross-skill ambiguity;
  mitigation: backlog-side recipe stays canonical for backlog action, while dossier plans only consume the readiness/closure boundary.

## Package 1. Canonical dossier-side actualization recipe

### Смысл

Нужен один operator-facing actualization recipe вместо scattered backlog notes across multiple docs.

### Файлы

- `SKILL.md`
- `references/operator-workflows.md`
- `references/examples-and-templates.md`
- `test/docs-contract.test.ts`

### Изменения

1. В `SKILL.md` и `operator-workflows.md` ввести одну canonical actualization model with two literal branch families:
   - lifecycle actualization for `spec-compact`, `plan-slice`, `implementation`: `patch-item` or `refresh + patch`;
   - `change-proposal` actualization by `backlog impact verdict`: `no-op`, `patch existing item`, `source update`, `new backlog item`.
2. Для `source update` explicitly preserve maintenance sub-branches:
   - `register-source` for new canonical source;
   - `update-source-path` when the same source moved;
   - `remove-source` when the source was deleted;
   - scoped `refresh` when a registered source changed;
   - dependent-item patching only after source maintenance when still needed.
3. Для lifecycle actualization keep one literal recipe:
   - determine whether the lifecycle branch is `patch-item` or `refresh + patch`;
   - resolve impacted scope;
   - run deterministic branch preparation on existing commands;
   - execute the canonical action;
   - confirm scoped backlog truth with `items` on the intended scope, then confirm artifact integrity through `status` or `status --refresh`.
4. Сделать эту model explicit for:
   - after `spec-compact`;
   - after `plan-slice`;
   - after `implementation`;
   - after `change-proposal`.
5. В `examples-and-templates.md` добавить short closure examples for these dossier-side cases:
   - `implemented` after implementation;
   - new blocker discovered during implementation;
   - dependency clarified during planning;
   - source changed and derived truth must be refreshed;
   - source moved or deleted during `change-proposal`;
   - new delta item created during `change-proposal`;
   - stale refresh-managed review todo after evidence changed.
6. В этих examples literal final step is always `confirm clean state`, not just “patch applied”.

### Acceptance

- В active docs есть одна canonical actualization model without collapsing `change-proposal` into an underspecified `refresh` shortcut.
- Operator-facing examples cover the main dossier-side actualization cases.
- Recipe ends on clean confirmation and artifact integrity, not on mutation success alone.

## Package 2. Deterministic branch preparation on existing command surface

### Смысл

Основная хрупкость сейчас не в отсутствии команд, а в том, что agent должен помнить choreography и invariants вручную.

### Файлы

- `SKILL.md`
- `references/operator-workflows.md`
- `references/command-reference.md`
- `references/packet-and-patch.md`
- `references/data-model.md`
- `test/docs-contract.test.ts`

### Изменения

1. Нормализовать deterministic branch preparation как явную последовательность на current CLI surface:
   - for ordinary lifecycle `patch-item` branch, resolve target items with `items` or `search`, then start from `template patch`, then use `patch-item --dry-run`, then apply the real patch;
   - for `refresh + patch`, split the recipe into two explicit phases:
     - source-derived recalculation branch: run the needed scoped `refresh` step first;
     - post-refresh patch preparation branch: resolve the now-known impacted item scope, then use `template patch` and `patch-item --dry-run` before the real patch;
   - for `new backlog item`, use `template packet` -> `packet` instead of patch authoring.
2. Явно записать that this package intentionally tightens default dossier-side patch discipline:
   - `template patch` becomes the required default starting point for dossier-side patch authoring;
   - `patch-item --dry-run` becomes the required pre-apply step for dossier-side actualization patches because closeout stability is the explicit target of this cycle.
3. Зафиксировать, что branch preparation does not mean semantic analysis by CLI:
   - utility validates structural inputs and current state;
   - the agent still chooses the branch and authors the patch content.
4. В `data-model.md` и command docs literalize patch-preparation expectations:
   - `sequence` must stay monotonic;
   - `target_item_keys` must already be known or resolved before patch authoring;
   - patch is for existing items only;
   - `remove_todo` cannot be used for refresh-managed review todo.
5. Явно записать, что current cycle does not add a helper command; it makes the branch preparation deterministic by documenting the shortest valid command sequence.
6. For source-driven cases explicitly state:
   - for lifecycle `refresh + patch`, impacted patch scope may become knowable only after scoped `refresh`;
   - for `change-proposal` `source update`, dependent patch scope may become knowable only after source-maintenance output or the resulting scoped `refresh`;
   - closure is not clean until all newly surfaced impacted items are patched or explicitly split into new backlog work.
7. Explicitly keep branch-family separation literal:
   - lifecycle `refresh + patch` uses scoped `refresh` only;
   - source-maintenance commands such as `register-source`, `update-source-path`, and `remove-source` stay inside `change-proposal` `source update`, not inside ordinary lifecycle closure.

### Acceptance

- The shortest valid branch-preparation flow is visible in active docs.
- Source-driven branch preparation is explicitly two-phase and does not mislabel a real source mutation as non-mutating preflight.
- Agent can follow a deterministic branch without inventing patch choreography.
- Docs explicitly preserve the agent/utility split and do not imply NLP behavior in the CLI.

## Package 3. Mutation-managed vs refresh-managed closure semantics

### Смысл

Самая дорогая когнитивная ошибка — пытаться закрыть refresh-managed signals through patch semantics.

### Файлы

- `references/command-reference.md`
- `references/packet-and-patch.md`
- `references/data-model.md`
- `references/operator-workflows.md`
- `test/docs-contract.test.ts`

### Изменения

1. Усилить literal negative rule:
   - existing-item mutation-managed truth changes only through patch/remove workflows;
   - `new backlog item` remains a `template packet` -> `packet` branch and must not be rewritten as patch/remove;
   - refresh-managed review/todo signals are cleared only through scoped `refresh` when the observed cause is gone.
2. Явно зафиксировать workflow misuse examples:
   - attempting to close refresh-managed review todo through `patch-item remove_todo`;
   - stopping after `refresh` when explicit dossier-discovered truth still needs patching;
   - treating partial sync as a clean closure outcome for shared-source or multi-item impact.
3. В active docs explicitly distinguish:
   - source-derived state;
   - dossier-discovered blockers/dependencies/context facts;
   - mutation-managed review todo;
   - refresh-managed review todo.
4. Keep the wording consistent across all touched references so the operator sees one model, not competing variants.

### Acceptance

- Active docs literally ban closing refresh-managed review todo through patch semantics.
- Active docs explicitly preserve `new backlog item` as packet-based work, not as a mutation-managed patch/remove path.
- The difference between mutation-managed and refresh-managed closure classes is operator-visible.
- Partial sync remains explicitly forbidden for clean dossier-side closure where shared-source or multi-item impact is known.

## Package 4. Clean actualization confirmation

### Смысл

Truthful closure must end on confirmed clean state, not on “the command succeeded”.

### Файлы

- `SKILL.md`
- `references/operator-workflows.md`
- `references/command-reference.md`
- `test/docs-contract.test.ts`

### Изменения

1. Define one canonical final confirmation model after dossier-side actualization:
   - use `items` as the required scoped content-truth read whenever the closure changed `delivery_state`, blockers, dependencies, context facts, or any other item-card truth on known items;
   - use scoped `refresh` only as the recalculation step for source-derived state, not as the sole proof of artifact integrity;
   - use `status` or `status --refresh` as the required integrity-confirmation surface because it returns `artifact_integrity`.
2. Literal confirmation checklist must include:
   - updated backlog truth is visible on the intended scope;
   - `artifact_integrity.applied_canonical_paths_exist = true`;
   - no known impacted items remain in partial state.
3. `items` does not replace `status` as the integrity source; both surfaces are required when item-level truth changed.
4. Clarify that clean confirmation is part of dossier-stage closure contract, not an optional confidence boost.
5. Keep confirmation scoped when scope is known, but do not omit the integrity read that makes replay-safe closure truthful.

### Acceptance

- Every canonical recipe ends with a confirmation step.
- The confirmation model explicitly includes both scoped truth confirmation and a command surface that proves artifact-integrity cleanliness.
- Docs do not imply that mutation success alone is enough for clean closure.

## Package 5. Cross-skill consistency and docs-contract protection

### Смысл

The new recipe must stay consistent with downstream dossier closure guidance and resist future wording drift.

### Файлы

- `test/docs-contract.test.ts`
- `docs/README.md`
- review reads against the active `dossier-engineer` contract

### Изменения

1. Extend docs-contract tests to guard:
   - one canonical dossier-side actualization recipe;
   - `patch-item` vs `refresh` vs `refresh + patch` distinction;
   - full `change-proposal` branch surface: `source update`, `new backlog item`, `register-source`, `update-source-path`, `remove-source`;
   - explicit deterministic branch preparation on existing command surface;
   - explicit ban on closing refresh-managed todo through patch semantics;
   - explicit clean confirmation and artifact-integrity requirement.
2. Keep assertions narrow and phrase-based; do not snapshot whole paragraphs.
3. Add this plan to `docs/README.md`.
4. During implementation, do one narrow wording pass against the active dossier contract to ensure:
   - dossier-side `canonical backlog action readiness` language points back to backlog-owned actualization recipe;
   - no dossier doc copies a divergent backlog taxonomy.

### Acceptance

- Docs-contract tests fail if the canonical recipe or negative rules silently disappear.
- Docs-contract tests fail if `change-proposal` source-maintenance or packet-based branches disappear from the active surface.
- `docs/README.md` makes this plan discoverable.
- Backlog-side wording stays the canonical source for actualization recipe without drifting from dossier-side closure wording.

## Recommended implementation order

1. Package 1: canonical recipe and examples.
2. Package 2: deterministic branch preparation on existing commands.
3. Package 3: mutation-managed vs refresh-managed hardening.
4. Package 4: clean confirmation contract.
5. Package 5: docs-contract protection and final wording pass.

## Проверки

- `node --experimental-strip-types --test skills/backlog-engineer/test/docs-contract.test.ts`
- targeted readback of `SKILL.md`, `references/operator-workflows.md`, `references/command-reference.md`, `references/packet-and-patch.md`, `references/data-model.md`, and `references/examples-and-templates.md`
- if implementation unexpectedly changes runtime behavior, run targeted runtime tests for `template patch`, `patch-item --dry-run`, scoped `refresh`, and confirmation-related outputs
- `rg` на абсолютные локальные пути в измененных docs
- `git diff --check`

## Review plan

Перед имплементацией выполнить внешний backlog/process review этого плана против proposal и active contract. После правок добиться PASS на узком scope измененного plan doc.
