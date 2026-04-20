# Предложение по улучшению 20260420-1: mandatory lifecycle logging и metric contract для непрерывного улучшения

Связанный план: [../refactoring-plan-15.ru.md](../refactoring-plan-15.ru.md)

## Контекст

Поводом стала серия downstream ретро-анализов по feature lifecycle от `feature-intake` до завершения `implementation`.

Общий вывод по нескольким сессиям одинаковый:

- process telemetry уже достаточно богата, чтобы восстанавливать важные инциденты и трения;
- при этом метрики цикла, review loops, close-out latency и process friction считаются неровно, потому что старт и конец разных стадий зафиксированы несимметрично;
- часть важных показателей можно извлечь только ручной интерпретацией retrospective report, а не из канонического machine-readable lifecycle trail;
- текущая optional logging policy и skip-path semantics создают разную плотность телеметрии между сессиями, из-за чего retrospective пригодна для разбора отдельных кейсов, но хуже подходит как основа для непрерывного process improvement.

Это уже не локальная проблема одной сессии. Если цель retrospective заключается не только в postmortem разборе, но и в сравнении циклов, нахождении bottleneck-ов и измеримом улучшении workflow, skill должен задавать более жёсткий и более однородный logging contract.

Главная цель этой методики должна быть сформулирована жёстко:

- retrospective должна помогать оператору принимать решения;
- решения должны приниматься не по intuition-only narrative, а по объективным сигналам;
- главный объект исследования — не “агент вообще”, а skill-методики, которые регламентируют специфицирование, планирование, реализацию, review и close-out.

Следовательно, logging и retrospective design должны отвечать на вопрос:

`какие свойства skill workflow регулярно создают process friction, rerounds, ложные closure claims, verification loops и operator interventions?`

Затронутые поверхности `dossier-engineer`:

- `SKILL.md`
- `references/feature-intake-logging.md`
- `references/workflow-stage-logging.md`
- step closure contract
- command wrappers / artifact writers, которые смогут автоматически append-ить telemetry
- retrospective-facing metric extraction policy

Связанные предложения:

- `dossier-engineer`: [improvement-proposal-20260420-2.md](improvement-proposal-20260420-2.md) — pre-close / DoD readiness gate должен появиться как отдельный lifecycle signal, иначе closure latency и reround причины останутся смешанными.
- `dossier-engineer`: [improvement-proposal-20260420-3.md](improvement-proposal-20260420-3.md) — heavy-runtime discipline требует явной telemetry-модели для `debug probes` vs `final smoke gate`.
- `backlog-engineer`: [improvement-proposal-20260420-1.md](../../../backlog-engineer/docs/issues/improvement-proposal-20260420-1.md) — backlog actualization должна стать отдельным наблюдаемым closure path и friction signal.

## Наблюдаемая проблема

Текущий logging contract уже содержит много правильных элементов:

- `feature-intake` имеет command-level log с `start_ts`;
- workflow stages имеют `start_ts`, `ready_for_review_ts`, `final_pass_ts`, review telemetry, process misses и freshness fields;
- closure semantics уже правильно опираются на `process_complete: true`, а не на commit SHA.

Но для устойчивого метрик-сравнимого lifecycle этого недостаточно.

### 1. Логирование остаётся условным

И `feature-intake`, и workflow-stage logging всё ещё допускают skip path.

Это означает:

- у части feature cycles будет полный process trail;
- у части feature cycles будет только dossier truth и разрозненные artifacts;
- retrospective quality будет зависеть не только от того, как шла работа, но и от того, активировался ли logging trigger.

Для continuous improvement это плохая база: неоднородность telemetry маскирует сам процесс.

### 2. Старт lifecycle и конец lifecycle зафиксированы несимметрично

Для intake уже есть `start_ts`.

Для stage logs уже есть:

- `start_ts`
- `ready_for_review_ts`
- `final_pass_ts`

Но нет одного канонического поля, которое бы отвечало на вопрос:

`когда этот stage truthfully became process-complete?`

Из-за этого cycle time и closure latency приходится считать по narrative markers:

- `step-close created`
- `implementation block completed`
- `final commit`
- конец интервального таймлайна

Такая реконструкция полезна для ретро, но слаба как основа для автоматизированных сравнительных метрик.

### 3. Часть желаемых метрик слишком “аналитические”, чтобы заставлять агента логировать их вручную

Особенно проблемны:

