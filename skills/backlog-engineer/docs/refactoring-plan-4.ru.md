# План рефакторинга 4 `@kostysh/backlog-engineer-cli`

## Назначение

Этот документ фиксирует маленький corrective pass после review из:

- [post-refactor-review-codex-2026-04-07.ru.md](post-refactor-review-codex-2026-04-07.ru.md)

Новый большой follow-up цикл не нужен. Scope этого плана намеренно ограничен двумя remaining first-run defects.

## Scope

В работу входят только:

1. Явный local invocation contract для CLI.
2. Единый blocking preflight question в основном skill contract.

Вне scope:

- новые runtime features;
- новые CLI flags;
- новый walkthrough format;
- пересборка help contract;
- новые traceability improvements beyond small doc sync.

## Зафиксированные решения

### 1. Канонический local invocation pattern

Для skill-local запуска canonical fallback-pattern такой:

```bash
node <skill-root>/scripts/backlog-engineer.mjs
```

Правило:

- в agent-facing wording нужно один раз явно определить, что такое `<skill-root>`:
  - директория, где лежит `SKILL.md` этого skill;
- fallback-pattern задаёт только command prefix и не меняет `cwd`;
- `cwd` должен оставаться тем каталогом, который должен якорить root discovery и path resolution для конкретной команды;
- script location и working directory не должны смешиваться в один mental model;
- bare `backlog-engineer` допустим только как optional variant для случая, когда CLI реально установлен в `PATH`;
- в agent-facing docs должно быть буквально объяснено:
  - если CLI не установлен в `PATH`, заменяй только command prefix на `node <skill-root>/scripts/backlog-engineer.mjs`, не меняя `cwd`.

### 2. Единый blocking preflight question

Primary fix делается в `SKILL.md`.

Нормативное правило:

- если оператор явно не сообщил `system state` и/или источник для вывода `delivery_state`,
  агент задаёт один короткий объединённый вопрос;
- после этого агент останавливается и ждёт ответ;
- до ответа агент не идёт в repo, код, тесты или документы, чтобы самостоятельно выводить implementation state.

После правки `SKILL.md` walkthrough синхронизируется по смыслу с тем же wording.

## Пакеты изменений

### Package 1. Invocation contract normalization

#### Цель

Убрать двусмысленность между:

- bare `backlog-engineer`
- и skill-local execution

#### Что меняем

- [SKILL.md](../SKILL.md)
- [references/first-backlog-walkthrough.md](../references/first-backlog-walkthrough.md)
- [references/command-reference.md](../references/command-reference.md)

#### Что делаем

- в `SKILL.md` явно прописываем canonical fallback-pattern для local execution;
- в `SKILL.md` и walkthrough execution note ставим до первого command example, а не ниже по тексту;
- в walkthrough и command reference добавляем execution note:
  - examples shown as `backlog-engineer ...`
  - if CLI is not in `PATH`, replace only the command prefix with `node <skill-root>/scripts/backlog-engineer.mjs`
  - do not change `cwd`, because root discovery and relative path resolution depend on the working directory
- в `command-reference` добавляем короткую note:
  - fallback invocation uses script path, but command semantics still depend on the working directory
- если упоминается bare `backlog-engineer`, это должно быть явно помечено как optional installed-path variant.

#### Acceptance

- агент, читающий только `SKILL.md` + walkthrough, не может спутать:
  - где лежит script
  - и откуда должна исполняться команда;
- `<skill-root>` определён буквально и не остаётся placeholder-ом, понятным только автору плана;
- ни один default example не требует, чтобы CLI уже был в `PATH`;
- agent-facing docs не подталкивают к `cd` в skill root для выполнения backlog-scoped команд.

### Package 2. Preflight wording hardening

#### Цель

Довести first-run preflight до одного blocking question без двухшагового dialog drift.

#### Что меняем

- [SKILL.md](../SKILL.md)
- [references/first-backlog-walkthrough.md](../references/first-backlog-walkthrough.md)

#### Что делаем

- переписываем preflight wording в `SKILL.md` так, чтобы:
  - primary step = анализ того, что уже сообщил оператор;
  - если не хватает `system state` и/или `delivery-state evidence`,
    задаётся один короткий объединённый вопрос;
  - после вопроса агент ждёт ответ;
  - запрет идти в repo до ответа остаётся буквальным и видимым;
- затем синхронизируем walkthrough, чтобы пример вопроса оставался максимально близким по смыслу.

#### Acceptance

- `SKILL.md` не допускает reading, при котором агент строит двухшаговый preflight;
- wording в walkthrough не конфликтует с `SKILL.md`;
- first-run contract снова одинаково читается из skill и walkthrough.

## Порядок выполнения

1. Package 1
2. Package 2
3. короткий doc consistency pass:
   - проверить, что `SKILL.md`, walkthrough и command reference не расходятся по invocation/preflight wording

## Review strategy

Этот corrective pass docs-only, поэтому:

- локальная приёмка обязательна;
- внешний review уместен как focused docs/skill contract review;
- runtime review cycle не обязателен, пока не меняется код утилиты.

## Definition of done

Цикл считается завершённым только если одновременно выполнено всё:

- canonical local fallback-pattern закреплён во всех agent-facing местах;
- `SKILL.md` содержит один blocking preflight question contract;
- walkthrough синхронизирован по смыслу;
- `README.md` включает новый план в индекс;
- не осталось default examples, которые молча предполагают установленный в `PATH` бинарь.
