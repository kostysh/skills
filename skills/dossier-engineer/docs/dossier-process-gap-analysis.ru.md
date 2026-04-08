# Gap analysis: `dossier-engineer` vs согласованный кросс-скил процесс

## Назначение

Этот документ фиксирует полный спектр расхождений между:

- текущим состоянием `dossier-engineer`;
- и целевым процессом из [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md).

Документ нужен, чтобы на следующем шаге построить точный refactoring plan для `dossier-engineer` без двусмысленностей.

## База сравнения

Сравнение выполнено против:

- [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)
- [backlog-harmonization-prep.ru.md](backlog-harmonization-prep.ru.md)
- [../SKILL.md](../SKILL.md)
- [../references/WORKFLOW.md](../references/WORKFLOW.md)
- [utility-spec.ru.md](utility-spec.ru.md)

## Короткий вывод

`dossier-engineer` сейчас расходится с целевым процессом существенно.

Главная причина:

- skill всё ещё построен вокруг legacy candidate-backlog модели;
- feature-discovery и candidate statuses всё ещё являются частью основного workflow;
- dossier workflow ещё не переопределён как downstream lifecycle для work, выбранной через `backlog-engineer`.

Итог:

- для `dossier-engineer` нужен не polish, а содержательный процессный рефакторинг;
- при этом runtime integration с backlog utility не является первым шагом;
- сначала надо исправить skill contract, workflow, state model, command semantics и только потом решать, какие runtime parts реально менять.

## Что уже совпадает с целевым процессом

### 1. Dossier как локальный feature/process SSoT

Совпадает:

- один feature = один dossier;
- dossier хранит локальный feature workflow;
- verification/review/step-close — отдельные process artifacts.

Это соответствует целевой модели.

### 2. Repo overlays и ADR уже считаются обязательными ограничителями

Совпадает:

- repo overlays ingest-ятся до planning/implementation;
- ADR уже признаются first-class constraints.

Это хорошо ложится в combined process.

### 3. Dossier уже отделяет несколько status dimensions

Совпадает:

- dossier maturity;
- coverage enforcement;
- review freshness;
- step closure;
- commit completeness.

Это полезная основа для будущего harmonization, даже если сами статусы ещё нужно пересобрать.

## Прямые конфликты с целевым процессом

### P0. Top-level identity layer всё ещё обещает explicit backlog discovery внутри `dossier-engineer`

Сейчас:

- frontmatter description в [../SKILL.md](../SKILL.md) прямо обещает `explicit backlog discovery`;
- [README.md](README.md) тоже описывает skill как workflow с `explicit backlog discovery`;
- [utility-architecture.md](utility-architecture.md) и другие surrounding docs пока не переопределены под backlog-driven downstream model.

Почему это конфликт:

- skill identity уже на первом экране обещает то, что в целевом процессе должно принадлежать `backlog-engineer`;
- даже если workflow sections потом переписать, верхний positioning layer будет продолжать уводить агента в старую модель.

Что менять:

- переписать skill description;
- переписать docs index wording;
- переписать utility architecture wording там, где workflow helpers и CLI ещё framed around candidate backlog / next-step over candidates.

### P0. Core artifacts всё ещё держат candidate backlog как нормальную часть процесса

Сейчас:

- [../SKILL.md](../SKILL.md) в `Core artifacts` всё ещё перечисляет `docs/backlog/feature-candidates.md` как canonical product doc;
- state model skill-а всё ещё содержит отдельный `Candidate backlog state`;
- references и utility spec всё ещё исходят из существования candidate backlog как нормальной рабочей поверхности.

Почему это конфликт:

- в целевом процессе “candidate” больше не означает запись в отдельном `feature-candidates.md`;
- canonical candidate universe живёт в backlog graph;
- `dossier-engineer` не должен держать собственную parallel backlog model.

Что менять:

- убрать candidate backlog из центрального process framing;
- вывести `feature-candidates.md` из core workflow и core artifact model;
- удалить его из новой версии skill-а как process surface.

