# Детерминированные асинхронные тесты

- Log ID: `implementation-log-20261107-1`.
- Основание: прямое поручение владельца от 7 ноября 2026 года.
- Первоначальный объём: локальная доработка существующего `typescript-test-engineer`
  и проверка решений агента. Доставка дополнительно разрешена оператором после
  завершения локальной проверки; её подготовка описана ниже.
- Версия инструкций: **0.1.10 → 0.1.11**. Package version `0.1.0` не менялась:
  новый runtime не создавался.
- Baseline/HEAD: `ba51a6bd604e9d19a10113131f5abf4d5eacbcc9`.
  Ветка реализации: `codex/typescript-test-async-determinism`. Исходный checkout
  был чистым; изменения ограничены этим skill.

## Результат и границы

Потребитель — агент, который проектирует, реализует, ревьюит или диагностирует
TypeScript-тесты. Требуемое решение — причинно дождаться завершения, контролировать
значимый источник времени и фазы конкуренции, сохранить проверяемую реальную
защиту и корректно завершить запущенную работу при ошибке или отмене.

Не требуются новый skill, runner, общий harness, Clock API, production test hooks
или изменения потребляющих проектов. Read-only review/diagnose, opt-in TDD и
реальные DB/security boundaries сохраняются. Самый прямой вариант — расширить
существующий reference и связать пересекающиеся правила, без новых библиотек.

## Изменённые поверхности

| Файл | Изменение |
| --- | --- |
| [skill.yaml](../../skill.yaml) | Версия инструкций, conditionally required `ref-testing`, четыре нейтральных eval inputs и supporting log |
| [fragments/overview.md](../../fragments/overview.md) | Краткий async-инвариант, обязательный триггер чтения, timeout после диагноза |
| [references/testing.md](../../references/testing.md) | Единый метод completion/time/concurrency/cleanup, два самостоятельных Node-примера; устранены timeout-first и blanket mocking/fake-timer советы |
| [references/react-vitest.md](../../references/react-vitest.md), [references/testing-anti-patterns.md](../../references/testing-anti-patterns.md) | Ссылки на общий lifecycle, failure-safe deferred, корректные async `waitFor` и timer semantics |
| [evals/evals.json](../../evals/evals.json), `evals/fixtures/*-input.md` | Cases 2–5 с закрытыми критериями и абстрактными входами; существующий case 1 сохранён |
| [test/docs-contract.test.mjs](../../test/docs-contract.test.mjs) | Существующая structural проверка отражает обязательный условный reference |
| [SKILL.md](../../SKILL.md), [compile-report.md](../compile-report.md) | Compiler-owned вывод регенерирован штатной командой |
| [docs/README.md](../README.md), этот log и [evidence](../forward-tests/20261107-async/trial-assessment.md) | Навигация, результаты и нормализованные публичные свидетельства |

## Решения по требованиям

| Риск/требование | Реализованное решение | Проверка |
| --- | --- | --- |
| Завершение работы и assertions | Await/return зависимой работы; все listener Promises до действия и первого await | Case 2; Node event example |
| Паузы вместо готовности | Sleep, event-loop turns и Promise flush не доказывают внешнее I/O; допустимо bounded условное наблюдение | Cases 2, 4 |
| Async polling | Команда отдельно; callback только читает. Throw/rejection вызывает retry, false не вызывает; pending callback не повторяется | Case 4, включая достаточный корректный polling |
| TTL и источники времени | Согласованы fixture/operation/timestamp IDs; до/на/после границы по контракту. JS, execution timers и DB clock разделены | Case 2 |
| Retry/debounce/timeout | Минимальная подмена и поддержанное async продвижение таймеров с await эффекта | Case 4 |
| Значимая гонка | Достижимые фазы, реальные независимые транзакции/guard, публичные исходы и итоговое состояние; допустим любой контрактный победитель | Case 3 |
| Цикл lock/barrier | Проверка графа ожидания; достижимая pre-lock фаза вместо барьера за удерживаемой блокировкой | Case 3 |
| Deadline и cleanup | Независимый рабочий предел, release/cancel/join/dispose/restore на каждом выходе; all/race не отменяют участников | Case 5; Node failure paths |
| Полномочия и доказательства | Diagnose/review остаются read-only; реальные границы не заменены mocks; завершение не выводится из одного зелёного tooling check | Case 5; structural regression checks |

Основной метод расположен в одном разделе `testing.md`. Root оставляет короткое
правило и триггер чтения. React/anti-patterns добавляют свои наблюдения, а не второй
независимый свод. Для конкретного API требуется совместимость с версией потребителя;
метод не зависит от сети или внешнего репозитория. Первичные публичные источники
по Node, Vitest, Testing Library, PostgreSQL и общим паттернам приведены в reference.

