# Независимый review временного Docker resource proxy

В проверенном снимке подтверждённых дефектов ограничения ресурсов и владения объектами не найдено. Изолированные проверки проходят; совместимость с настоящими Docker Engine и обеими версиями Supabase CLI пока не установлена. Результат позволяет перейти к ограниченному последовательному preflight через этот proxy, но не подтверждает готовность CLI behavioral trials.

## Основание и границы

Дата: 2026-09-09. Режим: read-only code review с targeted security pass. Объект — пять файлов `/tmp/framework-platforms-20260909/infrastructure/docker-proxy/`, перечисленных ниже; исходный и конечный SHA256 совпали. Это отдельный вспомогательный инструмент исследования, не изменение проверяемых навыков. Исполнитель review не менял proxy, его тесты, fixtures, версии CLI, окружение или Docker-объекты.

Авторитет: поручение координатора и `remaining-hs-cli-envelope-delta.md`: максимум три одновременно зарезервированных pending/live/stopped/restartable контейнера вместе с retained case DB; каждый не выше 0.75 CPU / 3 GiB memory+swap, cpuset 28–31; внешний runner 1.25 CPU / 6 GiB и proxy 0.25 CPU / 256 MiB. Host network разрешён только закреплённому legacy differ. Правила не требуют в этом инструменте полной защиты от противника с доступом к хосту или произвольной сети.

Актор — CLI внутри назначенного runner, который может отправлять Docker HTTP запросы только через выделенный Unix socket. Supervisor, приватный config/state и настоящий Engine socket — доверенная внешняя граница. Недоступность настоящего socket/config/state из runner и внешние cgroup ограничения должны быть проверены координатором до native preflight; исходный код proxy сам их не устанавливает. Базы, SQL/RLS, прикладная аутентификация, REST/PostgREST, SDK/RPC и service-role пути вне данного review.

## Подтверждённые findings

Нет. P1-screen выполнен на пути запроса к привилегированному Engine: create/admission, доотправочное сохранение резерва, конкурентные запросы, изменение лимитов, scope объектов, восстановление, очистка и HTTP upgrade. Подтверждённого обхода лимита или операции над посторонним объектом не установлено. Это targeted security результат `no confirmed findings in reviewed scope`, не security PASS.

## Проверенная поверхность

| Поверхность | Код | Доступное подтверждение |
| --- | --- | --- |
| Резерв до внешнего create и неоднозначный результат | `proxy.mjs:61–109, 218–238, 287–306` | Атомарное синхронное изменение inventory до await; fsync/rename; concurrent pending учитываются; disconnect держит резерв; definite error освобождает; стоп не освобождает |
| CPU, memory+swap, cpuset и запрет изменения через Engine | `proxy.mjs:128–195, 260–276` | HostConfig пересобирается; чужие активные поля отклоняются; положительные более узкие лимиты сохраняются; update/start чужого ID не проходят |
| Владение контейнерами, networks, volumes | `proxy.mjs:78–100, 203–260, 287–315` | Exact IDs и nonce/run labels; name только tracked alias; нет adoption, prune или host bind; списки пересекаются с inventory |
| Повторный запуск и закрытие | `proxy.mjs:369–402, 418–428` | Lock + fingerprint; ambiguous state блокирует запуск; существующий inventory инспектируется; незавершённый drain сохраняет lock. Crash recovery оставлен supervisor явно |
| Framing и streams | `proxy.mjs:31–53, 110–126, 278–284, 329–367, 404–416` | Независимая проверка каждого HTTP запроса; chunked/pipelined control не превращается в tunnel; attach/exec upgrade только tracked; bounded body/stream и backpressure |
| Секреты и evidence | `proxy.mjs:47–53, 318–327`; README/log/tests | Authorization/registry headers не пересылаются, Env остаётся только в необходимом upstream create payload; секреты не пишутся в inventory; отчёт и журнал не содержат реальных credentials |
| Тесты/команды/документация | Все три вспомогательных файла и `proxy.test.mjs` полностью | `npm test` не запускает реальный Docker: временные Unix HTTP daemon/socket/state создаются под локальным test-* и удаляются |

Независимо выполнен объявленный `npm test` на Node v24.15.0: **12 tests / 12 pass / 0 fail**, process exit 0, TAP duration 229.508815 ms. Проверки включают три/четвёртый create, конкурентные pending, keepalive/chunked/pipeline, запрещённые действия, ambiguous create и restart, более узкие ресурсы, network/volume/archive, tracked upgrade, redaction и mismatch при restart. Не создавались новые тесты, не выполнялись повторные behavioral trials или реальные Docker/CLI команды. Fake daemon доказывает только пересылку и проверяемые переходы proxy, не cgroups или поведение Engine.

