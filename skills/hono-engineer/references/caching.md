# Caching

## HTTP caching (client-facing)
- Preserve the accepted cache policy. Use `ETag`, conditional requests, and explicit `Cache-Control` only when their freshness and privacy semantics match the route contract.

## Runtime/edge caching
- If the accepted cache design selects a platform cache API, integrate it only for the named responses and keys.
- Some platforms avoid caching responses with `Set-Cookie`; verify platform behavior before caching them.
- For edge caches, use explicit TTLs and cache keys from the accepted policy; do not cache personalized data unless the policy proves isolation and invalidation.
- Platform cache APIs may differ from browser caches; verify semantics and limits for your runtime.
- CDN default cache behavior often skips dynamic responses; add explicit rules only when the accepted deployment contract requires them.
- Cloudflare exposes `fetch` cache options and Cache Rules; the platform owner chooses whether either belongs to the accepted deployment contract.
- For Cloudflare Cache API, responses with `Set-Cookie` are not cached. Before `cache.put()`, either delete `Set-Cookie` or set `Cache-Control: private=Set-Cookie`; do not assume rewriting the cookie value makes the response cacheable.
- Cache API locality and consistency are platform-specific; verify them before using cache state for correctness.

## What to cache
- Public, non-personalized GETs are candidates only when the accepted freshness policy permits caching.
- Personalized responses require an explicit isolation and invalidation design from the owning architecture/security contract.
- Do not cache mutations unless a specific protocol defines safe semantics.
