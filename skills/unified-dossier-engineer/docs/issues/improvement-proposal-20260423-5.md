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

## План имплементации

Status: draft

Source row: `ISS-03` / `UDE-02`, `UDE-04`, `UDE-05`, `UDE-06`, `UDE-07`

### Рабочие допущения

- Helper-managed `.dossier/stages/*` остается authoritative structured coordination/validation surface.
- Stage log frontmatter является bounded mirror structured state; narrative sections остаются human-readable.
- Все новые annotations являются agent-supplied inputs. Automatic skill scraping или process-miss inference не входит в scope.

### Шаги

1. Сначала зафиксировать schema contract в active docs:
   - обновить `references/telemetry-and-closure.md`, `references/commandized-stage-control.md`, `references/unified-artifact-topology.md`, `references/delivery-workflow-layer.md` и `docs/utility-spec.ru.md`;
   - явно перечислить parity-protected machine fields: existing `backlog_followup_required`, `backlog_followup_kind`, `backlog_followup_resolved`, плюс new fields `review_artifacts`, `verification_artifacts`, `step_artifact`, `final_delivery_commit`, `final_closure_commit`, `skills_used`, `skill_issues`, `skill_followups`, `process_misses`, `primary_feature_id`, `primary_backlog_item_key`, `phase_scope`;
   - зафиксировать authority rule: `.dossier/stages/*` authoritative, stage log frontmatter mirrors it for the fields in this issue.
2. Расширить stage-state model:
   - в `src/shared/stage-state.ts` добавить/нормализовать typed fields для `backlog_followup_*` parity и new arrays/objects;
   - обновить `syncStageStateFromMetadata` и `machineMetadataFromStageState`, чтобы новые fields round-trip без потери parity;
   - сохранить backward-compatible defaults: missing arrays become `[]`, missing optional anchors become `null`.
3. Добавить minimal agent-supplied CLI inputs:
   - repeatable `--skill-used <skill-name>`;
   - repeatable `--skill-issue <code-or-summary>`;
   - repeatable `--skill-followup <code-or-summary>`;
   - repeatable `--process-miss <dsl>`.
4. Зафиксировать простой repeatable DSL для process misses:
   - format: `id=<id>;category=<category>;severity=<low|medium|high>;resolved=<true|false>;summary=<text>`;
   - parser должен reject malformed entries до записи artifact;
   - no input означает `process_misses: []`, а rendered `Process misses` показывает `none`;
   - structured `process_misses` является source of truth, prose section только rendered mirror.
5. Материализовать artifact linkage:
   - `review-artifact` wrapper обновляет `review_artifacts[]` и `review_events[]` в stage state/log;
   - `dossier-verify` wrapper после успешной записи verification artifact обновляет `verification_artifacts[]`;
   - `dossier-step-close` записывает `step_artifact`, сохраняет `review_artifacts[]` / `verification_artifacts[]` и добавляет `final_closure_commit` when observable;
   - stage-controller `--ready-for-close` может записывать `final_delivery_commit` when observable, но этот commit остается optional trace link, not closure evidence.
6. Добавить explicit scope identity:
   - stage-controller metadata пишет `primary_feature_id` из canonical feature id;
   - `primary_backlog_item_key` mirror-ит resolved backlog item key;
   - `phase_scope` задается optional explicit input, когда простой feature/stage scope недостаточен.
7. Добавить validation/parity enforcement:
   - central helper сравнивает fields этого issue между metadata перед render и stage-state record;
   - `backlog_followup_required`, `backlog_followup_kind`, `backlog_followup_resolved` входят в тот же parity set и покрывают source problem `UDE-02`;
   - write paths fail before/at write boundary при malformed structured inputs;
   - helper-owned updates preserve authored narrative while refreshing structured mirror.
8. Защитить tests:
   - CLI tests для round-trip stage log + stage-state parity;
   - отдельный regression test, что `backlog_followup_*` одинаково отражены в stage log frontmatter и `.dossier/stages/*`;
   - tests для malformed `--process-miss`;
   - tests для review/verification/step-close linkage updates;
   - docs-contract tests, что commit anchors optional trace links и skill/process fields agent-supplied, not trace-scraped.
9. Пересобрать shipped runtime после changes в `src`.

### Проверки

- `pnpm --filter @kostysh/unified-dossier-engineer test`
- `pnpm --filter @kostysh/unified-dossier-engineer typecheck`
- Targeted fixture smoke: stage-controller -> dossier-verify -> review-artifact -> dossier-step-close produces parity for fields of this issue.

### Scope guards

- Не добавлять retrospective discovery logic.
- Не добавлять automatic skill extraction или process-miss inference.
- Не делать commit anchors required closure evidence.
- Не включать session provenance migration из `ISS-02`, кроме совместимого хранения shared metadata.

## Внешний Spec-Conformance Review плана

Status: reviewed

Reviewer: `spec-conformance-reviewer`

Model: top-tier, reasoning `high`, non-forked external review

Verdict: `PASS`

Ключевой результат review:

- initial review нашел обязательный пропуск: `backlog_followup_required`, `backlog_followup_kind`, `backlog_followup_resolved` не входили в explicit schema/parity scope;
- план доработан: `backlog_followup_*` включены в parity-protected field set, stage-state normalization, parity enforcement и regression tests;
- повторный review подтвердил, что план покрывает `UDE-02`, `UDE-04`, `UDE-05`, `UDE-06`, `UDE-07` без выхода в excluded trace scraping или retrospective discovery.
