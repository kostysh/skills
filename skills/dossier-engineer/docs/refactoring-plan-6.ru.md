# Refactoring plan 6: `change-proposal` cross-skill hardening for `dossier-engineer`

## Назначение

Этот план фиксирует dossier-side часть следующего harmonization cycle для `Workflow stage: change-proposal`.

Цель цикла:

- убрать молчаливые догадки агента о том, изменилась ли backlog truth;
- сделать `change-proposal` first-class cross-skill handoff point, а не только dossier-local editing stage;
- сохранить текущую модель skill-а:
  - без новых CLI commands;
  - без новых durable artifacts;
  - без попытки переложить backlog actualization обратно на `dossier-engineer`.

## Нормативные источники истины

- [change-proposal-cross-skill-use-cases.ru.md](change-proposal-cross-skill-use-cases.ru.md)
- [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)
- [../SKILL.md](../SKILL.md)
- [../references/workflow.md](../references/workflow.md)
- [../references/workflow-stage-change-proposal.md](../references/workflow-stage-change-proposal.md)
- [../../backlog-engineer/SKILL.md](../../backlog-engineer/SKILL.md)
- [../../backlog-engineer/references/operator-workflows.md](../../backlog-engineer/references/operator-workflows.md)

## Что уже решено и не переоткрывается

1. `change-proposal` остаётся workflow stage, а не становится новой CLI command.
2. CLI не интерпретирует prose.
3. Новые команды и новые durable artifacts для этого цикла не вводятся.
4. Backlog selection и backlog actualization остаются зоной ответственности `backlog-engineer`.
5. Если existing dossier CLI output может помочь агенту, это допустимо только как support signal, а не как замена stage-level rules.

## Проблема

Сейчас `change-proposal` уже умеет безопасно менять dossier SSoT, но не даёт агенту достаточно буквального answer на вопрос:

- `что произошло с backlog truth после этого change?`

Из-за этого даже простые сценарии распадаются на неявное рассуждение:

- backlog-side `no-op`;
- `patch existing item`;
- `source update`;
- `new backlog item`.

Это ведёт к двум типам ошибок:

- агент лишний раз трогает backlog, хотя change был dossier-local;
- агент не возвращается в backlog, хотя появились blockers, dependencies, new ADR или новый delta scope.

## Целевой dossier-side end state

После этого цикла `change-proposal` должен:

- выдавать буквальный dossier-side `backlog impact verdict`;
- требовать его до step closure;
- различать хотя бы четыре outcome class:
  - `no-op`
  - `patch existing item`
  - `source update`
- `new backlog item`
- привязывать этот verdict к observable criteria, а не к неявной “разумной интерпретации” агента;
- ссылаться на backlog-side next step как на обязательный follow-up, если verdict не `no-op`.

Operator-visible completion signal для stage должен быть понятен заранее:

- `no-op` -> можно закрывать stage без backlog mutation;
- `patch existing item` -> stage не закрывается, пока backlog item не actualized;
- `source update` -> stage не закрывается, пока source не registered/refreshed и impacted items не updated;
- `new backlog item` -> stage не закрывается, пока новая backlog item не создана и не связана с исходной историей.

## Package 1. Dossier-side classifier and stage contract

### Goal

Сделать `change-proposal` stage достаточно буквальной, чтобы агент мог принять корректное backlog decision без гадания.

### Scope

- [../SKILL.md](../SKILL.md)
- [../references/workflow-stage-change-proposal.md](../references/workflow-stage-change-proposal.md)
- [../references/workflow.md](../references/workflow.md)

### Что меняем

- добавляем в `change-proposal` явный dossier-side classifier `backlog impact verdict`;
- задаём для каждого verdict-а буквальные trigger criteria;
- закрепляем, что stage не закрывается, пока verdict не выбран явно;
- для verdict-ов, отличных от `no-op`, stage прямо указывает на backlog actualization through `backlog-engineer`.

### На чём делаем акцент

- `no-op` допускается только когда одновременно верно всё:
  - нет новых backlog-relevant blockers/dependencies/context facts;
  - не появился и не изменился canonical source;
  - не требуется executable follow-up;
- `patch existing item` используется, когда truth текущей work unit изменилась, но новая самостоятельная backlog item не нужна;
- `source update` используется, когда change создаёт или меняет canonical source, особенно ADR;
- `new backlog item` используется, когда change создаёт новый delta scope поверх mature/implemented work или явно выделяет новую самостоятельную remediation work unit.
- при смешанном case, где change и меняет canonical source, и затрагивает текущую work unit, primary verdict = `source update`; дальнейшие patch/new-item steps идут уже внутри backlog-side branch, а не конкурируют с ним.

### Acceptance

- `change-proposal` больше не заканчивается implicit question “нужно ли идти в backlog?”;
- `no-op` и non-`no-op` paths различаются буквальными criteria;
- stage contract прямо связывает non-`no-op` verdict with backlog actualization before closure.

## Package 2. Optional runtime hints through existing utility outputs

### Goal

Если это можно сделать без новых команд и без новых artifacts, уменьшить вероятность ошибочного agent reasoning during `change-proposal`.

### Scope

- [utility-spec.ru.md](utility-spec.ru.md)
- [utility-architecture.md](utility-architecture.md)
- existing dossier CLI outputs only where they already participate in `change-proposal`, primarily `contract-drift-audit`
- [../test/](../test/)

### Что меняем

- оцениваем, может ли existing dossier CLI output выдавать `backlog impact` hint в тех случаях, где инструмент уже участвует в stage;
- используем одно и то же имя везде: `backlog impact verdict`; альтернативные названия не вводим;
- если да, документируем это как support signal, а не canonical source of truth;
- если нет, явно документируем, что classifier остаётся stage-level obligation and not a runtime output contract.

### На чём делаем акцент

- runtime hint не должен подменять stage rule;
- если runtime hint disagrees with the stage-level `backlog impact verdict`, stage-level verdict wins and disagreement becomes blocking inconsistency to resolve before closure;
- mature docs-only path не должен автоматически превращаться в backlog touch только потому, что dossier is mature;
- ADR/source update path должен оставаться source-sensitive, а не drift-only.

### Acceptance

- нет новой CLI command;
- нет нового durable artifact;
- если runtime hint добавлен, он не ломает existing command meaning и не становится обязательным для закрытия stage;
- if no runtime hint is added, docs/spec explicitly say that the classifier is stage-owned.

## Review strategy

Так как план касается process contract и potentially existing utility outputs:

- внешний `spec-conformance` audit обязателен;
- `code` и `security` аудиты нужны только если пакет 2 реально затронет runtime code;
- UX review нужен с двух ролей:
  - оператор
  - агент

## Definition of done

Цикл считается завершённым, только если одновременно выполнено всё:

- `change-proposal` имеет буквальный dossier-side `backlog impact verdict`;
- `no-op`, `patch existing item`, `source update`, `new backlog item` описаны достаточно чётко, чтобы агент не додумывал их сам;
- mixed source+work changes имеют явное precedence rule: `source update` first;
- non-`no-op` verdict-и explicitly route to `backlog-engineer`;
- для каждого verdict-а описан operator-visible completion signal;
- dossier-side contract не вводит новую CLI command и не создаёт новый durable artifact;
- если runtime support появляется, он остаётся secondary hint и не подменяет stage-level classifier.
