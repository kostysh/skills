# Подготовительный отчёт по гармонизации `dossier-engineer` с `backlog-engineer`

## Назначение

Этот документ нужен как подготовительная карта перед гармонизацией двух skill-ов в два последовательных шага:

1. сначала рефакторится `dossier-engineer` под новый процесс, в котором `backlog-engineer` уже является нормальной частью workflow;
2. затем отдельно проверяется кросс-взаимодействие и, если потребуется, точечно корректируется `backlog-engineer`.

Это не план длительного переходного периода. Направление уже выбрано:

- `backlog-engineer` — canonical backlog extraction layer;
- `dossier-engineer` — downstream dossier workflow layer;
- дублирования функций между skill-ами в целевой системе быть не должно;
- оба skill-а сохраняют собственные артефакты, но работают внутри одного согласованного процесса.

Документ не является планом работ. Его задача:

- показать, где skill-ы уже совместимы;
- показать, где есть пересечение, трение или риск дублирования;
- разложить возможные векторы гармонизации;
- помочь выбрать, что именно менять в `dossier-engineer` на первом этапе.

## Что уже известно

Важная framing correction для всего документа:

- `candidate backlog` в `dossier-engineer` появился раньше `backlog-engineer`;
- `backlog-engineer` был задуман именно как реакция на несовершенство candidate-backlog модели;
- следовательно, `backlog-engineer` нужно рассматривать не как “соседний backlog layer”, а как **замену legacy candidate backlog**.

Из этого следует:

- `docs/backlog/feature-candidates.md` не должен считаться целевой стратегической моделью рядом с backlog graph;
- гармонизация должна мыслиться как быстрый рефакторинг `dossier-engineer` с legacy candidate-backlog подхода на backlog-driven подход;
- candidate backlog в `dossier-engineer` нужно рассматривать как старую модель, которую надо вывести из целевой process architecture, а не как нормальный backlog layer.

Текущий `backlog-engineer` уже стабилизирован вокруг таких идей:

- backlog graph строится из architecture / ADR / technical decision sources;
- первый проход по новому backlog должен быть `coverage-first`;
- planning backlog documents не подменяют extraction из concept / architecture / ADR;
- source-set discovery является обязательным blocking step до authoring первого packet;
- backlog root и backlog utility живут отдельно от продуктовых docs;
- `packet` и `patch` materialize-ят task graph, а не feature dossier workflow.

Текущий `dossier-engineer` всё ещё несёт такой legacy baggage:

- один feature = один dossier;
- `docs/ssot/index.md` — глобальная навигация;
- `docs/backlog/feature-candidates.md` — legacy candidate artifact, который нужно вывести из целевой зоны ответственности skill-а;
- зрелость dossier, coverage enforcement, review freshness и process closure разделены;
- repo overlays и ADR должны быть ingested до planning и implementation;
- основной workflow строится вокруг `feature-intake -> spec-compact -> plan-slice -> implementation`.

## Целевое отношение skill-ов

Желаемая модель выглядит так:

- `backlog-engineer` отвечает за **architecture-sourced backlog graph**:
  - coverage of seams;
  - atomic tasks;
  - dependencies;
  - source traceability;
  - sync after architecture/doc changes.
- `dossier-engineer` отвечает за **downstream feature delivery workflow**:
  - selected backlog work;
  - feature dossiers;
  - slice planning;
  - implementation closure;
  - verification/review artifacts.

Иными словами:

- `backlog-engineer` отвечает на вопрос: “какая полная карта работ и архитектурных обязательств существует?”
- `dossier-engineer` отвечает на вопрос: “как выбранная работа проходит путь от intake до delivered state?”

Это upstream/downstream model, а не two competing planning systems.

Оба skill-а могут сохранять собственные артефакты, но они должны читаться как части одного согласованного процесса, а не как две параллельные process architecture.

## Ключевая гипотеза гармонизации

Главная рабочая гипотеза для первого этапа:

- `dossier-engineer` не должен пытаться конкурировать с `backlog-engineer` за роль architecture-to-backlog materializer;
- вместо этого `dossier-engineer` должен явно предполагать, что architecture coverage и seam discovery materialize-ятся через backlog graph;
- dossier workflow должен стать downstream layer по отношению к architecture-sourced backlog, а не альтернативной системой извлечения из архитектуры.

Это означает:

- `backlog-engineer` становится единственным canonical backlog extraction layer;
- `dossier-engineer` перестаёт быть самостоятельным backlog-discovery skill-ом в целевой модели;
- старая candidate-backlog модель должна быть выведена из целевой process architecture, а не поддерживаться как долгоживущий parallel mode.

