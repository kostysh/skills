# P04 fixture: независимый read-only review подготовки

**PASS для ограниченной статической готовности authored semantic projection после исправления host finding. Runtime, установка и lockfile ещё не проверены.** Это не behavioral PASS агента, не literal-copy source trial и не PASS атомарности default SQLite. Автор host — root; reviewer — baseline_payload. Host не редактировался reviewer и не запускался.

Проверены полностью atomic.mjs (69 строк), package.json, P04 часть [P04-P07-probe-plan.md](P04-P07-probe-plan.md) и указанные frozen baseline sources. SHA256 текущих файлов: atomic.mjs `cde7a6cfd49fbff8881465ee53891f0882ae9a01043e556bd9bc3a7a0681180f`; package.json `9f1fe8d09a9bfaff0e3222a6a2de533925835b4175b34710392922a0edd3f470`.

## Исправленный finding и bounded delta

**P04-H01, P2 — resolved статически.** При первом чтении Orders create на строке59 не задавал depth, а hook45 передавал doc.inventory прямо в findByID.id. Exact Payload3.88 create source выполняет field afterRead до collection afterChange; установленный source в подготовленном Payload skeleton имеет defaultDepth2 и relationship population. Поэтому hook мог получить populated object вместо scalar ID и упасть до заданного контрольного сбоя. Это загрязняло бы проверку транзакций unrelated host ошибкой.

Root добавил только `depth:0` к parent Orders create. Повторное чтение подтвердило этот delta; он сохраняет scalar relation внутри исследуемого hook. Baseline transaction snippets такого шага не задавали: это допустимая инфраструктурная стабилизация нового авторского host, а не исправление скилла. Ошибка исполнения не воспроизводилась; закрытие основано на exact source/dataflow, окончательно его подтвердит readiness runtime.

Первоначальное полное содержимое было прочитано до изменения, но SHA был получен уже после root delta. При необходимости reconstructed pre-delta SHA из текущего текста с удалением ровно этого поля: `f0041bb2be0e10aa5c610f20cd0cf8023a39ef2b31b2b1b301372ef606cfe3d5`. Это реконструкция, не contemporaneous frozen hash.

## Достаточность проверок

- Модель и данные совпадают с P04: Inventory sku-1/stock10; Order sourceKey order-1/quantity2; Audit с обеими связями и quantity. Контрольный throw расположен после awaited inventory update и до audit create. Все nested операции получают тот же req.
- Каждая из четырёх веток имеет отдельный SQLite file; удаление ограничено этими файлами и их WAL/SHM. Операция и наблюдение запускаются отдельными Node subprocesses. Observe использует push:false; итоговые content reads — overrideAccess:true/depth0, без публичного access filter.
- Перед Order сохраняется полное состояние трёх content collections. В success проверяются stock8, один Order/Audit, точные sourceKey/quantity и relation IDs. При enabled failure требуется не только stock10/0/0, но deepEqual фактического после-снимка до-снимку. Это различает API error и реальный rollback, включая изменение timestamp Inventory.
- Ошибка должна быть ровно P04_CONTROLLED_FAILURE только в failure case; иные ошибки не объявляются ожидаемым rollback. transactionPresent фиксируется из фактического await req.transactionID. Следует сохранить реальные raw failures, если ожидаемый transaction state отличается.
- Limit100 достаточен для закрытого freshly-created host с одним Inventory, максимум одним Order/Audit и отсутствием внешнего seed; это не общая проверка полноты произвольной production БД. Контур ограничен тремя content tables, а не внутренними системными записями, внешними файлами или SMTP.
- Declared probe:atomic запускает public package imports payload3.88.0/db-sqlite3.88.0; tsx4.20.5/sharp0.34.3 зафиксированы. Никаких transitive/internal binaries в команде. Lockfile и installed readback ещё обязательны перед source/runtime свидетельством. Host использует import.meta.filename; выбранный Node runtime должен его поддерживать (текущий lab Node24 подходит по известному setup, но этот host там ещё не выполнен).

## Точные baseline ranges для manifest

Все пути ниже относительны `baseline-packages/payload/`; номера проверены по текущим frozen файлам.

| Источник | Точные ranges | Роль в projection / предел |
| --- | --- | --- |
| SKILL.md | 104–136 (полный раздел); 109–120 missing-req example; 122–133 same-req example | Общая теза и afterChange nested create. Host не копирует их тела буквально: он добавляет предметную модель Inventory/Orders/Audit, обновление stock, сбой, процессное наблюдение и assertions. |
| references/adapters.md | 35–48, включая45 | **Уже baseline** SQLite config содержит transactionOptions:{} и комментарий disabled-by-default. Reference-enabled ветка взята отсюда; её нельзя считать candidate correction. |
| references/adapters.md | 50–64 и87 | Shared transaction guidance/nested create и явная оговорка SQLite opt-in. |
| references/adapters.md | 89–114 | Same-req nested find/update pattern, семантическая основа read/update hook45–46. |
| references/adapters.md | 116–133 | Missing-req comparison source. Текущий host НЕ проверяет эту отдельную ветку: req передаётся в обоих modes. |
| references/adapters.md | 135–153 | Поддержка adapter/req rules, включая спорную административную req optional строку153. Текущий host не моделирует omission при overrideAccess:true; такое source finding не закрывается этим probe. |
| references/adapters.md | 66–84 | Manual begin/commit/rollback source, в host НЕ перенесён и НЕ испытан. |
| references/queries.md | 123–147; positive128–135, negative137–144 | Второй same-req afterChange example и link на adapters. Уточнение прежнего планового locator: административная req-optional формулировка находится в adapters149–153, не в этом queries фрагменте. |

