# Анализ использования `backlog-engineer` в сессии 2026-04-07

> Исторический документ.
> Часть проблем, описанных ниже, уже исправлена после этой сессии, включая:
> - поддержку source paths вне backlog root;
> - переход на `.backlog.json` вместо `.architecture-backlog.json`.

## Назначение документа

Этот документ фиксирует разбор полного процесса использования утилиты `@kostysh/backlog-engineer-cli` в реальной сессии построения backlog для репозитория `yaagi`.

Форма документа: explanation.

Цель:

- зафиксировать, что именно происходило при работе с утилитой;
- выделить все прямые и косвенные сложности;
- отделить проблемы самой утилиты от проблем процесса и агентского слоя;
- предложить улучшения документации и CLI.

## Контекст сессии

Исходная задача:

- использовать skill `backlog-engineer`;
- построить backlog на основе `docs/architecture/system.md`;
- сохранить результат в `docs/backlog-new`;
- учесть, что система уже частично реализована;
- трактовать статус `intaken` в `docs/backlog/feature-candidates.md` как `implemented`.

Фактический результат сессии:

- создан backlog root `docs/backlog-new`;
- зарегистрированы snapshot-копии архитектуры, ADR, `README`, `feature-candidates` и `ssot/index`;
- создан и применён initial packet на 27 items;
- получены `status`, `queue`, `gaps`, `attention` и `report`.

Ключевые итоговые метрики полученного backlog:

- `implemented`: 15;
- `specified`: 1;
- `defined`: 11;
- items с `gaps`: 7;
- items `ready_for_next_step`: 3.

## Краткая хронология

1. Прочитаны skill docs, `README`, архитектура, ADR и текущий backlog кандидатов.
2. Выбран путь через реальный CLI `scripts/backlog-engineer.mjs`.
3. Выполнен `init --path docs/backlog-new`.
4. Первая попытка `register-source` провалилась из-за неочевидной семантики путей.
5. Вторая попытка с внешними путями провалилась, потому что утилита запрещает source path вне backlog root.
6. Попытка обойти ограничение через symlink внутри backlog root провалилась, потому что source не может быть symlink.
7. Источники были скопированы внутрь backlog root как snapshot-файлы.
8. Параллельная регистрация источников дала неконсистентный результат и была заменена на последовательную.
9. Сгенерирован packet template, затем packet был заполнен вручную.
10. Выполнен `packet --dry-run`, затем `packet`.
11. Сняты `status`, `queue`, `gaps`, `attention`, `report`.

## Что сработало хорошо

- CLI surface в целом соответствует заявленной модели `init -> register-source -> packet -> status`.
- Ошибки `BE_SCHEMA_INVALID` и `BE_SOURCE_READ_FAILED` достаточно конкретны, чтобы после них можно было найти реальную причину.
- `packet --dry-run` отработал как полезный предохранитель перед применением большого initial packet.
- Read models (`status`, `queue`, `gaps`, `attention`, `report`) после materialization дали консистентную картину backlog.
- Immutable packet registration действительно работает: после применения появился canonical packet и запись в `applied.json`.

## Прямые сложности

### 1. Неочевидная семантика `--path` у `register-source`

Наблюдение:

- первая попытка зарегистрировать `docs/architecture/system.md` из backlog root дала ошибку, потому что путь был интерпретирован как путь внутри backlog root, а не как путь от текущего рабочего каталога.

Что именно произошло:

- команда пыталась читать `/code/projects/yaagi/docs/backlog-new/docs/architecture/system.md`, а не `/code/projects/yaagi/docs/architecture/system.md`.

Почему это сложно:

- quick docs не акцентируют, что `register-source --path` резолвится относительно backlog root, а не просто относительно shell cwd.

Подтверждение в коде:

- [`src/commands/register-source.ts`](../src/commands/register-source.ts) вызывает `resolveCliSourcePath(...)`;
- [`src/sources/path-normalizer.ts`](../src/sources/path-normalizer.ts) использует `path.resolve(backlogRoot, inputPath)`.

### 2. Внешние пути запрещены, но это не проговорено достаточно рано

Наблюдение:

- попытка зарегистрировать `../backlog/feature-candidates.md` и `../ssot/index.md` завершилась `BE_SCHEMA_INVALID`.

