# Gap analysis: `backlog-engineer` vs согласованный кросс-скил процесс

## Назначение

Статус документа:

- это historical gap-analysis, который использовался для подготовки stage-2 harmonization;
- перечисленные ниже gaps уже закрыты в текущих версиях `backlog-engineer` и `dossier-engineer`;
- документ сохраняется для traceability и объясняет, почему появился [refactoring-plan-4.ru.md](refactoring-plan-4.ru.md);
- текущий нормативный источник — [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md) плюс актуальные `SKILL.md` и `references/*` обоих skill-ов.

Этот документ фиксирует расхождения между:

- текущим состоянием `backlog-engineer`;
- и целевым процессом из [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md).

Задача документа:

- отделить уже совместимые части от missing interop contract;
- показать, что в `backlog-engineer` уже хорошо;
- выявить, что потом нужно будет подправить для полной совместимости с dossier-driven downstream process.

## База сравнения

Сравнение выполнено против:

- [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)
- текущего `backlog-engineer` skill contract
- текущих `backlog-engineer` references for operator workflows, command reference, and data model

## Короткий вывод

`backlog-engineer` уже в целом ближе к целевому процессу, чем `dossier-engineer`.

Его core model уже совпадает с новой архитектурой:

- backlog graph извлекается из architecture / ADR;
- backlog используется для выбора следующей работы;
- planning docs не подменяют extraction;
- skill уже отделяет backlog-level states от внешних planning-state labels.

Исторически основной gap был не в backlog core, а в explicit interop contract с dossier workflow.

Именно поэтому для `backlog-engineer` потребовался не тяжёлый рефакторинг, а:

- явный handoff to `dossier-engineer`;
- явные правила backlog status actualization after downstream steps;
- буквальное разведение backlog `next` и dossier `next-step`;
- синхронизация references/examples с этим process contract.

## Что уже соответствует целевому процессу

### 1. `backlog-engineer` уже является canonical backlog extraction layer

Совпадает:

- architecture / ADR / technical decisions -> backlog graph;
- source-set gate;
- coverage-first backlog;
- task graph как canonical backlog layer.

Это полностью соответствует target process.

### 2. Skill уже умеет выбирать следующую работу через backlog state

Совпадает:

- `status`
- `queue`
- `gaps`
- `attention`
- `items`
- `search`

То есть project-level / task-level next уже живёт в правильном skill.

### 3. Skill уже не смешивает backlog `delivery_state` с planning-state labels

Совпадает:

- `intaken` и другие planning labels не превращаются автоматически в canonical backlog semantics;
- `delivery_state` строится по evidence.

Это важная часть будущего harmonization.

### 4. Skill уже держит status model, пригодную для combined process

Совпадает:

- `delivery_state`
- `gaps`
- `needs_attention`
- `attention_reasons`
- `ready_for_next_step`
- utility-owned `todo`

Эти dimensions уже хорошо подходят для backlog layer в кросс-скил процессе.

## Исторические пробелы, закрытые в stage 2

### P0. Не было буквального handoff contract from backlog to dossier

До stage 2 в `backlog-engineer` не было достаточно явно зафиксировано:

- что происходит после выбора selected work;
- как selected work передаётся в dossier workflow;
- что `dossier-engineer` является normal downstream layer для выбранной work.

Почему это было важно:

- без этого агент может воспринимать `backlog-engineer` как замкнутую planning utility без явного продолжения;
- combined process останется в голове, а не в skill contract.

Что было сделано:

- явный interop section;
- literal rule:
  backlog chooses work -> dossier owns local lifecycle.

### P0. Не было explicit backlog status actualization contract after dossier steps

Процессная модель требовала:

- shaping/specification -> backlog `delivery_state = specified`, when evidence is sufficient;
- planning -> backlog `delivery_state = planned`, when evidence is sufficient;
- implementation/closure -> backlog `delivery_state = implemented`, when evidence is sufficient;
- dossier-side blockers/dependencies/context facts -> backlog update through `backlog-engineer`.

До stage 2 skill не содержал такого literal cross-skill rule.

Что было сделано:

- добавить explicit rule в `SKILL.md`;
- добавить operator workflow for “update backlog after dossier step”;
- добавить examples/patch guidance for these status changes.

