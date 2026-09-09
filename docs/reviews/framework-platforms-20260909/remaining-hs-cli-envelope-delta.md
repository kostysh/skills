# CLI resource envelope: source-only delta

Дата: 2026-09-09. **Предыдущий общий max2 недостаточен для принятого контура с сохранённой case-local DB. Нужны max3 task container reservations и меньший per-container cap.** Это source-grounded feasibility correction; proxy/runner/CLI/Docker/БД не запускались, fixtures и target skills не изменены. Исходный supporting log сохранён; данный delta заменяет только его container inventory/resource table.

## Current CLI2.117.0: точная ветка и lifetime

1. Для уже существующей declarative tree `sync.handler.ts:195-206,380-415` не запускает local DB перед планированием. `ensureLocalPostgresImageCurrent()` здесь создаёт Effect value; он исполняется только в соответствующей поздней ветке через `yield*`. Поэтому неверно утверждать, что всякое generation-only sync всегда требует третью DB.
2. `declarative.orchestrate.ts:76-115` передаёт files/history в engine `planDeclarativeSchema`. [engine.next.layer.ts:330-397](https://github.com/supabase/cli/blob/v2.117.0/apps/cli/src/commands/db/shared/legacy-pgdelta-engine.next.layer.ts) оборачивает plan в `Effect.scoped`, создаёт migrations/declarative shadows и два SQL pools. `current-shadow-layer.ts:221-228,303-366` связывает acquire/release с этим scope. Оба shadows одновременно нужны для сравнения, даже если bootstrap выполняется последовательно.
3. В accepted fixture case-local DB нужна для исходного состояния, seed/preservation и apply/readback. Если она остаётся запущенной во время plan, её не удаляет shadow scope и её ресурсная квота продолжает действовать: **local DB + migrations shadow + declarative shadow =3**.
4. При завершении scoped plan закрываются SQL pools и удаляются shadows; затем `sync.handler.ts:566-660` записывает migration и выбирает apply. Нормальная apply ветка работает с local DB уже после завершения двух-shadow scope. Постоянный peak3 появляется от retained local DB во время plan, а не от обязательного одновременного apply и двух shadows.
5. Отсутствующая tree/interactive regeneration — отдельная ветка: `declarative.smart-target.ts:113-117,181-218` может запустить local DB через `ensureLocalDatabaseStarted`. Pinned seam (`legacy-pgdelta.seam.layer.ts:87-123`) действительно начинает local DB, когда она не запущена. Frozen case должен иметь полноценную baseline tree, чтобы случайно не входить в bootstrap/repair вместо проверки subtitle. Эти пути не увеличивают разрешённый pool автоматически.
6. Setup jobs Realtime/Storage/Auth выключены accepted config. Source `db-setup.ts:748-841` запускает каждый только при соответствующем enabled flag. Bundled pg-delta импортирован/исполняется в CLI (`legacy-pgdelta-next-adapter.layer.ts`), отдельного diff container в этой current ветке нет. Изменение service flags или неизвестная native ветка потребует нового inventory, не обхода лимита.

Нормальная scope release — контракт исходников, не наблюдённый cleanup при SIGKILL/daemon failure. Proxy по-прежнему держит reservation до подтверждённого удаления и блокирует новые create при dangling/unknown state.

## Legacy CLI2.39.2: другой состав того же peak

Pinned [diff.go:140-176](https://github.com/supabase/cli/blob/v2.39.2/internal/db/diff/diff.go) создаёт один shadow, применяет original migrations и создаёт declarative target в другой database `contrib_regression` **в том же shadow container**. Это не второй PostgreSQL container.

Но обычный preserved branch использует `DiffSchemaMigraBash` (выбор в `cmd/db.go:93-107`). [migra.go:66-103](https://github.com/supabase/cli/blob/v2.39.2/internal/db/diff/migra.go) вызывает `DockerRunOnceWithConfig` с отдельным `config.Images.Migra` container. Он работает, пока shadow ещё удерживается внешним `defer DockerRemove`. При retained case-local DB получается **local DB + shadow DB + migra job =3**. Даже при alternative experimental differ вместо migra создаётся Edge Runtime job; это не in-process версия current engine.

`cli-legacy-dbstart.go:340-358` подтверждает условные sequential Auth/Storage/Realtime setup jobs; accepted config выключает их. Не переносить current-only experimental settings в окружение legacy. Binary/help/native image versions ещё должны быть проверены coordinator. Эта source ветка2.39.2 используется только как exact historical compatibility control, без утверждения current security support.

Legacy migra job применяет `NetworkMode=host`, чтобы обращаться к SQL endpoints по host addresses. Это явное native свойство (`migra.go:87-91`), а не основание выключить proxy. Нельзя запретить любой host-network container и затем заявить проверку preserved branch; coordinator должен разрешить именно pinned task-owned differ c ограниченными SOURCE/TARGET endpoints и CPU/memory limits. Source URLs/Env содержат connection information; proxy logs не должны раскрывать их значения.

## Единая предлагаемая граница current/legacy

Сохраняем нынешний task runner cap, уменьшаем одинаковую квоту всех case-created containers и учитываем local DB. Все иные собственные Supabase/browser/build workloads должны быть остановлены до gate; чужие ресурсы не изменяются.

| Reservation | Количество | Per-instance CPU | Per-instance RAM | Сумма |
|---|---:|---:|---:|---:|
| CLI runner | 1 | 1.25 | 6GiB | 1.25CPU / 6GiB |
| Case containers: retained local DB + native shadows/differ | max3, включая pending/stopped | 0.75 | 3GiB | 2.25CPU / 9GiB |
| Proxy/supervisor | 1 | 0.25 | 256MiB | 0.25CPU / 0.25GiB |
| **Всего workload reservations** | — | — | — | **3.75CPU / 15.25GiB** |

Один и тот же разрешённый cpuset четырёх CPU для всех. В current source task runner/compose это28-31; coordinator проверяет фактическую доступность перед запуском.

`POST /containers/create` resource enforcement для этих трёх контейнеров:

```json
{
  "HostConfig": {
    "NanoCpus": 750000000,
    "Memory": 3221225472,
    "MemorySwap": 3221225472,
    "CpusetCpus": "28-31"
  }
}
```

Это caps, не обещание потребления/производительности. Более строгие caller limits не ослабляются; конфликтующие controls нельзя пропускать. Adequacy3GiB/0.75CPU для cold startup/SQL workload ещё не измерена. Если native timeout/OOM возникает при этих limits, это infrastructure failure для разбора; нельзя автоматически повторять без ограничений или объявлять skill failure до установления причины.

### Изменения к прежнему proxy contract

- `maxReservedContainers` становится3. В pool обязательно входит **case-local DB**. Если coordinator создаёт её до executor, proxy должен либо создать её сам с указанным cap, либо заранее зарегистрировать exact owned ID и подтвердить тот же HostConfig. Чужая/shared lab DB не годится в качестве незарегистрированного local slot. Тихое сохранение старой4GiB local DB превысит предлагаемый RAM budget.
- Reservations охватывают pending create, running и stopped/restartable containers. Max3 не означает три новых контейнера в дополнение к local DB. После каждого plan старые shadows должны освобождать slots только по confirmed delete; native release error/leak не освобождает квоту в учёте.
- При success/failure/interrupt verify exact inventory и итоговые лимиты. Не считать возврат команды или printed cleanup самостоятельным доказательством отсутствия containers.
- Прежние требования per-request HTTP parsing/rewrite, keep-alive/upgrade enforcement, task-local socket, отсутствие bypass к реальному Docker socket и запрет unscoped cleanup сохраняются. Новый count не разрешает лишние сервисы, глобальный prune или обход scoped labels/IDs.
- Обе версии и оба снимка baseline/candidate используют одинаковую принятую infrastructure policy. До выполнения CLI cases изменение pool не инвалидирует completed HS/tabletop trials: они не использовали этот CLI envelope.

Оставшийся0.25CPU/0.75GiB — запас внутри4CPU/16GiB над workload reservations. Host Docker daemon/image pull overhead не входит в HostConfig клиентов; поэтому таблица не является hard-cgroup proof общей host peak. Images нужно иметь заранее, исключить одновременные pulls/builds и записать реальные usage/readbacks. Если требуется буквально единая hard boundary с daemon, нужен дополнительно изолированный task runtime/daemon cgroup; shared daemon source path сам этого не обеспечивает. Для большего запаса можно отдельно согласовать меньший dedicated CLI runner, но это не часть данного неизменённого runner расчёта.

## Evidence и оставшиеся условия

Новые pinned source hashes/URLs/date: `remaining-hs-official/envelope-delta-manifest.json` и `envelope-delta-extra-manifest.json`; ранее загруженные `sync.handler.ts`, `current-shadow-layer.ts`, `shadow-database.ts`, `db-setup.ts` остаются в original manifests. Проверены именно указанные branches, не все команды Supabase CLI.

До runtime нужны: exact executables/help/image digests, законченная neutral platform baseline, отдельная case-local DB с регистрацией/quota, task-local API proxy+bounded runner, no-bypass socket plumbing и observed concurrency/HostConfig/readback. Никаких новых fixture edits или исполнения ради этого source-only delta не выполнялось.
