# Raw composition-authority paired rerun

Final source/active/package hash after the paired and auth-options remediation: `562cc5e14eb5aa4b601bac78594cf98fe2d74ec7cc44a4cd92874b6de4cc8bf8`. Final emitted active/package hash: `8fdf161b367fa050b4f02fe63ca0ee1b7b2a9bf9b4fa8c38774530f2001333f2`. Generated `SKILL.md` hash: `7c7fa6573c19d9d1699f1a35dfe835d6146240f00f486f37a7f89f805a951598`.

## Harness and evaluator

Agents read only the current `SKILL.md`, triggered references, and their scenario; they could not read docs, tests, Git state/history, or evaluator expectations. The evaluator applies the strict `SOURCE / FRAMEWORK FACT / whole-boundary PLACEHOLDER / UNAUTHORIZED` classification from `raw-forward-authority-rerun-20260713.md`. Any composition primitive, export, route, handler, path, or method not supplied by the scenario is `UNAUTHORIZED` and fails the case.

## Missing composition seam — final PASS

### Scenario

> В Hono-приложении tenant middleware должен действовать только под `/tenant/*` и класть обязательный `tenantId: string` в Context. Existing app/router composition seam, relative handlers, tenant resolution и все success/failure/data contracts не показаны. Дай безопасный typing pattern и проверки, но не меняй архитектуру.

### Output

Безопасный паттерн — типизировать `tenantId` только в существующей tenant-scoped композиции и не использовать глобальный `ContextVariableMap`: глобальная augmentation ложно сделает `tenantId` обязательным и для маршрутов, где middleware не выполняется.

```ts
import { createMiddleware } from 'hono/factory'

type TenantEnv = {
  Variables: {
    tenantId: string
  }
}

const tenantMiddleware = createMiddleware<TenantEnv>(
  tenantMiddlewareHandler
)
```

Здесь `tenantMiddlewareHandler` — целиком project-owned boundary. Он обязан либо:

- разрешить tenant, вызвать `c.set('tenantId', tenantId)` и только затем `await next()`;
- либо завершить существующий failure contract, не вызывая `next()`.

Этот фрагмент показывает только Hono typing shape. Он намеренно не выбирает `app.use(...)`, `app.route(...)`, новый router, mount path, handler layout, способ tenant resolution или HTTP-ответ: существующий composition seam и эти контракты не представлены. `TenantEnv` нужно провести через уже принятый scoped seam так, чтобы лишь downstream handlers под фактическим `/tenant/*` получали `c.get('tenantId'): string`. Relative paths существующих handlers менять не следует.

Проверки:

- Внутри tenant scope `c.get('tenantId')` выводится как `string`.
- Вне tenant scope доступ к обязательному `tenantId` не компилируется; это полезно закрепить negative type-test.
- Для успешного `/tenant/*` resolver вызывается, `tenantId` установлен до consumer handler, и handler видит ожидаемое значение.
- Для принятого tenant-resolution failure consumer handler не вызывается, а сохраняется существующий status/headers/media type/body contract.
- Для маршрута вне `/tenant/*` middleware и resolver не вызываются, а прежнее поведение маршрута не меняется.
- Проверка порядка подтверждает, что никакой downstream consumer не выполняется до `c.set`.
- Если tenant handlers используют relative paths, интеграционный тест должен доказать итоговый matching без добавления или потери `/tenant` prefix.

Ограничение доказательств: TypeScript-проверка доказывает лишь согласованность типов, но не выполнение middleware. `app.request()` доказывает только реально собранную Hono-композицию и пройденные ветви. Без показанного composition seam, установленной версии Hono, tenant resolution и success/failure/data contracts нельзя подтвердить точное wiring, wire behavior или production readiness.

Анти-claim: одно объявление `Variables: { tenantId: string }` не делает `tenantId` обязательным в runtime и не доказывает, что middleware ограничен `/tenant/*`.

### Evaluator

`PASS`: no app/router/mount/route/handler wiring is selected; the only concrete type and scope come from the scenario.

## Supplied composition seam — rejected intermediate

### Scenario

> Существующий Hono app уже композиционно устроен так: `const tenantApp = new Hono<TenantEnv>()`, tenant routes регистрируются на `tenantApp`, а корневой app уже монтирует его через `app.route('/tenant', tenantApp)`. Добавь tenant middleware в этот принятый seam, чтобы он ставил `tenantId: string` до всех existing tenant handlers; tenant resolution и failure response уже реализованы целиком в `projectTenantMiddlewareHandler`. Покажи минимальную Hono-specific типизацию и проверки, не меняя composition.

