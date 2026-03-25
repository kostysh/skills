# Secrets and Config Review

Use this file for runtime config, CI variables, token scope, and logging exposure.

## Secrets

Flag:

- hardcoded credentials, tokens, private keys, or signing secrets
- secrets stored in source-controlled config
- long-lived broad credentials used where scoped or ephemeral credentials are possible
- secrets exposed to client bundles or untrusted CI contexts

## Logging and Error Exposure

Flag:

- tokens, cookies, webhook payloads, or raw auth material in logs
- stack traces or debug payloads returned to untrusted clients when they reveal sensitive internals
- derived secrets that bypass masking in CI logs

## Trust Boundary Mistakes

Check:

- server-controlled config is not mistakenly treated as user input
- user input is not allowed to override internal endpoints or secret selectors
- secret comparison uses timing-safe primitives where the runtime supports them

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