## Авторская проверка

`skill-source-compiler`, стадия `Audit instruction quality`: **ready-to-regenerate**.
Проверены outcome/consumer, входы, полномочия, canonical rules, условная загрузка,
source/generated parity и переносимость. Все 23 объявленных файла доступны.
Новые commands/modes/runtime/hooks не добавлены. Это self-check, не независимый PASS.

Критерии cases 2–5 зафиксированы до изменения активного кандидата. SHA-256
`evals.json`: `8fc5aa6463f8fa910f19895e1fbf1c546beef5460d72ce0566a19f03e8e6f5d3`.
Case 4 сохраняет достаточный корректный вариант, чтобы обнаружить избыточный запрет.

## Выполненные команды и результаты

Записи команд используют относительные пути или переносимые алиасы временных
каталогов. Алиасы заменяют только пути окружения; API, flags, результаты и пределы
свидетельств сохранены. Runtime: Node `24.21.0`, итоговые package checks — pnpm
`10.28.2`. До настройки временного tool cache baseline test также прошёл на pnpm
`10.34.5`; настройки проекта не менялись.

| Команда/проверка | Результат |
| --- | --- |
| `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint skills/typescript-test-engineer` | OK, без предупреждений |
| `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/typescript-test-engineer` | Обновлены два compiler-owned файла |
| `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/typescript-test-engineer` | OK: structure/drift/reachability/portability |
| `pnpm --filter @kostysh/typescript-test-engineer test` | 21/21 documentation contracts, warnings/stderr чистые |
| `python3 <skill-creator>/scripts/quick_validate.py skills/typescript-test-engineer` | `Skill is valid!`, structural validation |
| `node --unhandled-rejections=strict --test --test-timeout=5000 <events.test.ts> <server.test.ts>` | 3/3; извлечены дословные fenced blocks |
| Server example с намеренным `assert.fail` вместо финального assertion | Ожидаемый exit 1 по assertion без timeout/зависания; cleanup выполнен |
| Compiler `compile ... --out-dir <new-output-root>` и `check <emitted-skill>` | OK; независимая временная копия, без source overlap |
| `node --test test/docs-contract.test.mjs` из emitted skill | 21/21 без внешних authoring dependencies |
| Byte parity и local links/anchors | 14 emitted root/reference/metadata/test/eval файлов совпадают; четыре references и пять входов доступны |
| `git diff --check` | Чисто |

Нормализованные записи: [example-checks.txt](../forward-tests/20261107-async/example-checks.txt)
и [package-checks.txt](../forward-tests/20261107-async/package-checks.txt). У целевого
пакета объявлен только `test`: отдельного coverage/typecheck/lint script нет.
В локальном контуре workspace suite не запускался: остальные пакеты не менялись.
После разрешения доставки он выполнен в полном предрелизном контуре ниже.

## Behavioral evidence и независимое ревью

После явного разрешения на делегирование четыре fresh-context исполнителя
получили активную копию skill и свой нейтральный вход, без answer keys, source
bundle, истории или соседних результатов. Fork mode — `none`, overrides не
запрашивались. Наблюдаемые metadata: `gpt-6.1-sol`, effort `max`; это metadata,
не независимая аттестация provider runtime.

[Trial assessment](../forward-tests/20261107-async/trial-assessment.md) связывает
закрытые критерии с outputs/tool events. Cases 2–5: **4/4 PASS**, также независимо
сопоставлены с 21 expectation и девятью строками приёмки. В наблюдаемых tool calls
выполнялись только scoped чтения. Hashes входов и активных копий до/после совпали.

[Первоначальный change-review](../reviews/review-20261107-async.md): независимый
PASS по 18-file instruction snapshot; проверяющий не автор и не исполнитель trials.
Решения активных инструкций и критерии после этого не менялись. Отдельный
[re-audit публичных records](../reviews/review-20261107-public-records.md)
завершён с **PASS**, assurance `independent`. Новый проверяющий не автор
исправлений или первого review. Он проверил 33 полных изменённых/добавленных файла,
26 tool events, четыре ответа, snapshot/linkage и сохранение смысла exports.
Aggregate reviewed records:
`a54ceed404a7918ebca75101c8a9992a96af4bfc51f502d128a2fb7f47f26693`.
Старый PASS не использован вместо проверки этой дельты.

