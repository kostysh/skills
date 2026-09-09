# Подготовка оставшихся Hono/Supabase baseline inputs

Дата: 2026-09-09. Результат: подготовлены нейтральные входы; runtime gate **не исполнялся**. Это supporting preparation log, не новый verdict о навыках. Оценщик не менял target skills/candidate/trials, не устанавливал пакеты, не запускал npm/build/app runtime/CLI/Docker/БД и не создавал агентов. Снимки официальных исходников скачаны read-only; JSON/TOML проверены парсером Python. Хеши файлов и статусы: [manifest](remaining-hono-supabase-fixture-preparation.json).

## Подготовленные inputs

| Fixture под `/tmp/framework-platforms-20260909/fixtures` | Результат и граница |
|---|---|
| `supabase-services` | Проверены REQUIREMENTS/source/stubs. Минимально дополнен только контракт, добавлен raw `task.txt`; реализации helpers и проверок не выдавались. |
| `supabase-cli-current` | Raw task, accepted requirement, config для CLI2.117.0/PG17, исходная table declaration, original migration и две seed rows. Ещё нельзя freeze как готовый runtime input: см. prerequisites. |
| `supabase-cli-legacy` | Эквивалентный posts/subtitle task с фиксированным CLI2.39.2/PG17 и отдельным project_id/ports. Это сохранение конкретной исторической ветки workflow; не утверждение о текущей security support старой версии. |
| `workers-compatibility` | Hono4.13.7, Wrangler4.130.0, dates2026-08-03/04, два одинаковых initial Node-crypto handlers, digest inputs и отдельный immutable Node probe. В одном варианте Node API нужен, в другом требуется отключить; конкретные исправления flags/code не включены. |
| `supabase-partial-evidence` | Нейтральный tabletop запрос о готовности Webhook и Realtime, исходные snippets и явно synthetic/stipulated case facts. Не поддельные runtime logs. |
| `supabase-readonly-authority` | Нейтральный tabletop raw task, fictional project alias, read-only scope и operation metadata write-capable connector. Реальный MCP не привязан; это проверка решения по полномочиям, не проверка исполнения connector boundary. |

Raw tasks и fixtures не содержат findings, ожидаемых CLI команд, closed rubric или candidate delta. Этот supporting log и каталог официальных источников остаются у protocol owner/assessor, а не у blind executor.

## Supabase services: уточнённые неоднозначности

Исходные данные сохранены побайтово:137 articles, из них121 published; repeated timestamps пересекают границы pages50. Vectors:1200 строк размерности8,20 queries; small stage — первые8. Все векторы конечные и ненулевые. Эти статические свойства не являются результатом Data API/vector runtime.

Исходный текст не фиксировал форму возврата `listPublished`/`searchSimilar`, все права на unpublished rows, выбор small stage и точное вычисление среднего recall. Уточнены массивы records/pairs либо явное rejection, отсутствие частичного successful result, read-only опубликованные articles для A/B/anon, shared vector reads для A/B, small stage/20-query mean recall@5 и deterministic tie order по id. Индекс остаётся выбором исполнителя.

Для Storage сохранены собственные upload/replace/list/sign/download и запрет чужих операций; отсутствие чужих имён в пустом denied listing допустимо. Privileged access остаётся setup-only. Указан необходимый private env contract; pgvector уже должен быть доступен от coordinator, поскольку extension/service changes не входят в разрешённые объекты. Из-за отсутствия реального runtime на подготовке не проверены возможности Storage, RLS, extversion или настройки Auth.

Ошибка страницы связывается с полнотой результата после controlled503; отдельно отмечено, что это injection. Нет новой шестисценарной transport suite: HS-tech уже доказал ограниченный SDK retry/deadline/abort boundary. Данный сценарий сохраняется только потому, что он проверяет другую failure path — returned error/partial page не превращаются в полный результат S-B/S04. H-B и S-E отдельно заново не готовились.

## S-A: источники, версии и недостающие входы

