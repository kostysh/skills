# План рефакторинга 3 `@kostysh/backlog-engineer-cli`

## Назначение

Этот документ переводит замечания из:

- [session-usage-analysis-2026-04-07.ru.md](session-usage-analysis-2026-04-07.ru.md)
- [session-usage-analysis-codex-2026-04-07-codex.ru.md](session-usage-analysis-codex-2026-04-07-codex.ru.md)
- [refactoring-plan-2.ru.md](refactoring-plan-2.ru.md)

в последовательный execution plan.

Это не новая продуктовая спецификация. Базовые нормы уже зафиксированы в:

- [process-cli.ru.md](process-cli.ru.md)
- [utility-spec.ru.md](utility-spec.ru.md)
- [schemas-and-types.ru.md](schemas-and-types.ru.md)
- [module-interfaces.ru.md](module-interfaces.ru.md)
- [test-matrix.ru.md](test-matrix.ru.md)

Задача этого документа:

- определить точный порядок follow-up исправлений;
- отделить docs-only исправления от runtime changes;
- зафиксировать уже принятые решения, чтобы не переоткрывать их в процессе;
- задать deliverables, acceptance и review scope для каждого пакета изменений.

## Зафиксированные решения

Эти решения уже приняты и не обсуждаются заново в ходе follow-up цикла:

- первый шаг агента при создании backlog:
  - не исследование системы,
  - а анализ запроса оператора и выявление недостающих предпосылок;
- если состояние системы и источник оценки `delivery_state` не указаны явно:
  - агент задаёт один короткий вопрос;
  - затем останавливается и ждёт ответ;
- default strategy для нового backlog:
  - `coverage-first backlog`;
- если система частично реализована:
  - backlog обязан включать архитектурно значимые уже реализованные задачи;
- если неопределённость можно превратить в отдельную работу:
  - агент обязан создать `clarification` / `investigation` / `decision` task;
  - нельзя оставлять новый backlog только с заблокированными `gap`-задачами;
- `--backlog-root` не вводим;
- новый enum/registry для taxonomy не вводим;
- help не должен превращаться в dump схемы;
- хороший критерий для help:
  - печатать всё, что строго валидируется;
  - печатать всё, что меняет mental model команды;
- machine-facing command output должен использовать absolute filesystem paths;
- внутренняя storage-модель утилиты может оставаться relative;
- generated backlog `AGENTS.md` должен различать:
  - authored drafts;
  - canonical immutable copies;
- batch registration источников не является обязательным исправлением этого цикла.

## Что входит в scope

### Docs and skill scope

- `SKILL.md`
- `references/data-model.md`
- `references/command-reference.md`
- `references/document-to-packet-workflow.md`
- новый короткий tutorial/walkthrough в `references/`
- generated backlog `AGENTS.md` template

### Runtime scope

- help output ключевых команд;
- machine-facing path fields в command output;
- packet template richness;
- при необходимости `next_commands`

### Out of scope

- новый high-level import/snapshot workflow;
- `--backlog-root`;
- новый taxonomy registry;
- derived `todo` из `gaps`;
- batch registration как обязательная часть этого цикла.

## Стратегия выполнения

Следовать в таком порядке:

1. сначала закрыть agent contract в `SKILL.md`;
2. затем сделать references действительно самодостаточными;
3. затем привести generated `AGENTS.md` к тому же contract;
4. только после этого менять runtime help/output/template;
5. затем синхронизировать нормативные docs и тесты там, где реально меняется поведение утилиты.

Причина:

- текущие основные дефекты находятся не в алгоритмах графа, а в том, что агент не получает достаточно жёсткий и однозначный operational contract;
- если сначала менять runtime, а skill оставить неоднозначным, повторится та же UX-ошибка при следующей сессии.

## Пакеты изменений

Чтобы не растягивать цикл, follow-up grouped в 5 пакетов.

Каждый пакет должен закрываться целиком, а не частями.

## Package 1. Agent contract hardening

### Цель

Жёстко нормализовать поведение агента в первом реальном сценарии без изменения runtime.

### Что меняем

- [SKILL.md](../SKILL.md)
- [references/document-to-packet-workflow.md](../references/document-to-packet-workflow.md)