[Исходный snapshot](../forward-tests/20261107-async/snapshot-instruction-review.json)
включает 18 файлов, aggregate SHA-256
`4542d7a277d7a2c335643470c033cd01229912b4ebf760f17c57ada4cd2a2c41`.
[Текущий snapshot](../forward-tests/20261107-async/snapshot.json) после очистки
supporting descriptions: `9e6cd7b52ff27a1ced3723e8f6f59525905eed359f6b2340c7ec1de19a9c3847`.
Encoding: sorted relative path, NUL, file SHA-256, newline; UTF-8.
Изменены только четыре supporting descriptions в manifest и служебный source hash
в generated root; тело инструкций побайтово совпадает. Точное сравнение и основания
reuse сохранены в [metadata delta](../forward-tests/20261107-async/metadata-redaction-delta.json).
Supporting records находятся вне этих instruction snapshots.
Метаданные запусков: [trial-runs.json](../forward-tests/20261107-async/trial-runs.json),
[review-run.json](../forward-tests/20261107-async/review-run.json).

Пределы: forced invocation не проверяет selection; design/review/diagnose trials
не исполняли предложенный TypeScript или DB/Vitest/worker. Отдельные Node examples
проверили только показанные локальные events/HTTP и failure cleanup. Все schedules,
cancellation paths, browser/security/provider boundaries и before/after улучшение
не заявляются. Case 1 не запускался заново. В case 4 сохранён stdout, но не коды
выхода отдельных чтений; первоначальные усечения и последующее дочитывание видимы.

## Подготовка публичных records

Исправлена ошибка обработки свидетельств: в supporting records были перенесены
внешние provenance, не подходящие для публичного репозитория. Они удалены без
сохранения неочищенной копии. Удалены внешние идентификаторы проектов/заданий,
ссылки и fingerprints, внутренние идентификаторы сессий и пути локальной машины.

Outputs и tool traces теперь явно обозначены как нормализованные публичные
экспорты. Порядок событий, смысл команд, результаты, hashes исходных входов и
ограничения сохранены; побайтовая идентичность исходным журналам не заявляется.
Root cause — ошибочное ограничение проверки только активной переносимостью:
публичная граница должна учитываться и для supporting evidence. Изменение не
затрагивает решения инструкций или закрытые критерии; повторять behavioral trials
без материального изменения решения не требуется. При проверке полного содержимого
изменённых файлов также очищены исторические provenance в navigation/supporting
descriptions. Первичная нормализация не разбирала вложенные строковые JSON results;
исправление удаляет runtime identifiers рекурсивно, включая усечённые записи, и
сохраняет stdout/exit/truncation semantics. Исправлен локальный fragment в первом
review, а формулировки проверки пакета ограничены фактическим scope: целыми текущими
изменёнными/добавленными файлами, без аудита посторонней неизменённой истории.
Независимый re-audit подтвердил отсутствие запрещённой provenance в этом scope,
сохранение смысловой достоверности exports и допустимость итоговых claims.
После verdict обновлены только supporting statuses/links и metadata результата;
эта административная дельта не входит в предыдущий aggregate. Для неё выполнен
финальный content scan. Outputs, результаты команд, критерии и инструкции при
этом не менялись. Неочищенные копии в репозитории не сохранялись.

## Статус

Локальная доработка `0.1.11` завершена. Structural/examples checks и четыре blind
trials пройдены; исходный instruction review и отдельный public-record re-audit
дали независимый PASS. Новых существенных findings не осталось.
Новых runtime или изменений потребляющих проектов нет. На завершение локального
этапа публикационные действия ещё не выполнялись.

## Подготовка доставки

После локальной приёмки оператор разрешил публикацию и последующую локальную
синхронизацию. Применяется [процедура выпуска](../../../../cli/README.md#development-and-releases):
собранные skill files, проверка истории contentHash, тег `skills-*` и публикация
GitHub Actions. Выпуск npm CLI для этой правки не требуется.

До commit/PR выполнено:

- `pnpm install --frozen-lockfile --ignore-scripts` с временным store — lockfile
  не изменился; Node `24.21.0`, pnpm `10.28.2`.
- `pnpm test:ci` — 127/127 тестов в шести пакетах, без failures/skips.
- `pnpm --filter @kostysh/skills lint` — Biome/ESLint/typecheck прошли.
- `pnpm --filter @kostysh/skills verify:package` — tarball, clean install,
  npx/pnpx, fixture install/update и failure paths прошли; это не доказательство
  публичной npm-публикации.
- `pnpm --filter @kostysh/skills pack:skills --out <empty-output-directory> --release skills-20261107 --previous-latest`
  — подготовлены 37 skills; история опубликованных версий принята.
- Архив `typescript-test-engineer-0.1.11.tgz` содержит шесть runtime files,
  без source/docs/tests/evals; SHA-256 архива соответствует каталогу, все шесть
  файлов побайтово совпадают с checkout.

Кандидат release tag — `skills-20261107`. Фактическая публикация и локальная
синхронизация проверяются после merge и завершения release workflow; эти
предрелизные результаты не объявляют удалённый выпуск состоявшимся.
