# Raw strict-authority forward-test records

## Snapshot and harness

- Date: 2026-07-13.
- Source/active/package hash at blind execution: `e0008d198426cbe5ec2c86b63aad05dc637785a3628cb913b97b9a4ec190c991`.
- Emitted active/package hash at blind execution: `bb15aa010b9c56ced134074f0e167e0c734d5d243a6d45e5e73175bba2ceebc0`.
- Generated `SKILL.md` hash: `702a1237f52ab8234a8a0cefcc829da8ca9bff2f103e19cfe56507cc1b8b65c6`.

Post-run bounded delta: `references/contracts-types.md` changed only the label `Current stable shape` to `Latest official stable shape at use time`; the package test added a generic assertion that rejects numeric Hono semver pins anywhere in the active surface. Code examples, behavior, rubric, and `SKILL.md` were unchanged. Final source/active/package hash is `09813b3d79a4b31cfef2d061acfa78c2da2b04459107df0785723935e2c4a020`; final emitted active/package hash is `caba8a6eefa21d9feb015889ef9d1607007d41defafad14877ecde8f21f7abf8`.

Each agent received only the current `SKILL.md`, references triggered by the scenario, the scenario itself, and read-only constraints. Agents were told not to read supporting docs, tests, Git state/history, or the evaluator rubric. Paths below are normalized to `<skill-folder>`; scenarios and outputs are otherwise verbatim.

## Strict evaluator rubric

Every concrete choice is classified as `SOURCE`, `FRAMEWORK FACT`, `PLACEHOLDER`, or `UNAUTHORIZED`. Any `UNAUTHORIZED` choice fails the case. A placeholder passes only when it covers the whole unknown boundary; labels such as assumption, greenfield, conditional, or example do not supply authority. Unknown app composition forbids handler/router wiring.

## Case 1 — scoped tenant Context

### User scenario

> В Hono-приложении tenant middleware подключён только к `/tenant/*` и кладёт обязательный `tenantId: string` в Context. Добавь типизацию так, чтобы handlers под `/tenant/*` видели `c.var.tenantId`; вне этого route group middleware не выполняется. Способ tenant resolution и все success/failure response/data contracts не заданы. Покажи рекомендуемый паттерн и проверки.

### Agent output

Рекомендуемый паттерн — отдельный типизированный tenant-router. Он совмещает две вещи: runtime middleware действительно выполняется только внутри `/tenant`, а `TenantEnv` доступен только handlers этого router.

```ts
import { Hono } from 'hono'
import { createMiddleware } from 'hono/factory'

type TenantEnv = {
  Variables: {
    tenantId: string
  }
}

const app = new Hono()
const tenantApp = new Hono<TenantEnv>()

const tenantContext = createMiddleware<TenantEnv>(
  projectTenantResolutionAndFailureMiddleware
)

tenantApp.use('*', tenantContext)

tenantApp.get(projectTenantRelativePath, (c) => {
  const tenantId: string = c.var.tenantId

  return projectCompleteTenantHandler(c, tenantId)
})

app.route('/tenant', tenantApp)
```

Здесь:

- `projectTenantResolutionAndFailureMiddleware` — владелец всей пока неизвестной границы resolution: он получает tenant, вызывает `c.set('tenantId', value)` до `await next()` и полностью реализует утверждённый failure response. При неуспехе он не должен вызывать `next()`.
- `projectCompleteTenantHandler` владеет полным success response/data contract.
- `projectTenantRelativePath` — утверждённый относительный путь внутри `/tenant`.
- Существующую композицию следует сохранить; `app.route('/tenant', tenantApp)` допустим только если такой seam совместим с проектом.

Не следует использовать глобальный `ContextVariableMap` или типизировать корневой `app` как `Hono<TenantEnv>`: это сделает `tenantId` видимым вне tenant scope, хотя middleware там не выполняется.

Проверки:

1. Type-level fixture:

   - внутри `tenantApp` выражение `const id: string = c.var.tenantId` компилируется;
   - в handler корневого `app` обращение к `c.var.tenantId` помечено `@ts-expect-error` и действительно не компилируется.

2. Hono integration через существующий runner и `app.request()`:

   - запрос к tenant route вызывает middleware до handler;
   - handler получает ровно значение, записанное через `c.set`;
   - запрос вне `/tenant/*` не вызывает tenant middleware — это лучше проверять spy/counter, а не косвенно по body;
   - при resolution failure handler не вызывается, а статус, headers, media type и body проверяются только после утверждения соответствующего контракта;
   - два параллельных запроса с разными tenant fixtures не смешивают `tenantId`, подтверждая request-scoped хранение;
   - отдельной проверкой фиксируется требуемое поведение для точного `/tenant`, если оно отличается от `/tenant/*`.