Current2.117.0 подтверждён предыдущими root help probes и pinned source. Его `sync.command.ts:62-69` описывает files-to-migration и `--no-apply`; `SIDE_EFFECTS.md` фиксирует два native shadows, in-process pg-delta, experimental gate и полную declarative tree. Source: [2.117 sync](https://github.com/supabase/cli/blob/v2.117.0/apps/cli/src/commands/db/schema/declarative/sync/sync.command.ts), [side effects](https://github.com/supabase/cli/blob/v2.117.0/apps/cli/src/commands/db/schema/declarative/sync/SIDE_EFFECTS.md).

Current config включает разрешённый для этой disposable задачи pgdelta opt-in и выключает ненужные API/Auth/Storage/Realtime/Studio/SMTP/Edge/Analytics. Путь schema — default `supabase/schemas`. SMTP key исправлен по pinned template: `[local_smtp]` у current, `[inbucket]` у legacy. Parse JSON/TOML — только синтаксис, не полноценная CLI config validation.

**До freeze current:** coordinator должен получить/сохранить нейтральную platform declarative baseline, соответствующую исходной локальной БД и этим настройкам, и убедиться, что table-only input не создаёт incidental extension removals. Исходный `posts.sql` не назван полным снимком платформы. Нельзя подделывать `.pgdelta-export.json` или расширять задачу до удаления implicit extensions. Полная tree нужна из-за исходного контракта current engine, а не для подсказки ответа по subtitle. Подготовка должна происходить до fresh execution и одинаково применяться к baseline/candidate.

Legacy pin2.39.2 — stable release2025-08-23. Pinned [diff.go](https://github.com/supabase/cli/blob/v2.39.2/internal/db/diff/diff.go) читает `SchemaPaths` (`51-73`), а local branch (`159-168`) строит declarative target в `contrib_regression`. Это проверенная historical workflow ветка, без auto-upgrade и без заявления current security support. Нужны точный binary/checksum и его собственный `--version`/`db diff --help` readback. Нынешний `/tmp/.../tools/supabase-go` не принят за2.39.2 без version proof.

Для обоих нужны: отдельная начальная case DB, сохранённый base schema/seed, CLI-specific pinned Postgres image digest, доступные незанятые ports, чистое apply и separate-connection data readback. Предложенные configs: current18432/18430, legacy18532/18530; доступность портов не проверялась. Config major17 не означает, что обе версии используют тот же image tag: native pins должны фиксироваться отдельно, не заменяться произвольно общим image. Запускать current/legacy и baseline/candidate последовательно, с exact owned resource inventory.

## Docker resource feasibility

**Вывод по source:** task-local Unix-socket proxy через `DOCKER_HOST` применим к current и legacy; PATH docker wrapper сам по себе покрывает только current. Ресурсный контур потенциально укладывается в4CPU/16GiB при остановленных остальных собственных workloads, но implementation, лимиты и cleanup ещё не проверены.

Current [legacy-container-cli.ts:70-81](https://github.com/supabase/cli/blob/v2.117.0/apps/cli/src/command-internal/legacy-container-cli.ts) запускает `docker` через PATH (podman fallback только при невозможности spawn). Поэтому wrapper может вставить resource flags для каждого `create`/`run`. Он должен охватывать оба глагола: обычные shadows идут через `create`, one-shot migrate jobs через `run`. Pinned [shadow-database.ts:264-311](https://github.com/supabase/cli/blob/v2.117.0/apps/cli/src/command-internal/db-bootstrap/shadow-database.ts) добавляет project labels, создаёт shadow без имени, запускает и возвращает container ID. Сужение по имени не работает. Labels плюс точный tracked ID/creation nonce позволяют ограничить task ownership.

Current planner держит два shadow databases; `current-shadow-layer.ts:303-366` допускает разные provisioning strategies. Per-shadow migrate jobs realtime/storage/auth идут последовательно, но зависят от service enabled flags (`db-setup.ts:748-841`); accepted config выключает все три. Стандартный pg-delta выполняется в CLI process. Cache создаёт дополнительные host files и может останавливать/запускать shadow; для первого строгого gate рекомендуется task-local `SUPABASE_HOME` и отключённый shadow cache, без изменения глобального HOME/cache. Это infrastructure choice, которую нужно симметрично записать для обеих сравниваемых версий/снимков.

Legacy [docker.go:252-308](https://github.com/supabase/cli/blob/v2.39.2/internal/utils/docker.go) вызывает `Docker.ContainerCreate` напрямую. Он не проходит PATH wrapper. `diff.go:92-104` передаёт HostConfig без CPU/memory limit. Поэтому общая граница должна находиться на Docker Engine API proxy; CLI runner не должен иметь доступ к исходному socket в обход proxy.

Рекомендуемый одинаковый резерв для current/legacy:

| Категория | Максимум одновременно | CPU cap | RAM cap |
|---|---:|---:|---:|
| Уже используемый task CLI runner | 1 | 1.25 | 6GiB |
| Любой создаваемый через proxy task container | 2 включая pending/stopped reservations | 1 каждый | 4GiB каждый |
| Proxy/supervisor | 1 | 0.25 | 256MiB |
| Сумма зарезервированного workload | — | 3.5 | 14.25GiB |

Cpuset — одни и те же четыре разрешённых CPU. Existing task runner/compose source задают28-31; перед запуском coordinator проверяет применимость. Остаётся0.5CPU/1.75GiB на инфраструктуру/наблюдение. Shared Docker daemon/image pull overhead не ограничивается HostConfig дочерних контейнеров: таблица не является proof общей host peak. Не запускать новые pulls/builds и другие task runtimes параллельно gate; наличие images/digests и budget должны быть зафиксированы coordinator. При необходимости буквального общего cgroup hard cap вместе с daemon требуется отдельная локальная runtime boundary; эти исходники такого enforcement не доказывают.

### Минимальные требования к proxy/runner, без реализации

1. Только task-local socket; `DOCKER_HOST=unix://<case socket>` в окружении CLI и PATH wrapper, если он используется. Не менять daemon config, глобальный DOCKER_HOST/HOME, чужие contexts или permissions. Подключение к реальному socket принадлежит только supervisor; case runner получает только proxy socket. Request/response логи не сохраняют credentials, Env values, authorization headers, stdin/archive bodies или tokens.
2. Для каждого version-prefixed либо unversioned `POST /containers/create` parse полного HTTP request и JSON body до forwarding. Создать атомарную pending reservation. Принудительно ограничить `HostConfig.NanoCpus=1000000000`, `Memory=4294967296`, `MemorySwap=4294967296` и разрешённый `CpusetCpus`; более строгие caller limits не ослаблять. Конфликтующие CPU quotas/periods и режимы, обходящие границу, отклонять/нормализовать до forwarding. Не полагаться на default resource limits Docker.
3. Max2 reservations охватывает concurrently creating, running и stopped-but-restartable task containers. Create сверх лимита отклоняется до daemon side effect. Reservation снимается только после подтверждённого failed create без side effect либо подтверждённого удаления tracked ID. При неоднозначном disconnect сохранить reservation и сделать scoped readback; не считать client exit доказательством удаления. Не допускать start/restart чужого/pre-existing container вне inventory или повторное потребление уже освобождённого бюджета.
4. Каждую control request на keep-alive соединении заново parse/authorize/rewrite. Нельзя после первого разрешённого запроса превращать connection в необработанный TCP tunnel. Корректно обрабатывать Content-Length/chunked framing, отвергать неоднозначность и не терять pipelined следующий request. Допустима стратегия закрытия обычного HTTP соединения после каждого ответа, если клиент корректно переподключается.
5. Docker attach/exec требует streaming/hijack (`docker-api.yaml:8567-8600`); разрешать только явно известный upgrade endpoint к tracked container или tracked exec ID, полученному для этого container. Обычный create/control path никогда не передаётся через raw tunnel. Неизвестные upgrades/CONNECT/h2c routes отклонять. После разрешённого attach upgrade поток принадлежит только attach session и закрывается вместе с ней, а не используется для следующего daemon HTTP request.
6. Сохранять scoped labels и IDs, native ephemeral ports, task network/volumes и нужные `cp`/archive/setup calls. Mutations разрешены только для объектов текущего task/run. Никакого глобального prune, удаления images, stop/reset чужих containers или изменения существующих grants. Cleanup читает exact inventory и удаляет только созданные данным запуском IDs; отсутствие leaks подтверждается после CLI success, failure и interruption.
7. Отдельно ограничить CLI process и proxy/supervisor, затем проверить фактический `docker inspect HostConfig`, reservations и суммарные budgets. API proxy даёт ограничения создаваемым контейнерам, но не CPU/memory самому CLI, bundled pg-delta или host daemon. Дополнительный контейнер, требуемый native workflow сверх принятого max2, должен завершить gate явно, а не получить обходной unrestricted запуск. Cleanup/retry не меняют fixture version или source contract.

Официальная API форма HostConfig/ContainerCreate и hijack: [Docker Engine API1.51](https://github.com/moby/moby/blob/v28.5.2/docs/api/v1.51.yaml). Поддержку точной API negotiation установленного legacy binary и Docker daemon ещё предстоит наблюдать; нельзя жёстко разрешить только `/v1.51/` и сломать старый клиент.

## Что остаётся protocol owner

- Принять уточнения services как одинаковый input до обоих freeze; предоставить runtime/credentials/pgvector и lockfile.
- Завершить current platform baseline; установить/checksum обе CLI versions и pinned image digests. Подготовленные table files не заменяют этого входа.
- Для Workers получить lockfile Wrangler4.130.0 и подтвердить workerd1.20260908.1 / Miniflare5.20260908.0-alpha из фактически установленного графа. Эти версии пока взяты из official package metadata, не local install. Hono/Node версии фиксированы; no remote deploy.
- S-G tabletop cases готовы для решения по данным материалам, но не могут доказать actual MCP side-effect enforcement или доставку. Если нужна именно реальная connector boundary, требуется отдельный безопасно привязанный read-only project/tool surface; fictional aliases нельзя подменять реальным production project.
- Реализовать и отдельно проверить bounded infrastructure до blind execution. Асессор подготовил только source feasibility, а не работающий wrapper/proxy.

Все скачанные pinned/live источники и SHA/date: `remaining-hs-official/{manifest,extra-manifest,resource-manifest}.json`. Direct `hono.dev`/npm/runtime gates здесь не вызывались; прежние completed HS-tech результаты остаются отдельно от новой подготовки.
