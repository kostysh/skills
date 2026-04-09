# План рефакторинга 6: `change-proposal` cross-skill coverage for `backlog-engineer`

## Назначение

Этот план фиксирует backlog-side часть следующего harmonization cycle для `Workflow stage: change-proposal`.

Цель цикла:

- сделать `backlog-engineer` явным получателем dossier-side `backlog impact verdict`;
- превратить общий “return to backlog when truth changed” в буквальный набор `change-proposal` branches;
- убрать серые зоны:
  - `patch existing item` vs `new backlog item`
  - `source update` vs plain patch
  - multi-item/shared-rule actualization

## Нормативные источники истины

- [../../dossier-engineer/docs/change-proposal-cross-skill-use-cases.ru.md](../../dossier-engineer/docs/change-proposal-cross-skill-use-cases.ru.md)
- [../../dossier-engineer/docs/cross-skill-process-model.ru.md](../../dossier-engineer/docs/cross-skill-process-model.ru.md)
- [../SKILL.md](../SKILL.md)
- [operator-workflows.md](../references/operator-workflows.md)
- [command-reference.md](../references/command-reference.md)
- [utility-spec.ru.md](utility-spec.ru.md)

## Что уже решено и не переоткрывается

1. `backlog-engineer` остаётся единственным canonical backlog layer.
2. `attention` остаётся backlog-side read model и не входит в durable dossier handoff.
3. Truth-changing dossier stages требуют backlog actualization before closure.
4. Новый ADR из `change-proposal` должен стать backlog-relevant source.
5. Delta over already implemented work не должен переоткрывать старую implemented item как будто история “отменена”.

## Проблема

Сейчас `backlog-engineer` уже знает общий принцип:

- если dossier work меняет backlog truth, возвращайся в backlog.

Но этого недостаточно для `change-proposal`.

Агенту не хватает буквального decision tree:

- когда dossier-side verdict `no-op` действительно закрывает backlog path;
- когда нужен `patch-item`;
- когда сначала обязателен `refresh`;
- когда вместо patch нужно завести новую backlog item;
- как вести себя при multi-item/shared-source impact.

## Целевой backlog-side end state

После этого цикла `backlog-engineer` должен:

- иметь явный `change-proposal` section в cross-skill workflow;
- принимать dossier-side `backlog impact verdict` как input branch selector;
- давать буквальный workflow для каждого verdict-а;
- отдельно регулировать:
  - same-item executable follow-up
  - ADR/source update
  - delta over implemented work
  - shared cross-cutting remediation

Operator-visible completion signal для backlog-side branches должен быть ясен заранее:

- `no-op` -> backlog side не делает mutation и это подтверждается явно;
- `patch existing item` -> existing item updated before dossier stage closure;
- `source update` -> immediate next action is always source registration/refresh first; then all known impacted items are patched; only after that optional new work may be created if the refreshed source still implies separate delta work;
- `new backlog item` -> старая история остаётся честной, новая item создана и связана с исходной.

## Package 1. `change-proposal` workflow branches in skill and references

### Goal

Сделать cross-skill backlog actualization после `change-proposal` буквальной частью skill contract.

### Scope

- [../SKILL.md](../SKILL.md)
- [../references/operator-workflows.md](../references/operator-workflows.md)
- [../references/command-reference.md](../references/command-reference.md)

### Что меняем

- добавляем явный backlog-side workflow для dossier `change-proposal`;
- фиксируем input contract:
  - dossier-side `backlog impact verdict` приходит в backlog как handoff decision;
- описываем четыре verdict-driven ветки:
  - `no-op`
  - `patch existing item`
  - `source update`
  - `new backlog item`

### На чём делаем акцент

- `no-op` means no backlog mutation and no backlog rediscovery;
- `patch existing item` means actualize known backlog facts without inventing a new work unit;
- `source update` means refresh/register source first, then patch dependent items, then create new work only if needed;
- `new backlog item` means keep old item state honest and author a truly separate delta item.
- при mixed source+work change primary branch = `source update`; dependent item patching или new item creation происходят уже внутри этой ветки.

### Acceptance

- `backlog-engineer` больше не вынуждает агента самому собирать `change-proposal` workflow из общих правил;
- verdict-driven branches описаны в `SKILL.md` и references одинаково;
- `no-op` больше не требует backlog-side re-interpretation.

## Package 2. Special cases and side-effect guards

### Goal

Закрыть наиболее дорогие edge cases, чтобы агент не вёл себя непоследовательно на mature work и shared changes.

### Scope

- [../SKILL.md](../SKILL.md)
- [../references/operator-workflows.md](../references/operator-workflows.md)
- [utility-spec.ru.md](utility-spec.ru.md)
- [../test/](../test/), если понадобятся docs/spec guards

### Что меняем

- explicitly document:
  - `implemented item stays implemented; new delta becomes new item`;
  - ADR created during `change-proposal` must be registered/refreshed and relinked to dependent items;
  - shared source changes may require batched patching of several items and optional shared remediation packet;
  - `refresh` is mandatory before patch when outcome derives from changed registered source.

### На чём делаем акцент

- avoid false lifecycle downgrade of already-implemented work;
- avoid source refresh without dependent-item relinking;
- avoid partial sync when one dossier changed but the shared backlog graph stayed stale;
- keep batching deterministic enough that the operator understands what got patched and what became new work.

Hard rule for shared-source changes:

- dossier stage must not close until all known impacted backlog items are patched or explicitly split into new backlog work;
- partial sync is not an allowed end state.

### Acceptance

- backlog-side delta path no longer reopens old history by default;
- ADR/source-update path includes dependent-item relinking, not only source registration;
- shared cross-cutting changes have an explicit multi-item actualization path.

## Review strategy

Этот цикл primarily docs/spec/process, but it affects command semantics:

- внешний `spec-conformance` audit обязателен;
- UX review нужен с двух ролей:
  - оператор
  - агент
- `code` / `security` аудиты нужны только если реальный runtime/spec code будет затронут beyond docs/tests guards.

## Definition of done

Цикл считается завершённым, только если одновременно выполнено всё:

- `backlog-engineer` умеет явно принимать dossier-side `backlog impact verdict`;
- `no-op`, `patch existing item`, `source update`, `new backlog item` имеют буквальные backlog-side branches;
- mixed source+work changes use `source update` as the primary branch and never skip source registration/refresh;
- delta over implemented work больше не висит на implicit judgment агента;
- ADR created during `change-proposal` обязательно ведёт к correct source registration/refresh and dependent-item relinking;
- shared cross-cutting changes имеют явный multi-item actualization path;
- partial sync is explicitly forbidden as a closure outcome.
