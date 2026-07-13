# Raw final blind forward-test records

> Historical failed evidence. The strict authority re-evaluation rejected this run: several outputs still selected concrete route, status, media, body, layout, or data choices without owner authority. It is preserved verbatim below and does not support final acceptance. See `raw-forward-authority-rerun-20260713.md` for the stable-snapshot rerun.

## Recording note

Agent harness instructions were identical for every case: read only `<skill-folder>/SKILL.md` and triggered references; do not inspect `docs/`, Git history/diff, source manifest, tests, or surrounding conversation; do not edit files; answer only the supplied user request with assumptions and evidence limits. `<skill-folder>` replaces the machine-local prefix for portability. User scenarios and outputs below are otherwise verbatim.

## Case 1 — scoped tenant Context

### User scenario

> В Hono-приложении tenant middleware подключён только к `/tenant/*` и кладёт обязательный `tenantId` в Context. Добавь типизацию так, чтобы handlers под `/tenant/*` видели `c.var.tenantId`; вне этого route group middleware не выполняется. Покажи рекомендуемый паттерн и какие проверки нужны.

### Agent output

Рекомендуемый паттерн — отдельный типизированный sub-app для tenant-маршрутов. Не следует расширять глобальный `ContextVariableMap`: это сделает `tenantId` типизированным и там, где middleware не выполняется.

```ts
import { Hono } from 'hono'
import { createMiddleware } from 'hono/factory'

type TenantEnv = {
  Variables: {
    tenantId: string
  }
}

const tenantContext = createMiddleware<TenantEnv>(async (c, next) => {
  const result = await resolveTenant(c)

  if (!result.ok) {
    // Существующий project-owned ответ для отсутствующего/недопустимого tenant.
    return result.response
  }

  c.set('tenantId', result.tenantId)
  await next()
})

const tenantRoutes = new Hono<TenantEnv>()

// Регистрировать до всех handlers этого sub-app.
tenantRoutes.use('*', tenantContext)

tenantRoutes.get('/projects', (c) => {
  // string
  const tenantId = c.var.tenantId

  return c.json({ tenantId })
})

tenantRoutes.get('/projects/:projectId', (c) => {
  return c.json({
    tenantId: c.var.tenantId,
    projectId: c.req.param('projectId'),
  })
})

const app = new Hono()

app.route('/tenant', tenantRoutes)

app.get('/health', (c) => {
  // Здесь tenantId намеренно отсутствует в типе Context.
  return c.text('ok')
})
```

Ключевая граница: `TenantEnv` принадлежит только `tenantRoutes`. Типизация не доказывает, что middleware действительно зарегистрирован или выполняется раньше handler — `new Hono<TenantEnv>()` сам по себе лишь обещает это компилятору. Поэтому middleware и handlers нужно держать в одной композиции, а порядок и область действия защищать тестами.

Нужны следующие проверки:

- Typecheck: `c.var.tenantId` внутри `tenantRoutes` имеет тип `string`.
- Отрицательный type-test: обращение к `c.var.tenantId` в `/health` или другом внешнем handler должно давать ошибку TypeScript. При наличии compile-only fixture это можно закрепить через `@ts-expect-error`.
- Hono integration через `app.request()`:
  - валидный запрос к `/tenant/...` получает установленный `tenantId`;
  - при отсутствии или недопустимости tenant handler не вызывается и возвращается существующий контрактный отказ;
  - запрос вне `/tenant/...` работает без `tenantId`, а tenant resolver/middleware не вызывается;
  - проверяются как минимум корневой и вложенный tenant-path, которые реально поддерживает приложение.
- Если `resolveTenant()` использует runtime bindings, adapter APIs или внешнее хранилище, отдельно нужен runtime integration test: `app.request()` доказывает только проверенную Hono-композицию.

Предполагаю, что `tenantId` становится обязательным только после успешной tenant-проверки и что проект уже определяет ответ при её провале. Статус и тело такого ответа здесь намеренно не изобретаются.

Отдельно нужно уточнить контракт для голого `/tenant`: формулировка `/tenant/*` не обязательно означает, что middleware должен применяться к `/tenant` без завершающего сегмента. Это следует закрепить явным route-test.

Ограничение доказательств: это guidance-only пример. Версия установленного `hono`, фактическая композиция приложения и тестовый harness не проверялись; совместимость `createMiddleware<Env>()` и sub-app composition следует подтвердить по manifest/lockfile и официальной документации для установленной версии.

