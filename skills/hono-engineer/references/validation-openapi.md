# Validation & API Contracts

## Zod-first validation
- Use Zod schemas for query/params/body validation.
- Keep schemas close to routes or in a shared contracts module.
- Surface validation errors via Problem Details (`errors[]` only).

## New route contract checklist

Every new API route should ship with:
- request schemas for every untrusted request part the route consumes and an explicit response contract;
- exported request/response types, runtime schemas, or Hono RPC types only when a real consumer needs that surface;
- OpenAPI registration when the project or an external/cross-language consumer owns an OpenAPI contract, otherwise an explicit internal contract boundary;
- route security metadata: public, pending/onboarding, user, admin, webhook, service, or operator plus CSRF/auth/rate-limit expectations;
- tests for valid input, invalid input, authorization/admission failure, and response shape.

Do not require Zod, OpenAPI, and Hono RPC simultaneously. Preserve the project's chosen contract mechanism unless the request changes it.

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
- Treat OpenAPI as the wire-contract source of truth only when the project has chosen it for external integrations. Otherwise preserve the authoritative contract mechanism.

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

## Response contract evidence

Choose the guarantee required by the accepted contract:

- **Runtime response validation**: production code validates the actual payload before emission, using a response helper or per-route middleware. Test both success and validation-failure behavior. This can support a runtime-validation claim for the covered path.
- **Contract-test coverage**: integration or runtime tests validate observed responses with the shared schema. This proves only the exercised branches and conditions; it is not runtime validation for unexecuted responses.
- **Static typing only**: TypeScript checks producer code but does not validate runtime values from databases, RPCs, or other untyped boundaries.

Do not say "all responses are validated" from selective tests or schema existence. State which routes/statuses are runtime-validated, test-validated, typed-only, or unverified.

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

Note: `@hono/zod-validator` is for request validation only. A response helper can provide runtime validation; contract tests provide bounded contract evidence, not the same guarantee.
