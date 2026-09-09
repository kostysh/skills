# J01 baseline runtime

**verified в ограниченном временном fixture: E1–E6 выполнены, 185 проверок passed.** Проверялись прямые вызовы Node service → реальный PostgreSQL → повторное чтение → export и purge. Это не HTTP/deployment, production, юридическое заключение, независимый code review или оценка skills.

## Полномочия и реализация

Источники: соседние `SPEC.md`, `input.json`, `finance-handoff.md`, `gdpr-handoff.md`. Применены соседние активные `node-engineer` и `implementation-discipline`, references operations и verification-loop. Область мутации: только этот временный runtime, этот отчёт и собственная схема `domain_rev_base` в предоставленном disposable container. Потребитель — синтетический вызывающий service; результат — точные сохранённые суммы и наблюдаемое согласованное удаление. Простейшая граница — built-in Node child_process → psql по stdin, без пакетов, сети, frontend и постоянного harness. Неверные входы, переполнение, несовпадающий readback или сохранённая копия после успешного purge фальсифицируют результат.

`preview(request,now)` возвращает `{row,reread}`; `exportPreview(row)` перечитывает серверную row по id, записывает три поля и возвращает фактическую экспортную копию; `purge(now)` возвращает `{count,reread}`. Count считает основные rows. Неизвестные поля игнорируются, суммы вычисляются сервером. Поля денег в JSON — строки; физически bigint. Node использует bigint, SQL — numeric до проверки int64. Удаление экспорта и основной row выполняется одной транзакцией PostgreSQL; exception откатывает обе операции. SQL-граница `sql_preview(jsonb,bigint)` самостоятельно валидирует и вычисляет перед insert. Транспорт HTTP исходником не определён и не добавлялся.

## Окружение и воспроизведение

- Node v24.15.0, native ESM `.mjs`, только built-ins; иные версии не проверялись.
- PostgreSQL `18.4 (Debian 18.4-1.pgdg13+1)`, x86_64, image `postgres:18.4`.
- Container `codex-domain-rev-20260909`, network `none`; оставлен running. Схема `domain_rev_base`; другие схемы не изменялись.
- Запуск: `node /tmp/domain-rev-20260909/baseline/joint/runtime/run.mjs` → `PASS 185 checks`, exit 0.
- Для повторного запуска только этой схемы: `docker exec -i codex-domain-rev-20260909 psql -X -U postgres -v ON_ERROR_STOP=1 -Atqc 'DROP SCHEMA domain_rev_base CASCADE'`, затем команда Node выше. Очистка ограничена собственной схемой; контейнер не останавливать.
- Каждый фактический SQL stdin, точная команда psql, exit status, stdout и stderr сохранены в [sql-transcript.jsonl](runtime/sql-transcript.jsonl). Это выделенное синтетическое evidence, не service logger.

## Наблюдения и соответствие

| Evidence | Результат / связанные требования |
|---|---|
| E1 | Все 10 фиксированных oracle fixtures через Node и SQL с одинаковыми ID, отдельным сбросом между движками. 8 точных результатов и 2 net overflow; чтение подтверждает строки либо отсутствие. S1–S4/S6. |
| E2 | 19 буквальных неверных финансовых входов на каждой границе; каждый отказ и отсутствие обеих копий подтверждены запросом. S1/S6. |
| E3 | 25 неверных входов service: id, subjectKey, expiresAt, отсутствие/null каждого обязательного поля. После каждого глобальные counts обеих таблиц 0; logger без payload. S1/S6/S7. |
| E4 | Полные preview/reread/export/reload для `9007199254740993` → fee `4503599627370496` и `-3` → fee `-2`; подставленные `netMinor`, `feeMinor` и `extra` не сохраняются. Состав физической схемы и возвращаемых JSON проверен. S4–S7. |
| E5 | id500 expiry200: purge199 count0, обе копии сохранены; purge200 count1, обе null; id501 expiry300 сохранён. Повтор purge200 count0. S7–S9. |
| E6 | Временный BEFORE DELETE trigger реально выбрасывает `synthetic export deletion failure`. Purge бросает `storage failure`, пишет failure/count0; id502 и экспорт остаются связаны. После DROP TRIGGER/FUNCTION purge210 count1 и обе копии null; id501 сохранён. S7–S9. |

Полные буквальные expected/actual с fixture ID: [results.json](runtime/results.json). Итог: [summary.json](runtime/summary.json). Фактические минимальные строки logger: [logger.jsonl](runtime/logger.jsonl); каждая проверена на точный состав event/status/count и допустимые статические event/status, маркер `PAYLOAD_MARKER` отсутствует. Например `{"event":"purge","status":"failure","count":0}`, затем `{"event":"purge","status":"success","count":1}`. Сырые ошибки БД остаются только в выделенном evidence transcript, не в logger.

## Исправления по результатам исполнения

1. Первая environment assertion ожидала короткую строку `18.4`, сервер возвращает полную Debian version string. Исправлено ожидание; первоначальное наблюдение сохранено в [initial-environment-assertion.json](runtime/initial-environment-assertion.json).
2. Первый арифметический run поймал реальную ошибку локальной SQL-реализации: `floor(n/2)` для `9223372036854775807` дал `4611686018427387904`, ожидается `4611686018427387903`. Numeric division округлило промежуточное значение. Заменено на точное `floor(n*0.5)`; перепроверена полная E1–E6 матрица. Исходные stdout и expected/actual сохранены в [initial-division-failure.jsonl](runtime/initial-division-failure.jsonl) и [initial-division-results.json](runtime/initial-division-results.json). Предварительная попытка не объявляется PASS.

## Snapshot и ограничения

SHA256:

- `service.mjs`: `a8e4aa2d7953d82f1f9a13354e5bf5d936674c1060e21e99f715e89399c37215`
- `schema.sql`: `1b74b4d9eb63be71bea4589b4d45e8d319d3567a81cea126151710131f00b470`
- `run.mjs`: `1d147995a852ba8b55e591c66f8be2ea18a02628e20f0e54c6ae15be62f34d6e`

S1–S9 подтверждены перечисленными сценариями в последовательном synthetic service fixture; конкурентные операции, HTTP, auth, backups, crash durability и production не проверялись и не заявляются. Новый продукт, публичные HTTP error codes, постоянная инфраструктура и публикация не добавлены. После run остаётся только неистёкшая пара id501 для наблюдения; временный failure trigger удалён. Пакет предназначен обоим производителям ограничений; формальные доменные вердикты остаются за ними.
