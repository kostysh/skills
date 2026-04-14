# Предложение по улучшению 20260414-1: телеметрия review orchestration и session-level ops

## Контекст

Ретроанализ сессии `019d7490-46d0-7811-b43f-056bb617a7ab` показал не столько слабость stage logs как таковых, сколько две устойчивые слепые зоны:

- orchestration внешних audit-циклов;
- cross-skill migration / repair episodes, которые не живут естественно внутри одного dossier stage.

Основания:

- retrospective report по сессии `019d7490-46d0-7811-b43f-056bb617a7ab`
- skill audit по сессии `019d7490-46d0-7811-b43f-056bb617a7ab`
- logging review по сессии `019d7490-46d0-7811-b43f-056bb617a7ab`

Текущие релевантные поверхности skill-а:

- [SKILL.md](../../SKILL.md)
- [references/implementation-audit-policy.md](../../references/implementation-audit-policy.md)
- [references/workflow-stage-logging.md](../../references/workflow-stage-logging.md)

## Почему это заслуживает изменения

Даже после недавнего refactor остаются два materially important gap:

1. Skill требует внешние audits и stage logs, но все еще не пишет достаточно machine-readable данных об audit orchestration, чтобы объяснять retry storm, transport instability и неудачный выбор модели.
2. Skill хорошо логирует stage-local работу, но у него все еще нет durable места для migration / repair / cross-skill episodes, которые происходят вне одной чистой dossier-stage границы.

Это не косметические проблемы.

- Они напрямую снижают качество retrospective.
- Они скрывают, почему было потеряно время.
- Они мешают отделить проблему reviewer-skill от проблемы runtime/API/model instability.
- Они оставляют раннюю или внестадийную process work реконструируемой только по raw session trace.

## Набор предложений

### P1. Добавить machine-readable телеметрию review orchestration в logging contract

#### Наблюдаемая проблема

В сессии был реальный audit retry storm:

- 53 вызова `spawn_agent` за сессию;
- серия повторных audit-attempt в коротком окне;
- явное недовольство оператора использованием `mini` модели и API instability.

Текущее dossier logging уже фиксирует:

- review rounds;
- verdicts;
- findings totals;
- latency between review milestones.

Но оно все еще не хранит machine-readable orchestration fields, нужные для объяснения того, почему review orchestration стала дорогой.

Критически не хватает таких полей:

- `review_requested_ts`
- `first_review_agent_started_ts`
- `review_models`
- `review_retry_count`
- `review_wait_minutes`
- `transport_failures_total`
- `rerun_reasons`
- `operator_review_interventions_total`

#### Предлагаемое изменение

Расширить активный logging contract так, чтобы обязательные stage logs умели фиксировать review orchestration как данные, а не только как prose.

Точка приложения:

- [references/workflow-stage-logging.md](../../references/workflow-stage-logging.md)
- [references/implementation-audit-policy.md](../../references/implementation-audit-policy.md)
- при необходимости для discoverability: [SKILL.md](../../SKILL.md)

Что именно изменить:

- добавить перечисленные выше поля в mandatory logging surface для тех stage, где внешние audits действительно запускаются;
- явно потребовать в implementation audit policy обновлять stage log после каждого reround с фиксацией причины rerun;
- различать rerun из-за реальных findings и rerun из-за transport/runtime instability.

Ожидаемый эффект:

- retry storm станет диагностируемым без replay всей session trace;
- retrospective сможет отделять reviewer-quality issues от transport/runtime issues;
- оператор и агент получат количественное объяснение audit delays, а не только narrative.

Важная граница:

- не превращать stage logs в review transcript;
- не дублировать `review-artifact`;
- не тащить в log полный reviewer prose.

### P2. Ввести session-level ops log для migration / repair work вне одной dossier stage

#### Наблюдаемая проблема

Ретроспектива показала, что ранние backlog workflow migration и repair loops реконструируются заметно хуже, чем поздние dossier stages.

Это ожидаемо при текущей модели:

- [workflow-stage-logging.md](../../references/workflow-stage-logging.md) применяется только к `spec-compact`, `plan-slice` и `implementation`;
- migration / repair / workflow-hardening work часто пересекает `backlog-engineer` и `dossier-engineer`;
- такая работа может происходить до появления чистой stage boundary или в момент, когда процесс временно выходит из stage-local flow.

В результате важные effort clusters остаются видимыми только в raw trace и commit history.

#### Предлагаемое изменение

Добавить отдельный session-level ops-log contract для cross-skill episodes, которые не принадлежат естественным образом одной dossier stage.

Этот artifact должен использоваться для событий вроде:

- backlog workflow migration;
- repair loop после utility/runtime defect;
- cross-skill handoff recovery;
- audit-infrastructure instability episode;
- process-model correction вне одной чистой stage.

Минимальный состав metadata:

- `session_id`
- `start_ts`
- `end_ts`
- `episode_kind`
- `skills_involved`
- `artifacts_touched`
- `operator_interventions_total`
- `linked_stage_logs`
- `linked_review_artifacts`
- `linked_verification_artifacts`
- `linked_backlog_artifacts`
- `outcome`

Точка приложения:

- новый reference под `references/`
- короткая routing note в [SKILL.md](../../SKILL.md)
- правило открытия и обновления в [references/workflow.md](../../references/workflow.md)

Ожидаемый эффект:

- cross-skill migration и repair episodes станут видимыми без перегруза stage logs;
- retrospective получит durable artifact именно для того класса работ, который хуже всего реконструировался в этой сессии;
- снизится зависимость от raw trace там, где работа была operational, а не stage-local.

Важная граница:

- не смешивать это с `workflow-stage-logging.md`;
- не делать из этого второй stage log;
- не открывать такой log для каждой мелкой команды.

## Что не должно меняться

- Не ослаблять текущий fail-closed contract независимого review.
- Не заменять этим `review-artifact`, `dossier-verify` или `dossier-step-close`.
- Не расширять stage logging на все команды подряд.
- Не превращать commit metadata в validity или freshness gate.

## Рекомендация

Это предложение стоит реализовывать.

Почему:

- наблюдаемое трение было реальным и дорогим;
- текущему skill все еще не хватает точной telemetry, чтобы объяснять такие случаи чисто и воспроизводимо;
- изменения локальны для dossier process telemetry и не требуют пересмотра dossier/backlog role split.