SHA256: SKILL.md `d78623a1db9a7f93db5e8da14677b4ab2df20eaa4bbd90320c39afd96b47e817`; adapters.md `0c1d62bfa15ad36b44701f647e2fef75c76f5805d1153a8658436d6807e71d83`; queries.md `c3d524ddbc46335bfe6b949f1a7e7e15e14bacf9274c261995ffcf74fd918d0c`.

Для host fix проверены exact-tag `payload-official/v3.88.0--packages--payload--src--collections--operations--create.ts:361–432` (field afterRead → collection afterChange), read-only installed skeleton `payload/dist/config/defaults.js:47,121`, `fields/hooks/afterRead/index.js:12–18`, `relationshipPopulationPromise.js:4–82`. Последние — source reads другой уже установленной копии3.88, не установка/исполнение atomic fixture; atomic installed equivalence ещё проверяет root.

## Правильная интерпретация будущего результата

Строка32 `sourceProbe:true, pass:true` может означать только совпадение наблюдений **обеих** режимов с заданными ожиданиями. Default/failure ожидает partial persistence; это не атомарный PASS. В durable readback нужны separate outcomes: default partial, reference-enabled rollback либо их фактическое несовпадение. Summary нельзя переносить на full skill capability, blind P04 execution или весь транзакционный раздел.

Projection содержит существенный authored host, а не literal source body. Плановый literal-copy пункт3 в этом конкретном запуске не выполнен; текущая явная root классификация authored semantic projection является корректным ограничением доказательства. Baseline уже содержит opt-in/reference-positive путь; разница этих режимов сама по себе не доказывает, что baseline executor проигнорирует его. Candidate должен оцениваться по собственному frozen guidance, а не по произвольно назначенной оценщиком исправленной конфигурации.

Следующий разрешённый root шаг: сохранить hashes/semantic attribution в manifest, дождаться runtime слота, установить и зафиксировать lock, выполнить ровно probe:atomic и изучить каждый subprocess/branch output. Повторное широкое ревью не требуется без нового delta или нештатного runtime результата.

## Дополнение: отдельный literal root projection

**PASS ограниченной статической готовности дополнительного literal source probe.** По последующему поручению root полностью прочитаны `literal-hook.mjs`, `literal.mjs`, изменённый package.json и `P04-literal-projection-manifest.json`. Код не запускался. Предыдущее ограничение literal-copy пункта остаётся верным для `atomic.mjs`, но теперь подготовлен отдельный проверяемый путь, исполняющий root snippet буквально.

Машинное сравнение подтвердило: `literal-hook.mjs` — точные SKILL.md строки122–133 с единственной обёрткой `export default { ... }`; ни hook body, ни collection name, data или req не изменены. Source SHA совпал с manifest; literal SHA `9dd7a713f02886572fc0065337b9788ec25b4d372cdc8e235e7dce3bf4ad6552`. Authored host `literal.mjs` SHA `fd731f0f446c88564c8220e0451c19707451c0c3566c778c73aa437883e073f9`; новый package.json SHA `4d3c96374fa4acb6d5e249a02d939ed011ec5b81fb41d1cae90cf97fe986ede2` добавляет отдельный declared `probe:literal`.

Host сохраняет четыре независимых default/reference-enabled × success/failure ветки. Родительская collection `parents` использует неизменённый literal hook. Контрольный throw вынесен в отдельный authored `audit-log.beforeChange`, активируемый только task-local context. Такой host проверяет durable parent rollback при сбое nested create, не выдавая внедрение сбоя за текст skill. Scalar doc.id соответствует числовому docId для default SQLite IDs; в literal нет relationship population предпосылки, которая затрагивала старый stock host.

Каждая ветка использует отдельный свежий файл и отдельные operate/observe процессы. Readback content collections не фильтруется публичной access policy. Success требует один parent, один audit и точное равенство docId/parent.id; reference-enabled failure — нулевые оба набора и deepEqual before; default failure ожидает сохранённый parent без audit. Проверка точного контрольного error отличает этот сбой от инфраструктурной ошибки. Наблюдатель не выполняет parent create и использует push:false.

Новых blocking findings по прочитанному delta нет. Это дополнительный узкий literal boundary; он не заменяет stock-update semantic host и не покрывает manual transactions, missing req или внешние side effects. Runtime пока pending, lock/installed equivalence не проверены оценщиком. `expectationsMatched:true` в будущем означает совпадение четырёх предусмотренных результатов; default partial persistence по-прежнему является FAIL атомарности, а reference-enabled rollback — отдельным положительным наблюдением. Добавленная ветка ещё не доказывает, какой путь выберет blind агент.