### P0. Не была зафиксирована граница между backlog `next` и dossier `next-step`

До stage 2:

- `backlog-engineer` хорошо объясняет `queue`, `attention`, `ready_for_next_step`;
- но не говорит буквально, что dossier `next-step` — это другой, более локальный вопрос.

Что было сделано:

- зафиксировать, что backlog layer determines whether work can move;
- dossier layer determines how the selected work moves locally;
- не допускать ложной конкуренции между backlog `queue` and dossier `next-step`.

## Исторические недоопределённости, закрытые в stage 2

### P1. Dossier artifacts не были названы supporting backlog inputs

Целевой процесс предполагал, что backlog может актуализироваться после dossier-side facts:

- new blockers;
- new dependencies;
- refined scope;
- implementation evidence;
- context changes.

До stage 2 `backlog-engineer` умел работать с source registration и refresh/sync, но не проговаривал dossier artifacts как нормальный supporting source in combined workflow.

Что было сделано:

- явно разрешить dossier artifacts как valid supporting evidence for backlog sync;
- не подменяя architecture / ADR, но признавая dossier-side discovered facts как легитимный input для patch/refresh decisions.

### P1. Не было explicit distinction `implemented` vs dossier `done`

До stage 2 `backlog-engineer` уже был консервативен по `implemented`, но combined process требовал ещё более явного contrast:

- `implemented` = capability exists;
- dossier `done` = delivered and aligned under process discipline.

Что было сделано:

- отдельная note в interop section;
- не допускать naive `done -> implemented` wording.

### P1. Не было explicit distinction `planned` vs dossier `planned`

До stage 2 backlog `planned` и dossier `planned` было легко спутать.

Что было сделано:

- brief crosswalk note;
- reminder that same word does not mean same state layer.

## Исторические reference-конфликты, закрытые в stage 2

### P1. `operator-workflows.md` не описывал dossier handoff

До stage 2 workflows покрывали:

- create backlog
- add module
- refresh
- show state
- check one source/task

Но тогда не хватало workflow вида:

- choose next work in backlog -> handoff to dossier workflow;
- after dossier shaping/planning/implementation -> return to backlog for explicit status actualization.

Это было нужно combined process и теперь закрыто.

### P1. `command-reference.md` не помогал агенту думать cross-skill

До stage 2 command reference был сильным внутри backlog domain, но не объяснял:

- когда backlog mutation нужен после dossier-side step;
- что patch/status refresh может быть driven by dossier evidence.

### P1. `examples-and-templates.md` не показывал dossier-driven status updates

Исторически для закрытия этого gap нужны были примеры:

- patch to `specified` after specification;
- patch to `planned` after planning;
- patch to `implemented` after implementation evidence;
- patch adding new `gaps` or dependencies discovered in dossier workflow.

## Что не выглядит проблемой

### 1. Core backlog model менять не нужно

Сейчас не видно необходимости менять:

- atomic task model;
- packet/patch ownership;
- source-set gate;
- queue/attention/gaps/status basics.

### 2. Utility runtime не требует жёсткой dossier coupling

На этом этапе не видно необходимости:

- читать dossier utility state напрямую;
- создавать shared runtime model;
- добавлять hard runtime dependency on `dossier-engineer`.

Нужен process interop, а не coupled runtime.

## Что закрыто сейчас

- явный backlog -> dossier handoff;
- explicit backlog status actualization after dossier steps;
- явная граница между backlog `queue/status/gaps/attention` и dossier-local `next-step`;
- dossier artifacts как supporting evidence для backlog sync;
- status crosswalk notes;
- cross-skill operator workflows и command interpretation notes.

Новые harmonization gaps должны фиксироваться уже в новом документе, а не через этот historical snapshot.

## Historical definition of done для stage-2 доработки `backlog-engineer`

`backlog-engineer` можно считать fully aligned with the combined process, если одновременно верно следующее:

1. Skill literally states that dossier workflow is downstream of selected backlog work.
2. Skill literally states when to return from dossier workflow to backlog for status actualization.
3. Skill no longer leaves ambiguity between backlog `queue/status/gaps/attention` and dossier `next-step`.
4. References and examples show dossier-driven backlog updates explicitly.
5. No new duplicate planning/extraction role is added to `backlog-engineer`; it stays the canonical backlog layer.