Capability здесь — runtime scope middleware плюс доступ обязательного `tenantId` в реально защищённых handlers. Типизация сама по себе — лишь substrate: она не запускает middleware и не доказывает корректность resolution, authorization, tenant isolation либо failure contract.

Ограничения доказательств: manifest, lockfile, текущая композиция и тестовый harness не исследовались; совместимость установленной версии Hono с показанными generic APIs не подтверждена. Поэтому это guidance-only паттерн. `app.request()` подтвердит только исполненные ветви Hono-композиции, но не production adapter, live configuration или безопасность tenant resolution.

### Evaluator result

`FAIL` on independent re-evaluation: the scenario did not supply the app/router composition seam, but the output created root/sub-app instances and selected `use`, `get`, and `route` wiring. The later “only if compatible” qualification does not create authority. This false `PASS` triggered systemic composition-example normalization and a paired rerun preserved in `raw-forward-composition-rerun-20260713.md`.

## Case 2 — existing Valibot/error/RPC contracts with missing authority

### User scenario

> В существующем Hono API уже используются Valibot, единый error envelope `{ error: { code, message } }` и Hono RPC. Добавь `POST /widgets`, но поля writable input, consumed request part/media type, success status/body, data boundary, app composition seam и точные failure contracts мне пока не дали. Покажи минимальную реализацию и проверки.

### Agent output

Добавить корректный `POST /widgets` сейчас нельзя: «минимальная реализация» неизбежно выдумает публичный HTTP-контракт и архитектурную точку подключения. Поэтому исполняемый handler, Valibot-схему и router wiring не показываю.

Цель — наблюдаемая возможность создать widget через существующий API. Наличие маршрута, схемы и проходящего typecheck без согласованного wire/data contract было бы только substrate и могло бы формально «пройти», не реализовав нужное поведение.

Не хватает решений владельца контракта:

- writable поля и правила Valibot;
- request part и допустимый media type;
- success status, media type и body;
- admission/auth/tenant semantics;
- data boundary и атомарность операции;
- существующий app/router composition seam;
- точные failure status/code/message/headers для validation, media type, conflict, data/upstream и unknown error;
- какие глобальные ошибки должны входить в Hono RPC type.

Известный envelope `{ error: { code, message } }` определяет только форму тела. Он не определяет status, допустимые `code`, безопасный `message`, headers или соответствие причин ошибкам. Аналогично наличие Valibot не разрешает выбрать `json`, а Hono RPC требует конкретных status/body branches.

Даже такой код пока был бы недостоверным:

```ts
app.post('/widgets', valibotValidator('json', schema), handler)
```

Он уже самовольно выбирает composition seam, JSON/media contract, writable schema и handler boundary. Opaque `projectRouteHandler` также нельзя подключить, пока неизвестно, где и как существующее приложение монтирует routes.

Минимальный следующий вход от владельца может выглядеть так:

```text
request:
  part/media: ...
  writable fields and validation rules: ...

success:
  status: ...
  media type: ...
  body: ...

failures:
  validation: status/code/message/headers
  unsupported media: status/code/message/headers
  conflict: status/code/message/headers
  data/upstream: status/code/message/headers
  unknown: existing global mapping

data:
  accepted repository/service/function boundary: ...
  transaction/idempotency expectations: ...

composition:
  existing app/router factory or mount seam: ...

RPC:
  exported chained route/app type: ...
  global responses included in client union: ...
```

После получения этого контракта минимальная проверка должна включать:

- typecheck и RPC type fixture для фактических success/error unions;
- `app.request()`/`testClient()` для принятого media type, valid input, forbidden/computed fields, malformed/invalid input и каждой согласованной failure branch;
- проверку точного status, media type, body и headers;
- проверку вызова принятого data boundary и безопасного отображения его ошибок;
- runtime harness, если поведение зависит от adapter/bindings/platform APIs.

`app.request()` докажет только исполненные Hono route/middleware/error-hook ветви. Оно не докажет реальную БД, platform adapter или production deployment; для этих claims нужны соответствующие integration/runtime/live проверки.

Assumptions: Valibot, единый envelope и Hono RPC действительно являются действующими project-owned conventions. Installed Hono/validator/runtime versions и совместимость API не проверены. Файлы не изменялись, команды проекта и тесты не запускались.