### Что включаем

- preflight как `operator-input-first` contract;
- буквальный запрет:
  - до ответа оператора агент не должен идти в repo, чтобы самостоятельно выводить implementation state;
- default strategy:
  - `coverage-first backlog`;
- жёсткое правило:
  - если неопределённость можно выразить как отдельную работу, агент обязан создать `clarification` / `investigation` / `decision` item;
- path/root mental model на уровне skill;
- буквальное правило:
  - `register-source` для одного backlog root только строго последовательно;
- `What to expect in output` для ключевых команд, где агенту легко ошибиться;
  - только на high-level;
  - без дублирования command-level details из reference docs;
- объяснение authored draft vs canonical immutable copy на уровне skill.

### Acceptance

- `SKILL.md` больше не подталкивает агента к repo spelunking на первом шаге;
- правила `coverage-first`, `gap -> explicit work`, serial-only registration и path/root model видны прямо в skill;
- first-run decisions принимаются по `SKILL.md`, а не по устным пояснениям.

## Package 2. Reference normalization for first-run authoring

### Цель

Сделать references достаточными для первого packet authoring без чтения `src/`.

### Что меняем

- [references/data-model.md](../references/data-model.md)
- [references/command-reference.md](../references/command-reference.md)
- [references/examples-and-templates.md](../references/examples-and-templates.md)

### Что включаем

- exact shape для `target_system`;
- exact shape для `as_built`;
- допустимые value kinds:
  - primitive;
  - array of primitive;
  - no nested objects;
- 1-2 канонических примера;
- чёткое разделение:
  - strict enum fields;
  - starter vocabulary fields;
- одно нормативное место для strict/free-form distinction:
  - только `references/data-model.md`;
- `examples-and-templates.md` использовать только как иллюстрации, не как дополнительный нормативный слой;
- `command-reference.md` усилить там, где нужно объяснить output и command contract, но не дублировать data model.

### Acceptance

- первый packet можно authoring без чтения `src/`;
- strict/free-form distinction живёт в одном нормативном месте;
- examples не создают новый конкурирующий contract.

## Package 3. Local contract consistency

### Цель

Убрать противоречие между generated backlog `AGENTS.md` и штатным workflow skill-а.

### Что меняем

- [src/templates/render-agents-template.ts](../src/templates/render-agents-template.ts)
- [assets/backlog-agents.template.md](../assets/backlog-agents.template.md), если используется как канонический шаблон
- [SKILL.md](../SKILL.md), если требуется синхронная формулировка

### Что включаем

- authored draft packet/patch files до apply редактировать можно;
- вручную нельзя редактировать:
  - `.backlog.json`
  - `.backlog/*`
  - `reports/`
  - canonical import copies;
- generated text обязан явно разводить:
  - authored drafts;
  - canonical immutable copies.

### Acceptance

- local `AGENTS.md` больше не конфликтует со штатным workflow packet/patch;
- wording rule-by-rule, без двусмысленности.

## Package 4. CLI discoverability and output ergonomics

### Цель

Сделать CLI более понятным для агента без усложнения продуктовой модели.

### Что меняем

- help output ключевых команд;
- machine-facing output contracts;
- query-command root-discovery messaging;
- при необходимости `next_commands`.

### Минимальный набор команд в scope

Этот пакет точно должен покрыть:

- `register-source`
- `template`
- `packet`
- `status`
- `queue`
- `gaps`
- `attention`

Этот список минимальный, а не исчерпывающий.

Команды вроде:

- `search`
- `items`
- `list-sources`
- `refresh`

не обязаны входить в этот follow-up пакет автоматически, но их help/output contract позже должен быть приведён к тем же правилам, если они затрагиваются изменениями или отдельным follow-up циклом.

### Что включаем

- общий help contract:
  - печатать всё, что строго валидируется;
  - печатать всё, что меняет mental model команды;
  - не превращать help в dump схемы;
- сюда входит:
  - allowed values;
  - root expectations;
  - cwd/root resolution;
  - mutation sequencing warnings;
  - path output model, если он materially matters;