Фактическое правило:

- source path обязан оставаться внутри текущего backlog root.

Подтверждение:

- [`src/sources/path-normalizer.ts`](../src/sources/path-normalizer.ts) явно выбрасывает ошибку с hint `Source path must stay inside the current backlog root.`

Почему это сложно:

- в skill workflow говорится “register-source for all documents”, но не сказано upfront, что документы сначала должны быть materialized внутри backlog root.

### 3. Symlink-источники тоже запрещены

Наблюдение:

- после создания symlink-ов внутри `docs/backlog-new/sources/*` регистрация всё равно падала с `BE_SOURCE_READ_FAILED`.

Фактическое правило:

- source-файл не может быть symbolic link;
- более того, проверяются и symlink ancestors.

Подтверждение:

- [`src/sources/source-hash-service.ts`](../src/sources/source-hash-service.ts) вызывает `ensureNoSymlinkAncestors(...)`;
- там же есть явная ветка `if (entry.isSymbolicLink)`.

Почему это сложно:

- из пользовательского workflow естественно ожидать, что “файл внутри backlog root” достаточно;
- запрет на symlink логичен для безопасности и детерминизма, но в операторском процессе он неочевиден, пока не столкнёшься с ошибкой.

### 4. Для реальной работы пришлось делать source snapshots

Наблюдение:

- из-за двух ограничений выше источники пришлось не ссылать, а копировать:
  - архитектуру;
  - ADR;
  - `README`;
  - `feature-candidates`;
  - `ssot/index`.

Почему это сложно:

- появляется второй слой файлов, который сам по себе становится объектом сопровождения;
- `refresh` теперь работает по snapshot-копиям, а не по оригиналам;
- перед любым повторным refresh сначала нужно заново обновлять snapshot-файлы.

Это не баг CLI, но это прямое операторское трение.

### 5. Параллельные мутации одного backlog root оказались небезопасны

Наблюдение:

- первая попытка зарегистрировать набор источников параллельно вернула успешные ответы по нескольким командам, но последующий `list-sources` показал только часть записей.

Практический вывод:

- file-backed mutation path не даёт безопасной параллельной записи в один backlog root;
- mutating commands нужно выполнять последовательно.

Почему это сложно:

- общая агентская среда поощряет параллелизм при независимых операциях;
- у `register-source` нет предупреждения на уровне help/skill docs, что мутации одного root должны быть сериализованы.

> Согласен. Это уже не просто documentation gap, а реальный runtime/UX defect. Минимум нужен явный contract: mutating commands for one backlog root are serialized only. Практически это просится либо в advisory lock, либо в optimistic concurrency guard по revision state/applied registries.

### 6. Есть несовпадение документации и фактического `init` output

Наблюдение:

- `init` реально создал `.backlog.json`;
- в `references/command-reference.md` по-прежнему написано `.architecture-backlog.json`.

Подтверждение:

- [`references/command-reference.md`](../references/command-reference.md) говорит про `.architecture-backlog.json`;
- [`docs/utility-spec.ru.md`](./utility-spec.ru.md) уже говорит про `.backlog.json`.

Почему это сложно:

- оператор или агент, ориентирующийся только на command reference, получает неверное ожидание о layout root marker-а;
- это осложняет первичную проверку состояния и повышает стоимость доверия к reference docs.

> Это уже исправлено, но сам класс проблемы важен: для этого skill-а drift между `references/*` и runtime особенно дорог, потому что агент опирается на docs как на executable contract. Значит, такие расхождения стоит ловить тестом или review-checklist, а не только ручной вычиткой.

### 7. Построение initial packet полностью ручное

Наблюдение:

- CLI не извлекает tasks из архитектуры сам;
- он только materialize-ит уже авторский packet.

Это соответствует дизайну skill, но в реальном проходе означает большой объём ручной работы:

- вручную сформировать item taxonomy;
- вручную сопоставить `CF-*` с `delivery_state`;
- вручную разнести claims, contracts, domains, quality attributes, policy decisions;
- вручную свести зависимости.

Почему это важно:

- “build backlog from architecture” на практике означает не “CLI построит backlog”, а “агент построит packet для CLI”.

