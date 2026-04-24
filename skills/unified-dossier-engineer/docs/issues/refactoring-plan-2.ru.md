# План восстановления operator-facing log contract

## Назначение

Этот план реализует [issue про деградацию stage-log contract](improvement-proposal-20260421-1.md).

Цель плана:

- вернуть log-ам операторскую и retrospective-ценность;
- не откатить merged skill обратно к prose-heavy log model;
- не ослабить deterministic telemetry, closure truth и commandized stage-control.

Проблема уже затрагивает не только docs.

В текущем shipped runtime stage-controller code materialize-ит почти mechanical log scaffold (`Mechanical stage-controller log.` + `transition_events[]`). Поэтому исправление должно охватить:

- active references;
- generated instruction surface;
- runtime log scaffold;
- tests.

## Фиксированные решения

- stage log остаётся одним human-readable artifact, а не split-ится на telemetry file и separate reasoning file;
- YAML frontmatter, bounded event arrays, `transition_events[]`, durable artifact refs и strict closure truth сохраняются без ослабления;
- `transition_events[]` остаётся authoritative для mechanical transitions, но не заменяет собой весь stage record;
- stage-controller commands остаются mechanical helpers и не делают semantic inference из prose;
- narrative layer возвращается как required minimum, а не как optional decoration;
- правка должна покрывать и `feature-intake`, и primary stage logs, если они используют общий scaffold writer.

## Package 1. Уточнить active purpose of logs

### Цель

Явно закрепить в active references, что intake/stage logs нужны не только для lifecycle reconstruction, но и для operator-facing process evidence.

### Что входит

- обновить `references/telemetry-and-closure.md`
- обновить `references/commandized-stage-control.md`
- обновить `docs/utility-spec.ru.md` там, где она описывает bootstrap/update stage logs
- явно зафиксировать:
  - logs support operator decisions about process improvement;
  - logs must preserve evidence of decisions, clarifications, rerounds, process misses and non-trivial stage shaping;
  - thin telemetry alone is insufficient for non-trivial stages

### Acceptance

- active references больше не допускают трактовку “frontmatter + mechanical transition list is enough for every non-trivial stage”
- purpose of logs явно включает retrospective/process-improvement value
- maintainer-facing utility spec не расходится с active log contract

## Package 2. Восстановить required narrative scaffold

### Цель

Вернуть обязательный narrative minimum для intake и stage logs, не возвращая избыточную prose-heavy модель.

### Что входит

- определить canonical required sections для stage logs:
  - `Scope`
  - `Inputs actually used`
  - `Decisions / reclassifications`
  - `Operator feedback`
  - `Review events`
  - `Backlog follow-up`
  - `Process misses`
  - `Close-out`
- внутри `Decisions / reclassifications` определить обязательные subheadings:
  - `Spec gap decisions`
  - `Implementation freedom decisions`
  - `Temporary assumptions`
- определить отдельный required scaffold для `feature-intake`, если intake log сохраняет собственные section semantics
- закрепить правило:
  - пустая секция materialize-ится как `none`, а не исчезает

### Acceptance

- active contract задаёт стабильный section scaffold вместо optional narrative prose
- non-trivial logs обязаны сохранять решения beyond incoming spec, operator feedback и process friction
- intake и stage logs не смешиваются в одну безликую section model, если их semantics различаются
- utility spec достаточно явно описывает, что bootstrap/update stage log must preserve this scaffold rather than materialize a minimal mechanical body

## Package 3. Доработать shipped runtime log scaffold

### Цель

Привести runtime в соответствие с новым contract так, чтобы stage-controller commands не генерировали impoverished logs.

### Что входит

- заменить current minimal renderer в `src/delivery/stage-control.ts`
- materialize-ить required section scaffold при bootstrap log-а
- перестать генерировать body вида только:
  - `## Summary`
  - `Mechanical stage-controller log.`
  - `## Transition events`
- сохранить deterministic transition section как отдельную bounded part log-а
- определить canonical initial placeholders для narrative sections

### Acceptance

- freshly generated intake/stage log уже содержит required scaffold, а не almost-empty body
- runtime не ослабляет telemetry fields и transition evidence
- runtime не invent-ит semantic content; он только scaffold-ит required sections

