# План добавления goal-oriented handoff contract для `plan-slice`

## Назначение

Этот план реализует [issue про goal-oriented handoff contract для `plan-slice`](issues/improvement-proposal-20260423-2.md).

Цель:

- сделать `plan-slice` не только списком действий, а implementation-ready handoff contract;
- явно требовать execution target: какое состояние системы или user-visible behavior должен получить implementation agent;
- связать target outcome с AC / DoD / verification obligations;
- зафиксировать scope boundaries и non-goals для implementation pass;
- fail-closed блокировать переход к implementation, если objective ambiguous;
- сохранить stage-controller runtime как mechanical controller, без semantic plan generation.

## Подтвержденная проблема

Активная политика сейчас требует от `plan-slice`:

- `explicit implementation plan for the selected backlog item`;
- `proof obligations for verification`;
- `explicit handling of heavy-runtime planning when the trigger fires`;
- `return to backlog truth layer when planning changes backlog truth`.

Но active surface не требует, чтобы план явно отвечал:

- что именно должно стать true после implementation;
- как понять, что target outcome достигнут;
- какие AC / DoD / verification obligations доказывают достижение цели;
- какие scope boundaries нельзя пересекать.

Из-за этого `plan-slice` может формально выглядеть полным, но быть плохим handoff: future implementation agent получает task list и вынужден заново выводить intent из prior chat, backlog prose или неявных assumptions.

## Фиксированные решения

- `plan-slice` должен производить goal-oriented implementation handoff.
- Execution target — это concrete system state или user-visible behavior, а не просто список files/tasks.
- Slices/tasks являются путем к target outcome, но не заменяют target outcome.
- Target outcome должен быть связан с acceptance criteria, Definition of Done и verification obligations.
- Non-goals / boundaries обязательны для каждого `plan-slice`; если дополнительных boundaries beyond AC / DoD / rollout constraints нет, это должно быть сказано явно.
- Если implementation objective ambiguous, `plan-slice` остается `open` или `blocked`; нельзя передавать ambiguous task list в implementation.
- `ready_for_close` для `plan-slice` означает готовность войти в audit/closure flow только после agent-owned semantic plan readiness.
- Stage-controller command не генерирует semantic plan content и не принимает product decisions.
- Runtime/help surface не должен обещать automatic semantic validation, если runtime реально этого не делает.
- При редактировании prose/contract surface этого skill-а разрешено вносить только изменения, прямо входящие в scope данного плана.
- Запрещено попутно улучшать, переписывать, дополнять или “подчищать” другие части skill-а, если эти правки не были явно запланированы в этом плане.

## Package 1. Провести inventory active planning surface и зафиксировать точную wording policy

### Цель

Сначала определить, где именно active surface описывает `plan-slice`, readiness и stage-controller boundary, чтобы не внести противоречивую policy.

### Что входит

- Проверить active references:
  - `references/delivery-workflow-layer.md`
  - `references/commandized-stage-control.md`
  - `references/telemetry-and-closure.md`
  - `references/runtime-and-command-boundary.md`
- Проверить generated `SKILL.md` command summary для `plan-slice`.
- Проверить `docs/utility-spec.ru.md` только как maintainer-facing/runtime-facing spec, если она содержит wording про stage-controller readiness.
- Зафиксировать exact wording для:
  - `explicit execution target`;
  - target outcome link to AC / DoD / verification;
  - non-goals / boundaries;
  - ambiguous objective fail-closed;
  - stage-controller non-semantic boundary.

### Acceptance

- есть список active/runtime-facing мест, которые нужно менять;
- есть согласованная wording policy, не обещающая runtime semantic validation;
- scope ограничен `plan-slice` handoff readiness и не затрагивает unrelated workflow rules.

## Package 2. Обновить active delivery workflow semantics для `plan-slice`

### Цель

Сделать goal-oriented handoff first-class обязанностью `plan-slice`.

### Что входит

- Обновить `references/delivery-workflow-layer.md`, section `### plan-slice`.
- Добавить обязанность:
  - `explicit execution target`;
  - concrete outcome that implementation agent must reach;
  - how that outcome is recognized as complete;
  - linkage to AC / DoD / verification obligations;
  - slices/tasks necessary to reach that target;
  - non-goals or boundaries that must not be crossed.
- Добавить fail-closed rule:
  - если objective ambiguous, `plan-slice` не может быть treated as implementation-ready;
  - stage остается open/blocked вместо handoff task list, который требует rediscovering goal.
- Не превращать `plan-slice` в большой PRD: правило должно требовать compact but explicit target, а не verbose planning artifact.

### Acceptance

- agent, читающий только active delivery workflow, понимает, что plan должен содержать goal-oriented target outcome;
- task list без clear target outcome больше не выглядит валидным `plan-slice` output;
- target outcome связан с closure/verification evidence, а не существует как декоративная prose.

## Package 3. Выровнять stage-controller boundary и readiness semantics

### Цель

Предотвратить неверную трактовку `ready_for_close` как purely mechanical готовности при отсутствующем execution target.

### Что входит

- Обновить `references/commandized-stage-control.md`, если Package 1 подтвердит wording gap.
- Зафиксировать:
  - stage-controller command не пишет semantic plan content;
  - agent-owned `plan-slice` work отвечает за target outcome;
  - `ready_for_close` не должен использоваться, если implementation objective ambiguous;
  - commandized transition surface дополняет semantic plan readiness, но не заменяет ее.
