# План рефакторинга 8: логирование процесса `feature-intake`

Дата: `2026-04-14`
Компонент: `dossier-engineer`
Область: `feature-intake`, process telemetry, active references, docs-contract tests
Источник запроса: прямой запрос на закрытие пробела в intake logging

## Контекст и проблема

Сейчас в скиле есть явный contract логирования только для трех workflow stages:

- `spec-compact`
- `plan-slice`
- `implementation`

Этот contract живет в [references/workflow-stage-logging.md](../references/workflow-stage-logging.md) и уже хорошо встроен в активную нормативную поверхность.

Но `feature-intake` остается без собственного логирующего контракта:

- в [SKILL.md](../SKILL.md) это отдельная `CLI command`, а не workflow stage;
- в [references/workflow.md](../references/workflow.md) intake описан как реальный mutating step downstream-процесса;
- в `Step closure contract` intake уже входит в общий набор mutating delivery steps;
- при этом агент не получает буквального ответа, когда intake лог обязателен, где его хранить, что именно туда писать и как этот log соотносится с backlog actualization, `index-refresh`, `partial_success` и intake-discovered blockers.

Это процессный пробел.

Без intake logging:

- ранний handoff from `backlog-engineer` to dossier не имеет устойчивой process telemetry;
- трудно восстановить, как именно intake превратил selected backlog work в конкретный dossier;
- intake-discovered blockers, dependencies и missing context могут всплывать в чате, но не получать нормального durable следа;
- retrospective analysis видит dossier уже после создания, но хуже понимает, как агент пришел к этой стартовой truth.

Цель рефакторинга — закрыть intake-specific logging gap, не ломая уже зафиксированное разделение между `workflow stage` и `CLI command`.

## Нормативные источники

- [../SKILL.md](../SKILL.md)
- [../references/workflow.md](../references/workflow.md)
- [../references/workflow-stage-logging.md](../references/workflow-stage-logging.md)
- [../references/DOSSIER_TEMPLATE.md](../references/DOSSIER_TEMPLATE.md)
- [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)

## Базовые решения

1. Не превращать `feature-intake` в новый `Workflow stage`.
2. Не расширять [workflow-stage-logging.md](../references/workflow-stage-logging.md) неявно на `feature-intake`.
3. Создать отдельный active reference для intake logging как command-level process contract.
4. Сохранить уже существующее разделение:
   - workflow-stage logging для `spec-compact`, `plan-slice`, `implementation`;
   - command-level intake logging для `feature-intake`.
5. Не добавлять новую CLI command.
6. Не заставлять CLI интерпретировать intake log prose.
7. Не делать intake log новым SSoT; SSoT остается Feature Dossier.
8. Required intake log должен быть буквальным closure gate, а не неявным ожиданием.

Мотивация:

- это keeps UX честным: `feature-intake` — команда, а не stage;
- агент получает явную ссылку на нужную инструкцию вместо догадки, что intake “наверное покрыт” stage logging policy;
- мы не размываем уже хорошую формулировку `workflow-stage-logging.md`, где прямо сказано, что она applies only to three workflow stages.

## Не цели

- Не вводить новый durable artifact family вне `.dossier/logs/`.
- Не дублировать весь dossier body в intake log.
- Не заменять intake log-ом backlog truth, index state, review artifacts или step-close artifacts.
- Не добавлять intake-specific runtime parsing в CLI.
- Не делать лог обязательным абсолютно для каждого trivial intake без trigger-а.

## Целевой end state

После рефакторинга агент должен получать буквальный answer на четыре вопроса:

1. Нужен ли для текущего `feature-intake` отдельный intake log?
2. Если нужен, где он лежит и как называется?
3. Какие intake-specific факты обязательно зафиксировать?
4. Когда intake нельзя считать process-complete без обновления этого лога?

## Package 1. Intake logging reference как отдельный active contract

### Goal

Добавить отдельную intake-specific policy, не смешивая ее с workflow-stage logging.

### Scope

- создать `skills/dossier-engineer/references/feature-intake-logging.md`
- при необходимости дать явную cross-link из `workflow-stage-logging.md`

### Что меняем

Создаем новый active reference, который:

- явно applies only to `CLI command: feature-intake`;
- прямо говорит, что это command-level process telemetry;
- не притворяется общей политикой логирования для всех CLI commands.

### Путь хранения

Зафиксировать отдельный intake log path:

```text
.dossier/logs/<feature>/feature-intake-<cycle>.md
```

Правила:

