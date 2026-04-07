# План рефакторинга 5 `@kostysh/backlog-engineer-cli`

## Назначение

Этот документ фиксирует следующий маленький corrective pass после анализа реальной сессии backlog creation, где агент сузил source set до одного архитектурного документа и не подтянул ADR и другие архитектурные входы.

Новый большой follow-up цикл не нужен. Проблема лежит в agent contract и reference workflow, а не в runtime утилиты.

## Проблема

Текущий skill правильно требует:

- preflight по `system state`
- source of truth для `delivery_state`

Но после этого не вводит такой же жёсткий blocking step для полного source-set discovery.

В результате агент может:

- принять один документ как `anchor source`
- ошибочно трактовать его как `exclusive source`
- слишком рано перейти к `template packet` и packet authoring
- использовать planning backlog как quasi-substitute для extraction из concept / architecture / ADR

Это особенно опасно для partially implemented репозиториев, где архитектурный документ сам может ссылаться на:

- upstream concept documents
- ADR
- repo-level engineering contracts
- integration notes

## Scope

В работу входят только docs/skill changes:

1. mandatory source-set gate после preflight
2. explicit distinction between `anchor source` and `exclusive source`
3. self-expanding source graph rule
4. minimum source set for partially implemented repositories
5. explicit ban on substituting architecture/ADR extraction with planning backlog docs

Вне scope:

- новые CLI flags
- runtime validation of “all relevant sources registered”
- repo-specific overlay changes outside этого skill
- новые command DTO или output changes

## Зафиксированные решения

### 1. Source-set gate обязателен

После preflight агент не имеет права сразу переходить к `register-source` / `template packet` / packet authoring.

Сначала он обязан:

- перечислить полный source set, который будет использовать;
- кратко понять роль каждого источника.

До закрытия source-set gate packet authoring не начинается.

### 2. `based on X` != `only from X`

Если оператор пишет:

- `based on system.md`

это означает:

- `system.md` is the anchor source

но не означает:

- only `system.md`

Исключение:

- только если оператор явно сказал `only from X`.

### 3. Self-expanding source graph

Если уже прочитанный источник:

- ссылается на concept document
- перечисляет ADR
- указывает cross-cutting contracts
- или явно говорит, что основан на других canonical sources

то эти источники становятся mandatory inputs, если оператор не исключил их явно.

### 4. Минимальный source set для partially implemented repositories

Для partially implemented repository первый backlog source set должен включать минимум:

- architecture anchor source
- source of truth for `delivery_state`
- repo-level cross-cutting ADR / decisions, если они объявлены как canonical
- upstream concept/system-definition sources, на которые architecture source явно опирается

### 5. Planning backlog не заменяет extraction

Planning backlog documents:

- могут помогать с task names
- ownership
- delivery hints

но не могут заменять extraction:

- claims
- constraints
- policies
- contracts
- cross-cutting decisions

из concept / architecture / ADR sources.

## Пакеты изменений

### Package 1. Source-set gate in `SKILL.md`

#### Цель

Сделать source discovery обязательным blocking step между preflight и packet authoring.

#### Что меняем

- [SKILL.md](../SKILL.md)

#### Что делаем

- добавляем новый mandatory step после preflight:
  - `source-set gate`
- фиксируем правило:
  - do not register sources or author the first packet until the full source set is identified
- добавляем правило `anchor source` vs `exclusive source`
- добавляем буквальный negative rule:
  - planning backlog docs must not substitute extraction from concept / architecture / ADR sources

#### Acceptance

- `SKILL.md` больше не позволяет читать first-run flow как:
  - preflight solved -> packet authoring can start immediately
- в основном skill contract явно записано, что после preflight сначала надо определить полный source set

### Package 2. Workflow/reference alignment

#### Цель

Сделать references такими же директивными, как основной skill contract.

#### Что меняем

- [references/document-to-packet-workflow.md](../references/document-to-packet-workflow.md)
- [references/first-backlog-walkthrough.md](../references/first-backlog-walkthrough.md)
- [references/operator-workflows.md](../references/operator-workflows.md)

#### Что делаем

- в `document-to-packet-workflow.md`:
  - вводим отдельный source-set gate
  - добавляем self-expanding source graph rule
  - добавляем anchor vs exclusive source rule
  - добавляем minimum source set for partially implemented repos
  - фиксируем, что planning backlog docs do not substitute architecture/ADR extraction
- в `first-backlog-walkthrough.md`:
  - после preflight вставляем отдельный шаг source-set discovery
  - только после него идут registration и packet authoring
  - single-source happy path больше не должен выглядеть как default for real repositories
- в `operator-workflows.md`:
  - `Create backlog from architecture` уточняется как:
    - preflight
    - source-set gate
    - register all relevant sources
    - template packet
    - author packet

#### Acceptance

- walkthrough больше не нормализует одноисточниковое мышление как default;
- references и `SKILL.md` одинаково направляют агента к полному source set;
- ADR и upstream concept documents становятся обязательными input-ами, если architecture source сам на них опирается.

### Package 3. Optional downstream note

#### Цель

Зафиксировать границу этого corrective pass.

#### Что меняем

- [README.md](README.md), только если нужно проиндексировать новый план

#### Что делаем

- добавляем этот план в индекс docs
- явно не расширяем scope до repo-specific overlays

#### Acceptance

- новый corrective plan индексируется;
- не возникает ложного ожидания, что этот pass меняет runtime или внешний repo overlay.

## Порядок выполнения

1. Package 1
2. Package 2
3. Package 3

## Review strategy

Этот corrective pass docs-only, поэтому:

- локальная приёмка обязательна;
- focused docs/skill contract review уместен;
- runtime review cycle не нужен, пока не меняется код утилиты.

## Definition of done

Цикл считается завершённым только если одновременно выполнено всё:

- `SKILL.md` содержит явный source-set gate;
- `anchor source` и `exclusive source` разведены буквально;
- self-expanding source graph rule зафиксирован в skill и references;
- partially implemented repositories требуют minimum source set, включающий ADR/upstream concept inputs, если architecture source на них опирается;
- walkthrough больше не подталкивает к single-source packet authoring по умолчанию;
- planning backlog docs явно не подменяют extraction из concept / architecture / ADR sources.
