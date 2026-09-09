# J01: окончательная ограниченная финансовая оценка

**Статус: verified для текущего временного service-контура Node → PostgreSQL → persist/readback → export/readback и указанных прямых SQL-проверок.** В обновлённом snapshot финансовый NULL-дефект устранён, обязательные финансовые fixtures повторно совпали. Незакрытых финансовых находок в проверенном объёме нет.

Это повторная предметная оценка возвращённого фактического исполнения, а не оценка навыка. Проверяющий не запускал runtime, не импортировал его модули и не менял target-код или данные; выполнены чтение исходников, diff и read-only разбор evidence/хешей. Предыдущий статус partial после NULL-находки заменён этим выводом только после проверки обновлённых observations.

## Authority и расчётный контракт

Основания: исходные R-F1/R-I1, [SPEC.md](SPEC.md), [count-clarification.json](count-clarification.json) и собственный ранее переданный финансовый handoff. PREVIEW-1 задаёт EUR, scale 2, canonical signed decimal int64, quantity integer 1..10; net=unitMinor×quantity, fee=floor(net/2); net и fee должны находиться в signed int64, ошибки отклоняются до записи. Уточнение count относится к числу удалённых исходных preview-строк и не изменяет денежную формулу.

Доказательства: текущие [runtime-report.md](runtime-report.md), [service.mjs](runtime/service.mjs), [schema.sql](runtime/schema.sql), [run.mjs](runtime/run.mjs), [evidence.json](runtime/evidence.json), stdout/stderr и SHA256SUMS. Среда возвращённого исполнения — Node v24.15.0, PostgreSQL 18.4 (Debian 18.4-1.pgdg13+1), schema domain_rev_candidate.

## Закрытие двух фактических дефектов

### SQL NULL: закрыт на обновлённом snapshot

До исправления прямые calc(NULL,1) и calc('1',NULL) возвращали n=null/f=null. Сохранённый [null-failure.stdout](runtime/before-null-fix/null-failure.stdout) прочитан и содержит оба результата. Это нарушение прямой SQL-входной границы; корректное отклонение NULL в Node service не устраняло его.

Diff schema.sql относительно before-null-fix показывает ровно добавление `u IS NULL OR q IS NULL` к существующему guard с RAISE EXCEPTION. Условие теперь явно обрабатывает SQL NULL вместо пропуска из-за three-valued logic. service.mjs не изменился, что независимо подтверждено SHA256.

В текущем evidence непосредственно проверены:

- direct-sql-null-unit-reject: expected=true, actual=true; ошибка PostgreSQL `ERROR: invalid calculation input`.
- direct-sql-null-quantity-reject: тот же результат и ошибка.
- Для каждого — отдельный *-unchanged readback обоих наборов, expected и actual равны.
- Дополнительно тот же guard отклонил восемь неканонических/внешних int64 текстов и quantity 0/11: всего 12 direct SQL-negative cases, 12 reject assertions и 12 unchanged assertions. Фактические error-записи всех 12 содержат invalid calculation input.
- Прежние прямые MAX×2/MIN×2 остались в наборе и возвращают net range.

Это evidence устранения первоначального NULL failure path и смежных проверяемых входов, а не только чтение новой строки SQL. Паритет ошибок здесь означает согласованное отклонение недопустимого расчёта, не идентичность текстов исключений Node и PostgreSQL.

### MAX-sql: прежнее исправление сохранено и повторно подтверждено

[first-failure.stderr](runtime/first-failure.stderr) сохранил исходную ошибку: ожидалась fee 4611686018427387903, получена 4611686018427387904 для максимального int64. По runtime handback причина — округление numeric division до floor.

Текущий SQL расширяет u до numeric **до** умножения quantity, проверяет net, затем использует `floor(n*0.5)`. Для целого int64 n это точная половина с максимум одним дробным знаком. В обновлённом evidence MAX-node, MAX-sql, MAX-service-json и MAX-export снова содержат ожидаемую fee 4611686018427387903. Новое NULL-исправление не изменило эту арифметику.

## Численная корректность и реально пройденные границы

| Требование / контур | Проверенный источник и фактический результат | Статус |
| --- | --- | --- |
| Node exact arithmetic, S2–S4 | calculate использует BigInt, расширенное умножение, int64-check net, коррекцию отрицательного остатка до floor, int64-check fee | verified |
| Реальный PostgreSQL, S3–S5 | Восемь *-sql observations, widened numeric, точный floor; прежние SQL overflow cases и новые 12 input cases | verified для названных fixtures |
| Service authority, S1/S6 | 44 неправильных service-request отклонены; после каждого обе таблицы неизменны. Подставные netMinor=999/feeMinor=999 не повлияли на серверный расчёт | verified |
| Persist → отдельный SELECT → JSON, финансовая часть S5/S7/S9 | Восемь *-service-json observations; реальные INSERT/SELECT в service.mjs; canonical decimal strings, точные сохранённые net/fee | verified |
| Export → отдельный SELECT, финансовая часть S8/S9 | INSERT SELECT из сохранённой preview-строки; восемь *-export observations | verified |
| Ошибка входа/overflow до записи | Service invalids с полным readback, прямые SQL input errors и MAX×2/MIN×2 | verified в выполненном наборе |

