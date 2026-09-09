# Baseline P-version — независимая оценка

**P05legacy PASS; P05current PASS; P06plugin PASS** для трёх отдельных ограниченных задач. Материальных P1/P2, опровергающих наблюдаемый результат, не установлено. **Полный source FAIL остаётся неизменным**: исполнителю удалось разрешить конкретные случаи через installed-version evidence; это не исправляет исходные инструкции и не доказывает вклад skill против контроля без skill.

Assurance independent: оценщик не автор выполнения. Проверены protocol/P-version.json, три REQUIREMENTS, case-proposals-payload.md P05/P06, source/config/scripts, commands.jsonl, публичный trace, подготовка и cleanup evidence. Оценка только offline: повторного runtime, Docker, npm, reset или запроса к БД не было. Snapshot фиксирует final files, supplied-input delta, выбранную manifest entry, архив/установленный пакет и использованные installed sources.

| Случай | Подтверждённый исход и граница |
| --- | --- |
| P05legacy | Payload 2.32.3 / adapter 0.8.10, package/lock/Drizzle override, Express/config, staticURL `/media`, uploads, slug и alt сохранены по hash freeze. В коллекцию добавлен text/plain при сохранении image/*. Exact-lock npm ci после ENOSPC, typecheck и live HTTP завершились успешно (commands 6–8). Authenticated upload manual id2:201; public read/download:200 проверяются неизменным supplied smoke; локальные и HTTP bytes совпадают с source. |
| P05current | Payload 3.88.0 / Next 16.3.4 сохранены; v2 staticURL удалён, local uploads/slug/alt/MIME сохранены. Final typecheck/build и production HTTP (commands 15–16,20–21): upload201, document200, download200, id1, alt Manual, URL `http://127.0.0.1:18531/api/media/file/manual.txt`. Source, stored bytes и скачанные bytes равны. |
| P06plugin | Исходный ERESOLVE зафиксирован command1 до package mutation в trace; Next15.4.10 не входит в actual @payloadcms/next3.88.0 peer range. Stable dev Next16.3.4/React19.2.8/Payload3.88.0 установлен без force/legacy-peer-deps. Build, npm pack, tarball install и final initialized host probe завершены. Import — installed node_modules/dist, не source alias; marker true и сохранённое custom поле наблюдаемы. |

## Сохранность legacy и installed boundary

Legacy existing image id1, alt Existing image, filename legacy-image.png и SHA256 `025440465f3adbac4244dc58480cd88e506eedad0b8fb5309467ae0b638452f6` совпадают между frozen seed/image-only evidence, текущими source/uploads и финальным HTTP smoke. Подготовка выполнялась до trial; legacy lock и seed/smoke неизменны. В recorded execution нет reset/reseed; повторное считывание БД оценщиком не выполнялось. Manual SHA256 обоих приложений: `cee9d92f106a6e1e8b0d15a8df2639ce51386249a5113bcab243deb609450fbf`.

Все семь файлов tarball побайтно равны final build и installed consumer files. Installed package не symlink, root export указывает на dist/index.js; src/index.ts и его merge marker не изменены. Host config импортирует package и вызывает plugins:[notePlugin()]. Command19 печатает installedImport, pluginMarker:true, preserved:true и initializedPluginMarker:true после getPayload; command20 проверяет production HTTP того же app/config. Поддержка всего peer range не проверена. Final cleanup edit относится только к проверочному скрипту, после него typecheck повторён; app/config после успешной production build не менялись.

## SQLite/R2 и пределы результата

OPERATIONS/source сверены с installed @payloadcms/db-sqlite/storage-r2 3.88.0. SQLite transactionOptions отсутствует: adapter выбирает defaultBeginTransaction, возвращающий null; {} включает механизм, но multi-write/rollback не исполнялись. R2 принимает настоящий R2Bucket binding, а не S3 config/имя bucket; corrected example требует явный binding аргумент. Enabled по умолчанию, client uploads opt-in, alwaysInsertFields/useCompositePrefixes false; включение storage отключает local storage выбранной коллекции. Примеры не подключены root notePlugin. Remote R2 binding/service отсутствует, операции не заявлены и не выполнены. Это source/type contract evidence, не SQLite/R2 runtime PASS.

## Сбои, cleanup и независимость

ENOSPC legacy npm ci — зафиксированный infrastructure inode failure, после точечной очистки task dependencies exact-lock retry прошёл. Два production build failure выявили ошибки нового probe Config; они исправлены до успешных typecheck/build. Промежуточные ошибки не скрыты.

Два initialized probe вывели marker, но зависли при завершении: commands17–18 фиксируют exit143, первый UI interrupt показывал130 и сам не закрыл контейнер. P-version-probe-cleanup.json и coordinator observations подтверждают остановку точных owned containers и пустой readback. Final command19 применяет process.exit(0) после destroy. Это проверка one-shot boundary, не graceful adapter shutdown и не общее доказательство interruption cleanup runner. `finally` с exit0 способен скрыть assertion failure: здесь положительный marker записан после assert и непосредственно подтверждает результат; один exit0 был бы недостаточен. Live scripts закрывают server groups в finally; оценщик не проводил новый общий process inventory.

Executor fork:none, recorded gpt-6-astra/medium. Selection и чтение baseline payload/version references предшествуют изменениям; затем исполнитель проверяет installed contracts. Coordinator уточнил infrastructure/slot и cleanup; plaintext followup dispatch недоступен в exported metadata, поэтому полная независимая аттестация blind inputs невозможна. Сохраняются bounded behavioral results с этим ограничением, без причинного вывода о skill и без повышения полного source verdict.

Snapshot: [baseline-P-version-assessment-snapshot.json](baseline-P-version-assessment-snapshot.json). Повторный прогон сейчас не нужен; для сравнения candidate требуется тот же frozen input/версии и исходное состояние обеих отдельных БД/legacy image. Данные оценщиком не сбрасывались.