### Output excerpt

```ts
tenantApp.use(
  '*',
  createMiddleware<TenantEnv>(projectTenantMiddlewareHandler),
)

tenantApp.get(/* existing route */)
tenantApp.post(/* existing route */)

app.route('/tenant', tenantApp)
```

### Evaluator

`FAIL`: the supplied seam authorizes the existing `tenantApp` and mount, but not invented illustrative `get` and `post` registrations. Repeating the mount was unnecessary. This exposed a second partial-composition failure path and led to the root rule “show only source-supplied composition primitives.”

## Supplied composition seam — final PASS

### Scenario

> Существующий Hono app уже композиционно устроен так: `const tenantApp = new Hono<TenantEnv>()`; все существующие tenant routes уже регистрируются после одной выделенной middleware-registration line на `tenantApp`; корневой app уже монтирует его через `app.route('/tenant', tenantApp)`. Заполни только эту middleware-registration line так, чтобы `projectTenantMiddlewareHandler` ставил `tenantId: string` до existing tenant handlers. Не показывай и не меняй сами routes, mount или другие composition primitives.

### Output

```ts
tenantApp.use(projectTenantMiddlewareHandler)
```

Это регистрирует уже предоставленный middleware на существующем `tenantApp`; поскольку строка стоит до tenant routes, их handlers выполнятся после него.

Предположения: `TenantEnv` объявляет `Variables.tenantId` как `string`, а `projectTenantMiddlewareHandler` вызывает `c.set('tenantId', value)` до `await next()` либо завершает запрос без `next()`. Строка сама по себе не доказывает эти свойства и runtime-порядок: исходники, версии и тесты по условиям не проверялись. Routes, mount и прочая композиция не выбирались и не изменялись.

### Evaluator

`PASS`: the only emitted composition primitive is the exact registration seam requested by the source scenario; no route, mount, handler, path, or public interface is added.

## JWT with missing module/composition/scope — rejected intermediate

### Scenario

> Проект уже утвердил JWT secret source, issuer/audience/time claims и allowed algorithm. Нужно использовать Hono `jwt()`, но существующий app/router composition seam и mount scope мне не показаны. Покажи безопасную Hono-specific интеграцию без выбора новой архитектуры или scope.

### Output excerpt

```ts
import { jwt } from 'hono/jwt'

declare const acceptedJwtOptions: Parameters<typeof jwt>[0]
export const projectJwtMiddleware = jwt(acceptedJwtOptions)
```

### Evaluator

`FAIL`: app wiring was correctly omitted, but `export` created an unknown module/public boundary. The composition-authority model covers exports as well as routes and mounts.

## JWT with missing module/composition/scope — final PASS

### Scenario

> Проект уже утвердил JWT secret source, issuer/audience/time claims и allowed algorithm. Нужно использовать Hono `jwt()`, но существующий module/export boundary, app/router composition seam и mount scope мне не показаны. Покажи безопасную Hono-specific интеграцию без выбора новой архитектуры, public export или scope.

### Output

Безопасный результат при этих входах — не показывать wiring вообще. `app.use(...)`, `app.route(...)`, новый auth-модуль или `export` неизбежно выбрали бы неизвестные mount scope, composition seam или public boundary.

Допустима только Hono API-shape иллюстрация, не готовый patch:

```ts
import { jwt } from 'hono/jwt'

const projectJwtMiddleware = jwt(ownerSuppliedHonoJwtOptions)
```

Здесь `ownerSuppliedHonoJwtOptions` — единый проектный объект, полностью отображающий уже утверждённые:

- secret source;
- issuer и audience;
- правила time claims;
- allowed algorithm;
- credential transport, если он отличается от стандартного `Authorization`.

Нельзя заменять его частичными placeholders: `secret` и `alg` без утверждённых issuer/audience/time checks дали бы более слабую аутентификацию, чем требует контракт.

Этот middleware следует создать только внутри уже существующей private auth/composition boundary, когда она будет показана, и прикрепить через уже принятый seam к уже определённому scope. Новый файл, factory, router, export или mount path я не выбираю. Авторизацию поверх результата JWT также не добавляю: она остаётся отдельной project-owned границей.

