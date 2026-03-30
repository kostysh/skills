# Концептуальная baseline для восстановления `architecture-backlog-engineer`

Дата фиксации: 2026-03-30

Этот документ не предлагает новые изменения. Он фиксирует минимальную концептуальную модель, которую можно проверить против `HEAD` до любого переписывания.

## 1. Что такое этот skill

`architecture-backlog-engineer` — это не “умная CLI, которая сама понимает архитектуру”.

Это система из двух разных слоёв с разной ответственностью:

1. Агентный слой.
2. CLI-слой.

Их нельзя описывать размыто. Нужно различать:

1. `semantic interpretation`
2. `packet authoring and registration`
3. `canonical graph materialization`

## 2. Что делает агент

Агент делает только смысловую работу и подготовку входов.

Точная формулировка:

1. Агент читает prose-источники:
   - architecture docs;
   - ADRs;
   - runtime/deployment evidence;
   - planning context.
2. Агент интерпретирует смысл:
   - claims;
   - seams;
   - obligations;
   - gaps;
   - unknowns;
   - candidate work.
3. Агент формирует explicit packet files по схеме.
4. Агент регистрирует sources и packets через CLI invocation.

Агент не делает следующего:

- не materialize-ит `backlog.json` как canonical graph;
- не пишет canonical graph напрямую;
- не заменяет deterministic merge/validate/render логику CLI.

## 3. Что делает CLI

CLI делает только детерминированную работу над run bundle и зарегистрированными inputs.

Точная формулировка:

1. CLI принимает зарегистрированные source refs и packet refs.
2. CLI читает source content и packet files.
3. CLI загружает зарегистрированные packet inputs.
4. CLI merge-ит packet content в canonical graph.
5. CLI записывает canonical graph в `backlog.json`.
6. CLI обновляет derivable canonical state.
7. CLI обновляет source fingerprints.
8. CLI валидирует canonical state.
9. CLI рендерит `report.md`.

Точная граница:

- агент подготавливает и подаёт inputs;
- CLI строит и обновляет canonical graph из этих inputs.

## 4. Где именно появляется backlog graph

Это ключевой момент.

`backlog graph` как canonical artifact появляется не на шаге reasoning агента.

Он появляется только на шаге CLI materialization:

1. packets уже созданы агентом;
2. packets зарегистрированы в CLI;
3. CLI применяет deterministic merge;
4. результат записывается в `backlog.json`.

Следовательно, правильная формулировка такая:

- агент формирует packet inputs;
- CLI формирует backlog graph.

Не наоборот.

## 5. Что является источником истины

Истина живёт в canonical core:

- `manifest.json`
- `backlog.json`
- `assessment.json`
- `journal.ndjson`

`report.md` не является source of truth. Это disposable generated view.

Это следует из:

- `HEAD:SKILL.md` -> `Outputs`
- `HEAD:references/artifact-model.md` -> `Canonical core` / `Generated report`

## 6. Что реально делает `discover`

`discover` — это не prose analyzer.

`discover` — это workflow materialization/update для зарегистрированных inputs.

Точная формула:

1. принять source refs;
2. прочитать source content;
3. загрузить explicit packets, зарегистрированные агентом;
4. merge-ить packet content в canonical graph;
5. обновить canonical artifacts;
6. refresh source fingerprints;
7. repair derivable state;
8. validate;
9. render.

Следовательно:

- `discover` не “понимает архитектуру”;
- `discover` применяет зарегистрированные packet inputs к canonical run state.

## 7. Чего CLI не делает

CLI не делает semantic extraction из произвольного prose.

То есть CLI не умеет сама:

- читать обычный архитектурный markdown и извлекать claims как смысловые сущности;
- выводить owner seams из естественного языка;
- строить packet content из свободного текста;
- заменять агентный discovery reasoning.

Фактическое основание:

- в `HEAD:src/discovery/source-runtime.ts` вход обрабатывается как:
  - JSON packet;
  - fenced JSON packet block;
- fallback на prose-semantic parser отсутствует.

## 8. Embedded packets как implementation detail

Для методики важно следующее:

1. архитектурные и связанные документы рассматриваются как prose-only inputs;
2. packets создаёт агент;
3. packets регистрируются агентом как explicit packet inputs;
4. operator не author-ит packets.

В коде parser-а существует техническая способность читать embedded packet blocks из markdown.
Но это не должно описывать нормальный workflow и не должно появляться в operator contract.

Следовательно, нормативная формулировка должна быть такой:

- методика опирается на explicit packets, созданные агентом;
- support for embedded packet blocks — это только низкоуровневая parser capability;
- эта capability не должна использоваться для объяснения того, как оператор получает backlog из архитектурной prose.

## 9. Три уровня, которые нельзя смешивать

