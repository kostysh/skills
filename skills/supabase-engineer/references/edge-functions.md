# Edge Functions

Verify current Edge Runtime, CLI, key, and auth guidance before implementation. Keep imports versioned according to repository dependency policy.

## Trust boundary first

Choose the caller contract before creating clients:

- public endpoint: explicitly anonymous and protected by validation, abuse controls, and least-privilege data access;
- user endpoint: validate the user JWT and use a user-scoped client that preserves RLS;
- internal endpoint: authenticate a controlled backend secret and use elevated access only for the documented operation;
- external webhook: disable platform JWT verification only when required by the producer contract, then verify that producer's signature before parsing or trusting the payload.

Publishable and secret keys are opaque API keys, not user JWTs. Send them through the supported `apikey` path. If current platform JWT verification does not support the chosen key model, configure the function accordingly and perform explicit authorization in code or use the current official server adapter.

## Runtime rules

- Use the current official handler/adapter pattern supported by the installed runtime; `Deno.serve()` remains valid for direct handlers.
- Use `npm:` for npm packages and `node:` for built-ins when the runtime and repository support them.
- Use `EdgeRuntime.waitUntil(promise)` only for work whose loss/retry semantics are acceptable; it is not durable queue evidence.
- Write ephemeral local files only under `/tmp`; use Storage or another durable system for persistence.
- Validate input size and shape, handle returned `{ data, error }`, and emit non-sensitive structured errors.

## Verification

- Run the local function with representative public/user/internal requests and negative auth cases.
- Verify the Data API/RLS path with the same identity boundary used in production.
- For deployed claims, check the deployed function, logs, and caller-visible terminal state; a local mock does not prove deployment, secrets, routing, or platform auth.