## Совместимость: что установлено и что ещё требуется

Проверка pinned native исходников не выявила заранее доказанного несовместимого запроса на рассмотренных путях. Legacy `DockerStart` создаёт именованные volumes перед ContainerCreate и network через NetworkCreate; они соответствуют предусмотренным шагам proxy. Legacy `DockerRunOnceWithConfig` использует explicit remove после чтения logs, что соответствует сохранению резерва до delete. Источник: [Supabase CLI v2.39.2 docker.go](https://raw.githubusercontent.com/supabase/cli/v2.39.2/internal/utils/docker.go), локальные строки 252–308 и 367–376.

Current CLI создаёт shadow через native Docker subprocess и передаёт project labels; секретные файлы/архивы копируются после create и до start. Это покрыто разрешённой последовательностью create → archive → start. Источники: [v2.117.0 shadow-database.ts](https://raw.githubusercontent.com/supabase/cli/v2.117.0/apps/cli/src/command-internal/db-bootstrap/shadow-database.ts), [docker-create-args.ts](https://raw.githubusercontent.com/supabase/cli/v2.117.0/apps/cli/src/command-internal/db-bootstrap/docker-create-args.ts). Они не доказывают фактическую wire-совместимость выбранного установленного Docker client.

В частности, предположение «image inspect всегда percent-encodes slash и поэтому гарантированно сломан» не подтверждено: [Moby v28.3.3 ImageInspect](https://raw.githubusercontent.com/moby/moby/v28.3.3/client/image_inspect.go) строит путь из imageID напрямую. [ContainerExecAttach](https://raw.githubusercontent.com/moby/moby/v28.3.3/client/container_exec.go) использует postHijacked; фактический ответ Engine и Content-Length/upgrade framing конкретного клиента не проверялись. Эти источники — compatibility research, не утверждение установленной здесь версии Docker.

До CLI gate нужны:

1. Один последовательный preflight для каждой закреплённой версии CLI через тот же socket, с предварительно проверенным image allowlist/digest и внешним resource envelope. Подтвердить native create/inspect/archive/start/exec/logs/wait/delete, network/volume последовательности, финальное отсутствие task-owned containers и сохранность inventory.
2. Readback фактических HostConfig/cgroups всех дочерних контейнеров; retained DB занимает первый из трёх слотов. Проверить настоящую очистку implicit volumes и обработку auto-remove → explicit DELETE 404. Это runtime evidence gap, а не подтверждённый дефект proxy.
3. На preflight ошибка unsupported route/field/encoding должна быть сопоставлена с pinned native source и исправлена только в минимальном compatibility delta с повторным bounded review. Обход proxy не является результатом этой проверки.

256 MiB proxy cap, 3 GiB достаточность для Postgres, daemon overhead, image resolution, OS/socket isolation, peak RSS и полнота SQL результата не измерялись. Фиксированные byte/time limits сами по себе не являются измерением этих свойств. README корректно заявляет эти границы, поэтому непроверенные native условия не превращены в findings.

## Снимок

- `proxy.mjs`: `1f0d99e2cbbc9ca64c663fa901e3bc1cb80b1695ce57f22d3039c60a6d4cabfb`
- `proxy.test.mjs`: `febbb0ffa24f238fa6f9302b63dd36d5fa61b805222cd79fe59910bde3c109bf`
- `package.json`: `75016b34853ffa1dffee537177a2a1a3cfb323070944d393fb9afdef222151c0`
- `README.md`: `acbc203a2ed85dcad1ac83c9efdf5eb2652dcbc63def280e88fc77f46e7b771e`
- `implementation-log.md`: `36162d6466ac03e5224866904f30f501972a0616957432a61f806af6f7dc4009`

Полнота: все пять заявленных файлов прочитаны; target не менялся. Wider research ограничен указанными pinned CLI/Moby источниками и нормативным envelope. Независимый review не разрешает публикацию, merge либо расширение исследования.

Recommendation: **limited** — source/fake-daemon граница проверена без подтверждённых blockers; native boundary остаётся открытой до последовательного preflight. Следующий владелец: координатор инфраструктуры и автор proxy для возможного минимального compatibility delta.
