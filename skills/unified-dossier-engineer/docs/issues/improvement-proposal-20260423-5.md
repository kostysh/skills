# Improvement Proposal: сделать схему stage artifacts согласованной и machine-complete

Issue ID: `ISS-03`

Primary owner skill: `unified-dossier-engineer`

## Проблема

Текущая модель stage artifacts пригодна для человеческого review, но недостаточно machine-complete для надежного downstream tooling.

Сгруппированные проблемы образуют один schema issue:

- stage log и stage-state могут расходиться по общим полям;
- artifact linkage неполный для review, verification и close-out outputs;
- usage skill не записывается явно как agent-supplied stage context;
- `Process misses` остается prose-first вместо structured machine state;
- scope identity неполный, из-за чего downstream consumers откатываются к шумному trace-derived inference.

Это отдельные симптомы одной корневой проблемы: schema stage artifacts все еще слишком сильно зависит от prose и последующей реконструкции.

## Почему это важно

Без machine-complete schema stages:

- retrospective tooling вынужден угадывать по логам вместо чтения явно declared state;
- parity bugs могут существовать между stage log и stage-state;
- process metrics становятся шумными, потому что prose интерпретируется как telemetry;
- usage skills и scope boundaries восстанавливаются по fragments trace вместо того, чтобы быть явно supplied агентом;
- будущая workflow automation остается хрупкой, даже если human-readable log выглядит нормально.

## Текущая активная поверхность

Релевантные active references:

- [Unified artifact topology](../../references/unified-artifact-topology.md)
- [Telemetry and closure](../../references/telemetry-and-closure.md)
- [Commandized stage control](../../references/commandized-stage-control.md)
- [Delivery workflow layer](../../references/delivery-workflow-layer.md)

## Требуемое исправление

Расширить contract stage artifacts так, чтобы machine-facing state, нужный downstream consumers, хранился явно в metadata stage и правдиво отражался в stage-state.

Этот issue сознательно охватывает один ограниченный schema family:

1. parity между stage log и stage-state;
2. explicit artifact link arrays и commit anchors;
3. explicit operator-supplied skill annotations;
4. structured `process_misses`;
5. explicit scope identity fields.

## Что должно измениться

### 1. Parity общих полей

Определить и защитить shared machine fields, которые не должны расходиться между metadata stage log и stage-state.

Как минимум контракт должен охватывать shared fields, которые вводятся или ужесточаются этим issue, а не только уже существующую базу.

Для границ этого issue helper-managed `stage-state` должен оставаться authoritative structured coordination and validation surface, а metadata stage log должны быть bounded human-readable mirror этого structured state.

### 2. Artifact linkage

Добавить machine-complete linkage для:

- review artifacts;
- verification artifacts;
- step-close artifact;
- optional final commit anchors только как trace links, если runtime уже записывает их.

Цель здесь — explicit linkage, а не heuristic recovery.
Commit anchors не должны становиться required truthful closure evidence в рамках этого issue.

### 3. Skill annotations

Добавить explicit stage-level skill annotations как agent-supplied inputs, а не trace-derived guesses.

Рекомендуемая форма:

- `skills_used`
- `skill_issues`
- `skill_followups`

Эти поля должны отражать осознанные annotations оператора/агента по стадии, а не automatic skill scraping из conversation trace.

### 4. Structured process misses

Заменить prose-only telemetry для process misses на structured machine state, сохранив при этом human-readable rendering.

Предпочтительное направление — простой repeatable DSL, который агент явно передает в stage-control, а затем тот сохраняет как structured metadata/state.

Ожидаемая форма должна оставаться минимальной и bounded, например:

- `id`
- `category`
- `severity`
- `resolved`
- `summary`

Human-readable narrative `Process misses` может сохраниться как rendered mirror, но не должен оставаться единственным source of truth.

### 5. Явная scope identity

Добавить explicit scope identity fields, чтобы downstream consumers не были вынуждены делать broad trace-derived guessing.

Как минимум контракт должен покрывать:

- `primary_feature_id`, когда он нужен отдельно от локального stage context;
- `primary_backlog_item_key` или эквивалентную explicit backlog scope identity;
- `phase_scope` или эквивалентный explicit boundary descriptor.

## Внешний Spec-Conformance Review

Status: reviewed

Verdict on initial draft: `insufficient`

Ключевой результат review:

- grouped schema issue принят как правильная bounded problem;
- draft требовал одного недостающего authority rule, чтобы parity не оставляла две competing sources of truth;
- wording про commit anchors требовало tightening, чтобы optional trace links не дрейфовали в required closure truth;
- acceptance требовал явного runtime-enforced write/validation parity, а не только docs и tests.

## Acceptance Criteria

Issue считается исправленным только когда:

- contract stage artifacts явно определяет новые machine-facing fields;
- helper-managed `stage-state` остается authoritative structured coordination/validation surface для полей этого issue, а metadata stage log — bounded mirror;
- metadata stage log и stage-state сохраняют parity для полей этого issue;
- linkage review/verification/close-out является explicit, а не heuristic;
- любые commit anchors, введенные или сохраненные этим issue, остаются optional trace links и не становятся required truthful closure evidence;
- skill annotations являются agent-supplied и structured, а не trace-scraped;
- `process_misses` имеет structured source of truth и больше не зависит только от prose parsing;
- explicit scope identity fields уменьшают необходимость в trace-derived scope guessing;
- shipped writers и validators в stage-control, review, verification и step-close paths материализуют и enforce schema/parity expectations;
- docs и tests защищают additions schema и expectations enforcement.

## Обязательное ограничение для последующего planning и implementation

Любой будущий planning или implementation по этому issue должен оставаться строго в границах конкретных schema gaps, перечисленных здесь.

Обязательные границы:

- реализовывать только те fields, inputs, rendering и tests, которые нужны для parity, linkage, skill annotations, structured `process_misses` и scope identity;
- предпочитать минимально достаточный schema change set и самый простой repeatable DSL, который удовлетворяет контракту;
- не расширять этот issue до retrospective-tool discovery logic, report rendering strategy или unrelated workflow redesign;
- не добавлять automatic skill extraction и automatic process-miss inference из trace или prose в рамках этого issue;
- если появится другая telemetry need вне этих полей, заводить новый follow-up вместо расширения текущего issue.

## Non-Goals

- Не redesign-ить всю lifecycle telemetry model.
- Не добавлять generic trace scraping как substitute для explicit stage metadata.
- Не смешивать с этим issue session provenance changes из `ISS-02`, кроме мест, где shared schema должна аккуратно сосуществовать.