- отдельная подзадача внутри пакета:
  - query-команды должны явно говорить, что они backlog-scoped и зависят от root discovery;
- machine-facing output:
  - JSON fields;
  - structured stdout blocks;
  - exported paths from commands;
  должны использовать absolute filesystem paths;
- внутренняя storage-модель может оставаться relative;
- `next_commands` улучшать только после нормализации help/output и только там, где они реально помогают.

### Тестовый контракт пакета

Сразу планировать:

- golden/snapshot-level tests для help output;
- golden/snapshot-level tests для machine-facing output contracts;
- обновление golden fixtures только вместе с осознанным изменением contract.

### Граница пакета

- этот пакет отвечает за общий help contract и output ergonomics;
- он также включает backlog-scoped query behavior;
- отдельного пакета для `--backlog-root` нет и не будет.

### Acceptance

- help discoverable, но не schema dump;
- query-команды не выглядят "глобальными";
- machine-facing output paths стали однородными;
- `next_commands` не шумят и не пустуют без причины.
- help и machine-facing outputs покрыты golden/snapshot-level tests, чтобы contract не расползался.

## Package 5. Authoring ergonomics and final walkthrough

### Цель

Улучшить первый production-like сценарий после того, как skill, references и CLI contract уже приведены в порядок.

### Что меняем

- `template packet`
- [references/examples-and-templates.md](../references/examples-and-templates.md)
- новый walkthrough в `references/`
- [README.md](README.md)

### Что включаем

- richer starter template:
  - placeholders для source ids;
  - starter blocks для `target_system` / `as_built`;
  - field expectations для ключевых секций;
- не добавлять:
  - `--from-source`
  - source-derived magic;
- после завершения Packages 1-4:
  - добавить канонический end-to-end walkthrough, например `first-backlog-walkthrough.md`;
- walkthrough должен описывать уже финальный workflow:
  - final preflight;
  - final packet template;
  - final path/root model;
  - final output expectations.
- остальные документы должны на walkthrough ссылаться, а не дублировать его пошаговое содержание.

### Acceptance

- `template packet` materially useful на первом authoring pass;
- walkthrough описывает уже финальный, а не промежуточный workflow;
- новый агент может пройти первый реальный сценарий без чтения `src/`.

## Порядок выполнения

Соблюдать такой порядок:

1. Package 1
2. Package 2
3. Package 3
4. Package 4
5. Package 5

Причина:

- сначала закрываются дефекты agent contract;
- затем выравнивается нормативный reference layer;
- потом исправляется generated local contract;
- затем приводятся в порядок CLI help/output;
- walkthrough и richer template делаются в самом конце, когда базовый workflow уже стабилен.

## Что требует runtime review discipline

Полный implementation process для утилиты нужен только там, где меняется runtime behavior или runtime-generated artifacts:

- Package 3
- Package 4
- Package 5

Для этих пакетов применять тот же процесс, что и для основной имплементации утилиты:

- один пакет за раз;
- локальная приёмка;
- затем review gate;
- затем фикс находок;
- затем коммит.

## Критерии завершения follow-up цикла

Follow-up цикл закрыт только если одновременно выполнено всё:

- `SKILL.md` жёстко фиксирует:
  - preflight question contract;
  - прямой запрет идти в repo до ответа оператора, если system state не задан;
  - `coverage-first backlog`;
  - `gap -> clarification/investigation/decision task`;
  - sequential source registration;
- references самодостаточны для первого packet authoring;
- `references/data-model.md` является единственным нормативным местом для strict/free-form distinction;
- generated `AGENTS.md` больше не конфликтует с authored packet/patch workflow;
- help стал discoverable, но не превратился в schema dump;
- machine-facing output paths стали absolute;
- walkthrough существует и описывает уже финальный workflow;
- первый production-like scenario можно пройти без чтения `src/`.

## Короткий итог

Этот цикл исправлений должен улучшить не столько "мощность" утилиты, сколько качество её agent contract.

Цель цикла:

- убрать неоднозначность первого шага;
- убрать конфликт между skill и generated backlog rules;
- сделать first-run authoring self-sufficient;
- снизить path/root confusion;
- оставить модель backlog простой, но значительно более директивной для агента.