## Case 2 — existing Valibot/error/RPC contracts

### User scenario

> В существующем Hono API уже используются Valibot, собственный error envelope `{ error: { code, message } }` и Hono RPC. Нужно добавить POST `/widgets` и типы клиента. Предложи минимальную реализацию и верификацию. Миграция validator/error contract не запрошена.

### Agent output

Задача оправдана только если результатом станет реально вызываемый `POST /widgets` и пригодный для компиляции Hono RPC-клиент. Одни Valibot-схемы и экспорт `AppType` — лишь substrate: они не доказывают обработку запроса, сохранение widget или соответствие runtime-ответа контракту.

Предположения:

- сохраняются существующие Valibot-интеграция, error mapper и middleware соседних mutation-маршрутов;
- поля запроса, success status/body и семантика создания уже определены владельцем API;
- миграции на Zod, Problem Details, OpenAPI или новый error contract нет;
- версия Hono и точные имена проектных helper-функций должны быть подтверждены в репозитории.

Минимальная структура:

```ts
// widgets.routes.ts
import { Hono } from 'hono'
import { vValidator } from '@hono/valibot-validator'
import { CreateWidgetInputSchema } from './widgets.contracts'
import {
  existingValidationFailureHook,
  existingCreateWidget,
} from './existing-project-boundaries'

export const widgetRoutes = new Hono().post(
  '/widgets',
  vValidator(
    'json',
    CreateWidgetInputSchema,
    existingValidationFailureHook,
  ),
  async (c) => {
    const input = c.req.valid('json')
    const widget = await existingCreateWidget(input)

    // Подставить утверждённые literal status и response shape.
    return c.json(widget, PROJECT_CREATE_WIDGET_SUCCESS_STATUS)
  },
)
```

`existingValidationFailureHook` здесь принципиален: он должен возвращать существующий `{ error: { code, message } }` с уже принятыми status, media type и redaction rules. Не следует вводить новый локальный envelope или самостоятельно выбирать `400`/`415`. Аналогично ошибки сервиса должны проходить через существующий mapper/`onError`, а не утекать как raw exception.

Для сохранения Hono RPC inference маршрут нужно включить в типизированную цепочку:

```ts
import { Hono } from 'hono'
import { widgetRoutes } from './widgets.routes'

const app = new Hono()

export const routes = app
  // существующие route() сохраняются здесь
  .route('/', widgetRoutes)

export type AppType = typeof routes
export default routes
```

Если приложение уже экспортирует тип chained result, достаточно добавить `.route(...)` в эту цепочку и обновить существующий `AppType`; второй app/type boundary создавать не нужно.

Клиент:

```ts
import { hc } from 'hono/client'
import type { AppType } from '@server/app'

export const api = hc<AppType>(baseUrl)

const response = await api.widgets.$post({
  json: {
    // поля из CreateWidgetInputSchema
  },
})
```

Если нужны именованные типы поверх RPC:

```ts
import {
  hc,
  type InferRequestType,
  type InferResponseType,
} from 'hono/client'
import type { AppType } from '@server/app'

const contractClient = hc<AppType>('')

export type CreateWidgetRequest = InferRequestType<
  typeof contractClient.widgets.$post
>

export type CreateWidgetSuccess = InferResponseType<
  typeof contractClient.widgets.$post,
  typeof PROJECT_CREATE_WIDGET_SUCCESS_STATUS
>
```

Глобальные ответы из `app.onError()` Hono RPC автоматически не моделирует. Если клиент обязан получать типизированный union с существующим error envelope, нужно проверить поддержку текущего `ApplyGlobalResponse` установленной версией Hono и перечислить только реально возвращаемые status/body. Это дополнение типового контракта, не миграция runtime error handling.

Минимальная верификация:

- project typecheck: подтверждает сохранение route inference и компиляцию клиентского вызова;
- type fixture: корректный `json` принимается, отсутствующие/лишние поля проверяются согласно настройкам типов, success response выводится из `$post`;
- Hono integration через существующий `app.request()` или `testClient()`:
  - валидный JSON даёт утверждённые status и body;
  - невалидный JSON даёт точный существующий `{ error: { code, message } }`;
  - отсутствующий или несовместимый `Content-Type` проходит через существующую договорённую ветку;
  - ожидаемая ошибка создания отображается существующим mapper;
  - проверяется реальный вызов принятой data/service boundary, а не только наличие маршрута;
