# Независимая оценка native preflight CLI

Три изменения совместимости сохраняют ограничение ресурсов и владение объектами. Предоставленные native результаты достаточны для перехода к одному последовательному изолированному trial **current CLI 2.117.0** через проверенный runner/proxy. Это готовность инфраструктуры к trial, не результат trial и не разрешение legacy запуска.

**No findings.** Подтверждённых дефектов в данном delta не установлено. Targeted security: `no confirmed findings in reviewed scope`; общий security PASS не выдаётся.

## Delta и основание

Проверен frozen `cli-native-preflight/proxy.mjs` против `proxy.pre-native.mjs`: ровно три изменения, без иных изменений маршрутизации/очистки. Базовый hash совпадает с предыдущим независимым proxy review. `runtime-cli-run.py` совпадает с уже проверенным исправленным runner. Текущие файлы в `/tmp` побайтово совпали с frozen proxy и runner. Supervisor GID исправлен в инфраструктуре отдельно; итоговый readback содержит GroupAdd981, прежние caps и только supervisor имеет настоящий daemon socket.

- `proxy.mjs:88–92`: меняется только сообщение404 для отсутствующего/неподтверждённого container inventory. Pinned `remaining-hs-official/legacy-container-cli.ts:152–173` действительно классифицирует отсутствие по `no such container`, `no such object` или `no container with name or id`. Запрос к чужому container по-прежнему отклоняется до upstream, pending запись не освобождается; network/volume сообщение не меняется.
- `proxy.mjs:123–138`: только числовой `MemorySwappiness=-1` удаляется перед проверкой и пересборкой HostConfig. Остальные активные неподдерживаемые значения запрещены; default sentinel не попадает в Engine. CPU/memory/cpuset, max3 reservations и последующий inspect остаются прежними. При отсутствии явного MemorySwap он равен Memory; явное более узкое Memory не отменяет общего cap memory+swap3GiB.
- `proxy.mjs:212–231`: IPAM допускает default driver с инертными Options/Config, затем полностью удаляется из forwarded payload. Custom driver/subnet/options отвергаются. Scope имени, nonce labels, probe отсутствия, reservation и exact IDs не меняются. Это нормализация native default, а не разрешение произвольного IPAM.

Новые тесты `proxy.test.mjs:219–242` проверяют отсутствие upstream на denied/foreign missing path, custom IPAM rejection, удаление default IPAM, отказ swappiness100 и отбрасывание sentinel. Предоставленный последний `npm test` в infrastructure journal:14/14, exit0; reviewer тесты повторно не запускал. Предыдущие12 сценариев и неизменённые HTTP/upgrade/lifecycle границы не переоценивались целиком.

## Реальное подтверждение

`cli-preflight-commands.jsonl` содержит version2.117.0 и Docker29.6.2, затем успешные db start, migration up --local, declarative generate и no-change sync --no-apply. Все16 запусков используют dedicated runner argv с case RW, tools RO, только public proxy socket, явным DOCKER_HOST и caps1.25CPU/6GiB/cpuset28–31. Журнал cleanup подтверждает отсутствие каждого из16 runner по exact name.

Readback после sync содержит один healthy retained DB с0.75CPU, Memory=MemorySwap=3GiB, cpuset28–31; его полный ID и image ID совпадают с journal/state и image-bindings. Финальный state имеет один container, network, **именованный volume** и два tracked exec; pending записей нет. Это не пустое окружение и не подтверждение удаления retained DB/volume. Восьми другим сервисам исследования записано running=false. Proxy final readback:0.25CPU/256MiB, NetworkMode=none, no-new-privileges, CapDrop ALL, code RO и приватное состояние внутри supervisor.

SQL seed/readback показывает две ожидаемые строки. Важная хронология: seed вставлен **после** no-change sync; эти данные подтверждают подготовленную исходную БД, а не сохранение строк через sync. Проверка preservation при изменении схемы остаётся обязанностью trial.

## Пределы и следующий шаг

Cache restore превысил16MiB, proxy отказал; CLI успешно пересоздал shadow и закончил no-change. Доказан этот fallback, **не успешный cache restore**. Реальный одновременный peak3 и отдельные HostConfig shadows не сохранены в readback; source внутренний inspect и fake tests поддерживают ограничение, но не заменяют такие измерения. Нет native fault injection/SIGKILL/daemon-failure cleanup proof. Наблюдаемые попытки prune при ранних ошибках отклонены; их нельзя считать полной native failure cleanup.

Финальные readbacks и runner argv подтверждают предоставленную конфигурацию; отдельной проверки из runner на недоступность private paths/реального socket и readback cgroup каждого runner нет. Поэтому здесь не заявлена защита от враждебного OS/root или произвольной сети. Host network runner и shared daemon overhead остаются ранее принятой границей; сумма caps3.75CPU/15.25GiB не означает hard cap всего хоста.

Следующий координаторский шаг — свежий последовательный current case с собственными namespace/state/socket и seed, теми же image binding, proxy/runner caps и observed inventory/readback во время и после trial. Подготовка/freeze neutral fixture остаётся отдельным условием запуска; эта оценка её не заменяет. При новом unsupported request, resource failure или неопределённой очистке нужен RCA и scoped reconciliation; обход proxy/ослабление cap не разрешены. Legacy проверен только на --version, его native маршрут здесь не подтверждён.

Review basis: явный bounded delta/native-evidence scope; base proxy `1f0d99e2cbbc9ca64c663fa901e3bc1cb80b1695ce57f22d3039c60a6d4cabfb`, final `29a28aa281fb290cb952325c1744c085e8bd9e5055617b80d22a11b21e28c3c2`; aggregate snapshot `7e1e6e60a3548772c52156b84ae89e5cf55b1512358bc0730c2ce16972cf5dc9` в `cli-native-preflight-assessment.snapshot.json`.

Scope: три proxy delta, новые тесты, runner, RCA, все native manifests/journals/state/readbacks; ранее проверенные неизменённые границы использованы как основание. SQL/RLS/auth/REST/PostgREST/RPC/service-role безопасность, сами навыки и общий репозиторий вне scope.

Evidence: read-only source/diff review;14 manifest hashes совпали, identity повторно совпала; offline Python AST parse; прочитанные coordinator native/fake logs. Docker/CLI/DB/build/install reviewer не запускал, инфраструктуру и target не менял.

Limits: current-only, cache/failurecleanup/peak и прочие ограничения выше; verdict не означает publication/merge authority.

Recommendation: **approve** — только готовность инфраструктуры к ограниченному current trial.
