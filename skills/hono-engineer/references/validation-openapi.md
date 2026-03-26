# Validation & API Contracts

## Zod-first validation
- Use Zod schemas for query/params/body validation.
- Keep schemas close to routes or in a shared contracts module.
- Surface validation errors via Problem Details (`errors[]` only).

## How to validate in Hono (request data)
- Hono’s built-in `validator()` supports `json`, `query`, `param`, `header`, `cookie`, and `form`.
- Use `@hono/zod-validator` for a shorter Zod-first middleware.
- Read validated values via `c.req.valid('<part>')`.
- You can chain multiple validators on the same route (param + query + body).
- For `json`/`form`, ensure `Content-Type` is correct or parsing will fail.
- For `header`, use lowercase header names.

Example (minimal):
```ts
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

app.post(
  '/users/:id',
  zValidator('param', z.object({ id: z.string().uuid() })),
  zValidator('json', z.object({ email: z.string().email() })),
  (c) => {
    const { id } = c.req.valid('param')
    const { email } = c.req.valid('json')
    return c.json({ id, email }, 201)
  }
)
```

Minimal example (built-in validator):
```ts
import { validator } from 'hono/validator'

app.post(
  '/posts',
  validator('json', (value, c) => {
    if (!value || typeof value !== 'object' || !('title' in value)) {
      return c.text('Invalid', 400)
    }
    return { title: String((value as { title: unknown }).title) }
  }),
  (c) => c.json({ title: c.req.valid('json').title })
)
```

## OpenAPI generation
- Use Zod + OpenAPI helpers to derive an OpenAPI spec from schemas.
- Provide an API docs UI endpoint (Swagger UI or similar) when appropriate; the path is your choice.
- Treat OpenAPI as the single source of truth for external integrations.

## OpenAPIHono (contract-first)
- Use `OpenAPIHono` from `@hono/zod-openapi` to register routes and emit OpenAPI.
- Expose the OpenAPI JSON with `app.doc('/openapi.json', ...)` (path is your choice).

## Swagger UI (or Scalar)
- Swagger UI mounts at any path you choose (`/docs`, `/ui`, or `/`), as long as it points to the OpenAPI JSON endpoint.
- Keep UI path separate from API routes to avoid collisions.

Example (minimal):
```ts
import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'

const app = new OpenAPIHono()
app.doc('/openapi.json', { openapi: '3.0.0', info: { title: 'API', version: '1.0.0' } })
app.get('/docs', swaggerUI({ url: '/openapi.json' }))
```

## Edge schema validation (optional)
- If your platform supports it, validate requests at the edge against the OpenAPI schema (log first, then block).

## Output validation (required)
- Validate all responses against schemas.
- Use one of these patterns:
  - **Response helper** (preferred): a shared `respondJson(schema, data, status?)` that validates and returns `c.json(...)`.
  - **Contract tests**: validate responses in integration/e2e tests using the same schema.
  - If you need runtime guarantees in production, use the response helper; if you only need to keep contracts stable, enforce validation in tests.

## Output validation via middleware (per-route)
- When the API guarantees JSON-only responses, you can attach a per-route output validator middleware.
- Pass the response schema in `.get/.post/etc` to opt in; if no schema is provided, the middleware is a no-op.
- Skip attaching the middleware for streaming endpoints or non-JSON responses.

Example (per-route middleware):
```ts
import { z } from 'zod'
import { outputValidator } from './middleware/outputValidator'

const healthResponse = z.object({ ok: z.boolean() })

app.get('/v1/health', outputValidator(healthResponse), (c) => c.json({ ok: true }))
```

Example (response helper):
```ts
import type { z } from 'zod'

export const respondJson = <T extends z.ZodTypeAny>(
  c: Context,
  schema: T,
  data: z.infer<T>,
  status = 200,
) => {
  const parsed = schema.parse(data)
  return c.json(parsed, status)
}
```

Note: `@hono/zod-validator` is for request validation only; use the response helper (or contract tests) for output validation.
