# Performance & Security Notes

## Request limits
- Apply body-size and timeout limits from the accepted route/runtime contract.
- For upstream calls, use the project's accepted timeout/cancellation behavior.
- Bun runtime fact: `maxRequestBodySize` is separate from Hono `bodyLimit`; if the accepted route contract depends on both, configure and test both from owner-supplied limits.
- When an accepted auth-admission contract requires a bounded body, enforce its owner-supplied limit before untrusted `json()`, form, multipart, or raw-body parsing.
- Keep route-specific body-limit increases local to the route group that needs them; do not widen a protected admission boundary as a side effect of accepting a larger body.

## Upstream resilience
- Preserve the accepted retry, backoff, circuit-breaker, and concurrency policy; Hono does not require these mechanisms.
- Never add retries without checking idempotency and replay behavior.

## Compression
- Enable response compression only when measurements and the runtime contract justify it.
- Current Hono guidance says its compress middleware is unnecessary on Cloudflare Workers and Deno Deploy because those platforms handle compression; verify current adapter behavior before changing middleware.

## Hono presets
- Change the project's router/preset only from a measured bundle, startup, or route-pattern requirement; this reference does not select one.

## Rate limiting
- Integrate the project-owned pre-auth/post-auth quota model when one exists.
- Preserve the accepted rejection status/body/header contract; do not infer `429`, Problem Details, or `requestId` fields.

## Caching
- Apply cache/ETag/compression only where the accepted freshness, privacy, and middleware-order contract permits them.

## Upstream calls
- Reuse a project-owned fetch boundary when it exists. Do not introduce a wrapper or propagate correlation headers without the accepted architecture/trust policy.

## Security integration
- Configure `secureHeaders()` and CORS from the accepted browser/API security contract; Hono exposes configurable middleware and does not make either policy universal.
- Keep authentication and authorization distinct, and preserve the accepted client-visible auth error boundary.
- Route new header, origin, credential, and exploitability decisions to the security owner.
