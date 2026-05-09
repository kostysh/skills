---
name: hono-engineer
description: Build and maintain production-grade Hono API services across
  projects. Use when designing endpoints, middleware, config, logging,
  validation, security, and tests for Hono-based APIs.
metadata:
  source-version: 0.1.0
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 380ec6a407bc08376a383ba695d0118ad21e1de57a61c1899afaf82bd81fde34
---

# hono-engineer

## Start here

1. Confirm the work is on a Hono-based API or a route/middleware surface that directly affects Hono.
2. Follow the project conventions already present before applying the baseline guidance.
3. Preserve the existing Hono app factory, middleware order, error handling, validation, logging, and request-id contracts.
4. For endpoint work, use the preserved endpoint workflow in the overview and load only the relevant references.

## When to use this skill

- Designing or changing Hono endpoints, routers, middleware, or app composition.
- Working on Hono config, validation, OpenAPI contracts, logging, security, caching, or tests.
- Adapting Hono services to Cloudflare Workers or another edge runtime.

## When NOT to use this skill

- The task has no Hono API, route, middleware, or edge-runtime API surface.
- The task is purely TypeScript language work, testing strategy, Supabase design, or security review without Hono-specific behavior.

## Scope
Applies to any Hono-based API project. If the current project already has established conventions, follow them and avoid conflicts.

## Non-negotiables (baseline)
- Keep a single app factory (commonly `src/index.ts`) and mount routes via `app.route()`.
- Preserve a stable global middleware order: `requestId` → `accessLog` → `runtimeConfig` → `secureHeaders` → `cors` → `requestLimits` (adapt names to your project).
- Keep global request body limits conservative; use route-specific overrides for known large-payload endpoints.
- Centralize error handling in `app.onError()` (not a regular middleware). Use a try/catch wrapper only when needed for structured error logging.
- Validate env/config with a schema (Zod recommended) and expose parsed config via context (avoid raw env access in handlers).
- On Cloudflare Workers, generate binding types with `wrangler types`; do not hand-write `Env` interfaces.
- Validate all request inputs and outputs against schemas. For output validation, use a response helper, per-route output middleware, or contract tests (see `references/validation-openapi.md`).
- For rich HTML inputs, sanitize server-side before persistence using an explicit allowlist policy (default: `sanitize-html` when runtime-compatible).
- Errors use Problem Details. Never leak secrets or raw input in error bodies.
- Logs are structured JSON and must be redacted. Never log tokens, cookies, or bodies.
- Include a `requestId` in responses, error payloads, logs, and upstream calls.
- Every Promise must be awaited, returned, intentionally `void`ed, or passed to `ctx.waitUntil()`; never leave floating async work in request paths.
- For tokens, secrets, and webhook signatures, use Web Crypto randomness and timing-safe comparison. Never use `Math.random()` or plain string equality for sensitive comparisons.
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
2. For auth-admission work, run a short route-admission checkpoint before implementation: bound body reads before parsing, keep pre-auth and post-auth quota isolation distinct, state replay behavior, and preserve the touched route's admission boundary or owner-gate semantics.
3. Add route module under `src/routes/` and mount with `app.route()`.
4. Keep routes thin: parse/validate inputs, call domain/service logic, return response.
5. Convert validation and controlled errors to Problem Details. Do not expose secrets.
6. Add tests at the right level (unit/integration/e2e).

## Platform constraints
If using Cloudflare Workers or another edge runtime, review `references/workers-platform.md` and `references/wrangler.md` and adjust for platform limits, binding typing, caching semantics, and async work handling. For Workers-specific APIs or config fields that may have changed, prefer current docs or the local Wrangler schema over memory.

## Payload and content guardrails

- Keep a strict global payload limit to reduce abuse surface.
- Add endpoint-level limit increases only where required by explicit contracts (for example document upload endpoints).
- Sanitize untrusted HTML on write-path as a minimum; optionally re-sanitize on read-path as defense in depth.
- Verify sanitizer compatibility with the target runtime (Node vs Workers) before rollout.

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
- Keep contour-aware execution:
  - local: deterministic profile;
  - PR CI: full required suite with check-only lint/format commands;
  - nightly: repeated stability checks for flaky integration/e2e paths.
- Prefer CI check-only lint commands; keep auto-fix lint commands for local development only.
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
- `references/wrangler.md` – runtime config, compatibility flags, bindings, generated `Env`, observability (Workers).
- `references/supabase.md` – Supabase usage patterns and RLS safety.
- `references/workers-platform.md` – CPU/subrequest limits, floating promises, binding safety, fetch scope, `waitUntil`, service bindings.
- `references/contracts-types.md` – exporting request/response types to consumers.

## Workflow stages

### Workflow stage: Apply Hono guidance

Keep Hono API changes aligned with the preserved app, middleware, validation, logging, security, and testing rules.

1. Identify the endpoint class, runtime, and existing project conventions.
2. Use the preserved endpoint workflow and auth-admission checkpoint before implementation.
3. Load only the references relevant to the touched Hono surface.
4. Verify the affected unit, integration, or runtime-specific tests.

Validation:

- The route or middleware behavior remains consistent with the existing Hono app composition.
- Validation, Problem Details errors, redacted logs, and requestId propagation remain intact.

## Interop priority

- **TypeScript testing patterns:** typescript-test-engineer. This skill owns Hono API guidance, while testing depth and runner patterns belong to the TypeScript testing skill.

## Required active references
- [Architecture](references/architecture.md) — Read this when you need module boundaries, layering, and dependency rules.
- [Auth](references/auth.md) — Read this when you need API keys, JWT/JWKS, mTLS, CSRF, authz policies.
- [Caching](references/caching.md) — Read this when you need HTTP caching, Cache API, edge caching.
- [Contracts Types](references/contracts-types.md) — Read this when you need exporting request/response types to consumers.
- [Errors Logs](references/errors-logs.md) — Read this when you need error + logging standards.
- [Observability](references/observability.md) — Read this when you need logs, metrics, tracing, requestId propagation.
- [Perf Security](references/perf-security.md) — Read this when you need timeouts, retries, circuit breaker, compression, security defaults.
- [Pipelines](references/pipelines.md) — Read this when you need middleware order per endpoint class.
- [Rate Limiting](references/rate-limiting.md) — Read this when you need pre/post-auth limits, key choice, edge/WAF limits.
- [Routers](references/routers.md) — Read this when you need router types and when to override defaults.
- [Security](references/security.md) — Read this when you need edge WAF, API Shield, endpoint discovery.
- [Supabase](references/supabase.md) — Read this when you need Supabase usage patterns and RLS safety.
- [Typing](references/typing.md) — Read this when you need Context variables typing (generics vs module augmentation).
- [Validation Openapi](references/validation-openapi.md) — Read this when you need Zod validation, OpenAPI, docs, schema validation.
- [Workers Platform](references/workers-platform.md) — Read this when you need CPU/subrequest limits, floating promises, binding safety, fetch scope, `waitUntil`, service bindings.
- [Wrangler](references/wrangler.md) — Read this when you need runtime config, compatibility flags, bindings, generated `Env`, observability (Workers).

## Portability rules

- Do not reference machine-specific absolute paths or local files outside this skill folder.
- Keep all mandatory hono-engineer guidance inside this skill folder.
- Use relative links for local references, assets, scripts, tests, and supporting docs.

## Portability checklist before finishing

- Run the skill-source-compiler check command after regeneration.
- Search the skill folder for absolute local paths before finishing.
- Confirm every required reference listed by SKILL.md exists inside this skill folder.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
