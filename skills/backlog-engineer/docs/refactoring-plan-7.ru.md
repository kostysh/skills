# Refactoring plan 7: source registry maintenance

## Зачем нужен этот цикл

Текущий `backlog-engineer` умеет:

- `register-source`
- `list-sources`
- `refresh`

Но не умеет:

- удалить source из backlog, если source file исчез из репозитория;
- сменить `path` у зарегистрированного source, если документ переехал.

Это создаёт два реальных process gap:

1. agent не может поддерживать source registry в актуальном состоянии после file moves;
2. agent не может безопасно снять удалённый source с backlog truth без ручной workaround choreography.

Нормативная база этого цикла:

- [source-registry-maintenance-spec.ru.md](source-registry-maintenance-spec.ru.md)
- [utility-spec.ru.md](utility-spec.ru.md)
- [schemas-and-types.ru.md](schemas-and-types.ru.md)
- [test-matrix.ru.md](test-matrix.ru.md)
- [SKILL.md](../SKILL.md)
- [references/command-reference.md](../references/command-reference.md)
- [references/cli-contract.md](../references/cli-contract.md)

## Ключевой архитектурный вывод

`update-source-path` и `remove-source` не симметричны по сложности.

### `update-source-path`

Можно реализовать на текущей архитектуре сравнительно прямо:

- source selector
- path normalization
- path collision guard
- source hash read
- registry rewrite
- state sync for updated `source_label`
- optional refresh-like todo propagation when hash changes

### `remove-source`

Требует отдельного maintenance mutation слоя, потому что:

- rebuild собирает durable truth из canonical packets/patches;
- rebuild валидирует source references against `.backlog/sources.json`;
- existing patch model меняет item `*_source_ids`, но не умеет править context entity `source_ids`;
- значит простое удаление source из registry или только runtime-state rewrite сломает rebuild invariants.

Из этого следует:

- `remove-source` должен materialize utility-owned durable maintenance mutation;
- этот maintenance path должен уметь чистить:
  - item source lists;
  - context entity `source_ids`, где это применимо;
  - review-required state после source removal.

## Fixed decisions

1. Публичный command surface:
   - `update-source-path`
   - `remove-source`
2. Selector model совпадает с `refresh`:
   - `source_id`
   - `source_label`
   - `source_path`
3. `update-source-path` сохраняет тот же `source_id`.
4. `remove-source` не является precondition-only reject command.
5. `remove-source` сначала убирает `source_id` из durable backlog truth, затем оставляет affected items в review-required state, и только потом удаляет source из registry.
6. Forced delete without cleanup не вводится.
7. Если full cleanup не может быть materialized детерминированно, command обязан fail-closed with `BE_SOURCE_REMOVE_UNSUPPORTED`.

## Package 1. Normative contract and schemas

### Цель

Привести docs, command DTOs и error taxonomy в состояние, где новый command surface описан буквально и без скрытых gaps.

### Файлы

- `skills/backlog-engineer/SKILL.md`
- `skills/backlog-engineer/references/command-reference.md`
- `skills/backlog-engineer/references/cli-contract.md`
- `skills/backlog-engineer/docs/utility-spec.ru.md`
- `skills/backlog-engineer/docs/schemas-and-types.ru.md`
- `skills/backlog-engineer/docs/test-matrix.ru.md`
- `skills/backlog-engineer/src/schemas/commands.ts`
- `skills/backlog-engineer/src/schemas/index.ts`
- `skills/backlog-engineer/src/errors/error-codes.ts`
- `skills/backlog-engineer/src/schemas/errors.ts` if needed

### Что сделать

1. Добавить в docs оба новых command contracts:
   - `update-source-path`
   - `remove-source`
2. Зафиксировать new error codes:
   - `BE_SOURCE_PATH_CONFLICT`
   - `BE_SOURCE_REMOVE_UNSUPPORTED`
3. Добавить command input/output schemas.
4. Явно описать, что:
   - `update-source-path` syncs state labels;
   - `remove-source` writes durable maintenance mutation and only then mutates registry.
5. Уточнить mutating-command list в `cli-contract.md`.

### Acceptance

- все нормативные docs говорят об одинаковом command surface;
- error codes literal и без placeholder wording;
- schema layer already knows new commands, even before runtime implementation.

## Package 2. `update-source-path`

### Цель

Реализовать relocation source path без потери `source_id`.

### Файлы

- `skills/backlog-engineer/src/commands/update-source-path.ts` new
- `skills/backlog-engineer/src/commands/index.ts`
- `skills/backlog-engineer/src/cli/command-registry.ts`
- `skills/backlog-engineer/src/sources/index.ts`
- `skills/backlog-engineer/src/sources/source-registry-service.ts`
- `skills/backlog-engineer/src/runtime/*` as needed
- `skills/backlog-engineer/src/core/*` if label sync or refresh-like summary extraction needs shared helper
- `skills/backlog-engineer/test/*`

### Что сделать

1. Add new CLI command with shared selector parsing model.
2. Resolve current source via:
   - `source_id`
   - `source_label`
   - `source_path`
3. Resolve and validate `--new-path` with existing source-path normalization and safe-read rules.
4. Implement same-path no-op branch.
5. Detect path collision against another registered source.
6. Rewrite source record while preserving:
   - `source_id`
   - `kind`
   - `authority`
   - `note`
   - `registered_at`
7. Synchronize state labels/read models immediately.
8. If hash changed:
   - reuse refresh-like source-change propagation instead of inventing a second todo model.
9. Return compact output with:
   - `previous_path`
   - `path`
   - `hash_changed`
   - counts / next_commands