### Evaluator result

`PASS`: no executable implementation or composition is proposed; existing conventions are preserved and all missing owner decisions remain blockers.

## Case 3 — missing Content-Type

### User scenario

> У Hono endpoint `POST /events` стоит built-in `validator('json', ...)`. Контракт требует JSON body и отказ, если клиент отправил JSON-текст без `Content-Type: application/json`, но failure status, response media/body и точная политика parameters/`+json` ещё не заданы. Что произойдёт сейчас и как надёжно закрыть отрицательный сценарий?

### Agent output

Сейчас Hono не гарантирует требуемый отказ. Для `validator('json', ...)` при отсутствующем или несовместимом `Content-Type` тело не разбирается, а callback валидатора получает `{}`. Автоматического ответа «неподдерживаемый media type» от этого механизма ждать нельзя.

Дальнейшее зависит от существующего callback:

- если `{}` допустим, endpoint может продолжить выполнение с `c.req.valid('json') === {}`;
- если `{}` отвергается схемой, запрос завершится тем ответом, который формирует callback или действующий error mapper;
- по имеющимся данным нельзя назвать точные status, media type и body.

Надёжное закрытие требует сначала определить весь wire-контракт отказа:

- status;
- response `Content-Type`, body и нужные headers;
- допускаются ли параметры вроде `application/json; charset=utf-8`;
- допускаются ли structured suffix media types вида `application/*+json`;
- как трактуются регистр, пробелы и некорректный `Content-Type`.

После этого проверка media type должна быть явной: validator либо предшествующая project-owned middleware проверяет исходный заголовок по утверждённой политике и при несоответствии возвращает целиком owner-supplied failure response. Проверять только `value === {}` ненадёжно: корректное JSON-тело `{}` неотличимо от заглушки, которую получает callback при неподходящем заголовке.

Минимальный интеграционный набор через существующий Hono test contour:

- JSON-текст без `Content-Type` даёт точный утверждённый failure response;
- handler и его побочные эффекты не выполняются;
- `{}` с допустимым `Content-Type` проверяется отдельно;
- отдельная таблица фиксирует решения для параметров и `+json`;
- успешный `application/json` запрос по-прежнему доходит до handler.

Анти-claim: тест, который проверяет только `non-2xx`, либо случайное отклонение `{}` схемой, не доказывает соблюдение media-type контракта. `app.request()` подтвердит упражнённую Hono-композицию, но не универсальное поведение конкретного runtime adapter.

Граница доказательств: это вывод из текущей active guidance skill. Версия установленного `hono`, реализация callback/error mapper и актуальные официальные runtime semantics по заданному read-only контуру не проверялись, поэтому более точный ответ о фактическом wire-response был бы выдумкой.

### Evaluator result

`PASS`: `{}` semantics and the failure path are correct; the unresolved rejection response and media policy are not guessed.

## Case 4 — global RPC error

### User scenario

> Существующий Hono app уже имеет глобальный `app.onError()`, который по принятому контракту возвращает status 500 и JSON body `{ error: string }`. Hono RPC client не видит этот global error response. Исправь только typing boundary, сохрани существующие routes и wire behavior. Проект использует совместимый strict TypeScript.

### Agent output

Нужна только корректировка exported RPC type. `app.onError()`, routes и runtime wiring остаются без изменений.

Если сейчас экспортируется `typeof app` или тип уже захваченного chained route result, следует обернуть тот же operand:

```ts
import type { ApplyGlobalResponse } from 'hono/client'

type GlobalErrorResponses = {
  500: {
    json: {
      error: string
    }
  }
}

export type AppType = ApplyGlobalResponse<
  typeof app, // оставить существующий operand exported RPC type
  GlobalErrorResponses
>
```

Если проект экспортирует `typeof routes`, использовать именно `typeof routes`; не перестраивать route composition ради этой правки. Клиент продолжает создаваться как `hc<AppType>(...)`.

Реальная capability здесь — RPC consumer может сузить response по `status === 500` и получить JSON типа `{ error: string }`. Сам alias и успешный `tsc` на сервере — лишь substrate; критерий приёмки должен включать strict client type fixture, проверяющую и существующие success branches, и новую ветку `500`.

Anti-claims:

- Это не меняет wire behavior и не добавляет новый ответ.
- Это не доказывает, что `app.onError()` фактически всегда возвращает заявленную форму.
- Это не выполняет runtime validation JSON body.
- Нельзя добавлять другие статусы или более широкий error union без существующего runtime-контракта.

