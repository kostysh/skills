---
name: HONO engineer
description: Build and maintain production-grade Hono API services across projects. Use when designing endpoints, middleware, config, logging, validation, security, and tests for Hono-based APIs.
metadata:
  short-description: Production Hono API engineering
---

# HONO engineer

## Scope
Applies to any Hono-based API project. If the current project already has established conventions, follow them and avoid conflicts.

## Non-negotiables (baseline)
- Keep a single app factory (commonly `src/index.ts`) and mount routes via `app.route()`.
- Preserve a stable global middleware order: `requestId` → `accessLog` → `runtimeConfig` → `secureHeaders` → `cors` → `requestLimits` (adapt names to your project).
- Centralize error handling in `app.onError()` (not a regular middleware). Use a try/catch wrapper only when needed for structured error logging.
- Validate env/config with a schema (Zod recommended) and expose parsed config via context (avoid raw env access in handlers).
- Validate all request inputs and outputs against schemas. For output validation, use a response helper, per-route output middleware, or contract tests (see `references/validation-openapi.md`).
- Errors use Problem Details. Never leak secrets or raw input in error bodies.
- Logs are structured JSON and must be redacted. Never log tokens, cookies, or bodies.
- Include a `requestId` in responses, error payloads, logs, and upstream calls.
- For TypeScript tests, avoid ts-node; prefer `node:test` with a lightweight TS strip/transform.

## Project structure (recommended)
Design to work both for a greenfield project and for incremental adoption in an existing codebase.
- `src/index.ts` – app factory, middleware, route composition, `notFound`/`onError`.
- `src/routes/*` – HTTP routing (thin layer).
- `src/middleware/*` – cross-cutting concerns only.
- `src/config/*` – env/schema parsing and config helpers.
- `src/http/*` – Problem Details mapping/shape.
- `src/redaction/*` – log/response redaction.
- `src/types.ts` – Hono `Bindings`/`Variables` typing.
- `src/services/*` – application services (use-cases); routes call services, not infra directly.
- `src/domain/*` – pure domain logic (policies, errors, invariants), no Hono/Workers imports.
- `src/infra/*` – external integrations (fetch wrapper, DB clients, third-party APIs).
- `src/observability/*` – structured logger, metrics, audit events.
- `src/security/*` – auth/authorization policies, rate-limit helpers.
- `src/middleware/auth/*` – auth middlewares (jwt, api-key, mTLS metadata checks).
- `src/middleware/validate.ts` – request validation wrapper (zod).
- `src/middleware/cache/*` – etag/cache/edge caching helpers.
- `src/config/openapi.ts` – OpenAPI assembly (if/when contracts are added).
- `src/contracts/*` or `packages/contracts/*` – shared Zod schemas + DTOs (single source of truth).
- `docs/standards/*` – error and logging standards for long-term consistency.

## Workflow for adding endpoints
1. Decide endpoint class (public, user, admin, webhook) and choose the middleware chain (see `references/pipelines.md` when needed).
2. Add route module under `src/routes/` and mount with `app.route()`.
3. Keep routes thin: parse/validate inputs, call domain/service logic, return response.
4. Convert validation and controlled errors to Problem Details. Do not expose secrets.
5. Add tests at the right level (unit/integration/e2e).

## Platform constraints
If using Cloudflare Workers or another edge runtime, review `references/workers-platform.md` and adjust for platform limits, caching semantics, and async work handling.

## Environment and secrets
- Add new env keys to your config schema and map them into a runtime config object.
- Non-secrets live in config files; secrets are stored in the platform’s secret manager.
- If using Cloudflare Workers, keep non-secrets in Wrangler `vars`, secrets via `wrangler secret put`, and local values in `.dev.vars`.

## Logging and redaction
- Always call `redactValue()` before writing logs or returning error details.
- Prefer event-style logs: `request.completed`, `request.failed`, `auth.failed`, `validation.failed`.
- Never log request/response bodies by default. Log sizes or hashes instead.

## Testing baseline
- Unit: pure helpers (config parsing, redaction).
- Integration: `createApp().request()`.
- E2E: use a runtime-specific harness (Cloudflare Workers: `wrangler unstable_dev`).
For deeper testing guidance, use the `typescript-test-engineer` skill.

## When you need more detail
Read only the relevant reference file:
- `references/architecture.md` – module boundaries, layering, and dependency rules.
- `references/pipelines.md` – middleware order per endpoint class.
- `references/typing.md` – Context variables typing (generics vs module augmentation).
- `references/errors-logs.md` – error + logging standards.
- `references/auth.md` – API keys, JWT/JWKS, mTLS, CSRF, authz policies.
- `references/validation-openapi.md` – Zod validation, OpenAPI, docs, schema validation.
- `references/routers.md` – router types and when to override defaults.
- `references/caching.md` – HTTP caching, Cache API, edge caching.
- `references/perf-security.md` – timeouts, retries, circuit breaker, compression, security defaults.
- `references/security.md` – edge WAF, API Shield, endpoint discovery.
- `references/rate-limiting.md` – pre/post-auth limits, key choice, edge/WAF limits.
- `references/observability.md` – logs, metrics, tracing, requestId propagation.
- `references/wrangler.md` – runtime config, compatibility flags, CPU limits (Workers).
- `references/supabase.md` – Supabase usage patterns and RLS safety.
- `references/workers-platform.md` – CPU/subrequest limits, fetch scope, `waitUntil`, service bindings.
- `references/contracts-types.md` – exporting request/response types to consumers.