- `<feature>` должен совпадать с `F-XXXX` или стабильным feature slug текущего dossier;
- `<cycle>` должен быть коротким и human-readable;
- один intake log = один closure target для конкретного intake cycle;
- тот же cycle сохраняется, если не изменился literal closure target:
  - тот же selected backlog item;
  - тот же будущий dossier;
  - та же intake attempt, даже если были operator rerounds, `index-refresh` reruns или backlog actualization follow-ups;
- новый cycle открывается только когда closure target изменился буквально:
  - intake был остановлен и заменен intake для другого backlog item;
  - агент отказался от уже созданного dossier path и создает другой dossier как новый canonical target;
  - предыдущий intake cycle закрыт или abandoned, и начата новая независимая intake attempt.

### Когда intake log обязателен

Trigger-ы должны быть intake-specific и буквальными.

Минимальный набор trigger-ов:

- intake выявил новые blockers, dependencies, missing context или lifecycle-changing facts;
- после intake требуется backlog actualization через `backlog-engineer`;
- оператор меняет направление intake после первого draft;
- intake идет в несколько проходов, по explicit plan, или с повторными коррекциями dossier skeleton;
- `index-refresh` после intake дал `partial_success`, rerun или другой process failure;
- произошел process miss;
- retrospective telemetry запрошена или разумно ожидается.

### Когда intake log можно пропустить

Сохранить low-overhead path, но явно уже, чем для trivial wording changes.

Skip допускается только когда одновременно верно все:

- intake одношаговый;
- dossier created cleanly in one pass;
- backlog handoff block не требовал пересборки после operator clarification;
- новых blockers / dependencies / missing context не выявлено;
- backlog actualization не потребовалась;
- `index-refresh` прошел cleanly без `partial_success` и rerun;
- process miss не было;
- retrospective telemetry не запрошена и разумно не ожидается.

Если лог пропущен, агент обязан прямо указать это в финальном summary.

### Closure blocking rule

План должен явно зафиксировать:

- если intake logging trigger fired, `feature-intake` не может считаться `process_complete: true`, пока required intake log не открыт или не обновлен до финального состояния этого intake cycle;
- missing required intake log блокирует truthful close-out так же, как missing backlog actualization или unresolved `partial_success`;
- stale intake log приравнивается к missing process telemetry, если после последнего log update intake truth materially changed.

### Время открытия

Нужно зафиксировать:

- если trigger известен заранее, intake log открывается до первой содержательной мутации dossier;
- если trigger появился по ходу intake, лог открывается немедленно;
- позднее открытие требует `late_start: true` и process miss note;
- intake log поддерживается актуальным до завершения `feature-intake`, `index-refresh`, backlog actualization outcome и итогового close-out ответа.

### Metadata block

Intake log должен иметь machine-friendly metadata, но intake-specific.

Минимальный набор полей:

```yaml
feature_id: F-XXXX
backlog_item_key: CF-XXX
command: feature-intake
cycle_id: short-human-readable-id
session_id: 019d... # omit if runtime does not expose a reliable value
start_ts: 2026-04-14T10:00:00+02:00
index_refresh_ts: 2026-04-14T10:05:00+02:00
source_inputs:
  - docs/ssot/index.md
repo_overlays:
  - AGENTS.md
log_required: true
log_required_reason:
  - backlog_actualization
  - intake_reround
index_refresh_status: success | partial_success | failed
backlog_actualized: true
handoff_block_written: true
dossier_path: docs/features/F-XXXX-foo.md
```

### Narrative sections

Нужны короткие intake-specific секции:

- `Scope`
- `Inputs actually used`
- `Backlog handoff decisions`
- `Intake findings`
- `Operator feedback`
- `Index refresh`
- `Backlog actualization`
- `Process misses`
- `Close-out`

Здесь важно явно зафиксировать, что intake log:

- не дублирует dossier body;
- не копирует полный backlog packet;
- фиксирует process path от selected backlog work до созданного dossier и итогового intake verdict.

### Intake-specific факты, которые нельзя потерять

Reference должен буквально требовать фиксировать:

- какой backlog item был взят в intake;
- какой `F-XXXX` был назначен;
- какой dossier path создан;
- был ли handoff block записан сразу или корректировался;
- какие blockers / dependencies / missing context выявились во время intake;
- потребовалась ли backlog actualization;
- как завершился `index-refresh`;
- был ли intake process-complete или остался partially complete.

## Package 2. Встроить intake logging в active skill surface

### Goal

Сделать так, чтобы агент попадал в intake logging policy без догадки.

### Scope

- [../SKILL.md](../SKILL.md)
- [../references/workflow.md](../references/workflow.md)
- [../references/workflow-stage-logging.md](../references/workflow-stage-logging.md)

### Что меняем

#### `SKILL.md`

Внести intake logging в три места:

1. `## Core artifacts`
   - добавить `.dossier/logs/<feature>/feature-intake-<cycle>.md` как отдельный canonical process artifact;
   - не смешивать его с `.dossier/logs/<feature>/<stage>-<cycle>.md`, чтобы boundary stage vs command оставался буквальным.

2. `#### CLI command: feature-intake`
   - добавить ссылку на новый reference;
   - добавить trigger summary;
   - добавить one-line rule про timing: если trigger fired, открыть intake log до первой содержательной мутации dossier;
   - расширить `Command correctness checklist` пунктами про log open/update/skip reasoning.

3. `## Step closure contract`
   - явно оговорить, что для `feature-intake` process telemetry идет через intake log, а не через workflow-stage log;
   - явно зафиксировать, что required intake log — это closure gate для truthful `process_complete`.

#### `references/workflow.md`

В секции `## CLI command: feature-intake`:

- добавить ссылку на `feature-intake-logging.md`;
- явно указать, что intake log нужен именно для process telemetry intake command;
- явно описать связь с `index-refresh`, `partial_success` и backlog actualization.
- добавить буквальное cycle rule:
  - operator rerounds, `index-refresh` reruns и backlog actualization follow-ups продолжают тот же cycle;
  - новый cycle открывается только при смене literal closure target.
- добавить буквальное overlap rule with session ops log:
  - ordinary intake stays in intake log only;
  - если normal intake mid-command превращается в cross-skill migration / repair / backlog-recovery episode, intake log остается primary record of the intake command, а session-level ops log открывается дополнительно только для cross-skill episode boundary;
  - в таком случае оба артефакта cross-link друг на друга вместо взаимной подмены.

#### `references/workflow-stage-logging.md`

Не расширять область применения.

Нужно только добавить одно буквальное уточнение:

- этот reference не applies to `feature-intake`;
- для `feature-intake` использовать `feature-intake-logging.md`.

Это снизит риск того, что агент снова попытается натянуть stage logging на intake по аналогии.

## Package 3. Защитить новую нормативную поверхность тестами

### Goal

Не оставить intake logging как prose-only обещание.

### Scope

- `skills/dossier-engineer/test/docs-contract.test.ts`
- при необходимости `skills/dossier-engineer/test/cli.test.ts`, но только если там уже есть contract-level docs/help expectations

### Что меняем

Добавить docs-contract checks, которые проверяют:

- новый reference существует и reachable from `SKILL.md`;
- `feature-intake` section в `SKILL.md` ссылается на intake logging reference;
- `workflow.md` в `feature-intake` section тоже ссылается на intake logging reference;
- `workflow-stage-logging.md` явно excludes `feature-intake` и направляет к новому reference;
- `Core artifacts` различает:
  - workflow-stage logs
  - intake logs
  - session-level ops logs
- `feature-intake` checklist прямо требует open/update/skip reasoning when intake logging trigger fires.

### Что не трогаем

- не добавляем новый shipped CLI subcommand;
- не меняем runtime behavior `feature-intake` в этом цикле;
- не заставляем `next-step` или другой CLI читать intake log prose.

## UX-акценты для имплементации

При реализации нужно все время проверять три границы:

1. `feature-intake` остается `CLI command`, а не становится workflow stage задним числом.
2. intake log — это process telemetry command-level handoff, а не второй Feature Dossier.
3. intake log не конкурирует с session-level ops log:
   - intake log покрывает обычный dossier intake;
   - session-level ops log остается для cross-skill / cross-stage migration or repair episodes;
   - если обычный intake перерастает в такой episode, intake log остается primary record of command flow, а ops log становится companion artifact for the cross-skill boundary.

## Review strategy

Так как этот цикл пока затрагивает только нормативные инструкции и docs-contract layer:

- UX audit по роли агента обязателен;
- `spec-conformance` audit нужен на этапе имплементации;
- `code` и `security` audits нужны только если в ходе реализации будут затронуты runtime/help/test contracts за пределами docs-contract изменений.

## Definition of done

План считается реализованным корректно, только если одновременно выполнено все:

- у `feature-intake` есть отдельный active logging reference;
- агент видит прямой маршрут к нему из `SKILL.md` и `workflow.md`;
- `workflow-stage-logging.md` не размывает свой scope, но дает явный redirect к intake logging;
- `Core artifacts` различают intake logs и workflow-stage logs;
- intake logging rules буквальными trigger-ами покрывают backlog actualization, operator rerounds, `index-refresh` failures и process misses;
- required intake log является буквальным closure blocker;
- cycle rollover rule не оставляет агенту догадок;
- intake log vs session-level ops log boundary задана через explicit primary/companion rule;
- остается low-overhead skip path для truly trivial intake;
- docs-contract tests защищают новую нормативную поверхность.
