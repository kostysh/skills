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
- telemetry or error reports containing credentials, session material, OTP/recovery values, CSRF secrets, or sensitive personal/business data outside an authorized and protected logging boundary
- stack/source, component props, request/response bodies, headers, query strings, or identity/provider payloads when their actual contents are sensitive, the destination or readers are not authorized for them, retention is unjustified, or attacker-controlled data can create disclosure or log-injection impact

Detection hints:

- search for structured logger calls that serialize full request, env, headers, cookies, config, or exception objects
- inspect debug endpoints, verbose error middleware, and CI logs emitted by release or deploy scripts
- inspect browser error-reporting hooks and telemetry ingestion for serialization of props, network envelopes, headers, cookies, tokens, and identity/provider payloads
- inspect the telemetry destination, access controls, retention, redaction stage, and whether sensitive fields are necessary for the stated operational purpose

## Browser Durable Storage

Always flag browser durable storage of plaintext passwords, OTP/recovery material, cookies, JWTs, session IDs, refresh tokens, or equivalent credentials/session material when JavaScript or the browser profile can recover it.

For CSRF values, identify the chosen pattern before reporting: a readable double-submit value can be part of a valid design, while a synchronizer secret or session credential must not be persisted as a substitute for protected server/session state.

For identity values, provider payloads, request/response data, headers, query strings, or other application state, determine before reporting:

- whether the actual fields are sensitive, secret, personal, or higher-classification data;
- whether XSS, same-origin applications, browser-profile access, extensions, or a local attacker can read or modify them;
- whether the application treats the stored value as authoritative for identity, authorization, tenant/context, or protected workflow state;
- whether scope, TTL, logout/context-switch cleanup, and data minimization match the documented product contract;
- what concrete confidentiality, integrity, or privilege impact follows.

An ordinary non-sensitive display preference or public identifier is not a security finding solely because it is durable. Treat all client-side stored data as untrusted on read.

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
