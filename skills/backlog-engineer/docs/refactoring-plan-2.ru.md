# План рефакторинга 2 `@kostysh/backlog-engineer-cli`

## Назначение документа

Этот документ фиксирует план изменений после реальной сессии использования `backlog-engineer` другим агентом.

Это не новая спецификация утилиты.

Причина:

- базовая концепция уже зафиксирована в [process-cli.ru.md](process-cli.ru.md);
- runtime behavior уже зафиксирован в [utility-spec.ru.md](utility-spec.ru.md);
- технические контракты уже зафиксированы в:
  - [schemas-and-types.ru.md](schemas-and-types.ru.md),
  - [module-interfaces.ru.md](module-interfaces.ru.md),
  - [test-matrix.ru.md](test-matrix.ru.md);
- новые требования пришли не из “нехватки спецификации”, а из реального UX-трения в живой сессии.

Задача этого документа:

- перечислить проблемы, которые действительно нужно менять;
- определить, в каком слое менять каждую проблему:
  - `SKILL.md`,
  - `references/*`,
  - CLI/runtime,
  - концепция,
  - спецификация;
- задать правильный порядок изменений;
- зафиксировать критерии закрытия каждой проблемы.

## Источник изменений

Основной источник:

- [session-usage-analysis-2026-04-07.ru.md](session-usage-analysis-2026-04-07.ru.md)

Дополнительный источник:

- прямые комментарии и решения, принятые после чтения этого анализа.

## Что уже исключено из плана

Эти проблемы уже исправлены и не входят в follow-up scope:

- поддержка source paths вне backlog root;
- переход на `.backlog.json` вместо `.architecture-backlog.json`.

## Принципы планирования

### 1. Skill first

Если проблема возникает из-за того, что агент не знает, как правильно работать, то первичное исправление должно идти в `SKILL.md`.

Сюда относятся:

- preflight-вопросы;
- правила определения `delivery_state`;
- правила `gap vs continue`;
- first-run workflow;
- правила сериализации mutating-команд;
- правила интерпретации output команд;
- трактовка `queue`, `ready_for_next_step`, canonical packet copies.

### 2. Runtime only for real runtime defects

CLI/runtime меняем только там, где одних skill-инструкций недостаточно.

Сюда относятся:

- конкурентные мутации одного backlog root;
- недостаточно self-explanatory command outputs;
- отсутствие runtime guard там, где агентская дисциплина сама по себе слишком хрупка.

### 3. No snapshot workflow

Отдельного snapshot/import workflow быть не должно.

Правильная модель:

- агент не копирует и не перемещает существующие источники;
- утилита работает с внешними source files напрямую;
- skill не должен продвигать snapshot-подход как норму.

### 4. Skill must remain self-contained

Если operational knowledge нужно агенту для реальной работы, оно должно жить в самом skill-е, а не только в `docs/`.

Следствие:

- `SKILL.md` должен содержать полный first-run contract;
- `references/*` помогают структурировать skill, но не заменяют ключевые правила;
- концепция и спецификация остаются рабочими документами проектирования, а не обязательным user path для агента.

### 5. Changes must stay justified

Если меняется runtime behavior, то вместе с кодом обновляются:

- концепция,
- спецификация,
- схемы/типы,
- тестовый контракт,
- skill или references, если изменение влияет на агентский workflow.

## Список проблем, которые берём в работу

## 1. Нет обязательного preflight-вопроса о состоянии системы

### Проблема

При создании нового backlog оператор может не сказать, находится ли система:

- в состоянии чистого проектирования;
- в состоянии частичной реализации;
- в состоянии уже сложившейся, существенно реализованной системы.

Если агент это не уточнит, он может построить backlog в неверной модели.

### Что меняем

- `SKILL.md`

### Что именно добавить

- жёсткое preflight-правило:
  - если оператор не сообщил system state явно, агент обязан переспросить;
- минимальная развилка:
  - `system is design-only`
  - `system is partially implemented`
  - `operator is unsure`
