# P04 / P07: закрытый план source/API probes

Статус: подготовка до target edits; НЕ исполнялось. Этот файл предназначен координатору/оценщику, не blind исполнителю. Authority: первоначальные P04/P07 в case-proposals-payload.md и отдельное поручение root на лёгкую подготовку. Ни fixture files, ни этот план не доказывают runtime. Root должен independently review/freeze снимки, runtime dependencies и raw task до выдачи. Source probes оценивают исполнимость конкретного текста; blind P-core исполнение отдельно оценивает поведение агента. Смешивать эти результаты нельзя.

## P04 — минимальный временный SQLite runtime

1. Root готовит отдельную папку `fixtures/payload-atomic`, точные payload/@payloadcms/db-sqlite 3.88.0, lockfile и отдельный file: URL внутри trial. Не использовать PostgreSQL P-core для этого случая: он скроет SQLite default boundary. Только разрешённый локальный файл БД; no remote storage. Declared script `probe:atomic` должен запускать один контролируемый Node/Payload entrypoint, без внутренних dependency binaries. После подготовки freeze исходники, lockfile и raw task P04.
2. Нейтральная модель: Inventory(sourceKey unique, stock number), Orders(sourceKey unique, quantity, inventory relation), Audit(order relation, inventory relation, quantity). Исходно один inventory sourceKey=sku-1, stock=10; Orders/Audit пусты. Hook успешного Order уменьшает stock на quantity и добавляет Audit. Между обновлением Inventory и Audit имеется единственный управляемый throw `P04_CONTROLLED_FAILURE`. Этот task-local control задаётся в req.context и не имеет публичного произвольного execution API. Незавершённая реализация должна быть достаточно мала, чтобы не выдавать решение req/adapter контрактов.
3. Frozen skill source projection: зафиксировать точные root transaction example + references/adapters.md nested-write req guidance и references/queries.md req optional guidance для baseline/candidate. В отдельной disposable projection копировать инструкции/пример с журналом всех необходимым name/import adaptations, без скрытого исправления transaction behavior. Это source probe, не blind actor; нельзя заявлять, что агент сам написал скопированный код. Если пример не является standalone, чётко разделить authored host от copied body.
4. До операции получить nefiltred state через elevated Local API/read-only DB; исполнить accepted create quantity=2 без контрольного сбоя; перечитать БД новым Payload instance: stock=8, ровно один Order и один Audit, правильные связи. Сохранить ID sets и row values, не только counts.
5. Только эту fixture reset к stock=10/пустым Orders/Audit; сделать тот же create quantity=2 с контрольным сбоем после inventory update. Сохранить thrown error/unsuccessful outcome, затем независимо перечитать БД после завершения операции: stock=10, Orders=[], Audit=[]. Нельзя выдать ошибку API за доказательство rollback; inspect actual persistence. Сравнить snapshot с pre-state.
6. Отдельно read exact installed db-sqlite options/default transaction implementation и Payload parent operation/transaction lifecycle; записать реально действующий transaction setting и observer transactionID null/non-null без credentials. Published official SQLite docs/transaction source должны соответствовать выбранной stable версии; source reading не заменяет шаги4/5.
7. Для прямого проверки default claim выполнить одинаковый host/operation и контролируемый сбой в двух явно помеченных source-driven configurations: default adapter и конфигурация, предписанная текущим inspected skill для атомарности. Не менять copied body при сравнении. Если candidate задаёт transactionOptions:{}, проверить именно этот путь; если ничего не задаёт, не подставлять исправление оценщиком. Наблюдать фактическое partial/rollback поведение, не предполагать его заранее.

Критерий: заявленная атомарность подтверждена только при полном rollback и поддерживаемой установленным adapter транзакции. Наличие req, await или зелёный typecheck отдельно недостаточно. Успех с PostgreSQL/MongoDB не подменяет SQLite. Ещё не подготовлены executable host/lockfile, нет запусков.

## P07 — source callbacks, HTTP policy и workflow отдельно

Source projections: frozen `payload/references/plugin-development.md` Access Control Wrapper Pattern (baseline lines1051–1084; перед extraction проверить точные строки) и `references/advanced.md` Workflows (baseline lines129–155). Копировать исходный контракт, а не исправленную реализацию. Для candidate заново записать snapshot/точные ranges. Только compile-time синтаксические/import/name adaptations задокументировать; change semantic API = отдельная author intervention, не source PASS.