## Сравнительная матрица текущих ролей

| Измерение | `backlog-engineer` | `dossier-engineer` | Текущее состояние |
| --- | --- | --- | --- |
| Главная единица | atomic task | feature dossier | совместимо |
| Главный вход | architecture / ADR / technical decisions | selected backlog work + repo overlays + feature-local docs | нужна жёсткая перестройка |
| Тип backlog | canonical task graph | dossier workflow over selected work | нужна жёсткая перестройка |
| Источник architecture coverage | да, core responsibility | legacy-only through `feature-discovery` | дублирование нужно убирать |
| Источник planning workflow | нет | да | совместимо |
| Источник implementation closure | нет | да | совместимо |
| Source registration / traceability | explicit utility model | implicit through docs workflow | асимметрия |
| Работа с ADR | mandatory input when relevant | overlay / architecture constraint input | совместимо, но wording надо сблизить |
| Repo overlay ingestion | почти не нужен, кроме first-run reading discipline | core rule before planning/implementation | требует калибровки handoff |
| Candidate backlog | supporting input only | legacy artifact to retire from target process | требует жёсткой переинтерпретации |
| Current-state reading | through utility | through docs + artifacts + git state | разные слои, нормально |
| “What next?” | queue / attention / status | next-step | потенциально пересекается, но не обязан конфликтовать |

## Сравнение моделей статусов имплементации

Один из самых важных будущих вопросов гармонизации — приведение статусных моделей двух skill-ов к согласованной системе без смешения разных измерений.

Сейчас модели статусов устроены так.

### `backlog-engineer`

Главный статус task-level lifecycle:

- `defined`
- `specified`
- `planned`
- `implemented`

Дополнительные derived dimensions:

- `gaps` — явные блокировки по missing information;
- `needs_attention` / `attention_reasons` — review-oriented re-check layer;
- `ready_for_next_step` — можно ли брать задачу дальше;
- utility-owned `todo` — follow-up/review work after mutations and refresh.

### `dossier-engineer`

Текущая модель разделена на несколько измерений:

- legacy candidate backlog state:
  - `candidate`
  - `confirmed`
  - `intaken`
  - `discarded`
- dossier maturity:
  - `proposed`
  - `shaped`
  - `planned`
  - `in_progress`
  - `done`
  - `parked`
- coverage enforcement:
  - `deferred`
  - `strict`
- review freshness:
  - `missing`
  - `pass`
  - `fail`
  - `stale`
- step closure:
  - `open`
  - `blocked`
  - `closed`
- commit completeness:
  - `dirty`
  - `clean-unreviewed`
  - `clean-reviewed`
  - `clean-but-stale-review`

### Что в них уже сейчас не совпадает

1. `planned` не означает одно и то же.

- В `backlog-engineer` это coarse task lifecycle state.
- В `dossier-engineer` это dossier maturity, где slice/task forecast готов, но commitment живёт в AC/DoD/verification layers.

2. `implemented` и `done` не совпадают по смыслу.

- `implemented` в backlog graph означает, что архитектурно значимая capability уже существует в системе.
- `done` в dossier workflow означает delivered and aligned feature после review/verification/closure discipline.

3. `backlog-engineer` держит task-execution readiness, а `dossier-engineer` держит delivery-process readiness.

- `ready_for_next_step` и `queue` у backlog utility отвечают за task progression.
- `next-step`, dossier maturity и step closure у dossier process отвечают за workflow progression.

4. `backlog-engineer` держит `gaps` как blocking information model.

- В `dossier-engineer` блокирующая сила сейчас распределена между:
  - `coverage_gate`
  - unresolved `Open question` with `needed_by`
  - review freshness
  - step closure

5. `dossier-engineer` имеет review/process states, которых вообще нет в backlog graph.

- review freshness
- step closure
- commit completeness

6. `backlog-engineer` имеет utility-owned review/follow-up signals, которых нет как first-class task-state в dossier model.

- `needs_attention`
- `attention_reasons`
- utility-owned `todo`

### Почему это важно для гармонизации

Если эти модели не согласовать, то в совместном процессе легко возникнут ложные equivalence-выводы:

- `planned` backlog item = `planned` dossier
- `implemented` backlog item = `done` dossier
- `gaps = strict coverage gate`
- `ready_for_next_step = next-step`

Все четыре вывода потенциально неверны.

### Предварительный вывод

Гармонизация статусов должна считаться одной из центральных задач, но делать её надо осторожно.

Уже сейчас видно:

- нельзя просто слить все state enums в один общий список;
- нельзя сохранять две полностью независимые модели без explicit crosswalk;
- нужно отдельно решить:
  - какие статусы остаются task-level;
  - какие статусы остаются dossier/process-level;
  - какие пары статусов должны маппиться явно;
  - какие совпадения по имени (`planned`) нельзя трактовать как совпадения по смыслу.

### Что нужно будет спроектировать позже

Нужен отдельный status-harmonization design, который определит:

- канонический vocabulary для совместного процесса;
- crosswalk между backlog task lifecycle и dossier maturity;
- отношение между `implemented` и `done`;
- отношение между `gaps`, `coverage_gate`, `Open question needed_by`, `review freshness`, `step closure`;
- отношение между `ready_for_next_step`, `queue`, и `next-step`;
- судьбу legacy candidate states после вывода candidate backlog из целевой process architecture.

## Где реально есть трение

### 1. Две разные истории про backlog discovery

`backlog-engineer` говорит:

- сначала честный source-set discovery;
- потом coverage-first packet authoring;
- planning docs не заменяют architecture extraction.

`dossier-engineer` пока всё ещё тащит такой legacy wording:

- `feature-discovery` переводит architecture в simple candidate backlog;
- missing backbone owners надо явно показывать в candidate backlog.

Проблема:

- без harmonized wording агент может решить, что именно `feature-discovery` является легитимным способом materialize architecture backlog, а `backlog-engineer` — просто ещё одна утилита рядом.

### 2. Не до конца определена граница между legacy candidate artifact и task graph

Сейчас уже есть полезное разделение:

- task graph
- dossier-level intake surface

Но в `dossier-engineer` пока не зафиксировано достаточно жёстко:

- legacy candidate artifact не должен пытаться быть полной architecture coverage map;
- legacy candidate artifact вообще не должен оставаться частью целевой responsibility zone `dossier-engineer`;
- dossier intake surface не заменяет atomic architecture backlog.

### 3. Feature-discovery пока может восприниматься как upstream feature extraction engine

Если агент читает только `dossier-engineer`, он легко делает такой вывод:

- architecture -> `feature-discovery` -> `feature-candidates.md` -> `feature-intake`

Это старый flow, который нельзя оставлять default-path в целевой backlog-driven модели.

### 4. Не оформлен explicit handoff

Сейчас нет достаточно ясной истории вида:

- откуда в `dossier-engineer` берётся selected work, если рядом уже есть backlog graph;
- как dossier intake должен соотноситься с backlog graph;
- что делать, если legacy candidate artifact расходится с backlog graph.

### 5. `next-step` и backlog-driven intake пока концептуально не сведены

`dossier-engineer` имеет свой `next-step`, который работает по dossier/process state.

Потенциальная проблема:

- если рядом есть `backlog-engineer`, остаётся не до конца ясным, кто отвечает за:
  - выбор следующего feature для intake;
  - выбор следующей atomic task;
  - выбор следующего workflow step внутри already-intaken feature.

Это не обязательно runtime bug, но это явная interop тема второго этапа.

## Где skill-ы уже хорошо совпадают

### 1. ADR и architecture не считаются optional background

Оба skill-а уже исходят из того, что:

- architecture;
- ADR;
- cross-cutting decisions;

являются legitimate first-class inputs, а не “nice to have”.

### 2. Planning backlog и legacy candidate artifact не являются SSoT

Оба skill-а уже совместимы в этом:

- planning backlog и legacy candidate artifact — supporting layer;
- не заменяет architecture truth;
- не заменяет cross-cutting constraints.

### 3. Coverage-oriented мышление уже есть по обе стороны

`backlog-engineer`:

- coverage-first backlog

`dossier-engineer`:

- explicit architecture coverage
- missing backbone owners must stay visible

То есть база для гармонизации уже хорошая.

### 4. Оба skill-а любят явные state dimensions

`backlog-engineer` отделяет:

- delivery state
- gaps
- todo
- attention
- readiness

`dossier-engineer` отделяет:

- candidate state
- dossier maturity
- coverage enforcement
- review freshness
- step closure

Это даёт хороший шанс на clean interop instead of overloaded fields.

## Векторы гармонизации

### Вектор A. Responsibility boundary

Нужно решить и закрепить:

- что именно в `dossier-engineer` остаётся собственным domain core;
- что в присутствии `backlog-engineer` считается upstream materialized input.

Recommended direction:

- `backlog-engineer` owns architecture-sourced task graph;
- `dossier-engineer` owns feature-dossier lifecycle and process closure.

