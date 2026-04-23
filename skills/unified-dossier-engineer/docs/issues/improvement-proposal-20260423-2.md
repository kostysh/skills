# Improvement Proposal: добавить goal-oriented handoff contract для `plan-slice`

## Проблема

Активный контракт `unified-dossier-engineer` требует от `plan-slice` явный implementation plan и proof obligations, но не требует, чтобы из плана была ясно видна цель, которой должен достичь будущий implementation agent.

Сейчас активная политика для `plan-slice` сохраняет:

- explicit implementation plan for the selected backlog item;
- proof obligations for verification;
- explicit handling of heavy-runtime planning when the trigger fires;
- return to backlog truth layer when planning changes backlog truth.

Но она не фиксирует явно, что план должен отвечать на главный execution вопрос:

- какого конкретного состояния системы или поведения должен достичь агент при выполнении плана?

Из-за этого `plan-slice` может деградировать в список действий или файлов без clear target outcome.

## Почему это важно

Implementation agent часто входит в работу после planning stage и не должен заново выводить intent из истории чата, backlog prose или неявных предположений.

Если план не цель-ориентирован, появляются риски:

- агент выполняет task list, но не достигает нужного пользовательского или системного outcome;
- acceptance criteria и Definition of Done остаются отдельно от slices/tasks;
- scope boundaries приходится угадывать во время implementation;
- reviewer не может проверить, реализован ли именно intended outcome;
- `ready_for_close` может быть выставлен для плана, который не является implementation-ready.

План должен быть не только списком действий, а handoff contract на достижение цели.

## Текущая активная поверхность

Релевантные активные references:

- [Delivery workflow layer](../../references/delivery-workflow-layer.md)
- [Commandized stage control](../../references/commandized-stage-control.md)
- [Telemetry and closure](../../references/telemetry-and-closure.md)

Текущий runtime/help surface правильно держит `plan-slice` как mechanical controller. Semantic content плана остается agent-owned.

Пробел находится именно в active methodology: нет policy, что agent-owned plan content должен содержать explicit execution target.

## Требуемое исправление

Добавить в active `plan-slice` guidance правило goal-oriented handoff.

Рекомендуемая краткая формулировка:

```md
- explicit execution target: the plan must state the concrete outcome the implementation agent must reach, how that outcome will be recognized as complete, and which non-goals or boundaries must not be crossed
```

Рекомендуемое fail-closed правило:

```md
If the implementation objective is ambiguous, `plan-slice` must remain open or blocked rather than handing off a task list that requires the implementation agent to rediscover the goal.
```

## Required `plan-slice` Questions

`plan-slice` не должен считаться implementation-ready, пока будущий implementation agent не сможет ответить на эти вопросы без повторного вывода intent из чата:

- What concrete system state or user-visible behavior must exist after implementation?
- Which acceptance criteria, DoD items, or verification obligations prove that state?
- Which slices/tasks are necessary to reach that state?
- What is explicitly out of scope for this implementation pass?

## Что должно измениться

### 1. Delivery workflow layer

Обновить [Delivery workflow layer](../../references/delivery-workflow-layer.md), section `plan-slice`.

Добавить:

- explicit execution target;
- linkage from target outcome to AC / DoD / verification obligations;
- non-goals / scope boundaries;
- fail-closed behavior when implementation objective is ambiguous.

### 2. Commandized stage control

Проверить [Commandized stage control](../../references/commandized-stage-control.md), чтобы правило не противоречило authority boundary.

Важно сохранить границу:

- stage-controller command не пишет semantic plan content;
- agent-owned `plan-slice` work отвечает за target outcome и implementation-ready handoff;
- `ready_for_close` не должен означать, что task list достаточно ясен, если execution target отсутствует.

### 3. Telemetry / logs

Проверить [Telemetry and closure](../../references/telemetry-and-closure.md), нужен ли минимальный log cue для ambiguous objective или goal reclassification.

Если цель была уточнена в ходе planning, это должно быть видно в `Decisions / reclassifications` или `Process misses`, когда релевантно.

### 4. Tests

Добавить или обновить docs-contract coverage, чтобы правило не регрессировало.

Предлагаемые assertion terms:

- `explicit execution target`
- `concrete outcome`
- `implementation agent`
- `recognized as complete`
- `non-goals or boundaries`
- `objective is ambiguous`

## Acceptance Criteria

Issue считается исправленным только когда:

- active `plan-slice` guidance требует explicit execution target;
- guidance связывает target outcome с AC / DoD / verification obligations;
- guidance требует явных non-goals или boundaries для implementation pass;
- ambiguous objective fail-closed: stage остается open/blocked вместо передачи task list на implementation;
- commandized stage-control boundary остается intact: CLI не становится semantic planner;
- docs-contract tests защищают новое правило.

## Non-Goals

- Не добавлять semantic plan generation в stage-controller runtime.
- Не требовать большого PRD внутри каждого `plan-slice`.
- Не превращать slices/tasks в commitment beyond acceptance criteria, DoD и explicit rollout constraints.
- Не менять backlog truth напрямую из `plan-slice`; backlog changes по-прежнему идут через explicit backlog actualization.
