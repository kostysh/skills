# J01: runtime handback

**verified в границах временного service fixture:** V1–V5 выполнены, 160 проверок expected/actual, 44 отрицательных service-входа и 12 дополнительных прямых SQL input checks; финальный процесс завершился с кодом 0, stderr пуст. Это результат исполнения, не независимый финансовый/GDPR verdict.

Источники: SPEC.md S1–S13/V1–V5, input.json R-F1/R-D1/R-D2/R-I1, count-clarification.json, finance-handoff.md и gdpr-handoff.md. Авторизация исполнения — отдельное поручение оператора, а не разрешение, выведенное из аналитических handoff. Применены neighboring node-engineer и implementation-discipline (operations / verification-loop). Потребители — владельцы PREVIEW-1 и GDPR, следующий шаг — их повторная оценка этих свидетельств.

Изменения только во временном runtime и этом отчёте; данные только в domain_rev_candidate. Прямые preview(request, now), exportPreview(row), purge(now) на Node ESM + PostgreSQL выполняют требуемый service-контур. HTTP listener не добавлен: SPEC допускает HTTP/service. Использованы node builtins, без npm, зависимостей, frontend, общего пакета или постоянного harness.

## Исполненные результаты

| Проверка | Фактический результат / свидетельства |
|---|---|
| V1 | N0, P1, N1, N2, Q10, EXACT, MAX, MIN: фиксированные literal Node/SQL/service JSON/export совпали. В evidence.json по каждому ID отдельные expected/actual; суммы JSON strings. Каждый preview и export возвращает отдельный SELECT readback. |
| V2 | 44 некорректных входа отвергнуты до записи: format/range/quantity/tags, каждое отсутствующее и null обязательное поле, id, subjectKey, expiresAt. После каждого — сравнение обоих полных наборов с контрольным состоянием. Подставные netMinor/feeMinor игнорируются, результат серверный. SQL отдельно отклонил MAX×2 и MIN×2 с `ERROR: net range`. |
| V3 | Успешные запросы содержали EXTRA-MARKER, netMinor=999, feeMinor=999. Реальная row/export-проекция совпала с разрешёнными literal objects. Логи успеха, валидации и duplicate primary-key DB error — только event/status/count. logger.jsonl сохранён полностью; отсутствуют marker/subject/request/суммы/DB detail. |
| V4 | id100 expiresAt100: now99 count0 и обе копии; now100 count1 и обе отсутствуют; now101 count0. id102 expiresAt200: первое удаление now201 count1. id101 expiresAt9999 и экспорт сохранены, как и восемь неистёкших финансовых fixtures. Все результаты содержат отдельно прочитанные наборы. |
| V5 | id103 expiresAt300: реальный BEFORE DELETE trigger export выбросил `synthetic export delete failure`. CTE primary DELETE возвращает id для export DELETE; ошибка второго удаления откатывает изменения. Вызов бросил `database failure`, успешный count не вернул; полный readback после rollback равен состоянию до вызова, включая id103 и экспорт. После DROP trigger retry now300 count1, обе копии отсутствуют; now301 count0, контроль сохранён. |

Точные readback, literal expected/actual и реальные ошибки PostgreSQL находятся в [evidence.json](runtime/evidence.json). Диагностика сервиса — отдельный [logger.jsonl](runtime/logger.jsonl); raw DB error сохранён только проверяющим исполнителем как синтетическое evidence, не передаётся logger. Финальное состояние — [run.stdout](runtime/run.stdout).

## Найденная ошибка реализации и исправление

Первый запуск остановился на MAX-sql: expected fee `4611686018427387903`, actual `4611686018427387904`; [first-failure.stderr](runtime/first-failure.stderr) сохраняет оригинальный assertion. Причина — PostgreSQL numeric division `n/2` округлила результат до floor. Исправлено на точное `floor(n*0.5)`; расширение `u::numeric` происходит до умножения quantity, оба диапазона проверены до возврата/записи. Node использует BigInt и коррекцию отрицательного остатка. Финальный тот же MAX witness и весь обязательный SPEC-набор прошли. Regex Node также использует абсолютный конец строки; отрицательный subjectKey с завершающим newline отвергнут.