- широкий `incident_rate`;
- точный `audit_yield` как число уникальных реальных проблем после дедупликации findings;
- weighted `operator effort / manual intervention cost`;
- `telemetry_completeness`.

Если такие сущности сделать обязательным live logging burden, агент будет тратить внимание на классификацию, дедупликацию и оценку стоимости вместо специфицирования, планирования и реализации.

## Почему это проблема

Если оставить всё как есть, retrospective будет полезна для rich manual analysis, но слабее для управляемого process improvement:

- сложно честно сравнивать cycle time между feature cycles;
- сложно различать техническую сложность фичи и process friction;
- сложно увидеть, что улучшение было достигнуто именно за счёт методики, а не за счёт качества ручной реконструкции;
- сложно строить baseline и trend по rerounds, review loop time, verification friction и closure latency.

Иными словами: сейчас skill хорошо поддерживает retrospective explanation, но хуже поддерживает retrospective measurement.

## Принципы решения

Новый logging contract должен строиться на следующих принципах.

### P0. Lifecycle logging обязателен

Каждый feature lifecycle от `feature-intake` до truthful closure `implementation` должен иметь process telemetry artifacts независимо от того, были ли rerounds, process misses или retrospective requested.

### P1. Метрики должны выводиться из канонических событий, а не из prose

В логах и artifacts должны появиться однозначные lifecycle timestamps и event arrays, из которых метрики можно считать без narrative reconstruction.

### P2. Live logging не должен заставлять агента делать дорогостоящую аналитику

Обязательными должны быть только:

- timestamp markers;
- bounded event records;
- счетчики и классификации с жёстким словарём.

Дедупликация findings, weighted human-cost оценка и полнота auto-discovery должны оставаться post-hoc analysis.

### P3. Commit не является lifecycle gate

Commit SHA остаётся trace metadata.

Канонический конец engineering cycle должен опираться на `process_complete: true` и/или `step-close`, а не на git event.

### P4. Logging должен стать thinner, а не prose-heavier

Если убрать optionality, нельзя одновременно наращивать narrative burden.

Mandatory lifecycle logging должен быть:

- metadata-first;
- event-based;
- с короткими narrative sections;
- по возможности автоматически пополняемым через command wrappers, а не только руками агента.

### P5. Дизайн должен исходить из ideal target model, а не из легаси-ограничений

В этой redesign-работе не нужно сохранять совместимость со старой logging method как самоцель.

Если существующие skip-path, field semantics или artifact boundaries мешают получить более чистый lifecycle contract, от них лучше отказаться, чем таскать их дальше как ballast.

### P6. CLI не выполняет semantic analysis и не должен притворяться NLP-системой

Utility / CLI может:

- создавать и обновлять артефакты;
- читать structured fields;
- валидировать наличие required fields;
- считать durations, counters и другие deterministic aggregates;
- строить machine-readable snapshots на основе уже имеющихся структурированных данных.

Utility / CLI не может считаться владельцем:

- анализа prose narrative;
- вывода root cause из свободного текста;
- дедупликации semantically equivalent findings без явной структуры;
- attribution проблемы к skill или методике без agent judgment.

Это разделение должно быть explicit в proposal и потом в самой методике.

### P7. Результат retrospective — не просто отчет, а operator-facing decision signal layer

Metrics сами по себе не являются финальной целью.

Финальная цель:

- дать оператору объективный сигнал, что некоторый skill workflow деградирует;
- показать, на каком этапе это проявляется;
- дать достаточно структурированных оснований, чтобы менять skill contract, а не угадывать причину по одному кейсу.

## Целевая operating model

Нужна трёхслойная модель, а не один смешанный markdown log.

### Layer 1. Structured lifecycle telemetry

Во время работы сохраняются только:

- timestamps;
- bounded event records;
- closure states;
- deterministic counters и links.

Этот слой должен быть machine-readable и пригодным для автоматического расчёта objective metrics.

### Layer 2. Mechanical utility support

CLI / wrappers должны:

- открывать lifecycle logs;
- append-ить deterministic event records;
- валидировать required fields;
- вычислять derived numeric metrics;
- собирать lifecycle snapshot artifacts.

CLI / wrappers не должны:

- анализировать narrative prose;
- самостоятельно классифицировать root cause;
- выводить skill-level blame или методические выводы из неструктурированного текста.

### Layer 3. Agent-authored retrospective analysis

Агент должен:

- читать structured telemetry и связанные артефакты;
- интерпретировать их в терминах process problems;
- связывать сигналы с skill workflows и методическими gaps;
- формулировать operator-facing recommendations.