### P0. `feature-discovery` конфликтует с новой ролью `backlog-engineer`

Сейчас:

- [../SKILL.md](../SKILL.md) описывает `feature-discovery` как перевод архитектуры в simple candidate backlog;
- [../references/WORKFLOW.md](../references/WORKFLOW.md) делает `feature-discovery` canonical backlog step;
- [utility-spec.ru.md](utility-spec.ru.md) продолжает считать candidate backlog частью CLI contract.

Почему это конфликт:

- в целевом процессе architecture -> backlog graph materialization принадлежит `backlog-engineer`;
- `dossier-engineer` не должен дублировать extraction из architecture / ADR;
- `feature-discovery` не может оставаться normal extraction path.

Что менять:

- удалить `feature-discovery` из новой версии skill-а completely;
- убрать его из canonical workflow, runtime contract, docs and tests;
- не оставлять helper/fallback/compatibility variant.

### P0. `feature-intake` всё ещё стартует от `CF-*`, а не от selected backlog work

Сейчас:

- `feature-intake` в skill contract и workflow исходит из candidate entry `CF-*`;
- текущий flow: `feature-discovery -> mark candidate confirmed -> feature-intake`.

Почему это конфликт:

- в целевом процессе intake начинается от backlog work, выбранной через `backlog-engineer`;
- dossier intake не должен зависеть от отдельной candidate model.

Что менять:

- переписать `feature-intake` как intake выбранной backlog work;
- ввести явный handoff contract от backlog graph к dossier workflow;
- убрать зависимость от `CF-*` как нормальной intake surface.

### P0. `next-step` сейчас смешивает backlog-level и dossier-level next

Сейчас:

- [utility-spec.ru.md](utility-spec.ru.md) для `next-step` всё ещё умеет выбирать `feature-discovery`, `feature-intake` и backlog candidates;
- [../SKILL.md](../SKILL.md) пока не переопределяет `next-step` как strictly local workflow next.

Почему это конфликт:

- в новой модели `backlog-engineer` отвечает за `что брать дальше`;
- `dossier-engineer next-step` отвечает только за `что делать дальше внутри уже выбранной работы`;
- dossier `next-step` не должен решать backlog selection problem.

Что менять:

- сузить `next-step` до dossier-local workflow only;
- убрать из его ментальной модели выбор backlog candidate;
- если work ещё не выбрана, ответ должен отсылать к backlog-driven selection, а не пытаться решать это внутри dossier workflow.

## Недостающие элементы процесса

### P0. Нет явного handoff from backlog graph to dossier workflow

Сейчас не определено буквально:

- как selected work попадает в dossier intake;
- какой минимальный набор backlog data должен быть перенесён;
- как dossier должен ссылаться на backlog work.

Что нужно:

- explicit handoff contract;
- dossier-side representation of selected backlog work;
- явное правило, что backlog остаётся upstream truth для work identity и backlog lifecycle.

### P0. Нет explicit backlog status actualization after dossier steps

Сейчас в `dossier-engineer` нет жёсткого правила:

- shaping/specification -> backlog `delivery_state = specified`;
- planning -> backlog `delivery_state = planned`;
- implementation/closure -> backlog `delivery_state = implemented`;
- новые blockers/dependencies/context facts должны возвращаться через `backlog-engineer`.

Почему это важно:

- без этого dossier workflow будет жить отдельно от backlog graph;
- backlog status будет устаревать;
- combined process не сможет оставаться backlog-driven.

Что нужно:

- встроить backlog status actualization в process contract `dossier-engineer`;
- явно указать, после каких dossier шагов агент обязан вернуться к `backlog-engineer`.

### P0. Нет жёсткого правила, что backlog selection precedes dossier workflow

Сейчас skill всё ещё легко читается так:

- discover candidate
- intake
- plan
- implement

Новая модель требует другого:

- сначала backlog-driven selection;
- только потом dossier intake.