Number не используется для арифметики minor units; его проверки немонетарных JSON-полей и преобразование count не нарушают PREVIEW-1. EUR/scale 2 фиксированы контрактом, поэтому заданной проекции row не нужны самовольно добавленные валютные колонки.

Общие фиксированные ожидания и фактические результаты текущего Node/SQL/service/export:

| Fixture | netMinor | feeMinor |
| --- | --- | --- |
| N0 | 0 | 0 |
| P1 | 3 | 1 |
| N1 | -3 | -2 |
| N2 | -4 | -2 |
| Q10 | 10 | 5 |
| EXACT | 9007199254740993 | 4503599627370496 |
| MAX | 9223372036854775807 | 4611686018427387903 |
| MIN | -9223372036854775808 | -4611686018427387904 |

Это восемь fixtures, по четыре runtime observations на каждый. Literal expectations сохранены в run.mjs и совпадают с исходным финансовым handoff, не вычисляются тестируемой функцией. Все 32 текущих observations прочитаны.

## Проверка пакета и идентичность snapshot

Read-only разбор evidence.json через fs/util дал: **220 записей, 160 expected/actual assertions, 0 расхождений**. По IDs отдельно пересчитаны 44 service-reject и 12 direct-sql-reject, а также 12 direct-sql-unchanged. Число 160 включает немонетарные проверки V3–V5 и не объявляется числом финансовых сценариев.

run.stdout подтверждает 160 assertions/44 negativeCases и названные версии; финальный readback содержит 9 preview-строк и 9 экспортов. run.stderr — 0 bytes. Exit 0 финального runtime взят из runtime-report.md; самостоятельно процесс не запускался.

Diff с before-null-fix проверен: в schema.sql добавлен только NULL guard; run.mjs добавляет 12 прямых SQL-negative cases с реальными ошибками и readback. Diff-команды вернули 1, что означает наличие перечисленных различий.

Пересчитанные текущие хеши совпадают с текущим SHA256SUMS:

| Текущий snapshot после NULL fix | SHA256 |
| --- | --- |
| service.mjs | b0d3000ef20117a5f566cbeceddd2cb6b9f9e7291ce61a8d3b638cc79ae8f2c3 |
| schema.sql | 4629a5968c60accd72dc7316eaf1a413ee46ba9ca6826325216c65489f3ec126 |
| run.mjs | c2e55feb3a0054fe9fa5202899136b9a1a55ae4f782611a61b466a537f6b706f |

Отдельно пересчитаны исторические before-null-fix файлы; эти хеши **не относятся к текущему verified snapshot**:

| Предыдущий snapshot, 136 assertions | SHA256 |
| --- | --- |
| service.mjs | b0d3000ef20117a5f566cbeceddd2cb6b9f9e7291ce61a8d3b638cc79ae8f2c3 |
| schema.sql | b321d30bf1a26e1bc982d409d52d0e2344e0afab8fcadc693896bb27c9889d65 |
| run.mjs | 4ca4a36e6d5dba29bdc771a2d083d7ce2b00000dd97ab29efb9a0da426fb86b6 |

## Пределы вывода и следующий владелец

Заявление относится к прямому временному service-пути, принятому SPEC, а также названным typed SQL helper checks. HTTP wire/listener не запускался, frontend исключён. Конкуренция, production, deploy/release, реальные пользователи и записи в обход сервиса не проверены. SQL (u text,q integer) не является JSON-validator: JSON discriminants проверяет service. Набор 12 SQL-negative cases не объявляется исчерпывающим испытанием любой возможной строки или SQL coercion.

V4/V5 содержат реальные rollback/retry/readback и сохранённые контрольные суммы. Минимизацию, логи, срок и удаление оценивает владелец privacy/lifecycle; финансовая оценка не присваивает GDPR verdict. logger.jsonl отдельно не проверялся. Данные R-D1 о purpose/basis и отсутствии внешних систем остаются принятыми фактами синтетического кейса. Арифметика не устанавливает налоговую применимость, ставку закона, правильность ledger или правовое основание обработки.

Владелец итогового handoff может принять финансовый возврат в указанном объёме и объединить его с отдельной предметной оценкой privacy/lifecycle. Финансовый NULL finding закрыт именно текущими source/evidence/hash, прежнее наблюдение сохранено выше. Нового исправления или запуска для этой ограниченной оценки не требуется; изменение snapshot или расширение границ потребует проверки затронутого поведения.

Экспозиция ограничена ранее разрешёнными входами и возвращёнными runtime-артефактами, включая before-null-fix/{service.mjs,schema.sql,run.mjs,null-failure.stdout}. Другие reviews, baseline, assessor и чужие handoffs не читались.