Именно на этом слое допустимы:

- incident interpretation;
- audit-yield analysis;
- skill/method attribution;
- выводы о том, что пора менять в методике.

## P1. Сделать logging обязательным для полного feature lifecycle

Нужно убрать skip-path / optionality из active logging policy.

Требование:

- `feature-intake` log обязателен всегда;
- `spec-compact` log обязателен всегда;
- `plan-slice` log обязателен всегда;
- `implementation` log обязателен всегда.

Следствие:

- trivial or smooth cycles не пропускают логирование, а создают thin log с минимальным metadata и кратким close-out;
- отсутствие relevant events больше не выражается отсутствием лога, а выражается пустыми или `none`-секциями в уже существующем lifecycle record.

Ожидаемый эффект:

- feature cycles станут сравнимыми между собой;
- retrospective сможет считать baseline и trend metrics не только по “богатым” сессиям.

Риск:

- agent burden вырастет, если mandatory logging останется prose-heavy.

Смягчение:

- переводить обязательное логирование в metadata + bounded events;
- narrative секции должны быть краткими и не дублировать dossier truth.

## P2. Ввести канонический lifecycle identity и обязательные timestamps

Нужно, чтобы все lifecycle artifacts feature были связаны одним `feature_cycle_id`.

Минимальные additions:

- в `feature-intake` log:
  - `feature_cycle_id`
  - `intake_process_complete_ts`
- в workflow-stage logs:
  - `feature_cycle_id`
  - `local_gates_green_ts`
  - `process_complete_ts`
  - `step_close_ts`

Пояснение по семантике:

- `start_ts` уже существует и фиксирует старт стадии;
- `local_gates_green_ts` — момент, когда локальные gates для текущей closure target стали зелёными;
- `process_complete_ts` — момент, когда stage truthfully стал complete в смысле skill contract;
- `step_close_ts` — момент записи step-close artifact, если он применим к стадии;
- `final_commit_ts` может существовать дополнительно, но остаётся trace metadata и не является primary end marker.

Для lifecycle metrics главным должно быть не “первая operator-команда вообще”, а канонический engineering start:

- для полного feature lifecycle: `feature-intake.start_ts`;
- для stage-local metrics: `stage.start_ts`.

Это сознательный выбор:

- “первая operator-команда по feature” слишком неоднозначна и runtime-dependent;
- `feature-intake.start_ts` уже лежит внутри portable skill contract;
- метрика “от интейка до завершения имплементации” лучше соответствует управляемому lifecycle.

## P3. Ввести lifecycle events, пригодные для вычисления friction metrics

Вместо требования к агенту вручную писать агрегированные выводы о friction, нужно записывать bounded event classes.

Минимальный event surface:

- `review_events[]`
- `verification_events[]`
- `backlog_events[]`
- `operator_interventions[]`
- `process_miss_events[]`

Опционально для v1, но только при bounded taxonomy:

- `hard_incident_events[]`

### `verification_events[]`

Нужно покрыть как минимум:

- `gate_class`: `dossier_verify`, `coverage_audit`, `smoke`, `lint`, `typecheck`, `test`, `other`
- `started_ts`
- `finished_ts`
- `result`: `pass | fail`
- `failure_class`: `contract`, `runtime`, `resource_pressure`, `operator_usage`, `unknown`, `not_applicable`
- `rerun_of`: nullable reference

Эти записи должны по возможности append-иться wrapper-ом соответствующей команды, а не описываться агентом вручную.

### `backlog_events[]`

Нужно покрыть как минимум:

- `event_class`: `patch_prepare`, `patch_apply`, `refresh`, `integrity_check`, `actualization_complete`
- `started_ts`
- `finished_ts`
- `result`: `pass | fail`
- `failure_class`: `schema`, `sequence`, `artifact_missing`, `state_conflict`, `usage_error`, `unknown`, `not_applicable`

Эти записи должны рождаться из backlog-side command flow, а не реконструироваться post-hoc из prose.

### `operator_interventions[]`

Нужно покрыть как минимум:

- `intervention_class`: `policy_correction`, `scope_correction`, `authorization`, `missing_context`, `runtime_recovery`, `pause_or_redirect`, `other`
- `ts`
- `resolved_in_stage`: true | false
- `requires_rerun`: true | false

Это минимальный proxy operator effort. Он не оценивает “стоимость” вмешательства, но даёт объективный факт вмешательства и его тип.

