# P04/P07 — независимая оценка source runtime probes

**Результат: root-пример атомарности на default SQLite — FAIL; baseline reference-enabled атомарность — PASS; literal workflow — FAIL. Достоверность source projection и регистрации результатов — PASS.** Все три командных процесса завершились0, но это не означает функциональный успех всех проверяемых примеров. Здесь нет blind behavior или agent-selection verdict.

Оценщик независимо прочитал frozen protocol, inputs, полные агрегированные и individual observations, command outputs, installed-source и прежние source/preflight manifests. Fixture/target/app не менялись; runtime не повторялся.32 offline проверки source fidelity/строк/ID/ошибок/rollback совпали; снимок: `baseline-P04-P07-source-assessment-snapshot.json`.

## Источники и стабильность

Пакет `P04-P07-source-runtime` имеет34 files с hashes; все совпали с manifest, семь input hashes совпали с protocol от2026-09-09T13:59:32Z. В installed package.json и lockfile подтверждены payload/db-sqlite3.88.0, graphql16.11.0, tsx4.20.5, sharp0.34.3. Изменение package относительно preflight — явная graphql dependency перед freeze; implementation body не изменён.

- `atomic.mjs` — ранее рассмотренный authored Inventory/Orders/Audit host, SHA `cde7a6cfd49fbff8881465ee53891f0882ae9a01043e556bd9bc3a7a0681180f`. Это семантическая проверка req/transaction pattern с собственными model/throw/assertions, не буквальный пример skill.
- `literal-hook.mjs` — точные root SKILL.md122–133 с export wrapper, SHA `9dd7a713f02886572fc0065337b9788ec25b4d372cdc8e235e7dce3bf4ad6552`. Authored parent/audit-log host и отдельный audit.beforeChange failure не выданы за текст skill.
- `literal-workflow.mjs` — точные advanced.md134–154 с array wrapper и локальными наблюдаемыми sendEmail/createTasks stubs, SHA `4025bd5995d635d9a7dca88cba13e961a56bb9070dfa00b53ff1105a50cd1b3d`. Тело job.runInlineTask не исправлялось.

Машинно повторно подтверждён exact body перенос. Архивные initTransaction/sqlite-index/defaultBeginTransaction/drizzle-beginTransaction совпадают byte-for-byte с текущими installed files. Runtime commands — declared npm run probe:atomic/probe:literal/probe:workflow, завершились0 за17.352/20.344/4.236с. Observe выполняется в новом Node process после operate; content reads elevated и не фильтруются публичной policy.

## P04: состояние БД после операций

| Host / режим | Success | Контрольный failure | Вывод |
| --- | --- | --- | --- |
| Authored semantic / SQLite default | stock8, Order1, Audit1; точные quantity2 и relation IDs | stock8, Order1, Audit0, ошибка P04_CONTROLLED_FAILURE; before был stock10/0/0 | Partial persistence: FAIL требуемой атомарности |
| Authored semantic / baseline adapters opt-in | stock8, Order1, Audit1; правильные IDs/quantity | stock10, Order0, Audit0; полный after snapshot равен before, включая Inventory timestamps | PASS rollback указанного DB unit |
| Literal root / SQLite default | parent1, audit1, docId соответствует parent.id | parent1, audit0, ошибка P04_LITERAL_CONTROLLED_FAILURE; before был0/0 | Partial persistence: FAIL безусловного «OK ATOMIC» |
| Literal root / baseline adapters opt-in | parent1, audit1, правильный docId | parent0, audit0; полный snapshot равен before | PASS rollback указанного DB unit |

В semantic host все nested find/update/create получают тот же req. `Boolean(await req.transactionID)` фактически false в обоих default случаях и true в обоих reference-enabled. Ошибка совпадает с конкретным injected failure; relationship population ошибка из раннего preflight не возникла после предусмотренного depth0 fix.

Installed sqlite-index выбирает реальный beginTransaction только при truthy args.transactionOptions; иначе defaultBeginTransaction возвращает Promise.resolve(null). initTransaction ждёт этот результат и получает false при null. Это объясняет наблюдённый default partial state: req не создаёт поддержку транзакции у отключённого adapter. Включённый путь использует Drizzle session и rollback; прочитанное durable состояние, а не только error API, подтверждает результат.

**Bounded уточнение P-B06:** root122/129 безусловно маркирует передачу req как атомарную; literal execution показывает контрпример default SQLite. Но baseline **уже** содержит правильный `transactionOptions:{}` в adapters35–48, включая45, и явную оговорку87. Нельзя описывать весь adapters раздел как не содержащий opt-in либо считать reference-enabled путь candidate remediation. Полезная correction — сделать root/general shorthand условным на работающую adapter transaction и сохранить существующий корректный reference path. Прежняя severity P1 для риска partial write в заявленном atomic unit не повышается и не превращается в production incident; consequence теперь наблюдалась в локальном source host.

Также исправляется только locator старого P-B06: формулировка req optional при overrideAccess:true находится в **adapters149–153**, не queries. Она в данном probe не исполнялась: req передаётся везде. Missing-req, manual transactions, MongoDB/Postgres и внешние side effects здесь не проверены. Эти части исходного finding не закрыты.

## P07: literal queued workflow

Настоящий job1 onboardUser поставлен в default queue с input.userId=synthetic-user-1; queued readback показывает totalTried0, hasError=false, completedAt=null, log[]. Worker действительно запущен. Его `runResult.jobStatus[1].status` — error-reached-max-retries, а `runError` на уровне внешнего вызова null: Payload сообщает job failure через результат/сохранённое состояние.

Новый observe process читает один job с totalTried1, hasError=true, processing=false, completedAt=null, log[] и точным message **job.runInlineTask is not a function**. Локальный sideEffects массив пуст: ни один stub шага не достигнут. Итого0 completed/1 errored. Это runtime **FAIL** исполнимого source workflow; exit0 означает, что observer успешно сохранил факт отказа.

Installed WorkflowHandler получает `{inlineTask, job, req, tasks}`; literal source пытается вызвать метод на job. Это подтверждает workflow-часть **P-B07, P2** реальным queued execution, сохраняя отдельные непроверенные R2/auth части finding. Исправление требует supported inlineTask signature с явными task IDs/input/output, затем нового source queue/run/readback; простое отсутствие thrown exception от jobs.run не будет falsifier. P-core агент самостоятельно использовал правильный API и получил работающий report: этот успех не исправляет frozen literal source.

## Пределы verdict

Source fidelity PASS и совпадение предусмотренных observations не являются общим PASS скилла. Default partial state нельзя скрывать под `pass:true` semantic runner или `expectationsMatched:true` literal runner; эти flags означают, что негативный контрпример воспроизвёлся согласно probe design.

Baseline opt-in positive path подтверждён как DB rollback только для этих bounded SQLite units. Не заявлены user-agent выбор этого пути, candidate improvement, API/browser acceptance всего продукта, remote provider proof, schema migration safety или внешняя atomicity. Предыдущие технические baseline findings остаются в силе за исключением явно уточнённых выше evidence basis/locators. P07 access projection имеет отдельный отчёт; здесь не проверялся его HTTP bypass.