Что менять:

- переписать high-level workflow;
- убрать впечатление, что dossier workflow может сам находить и выбирать work из architecture.

## Конфликты в state model

### P0. Candidate state нужно вывести из целевой модели

Сейчас:

- `candidate|confirmed|intaken|discarded` всё ещё часть state model.

Почему это конфликт:

- candidate universe теперь живёт в backlog graph, а не в dossier backlog file;
- держать candidate state внутри core state model `dossier-engineer` значит сохранять competing planning layer.

Что менять:

- убрать candidate state из core process model;
- не оставлять candidate-state layer anywhere in the new version of the skill.

### P1. `planned` в dossier и `planned` в backlog пока не разведены как разные смыслы

Сейчас:

- dossier `planned` означает planning maturity;
- backlog `planned` означает task-level readiness for implementation.

Конфликт:

- одинаковое слово провоцирует ложную автоматическую эквивалентность.

Что менять:

- добавить explicit crosswalk note;
- на всех process-level шагах проговорить, что dossier `planned` не автоматически равен backlog `planned`.

### P1. `done` в dossier и `implemented` в backlog пока не разведены как разные смыслы

Сейчас:

- dossier `done` — delivered and aligned feature;
- backlog `implemented` — capability exists in the system.

Что менять:

- добавить literal distinction в skill contract и workflow;
- не допускать naive mapping `done == implemented` без evidence rule.

### P1. Блокирующая логика распределена, но не сопоставлена с backlog `gaps`

Сейчас dossier-side blockers живут в:

- `coverage_gate`
- unresolved `Open question`
- review freshness
- step closure

В combined process нужен явный crosswalk:

- что должно стать backlog `gaps`;
- что остаётся чисто dossier/process blocker;
- что требует возврата в `backlog-engineer`.

## Конфликты в workflow docs

### P0. `references/WORKFLOW.md` полностью противоречит новому процессу

Сейчас он говорит:

- `feature-discovery` translates architecture into candidate backlog;
- `feature-intake` promotes one candidate;
- candidate statuses must stay current.

Это уже не совместимо с целевым процессом.

Что менять:

- переписать workflow как backlog-driven downstream process;
- убрать candidate backlog из canonical route;
- зафиксировать intake selected backlog work instead of candidate promotion.

### P0. `FEATURE_CANDIDATES_TEMPLATE.md` больше не может оставаться центральным template

Сейчас template оформлен как нормальный рабочий backlog surface.

Что менять:

- убрать его из основного reading path;
- удалить из новой версии skill-а entirely.

### P1. `REPO_AGENTS_TEMPLATE.md` и walkthrough language тоже должны перестать якорить на candidate backlog

Если repo template и surrounding docs продолжат ссылаться на candidate backlog как на expected workflow surface, skill contract снова расползётся.

## Конфликты в utility contract

### P0. Utility spec всё ещё нормативно завязана на `docs/backlog/feature-candidates.md`

Прямые проблемы в [utility-spec.ru.md](utility-spec.ru.md):

- назначение CLI включает backlog candidates как обычную сущность;
- стандартные файловые локации включают `docs/backlog/feature-candidates.md`;
- `next-step` читает candidate backlog и может возвращать `feature-discovery` / `feature-intake`;
- command semantics вокруг `feature-discovery` and candidate states остаются normative.

Что менять:

- пересобрать utility contract под backlog-driven dossier process;
- убрать candidate backlog из normal CLI contract;
- переопределить `next-step`.

### P1. Нужен новый dossier-side intake contract

Если `feature-intake` остаётся командой, ей нужен новый contract:

- input from selected backlog work;
- explicit backlog linkage;
- no dependency on `CF-*`.

## Конфликты в коде и тестах

### P0. Текущая runtime-реализация всё ещё hardcodes candidate-backlog model

Прямые сигналы:

- `src/commands.ts` использует `docs/backlog/feature-candidates.md` как normal backlog file;
- `next-step` в runtime всё ещё может вернуть `feature-discovery` и candidate-driven transitions;
- command orchestration и help surface still expose the old workflow as normal.

Почему это важно:

- без правки runtime contract документация и код снова разойдутся;
- здесь нельзя ограничиться только переписыванием `SKILL.md`.

Что менять:

- пересобрать command orchestration around backlog-driven intake;
- убрать candidate-driven behavior from normal `next-step`;
- пересмотреть lifecycle of `feature-discovery` and `feature-intake` in code.

### P1. Тесты тоже закрепляют старую модель

Сейчас:

- tests ожидают candidate-driven `next-step` behavior;
- tests implicitly assume existence of candidate backlog as normal process surface.

Что менять:

- переписать tests под new process contract;
- убрать assertions, которые нормализуют `feature-discovery -> candidate -> feature-intake` как canonical path.

## Что нужно убрать, а не просто переписать

### Убрать из canonical process framing

- `candidate backlog` как normal backlog surface;
- `feature-discovery` как architecture-to-backlog translation path;
- `feature-intake` как promotion of `CF-*` candidate;
- candidate statuses как центральное process dimension;
- `next-step` как backlog-selection helper.

### Удалить из новой версии skill-а

- `docs/backlog/feature-candidates.md` как process surface
- `FEATURE_CANDIDATES_TEMPLATE.md`
- `CF-*` vocabulary как active workflow vocabulary
- любые candidate-status transitions как часть новой process model

## Что нужно добавить

### P0 additions

- explicit upstream/downstream relation with `backlog-engineer`;
- selected-work handoff contract;
- explicit backlog status actualization rules;
- explicit `next-step` narrowing;
- literal statement that `dossier-engineer` does not create backlog from architecture.

### P1 additions

- status crosswalk notes;
- dossier field(s) or reference convention linking selected backlog work to dossier;
- guidance for syncing dossier-side discoveries back into backlog.

## Карта изменений по слоям

| Layer | Required changes |
| --- | --- |
| `SKILL.md` | major rewrite of core artifacts, state model, workflow framing, command semantics |
| `docs/README.md` | rewrite top-level positioning away from explicit backlog discovery |
| `docs/utility-architecture.md` | rewrite workflow/helper framing around downstream model |
| `references/WORKFLOW.md` | full rewrite |
| `references/FEATURE_CANDIDATES_TEMPLATE.md` | remove from the new version of the skill |
| `references/REPO_AGENTS_TEMPLATE.md` | remove candidate-backlog-first framing |
| `docs/utility-spec.ru.md` | significant rewrite of command and artifact contract |
| CLI/runtime (`src/commands.ts`, related core modules) | command re-scope for `feature-discovery`, `feature-intake`, `next-step` |
| tests | rewrite around new workflow and remove candidate-driven expectations |

## Приоритеты

### P0

- remove candidate-backlog-first process framing
- remove `feature-discovery` as normal extraction path
- redesign `feature-intake` around selected backlog work
- narrow `next-step`
- add backlog status actualization
- rewrite workflow docs

### P1

- redesign state model wording
- introduce status crosswalk
- revise utility spec
- define backlog linkage shape

### P2

- clean up remaining legacy references
- reclassify or remove templates/examples that keep old mental model alive

## Definition of done для рефакторинга `dossier-engineer`

`dossier-engineer` можно считать приведённым к новому процессу только если одновременно верно следующее:

1. Skill больше не выглядит как самостоятельный backlog-discovery system.
2. Candidate backlog больше не выглядит как normal planning surface.
3. `feature-discovery` больше не materialize-ит backlog из architecture как canonical path.
4. `feature-intake` стартует от selected backlog work.
5. `next-step` больше не конкурирует с backlog selection.
6. После dossier shaping/planning/implementation skill требует явной backlog actualization через `backlog-engineer`.
7. Документация, references, runtime contract и tests согласованы вокруг одной backlog-driven модели.