### `hard_incident_events[]`

Если вводить incident telemetry в v1, её нужно жёстко сузить.

Допустимые incident classes:

- `host_reset_or_hang`
- `wrong_review_model_invalidated`
- `artifact_integrity_failure`
- `stage_log_missing_or_stale_blocks_closure`
- `runtime_verification_instability`

Если событие не попадает в эту bounded taxonomy, оно не должно обязательно логироваться как incident в live workflow. Его можно описать в narrative и анализировать позже в retrospective agent layer.

## P4. Переопределить список целевых метрик как metric contract, а не как retrospective convenience

Ниже не список “что уже можно вытащить”, а список “что методика обязана поддерживать”.

### Core metrics v1: auto-computable from structured telemetry

| Метрика | Как считается | Источник | Collection mode |
| --- | --- | --- | --- |
| `feature_cycle_time` | `implementation.process_complete_ts - feature-intake.start_ts` | intake + implementation logs | derived automatically |
| `phase_cycle_time` | `stage.process_complete_ts - stage.start_ts` | stage log | derived automatically |
| `review_loop_time` | `final_pass_ts - first_review_agent_started_ts` | stage log / `review_events[]` | deterministic utility calculation |
| `rerounds_per_feature` | число corrective loops после первого review-ready | `review_events[]` + stage state | derived automatically |
| `first_pass_close_rate` | доля features/stages с `rerounds_per_feature = 0` | lifecycle metrics | derived automatically |
| `closure_latency` | `step_close_ts - local_gates_green_ts` | stage log | derived automatically |
| `verification_friction` | число failed verification attempts по gate class | `verification_events[]` | derived automatically |
| `backlog_actualization_friction` | число failed/rerun backlog attempts до clean actualization | `backlog_events[]` | derived automatically |
| `process_miss_count_by_severity` | число process misses по severity | `process_miss_events[]` | derived automatically |
| `operator_interventions_count` | число operator interventions по class | `operator_interventions[]` | deterministic utility calculation |

Эти метрики должны считаться utility/CLI без анализа prose.

### Retrospective-layer signals: owner must be explicit

| Метрика | Почему нужна | Источник | Владелец расчёта / интерпретации |
| --- | --- | --- | --- |
| `audit_yield` | показывает, насколько полезны внешние audits | review artifacts + `review_events[]` | retrospective agent; требует semantic grouping и дедупликации findings |
| `telemetry_completeness` | показывает качество самой observability/retro системы | retrospective scan outputs | retrospective utility может считать детерминированно, потому что это artifact-discovery statistic |
| `hard_incident_rate` | показывает стабильность процесса и runtime | `hard_incident_events[]` + retrospective validation | retrospective agent после подтверждения границ incident taxonomy |

### Метрики, которые не стоит делать обязательным live burden в v1

| Метрика | Почему не подходит для mandatory live logging |
| --- | --- |
| широкий `incident_rate` | требует интерпретации “что считать инцидентом” и сколько severity-смыслов различать |
| weighted `operator effort / manual intervention cost` | требует либо длительности, либо стоимости вмешательства, либо ручного scoring, что отвлекает агента |
| точный cross-review `audit_yield` | требует дедупликации findings между `spec`, `code`, `security`, `independent` |

Для них правильнее:

- либо ввести упрощённый bounded proxy;
- либо считать их только retrospective layer-ом, где utility даёт structured summary, а agent делает semantic interpretation.

## Operator-facing signal model

Retrospective package должен помогать оператору не только “видеть числа”, но и принимать решение о change priority.

Минимальный target output:

1. objective metric snapshot по feature/stage;
2. triggered signals, которые можно объяснить без спорной интерпретации;
3. agent-authored hypotheses, какие skill surfaces вероятнее всего породили эти сигналы.

Примеры objective signals:

- repeated rerounds in one stage;
- growing closure latency after local gates are already green;
- repeated verification failures в одном gate class;
- repeated backlog actualization failures;
- repeated operator `policy_correction` interventions;
- high first-pass failure rate for one stage type.

Такие сигналы особенно важны, потому что именно они направляют оператора к вопросу:

`нужно ли менять методику skill-а, а не только чинить конкретную feature?`

## P5. Добавить канонический lifecycle metrics artifact

Чтобы retrospective и future tooling не собирали lifecycle заново из narrative logs, нужен один компактный machine-readable artifact.

Предлагаемый путь:

```text
.dossier/metrics/<feature-id>/lifecycle.json
```

Минимальное содержимое:

```json
{
  "feature_id": "F-XXXX",
  "backlog_item_key": "CF-XXX",
  "feature_cycle_id": "fc01",
  "intake_start_ts": "2026-04-10T10:00:00+02:00",
  "intake_process_complete_ts": "2026-04-10T10:20:00+02:00",
  "spec_process_complete_ts": "2026-04-10T11:05:00+02:00",
  "plan_process_complete_ts": "2026-04-10T11:30:00+02:00",
  "implementation_start_ts": "2026-04-10T12:00:00+02:00",
  "implementation_process_complete_ts": "2026-04-10T14:10:00+02:00",
  "review_loop_time_minutes": 34,
  "rerounds_per_feature": 2,
  "verification_failures_total": 3,
  "backlog_actualization_failures_total": 1,
  "operator_interventions_total": 2
}
```

Правило:

- этот artifact не пишется агентом вручную как prose;
- его должен собирать или обновлять utility/command layer при stage closure;
- lifecycle artifact должен валидироваться на непротиворечивость timestamp chain.

## P6. Сместить тяжёлый burden с агента на command wrappers и чётко ограничить роль CLI

Если metric contract будет существовать только как prose promise, агент начнет вручную вести множество полей и быстро потеряет дисциплину.

Поэтому нужно прямо заложить в методику:

- `review-artifact` и/или audit wrapper должны append-ить `review_events[]`;
- `dossier-verify` и related wrappers должны append-ить `verification_events[]`;
- backlog actualization wrappers должны append-ить `backlog_events[]`;
- `dossier-step-close` должен фиксировать `process_complete_ts` и `step_close_ts`;
- retrospective tooling может считать deterministic summaries и готовить scaffolds, но semantic retrospective conclusions остаются за агентом.

CLI role must stay mechanical:

- append deterministic records;
- validate schema and closure preconditions;
- compute numeric aggregates from structured fields;
- build lifecycle snapshot artifacts.

CLI role must explicitly exclude:

- prose interpretation;
- implicit incident detection from free text;
- skill-gap attribution;
- “умное” объединение semantically similar findings без structured finding ids.

Ожидаемый эффект:

- обязательное логирование не превратится в постоянную ручную микробухгалтерию;
- metric contract станет выполняемым в реальной работе, а не только на бумаге.

## P7. Упростить discoverability session trace для retrospective

Отдельная проблема, выявленная на практике: даже когда retrospective запрашивается по конкретной feature или по только что завершённой стадии, агенту всё ещё бывает трудно быстро найти канонический session trace.

Текущая ситуация:

- stage logs уже могут содержать `session_id`;
- retrospective skill уже умеет работать от `session_id`;
- но агенту всё ещё приходится знать runtime-specific session-store layout и вручную искать trace path перед первым `scan`.

Это создаёт лишнюю операционную сложность именно в том месте, где retrospective должна стартовать быстро и воспроизводимо.

### Проблема

Сейчас discoverability chain выглядит так:

1. найти feature/stage artifacts;
2. извлечь или угадать `session_id`;
3. найти runtime session store;
4. найти canonical rollout JSONL;
5. только после этого запустить retrospective scan.

Даже если шаги 1-2 уже покрыты dossier logging, шаги 3-4 остаются runtime-specific и хрупкими.

### Предлагаемое изменение

Нужны два связанных улучшения.

#### A. Усилить repo-local session anchors

Для mandatory lifecycle logging в runtime, где reliable `session_id` доступен, его отсутствие не должно считаться нормальным вариантом.

Нужно добавить repo-local discoverability surface, например:

```text
.dossier/retro/session-index.jsonl
```

или эквивалентный machine-readable artifact.

Минимальная запись:

```json
{
  "feature_cycle_id": "fc01",
  "feature_id": "F-XXXX",
  "backlog_item_key": "CF-XXX",
  "stage": "implementation",
  "session_id": "019d...",
  "trace_runtime": "codex",
  "trace_locator_kind": "session_store_by_id",
  "stage_log_path": ".dossier/logs/F-XXXX/implementation-c01.md",
  "start_ts": "2026-04-10T10:00:00+02:00",
  "process_complete_ts": "2026-04-10T12:10:00+02:00"
}
```

Важно:

- в durable repo artifacts не надо писать абсолютный путь к session-store trace file;
- нужно хранить только stable ids, runtime kind и repo-local cross-links;
- этого должно быть достаточно, чтобы retrospective tooling и агент быстро перешли от feature/stage к `session_id`.