## Package 4. Гарантировать preservation при повторных stage transitions

### Цель

Не допустить, чтобы и stage-controller reruns, и helper-owned closure updates затирали agent-authored narrative sections.

### Что входит

- заменить current “preserve only notes” behavior на section-aware preservation model
- при re-render сохранять agent-authored content в canonical sections
- обновлять только:
  - frontmatter
  - transition section
  - deterministic helper-owned fields
- явно включить в scope helper-owned rewrite path:
  - `dossier-step-close`
  - `recordStepCloseOnStageLog()`
- не уничтожать уже написанные:
  - `Decisions / reclassifications`
  - `Operator feedback`
  - `Process misses`
  - other required narrative sections

### Acceptance

- rerun `spec-compact` / `plan-slice` / `implementation` / `change-proposal` / `feature-intake` не стирает authored narrative sections
- `dossier-step-close` / `recordStepCloseOnStageLog()` тоже не стирают authored narrative sections при helper-owned closure update
- helper-owned updates и agent-authored narrative coexist deterministically
- contract не требует от агента переписывать log после каждого mechanical transition

## Package 5. Усилить tests и generated-surface parity

### Цель

Защитить новый log contract от повторной деградации.

### Что входит

- обновить CLI tests для log scaffold:
  - bootstrap log contains required sections
  - rerender preserves authored narrative content
  - transition updates remain truthful
- добавить обязательные docs-contract checks для protected parity surface:
  - `references/telemetry-and-closure.md`
  - `references/commandized-stage-control.md`
  - `docs/utility-spec.ru.md`
- добавить runtime tests, которые отдельно покрывают helper-owned closure rewrite path, а не только stage-controller reruns
- регенерировать emitted `SKILL.md`
- обновить `docs/README.md` и implementation log после выполнения работы

### Acceptance

- tests падают, если runtime снова начинает materialize-ить almost-frontmatter-only logs
- tests падают, если helper-owned closure update стирает authored narrative scaffold
- generated `SKILL.md` и active references согласованы с new log contract
- docs/runtime/tests parity восстановлена для active refs и maintainer-facing utility spec, а не только для emitted `SKILL.md`

## Порядок реализации

1. Package 1
2. Package 2
3. Package 3
4. Package 4
5. Package 5

Причина:

- сначала фиксируется нормативная цель;
- затем фиксируется required shape;
- только после этого меняется runtime renderer;
- preservation semantics идут отдельно, потому что это главный скрытый regression risk;
- tests and generated-surface parity замыкают change set в конце.

## Основные риски

### 1. Перегрузить logs prose-heavy требованиями

Риск:

можно случайно откатиться к старой тяжелой модели, где log превращается в вторую спецификацию.

Сдерживание:

- narrative scaffold должен быть concise;
- пустые секции materialize-ятся как `none`;
- runtime scaffold-ит форму, но не генерирует reasoning prose.

### 2. Сломать deterministic update path

Риск:

если renderer начнёт свободно парсить Markdown, stage-controller updates станут хрупкими.

Сдерживание:

- preservation model должен работать по узкому canonical section scaffold;
- helper-owned sections и agent-owned sections должны быть явно разделены.

### 3. Случайно ослабить closure/telemetry semantics

Риск:

исправление narrative layer может нечаянно сместить акцент от structured fields.

Сдерживание:

- frontmatter, event arrays, transition evidence и closure artifacts остаются mandatory и authoritative;
- plan не включает изменений в closure authority.

## Validation

План считается выполненным, когда одновременно верны все условия:

- active references явно называют logs operator-facing evidence artifacts;
- required section scaffold зафиксирован для intake/stage logs;
- shipped runtime materialize-ит этот scaffold из коробки;
- reruns не стирают authored narrative content;
- tests защищают и bootstrap shape, и preservation semantics, и helper-owned closure rewrite path;
- docs-contract или эквивалентный enforced parity layer защищает `telemetry-and-closure.md`, `commandized-stage-control.md` и `utility-spec.ru.md`;
- generated `SKILL.md` не противоречит active log contract.