- если система partially implemented:
  - агент обязан запросить source of truth для оценки `delivery_state`:
    - кодовая база,
    - тесты,
    - архитектурные документы,
    - existing backlog/planning docs,
    - другое.

### Изменение концепции/spec

Не требуется.

### Acceptance

- в `SKILL.md` появился явный preflight block перед first-run workflow;
- у агента не остаётся неоднозначности, когда переспрос обязателен.

## 2. Недостаточно чёткие правила определения `delivery_state`

### Проблема

Агент может получать сигналы о состоянии системы из разных источников:

- code;
- tests;
- ADR / architecture;
- backlog/status docs;
- operator instruction.

Сейчас это недостаточно явно собрано в единый operational rule set.

### Что меняем

- `SKILL.md`
- при необходимости `references/data-model.md`

### Что именно добавить

- допустимые источники вывода `delivery_state`;
- приоритет источников;
- conservative rules:
  - когда можно ставить `implemented`;
  - когда лучше ставить `planned` / `specified`;
  - когда нужен `gap`;
- отдельный пример:
  - “есть старый planning-state status вроде `intaken`”
  - это не отдельная сущность backlog-а, а одноразовая входная эвристика агента.

### Изменение концепции/spec

Не требуется.

### Acceptance

- в skill есть явный раздел `How to infer delivery_state`;
- agent-first правила не требуют идти в `docs/` ради базового решения.

## 3. Нет канонического playbook для reconciliation `as-built` и planning-state

### Проблема

В реальном проекте агент может одновременно видеть:

- уже реализованную систему;
- planning docs со своими seam-ами, ownership и candidate items.

Это требует reconciliation, но в skill-е нет достаточного playbook-а.

### Что меняем

- `SKILL.md`
- при необходимости examples в `references/*`

### Что именно добавить

- как совместно использовать:
  - as-built sources,
  - planning sources;
- какой слой за что отвечает:
  - existing delivered reality;
  - future-looking ownership / task shape;
- как отражать reconciliation в packet/context без произвола.

### Изменение концепции/spec

Не требуется.

### Acceptance

- в skill появляется отдельный workflow/example по reconciliation;
- агенту не нужно придумывать reconciliation policy на месте.

## 4. Недостаточно чётко определён `gap`

### Проблема

Если definition of `gap` размыто, агент не понимает:

- когда `gap` обязателен;
- когда можно продолжать без `gap`;
- где проходит граница между “нужно externalize uncertainty” и “информации уже достаточно”.

### Что меняем

- `SKILL.md`
- при необходимости examples в `references/*`

### Что именно добавить

- чёткое определение `gap`;
- критерии обязательного `gap`;
- критерии допустимого продолжения без `gap`;
- короткие пограничные примеры:
  - missing external prerequisite;
  - missing exact implementation detail, но item всё ещё можно сформулировать корректно;
  - отсутствие данных о реальном состоянии системы.

### Изменение концепции/spec

Не требуется.

### Acceptance

- в skill появляется раздел `gap vs continue`;
- agent behavior становится воспроизводимым без обращения к внешним устным пояснениям.

## 5. First-run workflow и операционные ответы слишком распределены

### Проблема

Сейчас реальные ответы на “как пройти первый рабочий цикл” размазаны между:

- `SKILL.md`;
- `references/*`;
- концепцией;
- спецификацией;
- местами даже кодом.

### Что меняем

- `SKILL.md`
- при необходимости локальные `references/*`

### Что именно добавить

- один канонический first-run workflow:
  1. определить состояние системы;
  2. собрать источники истины;
  3. зарегистрировать источники;
  4. author packet;
  5. dry-run;
  6. apply packet;
  7. read status/queue/gaps/attention;
- список типовых открытых вопросов, которые агент должен закрыть до authoring packet.
- отдельные краткие заметки `What to expect in output` для основных команд, где output легко интерпретировать неверно:
  - `packet`
  - `patch-item`
  - `remove-item`
  - `refresh`
  - `status`
  - `queue`
  - `attention`
  - `items`
  - `search`