#### B. Перенести trace lookup в retrospective tooling

Retrospective workflow не должен требовать от агента вручную искать trace file path, если уже известен `session_id`.

Нужный UX:

- `scan --session-id <id>`
- `scan --current-session`
- optional future mode: `scan --feature-id F-XXXX`, если repo-local session index даёт однозначное соответствие

Внутри runtime-adapter logic tooling должно:

- находить canonical trace по `session_id`;
- fail-close-иться, если найдено несколько кандидатов;
- показывать оператору ambiguity вместо silent guessing.

### Ожидаемый эффект

- retrospective по свежей feature или stage можно запускать без ручного session-store archaeology;
- feature/stage artifacts сами становятся reliable entrypoint к нужной сессии;
- agent burden снижается не только при logging, но и при последующем анализе процесса.

### Граница ответственности

Это cross-skill improvement:

- `dossier-engineer` должен давать repo-local session anchors;
- `retrospective-phase-analysis` должен уметь resolve-ить trace по `session_id` без ручного path lookup.

То есть проблема не решается только одним logging contract или только одним retrospective CLI.

## Что не должно меняться

- Не делать commit SHA lifecycle gate.
- Не требовать от агента live-дедупликации findings между review classes.
- Не требовать от агента оценивать “стоимость” operator intervention в минутах или баллах.
- Не превращать stage logs во второй Feature Dossier.
- Не размывать различие между live-captured telemetry и retrospective-derived analytics.
- Не заставлять агента manually пересчитывать lifecycle aggregates в narrative close-out.
- Не приписывать CLI функции semantic analysis или NLP.
- Не считать legacy field compatibility обязательным ограничением redesign phase.

## Acceptance criteria

- `feature-intake-logging.md` больше не содержит optional skip path для ordinary lifecycle work.
- `workflow-stage-logging.md` больше не содержит optional skip path для `spec-compact`, `plan-slice`, `implementation`.
- Active logging contract требует lifecycle logs на всех стадиях feature delivery.
- В intake logging добавлены `feature_cycle_id` и `intake_process_complete_ts`.
- В workflow-stage logging добавлены `feature_cycle_id`, `local_gates_green_ts`, `process_complete_ts`, `step_close_ts`.
- В runtime с reliable session signal omission `session_id` больше не считается нормальным для mandatory lifecycle logs.
- Metric contract явно разделяет:
  - core v1 live-captured metrics;
  - retrospective-derived metrics;
  - deferred / excluded-from-live-burden metrics.
- Proposal явно разделяет роли `agent` и `CLI` и не возлагает на utility prose/NLP analysis.
- Operator-facing purpose сформулирован как primary design target, а не как побочный эффект telemetry collection.
- Guidance явно говорит, что primary feature cycle end = `implementation.process_complete_ts`, а не commit.
- Guidance явно говорит, что широкие `incident_rate`, exact `audit_yield` и weighted `operator effort cost` не должны быть обязательным live logging burden в v1.
- Есть канонический lifecycle metrics artifact или эквивалентный machine-readable surface, который можно строить автоматически при closure.
- Есть repo-local session discoverability surface, который связывает `feature_cycle_id` / `feature_id` / `stage` с `session_id` без хранения абсолютного trace path.
- Retrospective tooling может стартовать от `session_id` или current session без ручного поиска rollout JSONL path.
- Docs-contract tests или equivalent assertions защищают обязательность lifecycle logging и наличие новых canonical fields.

## Preferred implementation order

1. Убрать optional skip-path из `feature-intake-logging.md` и `workflow-stage-logging.md`.
2. Добавить lifecycle identity и canonical timestamp fields.
3. Добавить bounded event schemas для verification / backlog / operator intervention telemetry.
4. Зафиксировать metric contract с разделением на live-captured и retrospective-derived metrics.
5. Добавить или спроектировать lifecycle metrics artifact.
6. Добавить repo-local session discoverability surface и runtime-aware trace resolution flow.
7. Перенести append логики в command wrappers, чтобы не делать burden ручным.
8. Зафиксировать explicit role split между structured telemetry, mechanical CLI и agent-authored retrospective analysis.
9. Провести narrow review по двум вопросам:
   - не перегружает ли новый contract агента в ordinary feature work;
   - достаточно ли bounded taxonomy для стабильного вычисления core metrics и operator-facing signals.