V5 после первой успешной серии уточнён в реализации: primary DELETE является источником id для export DELETE в одном data-modifying CTE. Это усиливает свидетельство rollback реально начавшейся primary deletion, а не только ошибки первого оператора. Финальная полная серия повторена после изменения; лишних сценариев за пределами SPEC не добавлялось.

## Исправление прямой SQL NULL-границы

После первоначального handback read-only проверка владельца выявила: `calc(NULL,1)` и `calc('1',NULL)` завершались успешно с `{n:null,f:null}`. Исходная ошибка воспроизведена до изменения (exit0), вывод сохранён в [before-null-fix/null-failure.stdout](runtime/before-null-fix/null-failure.stdout). Предыдущие source, evidence, logger, hashes и отчёт сохранены в runtime/before-null-fix. Это реальный дефект SQL-входа; service guard уже отклонял NULL и не компенсировал недостаток заявленного прямого SQL-контракта.

Минимальное исправление schema.sql: `u IS NULL OR q IS NULL` добавлены к существующему входному условию RAISE EXCEPTION, без нового поля или API. Дополнительно проверены непосредственно calc(u text,q integer): NULL u/q, восемь неканонических/выходящих за int64 текстов (`""`, `" 1"`, `"+1"`, `"01"`, `"-0"`, `"1.0"`, обе внешние границы), quantity 0 и 11. Все 12 вызовов дали `ERROR: invalid calculation input`; после каждого оба набора перечитаны и неизменны. Существующие SQL MAX×2/MIN×2 проверки также сохранены. Нет утверждения о JSON-type validation внутри typed SQL API: JSON number/string discriminants проверяет service.

Полный обязательный V1–V5 набор повторён после пересоздания только domain_rev_candidate, вместе с этими 12 SQL проверками: exit0, 160 assertions, stderr пуст. Новые hashes ниже относятся к этому финальному snapshot; предыдущий verdict не переиспользован.

## Среда и воспроизведение

Node v24.15.0, native ESM `.mjs`; PostgreSQL 18.4 (Debian 18.4-1.pgdg13+1), x86_64, 64-bit. Уже существующий контейнер codex-domain-rev-20260909, `docker inspect --format '{{.HostConfig.NetworkMode}}' codex-domain-rev-20260909` вернул `none`. Контейнер не остановлен. Пакетные команды отсутствуют: это разрешённая одноразовая проверка в /tmp.

Точные команды запуска:

```sh
node --version
docker exec codex-domain-rev-20260909 psql -U postgres -Atc 'select version()'
node /tmp/domain-rev-20260909/candidate/joint/runtime/run.mjs > /tmp/domain-rev-20260909/candidate/joint/runtime/run.stdout 2> /tmp/domain-rev-20260909/candidate/joint/runtime/run.stderr
```

Перед повторными запусками удалялась только собственная schema: `docker exec codex-domain-rev-20260909 psql -U postgres -qAtc 'DROP SCHEMA domain_rev_candidate CASCADE'`; stdout/stderr последнего reset сохранены. run.mjs создаёт schema.sql, затем вызывает сервис. Каждый SQL вызов использует `docker exec -i codex-domain-rev-20260909 psql -X -qAt -v ON_ERROR_STOP=1 -U postgres`, SQL подаётся через stdin, timeout 10000ms; shell interpolation входов отсутствует. Точные SQL операций и failure trigger записаны в service.mjs/run.mjs. Повторение требует такого же осознанного сброса только этой disposable schema, поскольку CREATE SCHEMA преднамеренно не перезаписывает существующие данные.

Snapshot SHA256:

- service.mjs: `b0d3000ef20117a5f566cbeceddd2cb6b9f9e7291ce61a8d3b638cc79ae8f2c3`
- schema.sql: `4629a5968c60accd72dc7316eaf1a413ee46ba9ca6826325216c65489f3ec126`
- run.mjs: `c2e55feb3a0054fe9fa5202899136b9a1a55ae4f782611a61b466a537f6b706f`

Файл SHA256SUMS содержит те же значения. Совместимость подтверждена только для указанных версий и прямого service-пути. HTTP wire, конкуренция, production, реальные пользователи, deploy/release и юридическая законность не проверялись и не заявляются. Повторный id отклоняется primary key; upsert/replay contract не вводился. Финансовые суммы не являются налогом или ledger. R-D1 об отсутствии третьих сторон/backups принят как факт ограниченного сценария, не доказан этим запуском. No Git/publication.
