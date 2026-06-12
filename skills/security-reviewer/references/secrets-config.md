# Secrets and Config Review

Use this file for runtime config, CI variables, token scope, and logging exposure.

## Secrets

Flag:

- hardcoded credentials, tokens, private keys, or signing secrets
- secrets stored in source-controlled config
- long-lived broad credentials used where scoped or ephemeral credentials are possible
- secrets exposed to client bundles or untrusted CI contexts

Detection hints:

- search for credential-like literals, `.env` files, test keys copied into runtime config, and config dumps
- inspect client bundles, publishable config, and CI variables for values that are treated as secret but shipped or exposed broadly

## Logging and Error Exposure

Flag:

- tokens, cookies, webhook payloads, or raw auth material in logs
- stack traces or debug payloads returned to untrusted clients when they reveal sensitive internals
- derived secrets that bypass masking in CI logs
- telemetry or error reports containing raw stack/source, component props, request bodies, response bodies, headers, query strings, cookies, OTPs, CSRF tokens, bearer tokens, or raw identity values

Detection hints:

- search for structured logger calls that serialize full request, env, headers, cookies, config, or exception objects
- inspect debug endpoints, verbose error middleware, and CI logs emitted by release or deploy scripts
- inspect browser error-reporting hooks and telemetry ingestion for serialization of props, network envelopes, headers, cookies, tokens, and identity/provider payloads

## Browser Durable Storage

Flag browser durable storage of:

- OTPs, one-time challenges, or recovery codes
- CSRF tokens
- cookies, JWTs, session IDs, refresh tokens, or equivalent bearer/session material
- raw identity values or provider payloads
- raw request bodies, response bodies, headers, query strings, cookie values, or full network envelopes

Accept durable browser storage only when the payload is allowlisted, scoped to user/tenant/context, TTL-bound, non-authoritative, and cleared on logout/context switch.

## Trust Boundary Mistakes

Check:

- server-controlled config is not mistakenly treated as user input
- user input is not allowed to override internal endpoints or secret selectors
- secret comparison uses timing-safe primitives where the runtime supports them

## Dev Versus Prod Nuance

- Do not report missing TLS blindly when the reviewed setup is clearly local, internal, or behind an out-of-scope proxy.
- Do not demand `Secure` cookies unless the application is expected to run over HTTPS in that environment.
- Avoid blanket HSTS recommendations unless the deployment context is known and long-term browser pinning is understood.

## CI and Automation

Check:

- permissions are minimal
- secrets are only available on trusted triggers
- publish and deploy tokens are separated from read-only automation

## Safe Patterns

Usually good signs:

- secrets in platform secret managers
- narrow token scopes
- request-scoped privilege escalation only where documented
- redacted structured logs
- project-owned telemetry ingestion with sentinel-payload tests proving sensitive fields are redacted or rejected

## What to Verify Before Reporting

- whether a credential-looking value is a real secret, a test fixture, or a documented example
- whether masking, redaction, or edge TLS is implemented outside the reviewed code
- whether HTTP-only assumptions are limited to development or also reach production
- whether source-text checks are backed by behavioral tests, sentinel payloads, or negative API tests
