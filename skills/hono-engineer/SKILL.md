---
name: hono-engineer
description: Build, change, and diagnose Hono API services. Use for Hono
  routing, middleware composition, Context and runtime APIs, validation,
  contract integration, or test boundaries. Pair with TypeScript, runtime,
  testing, security, data, or architecture skills when those domains determine
  correctness.
metadata:
  source-version: 0.1.7
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 6d32329b0270f4e47bc0cb1399550b45f5e6171be5a3ab1f6c90914b7a4831de
---

# hono-engineer

## Start here

1. Confirm the request requires a Hono-specific decision or change; otherwise route to the owning skill.
2. Establish the authoritative behavior, existing app composition, installed Hono and runtime/tooling versions, endpoint class, security contract, and available test contours before proposing implementation.
3. For a version-sensitive API or platform decision, read Framework Currency and check current official sources; treat the installed project version as a compatibility constraint rather than silently upgrading it.
4. Apply precedence in this order: authoritative requirements, compatible existing project conventions, then verified Hono/runtime facts. This skill supplies no fallback product or project policy. Stop or limit the claim when equal-authority inputs conflict or required runtime evidence is unavailable.
5. Treat optional references as conditional integration guidance: they cannot establish a new architecture, security, data, error, logging, or operational policy without an accepted project contract or the owning skill.
6. When any public/runtime choice is unknown—including success or failure status, headers, media type, body, schema stack, path/layout, middleware, limit, timeout, retry, config format, binding, dependency, data source, or observability setting—use an explicitly named owner-supplied placeholder or stop for authority; an assumption or greenfield label does not grant authority.
7. Make an owner-supplied placeholder cover the whole unresolved boundary. A placeholder for only one argument does not authorize adjacent choices: for example, `c.json(value, projectStatus)` still selects JSON media and a body shape. When the request part or response contract is unknown, stop or delegate the complete route/response to an opaque owner-supplied handler instead of showing an executable partial handler. If the existing Hono composition seam is also unknown, show no handler/router wiring at all: even `app.route(...)` would choose a mount and composition contract.
8. Define the observable HTTP/runtime behavior and the evidence boundary before editing; schema, route, compiler, mock, or docs-test existence is not completion.
9. When the high-risk backend trigger applies, read High-risk Backend Contract, consume the owning specification's `HRB-*` matrix when available, and do not report the Hono boundary complete until every applicable Hono-owned row has an exact contract and executable evidence.

## When to use this skill

- Designing, implementing, diagnosing, or changing Hono endpoints, routers, middleware, Context usage, or app composition.
- Integrating Hono validation, contracts, errors, logging, auth admission, caching, streaming, or runtime adapters.
- Selecting Hono-specific unit, app.request integration, or runtime-boundary verification.

## When NOT to use this skill

- The task has no Hono-specific API, middleware, Context, routing, or adapter behavior.
- The task is solely TypeScript language design, generic testing, platform operations, security review, Supabase/data design, or architecture without a Hono integration decision.
- The requested outcome is a production, security, data, or architecture verdict that requires a specialized owner; use this skill only for the Hono portion.

## Capability and scope

Guide Hono-specific routing, middleware, Context, contract integration, and verification decisions inside an existing or greenfield API. The capability is an observable HTTP or runtime behavior with evidence at the boundary claimed by the task.

This documentation does not ship a Hono runtime, make an endpoint production-ready by itself, or replace security, data, runtime, architecture, and testing authorities. Compiler success, route/schema presence, mocks, `app.request()`, and structural docs tests are substrate or bounded evidence, not universal runtime proof.

## Minimum inputs and readiness

Before implementation, derive or obtain:

- the authoritative request and externally observable behavior, including error and recovery behavior;
- the current app factory or entrypoint, route composition, middleware/error hooks, and project conventions;
- installed `hono`, companion package, adapter, and runtime/tooling versions;
- endpoint class and its auth, CSRF, tenancy, replay, payload, caching, streaming, or webhook contract;
- available unit, Hono integration, runtime integration, and live verification contours.

If an authoritative behavior is missing, equal-authority sources conflict, or a required runtime boundary cannot be exercised, provide bounded guidance or report the work blocked. Do not invent product behavior, security policy, migration authority, or production readiness.

## Latest framework currency

Recommendations track the latest official stable Hono guidance rather than a pinned version. For version-sensitive work, inspect the project's installed versions and read `references/framework-currency.md`. Preserve compatible installed behavior unless the request authorizes an upgrade; report any latest-versus-installed gap explicitly.