- runtime-интеграция нужна отдельно, если создание зависит от bindings, адаптера или внешнего хранилища.

Без просмотра app composition, установленных версий, схемы widget, admission middleware и data boundary это guidance-only предложение. Оно не подтверждает production readiness, авторизацию, фактическое сохранение данных или runtime-валидацию response body.

## Case 3 — missing Content-Type

### User scenario

> У Hono endpoint `POST /events` стоит built-in `validator('json', ...)`. Контракт требует JSON body и отказ, если клиент отправил JSON-текст без `Content-Type: application/json`. Что произойдёт сейчас и как надёжно закрыть отрицательный сценарий? Статус и error body в требованиях пока не определены.

### Agent output

Сейчас built-in `validator('json', ...)` сам по себе этот контракт не гарантирует. При отсутствующем или несовместимом `Content-Type` Hono не парсит JSON, а callback валидатора получает `{}`. Дальше результат зависит от callback:

- если схема требует поля события, запрос, вероятно, отклонится как невалидное тело;
- если `{}` допустим или callback возвращает значение без проверки, запрос может пройти;
- автоматического надёжного отказа именно по причине неверного media type нет.

Поэтому наличие JSON-схемы — лишь substrate, а не доказательство требуемого поведения.

Надёжное закрытие — явно проверять media type до принятия результата JSON-валидации, не читая body повторно. Например, внутри validator callback либо отдельным middleware непосредственно перед ним:

```ts
validator('json', (value, c) => {
  const contentType = c.req.header('content-type')
  const mediaType = contentType?.split(';', 1)[0]?.trim().toLowerCase()

  if (mediaType !== 'application/json') {
    return projectMediaTypeFailure(c)
  }

  return validateEvent(value, c)
})
```

`projectMediaTypeFailure()` здесь намеренно является owner-supplied boundary. Пока требования не определяют status, media type и error body, нельзя самовольно выбрать `400`, `415` или конкретный JSON envelope. Если в проекте уже есть утверждённый error mapping, нужно использовать его; иначе публичный failure contract остаётся заблокированным решением владельца.

Нужно закрепить поведение Hono integration-тестом через существующий `app.request()`/`testClient()` контур:

1. валидный JSON с `Content-Type: application/json` принимается;
2. тот же JSON-текст без заголовка отклоняется;
3. желательно отдельно проверить несовместимый `Content-Type`, например `text/plain`;
4. после утверждения error contract проверить точные status, response media type и body.

Предположение: `application/json` с параметрами вроде `charset=utf-8` разрешён; `application/*+json` отклоняется, пока контракт явно его не разрешит.

Предел доказательности: вывод основан на активной инструкции навыка, согласно которой при отсутствующем/несовместимом `Content-Type` callback получает `{}`. Я не проверял установленную версию Hono, текущий callback, error hooks и тестовый harness проекта, поэтому это guidance-only, а не подтверждение фактического поведения конкретного приложения.

## Case 4 — global RPC error delta

### User scenario

> В Hono RPC приложении success route типизируется, но глобальный `app.onError()` возвращает JSON `{ error: string }` со статусом 500, которого клиентский union не видит. Как исправить client type boundary и чем подтвердить, что решение корректно?

### Agent output

Предполагаю, что проект действительно использует Hono RPC, `app.onError()` стабильно возвращает `500` с JSON-формой `{ error: string }`, а тип экспортируется из результата цепочки маршрутов. Если это не так, сначала нужно зафиксировать реальный wire contract.

Глобальный `onError()` не входит в route inference Hono RPC. Поэтому client boundary нужно расширить явно через `ApplyGlobalResponse`:

```ts
import type { ApplyGlobalResponse } from 'hono/client'

const routes = app
  .get('/resource', (c) => c.json({ value: 'ok' }, 200))

app.onError((_error, c) => {
  return c.json({ error: 'Internal server error' }, 500)
})

export type AppType = ApplyGlobalResponse<
  typeof routes,
  {
    500: {
      json: {
        error: string
      }
    }
  }
>
```

Клиент должен создаваться именно с `AppType`:

```ts
const client = hc<AppType>(baseUrl)
```

В карту следует добавлять только реально возвращаемые глобальные статусы и тела. Это status-keyed map, а не объект вида `{ status, body, format }`. Если приложение собирается через `app.route()`, экспортировать нужно тип цепочного результата с сохранённой route inference, а не исходный нетипизированный экземпляр `app`.