### Access callback probe

Предложенный declared command после root подготовки: `npm run probe:access`. Один небольшой файл импортирует проектный tenant plugin (для behavior trial) либо exact copied source projection (для source trial). Эти два imports и результаты имеют разные labels.

- Последовательно подставить исходные read функции со значениями false, Promise.resolve(false), true, Promise.resolve(true), Where, Promise.resolve(Where); Where={visible:{equals:true}}. Для каждого варианта actor req.user.tenant=alpha, затем beta, затем absent user.
- Сохранить исходный вызов/полученные args, resolved result и типы внутри результирующего дерева. Falsifier: false не остаётся deny; Promise/boolean вставлен внутрь and; исходный predicate не вызван/не awaited; нет tenant narrowing; existing rule исчезла. Непубличные full rules находятся только здесь, не в raw task.
- Проверить существующие fields/access callbacks нецелевых операций, admin configuration и hooks identity/order, а также нетarget collection. Не вводить отдельный новый plugin framework или широкую config compatibility suite.

### Реальная API граница в P-core

- Root provisions source/actors.json и source/records.json на пустой `framework_payload_core`, сохраняет seed identity readback без паролей/токенов. Для каждого note collection есть alpha-visible, alpha-hidden, beta-visible, beta-hidden. Шесть типов read позволяют проверить каждую sync/async boolean/Where ветку в реальном collection API; это одна политика доступа, а не шесть продуктовых features.
- Для anonymous/user-A/user-B/admin вызвать GET `/api/{sync-notes,async-notes,open-notes,async-open-notes,closed-notes,async-closed-notes}?depth=0&limit=100`. Собирать actual status/IDs, не принимать 500 за корректный deny и не предполагать, что malformed Where обязательно выдаст данные. User A/Admin имеют tenant alpha, B — beta. Existing false означает отсутствие разрешённых documents; true допускает только свой tenant; Where добавляет visible=true.
- Проверить стандартные Posts API и related отдельно: tenant plugin не назначен Posts, чтобы P02 anonymous published policy не была переписана этим пробным компонентом. API+pure callback results могут различаться; оба сохраняются с границей вывода.
- Existing hook origin=existing-note-hook наблюдать в seeded notes и после одного разрешённого elevated setup write в пределах fixture; plugin не должен удалять hook. Это не разрешение публичной note write feature.

### Jobs

- Declared scripts P-core `queue:report`, `jobs:run` первоначально незавершены. После исполнения агентом root/assessor запускает ровно созданные scripts (команды и args из accepted runtime output), а не заменяющий helper. Queue source/report.json: requestKey report-001, text с внешними пробелами.
- Read queued job перед run, зафиксировать job ID, workflow/input, queued status и отсутствие готового Reports row. Не полагаться на один console message. Run worker один раз, дождаться реального terminal outcome, перечитать job и Reports через API (task-local auth/elevated read для системной jobs коллекции, не anonymous job leakage).
- Конечный report должен соответствовать единственному source requestKey, inputText сохраняет оригинал, normalizedText=`Quarter Report`, characterCount=14. Проверить фактические step outputs/logs этого job и job completion без errors. Одного созданного Reports документа без выполненного queued workflow недостаточно.
- По exact installed WorkflowHandler/inlineTask/task output types сопоставить source API с используемыми вызовами. Source projection `job.runInlineTask` может дать compile/runtime error; это сохранить как source failure, не исправлять молча и не считать очередью/выполнением. Финальный behavior trial может самостоятельно использовать другой правильный framework путь; отчёт различает source finding и фактическое поведение агента.

## Условия перед запуском и итоговый пакет

Root должен выпустить один ограниченный runtime слот, согласовать исходные fixture inputs и обеспечить DB/actor provisioning. P04 SQLite и P-core PostgreSQL изолированы; baseline/candidate стартуют с равных очищенных fixtures, snapshot before/after сохранён. Payload versions/core lock идентичны; будущие transformations источника фиксируются отдельно. API passwords/tokens/DB URI secrets остаются вне evidence.

Сохранить: protocol hashes; actual script inputs и outputs; observed exit/status; unfiltered IDs/rows; applicable source/installed-source lines; config/source projection delta; per-boundary PASS/FAIL/INCONCLUSIVE. Данный план не является результатом probes. Он не расширяет P04 до внешних upload rollback или P07 до scheduler/remote worker/concurrency/retry идемпотентности.