## Hono baseline decisions

- Preserve the existing compatible app composition. In greenfield work, do not select structure without authority; use typed factories or `app.route()` only when the accepted composition needs them. Capture chained route return types when Hono RPC or typed test clients consume them.
- Treat middleware order as behavior. Preserve the compatible project-owned global and route-group composition; register `app.onError()` and `notFound()` as hooks, not middleware positions.
- Keep route handlers focused on the accepted HTTP boundary when that fits the project architecture; do not introduce a new service/domain layering scheme during a narrow Hono change.
- Keep request-scoped state in Hono Context or explicit parameters, never module-level mutable state.
- Validate configuration at its accepted boundary and preserve the project's typed Context bindings or variables. On Workers, use current `wrangler types` output only when the project owns generated bindings; do not impose that migration over a different accepted Env boundary.
- Use Problem Details, structured redacted logs, and request correlation when the project contract requires them. Do not invent a new error or logging standard during a narrow route change.
- Await work that affects the response. On Cloudflare Workers, use `c.executionCtx.waitUntil(promise)` only for work allowed to outlive the response; handle rejection observably. `waitUntil()` extends execution but does not provide durable delivery. Use a durable queue or equivalent when the accepted contract requires it.
- Do not use `void` merely to silence a floating Promise. Detached work needs an explicit lifecycle owner, failure handling, and evidence appropriate to its delivery claim.
- For protected SSE, streaming, subscription, or WebSocket-like endpoints, opening admission is insufficient only when the accepted security contract makes later permission changes effective. Implement that contract's revalidation/invalidation, observable deny/close behavior, and abort-safe cleanup.
- For secrets and signatures, implement only the accepted cryptographic contract with runtime-compatible verified primitives. `Math.random()` and plain string equality do not establish security for attacker-controlled secret material.

## Endpoint workflow

1. Classify the endpoint using the project-owned admission model; public, pending/onboarding, user, admin, service/operator, webhook, and long-lived protected connection are examples, not roles this skill creates.
2. Preserve the route's current admission boundary and owner/tenant semantics. When the accepted auth contract defines a body bound, apply that owner-supplied limit before parsing; preserve accepted quota isolation and replay behavior.
3. Select the endpoint middleware pipeline from the authoritative contract; for signed webhooks, verify the exact raw bytes before parsing when the provider requires it.
4. Define request validation, success responses, expected failures, and client-visible contract. Keep forbidden or computed fields outside writable schemas.
5. Choose contract publication deliberately: use OpenAPI when an external or project contract requires it; use Hono RPC/type exports when that is the project boundary; an internal route may document why neither public surface applies.
6. Distinguish runtime response validation from schema-based contract tests. Production validation requires code on the response path; contract tests prove only the branches they exercise.
7. Implement the smallest change that preserves app composition, error hooks, Context typing, logging/redaction, and request correlation.
8. Verify negative and lifecycle behavior at the narrowest real boundary required by the completion claim.

## Auth, CSRF, and client recovery boundaries

- Keep authentication, authorization, and route admission distinct. Route naming or hidden UI is not authorization evidence.
- Hono's built-in `csrf()` allows a request when either its Origin check or Fetch Metadata check passes for the documented unsafe, form-capable request set. It is not a synchronizer-token or double-submit implementation and does not by itself prove token-protected JSON mutation behavior.
- If the accepted cookie-session contract includes CSRF token reissue after losing memory state, preserve that project-owned recovery contract; do not introduce one as a Hono default.
- If the accepted authentication model includes pending/onboarding sessions, preserve their narrower guard and prevent them from passing normal active-account protected routes.

## Verification contours

- Pure unit tests cover helpers and domain logic, not Hono or platform integration.
- `app.request()` or `testClient()` covers the Hono request/response composition actually exercised. Preserve the project's runner rather than imposing `node:test`, Vitest, or another runner.
- Runtime integration covers adapter APIs, bindings, ExecutionContext, streaming, caching, and platform behavior. Preserve the project's Workers harness; introduce or migrate to the current Workers Vitest integration only when the task authorizes that tooling decision.
- Live or staging evidence proves only the observed deployment, configuration, and scenario. Require it when the claim depends on provider delivery, edge configuration, or operational observability.

## Completion report

Report:

- delivered or proposed HTTP/runtime behavior and changed public contracts;
- installed-version compatibility and any latest-guidance delta;
- checks run and the exact boundary each proves;
- blocked, simulated, or unverified behavior;
- residual production, security, data, and operational risks owned elsewhere.

