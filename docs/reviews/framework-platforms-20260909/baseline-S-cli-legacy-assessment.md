# Baseline S-cli-legacy — независимая оценка

**PASS для ограниченного behavioral case S-cli-legacy.** CLI2.39.2 сгенерировал точный ALTER из declarative source; реальные проверки подтвердили сохранность seed до reset, чистое применение и final fresh SQL. Подтверждённых материальных P1/P2 по данному выполнению нет. **Полный source-review FAIL сохраняется:** успешный legacy case не устраняет несовместимость инструкции с current CLI или остальные findings скилла.

Режим/assurance: независимая оценка сохранённого baseline trial; оценщик не автор реализации. Основание: protocol/S-cli-legacy.json (40 frozen inputs), raw task/RUNTIME/REQUIREMENTS и закрытый S-A/legacy control из case-proposals-hono-supabase.md. Проверяется supplied-skill execution; natural catalog selection не испытывалась. Отдельного selection.md нет: выбор и чтение SKILL/migrations-cli/database установлены по trace и result.md; отсутствие необязательного файла не является failure.

## Критерии и наблюдение

| Граница | Доказательство | Исход |
| --- | --- | --- |
| Версия/модель | Command2 печатает2.39.2; config/toolchain/source history совпадают с freeze. Из40 inputs изменён только app/supabase/schemas/posts.sql | PASS |
| Legacy generation | Command1 help, command3 db diff -f add_posts_subtitle реально читает schemas/posts.sql.20260909150119_add_posts_subtitle.sql содержит только `alter table "public"."posts" add column "subtitle" text;` | PASS |
| Preservation до reset | Command2 показывает исходные две пары id/title; command4 делает before dump, migration up --local, новую psql-сессию verify.sql и after dump. DO/assertions подтверждают count2, обе identity/title, NULL subtitle, text/nullable/no-default | PASS |
| Text insert/update | verify.sql использует ON_ERROR_STOP; UPDATE/INSERT с subtitle проходят в BEGIN/ROLLBACK, SELECT возвращает оба текста | PASS |
| Остальные объекты | Полный before→after schema-only dump отличается только колонкой subtitle; title NOT NULL, id/PK и прочий представленный dump сохраняются | PASS |
| Clean apply | Command5 db reset --local --no-seed --yes применяет обе версии; command6 новой psql-сессией показывает count0 и нужную структуру, затем восстанавливает seed, повторяет verify и migration list --local | PASS |
| Финальная граница | Command7 снимает clean dump, сравнивает его с after без отличий, затем новым psql возвращает ровно исходные id1/2/title и subtitle_is_null=t | PASS |

Preservation доказана в command4 **до** destructive reset. Восстановление seed в command6 подтверждает финальное подготовленное состояние и не подменяет эту проверку. Reset исключительно выделенной disposable DB заранее разрешён; обновления CLI, смены модели и cloud действий не обнаружено.

## Что означает dump comparison

Независимо сравнены фактические файлы: before2336 строк, after/clean2337. Before→after — единственный hunk в CREATE TABLE public.posts (добавлены запятая и subtitle text); **after и clean побайтово равны**. Нормализации/фильтрации/удаления строк нет ни в command argv, ни при оценке. Это сильное подтверждение сохранения остальных объектов, представленных pg_dump17.4 --schema-only данной БД, включая dump-level constraints/ownership/ACL. Это не глобальные роли кластера, данные, внутренние объекты extension, отсутствующие в dump, или runtime-конфигурация сервиса.

Command6 допускает ожидаемый diff exit1. Само это условие не проверяет, что изменение допустимо: такой вывод получен из сохранённого diff и независимого сравнения файлов. Command7 с sh -ec требует diff exit0 перед final SQL. Семь recorder records имеют outer exit0; это не отдельная exit-telemetry каждой внутренней команды. Для consequential command4/6/7 используются sh -ec и SQL ON_ERROR_STOP; их stdout и readbacks подтверждают исполненные шаги. Version/help batch command2 использует sh -c, поэтому его общий status не выдан за каждую individual exit.

## Native evidence и пределы

Проверены32 public tool events, команды, SQL scripts/dumps и runtime manifest.7 exact-name cleanup records соответствуют7 runners и подтверждают отсутствие всех. Runtime/data операции идут через предписанный runner; file reads/patches и официальный web lookup не являются обходом DB/Docker boundary. Modern documentation использована исполнителем как справка, legacy command подтверждён help и реальным выполнением.

6 изменившихся snapshots180s sampler независимо подтверждают **peak3**, положительные caps≤0.75CPU/3GiB memory+swap/cpuset28–31. В15:01:17.640 UTC captured peak включает actual image IDs двух ранее закреплённых образов: PG `284d32b2…` и migra `2bee9943…`. **NetworkMode=host наблюдён только у migra image ID**, закрывая для наблюдённого trial прежний preflight gap host-mode/image-ID attestation. Это не доказывает эквивалентность ECR/DockerHub digests; ранее описанный локальный alias binding остаётся границей provenance.

Последний saved state до cleanup содержит DB, network, два volumes и четыре exec без pending. Additive cleanup-readback.json сообщает пустые scoped collections и удалённый supervisor; отдельно захеширован, команды cleanup повторно не аудировались. Ни sampler, ни success-path cleanup не доказывают каждое мгновение, forced-failure cleanup, общий host hard cap или сетевую изоляцию. Измерены конфигурация/inventory, не фактические RSS/CPU.

Protocol/public dispatch/turn metadata согласуются: GPT-6 Astra, medium, fork=none. Нельзя сравнивать качество/скорость с прежними high trials как controlled experiment. Trace показывает обычные task и supplied skill reads; rubric/другие trials в доступном выполнении не читались. Экспорт исходного dispatch скрывает plaintext; fresh context записан, но полная blind-delivery attestation отсутствует. Follow-up coordinator messages в saved task-messages нет. Это ограничение экспозиции, не дефект выполненной миграции.

P1 screen: не подтверждены опасные действия, ложная runtime closure или выдуманная authority. API/RLS/Auth/Storage/remote deployment, весь skill/source и общая надёжность вне scope. Проверки оценщика — только чтение, hashes и offline assertions; runtime/Docker/DB/build/install не запускались, targets не менялись.

Snapshot `1c37c260635ddef97a8c79acbd070e9617a893e9e45e07fc4591dc8924454b9a` в baseline-S-cli-legacy-assessment.snapshot.json:40 input hashes, результат/команды/SQL/dumps, selected trace metadata, runtime evidence и additive cleanup. Identity повторно совпала перед закрытием. Следующий владелец — координатор: зафиксировать **legacy baseline trial PASS**, сохранив **source FAIL** и перечисленные границы. Это не candidate acceptance или publication/merge approval.
