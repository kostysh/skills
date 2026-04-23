# Implementation Log 12: goal-oriented `plan-slice` handoff

## Scope

Реализован [refactoring-plan-5.ru.md](refactoring-plan-5.ru.md) для [issues/improvement-proposal-20260423-2.md](issues/improvement-proposal-20260423-2.md).

Цель изменения:

- сделать `plan-slice` explicit goal-oriented handoff;
- требовать execution target, completion recognition и implementation boundaries;
- сохранить stage-controller runtime как mechanical controller;
- защитить правило docs-contract тестом.

## Измененные active surfaces

### Delivery workflow layer

Обновлен [references/delivery-workflow-layer.md](../references/delivery-workflow-layer.md):

- `plan-slice` теперь требует explicit execution target;
- target outcome должен быть связан с acceptance criteria, Definition of Done или verification obligations;
- non-goals / boundaries обязательны для implementation pass;
- ambiguous implementation objective оставляет stage open/blocked вместо передачи task-list-only handoff.

### Commandized stage control

Обновлен [references/commandized-stage-control.md](../references/commandized-stage-control.md):

- `ready_for_close` для `plan-slice` теперь явно presumes agent-owned semantic readiness;
- stage controller не author/validate semantic plan content;
- mechanical transition не заменяет execution-target clarity.

### Telemetry and closure

Обновлен [references/telemetry-and-closure.md](../references/telemetry-and-closure.md):

- material target clarification, goal reclassification и ambiguity resolution для `plan-slice` получили явный log home в `Decisions / reclassifications`;
- unresolved ambiguous objective должен быть видимым blocker, а не скрываться за mechanical transition.

### Runtime-facing boundary

Обновлены:

- [references/runtime-and-command-boundary.md](../references/runtime-and-command-boundary.md)
- [docs/utility-spec.ru.md](utility-spec.ru.md)

Решение:

- runtime/help surface не менялся;
- semantic validation execution target не добавлялась;
- docs явно запрещают обещать, что stage-controller commands author или validate semantic `plan-slice` content.

## Tests

Обновлен [test/docs-contract.test.ts](../test/docs-contract.test.ts):

- добавлен regression guard для `plan-slice` execution-target policy;
- тест защищает concrete outcome, completion recognition, boundaries, ambiguous objective fail-closed и runtime non-automation boundary.

## Verification

Выполнены проверки:

- `pnpm --filter @kostysh/unified-dossier-engineer test` — pass, 57 tests.
- `pnpm --filter @kostysh/unified-dossier-engineer typecheck` — pass.
- `pnpm --filter @kostysh/unified-dossier-engineer exec biome check --files-ignore-unknown=true --formatter-enabled=true --linter-enabled=false --assist-enabled=false test/docs-contract.test.ts` — pass.

Также запускался full package `format:check`; он остался red из-за уже существующего formatter diff в нетронутом `src/backlog/commands.ts`.
Этот файл не менялся в данном пакете, поэтому unrelated formatting cleanup не включался.

## Notes

Runtime source не менялся, потому что issue требует active methodology policy, а не automatic CLI validation.
Семантическое качество плана остается agent-owned; CLI остается mechanical progress controller.