## Workflow stages

### Workflow stage: Establish the Hono decision basis

Make the requested behavior, authority, version compatibility, and proof boundary explicit before changing the API.

1. Inspect the project entrypoint or app factory, route composition, middleware and error hooks, installed versions, runtime config, contracts, and existing test harness.
2. Classify the endpoint and identify which security, data, platform, or architecture decisions belong to another skill.
3. Classify whether the high-risk backend matrix applies; if it does, load it and identify the Hono-owned rows, cross-layer handoffs, and missing authority before changing the route.
4. Select only the references triggered by the touched surface and resolve any installed-versus-latest compatibility gap.

Validation:

- The intended observable behavior and authoritative inputs are known, or the output is explicitly blocked or guidance-only.
- No specialized security, data, runtime, or architecture verdict is invented by Hono guidance.
- Applicable Hono-owned `HRB-*` rows have an exact HTTP/runtime contract, negative oracle, evidence contour, and owner, or the result remains blocked or guidance-only.

### Workflow stage: Implement the Hono boundary

Preserve compatible project composition while making the smallest Hono-specific change that delivers the requested behavior.

1. Choose the route and middleware pipeline from the endpoint contract, preserving raw-body, auth-admission, streaming, and error-hook ordering where applicable.
2. Preserve the accepted handler/dependency boundary, keep request validation distinct from runtime response guarantees, and preserve route type inference when Hono RPC or typed clients consume it.
3. Use runtime lifecycle APIs only with their documented durability and failure semantics.

Validation:

- The implemented route behavior, failure paths, and public contract match the authoritative requirement.
- Framework-specific APIs are compatible with the installed project versions and current official guidance.

### Workflow stage: Verify and report the real boundary

Match evidence and completion claims to the boundary actually exercised.

1. Run the narrowest project checks for pure logic, Hono app integration, and the real runtime boundary required by the claim.
2. Exercise negative admission, validation, error, cancellation, and lifecycle transitions relevant to the change.
3. For a triggered high-risk backend matrix, produce a row-by-row test inventory and preserve unresolved database, product, architecture, or security-verdict decisions as explicit handoffs.
4. Report delivered behavior, interface changes, compatibility constraints, checks, evidence limits, and remaining risks.

Validation:

- app.request, mocks, schemas, OpenAPI, and docs-contract tests are not described as production-runtime proof.
- A blocked or unverified boundary remains explicit instead of being reported production-ready.
- Every applicable Hono-owned matrix row maps to a pure, `app.request()`, runtime, or direct-data-boundary check at the strength required by the claim.

## Interop priority

- **Implementation scope and evidence discipline:** implementation-discipline. hono-engineer owns framework-specific choices; implementation-discipline owns minimal diffs, capability reality, remediation traceability, and completion evidence.
- **TypeScript language and type-system design:** typescript-engineer. hono-engineer owns Hono generics and Context integration; TypeScript language semantics and reusable type design belong to typescript-engineer.
- **TypeScript test runner, mocking, and test architecture:** typescript-test-engineer. hono-engineer selects the Hono and runtime boundary; runner conventions and test implementation depth belong to typescript-test-engineer.
- **Node.js runtime behavior:** node-engineer. Hono adapter integration remains here; Node process, module, stream, and runtime lifecycle behavior belongs to node-engineer.
- **Security verdicts and exploitability:** security-reviewer. hono-engineer integrates auth and security middleware but does not issue a security audit verdict.
- **Supabase schema, RLS, RPC, and data boundaries:** supabase-engineer. hono-engineer owns the HTTP integration; Supabase correctness and direct data-path evidence belong to supabase-engineer.
- **Architecturally significant boundaries and trade-offs:** architecture-engineer. hono-engineer may apply an accepted architecture but does not invent cross-system boundaries or quality trade-offs.

## Gotchas

