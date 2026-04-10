# План рефакторинга 7: логирование этапов спецификации, планирования и имплементации

Дата: `2026-04-10`
Компонент: `dossier-engineer`
Область: `spec-compact`, `plan-slice`, `implementation`, процессная телеметрия, docs-contract tests
Источник запроса: [issues/2026-04-10-spec-and-planning-log-policy-gap.ru.md](issues/2026-04-10-spec-and-planning-log-policy-gap.ru.md)

## Контекст и проблема

В текущем состоянии скила есть отдельный контракт логирования для `implementation`: [references/implementation-logging.md](../references/implementation-logging.md). Для `spec-compact` и `plan-slice` аналогичной политики нет.

Это создает процессный разрыв:

- в имплементации можно восстановить ход работы, решения, review rounds, process misses и метрики;
- в спецификации и планировании похожие решения тоже принимаются, но не имеют единого устойчивого следа;
- аналитика будущих проектов будет видеть результат в Feature Dossier, но не сможет надежно восстановить, как агент пришел к этому результату;
- если добавить отдельную общую политику поверх существующей `implementation-logging.md`, агенту придется вручную совмещать две инструкции.

Цель рефакторинга — сделать одну активную политику логирования для трех реально используемых `Workflow stage`: `spec-compact`, `plan-slice`, `implementation`.

## Нормативные источники

- [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md) — целевая кросс-скилл модель.
- [issues/2026-04-10-spec-and-planning-log-policy-gap.ru.md](issues/2026-04-10-spec-and-planning-log-policy-gap.ru.md) — конкретный запрос на закрытие пробела в логировании.
- [../SKILL.md](../SKILL.md) — активная инструкция скила.
- [../references/workflow-stage-spec-compact.md](../references/workflow-stage-spec-compact.md) — детальный workflow для `spec-compact`.
- [../references/workflow-stage-plan-slice.md](../references/workflow-stage-plan-slice.md) — детальный workflow для `plan-slice`.
- [../references/workflow-stage-implementation.md](../references/workflow-stage-implementation.md) — детальный workflow для `implementation`.
- [../references/implementation-logging.md](../references/implementation-logging.md) — существующая implementation-only политика, из которой нужно перенести полезные элементы.

## Решения

1. Создать новый активный reference: `references/workflow-stage-logging.md`.
2. Сделать его конкретной политикой только для трех этапов: `spec-compact`, `plan-slice`, `implementation`.
3. Удалить `references/implementation-logging.md` как отдельную активную политику после переноса нужных правил.
4. Перенести из `implementation-logging.md` полезные implementation-specific поля, review event модель, process misses и метрики в новый единый reference.
5. Не добавлять в этом пакете runtime-проверки в `dossier-verify` или `dossier-step-close`.
6. Не добавлять новые CLI commands.
7. Зафиксировать легкий путь без лога для тривиальных одношаговых изменений.

Мотивация:

- один конкретный reference снижает когнитивную нагрузку на агента;
- stage открывает один документ логирования и применяет только свою stage-specific секцию;
- Feature Dossier остается SSoT текущей truth, а log фиксирует процессный путь к ней;
- удаление отдельной implementation-only политики убирает риск drift между правилами.

## Не цели

- Не превращать Feature Dossier в журнал процесса.
- Не дублировать в логе полный текст AC, slices, tasks или финальную truth.
- Не заменять логом verification, independent review, backlog actualization или `dossier-step-close`.
- Не заставлять CLI читать или интерпретировать prose logs.
- Не требовать тяжелое логирование для тривиальной правки, если ни один trigger не сработал.
- Не менять runtime-поведение утилиты, кроме docs-contract tests, если они нужны для защиты новой документационной модели.

## Пакет 1. Единая политика логирования workflow stages

Файлы:

- создать `skills/dossier-engineer/references/workflow-stage-logging.md`;
- удалить `skills/dossier-engineer/references/implementation-logging.md`.

Новый reference должен быть написан как рабочая инструкция для агента, а не как абстрактная теория логирования.

### Область применения

В начале файла явно указать, что политика применяется только к:

- `Workflow stage: spec-compact`;
- `Workflow stage: plan-slice`;
- `Workflow stage: implementation`.

Не называть документ общей политикой логирования для всех будущих stages. Это важно, чтобы агент не начал применять его к CLI commands, audit commands или другим процессам без явного решения.

### Назначение stage log

Определить stage log как process telemetry:

- отвечает на вопрос, как stage пришла к текущей truth;
- фиксирует решения, уточнения оператора, rerounds, process misses, source inputs и backlog actualization reasoning;
- помогает ретроспективному анализу процесса;
- не является SSoT требований;
- не заменяет Feature Dossier, review artifacts, verification artifacts или step closure artifacts.

### Путь хранения

Зафиксировать путь:

```text
.dossier/logs/<feature>/<stage>-<cycle>.md
```

Правила:

- `<feature>` должен соответствовать dossier feature id или стабильному slug;
- `<stage>` должен быть одним из `spec-compact`, `plan-slice`, `implementation`;
- `<cycle>` должен быть коротким и понятным человеку;
- один log file — одна closure target;
- если stage распадается на независимые closure targets, нужно открыть новый cycle log, а не растягивать старый.

### Когда лог обязателен

Лог обязателен, если сработал хотя бы один trigger:

- stage меняет backlog truth или требует backlog actualization;
- feedback или clarification оператора меняет направление stage;
- внешний review вернул findings или вызвал reround;
- open question был resolved, reclassified или intentionally deferred;
- границы planning slices изменились после первого плана;
- stage выполняется по explicit plan, package, refactoring plan или multi-pass workflow;
- произошел process miss;
- принято решение или допущение, выходящее за текущую process model;
- оператор прямо ожидает или запрашивает ретроспективную process telemetry.

### Когда лог можно не вести

Лог можно пропустить только если одновременно верно:

- изменение тривиальное и одношаговое;
- backlog truth не изменилась;
- operator clarification не менял направление stage;
- external review reround не было;
- open questions не закрывались и не переклассифицировались;
- process miss не было;
- retrospective telemetry не запрошена и разумно не ожидается.

Если лог пропущен, агент должен кратко объяснить это в финальном summary. Пример формулировки может оставаться английским как операторская runtime-фраза:

```text
stage log skipped: trivial wording-only correction; no logging trigger fired
```

### Правило времени открытия

Зафиксировать:

- если logging trigger известен до правок, открыть log до первой содержательной мутации;
- если trigger появился в середине stage, открыть log немедленно;
- при позднем открытии записать `late_start: true` и process miss note;
- поддерживать log актуальным через review, backlog actualization, step closure и commit, если commit входит в stage.

### Обязательный metadata block

Минимальный metadata block:

```yaml
feature_id: F-XXXX
backlog_item_key: CF-XXX
stage: spec-compact | plan-slice | implementation
cycle_id: short-human-readable-id
session_id: 019d... # omit if runtime does not expose a reliable value
start_ts: 2026-04-10T10:00:00+02:00
ready_for_review_ts: 2026-04-10T10:45:00+02:00
final_pass_ts: 2026-04-10T11:10:00+02:00
source_inputs:
  - docs/ssot/index.md
repo_overlays:
  - AGENTS.md
log_required: true
log_required_reason:
  - backlog_actualization
  - review_reround
backlog_actualized: true
verification_artifact: .dossier/verification/...
review_artifact: .dossier/reviews/...
step_artifact: .dossier/steps/...
```

Правило для `session_id`:

- записывать только если runtime предоставляет надежное значение, например `CODEX_THREAD_ID`;
- не выдумывать placeholder;
- если надежного значения нет, поле нужно опустить.

### Общие описательные секции

Обязательные секции:

- `Scope`;
- `Inputs actually used`;
- `Decisions / reclassifications`;
- `Operator feedback`;
- `Review events`;
- `Backlog actualization`;
- `Process misses`;
- `Close-out`.

Секции должны быть краткими. Они не должны пересказывать Feature Dossier и не должны копировать полный текст AC, slices или tasks.

### Stage-specific секции

Для `spec-compact` добавить:

- summary изменений AC только по ID;
- open questions resolved или reclassified;
- результат terms/thresholds trigger;
- решения по contract, safety, operator-agent-contract;
- decision classes:
  - `normative now`;
  - `implementation freedom`;
  - `temporary assumption`.

Для `plan-slice` добавить:

- решения по границам slices только через `SL-*`;
- slices created, removed или reshaped;
- dependencies, assumptions, fallbacks;
- drift-guard planning;
- real usage audit planning;
- corrective categories, если они появились в плане.

Для `implementation` перенести полезные элементы текущего implementation log:

- package или increment id;
- changed scope paths count;
- review policy и review rounds;
- code/security/spec audit events;
- debt review result;
- commit metadata, если был commit;
- implementation-specific process misses.

### Метрики

Общие метрики:

- `duration_minutes`;
- `operator_clarifications_total`;
- `review_rounds_total`;
- `review_findings_total`;
- `process_misses_total`;
- `backlog_actualization_count`;
- `late_log_start`.

Метрики для `spec-compact`:

- `ac_changed_total`;
- `open_questions_resolved_total`;
- `open_questions_reclassified_total`;
- `normative_now_decisions_total`;
- `implementation_freedom_decisions_total`;
- `temporary_assumptions_total`.

Метрики для `plan-slice`:

- `slices_created_total`;
- `slices_reshaped_total`;
- `slice_boundary_changes_after_first_plan`;
- `dependencies_added_total`;
- `fallbacks_added_total`;
- `drift_guard_items_planned_total`;
- `real_usage_audit_planned`.

Метрики для `implementation`:

- `scope_paths_count`;
- `code_review_rounds_total`;
- `security_review_rounds_total`;
- `spec_review_rounds_total`;
- `debt_items_found_total`;
- `debt_items_resolved_total`;
- `commit_recorded`.

### Правило закрытия

Если logging был обязателен:

- stage exit checklist не может пройти, пока log не ссылается на применимые verification, review, step-close и backlog actualization artifacts;
- отсутствующие ссылки должны быть явно объяснены;
- сам по себе log не является достаточным условием closure.

## Пакет 2. Обновление SKILL.md и stage references

Файлы:

- обновить `skills/dossier-engineer/SKILL.md`;
- обновить `skills/dossier-engineer/references/workflow-stage-spec-compact.md`;
- обновить `skills/dossier-engineer/references/workflow-stage-plan-slice.md`;
- обновить `skills/dossier-engineer/references/workflow-stage-implementation.md`.

### Изменения в SKILL.md

В `Core artifacts` добавить:

- `.dossier/logs/<feature>/<stage>-<cycle>.md` как process telemetry для `spec-compact`, `plan-slice` и `implementation`.

В `Workflow stage: spec-compact` добавить ссылку:

- `[Workflow stage logging](references/workflow-stage-logging.md)`.

В `Stage exit checklist` для `spec-compact` добавить проверки:

- если logging trigger сработал, stage log был открыт или обновлен;
- log фиксирует inputs, decisions/reclassifications, operator/review cycles, process misses и backlog actualization outcome;
- log не дублирует AC text или dossier truth.

В `Workflow stage: plan-slice` добавить такую же ссылку:

- `[Workflow stage logging](references/workflow-stage-logging.md)`.

В `Stage exit checklist` для `plan-slice` добавить проверки:

- если logging trigger сработал, stage log был открыт или обновлен;
- log фиксирует slice boundary decisions, planning assumptions/fallbacks, review cycles, process misses и backlog actualization outcome;
- log не дублирует slice/task text из dossier.

В `Workflow stage: implementation`:

- заменить `[Implementation logging](references/implementation-logging.md)` на `[Workflow stage logging](references/workflow-stage-logging.md)`;
- обновить формулировку checklist с `implementation log` на `stage log`;
- сохранить ссылку на `Implementation audit policy` без изменений.

### Изменения в stage references

В `workflow-stage-spec-compact.md`:

- добавить ранний шаг после overlay ingestion: оценить workflow-stage logging triggers;
- если log обязателен, открыть `.dossier/logs/...` до первой содержательной spec mutation;
- добавить финальный шаг перед backlog actualization/closure: обновить stage log review events, backlog actualization result и ссылки на artifacts.