> Согласен. Это не баг, а важный truth-in-advertising момент для skill-а. В `SKILL.md` и quick references стоит ещё жёстче формулировать: утилита materializes, агент authors. Иначе оператор ожидает полуавтоматический importer, которого по дизайну нет.

## Косвенные сложности

### 8. Нужно было вручную совместить два разных источника истины о зависимостях

В сессии пришлось развести:

- as-built зависимости для уже delivered seams из `docs/ssot/index.md`;
- future-looking зависимости для недоставленных seams из `docs/backlog/feature-candidates.md`.

Почему это сложно:

- один источник описывает реальную поставку;
- другой описывает планировочную ownership-модель;
- утилита не даёт встроенного механизма reconciliation, это полностью на агенте.

> Это хорошее наблюдение. Я бы не тащил reconciliation в CLI, но в skill-е нужен отдельный playbook: как примирять as-built и planning-state, кто из них выигрывает в каких случаях, и как это отражать в packet/context без произвола.

### 9. Нужно было вручную ввести mapping `intaken -> implemented`

Наблюдение:

- пользователь дал правило: `intaken` в candidate backlog считать `implemented`;
- CLI, естественно, про это ничего не знает.

Следствие:

- mapping пришлось:
  - сохранить в `context.key_strategy.delivery_mapping`;
  - отразить в `context.as_built`;
  - вручную применить к каждому item.

Это не дефект CLI, но это заметная интеграционная нагрузка.

> Здесь не хватает не новой функции утилиты, а канонического способа документировать такие маппинги. Хороший кандидат — отдельный явный subsection в workflow/examples: “domain-specific status mapping before packet authoring”.

>>> Я не понимаю, зачем отслеживать этот маппинг. Что если это используется всего лишь раз. Вот как в данном примере. Агент использовал старый список задач чтобы определить статус исполнения задачи. Он прочитал, зарегистрировал intaken задачи как уже готовые и все. Больше он никогда не увидит этих intaken статусов. Мне кажется, что инструкции (в скиле) как правильно определять статус готовности задачи должно быть достаточно. При чем, оператор не всегда может иметь для агента источник со статусами задач. У оператора может быть только реальный код софта и все. Безо всяких статусов. Тогда агенту придется изучать код, тесты и принимать решение о статусе имплементации. Если все это не очевидно на уровне инструкций скила - их надо доработать, чтобы агенту сразу было понятно с чем он может работать и как.

> Согласен. Здесь мой прежний акцент был слишком “data-model centric”. Правильнее не продвигать отдельный persistent mapping как норму, а усилить skill-инструкции: из каких источников агент может выводить delivery state, как приоритизировать code/tests/docs, и когда разовый локальный mapping допустим без превращения его в отдельную сущность.

### 10. Источники planning-state содержат строки, не готовые к прямому импорту

Примеры:

- зависимости вида `CF-010->F-0014`;
- смешение protocol-state (`candidate`, `confirmed`, `intaken`) и реального delivery-state;
- explanations внутри backlog rows, которые полезны для shaping, но не ложатся напрямую в поля packet item.

Почему это сложно:

- между planning doc и packet model есть слой нормализации, который утилита не автоматизирует.

> Согласен. Это ещё один аргумент, почему skill должен давать не только schema/reference, но и нормализационные примеры: как из messy planning rows получать clean items, dependencies и delivery states.

>>> Это очень важно.

### 11. `gaps` пришлось invent-free фиксировать вручную

В итоговом backlog появились 7 blocked items с gaps.

Это правильное поведение по методу skill, но в практическом процессе это значит:

- агент обязан остановиться и externalize missing prerequisites;
- без этого initial backlog выглядел бы “готовее”, чем он есть на самом деле.

Сложность здесь не в утилите, а в дисциплине authoring:

- легче было бы “дотянуть” packet без gaps и получить ложный optimistic graph.

> Это правильное трение. Я бы не пытался убирать его из процесса. Но да, агенту полезны более сильные примеры того, когда именно нужно materialize `gap`, а когда можно честно продолжать без него.

>>> Не понял, что значит "можно честно продолжать без него" (без gap)?