Нужно всегда различать три разных уровня:

1. `semantic interpretation`
   - выполняет агент;
   - результат: смысловая модель claims, seams, gaps, obligations.
2. `packet authoring and registration`
   - agent author-ит explicit packet files;
   - agent регистрирует packets через CLI input surface.
3. `canonical graph materialization`
   - выполняет CLI;
   - результат: обновлённый `backlog.json` и связанный canonical core.

Моя предыдущая ошибка была именно в смешении уровней 2 и 3.

## 10. Нормальный workflow

Правильный workflow выглядит так:

1. Агент читает authoritative sources.
2. Агент интерпретирует backlog-relevant meaning.
3. Агент author-ит explicit packet files по схеме.
4. Агент регистрирует sources и explicit packets в CLI.
5. CLI ingest-ит registered sources/packets.
6. CLI materialize/update canonical graph.
7. CLI validate-ит canonical state.
8. CLI render-ит report.

## 11. Что было моей концептуальной ошибкой

Моя ошибка была двойной:

1. я написал, будто агент формирует сам backlog graph;
2. я написал, будто CLI делает discovery из prose.

Обе формулировки неверны.

Правильная граница такая:

- агент делает interpretation + packet authoring/registration;
- CLI делает graph materialization + deterministic validation/render.

## 12. Проверяемые тезисы

Перед любым rewrite можно проверять меня по следующим тезисам.

Если любой из них неверен, переписывание останавливается:

1. CLI не является semantic extractor из произвольного prose.
2. Агент не пишет canonical graph напрямую.
3. Агент формирует packet inputs и регистрирует их через CLI workflow.
4. CLI принимает registered packet inputs и материализует canonical graph.
5. Packets создаёт только агент; operator packets не author-ит.
6. `report.md` никогда не является source of truth.
7. `discover` — это packet-ingest + graph-materialization workflow, а не architecture parser.
8. Embedded packet support не является частью нормального operator workflow и не должен использоваться для его описания.
9. Любой новый contract в docs/tests/code не должен размывать границу:
   - агент: interpretation + packet authoring/registration;
   - CLI: deterministic graph build/update/validate/render.
10. Агент использует только штатную CLI утилиту скила для создания, обновления, валидации, repair, rebaseline и render methodology-owned артефактов.
11. Агент не создаёт свои обходные генераторы, mutation-скрипты или прямые редакторы для `manifest.json`, `backlog.json`, `assessment.json`, `journal.ndjson`, `report.md` в рамках методического процесса.

## 13. Фактические опоры в коде `HEAD`

Эта baseline должна проверяться не по словам, а по коду.

Ключевые опоры:

- `HEAD:src/discovery/source-runtime.ts`
  - `parseDiscoverySourcePackets(...)`
  - `loadSourcePacketRefs(...)`
  - `mergeDiscoveryPacketsIntoBacklog(...)`
- `HEAD:src/discovery/discover-run.ts`
  - `resolveSourceInputs(...)`
  - `loadSourcePacketRefs(...)`
  - `mergeDiscoveryPacketsIntoBacklog(...)`
  - `refreshSourceFingerprintsInBacklog(...)`
  - `validateDiscoveryRun(...)`
  - `renderDiscoveryViews(...)`

Дополнение:

- наличие в коде `extractPacketBlocksFromMarkdown(...)` подтверждает parser capability;
- но само по себе не делает embedded packets частью intended methodology.

Если будущая формулировка противоречит этим фактам или превращает parser capability в нормативный workflow, она считается неверной.

## 14. Как использовать этот документ

Перед изменением любого `wrong` или `suspicious` блока:

1. Проверить, не нарушает ли предлагаемое изменение тезисы из раздела 12.
2. Если нарушает, изменение считается концептуально неверным независимо от того, “удобно” ли оно оператору.
3. Только после этого можно принимать решение `keep / rewrite / drop` на уровне кода и docs.

## 15. Методический guardrail по инструментам

Для артефактов, которые принадлежат методике, действует отдельное жёсткое правило:

1. В методическом процессе используется только штатная CLI утилита скила.
2. Агент не имеет права создавать:
   - временные генераторы;
   - альтернативные mutation-скрипты;
   - ad hoc конвертеры;
   - прямую ручную запись canonical artifacts;
   если этими действиями он подменяет штатный workflow CLI.
3. Любое создание вспомогательного инструмента для получения или изменения методических артефактов считается нарушением методики.
4. Исключение возможно только тогда, когда меняется сама утилита как продукт, а не когда выполняется рабочий методический процесс с этой утилитой.

Практическая проверка:

- если задача звучит как “получить или обновить backlog run”;
- а агент собирается писать отдельный скрипт вместо `node scripts/architecture-backlog.mjs ...`;
- значит агент снова нарушает методику.
