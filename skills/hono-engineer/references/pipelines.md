# Middleware Pipelines (endpoint classes)

Use the global middleware chain from your app factory for all routes. Add route-group middleware only when required.

## Canonical global middleware baseline (greenfield default)
1. requestId
2. access log / metrics
3. parsed runtime config / request context
4. secure headers
5. CORS
6. conservative request limits that truly apply globally
7. routes and route-group middleware

Notes:
- Preserve a compatible project-owned order; this is a greenfield default, not a mandate to reorder a working app.
- Keep CORS before routes so preflight requests don’t hit business logic.
- Prefer the built‑in `requestId` middleware unless you need custom behavior.
- Register `app.onError()` and `app.notFound()` as Hono hooks. They are not positions in the middleware chain.
- Timeout middleware is not compatible with streaming responses; avoid it on streaming endpoints.
- For protected streaming endpoints, keep the route auth/authorize middleware on the opening request and implement lifecycle revalidation or invalidation inside the stream service.

Minimal example (stream timeout):
```ts
import { streamSSE } from 'hono/streaming'

app.get('/sse', (c) =>
  streamSSE(c, async (stream) => {
    const timer = setTimeout(() => stream.close(), 30_000)
    stream.onAbort(() => clearTimeout(timer))
    // write events...
  })
)
```

## E) Protected stream / SSE / WebSocket-like
- Global chain
- Route-group: `rateLimit` (pre-auth) -> `auth` -> `authorize` -> `handler`
- Inside the stream/service loop: heartbeat or periodic revalidation, explicit invalidation handling, abort cleanup, and no floating async work.

Observable lifecycle expectations:
- stale session/context, revoked or disabled account/session/role, wrong role/scope/tenant, missing readiness, or maintenance denial closes/blocks/denies the stream;
- cancellation clears timers, listeners, upstream subscriptions, and pending work;
- tests exercise a permission-change transition, not only the first response.

## A) Public read (cacheable GET)
- Global chain
- Optional route-group: `rateLimit (coarse)` → `etag` / cache lookup → `compress` → handler

## B) User-scoped read/write (JWT or user token)
- Global chain
- Route-group: `bodyLimit` (write) → `timeout` → `rateLimit` (pre-auth) → `auth` → `authorize` → `validate` → `idempotency` (write) → `handler`

## C) Admin/service (API key / service JWT / mTLS)
- Global chain
- Route-group: `ipAllowlist`/`mtls` (if used) → `rateLimit (strict)` → `bodyLimit` → `auth` → `authorize` → `auditLog` → `validate` → `handler`

## D) Webhook
- Global chain (may skip `cors` if not needed)
- Route-group: `bodyLimit` (strict) → `verifySignature` → `replayProtection` → `rateLimit` → handler
- Prefer a provider-compatible quick ACK. On Workers, use `c.executionCtx.waitUntil()` only for best-effort work allowed to outlive the response; use a durable queue when delivery is part of the accepted contract.
Notes:
- Verify signatures on the raw body before JSON parsing if the provider requires it.