### Вектор B. Candidate backlog semantics

Нужно зафиксировать в `dossier-engineer` без двусмысленности:

- candidate backlog — это старая модель, которую нужно вывести из целевого процесса;
- candidate backlog не является нормальной стратегической backlog-моделью.

Recommended direction:

- старая модель, которую нужно убрать из целевой process architecture.

Тогда `feature-candidates.md` перестаёт быть целевым planning layer и рассматривается только как исторический артефакт, который не должен конкурировать с backlog graph.

### Вектор C. Feature-discovery semantics

Нужно зафиксировать в `dossier-engineer` без двусмысленности:

- `feature-discovery` должен быть перепозиционирован как dossier-side shaping helper над уже выбранной работой;
- `feature-discovery` не должен оставаться normal architecture extraction path.

Recommended direction:

- `feature-discovery` не должен позиционироваться как normal architecture extraction path;
- если backlog graph уже существует, `feature-discovery` не должен дублировать extraction, а может жить только как dossier-side shaping helper or narrow cleanup tool during refactor.

### Вектор D. Handoff contract

Нужно оформить:

- откуда selected work на intake может появляться;
- как агент должен выбирать между:
  - architecture docs
  - backlog graph
  - legacy candidate artifact
  - existing dossiers

Recommended direction:

- architecture and ADR still remain upstream truth;
- backlog graph becomes the normal coverage map and normal intake source;
- legacy candidate artifact can inform cleanup or historical mapping only;
- dossiers remain the only per-feature SSoT.

### Вектор E. State mapping

Нужно позже проверить, как маппятся между собой:

- `delivery_state` в backlog graph;
- `candidate|confirmed|intaken|discarded`;
- `proposed|shaped|planned|in_progress|done|parked`.

Это уже ближе ко второму этапу, потому что здесь легко испортить оба skill-а чрезмерной “унификацией”.

Recommended direction:

- не сливать states;
- только описать legitimate crosswalk, where needed.

### Вектор F. Repo overlay ingestion

Сейчас `dossier-engineer` очень сильно завязан на repo overlays.

Нужно проверить:

- как это сочетается с first-run discipline из `backlog-engineer`;
- не провоцирует ли это premature repo spelunking до blocking preflight.

Это скорее wording problem, а не необходимость переделывать сам overlay model.

### Вектор G. Status harmonization

Нужно отдельно спроектировать:

- какие статусы в совместном процессе являются task-level;
- какие статусы являются dossier/process-level;
- какие статусы маппятся между skill-ами явно;
- какие одинаковые слова (`planned`, `implemented/done`) не означают одинаковый смысл.

Recommended direction:

- не сливать текущие модели механически;
- выделить explicit crosswalk и единый process vocabulary;
- считать harmonization status-моделей одной из центральных задач следующего этапа проектирования.

## Что логично менять в `dossier-engineer` на первом этапе

### P0. Явно признать `backlog-engineer` upstream peer, а не side tool

В `dossier-engineer` должно появиться буквальное понимание:

- рядом с ним может существовать canonical architecture backlog graph;
- это не чужой артефакт, который можно игнорировать;
- это normal upstream input for feature-shaping.

### P0. Уточнить семантику `feature-discovery`

Нужно сделать явным:

- `feature-discovery` не является normal architecture extraction path в целевой модели;
- рядом с `backlog-engineer` `feature-discovery` больше не играет роль sole architecture extraction engine;
- если он остаётся, то только как dossier-side shaping helper or narrow cleanup helper during refactor.

### P0. Уточнить семантику `feature-candidates.md`

Нужно сделать явным:

- `candidate backlog` является legacy artifact и должен быть выведен из целевой responsibility zone `dossier-engineer`;
- он не должен считаться канонической replacement-моделью для architecture backlog;
- его существование не должно закрепляться как длительный compatibility mode внутри новой process architecture.

### P1. Уточнить место architecture/ADR truth в intake

В `feature-intake`, `spec-compact`, `plan-slice` полезно будет подчеркнуть:

- legacy candidate artifact сам по себе не заменяет reread of architecture / ADR / cross-cutting constraints;
- если upstream backlog graph уже существует, он должен считаться normal planning input.

### P1. Подготовить wording для `next-step`

Не обязательно менять runtime сейчас, но полезно заранее определить:

- `next-step` в `dossier-engineer` отвечает за workflow next within dossier/process system;
- он не обязан заменять task-level sequencing from `backlog-engineer`.

## Что пока не стоит делать

### 1. Не стоит сразу тащить runtime integration

Пока рано делать:

- прямое чтение backlog-engineer root из dossier CLI;
- автоматический import task graph into dossier utility;
- shared artifact model между двумя CLI.

Это слишком рано и может переусложнить границы. Сначала нужно снять дублирование функций и выровнять process contract.

### 2. Не стоит пытаться унифицировать все state enums

Сейчас важнее:

- ясная boundary;
- ясный handoff;
- ясный wording.

А не forcing one giant shared state model.

### 3. Не стоит путать process integration с runtime coupling

Целевая методика должна считать backlog graph нормальной предпосылкой процесса, но это не означает, что на первом этапе надо:

- читать backlog-engineer artifacts напрямую из dossier CLI;
- склеивать два runtime в одну shared artifact model;
- завязывать dossier runtime на прямую техническую доступность backlog-engineer CLI.

## Принятая модель сопряжения

Принята одна модель:

- `backlog-engineer` materialize-ит backlog graph из architecture / ADR / technical decisions;
- `dossier-engineer` берёт selected work из backlog-driven процесса и ведёт dossier/spec/planning/implementation/review/closure;
- у skill-ов не должно быть дублирующей extraction-логики;
- skill-ы могут иметь разные артефакты, но должны работать как один согласованный процесс.

## Карта документов `dossier-engineer`, которые вероятнее всего потребуют правок

### `SKILL.md`

Вероятные зоны:

- overview / what this skill optimizes for
- core artifacts
- hard rules
- `feature-discovery`
- `feature-intake`
- `next-step`
- interop priority / when to use

### `references/WORKFLOW.md`

Вероятные зоны:

- candidate backlog section
- default feature flow
- wording around architecture-to-backlog translation

### `docs/utility-spec.ru.md`

Пока только на втором проходе и только если выяснится, что:

- текущий CLI contract действительно предполагает конкретную позицию candidate backlog relative to upstream architecture backlog.

То есть это не первичная точка изменений.

## Вопросы, которые могут потребовать твоего решения позже

### 1. Как именно должен быть перепозиционирован `feature-discovery`?

Варианты:

- стать dossier-side shaping helper над already-selected backlog work;
- остаться только как narrow cleanup helper during refactor;
- быть свёрнутым ещё сильнее и перестать быть отдельным primary workflow.

### 2. Нужен ли явный interop section в `dossier-engineer`

Скорее всего да.

Но надо решить:

- короткий section in `SKILL.md`
- или отдельный reference doc
- или и то и другое.

### 3. Должен ли `next-step` когда-либо смотреть на backlog-engineer state

Скорее всего это вопрос второго этапа.

Сейчас достаточно просто не обещать ложную универсальность.

## Рекомендуемая последовательность гармонизации

### Этап 1. Рефакторинг `dossier-engineer`

Фокус:

- semantics;
- boundaries;
- interop wording;
- удаление дублирующей backlog-extraction роли;
- candidate backlog removal from target process;
- feature-discovery repositioning.

### Этап 2. Проверка кросс-взаимодействия

Фокус:

- реальные agent sessions;
- handoff behavior;
- whether `backlog-engineer` needs small wording corrections for full dossier-process compatibility;
- whether any repo overlay guidance should mention both skills.

## Критерий успешного первого этапа

Первый этап можно считать успешным, если после правок:

- `dossier-engineer` больше не выглядит как альтернативный architecture backlog materializer;
- `feature-candidates.md` больше не читается как substitute for task graph или как часть целевой responsibility zone `dossier-engineer`;
- `feature-discovery` явно читается как dossier-side shaping helper or narrow cleanup helper during refactor, а не как normal extraction path;
- skill даёт агенту понятный ответ:
  - когда сначала идти в `backlog-engineer`,
  - а когда уже жить внутри dossier workflow;
- wording не создаёт у агента ложного впечатления, что planning backlog и architecture backlog — одно и то же.

## Короткий вывод

Гармонизация нужна не потому, что skill-ы фундаментально конфликтуют.

Она нужна потому, что:

- у них уже есть естественное дополнение ролей,
- но `dossier-engineer` всё ещё тащит legacy candidate-backlog модель,
- а `backlog-engineer` уже задуман как её каноническая замена.

Следовательно, первый этап должен быть направлен не на новую интеграцию, а на:

- явный вывод candidate backlog из целевой process architecture;
- перевод `dossier-engineer` на backlog-driven framing;
- жёсткую нормализацию границ между backlog graph и dossier workflow;
- отказ от дублирующей роли `dossier-engineer` как самостоятельного backlog extraction skill-а в целевой модели.