- Проверить `references/runtime-and-command-boundary.md` и `docs/utility-spec.ru.md`:
  - не нужно ли добавить отрицательное правило, что runtime не validates execution target automatically;
  - не нужно ли выровнять wording вокруг `ready_for_close`.

### Acceptance

- active boundary остается механической: CLI не становится semantic planner;
- `ready_for_close` не ослабляет requirement for explicit execution target;
- runtime-facing docs не обещают semantic validation, которой нет в shipped runtime.

## Package 4. Выровнять telemetry/log contract для planning target changes

### Цель

Сделать goal clarification и reclassification видимыми в stage logs без добавления лишней artifact family.

### Что входит

- Проверить `references/telemetry-and-closure.md`.
- Если нужен минимальный cue, добавить правило:
  - target clarification, goal reclassification, или ambiguity resolution during `plan-slice` should appear in `Decisions / reclassifications` when material.
- Не добавлять новую mandatory log section, если existing scaffold достаточно покрывает это через:
  - `Decisions / reclassifications`;
  - `Temporary assumptions`;
  - `Process misses`;
  - `Close-out`.
- Сохранить rule, что machine-readable fields не выводятся из prose.

### Acceptance

- material target/goal decisions during `plan-slice` have a clear log home;
- logging contract не раздувается новым artifact type или mandatory section без необходимости;
- retrospective может увидеть, что ambiguous objective был resolved или остался blocker.

## Package 5. Поставить docs-contract regression guards

### Цель

Защитить новое active правило от повторной деградации.

### Что входит

- Обновить `test/docs-contract.test.ts`.
- Добавить assertions на active refs, минимум:
  - `references/delivery-workflow-layer.md`;
  - `references/commandized-stage-control.md`, если меняется;
  - `references/telemetry-and-closure.md`, если меняется;
  - `docs/utility-spec.ru.md`, если меняется.
- Suggested assertion terms:
  - `explicit execution target`;
  - `concrete outcome`;
  - `implementation agent`;
  - `recognized as complete`;
  - `non-goals or boundaries`;
  - `objective is ambiguous`.
- Проверить, что tests не требуют runtime semantic behavior, если изменяется только active methodology.

### Acceptance

- docs-contract падает, если `plan-slice` снова теряет explicit execution target;
- tests защищают fail-closed ambiguous objective rule;
- tests не создают ложный runtime contract.

## Package 6. Обновить docs navigation и implementation log

### Цель

Сделать изменение восстановимым для будущего maintainer-а.

### Что входит

- Обновить `docs/README.md`:
  - добавить issue;
  - добавить этот refactoring plan.
- После имплементации создать следующий `implementation-log-*.ru.md`.
- В implementation log зафиксировать:
  - какие active refs изменены;
  - почему runtime не менялся или какие runtime-facing docs были выровнены;
  - какие docs-contract tests защищают правило;
  - какие проверки запускались.

### Acceptance

- document map ведет к issue и plan;
- implementation log объясняет policy decision и verification;
- future maintainer может понять, что это semantic handoff policy, а не runtime automation feature.

## Порядок реализации

1. Package 1
2. Package 2
3. Package 3
4. Package 4
5. Package 5
6. Package 6

Причина:

- сначала нужно зафиксировать wording и affected surface;
- затем обновить canonical workflow semantics;
- после этого выровнять stage-controller и telemetry boundaries;
- только потом ставить regression guards;
- navigation/log обновляются в конце, когда known final scope.

## Verification Plan

Минимальные проверки после реализации:

- `pnpm --filter @kostysh/unified-dossier-engineer test`
- `pnpm --filter @kostysh/unified-dossier-engineer typecheck`

Если менялся runtime/help source или generated launcher:

- `pnpm --filter @kostysh/unified-dossier-engineer lint`
- `node skills/unified-dossier-engineer/scripts/dossier-engineer.mjs help plan-slice`

Если менялись только Markdown docs и docs-contract tests:

- тестовый minimum остается `pnpm --filter @kostysh/unified-dossier-engineer test`, потому что docs-contract живет в package tests.

## Основные риски

### 1. Смешать semantic planning policy и runtime automation

Риск:

правило будет сформулировано так, будто CLI должен автоматически проверять качество execution target.

Сдерживание:

- явно писать, что semantic content остается agent-owned;
- runtime не promises semantic validation unless implemented and tested.

### 2. Сделать план слишком тяжелым

Риск:

`plan-slice` начнет требовать большой PRD вместо compact implementation handoff.

Сдерживание:

- требовать compact explicit target outcome;
- target / proof / boundaries должны быть понятны, но не verbose.

### 3. Оставить task list как substitute for goal

Риск:

новая policy будет добавлена рядом, но не запретит task-list-only handoff.

Сдерживание:

- добавить fail-closed language для ambiguous objective;
- docs-contract должен искать wording про `objective is ambiguous` и `explicit execution target`.

### 4. Размыть связь с verification

Риск:

goal будет записан как generic aspiration, без proof path.

Сдерживание:

- требовать linkage to AC / DoD / verification obligations;
- reviewer должен видеть, как распознать completion.
