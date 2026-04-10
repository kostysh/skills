# Issue: отсутствует policy для логов спецификации и планирования

Дата: `2026-04-10`
Компонент: `dossier-engineer`
Область: workflow logging, `spec-compact`, `plan-slice`, retrospective process analytics
Серьезность: medium
Статус: open

## Кратко

В `dossier-engineer` уже есть явный logging contract для стадии `implementation`:

- `references/implementation-logging.md`;
- `references/workflow-stage-implementation.md`;
- stage exit checklist в `SKILL.md`.

Этот лог фиксирует package-level ход реализации, review events, process misses, decisions beyond current model, duration, commit data и метрики, нужные для ретроспективного анализа.

Для стадий `spec-compact` и `plan-slice` аналогичной policy сейчас нет. Это выглядит как process gap: именно на спецификации и планировании часто принимаются решения, которые позднее определяют стоимость реализации, число corrective cycles, качество slice boundaries, количество review rerounds и вероятность scope churn.

## Почему это проблема

Без логов для specification/planning нельзя надежно восстановить:

- какие source inputs реально повлияли на spec или plan;
- какие open questions были resolved, reclassified или оставлены до implementation;
- почему был выбран именно такой slice boundary;
- сколько corrective passes потребовалось после review или operator feedback;
- где возникали operator clarifications и process misses;
- какие planning assumptions позже оказались неверными;
- почему backlog actualization была именно такой;
- какие проверки были пропущены осознанно, а какие забыты.

Dossier сам по себе является SSoT для требований и плана, но он не должен превращаться в полный process telemetry log. Dossier отвечает на вопрос "что является текущей truth", а stage log должен отвечать на вопрос "как мы к этой truth пришли и где процесс можно улучшить".

## Текущий контраст с implementation logging

Implementation logging уже требует:

- открыть log до первого mutating edit для multi-step/package-based work;
- фиксировать package metadata;
- записывать review events;
- явно логировать process misses;
- фиксировать final commit information;
- собирать метрики для ретроспективы.

Для `spec-compact` и `plan-slice` похожие события тоже существуют:

- плановый или спецификационный input set;
- plan-mode assessment;
- source/ADR/overlay ingestion;
- open-question decisions;
- contract-risk identification;
- slice reshaping after feedback;
- review findings and rerounds;
- backlog actualization;
- step-close artifacts.

Но сейчас нет правила, когда и где это логировать.

## Expected behavior

Разработчик скила должен проработать stage logging policy для specification/planning этапов.

Возможные варианты реализации:

- расширить `references/implementation-logging.md` до общего `workflow-stage-logging` контракта;
- добавить отдельный `references/spec-and-planning-logging.md`;
- ввести lightweight stage-log artifacts для `spec-compact` и `plan-slice`;
- определить порог, когда лог обязателен, чтобы не создавать лишний overhead для простых одношаговых dossier updates.

Важно: итоговое решение должно не дублировать Feature Dossier, а фиксировать process telemetry для последующего анализа и оптимизации работы агентов и workflow.

## Обязательные вопросы для проработки

- Нужен ли единый log format для `spec-compact`, `plan-slice` и `implementation`, или разные stage-specific форматы?
- Где должен жить log: в `docs/`, `.dossier/`, рядом с feature dossier или в отдельной utility-owned директории?
- Когда log обязателен:
  - всегда для `spec-compact` / `plan-slice`;
  - только для multi-step / review-heavy / operator-feedback cycles;
  - только когда был Plan mode или corrective reround?
- Какие поля являются обязательными, а какие optional?
- Как избежать дублирования требований, AC, slices и task list из Feature Dossier?
- Как лог должен связываться с verification/review/step-close artifacts?
- Какие метрики нужны для retrospective process analysis?
- Должен ли `dossier-verify` или `dossier-step-close` проверять наличие такого лога при определенных условиях?

## Возможный минимальный состав stage log

Если будет выбран отдельный logging contract, минимально полезные поля:

```yaml
feature_id: F-XXXX
backlog_item_key: CF-XXX
stage: spec-compact | plan-slice
cycle_id: short-human-readable-id
session_id: 019d...
start_ts: 2026-04-10T10:00:00+02:00
ready_for_review_ts: 2026-04-10T10:45:00+02:00
final_pass_ts: 2026-04-10T11:10:00+02:00
source_inputs:
  - docs/ssot/index.md
  - docs/architecture/system.md
  - docs/adr/ADR-...
repo_overlays:
  - AGENTS.md
decisions_total: 0
open_questions_resolved_total: 0
operator_clarifications_total: 0
review_rounds_total: 0
process_misses_total: 0
backlog_actualized: true
verification_artifact: .dossier/verification/...
review_artifact: .dossier/reviews/...
step_artifact: .dossier/steps/...
```

Narrative sections could be:

- `Scope`
- `Inputs actually used`
- `Decisions / reclassifications`
- `Operator feedback`
- `Review events`
- `Backlog actualization`
- `Process misses`
- `Retrospective notes`

## Acceptance criteria

- `dossier-engineer` has explicit guidance for whether specification/planning logs are required, optional, or conditionally required.
- The policy covers both `spec-compact` and `plan-slice`.
- The policy explains the difference between Feature Dossier truth and process telemetry log.
- The policy defines minimal metadata, narrative sections, and retrospective metrics for specification/planning work.
- The policy defines where these logs live and how they link to `.dossier/verification`, `.dossier/reviews`, `.dossier/steps`, and backlog actualization artifacts.
- The policy defines a low-overhead path for simple one-step changes.
- `SKILL.md` and relevant workflow-stage references are updated so agents know when to open/update the log.
- Docs-contract tests are added or updated if the skill has tests asserting reference links/checklists.

## Non-goals

- Do not turn the Feature Dossier into a verbose chronological process log.
- Do not require heavyweight logging for every trivial one-line doc correction unless the chosen policy explicitly justifies that overhead.
- Do not replace verification, independent review, backlog actualization, or `dossier-step-close`; logging is process telemetry, not a closure gate by itself unless the policy intentionally makes it one under specific conditions.