Предположения: текущий exported app type уже сохраняет inference существующих routes; установленная версия `hono` экспортирует совместимый `ApplyGlobalResponse`; `strict: true` действует на server/client TypeScript boundary. В рамках blind-проверки manifest, исходный app и тесты не читались, поэтому совместимость конкретной версии и фактическое соответствие runtime handler не подтверждены; файловые изменения и проверки не выполнялись.

### Evaluator result

`PASS`: all concrete wire choices are supplied by the scenario; the helper import and map shape match current Hono; typing is not presented as runtime proof.

## Case 5 — missing cross-domain authority

### User scenario

> Нужен новый `GET /catalog` в Hono. Известны только method и path. Архитектура/слои, app composition seam, auth/CORS/security policy, success/error/log schema, rate limits, cache/retries, data source и Supabase/RLS не определены. Сделай production-ready endpoint.

### Agent output

Результат: реализацию останавливаю. По заданным данным нельзя честно сделать production-ready `GET /catalog`: method и path задают только substrate маршрута, но не его наблюдаемое поведение и эксплуатационные гарантии.

Анти-claims:

- Наличие `app.get('/catalog', ...)` не доказывает работоспособную capability.
- `GET` не означает автоматически public, cacheable, без tenant-фильтра или без rate limit.
- `c.json(...)`, `200`, `404`, `500`, Problem Details, Zod, OpenAPI и Hono RPC нельзя выбирать по умолчанию.
- Hono middleware не определяет auth, CORS, security, retries, cache или quota policy.
- `app.request()` не доказывает runtime/adaptor behavior, production configuration либо корректность Supabase/RLS.

Не делаю даже частичный handler или router wiring. Здесь неизвестен composition seam, поэтому `app.route(...)`, `app.get(...)`, mount path, factory/layout и chained route shape уже были бы несанкционированными архитектурными решениями. Нельзя спрятать лишь status или dependency за placeholder: неизвестная граница должна быть передана целиком owner-supplied handler, но даже это допустимо только после определения места его подключения.

Для продолжения нужны авторитетные решения:

- существующий app factory/entrypoint, route composition, middleware/error hooks, runtime, установленные версии Hono/adaptor и test harness;
- полный HTTP-контракт: потребляемые request parts, success status, media type, body/schema, headers, ожидаемые failures и client recovery;
- endpoint class: public/user/admin/service, authn/authz, tenant/owner semantics, CORS/CSRF и edge-security policy;
- источник каталога, query/pagination/filter semantics и dependency boundary;
- если используется Supabase — SDK или direct HTTP, credential propagation, RLS/RPC contract и прямое доказательство data-boundary enforcement;
- owner-supplied body/timeout/rate-limit/cache/retry policies, включая ключи квот, privacy/freshness/invalidation и idempotency/replay semantics;
- error mapping, redaction, logging/correlation, metrics/tracing и их transport/retention policy;
- требуемая публикация контракта: Hono RPC, OpenAPI/runtime schema, type-only export либо отсутствие публичной поверхности.

Stop rules:

- пока отсутствует хотя бы один публичный/runtime выбор, не подменять его «обычным REST default»;
- при конфликте равноправных источников остановиться и запросить решение владельца;
- security, architecture и Supabase/RLS решения передать соответствующим владельцам; `hono-engineer` интегрирует принятые контракты, но не изобретает их;
- при недоступной runtime/data/live границе ограничить claim фактически проверенным уровнем.

Граница доказательств сейчас: код и проект не исследованы, версии не установлены, проверки не запускались; совместимость и production readiness не подтверждены. После получения контрактов минимальная доказательная цепочка должна покрыть Hono composition и отрицательные ветки через `app.request()`/`testClient()`, adapter/runtime behavior через реальный harness, Supabase/RLS через прямую data-boundary проверку и, если claim зависит от deployment/configuration, наблюдение на staging/live.

### Evaluator result

`PASS`: method/path are treated as substrate, no foreign policy or wiring is supplied, and the output stops at owner-producible blockers with an evidence boundary.

## Evidence limits

- These five cases exercise the named high-risk decision families, not the complete Hono task space.
- Blind agents did not inspect a user application, execute Hono, or verify deployment behavior.
- Evaluator classification is a review of the emitted answers; it is not a production runtime test.
- Compiler, docs-contract, typecheck, and package checks are separate supporting evidence and do not upgrade these outputs into production proof.