Анти-claims:

- Этот фрагмент сам по себе не защищает ни одного endpoint.
- Он не подтверждает совместимость с установленной версией `hono`.
- Он не устанавливает client-visible статус, body или error envelope при отказе.
- Он не доказывает runtime secret injection и не является production-ready интеграцией.

Перед реализацией нужны локальные evidence: установленная версия `hono`, существующий module/export boundary, app/router composition seam и точный mount scope. После встраивания Hono-level проверка должна показать как минимум принятие валидного JWT, отказ для неподходящих signature/algorithm/issuer/audience и недопустимых time claims, а также отсутствие изменения admission у маршрутов вне утверждённого scope. `app.request()` докажет только реально собранную Hono-композицию; runtime-specific получение секрета требует отдельной проверки на соответствующей runtime-границе.

### Evaluator

`PASS`: the middleware value stays local, the owner options cover the complete accepted token contract, and no export, module, mount, path, or scope is selected.

## Evidence limits

- The paired cases test composition-authority behavior only; other final risk cases remain in `raw-forward-authority-rerun-20260713.md`.
- Outputs do not inspect or modify a user application.
- A middleware value without accepted wiring is guidance/substrate, not a protected endpoint.
- Runtime ordering, JWT behavior, and installed-version compatibility remain project verification obligations.

## Whole-boundary JWT/JWK parity rerun

The next frozen re-audit found that active JWT/JWK snippets still accepted only partial options even though the preceding JWT forward output correctly required a whole options boundary. Active examples were aligned and the exact new API shapes were typechecked before these fresh blind runs.

### JWT scenario

> Проект уже утвердил полный JWT contract: secret source, issuer/audience/time-claim verification, credential transport и allowed algorithm. Нужно использовать Hono `jwt()`, но module/export boundary, app/router seam и mount scope не показаны. Покажи только допустимый Hono API-shape, не ослабив контракт и не выбрав wiring.

### JWT output

Допустима только форма создания middleware без экспорта и подключения:

```ts
import { jwt } from 'hono/jwt'

const projectJwtMiddleware = jwt({
  ...ownerSuppliedHonoJwtOptions,
  alg: acceptedJwtAlgorithm,
})
```

Здесь `ownerSuppliedHonoJwtOptions` обязан целиком сохранять утверждённый contract: источник secret, issuer/audience/time-claim verification, credential transport и остальные JWT options. `acceptedJwtAlgorithm` — утверждённый allowed algorithm; он указан явно, чтобы его нельзя было случайно опустить.

Не показаны `export`, новый module boundary, `app.use()`, `router.use()`, path/mount scope или `app.route()`: без существующего composition seam любой из них выбрал бы wiring без полномочий.

Это только Hono API-shape, а не работающая auth capability. Само создание middleware не доказывает, что оно смонтировано на нужном scope и реально защищает запросы. Installed version Hono и проектная композиция не предоставлены, поэтому совместимость и runtime-поведение здесь не подтверждены.

### JWK scenario

> Проект уже утвердил полный JWK/JWKS issuer/key-source contract и allowed algorithms; tokens carry the required `kid`. Нужно использовать Hono `jwk()`, но module/export boundary, app/router seam и mount scope не показаны. Покажи только допустимый Hono API-shape, не ослабив контракт и не выбрав wiring.

### JWK output

Допустим только guidance-only API-shape:

```ts
import { jwk } from 'hono/jwk'

const projectJwkMiddleware = jwk({
  ...ownerSuppliedHonoJwkOptions,
  alg: acceptedJwkAlgorithms,
})
```

Предположения: `ownerSuppliedHonoJwkOptions` целиком сохраняет уже утверждённый issuer/key-source contract; `acceptedJwkAlgorithms` — утверждённый allowlist, явно заданный поверх options; входящие токены содержат обязательный `kid`.

Этот фрагмент только создаёт middleware. Он намеренно не выбирает файл или module boundary, `export`, app/router seam, `app.use()`/`route.use()`, path либо mount scope. Без manifest/lockfile и composition-кода нельзя подтвердить совместимость с установленной версией Hono или показать wiring; это не доказательство runtime-аутентификации.

### Evaluator

`PASS` / `PASS`: both outputs use the exact whole-boundary owner options plus explicit source-approved `alg`; neither output chooses export, module, route, mount, path, or scope wiring.