### Особое внимание

- state sync must not silently change backlog truth other than source labels and refresh-derived review state;
- output must stay machine-plain and deterministic;
- `update-source-path` should not create canonical patch artifact.

### Acceptance

- path move with same content keeps `source_id` and creates no new review todo;
- path move with changed content behaves like scoped refresh for the same source;
- stale source labels are not left in persisted read models.

## Package 3. Durable maintenance model for `remove-source`

### Цель

Спроектировать internal mutation path, который умеет убирать source references из canonical backlog truth без ручного agent-authored patch.

### Почему это отдельный пакет

Current patch model insufficient:

- item `*_source_ids` are supported;
- context entity `source_ids` are not patch-editable through current public patch schema;
- rebuild invariants require durable canonical cleanup before registry deletion.

### Файлы

- `skills/backlog-engineer/src/core/mutation-service.ts`
- `skills/backlog-engineer/src/core/replay-pipeline.ts`
- `skills/backlog-engineer/src/core/todo-service.ts`
- `skills/backlog-engineer/src/runtime/rebuild-state.ts`
- `skills/backlog-engineer/src/artifacts/*`
- `skills/backlog-engineer/src/schemas/artifacts.ts`
- `skills/backlog-engineer/src/schemas/commands.ts`
- maybe new internal maintenance artifact helper/module

### Что сделать

1. Decide and implement the canonical persistence model for utility-owned maintenance mutation.

Allowed implementation direction:
- internal canonical patch artifact under `patches/`
- plus applied registry entry

But the key invariant is stronger than file naming:
- rebuild must be able to replay the cleanup deterministically.

2. Implement deterministic cleanup of:
   - item `origin_source_ids`
   - item `specification_source_ids`
   - item `plan_source_ids`
   - item `implementation_source_ids`
   - item `test_source_ids`
   - context entity `source_ids` where used
3. After cleanup, create/update mutation-managed review todo for affected items with literal source-removal message.
4. Ensure final registry deletion happens only after durable cleanup is persisted.
5. Add fail-closed branch:
   - if cleanup scope cannot be materialized under current model -> `BE_SOURCE_REMOVE_UNSUPPORTED`

### Особое внимание

- no orphaned source ids in canonical truth;
- no rebuild breakage after command success;
- review todo after source removal must survive registry deletion;
- command should not silently modify unrelated items.

### Acceptance

- successful `remove-source` can be followed by rebuild with no corruption;
- affected items surface review-needed state immediately;
- context-linked source removal is covered, not just item-linked source removal.

## Package 4. `remove-source` command and CLI UX

### Цель

Поднять new maintenance model в operator-facing command.

### Файлы

- `skills/backlog-engineer/src/commands/remove-source.ts` new
- `skills/backlog-engineer/src/commands/index.ts`
- `skills/backlog-engineer/src/cli/command-registry.ts`
- `skills/backlog-engineer/test/*`

### Что сделать

1. Add selector parsing for:
   - `--source-id`
   - `--source-label`
   - `--source-path`
2. Hook command into maintenance cleanup path from Package 3.
3. Emit compact output with:
   - `removed`
   - `updated_item_keys`
   - counts
   - next_commands
4. Add command help that explains:
   - source removal changes backlog truth;
   - affected items will require review;
   - command fails closed if cleanup cannot be safely materialized.

### Acceptance

- CLI help and JSON contract are explicit enough that agent does not need to infer hidden cleanup behavior;
- error payloads are operator-explainable.

## Package 5. Tests and built artifact sync

### Цель

Доказать, что both commands are safe across docs/runtime/built CLI.

### Files

- `skills/backlog-engineer/test/*.test.ts`
- fixtures under `skills/backlog-engineer/test/fixtures/**`
- built artifact sync through package build

### Required tests

#### `update-source-path`

- success: path changed, hash unchanged
- success: path changed, hash changed, refresh-like todo delta created
- success: external source path move still normalizes correctly
- no-op when new normalized path equals current path
- reject missing new file
- reject unsafe/symlinked new file
- reject selector miss with `BE_SOURCE_NOT_FOUND`
- reject path collision with `BE_SOURCE_PATH_CONFLICT`
- built CLI happy path
- help output coverage
- dry-run parity

#### `remove-source`

- success: source removed after durable cleanup of affected item source lists
- success: source removed after durable cleanup of affected context entity source lists
- success: affected items get mutation-managed review todo with source-removal message
- fail closed with `BE_SOURCE_REMOVE_UNSUPPORTED` if cleanup cannot be safely materialized
- built CLI happy path
- help output coverage
- dry-run parity
- rebuild after successful remove-source remains valid

### Acceptance

- `format:check`, `lint`, `test` all green;
- built CLI and source runtime match;
- no stale docs-contract drift.

## Review order

For implementation packages with code changes:

1. external `spec-conformance`
2. external `code-review`
3. external `security-review`

Re-audits:

- classifier-based, narrow scope only;
- after follow-up code fixes that could affect normative contract, run narrow `spec-conformance` again.

## Definition of done

Cycle is done only when all conditions are true:

1. `backlog-engineer` can maintain source registry with two explicit commands:
   - `update-source-path`
   - `remove-source`
2. source relocation preserves stable `source_id`
3. source removal no longer requires manual patch choreography from the agent
4. successful `remove-source` leaves canonical truth and rebuild invariants valid
5. affected work becomes review-visible after source removal
6. docs, schemas, runtime, tests, and built CLI stay aligned

## Not in this cycle unless newly required by implementation

- batch source maintenance
- metadata editing beyond path relocation
- dossier-side contract changes
- multi-root orchestration
