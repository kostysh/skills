# Middleware Pipelines (endpoint classes)

Use the global middleware chain from your app factory for all routes. Add route-group middleware only when required.

## Global baseline order (recommended)
1. requestId
2. access log / metrics
3. secure headers
4. CORS
5. error handling (app.onError)
6. request limits (body size + timeout)
7. routes
8. notFound / onError (fallback)

Notes:
- Keep CORS before routes so preflight requests don’t hit business logic.
- Prefer the built‑in `requestId` middleware unless you need custom behavior.
- Timeout middleware is not compatible with streaming responses; avoid it on streaming endpoints.

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
- Prefer quick ACK and move heavy work to `ctx.waitUntil()` or a queue.
Notes:
- Verify signatures on the raw body before JSON parsing if the provider requires it.