### Изменение концепции/spec

Не требуется.

### Acceptance

- агент может пройти first-run workflow, не читая `docs/`;
- ключевые ответы на operator-facing вопросы живут в самом skill-е.
- в skill есть явные notes по интерпретации output ключевых команд.

## 6. Нет жёсткого правила сериализации mutating-команд в skill

### Проблема

Даже если runtime позже получит lock/guard, агент уже сейчас должен знать:

- mutating commands для одного backlog root выполняются только последовательно.

### Что меняем

- `SKILL.md`

### Что именно добавить

- прямое правило:
  - не запускать `register-source`, `packet`, `patch-item`, `remove-item`, `refresh`, `delete-backlog` параллельно для одного backlog root;
- отдельно подчеркнуть:
  - even if commands look independent, one root means serialized mutation path.

### Изменение концепции/spec

Не требуется.

### Acceptance

- в skill есть буквальный запрет на параллельные mutating-команды для одного root.

## 7. Runtime still needs a concurrency guard

### Проблема

Skill-инструкция снижает риск, но не защищает от:

- другого агента;
- ошибочного orchestration;
- ручного parallel execution.

### Что меняем

- CLI/runtime
- концепция
- спецификация
- test matrix

### Что именно добавить

- выбранный механизм:
  - `advisory lock` на backlog root;
- способ захвата lock:
  - атомарное создание файла через `open(..., 'wx')`;
- lock file:
  - `/.backlog/mutation.lock`;
- scope lock-а:
  - все mutating commands:
    - `register-source`,
    - `packet`,
    - `patch-item`,
    - `remove-item`,
    - `refresh`,
    - `delete-backlog`;
- read-only commands lock не берут;
- hybrid path `status --refresh` берёт lock, потому что внутри есть mutation phase;
- при занятом lock команда завершается явной машинно различимой ошибкой;
- автоматического stale-lock recovery нет:
  - занятый lock всегда означает refusal path;
- lock всегда освобождается при штатном завершении команды;
- `init` должен создавать backlog-local `.gitignore` как часть canonical artifacts;
- этот `.gitignore` должен гарантированно игнорировать:
  - `/.backlog/mutation.lock`;
- если `.gitignore` уже существует:
  - утилита не должна слепо перетирать пользовательское содержимое;
  - утилита должна гарантировать наличие своей managed section для lock ignore rule и не плодить дубли;
- error contract:
  - code: `BE_MUTATION_LOCKED`
  - details:
    - `backlog_root`
    - `lock_path`
- добавить тесты на:
  - successful lock acquisition;
  - refusal при занятом lock;
  - lock release после success path;
  - lock release после error path;
  - presence/update contract для backlog-local `.gitignore`.

### Изменение концепции/spec

Требуется.

### Acceptance

- параллельные мутации одного root не могут silently потерять данные;
- при конфликте агент получает явную машинно различимую ошибку.
- `init` создаёт backlog-local `.gitignore` как часть utility-owned artifact set;
- lock file не попадает в git status при нормальном использовании backlog root.

## 8. `queue` output можно сделать понятнее для агента

### Проблема

Связь между:

- `ready_for_next_step` count;
- chain-based `queue`

неочевидна для первого прохода.

### Что меняем

- сначала `SKILL.md`
- потом CLI output, если понадобится
- затем концепция/spec, если runtime contract изменится

### Что именно добавить

- в skill:
  - что `queue` показывает chains, а не “все ready items”;
- runtime output contract пока не менять;
- если после skill/docs clarification UX всё ещё останется слабым, вернуться к runtime summary-полям отдельным решением.

### Изменение концепции/spec

Сейчас не требуется.

### Acceptance

- агенту не нужно самостоятельно догадываться, почему ready count и queue shape отличаются.

## 9. `packet` success output должен яснее объяснять canonical copy

### Проблема

Появление immutable canonical packet copy легко воспринимается как дубликат.

### Что меняем

- CLI output
- концепция/spec
- `SKILL.md`