Подтверждение корректности должно включать два независимых контура:

- Type fixture на настоящем `hc<AppType>`: TypeScript должен видеть и success response, и ветку `500`, где после сужения по `status` JSON имеет поле `error: string`. Для надёжной Hono RPC inference у server/client tsconfig ожидается `strict: true`.
- Hono integration test через `app.request()`: намеренно вызвать исключение в route и проверить фактические `status === 500`, `Content-Type` и тело `{ error: string }`.

Если утверждение касается конкретного адаптера или production runtime, дополнительно нужен runtime-интеграционный тест. `ApplyGlobalResponse` исправляет только статическую границу клиента; он не доказывает, что `onError()` действительно возвращает заявленный контракт. Аналогично, `app.request()` подтверждает лишь покрытую Hono-композицию, но не развёртывание.

Ограничение evidence: без установленной версии `hono`, tsconfig и текущего app composition нельзя подтвердить доступность `ApplyGlobalResponse` и сохранность inference в данном проекте. Для старой версии Hono может потребоваться совместимое обновление или иной проектный контрактный слой; молча обновлять зависимость нельзя.

## Case 5 — missing cross-domain authority

### User scenario

> Создай greenfield Hono endpoint для публичного каталога. Требования определяют только `GET /catalog` и массив товаров. Архитектура, error envelope, CORS, security headers, logging, rate limits, cache, Supabase/RLS и retry policy ещё не утверждены. Дай готовую рекомендацию, что именно внедрять сейчас.

### Agent output

Сейчас честно готов только узкий HTTP-контур. Полная capability каталога ещё не определена: endpoint с `return c.json([])` пройдёт поверхностную проверку, но не докажет получение реальных товаров.

Минимально следует внедрять:

- публичный `GET /catalog`;
- успешное тело — JSON-массив товаров без дополнительного envelope;
- отсутствие request validation, поскольку endpoint не принимает параметры;
- только owner-supplied тип товара и источник данных;
- никаких CORS, security headers, logging, rate limits, cache, retry, Supabase или RLS до принятия соответствующих контрактов.

Минимальная форма handler:

```ts
import { Hono } from 'hono'
import type { CatalogProduct } from './approved-catalog-contract'
import { listCatalogProducts } from './approved-catalog-source'

const app = new Hono()

app.get('/catalog', async (c) => {
  const products: readonly CatalogProduct[] =
    await listCatalogProducts()

  return c.json(products, 200)
})

export default app
```

Здесь `approved-catalog-contract` и `approved-catalog-source` — обозначения входов, которые должен утвердить владелец продукта/архитектуры, а не рекомендация создать именно такие слои или файлы.

Для этого примера явно принято минимальное допущение: успешный ответ имеет статус `200` и `Content-Type: application/json`. Если даже статус не утверждён, его нельзя молча превращать в контракт — реализацию нужно остановить до подтверждения.

До написания реального handler необходимо определить как минимум:

- wire shape одного товара;
- источник массива и допустимость пустого массива;
- поведение при недоступности или некорректном ответе источника.

Без последнего нельзя корректно реализовать failure path: не следует самостоятельно выбирать `500`, `503`, Problem Details или иной error envelope.

Проверки после утверждения этих входов:

- `app.request('/catalog')` возвращает утверждённый статус и JSON-массив;
- каждый элемент соответствует утверждённому wire contract;
- отдельно проверены пустой и непустой результаты, если оба разрешены;
- failure test проверяет утверждённое поведение источника, когда оно появится;
- если данные приходят из runtime-нетипизированного источника, нужна runtime-проверка ответа либо честное ограничение гарантии статической типизацией;
- adapter/runtime integration нужен только если итоговый источник или платформа вводят runtime-specific поведение.

Анти-claims:

- `public` означает отсутствие route-level auth только при таком принятом толковании; это не означает автоматическую необходимость CORS.
- `app.request()` доказывает лишь проверенную Hono-композицию, но не работу deployment adapter, базы или edge-конфигурации.
- TypeScript-тип и тест одного ответа не доказывают runtime-валидность всех данных.
- Заглушка, mock или постоянный пустой массив — scaffolding, а не реализованный каталог.

Ограничение доказательств: manifest, установленная версия Hono, runtime adapter, схема товара, источник данных и test harness не проверялись. Поэтому это bounded greenfield guidance, а не подтверждение production-ready реализации.
