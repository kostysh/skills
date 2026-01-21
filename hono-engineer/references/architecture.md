# Architecture & Boundaries

## Route composition
- Prefer module composition with `app.route()`; keep routes grouped by area/version.
- Avoid controller-style classes when they weaken type inference; use factories/helpers to keep Hono types intact.
- Keep route order explicit to avoid accidental 404s or shadowed routes.

## Layering (dependency rules)
- `routes` depend on `services` only.
- `services` may depend on `domain` and `infra`.
- `domain` is pure (no Hono, no runtime-specific imports).
- `infra` never depends on `routes`.
- `middlewares` contain no business logic.

## Recommended core utilities
- **Factory helper**: use Hono factory helpers to keep middleware/handlers typed consistently.
- **Fetcher wrapper**: centralize upstream calls (timeouts, retries, metrics, requestId propagation).
- **Policies as code**: authorization rules live in `domain/policy` and are called from middleware/routes.

Minimal example (typed middleware + handlers).
Note: use the built‑in `requestId` middleware unless you need custom behavior.
```ts
import { createFactory } from 'hono/factory'
import { logger } from 'hono/logger'

const factory = createFactory()

const requestId = factory.createMiddleware(async (c, next) => {
  c.set('requestId', crypto.randomUUID())
  await next()
})

const handlers = factory.createHandlers(logger(), requestId, (c) => {
  return c.json({ requestId: c.var.requestId })
})

app.get('/api', ...handlers)
```

## Growth path
- Start with a lean structure; split into `services`, `domain`, `infra`, and `observability` as complexity grows.
