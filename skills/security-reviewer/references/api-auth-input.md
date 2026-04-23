# API, Auth, and Input Checks

Use this file for app code, handlers, API routes, forms, and server-side validation flows.

## Input and Injection

Check:

- user input reaching SQL, shell, template, HTML, headers, file paths, or dynamic code
- schema validation that parses but does not constrain dangerous fields
- raw object spreading or unchecked patch updates into privileged models
- file upload paths, MIME trust, storage keys, and content-type assumptions

High-signal classes:

- SQL, command, path, header, and template injection
- stored or reflected XSS
- mass assignment or unsafe object merge
- unsafe deserialization

Detection hints:

- trace request, form, query, cookie, header, and persisted user content into SQL, shell, template, HTML, redirect, file path, or dynamic code sinks
- search for unchecked object spread, patch merges, or schema validators that parse but still allow dangerous fields through
- look for file upload handlers that trust MIME type, filename, storage key, or inline serving defaults

What to verify before reporting:

- whether the ORM, query builder, template engine, or framework already neutralizes the sink
- whether the attacker can really reach the privileged fields or dangerous path from the exposed entry point

## Authentication

Check:

- token or session presence vs actual identity verification
- fallback paths that silently treat failures as guest or authenticated
- refresh or recovery flows that widen account takeover surface
- trust in unsigned cookies, client claims, or unverified headers

Detection hints:

- search for optional auth branches, silent catch-and-continue flows, and header-based identity shortcuts
- inspect password reset, magic link, recovery, invite, and token refresh paths for weak validation or widened trust

What to verify before reporting:

- whether the suspect path is actually reachable by an external attacker or only by a trusted operator
- whether the claimed identity source is independently verified earlier in middleware or routing

## Authorization

Check:

- object-level access control, not just route-level authentication
- cross-tenant access paths
- admin or support paths with weak guards
- server-side filtering that is not backed by a real permission boundary

Detection hints:

- search for resource identifiers taken directly from requests and used without ownership checks
- look for admin-only code paths guarded only in UI code or only by route naming conventions

What to verify before reporting:

- whether downstream policy, RLS, or service-layer checks already enforce the boundary
- whether the same privilege is required to exploit the path, making it non-escalating

## State-Changing Requests

Check:

- CSRF defenses for cookie-authenticated flows
- replay handling for idempotent-looking endpoints
- rate limits or abuse controls on expensive or privileged actions

Detection hints:

- enumerate non-GET routes and actions with side effects
- inspect whether auth is ambient via cookies or explicit via headers
- look for queue fan-out, retries, or repeated callback delivery with no dedupe or idempotency key

What to verify before reporting:

- whether the route is browser-reachable or only for trusted machine clients
- whether upstream rate limiting, CSRF protection, or replay protection exists outside the reviewed file

## Auth-Admission Early Checklist

Use this checklist early when a slice changes protected route admission, replay/idempotency controls, pre-auth resource consumption, or closely related authorization-boundary handling.

Check:

- route trust boundary: public, user, admin, webhook, service, or operator route class; which middleware admits the request before the handler
- pre-auth versus post-auth resource consumption: body reads, JSON/form parsing, signature verification, expensive lookups, and queue fan-out
- quota isolation: invalid or unknown credentials, tenants, clients, or tokens must not drain the same quota used by a valid principal or operator
- replay/idempotency expectations: whether duplicate, retried, or reordered requests are rejected, deduped, or safely accepted
- bounded body handling: high-risk routes must bound request bodies before untrusted JSON, form, multipart, or raw body reads

Keep the checklist narrow. If exploitability depends on Hono-specific body limits, middleware order, or admission-boundary preservation, resolve that fact through `HONO engineer` rather than duplicating framework guidance here.

## Safe-by-Default Patterns

Usually safe unless protections are bypassed:

- framework auto-escaping in templates
- parameterized ORM usage
- validated enums or allowlists driving control flow

Flag only when you can show the protection is absent, disabled, or escaped around.
