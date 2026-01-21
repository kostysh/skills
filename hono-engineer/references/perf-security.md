# Performance & Security Notes

## Request limits
- Enforce body size and request timeout via config/env.
- For upstream calls, implement per-request timeouts (AbortController).
- Bun runtime note: Bun has its own `maxRequestBodySize`; set it if you rely on bodyLimit.

Minimal example (Bun):
```ts
Bun.serve({
  fetch: app.fetch,
  maxRequestBodySize: 1024 * 1024 * 10,
})
```

## Upstream resilience
- Retry only idempotent requests; use backoff + jitter.
- Add circuit-breaker behavior for flaky dependencies.
- Limit concurrency per request to avoid fan-out overload.

## Compression
- Enable response compression for JSON or large payloads when it helps.
- On Cloudflare Workers and Deno Deploy, the compress middleware is redundant and adds overhead; prefer platform compression.

## Hono presets
- If bundle size is critical, consider minimal presets; otherwise use standard Hono and measure.

## Rate limiting
- Use coarse pre-auth limit (IP/ASN) and precise post-auth limit (principal/client).
- Return 429 with Problem Details, include `requestId`.

## Caching
- Cache only for non-personalized GETs.
- Prefer ETag + conditional requests for stable reads.
- Apply cache/ETag/compress at route-group level, not globally.

## Upstream calls
- Centralize fetch logic in one wrapper (timeouts, retries for idempotent requests, metrics).
- Propagate `requestId` to upstream headers.

## Security defaults
- `secureHeaders` always on.
- CORS allow-list only; no wildcard in prod unless explicitly approved.
- If adding auth, separate authentication and authorization.
- Do not expose detailed auth failure reasons to clients.