- **high** — Do not call an endpoint production-ready because a route, schema, OpenAPI entry, generated file, mock, or docs-contract test exists; require evidence at every boundary named by the claim.
- **high** — Contract tests validate only exercised responses. Claim runtime response validation only when production code validates the emitted payload and failure behavior is tested.
- **high** — Do not rely on remembered Hono, adapter, or runtime APIs for version-sensitive work; verify latest official guidance and reconcile it with installed project versions.
- **high** — Do not let predictable validation or service failures escape as raw internal errors. Map only safe, contract-approved details before the response leaves Hono.
- **high** — An illustrative snippet must classify every concrete choice as authoritative input, verified framework fact, or owner-supplied placeholder. The placeholder must encapsulate the entire unknown boundary; wrapping only a status, schema, or dependency while selecting a media type, body, request part, or handler flow remains unauthorized. Even when a composition seam is supplied, show only the source-supplied composition primitives; do not add illustrative route methods, mounts, exports, or handlers merely to demonstrate ordering. The snippet must not decide unknown success/failure wire behavior, schema/tool stack, layout, middleware, limits, timeouts, retry, config, bindings, dependencies, data, security, or observability policy.

## Policies

### Source and compatibility precedence
Authoritative requirements and compatible project conventions precede verified framework facts. No greenfield label supplies missing authority. When inputs conflict or latest guidance is incompatible with installed versions, stop, surface the gap, and do not invent a migration or policy decision.

### Evidence boundary
Match proof to the claim: unit tests cover pure logic, app.request covers Hono integration, a runtime harness covers platform behavior, and live evidence covers only the observed deployment conditions.

### Output contract
Report the delivered or proposed HTTP/runtime behavior, changed interfaces, installed-versus-latest compatibility constraints, checks and their boundaries, blocked or unverified work, and residual risk.

## Optional references
- [High-risk Backend Contract](references/high-risk-backend-contract.md) — Read this for high-risk Hono routes involving a public API, Supabase-backed state, authorization, money, retries, external resources, or required audit evidence.
- [Framework Currency](references/framework-currency.md) — Read this before a version-sensitive Hono, adapter, or runtime decision, or when installed and latest versions may differ.
- [Architecture](references/architecture.md) — Read this when Hono app composition, route type inference, layering, or dependency boundaries are in scope.
- [Auth](references/auth.md) — Read this when Hono middleware integrates API keys, JWT/JWKS, mTLS metadata, cookie sessions, CSRF, pending sessions, authorization, or protected long-lived endpoints.
- [Caching](references/caching.md) — Read this when HTTP or runtime cache behavior is part of the requested Hono route.
- [Contracts Types](references/contracts-types.md) — Read this when Hono RPC, exported request or response types, runtime schemas, or external consumers are in scope.
- [Errors Logs](references/errors-logs.md) — Read this when changing Hono error mapping, Problem Details, request correlation, or structured logging.
- [Observability](references/observability.md) — Read this when logs, metrics, tracing, requestId propagation, or client telemetry ingestion are in scope.
- [Perf Security](references/perf-security.md) — Read this when Hono request limits, timeouts, retries, compression, upstream resilience, or security middleware defaults are in scope.
- [Pipelines](references/pipelines.md) — Read this when selecting or changing middleware order for an endpoint class.
- [Rate Limiting](references/rate-limiting.md) — Read this when Hono integrates pre-auth, post-auth, application, or edge rate limits.
- [Routers](references/routers.md) — Read this only when measured route registration, matching, or bundle constraints justify overriding Hono's default router.
- [Security](references/security.md) — Read this when Hono must integrate with edge WAF, mTLS, API discovery, or schema enforcement; use security-reviewer for a security verdict.
- [Supabase](references/supabase.md) — Read this when a Hono route calls Supabase; use supabase-engineer for RLS, RPC, schema, or data-boundary decisions.
- [Typing](references/typing.md) — Read this when Hono Context Bindings or Variables typing is in scope; use typescript-engineer for language-level type design.
- [Validation Openapi](references/validation-openapi.md) — Read this when request validation, runtime response validation, OpenAPI, Hono RPC, exported schemas, or contract evidence is in scope.
- [Workers Platform](references/workers-platform.md) — Read this when a Hono service runs on Cloudflare Workers or uses ExecutionContext, bindings, streaming, queues, or service bindings.
- [Wrangler](references/wrangler.md) — Read this when Wrangler config, bindings, generated Env types, compatibility flags, secrets, or Workers observability are in scope.

## Portability rules

- Do not reference machine-specific absolute paths or required local files outside this skill folder.
- Keep all mandatory hono-engineer guidance inside this skill folder and use official external docs only as live version authority.
- Use relative links for local references, assets, scripts, tests, and supporting docs.

## Portability checklist before finishing

- Run the skill-source-compiler check command after regeneration.
- Search the skill folder for absolute local paths before finishing.
- Confirm every optional reference listed by SKILL.md exists inside this skill folder and has a precise load trigger.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
- Supporting glob: `docs/logs/*`
