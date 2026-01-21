# Errors & Logs

## Problem Details response
- Always return `application/problem+json`.
- Required fields: `type`, `title`, `status`, `detail`, `instance`, `requestId`, `code`.
- `errors[]` only for validation/conflict details.
- Never include raw inputs, secrets, or stack traces.
- Centralize the Problem Details shape and mapping in one module.

## Error mapping (baseline)
- Config/env error → 500 `INVALID_CONFIG` (generic detail).
- Validation error → 400 `VALIDATION_ERROR` with `errors[]` (redacted messages).
- HTTPException 4xx → `VALIDATION_ERROR` (or specific code) with redacted detail.
- Auth errors (401/403) → avoid detailed client messages; keep details in logs.
- Upstream timeout → 504 (or equivalent) with neutral detail.
- Upstream 5xx → 502 (bad gateway) with neutral detail.
- Unknown → 500 `INTERNAL_ERROR`.

## Controlled errors
- Use framework exceptions (e.g., HTTPException) for expected errors so they map cleanly to Problem Details.
- `HTTPException.getResponse()` does not include headers already set on the Context. If you rely on context headers, merge them explicitly.

Minimal example (preserve context headers):
```ts
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    const res = err.getResponse()
    const headers = new Headers(res.headers)
    c.res.headers.forEach((value, key) => headers.set(key, value))
    return new Response(res.body, { status: res.status, headers })
  }
  return c.text('Unexpected error', 500)
})
```

## Logging
- Structured JSON logs only.
- Required fields: `ts`, `level`, `msg`, `requestId`, `method`, `path`, `route`, `status`, `durationMs`.
- Event logs (optional): `auth.failed`, `ratelimit.exceeded`, `validation.failed`, `upstream.failed`, `webhook.rejected`.
- Optional dimensions: `client` (ip/ua/colo), `principal` (type/id/tenant), `auth` (scheme/scopes), `cache` (hit/layer).
- Built‑in `logger` middleware is fine for development; use custom structured logs for production.

## Redaction rules
- Always run payloads through `redactValue()` before logging.
- Never log bodies, tokens, cookies, API keys.
- Prefer sizes, hashes, or ids over raw values.