> Имеется в виду: не каждое отсутствие идеальной информации должно автоматически превращаться в `gap`. Если данных достаточно, чтобы обоснованно сформулировать задачу и её зависимости без выдумывания, агент продолжает без `gap`. `Gap` нужен там, где без внешнего недостающего факта задача станет ложной, слишком оптимистичной или непроверяемой.

>>> Если у нас определение `gap` недостаточно четкое - это нужно исправить. Тогда агент сможет лучше понимать - где есть `gap` а где нет. Это решит проблему?

> Да, это решит основную часть проблемы. Здесь ключевой рычаг именно в skill-е: нужно дать чёткое определение `gap`, признаки обязательного `gap`, признаки допустимого продолжения без `gap`, и несколько коротких примеров пограничных случаев. Тогда agent behavior станет заметно стабильнее.

### 12. `ready_for_next_step` и `queue` не совпадают интуитивно

Наблюдение:

- `status` показал 3 items `ready_for_next_step`;
- `queue` вернул только 2 корневые цепочки.

Фактическая картина:

- ready items были `cf-015`, `cf-016`, `cf-018`;
- `queue` показал `cf-016 -> cf-015` и `cf-018 -> cf-015`.

Почему это сложно:

- метрика “3 ready items” и визуально “2 queue chains” легко воспринимаются как противоречие, хотя это не ошибка;
- downstream item может одновременно быть ready и входить в несколько chains.

Это стоит явно объяснять в docs/read-model semantics.

> Согласен. Здесь нужен не только текст в docs, но и более self-explanatory output. Например, `queue` может явно сообщать `ready_item_count` и `chain_count`, чтобы агент и оператор сразу видели, что речь о разных представлениях одного состояния.

>>> Да, предложение верное, но не забывай, output утилиты видит только агент, поэтому все улучшения должны быть сконцентрированы именно на помощи агенту (это касается практически всех улучшений).

> Да. Тогда формулирую точнее: улучшение output нужно не “для оператора”, а для уменьшения числа лишних agent steps и снижения вероятности неверной интерпретации read-models самим агентом.

### 13. После `packet` появился второй packet-файл

Наблюдение:

- в `packets/` остались:
  - authored draft `2026-04-07-initial-backlog.packet.json`;
  - canonical immutable copy `9fa45c5797fc--2026-04-07-initial-backlog.packet.json`.

Это соответствует модели immutable registration и отражено в `.backlog/applied.json`, но для первого оператора выглядит неожиданно.

Почему это сложно:

- без знания модели можно решить, что это дубликат или мусор;
- нужно понимать, что current truth читается не из draft packet, а из утилиты и applied registry.

> Да. Это стоит подсветить прямо в success output `packet`: authored file remains user draft, canonical copy becomes immutable imported artifact. Тогда surprise уйдёт ещё до чтения docs.

### 14. Командная документация частично распределена между несколькими файлами

В процессе пришлось сверяться с несколькими уровнями:

- `SKILL.md`;
- `references/command-reference.md`;
- `references/data-model.md`;
- `docs/utility-spec.ru.md`;
- исходники.

Почему это сложно:

- быстрый path в `SKILL.md` и `references/*` не закрыл все реальные операторские вопросы;
- часть практических ограничений пришлось добирать из кода.

> Это, на мой взгляд, один из самых ценных выводов отчёта. Видно, что текущая docs architecture всё ещё лучше подходит implementer-у, чем оператору/агенту в live session. Вероятно, нужен один operator-facing how-to/quickstart, который закрывает первый реальный проход end-to-end.

>>> Тут важно системно подойти и сначала составить список открытых вопросов и решить как каждый закрыть в скиле. Возможно большая часть вопросов уже описана в концепции и надо перенести информацию оттуда в скил (мы в скиле не даем ссылки на документацию!).

> Согласен. Это меняет акцент: нужен не просто quickstart-док, а целевой перенос operator/agent-facing operational knowledge из концепции в сам skill, чтобы первый рабочий проход был возможен без похода в docs/spec.

### 15. Отсутствует явная операторская инструкция для “import external docs into backlog root”

Именно этот шаг оказался ключевым в реальном процессе.

Нужный практический рецепт в сессии был такой:

1. `init`;
2. создать `sources/`;
3. скопировать исходные документы внутрь backlog root;
4. только потом `register-source`.

Сейчас этот шаг не описан как отдельный how-to, хотя он оказался обязательным.