### Что именно добавить

- в `packet` success output:
  - `authored_packet_path`
  - `canonical_packet_path`
  - `canonical_packet_purpose = "immutable_import_copy"`
- короткое пояснение в skill-е.

### Изменение концепции/spec

Требуется.

### Acceptance

- после `packet` агенту не нужно угадывать, почему файлов стало два.
- `packet` output содержит структурное различение authored draft и canonical immutable import copy.

## 10. Drift между runtime и `references/*` должен ловиться системно

### Проблема

Для этого skill-а docs — часть executable contract. Drift дорого обходится.

### Что меняем

- documentation process
- implementation plan / review checklist

### Что именно добавить

- doc-sync checklist в процесс изменений;
- если возможно:
  - lightweight check/test на наиболее критичные contract strings.

### Изменение концепции/spec

Не требуется.

### Acceptance

- doc/runtime mismatch не обнаруживается случайно в живой сессии.

## Что не берём в работу сейчас

### Batch source registration

Идея:

- разрешить регистрировать больше одного источника за команду.

Почему не берём сразу:

- это не решает саму проблему concurrent mutations;
- это отдельное UX-расширение, а не обязательный corrective change;
- сначала нужно закрыть:
  - serialized mutation rule в skill,
  - runtime concurrency guard.

### Snapshot/import command

Не брать.

Причина:

- snapshot workflow противоречит принятой модели;
- агент не должен трогать и перемещать существующие источники;
- после исправления external source paths это больше не является нормой.

## Порядок выполнения изменений

### Шаг 1. Укрепить `SKILL.md`

Сначала закрыть все agent-facing проблемы:

- preflight про состояние системы;
- правила вывода `delivery_state`;
- reconciliation playbook;
- `gap` definition;
- first-run workflow;
- `What to expect in output` для ключевых команд;
- serial-only mutating rule;
- `queue` semantics;
- canonical packet copy semantics.

Это первый шаг, потому что он даёт наибольший эффект без изменения runtime.

### Шаг 2. Выровнять `references/*`

После усиления `SKILL.md`:

- оставить в references только supporting detail;
- убрать противоречия;
- не класть в references то, что агент обязан знать уже из skill-а.

### Шаг 3. Внести runtime UX fixes

Только после skill-level выравнивания:

- concurrency guard:
  - advisory lock на backlog root;
  - `open(..., 'wx')` для `/.backlog/mutation.lock`;
  - `BE_MUTATION_LOCKED` при конфликте;
  - без auto stale-lock recovery;
  - backlog-local `.gitignore`;
- `packet` success output improvement;
- `queue` runtime output пока не менять.

### Шаг 4. Синхронизировать концепцию/spec/test contract

Для всех runtime-facing изменений:

- обновить концепцию;
- обновить спецификацию;
- обновить схемы/типы;
- обновить module interfaces;
- обновить тестовую матрицу;
- добавить или скорректировать тесты.

## Критерии завершения follow-up цикла

Follow-up считается завершённым только если одновременно выполнено всё:

- `SKILL.md` содержит весь необходимый first-run operational contract;
- skill не требует идти в `docs/` ради базовых agent decisions;
- runtime больше не допускает silent race на concurrent mutations одного root;
- runtime использует `advisory lock` на backlog root и `init` создаёт корректный backlog-local `.gitignore` для lock file;
- lock conflict возвращает `BE_MUTATION_LOCKED` с понятным payload;
- `packet` output и `queue` semantics снижают риск неверной агентской интерпретации;
- references не расходятся с runtime и skill;
- все runtime changes отражены в концепции/spec/tests.

## Короткий итог

Основной remaining scope — это не “переписать утилиту”, а:

- перенести критическое operational knowledge в сам skill;
- защитить runtime от конкурентных мутаций;
- убрать несколько UX-ловушек в read/write outputs.

То есть follow-up должен идти в порядке:

1. `SKILL.md`
2. `references/*`
3. CLI/runtime
4. concept/spec/tests sync
