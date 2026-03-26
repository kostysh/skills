# Caching

## HTTP caching (client-facing)
- Use `ETag` and conditional requests for stable GETs.
- Set `Cache-Control` explicitly for cacheable responses.

## Runtime/edge caching
- Use the platform’s cache API for dynamic responses where safe.
- Some platforms avoid caching responses with `Set-Cookie`; verify platform behavior before caching them.
- For edge caches, prefer explicit TTLs and cache keys; never cache personalized data without a user/tenant key.
- Platform cache APIs may differ from browser caches; verify semantics and limits for your runtime.
- CDN default cache behavior often skips dynamic responses; set explicit cache rules when needed.
- Cloudflare-specific: use `fetch` cache options (`cacheEverything`, `cacheTtl`, `cacheTtlByStatus`) or Cache Rules when appropriate.
- If you must cache responses that set cookies, strip or rewrite `Set-Cookie` before caching (platform-specific).
- Cache API locality is platform-specific; verify if it is region‑local or globally replicated.

## What to cache
- Public, non-personalized GETs: cache aggressively.
- Personalized GETs: cache only with strict keys and short TTLs.
- Mutations (POST/PUT/PATCH): generally no caching.
