# Gap analysis: `backlog-engineer` vs согласованный кросс-скил процесс

## Назначение

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

Основной remaining gap не в backlog core, а в explicit interop contract с dossier workflow.

То есть для `backlog-engineer` нужен не тяжёлый рефакторинг, а:

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

## Где есть явные пробелы

### P0. Нет буквального handoff contract from backlog to dossier

Сейчас в `backlog-engineer` не зафиксировано достаточно явно:

- что происходит после выбора selected work;
- как selected work передаётся в dossier workflow;
- что `dossier-engineer` является normal downstream layer для выбранной work.

Почему это важно:

- без этого агент может воспринимать `backlog-engineer` как замкнутую planning utility без явного продолжения;
- combined process останется в голове, а не в skill contract.

Что нужно:

- явный interop section;
- literal rule:
  backlog chooses work -> dossier owns local lifecycle.

### P0. Нет explicit backlog status actualization contract after dossier steps

Процессная модель теперь требует:

- shaping/specification -> backlog `delivery_state = specified`, when evidence is sufficient;
- planning -> backlog `delivery_state = planned`, when evidence is sufficient;
- implementation/closure -> backlog `delivery_state = implemented`, when evidence is sufficient;
- dossier-side blockers/dependencies/context facts -> backlog update through `backlog-engineer`.

Сейчас skill такого literal cross-skill rule не содержит.

Что нужно:

- добавить explicit rule в `SKILL.md`;
- добавить operator workflow for “update backlog after dossier step”;
- добавить examples/patch guidance for these status changes.

### P0. Не зафиксирована граница между backlog `next` и dossier `next-step`

Сейчас:

- `backlog-engineer` хорошо объясняет `queue`, `attention`, `ready_for_next_step`;
- но не говорит буквально, что dossier `next-step` — это другой, более локальный вопрос.

Что нужно:

- зафиксировать, что backlog layer determines whether work can move;
- dossier layer determines how the selected work moves locally;
- не допускать ложной конкуренции между backlog `queue` and dossier `next-step`.

## Где есть недоопределённость

### P1. Dossier artifacts пока не названы supporting backlog inputs

Целевой процесс предполагает, что backlog может актуализироваться после dossier-side facts:

- new blockers;
- new dependencies;
- refined scope;
- implementation evidence;
- context changes.

Сейчас `backlog-engineer` умеет работать с source registration и refresh/sync, но не проговаривает dossier artifacts как нормальный supporting source in combined workflow.

Что нужно:

- явно разрешить dossier artifacts как valid supporting evidence for backlog sync;
- не подменяя architecture / ADR, но признавая dossier-side discovered facts как легитимный input для patch/refresh decisions.

### P1. Нет explicit distinction `implemented` vs dossier `done`

Сейчас `backlog-engineer` уже консервативен по `implemented`, но combined process требует ещё более явного contrast:

- `implemented` = capability exists;
- dossier `done` = delivered and aligned under process discipline.

Что нужно:

- отдельная note в interop section;
- не допускать naive `done -> implemented` wording.

### P1. Нет explicit distinction `planned` vs dossier `planned`

Сейчас backlog `planned` и dossier `planned` легко спутать.

Что нужно:

- brief crosswalk note;
- reminder that same word does not mean same state layer.

## Конфликты в references

### P1. `operator-workflows.md` не описывает dossier handoff

Сейчас workflows покрывают:

- create backlog
- add module
- refresh
- show state
- check one source/task

Но нет workflow вида:

- choose next work in backlog -> handoff to dossier workflow;
- after dossier shaping/planning/implementation -> return to backlog for explicit status actualization.

Это уже нужно combined process.

### P1. `command-reference.md` не помогает агенту думать cross-skill

Сейчас command reference сильный внутри backlog domain, но не объясняет:

- когда backlog mutation нужен после dossier-side step;
- что patch/status refresh может быть driven by dossier evidence.

### P1. `examples-and-templates.md` не показывает dossier-driven status updates

Нужны примеры:

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

## Карта изменений по слоям

| Layer | Required changes |
| --- | --- |
| `SKILL.md` | add interop section, add backlog-status-actualization rules, narrow relation to dossier `next-step` |
| `references/operator-workflows.md` | add dossier handoff and return-to-backlog workflows |
| `references/command-reference.md` | add cross-skill interpretation notes for patch/refresh/status after dossier steps |
| `references/examples-and-templates.md` | add dossier-driven patch examples |
| runtime/spec | probably minor or no immediate changes unless later process review exposes missing command support |

## Приоритеты

### P0

- add explicit backlog -> dossier handoff
- add explicit backlog status actualization after dossier steps
- add explicit boundary between backlog `next` and dossier `next-step`

### P1

- recognize dossier artifacts as supporting backlog inputs
- add status crosswalk notes
- extend workflows and examples

### P2

- optional runtime/help polish once new process wording stabilizes

## Definition of done для доработки `backlog-engineer`

`backlog-engineer` можно считать fully aligned with the combined process, если одновременно верно следующее:

1. Skill literally states that dossier workflow is downstream of selected backlog work.
2. Skill literally states when to return from dossier workflow to backlog for status actualization.
3. Skill no longer leaves ambiguity between backlog `queue/status/gaps/attention` and dossier `next-step`.
4. References and examples show dossier-driven backlog updates explicitly.
5. No new duplicate planning/extraction role is added to `backlog-engineer`; it stays the canonical backlog layer.
