# Architecture & Boundaries

## Route composition
- Preserve the existing compatible composition. For greenfield or deliberate refactoring, prefer module composition with `app.route()` and keep routes grouped by area/version.
- Avoid controller-style classes when they weaken type inference; use factories/helpers to keep Hono types intact.
- Keep route order explicit to avoid accidental 404s or shadowed routes.
- When Hono RPC or `testClient()` consumes route types, keep route definitions chained and export the type of the chained result. Registering routes through separate statements can lose the specific schema type even when runtime routing still works.

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
Use the built-in `requestId` middleware when its current behavior matches the project contract; configure how externally supplied request IDs are accepted or generated at the trust boundary.
```ts
import { createFactory } from 'hono/factory'
import { logger } from 'hono/logger'

const factory = createFactory()

const requestContext = factory.createMiddleware(async (c, next) => {
  c.set('requestId', crypto.randomUUID())
  await next()
})

const handlers = factory.createHandlers(logger(), requestContext, (c) => {
  return c.json({ requestId: c.var.requestId })
})

app.get('/api', ...handlers)
```

## Growth path
- Start with a lean structure; split into `services`, `domain`, `infra`, and `observability` as complexity grows.
