# Согласованный кросс-скил процесс: `backlog-engineer` + `dossier-engineer`

## Назначение

Этот документ описывает целевой согласованный процесс разработки, в котором:

- `backlog-engineer` строит и поддерживает architecture-sourced backlog graph;
- `dossier-engineer` проводит выбранную работу по downstream lifecycle;
- оба skill-а имеют свои артефакты, но работают как части одного процесса;
- дублирования backlog-extraction функций между skill-ами не остаётся.

Документ нужен как **target process model**. На следующем шаге его можно будет сопоставить с фактическим состоянием обоих skill-ов и понять:

- что уже соответствует процессу;
- что противоречит ему;
- что надо менять в `dossier-engineer`;
- что потом надо подправить в `backlog-engineer` для полного сопряжения.

## Основная идея процесса

Разработчик уже подготовил:

- концепцию;
- архитектуру;
- ADR и другие cross-cutting решения.

Дальше работа идёт так:

1. Сначала через `backlog-engineer` materialize-ится backlog graph из architecture sources.
2. Затем через `backlog-engineer` разработчик читает состояние backlog-а и выбирает следующую работу.
3. Затем через `dossier-engineer` выбранная работа проходит intake, shaping, specification, planning, implementation, verification, review и closure.
4. После изменений в architecture, ADR, code, implementation state или dossier artifacts backlog снова синхронизируется через `backlog-engineer`.
5. Цикл повторяется, пока проект продвигается.

Иными словами:

- `backlog-engineer` отвечает за **что существует в карте работ**;
- `dossier-engineer` отвечает за **как выбранная работа проходит delivery lifecycle**.

## Роли skill-ов

### `backlog-engineer`

Отвечает за:

- извлечение backlog graph из concept / architecture / ADR / technical decisions;
- coverage of seams and architecture obligations;
- atomic tasks;
- dependencies;
- source traceability;
- derived backlog state;
- выбор следующей работы на уровне backlog graph;
- синхронизацию backlog после изменений документов или implementation state.

Не отвечает за:

- feature dossier lifecycle;
- slice planning внутри dossier;
- review/verification/step-close artifacts;
- feature-level closure discipline.

### `dossier-engineer`

Отвечает за:

- intake выбранной backlog work;
- dossier creation and maintenance;
- compact specification;
- slice planning;
- implementation workflow;
- verification artifacts;
- independent review artifacts;
- step closure;
- feature-level progress and delivery discipline.

Не отвечает за:

- первичное извлечение backlog из architecture / ADR;
- поддержание canonical task graph;
- конкурирующую backlog-discovery модель.

## Канонические артефакты и ownership

### Артефакты `backlog-engineer`

Owned by backlog process:

- backlog root;
- `.backlog.json`;
- `.backlog/`;
- `packets/`;
- `patches/`;
- `reports/`;
- generated backlog `AGENTS.md`;
- task graph and utility-derived state.

### Артефакты `dossier-engineer`

Owned by dossier process:

- `docs/features/F-*.md`;
- `docs/ssot/index.md`;
- `.dossier/verification/*`;
- `.dossier/reviews/*`;
- `.dossier/steps/*`;
- `.dossier/drift/*`.

### Важное правило ownership

Оба skill-а имеют собственные артефакты, но:

- backlog artifacts не подменяют dossier artifacts;
- dossier artifacts не подменяют backlog graph;
- ни один skill не должен дублировать source-of-truth слой другого.

## Сквозной процесс разработки

## 1. Подготовка входов

Предпосылка:

- есть concept / architecture / ADR / technical decision sources;
- оператор или команда понимает, создаётся ли система с нуля или уже частично реализована.

Если система уже partially implemented:

- нужно отдельно определить source of truth for delivery state;
- backlog creation не должен угадывать implementation state без явного источника.

## 2. Создание backlog graph

Используется `backlog-engineer`.

Шаги:

1. Выполнить preflight.
2. Собрать полный source set.
3. Зарегистрировать authoritative and supporting sources.
4. Построить initial packet.
5. Прогнать `--dry-run`, затем применить packet.
6. Прочитать `status`, `gaps`, `queue`, `attention`.

Результат:

- существует canonical backlog graph;
- в нём есть как already implemented architecture-significant tasks, так и not-yet-implemented work;
- backlog отражает coverage architecture, а не только будущую работу.

## 3. Выбор следующей работы

Используется `backlog-engineer`.

Разработчик:

- читает `status` для общей картины;
- читает `queue` для runnable chains;
- читает `gaps`, если нужны blockers;
- читает `attention`, если нужен review-oriented subset;
- при необходимости использует `items` и `search` для точного просмотра конкретной области.

Результат:

- выбрана конкретная backlog work item или короткая цепочка work items;
- решение основано на backlog graph, а не на отдельном candidate backlog.

## 3a. Правило явной актуализации backlog статуса

Если downstream шаг меняет реальное состояние выбранной работы, backlog status должен актуализироваться явно через `backlog-engineer`.

Это значит:

- `dossier-engineer` сам по себе не считается source of truth для backlog status;
- после dossier-side шага, который меняет task lifecycle reality, агент обязан вернуться к `backlog-engineer`;
- изменение должно быть выражено через backlog mutation/sync workflow, а не оставаться только внутри dossier artifacts.

Базовое соответствие выглядит так:

| Изменение в downstream процессе | Что актуализируется в backlog | Через какой skill |
| --- | --- | --- |
| intake без новых фактов о lifecycle | обычно без изменения `delivery_state` | `backlog-engineer` не трогается автоматически |
| shaping/specification делает задачу достаточно определённой | `delivery_state -> specified` | `backlog-engineer` |
| planning делает задачу готовой к реализации | `delivery_state -> planned` | `backlog-engineer` |
| implementation/closure подтверждает, что capability реально существует | `delivery_state -> implemented` | `backlog-engineer` |
| dossier выявил новые blockers / dependencies / context facts | `gaps`, dependencies, context links, `attention`-relevant facts | `backlog-engineer` |

Важная оговорка:

- backlog status обновляется не по самому факту прохождения команды `dossier-engineer`, а по strongest available evidence;
- если backlog item уже находится на этом или более высоком корректном состоянии, агент не должен делать фиктивный status bump только ради симметрии.

## 4. Intake выбранной работы в dossier workflow

Используется `dossier-engineer`.

Шаги:

1. Взять selected work из backlog graph.
2. Создать или обновить feature dossier.
3. Зафиксировать link между dossier scope и выбранной backlog work.
4. Убедиться, что repo overlays и ADR ingested до shaping/planning decisions.

Результат:

- backlog work получила dossier-level representation;
- intake не создаёт вторую competing backlog model;
- dossier workflow стартует от уже выбранной работы, а не от отдельного feature-candidate списка.

Backlog status effect:

- сам intake обычно не обязан менять `delivery_state`;
- но если во время intake уточнились реальные blockers, dependencies, scope split, or context facts, агент должен актуализировать backlog через `backlog-engineer` до перехода к следующему downstream шагу.

## 5. Shaping и specification

Используется `dossier-engineer`.

Шаги:

1. Выполнить `spec-compact`.
2. Уточнить acceptance criteria, assumptions, open questions.
3. Проверить architecture/ADR constraints для выбранной работы.
4. Подготовить basis for plan-slice.

Результат:

- работа переведена из backlog-level formulation в dossier-level design;
- planning blockers и open questions выражены явно;
- feature scope и dossier scope согласованы.

Backlog status effect:

- если после shaping/specification работа действительно стала достаточно определённой для отдельной спецификации, агент должен актуализировать backlog task через `backlog-engineer` до `delivery_state = specified`;
- если shaping выявил новые blockers, они должны быть выражены в backlog как `gaps` или другие relevant task-level changes;
- если доказательств для `specified` всё ещё недостаточно, backlog status не повышается искусственно.

## 6. Planning

Используется `dossier-engineer`.

Шаги:

1. Выполнить `plan-slice`.
2. Разложить работу на execution slices/tasks.
3. Зафиксировать rollout constraints, dependencies, verification expectations.

Результат:

- выбранная backlog work получила executable planning representation;
- dossier готов к implementation lifecycle.

Backlog status effect:

- если planning действительно сделал работу ready for implementation, агент должен актуализировать backlog task через `backlog-engineer` до `delivery_state = planned`;
- если planning выявил новые dependencies, rollout constraints, or context facts, они тоже должны быть возвращены в backlog graph;
- dossier `planned` и backlog `planned` не считаются автоматически тождественными: backlog status меняется только при наличии достаточного evidence для task-level planning readiness.

## 7. Implementation и closure

Используется `dossier-engineer`.

Шаги:

1. Выполнить implementation increment.
2. Обновить dossier.
3. Прогнать verification.
4. Получить independent review.
5. Закрыть step через machine-checkable closure artifacts.

Результат:

- работа продвинулась или завершилась внутри dossier workflow;
- feature-level delivery discipline зафиксирована независимо от backlog graph.

Backlog status effect:

- когда implementation и closure дают сильное evidence, что capability реально существует в системе, агент должен актуализировать backlog task через `backlog-engineer` до `delivery_state = implemented`;
- `implemented` в backlog не должен выставляться только потому, что dossier step закрыт формально;
- если implementation uncovered new architecture-significant follow-up work, backlog должен быть расширен или обновлён отдельно через `backlog-engineer`.

## 8. Обратная синхронизация backlog

Используется `backlog-engineer`.

Триггеры:

- architecture changed;
- ADR changed;
- implementation state materially changed;
- dossier workflow дал новые facts, влияющие на backlog graph;
- появились новые blockers, dependencies, or context facts.

Шаги:

1. Синхронизировать relevant sources.
2. При необходимости применить patch или refresh.
3. Перечитать `status`, `queue`, `attention`, `gaps`.

Результат:

- backlog graph снова отражает реальное состояние проекта;
- выбор следующей работы остаётся backlog-driven.

