# Baseline S-cli-current — независимая оценка

**PASS для ограниченного behavioral case S-cli-current.** Исполнитель добавил nullable `subtitle text` без default, получил точную миграцию CLI2.117.0, проверил сохранность исходных строк до reset и чистое применение с новым SQL readback. Материальных P1/P2 в выполнении данного задания не установлено. **Исходный source-review FAIL сохраняется**: один успешный исполнитель, скорректировавший устаревший пример по installed help, не исправляет `migrations-cli.md` и не закрывает S01.

Режим — независимая оценка сохранённого baseline trial; оценщик не автор выполнения/исправлений. Критерии: frozen `protocol/S-cli-current.json` (45 inputs), raw task, REQUIREMENTS и закрытый S-A из `case-proposals-hono-supabase.md:113`. Это execution с supplied `supabase-engineer`; естественная catalog activation не испытывалась.

## Проверенные исходы

| Критерий | Сохранённое доказательство | Результат |
| --- | --- | --- |
| Версия и модель | command2 вернул2.117.0; toolchain/config и все platform declarations совпали с frozen hashes. Из45 inputs изменён только posts.sql | PASS |
| Поддерживаемая команда | commands3,8–10: реальный help отличает обычный db diff (history/live) от declarative sync. command11 выполняет sync --no-apply --name posts_subtitle | PASS |
| Точный scope | Новая20260909144751_posts_subtitle.sql содержит только `ALTER TABLE "public"."posts" ADD COLUMN "subtitle" text;`; в декларацию добавлена одна строка, исходная миграция сохранена | PASS |
| Preservation до reset | command12: две принятые пары id/title до apply. command13 применяет новую миграцию. command14 в отдельном psql показывает обе пары без изменений, nullable subtitle, прежние PK/NOT NULL и extensions | PASS |
| Новые/изменяемые данные | command14 успешно UPDATE subtitle существующей строки и INSERT новой строки; BEGIN/ROLLBACK не оставляет контрольные записи | PASS |
| Чистое применение | command15: db reset --local --no-seed применяет исходную и новую миграции. command16 в новом соединении показывает обе версии истории, ноль строк и требуемую структуру | PASS |
| Финальный readback | После отдельного восстановления seed command17 новым docker exec/psql подтверждает `seed_matches=t`, `subtitle_is_null=t` для обеих строк, text/YES/no-default, прежние PK, id/title NOT NULL и версии пяти extensions | PASS |

Восстановление seed после reset **не использовано** как доказательство preservation: это отдельная последовательность commands12–14. Непрерывное хранение данных через destructive clean reset не требовалось и не заявляется. Reset был заранее разрешён только для этой disposable DB; remote/cloud authority не изобреталась. Experimental feature opt-in указан в REQUIREMENTS и конфигурация сохранена.

Сохранение остальных объектов подтверждено отсутствием постороннего DDL в единственной новой миграции, неизменностью исходной истории/platform declarations и SQL-сравнением PK/колонок/extensions. Полного before/after dump каждого системного объекта нет; PASS ограничен этим локальным изменением, не полным аудитом каталога PostgreSQL.

## Выполнение и ресурсы

Проверены фактические public tool inputs/outputs (36 events), selection/result и все17 command records: каждый имеет exit0. CLI/SQL используют точный dedicated runner из RUNTIME; чтение файлов и apply_patch остаются host file operations, а не обходом runtime.17 exact-name cleanup records совпадают с17 runner names и подтверждают их отсутствие. Новые runtime metadata/cache файлы созданы CLI; их наличие не считается изменением принятой модели. Содержимое telemetry/cache archive не анализировалось.

Runtime manifest проверен.11 сохранённых изменившихся inventory snapshots180s sampler дают **observed peak3**: retained DB и native shadows; все наблюдённые caps положительны и не выше0.75CPU/3GiB memory+swap, cpuset28–31. Peak зафиксирован в14:47:46,14:47:49 и14:47:50 UTC. Это наблюдение квот и inventory, не измерение фактического RSS/CPU или hard cap всего хоста; polling не покрывает каждое мгновение и не доказывает аварийную очистку. Повторного infrastructure review нет.

При sync cache archive превысил16MiB; native CLI выполнил bounded recreation и завершился успешно, лимит не менялся. Это подтверждение fallback, не успешного cache restore. Финальный state до cleanup содержит один retained DB, network, named volume и два exec без pending. Добавленный позже coordinator `cleanup-readback.json` сообщает пустые scoped collections и удалённый supervisor; он захеширован отдельно от старого runtime manifest. Его команды не переаудировались и cleanup не используется как доказательство SQL результата.

## Экспозиция и пределы

Protocol и public dispatch metadata задают GPT-6 Astra, `medium`, `fork=none`; сохранённая turn configuration также показывает medium. Это recorded settings, не независимая backend attestation. Сравнение с прежними high-effort trials не является контролируемым сравнением качества/скорости.

Observed reads начинаются с raw task/RUNTIME/REQUIREMENTS, supplied skill и migrations reference; чтения закрытого rubric/чужого trial в доступном trace не обнаружены. Однако plaintext исходного dispatch и follow-up14:48:08 скрыт в экспортированном trace. Координатор отдельно подтвердил, что follow-up только разрешал продолжить уже авторизованные apply/preservation/clean checks после успешного bounded fallback и запрещал менять archive limits. Это coordinator-attested содержание, не независимое подтверждение доставки. Поэтому fresh execution документировано, а абсолютная blindness не аттестована; успешный task outcome от этой границы не превращается в FAIL.

P1 screen: в сохранённом выполнении нет подтверждённых опасных действий, ложного runtime completion или выдуманной authority. Supplied skill/source не изменены. API/RLS/Auth/Storage/cloud, legacy native workflow, все варианты cache/failure cleanup и общая надёжность скилла вне scope.

Проверки оценщика: только чтение, hashes, offline JSON/assertions. Docker/CLI/DB/build/install не запускались; targets не менялись. Совпали44 неизменённых frozen inputs, проверены exact изменённый input и новая миграция, trace/runtime manifests; identity повторно проверена перед закрытием. Snapshot `9ce8d45a4cfaac4b4d30dd00aca79ab681406578068e53433b907d8dfb9c8355`: `baseline-S-cli-current-assessment.snapshot.json` (E/L roots и SHA256 каждого файла).

Следующий владелец — координатор: записать **S-cli-current baseline trial PASS** с указанными пределами, сохранив baseline `supabase-engineer` **source FAIL**. Результат не является candidate acceptance, publication или merge approval.
