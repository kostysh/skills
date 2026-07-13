# Raw forward-test remediation evidence

## Recording note

Это finding-bearing transcript initial outputs, которые привели к root-cause remediation. Harness path нормализован до `<skill-folder>`; повторяющиеся test/evidence детали компактированы и поэтому этот файл не заявлен как byte-for-byte provenance. Следующий полный run в `raw-forward-final-20260713.md` также был отклонён более строгой authority-проверкой; принятый stable-snapshot rerun сохраняется отдельно в `raw-forward-authority-rerun-20260713.md`.

## Initial FAIL — scoped tenant Context

### User scenario

> В Hono-приложении tenant middleware подключён только к `/tenant/*` и кладёт обязательный `tenantId` в Context. Добавь типизацию так, чтобы handlers под `/tenant/*` видели `c.var.tenantId`; вне этого route group middleware не выполняется. Покажи рекомендуемый паттерн и какие проверки нужны.

### Agent output

Для scoped middleware не стоит использовать глобальный `ContextVariableMap`: он типизирует `tenantId` во всех Hono Context и скрывает возможность `undefined` вне `/tenant/*`.

Рекомендуемый паттерн — отдельный типизированный sub-app:

```ts
import { Hono } from 'hono'
import { createMiddleware } from 'hono/factory'

type TenantEnv = {
  Variables: {
    tenantId: string
  }
}

const tenantMiddleware = createMiddleware<TenantEnv>(async (c, next) => {
  const tenantId = await resolveTenantId(c) // существующий project-owned механизм

  if (!tenantId) {
    // Сохранить принятый HTTP/error contract приложения.
    return c.json({ error: 'Tenant is required' }, 400)
  }

  c.set('tenantId', tenantId)
  await next()
})

const tenantRoutes = new Hono<TenantEnv>()
tenantRoutes.use('*', tenantMiddleware)

tenantRoutes.get('/profile', (c) => {
  const tenantId: string = c.var.tenantId
  return c.json({ tenantId })
})

const app = new Hono()
app.route('/tenant', tenantRoutes)
```

Если tenant-aware endpoints немного, ещё уже и безопаснее передавать типизированный middleware непосредственно в каждую route composition. Локальные generics выравнивают типовую гарантию с областью применения middleware, но порядок регистрации и runtime composition всё равно нужно проверить.

Минимальные проверки: typecheck внутри и вне tenant composition; `app.request()` с установленным tenant; negative path без tenant; маршрут вне `/tenant/*`; порядок регистрации middleware.

Предполагаю, что способ определения tenant и HTTP-ответ при его отсутствии уже заданы проектом. Без manifest/lockfile и существующей app composition это guidance-only пример. Typecheck и `app.request()` не доказывают конкретный runtime/deployment.

### Evaluator finding

`FAIL`: комментарий объявляет response project-owned, но code самостоятельно вводит `400` и `{ error: 'Tenant is required' }`.

## Initial FAIL — missing Content-Type

### User scenario

> У Hono endpoint `POST /events` стоит built-in `validator('json', ...)`. Контракт требует JSON body и отказ, если клиент отправил JSON-текст без `Content-Type: application/json`. Что произойдёт сейчас и как надёжно закрыть отрицательный сценарий?

### Agent output

Сейчас Hono не отклонит такой запрос автоматически только из-за отсутствующего `Content-Type`. Для `validator('json', ...)` тело не будет разобрано, а callback получит `{}`. Итог зависит от вашей функции: если `{}` допустим или проверка слишком слабая, запрос может ошибочно пройти.

Надёжно разделите две проверки:

1. До schema validation явно проверьте media type.
2. Затем валидируйте полученное JSON-значение и возвращайте существующий project-owned error envelope.

```ts
import { validator } from 'hono/validator'

app.post(
  '/events',
  async (c, next) => {
    const mediaType = c.req.header('content-type')?.split(';', 1)[0].trim().toLowerCase()

    if (mediaType !== 'application/json') {
      // Сохранить принятый проектом status и error envelope.
      return c.json({ error: 'Unsupported media type' }, 415)
    }

    await next()
  },
  validator('json', (value, c) => {
    const result = eventSchema.safeParse(value)

    if (!result.success) {
      return c.json({ error: 'Invalid request body' }, 400)
    }

    return result.data
  }),
  (c) => c.json({ accepted: true }),
)
```

Отрицательные tests должны проверить raw JSON без header, неправильный `Content-Type`, `application/json` с параметром, malformed JSON и отсутствие handler side effects. Предположение: контракт требует именно `application/json`; если допустим `application/*+json`, guard нужно расширить. `app.request()` не доказывает production adapter.

### Evaluator finding

`FAIL`: ответ правильно описывает Hono semantics, но без owner authority сам выбирает `415`, `400` и два JSON envelopes; также вводит schema API, не заданный сценарием.

## Root-cause disposition

Оба failures имеют один механизм: prose qualification не удерживала illustrative code от conventional defaults. Исправлен общий root/example contract, а не отдельные expected strings. Final reruns сохранены в `raw-forward-final-20260713.md`.