> Этот пункт уже частично устарел после исправления source paths. Но сам мета-вывод сохраняется: для первого прохода нужен один короткий операторский рецепт “create backlog from existing project docs”, иначе агент вынужден собирать рабочий workflow из нескольких уровней документации.

## Что не стоит считать проблемой утилиты

Ниже перечислено то, что проявилось в сессии, но не является дефектом самой утилиты:

- большой объём ручного packet authoring;
- необходимость думать о `gaps`, а не изобретать missing data;
- необходимость reconciliation между архитектурой, delivered index и candidate backlog;
- необходимость выбирать, какие ADR и supporting docs действительно material for the backlog.

Это часть метода `backlog-engineer`, а не поломка CLI.

## Итоговая классификация сложностей

### Сложности уровня CLI / runtime contract

- путь источника должен быть внутри backlog root;
- source не может быть symlink;
- мутации одного root практически требуют последовательного исполнения;
- есть doc/runtime drift по имени root marker-а;
- canonical packet copy создаётся неочевидно для first-time operator.

### Сложности уровня документации

- в quick docs недостаточно рано раскрыты ограничения на source paths;
- нет отдельного how-to для snapshot/import внешних документов;
- не акцентировано, что `register-source --path` резолвится от backlog root;
- не объяснена интуитивная разница между `ready_for_next_step` и `queue`;
- command reference и utility spec частично расходятся.

### Сложности уровня метода / агентской работы

- архитектура не превращается в backlog без большой ручной нормализации;
- требуется вручную согласовывать planning-state и delivery-state;
- требуется вручную externalize missing prerequisites через `gaps`.

## Рекомендации

### Документация

1. В `SKILL.md` и `references/command-reference.md` рядом с `register-source` явно написать:
   - path должен быть внутри backlog root;
   - symlink-источники запрещены;
   - для внешних документов нужен snapshot/copy внутрь `sources/`.

2. Добавить короткий how-to:
   `Create backlog from external architecture docs`.
   Минимальный поток:
   - `init`;
   - `mkdir sources/...`;
   - `cp` или другой explicit snapshot;
   - `register-source`;
   - `template packet`;
   - `packet --dry-run`;
   - `packet`.

3. Исправить `references/command-reference.md`, чтобы root marker был `.backlog.json`, а не `.architecture-backlog.json`.

4. Добавить в docs примечание:
   `queue` показывает chains, а не просто все ready items.

5. Явно документировать появление canonical immutable packet copy после применения packet.

> По этому блоку у меня вывод такой: рекомендации 3 и часть 1 уже исправлены, а вот 4 и 5 остаются актуальными. Самое недостающее сейчас — не ещё одна reference-страница, а короткий operator-facing quickstart/how-to.

### CLI / UX

1. Рассмотреть отдельную команду вроде `snapshot-source` или `import-source`, которая:
   - копирует внешний документ в `sources/...`;
   - сразу регистрирует его.

2. Рассмотреть защиту от параллельных мутаций:
   - advisory lock на backlog root;
   - либо явную ошибку при конкурентной записи.

3. В тексте ошибки для внешнего пути можно добавить не только запрет, но и подсказку:
   `Copy the source into <backlog_root>/sources first.`

> Пункт 1 стоит переоценить после фикса source paths: отдельный `snapshot-source` уже не обязателен как workaround, но может остаться полезным как convenience command. Пункт 2 про concurrency guard считаю наиболее сильной и практически важной рекомендацией из всего отчёта.

>>> Тут все просто - snapshot-ов быть не должно в принципе! Агент не должен трогать/перемещать существующие источники.

> Согласен. Тогда идея `snapshot-source/import-source` из матрицы снимается полностью. Источник должен оставаться на месте, а утилита обязана работать с внешними source paths без промежуточного copy workflow.

## Главный вывод

Утилита в этой сессии оказалась рабочей и достаточно строгой, чтобы не позволить агенту silently испортить backlog state. Основные реальные сложности возникли не в packet application, а на границе между внешними документами и backlog root:

- как завести source-файлы внутрь допустимого layout;
- как не потерять записи при конкурентных мутациях;
- как вручную нормализовать planning docs в packet model.

Иными словами:

- внутренний mutation/read-model контур у CLI сработал устойчиво;
- внешний operator ingestion path и часть docs пока создают лишнее трение и требуют явного улучшения.

> В целом согласен с выводом. После фикса source paths основной remaining UX-риск я бы сформулировал так: не ingestion path как таковой, а отсутствие одного канонического first-run workflow для агента плюс отсутствие guard-ов от конкурентных мутаций.

>>> Проблему конкурентных мутаций можно решить двумя способами:
>>> 1) Явно сообщить агенту (через инструкцию скила), что регистрировать источники нужно только последовательно и никак иначе.
>>> 2) Сделать рефакторинг команды регистрации, позволив регистрировать более одного источника за раз (пакетом), но важно понимать, что это не уберет проблему одновременных мутаций, они останутся и инструкция предупреждающая агента об этом нужна в любом случае

> Да. Согласен с приоритетами: базовое решение — явная сериализация в skill-инструкциях. Batch registration может быть полезным UX-улучшением, но не заменяет concurrency rule и не решает race condition сам по себе.

## Матрица проблем и возможных решений

| Проблема | Уровень | Наблюдение | Возможное решение | Приоритет |
|---|---|---|---|---|
| Параллельные мутации одного backlog root небезопасны | CLI / runtime + skill | независимые mutating commands теряют записи или дают неконсистентный результат | минимум: жёстко зафиксировать в skill, что все mutating commands для одного root выполняются только последовательно; дополнительно рассмотреть advisory lock / optimistic concurrency guard | Высокий |
| Drift между runtime и reference docs | Документация / процесс | агент может получить неверный operational contract из `references/*` | добавить doc-sync checks в review/test process; держать operator-facing docs как нормативный минимум | Высокий |
| Перед созданием нового backlog агент может не выяснить текущее состояние системы | Skill / first-run workflow | без явного preflight-вопроса агент может построить backlog как для greenfield, хотя система уже частично implemented | добавить в skill обязательный preflight: если operator не сообщил system state, переспросить; при partial implementation запросить источник истины для оценки delivery state, при pure design-state сразу переходить к backlog authoring | Высокий |
| Ручное построение initial packet воспринимается как “неожиданная ручная работа” | Skill / ожидания | оператор может ожидать importer, а получает authoring workflow | жёстче формулировать role split: agent authors, CLI materializes; добавить quickstart с этим акцентом | Средний |
| Reconciliation между as-built и planning-state полностью на агенте | Метод / skill | нет канонического playbook для примирения delivered reality и planning docs | добавить отдельный workflow/example по reconciliation rules и packet shaping | Высокий |
| Определение delivery state для existing system недостаточно явно описано в skill | Метод / skill | агент может видеть status docs, а может видеть только код, тесты и runtime behavior | усилить в skill правила вывода delivery state: допустимые источники, приоритеты, heuristics и случаи, когда нужен conservative downgrade или `gap` | Высокий |
| Planning docs не готовы к прямому packet import | Метод / skill | между planning rows и item model нужен слой нормализации | добавить примеры нормализации messy planning inputs в clean packet fields | Средний |
| Определение `gap` и правило `gap vs continue` недостаточно чётко выражены в skill | Метод / skill | агенту не всегда очевидно, когда missing information обязует materialize `gap`, а когда можно продолжать без него | закрепить в skill чёткое определение `gap`, критерии обязательного `gap`, критерии допустимого продолжения без `gap` и набор пограничных примеров | Высокий |
| `ready_for_next_step` и `queue` неинтуитивно соотносятся | Read-model semantics | ready count и chain view выглядят как противоречие | уточнить semantics в skill и при необходимости сделать `queue` output более self-explanatory для агента | Средний |
| Появление canonical packet copy неожиданно для first-time operator | CLI / UX | второй packet-файл выглядит как дубликат или мусор | явно сообщать в `packet` success output смысл canonical copy и authored draft; отразить это в skill | Средний |
| Операционное знание о первом проходе слишком распределено между skill, refs, spec и кодом | Документация / skill | агенту приходится собирать workflow и ответы на открытые вопросы из нескольких уровней | системно перенести нужные ответы из концепции и docs в сам skill, собрав канонический first-run workflow и список типовых открытых вопросов | Высокий |