В `workflow-stage-plan-slice.md`:

- добавить раннюю оценку triggers после overlay ingestion и open-question re-check;
- если log обязателен, открыть `.dossier/logs/...` до первой содержательной planning mutation;
- добавить финальное обновление stage log перед closure.

В `workflow-stage-implementation.md`:

- заменить implementation-only logging wording на единое stage logging wording;
- сохранить требование открывать log до первой mutating edit для multi-step или package-based implementation;
- оставить ссылки на implementation audit policy без изменений.

## Пакет 3. Docs-contract tests

Файл:

- обновить `skills/dossier-engineer/test/docs-contract.test.ts`.

Изменения:

1. Заменить `IMPLEMENTATION_LOGGING_PATH` на `WORKFLOW_STAGE_LOGGING_PATH`.
2. Обновить тест implementation stage:
   - ожидать `[Workflow stage logging](references/workflow-stage-logging.md)`;
   - читать `workflow-stage-logging.md`;
   - проверять, что implementation-specific logging terms перенесены: `review policy`, `debt review`, `commit metadata`, `process misses`, `session_id`.
3. Добавить или расширить тесты для `spec-compact` и `plan-slice`:
   - stage sections в `SKILL.md` указывают на `Workflow stage logging`;
   - stage references упоминают trigger evaluation и `.dossier/logs`;
   - stage exit checklists упоминают log update, если trigger сработал.
4. Добавить тест единого logging reference:
   - `spec-compact`;
   - `plan-slice`;
   - `implementation`;
   - `.dossier/logs/<feature>/<stage>-<cycle>.md`;
   - `Low-overhead skip path`;
   - `Mandatory metadata block`;
   - `session_id`;
   - `Review events`;
   - `Backlog actualization`;
   - `Process misses`;
   - `Feature Dossier`;
   - `process telemetry`.
5. Добавить негативную проверку:
   - активные skill/reference пути не должны ссылаться на `references/implementation-logging.md`.

Ограничение:

- исторические документы в `docs/implementation-log-*.ru.md` не должны ломать негативную проверку;
- проверять нужно активные файлы скила и references, а не архивные или отчетные docs.

## Проверка

Запустить:

```bash
pnpm --filter @kostysh/dossier-engineer-cli format:check
pnpm --filter @kostysh/dossier-engineer-cli lint
pnpm --filter @kostysh/dossier-engineer-cli test
git diff --check
```

Если потребуется форматирование:

```bash
pnpm --filter @kostysh/dossier-engineer-cli format
```

## Внешний аудит

Обязательный аудит после имплементации:

- внешний агент с ролью `spec-conformance-reviewer`;
- модель `gpt-5.4` или сильнее;
- scope:
  - `SKILL.md`;
  - `references/workflow-stage-logging.md`;
  - `references/workflow-stage-spec-compact.md`;
  - `references/workflow-stage-plan-slice.md`;
  - `references/workflow-stage-implementation.md`;
  - `test/docs-contract.test.ts`;
- нормативные источники:
  - этот план;
  - `issues/2026-04-10-spec-and-planning-log-policy-gap.ru.md`;
  - `cross-skill-process-model.ru.md`.

`code-reviewer` и `security-reviewer` не запускать, если в ходе работы не появятся runtime code changes.

## Критерии приемки

- `spec-compact`, `plan-slice` и `implementation` имеют одну активную logging policy.
- Нет активного instruction path, который заставляет агента совмещать `workflow-stage-logging.md` с `implementation-logging.md`.
- `implementation-logging.md` удален из активных references.
- Новая политика сохраняет полезные implementation log metadata, review events, process misses и metrics.
- Новая политика определяет, когда logging обязателен и когда его можно пропустить.
- Stage logs явно описаны как process telemetry, а не Feature Dossier truth.
- Путь хранения логов явно зафиксирован.
- Легкий skip path явно зафиксирован.
- Stage exit checklists говорят агенту, когда log нужно открыть или обновить.
- Docs-contract tests защищают новые ссылки и ключевые invariants.