Это включает и явную status actualization после downstream стадий:

- shaping/specification -> `specified`, когда evidence достаточно;
- planning -> `planned`, когда evidence достаточно;
- implementation/closure -> `implemented`, когда evidence достаточно.

## 9. Повтор цикла

Процесс дальше повторяется:

- backlog graph -> selected work -> dossier workflow -> implementation/closure -> backlog sync.

Проект постепенно продвигается:

- backlog layer keeps global architecture coverage;
- dossier layer keeps local feature delivery discipline.

## Что считается “кандидатом” в новой модели

В новой модели `candidate` больше не означает запись в отдельном `feature-candidates.md`.

Практический смысл слова меняется:

- кандидаты = нереализованные backlog items, извлечённые `backlog-engineer` из architecture sources.

Следствия:

- canonical candidate universe живёт в backlog graph;
- `dossier-engineer` не должен создавать альтернативную candidate-backlog систему;
- selected work для intake должна приходить из backlog-driven процесса.

## Как skill-ы должны взаимодействовать

### Handoff от backlog к dossier

Минимальный handoff:

- выбранная backlog work;
- её текущее backlog state;
- relevant source traceability;
- known blockers / attention / dependencies.

### Handoff от dossier обратно в backlog

Backlog должен узнавать о:

- изменениях implementation reality;
- новых explicit constraints;
- новых dependencies;
- изменениях architecture significance;
- закрытии или изменении work scope.

## Что нельзя делать в целевом процессе

1. Нельзя держать две competing backlog models.
2. Нельзя извлекать architecture backlog и через `backlog-engineer`, и через `dossier-engineer`.
3. Нельзя использовать dossier workflow как substitute for backlog graph.
4. Нельзя использовать backlog graph как substitute for dossier/spec/planning/review workflow.
5. Нельзя считать, что одинаковые слова в status model уже значат одно и то же.

## Где в процессе особенно важны статусы

Есть два разных слоя статусов:

### Backlog-level

- `delivery_state`
- `gaps`
- `needs_attention`
- `attention_reasons`
- `ready_for_next_step`
- utility-owned `todo`

### Dossier/process-level

- dossier maturity
- coverage enforcement
- review freshness
- step closure
- commit completeness

Принцип:

- backlog-level statuses отвечают за **task graph reality and readiness**;
- dossier/process-level statuses отвечают за **feature workflow maturity and closure**.

Эти модели нужно будет согласовать, но не смешивать механически.

## Что должен уметь ответить агент в этом процессе

В любой момент агент должен уметь ответить на два разных вопроса:

### Вопрос 1. Что делать дальше по проекту?

Это backlog-layer question.

Ответ строится через:

- `status`
- `queue`
- `gaps`
- `attention`
- `items`

### Вопрос 2. Что делать дальше внутри выбранной работы?

Это dossier-layer question.

Ответ строится через:

- dossier maturity;
- open questions;
- coverage gate;
- review freshness;
- step closure;
- `next-step`.

## Как понимать `next-step` в новой модели

`next-step` в `dossier-engineer` сохраняется, но его смысл становится уже.

Он не отвечает на вопросы:

- какую backlog task брать следующей;
- есть ли в backlog blocking `gaps`;
- есть ли review-oriented `attention`;
- можно ли вообще продвигать выбранную работу дальше на уровне backlog graph;
- готова ли backlog task к coding from the backlog point of view.

На эти вопросы отвечает `backlog-engineer`.

`dossier-engineer next-step` отвечает только на другой вопрос:

- какой следующий workflow step нужен **внутри уже выбранной и intaken работы**.

Практически это означает:

- до выбора работы используется `backlog-engineer`;
- после выбора работы и проверки backlog readiness используется `dossier-engineer next-step`;
- если внутри dossier workflow обнаружился новый blocker, dependency, context change, or lifecycle change, агент возвращается в `backlog-engineer` для актуализации backlog state.
- `dossier-engineer next-step` читает только structured dossier state и durable artifacts; CLI никогда не интерпретирует prose из dossier body.

Короткая формула:

- `backlog-engineer` determines whether work can move;
- `dossier-engineer next-step` determines how the selected work should move locally.

## Критерий согласованного процесса

Процесс можно считать согласованным, если одновременно верно следующее:

1. Новый backlog всегда создаётся через `backlog-engineer`, а не через `dossier-engineer`.
2. Новая выбранная работа попадает в dossier workflow без создания второй backlog model.
3. `backlog-engineer` используется для выбора следующей работы и синхронизации backlog.
4. `dossier-engineer` используется для intake, spec, plan, implementation, review, and closure.
5. Архитектурные изменения возвращаются обратно в backlog graph.
6. Два skill-а работают на одном проекте без дублирования extraction responsibilities.

## Для чего этот документ нужен дальше

Следующий шаг после этого документа:

- сравнить этот process model с фактическим состоянием `backlog-engineer`;
- сравнить его с фактическим состоянием `dossier-engineer`;
- найти расхождения;
- спланировать рефакторинг skill-ов под один согласованный процесс.
