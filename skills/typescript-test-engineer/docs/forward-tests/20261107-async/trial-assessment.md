# Blind trials: асинхронные тесты

Результат авторской оценки: **4/4 cases PASS** по заранее зафиксированным
критериям. Это результаты trials, а не независимый verdict о skill.

- Кандидат: `0.1.11`, [snapshot-instruction-review.json](snapshot-instruction-review.json), aggregate SHA-256
  `4542d7a277d7a2c335643470c033cd01229912b4ebf760f17c57ada4cd2a2c41`.
- Case author и assessor: основной агент, автор кандидата. Независимые
  исполнители: `executor-2`–`executor-5`, каждый с `fork_turns=none`.
- Критерии: [evals.json](../../../evals/evals.json), cases 2–5; SHA-256
  `8fc5aa6463f8fa910f19895e1fbf1c546beef5460d72ce0566a19f03e8e6f5d3`,
  зафиксирован до изменения активных инструкций.
- Assigned settings: наследование текущих model/effort без override.
  В session metadata всех четырёх записаны `gpt-6.1-sol`, effort `max`;
  это наблюдение metadata, а не независимая аттестация provider runtime.
- Разрешение оператора: явное «Разрешаю» на четыре blind trials и независимое
  ревью с повторными проверками после исправлений.

## Наблюдения по закрытым критериям

Номера критериев — порядок `expectations` в соответствующем case.

| Case | Оценка критериев | Наблюдаемое решение | Нормализованный output / tools |
| --- | --- | --- | --- |
| 2 | 1–5 PASS | Оба listener Promise созданы до синхронного `start`; TTL 2 секунды и до/на/после assertions сохранены; fixture, `now` и timestamp ID согласованы через существующий seam. Реальный `clock_timestamp()` отделён от JS-часов. Для DB названы непроверяемые точные граничные моменты; no sleep/flush/validity extension. Watchdog, abort и join предусмотрены. | [output](case-2-output.md), [tools](case-2-tool-events.jsonl) |
| 3 | 1–5 PASS | `Promise.all` не объявлен синхронизацией. Обнаружен цикл A-row-lock → barrier → B-row-lock. Выбрана достижимая pre-lock фаза на существующем callback с отдельными соединениями, реальными SQL/guard. Проверяются успех, контрактный конфликт и авторитетный остаток; допустим любой победитель. Область порядков и cleanup ограничены явно. | [output](case-3-output.md), [tools](case-3-tool-events.jsonl) |
| 4 | 1–5 PASS | Для debounce выбраны await `advanceTimersByTimeAsync(99)` + `(1)` и существующий completion Promise. Корректный bounded async polling сохранён с реальными worker timers. Команда остаётся снаружи; объяснены pending/rejection/false semantics и проверка одной отправки. Failure cleanup и неизвестный lifecycle API названы отдельно. | [output](case-4-output.md), [tools](case-4-tool-events.jsonl) |
| 5 | 1–6 PASS | Сохранён diagnose-only. Выявлены surviving `second`, пропуск restore при rejection и deadline на fake timer; all/race не отменяют остальных. Рекомендованы release/abort/join/dispose и независимый deadline без per-await wrapper. Глобальные часы изолируются от concurrent tests. Источник позднего unhandled rejection не выдуман: обработчики all/race сами наблюдают входные Promises. | [output](case-5-output.md), [tools](case-5-tool-events.jsonl) |

Case 4 — контроль достаточного корректного решения: async `waitFor` не отвергнут,
новые события, библиотеки, runner или production hooks не потребованы. Во всех
cases сохранена read-only граница design/review/diagnose, runtime-проверки не
выданы за выполненные. Код в ответах — предложенный дизайн, не внедрённая правка.

## Exposure, состояние и ограничения

[trial-exposure.json](trial-exposure.json) фиксирует состав каждой копии:
generated root, четыре references, UI metadata и один нейтральный `request.md`.
Source bundle, evals с answer keys, supporting docs/history/results и соседние
cases исключены. Запрет читать другие пути был инструктивным ограничением на
общей файловой системе, не отдельным security sandbox.

[trial-runs.json](trial-runs.json) содержит роли исполнителей и observed model metadata; локальные идентификаторы сессий исключены.
Tool events экспортированы в нормализованном публичном виде: вызовы и результаты,
с сохранением исходных усечений. Private reasoning и посторонний контекст не
экспортировались. Во всех наблюдаемых вызовах выполнялись только `cat`, `rg` и
`sed` внутри разрешённого case. По hashes входы и активные файлы до/после каждого
исполнения совпадают; исходный 18-file snapshot сохранён отдельно; текущая metadata delta описана в metadata-redaction-delta.json.

Некоторые первые чтения были усечены; исполнители дочитали нужные разделы
отдельными командами, что видно в raw traces. Критерии и другие cases не читались
в наблюдаемых tool events. Они не передавались через историю родителя: все
четыре spawn использовали `fork_turns=none`.

Проверена execution после принудительного указания skill, а не его selection.
Входы синтетические; наблюдались решения и честные пределы design/review/diagnose.
Trials не исполняли предложенный TypeScript, PostgreSQL, Vitest, worker или
production-инфраструктуру. Не заявляются улучшение относительно baseline,
универсальная надёжность или полнота всех расписаний. Baseline сохранён в Git,
но его behavioral comparison не выполнялся. Независимый `skill-reviewer`
отдельно оценил эти свидетельства и весь изменённый surface:
[change-review PASS](../../reviews/review-20261107-async.md). Временные trial-копии
удалены после аудита; raw inputs восстанавливаются из неизменённых eval fixtures,
а состав активной копии и hashes сохранены в exposure manifest.

Публичный экспорт: абсолютные пути и внутренние идентификаторы удалены. Порядок tool events, смысл команд, решения, hashes исходных входов и сведения об усечениях сохранены. Эти файлы не являются побайтовыми копиями журналов окружения. Их точность и metadata delta получили отдельный [независимый re-audit PASS](../../reviews/review-20261107-public-records.md).

После проверки полного содержимого touched files supporting descriptions обезличены; изменились только manifest descriptions и generated source-hash metadata. Старые trials относятся к исходному snapshot; [дельта](metadata-redaction-delta.json) и текущий [snapshot](snapshot.json) проверены отдельно. Вложенные execution IDs также удалены из строковых JSON results, включая усечённые записи.
