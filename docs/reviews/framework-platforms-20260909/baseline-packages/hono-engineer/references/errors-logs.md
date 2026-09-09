# Errors & Logs

## Preserve the project error contract
- Keep the existing status, media type, body shape, headers, and redaction rules unless the request explicitly changes the wire contract.
- Use Problem Details only when it is the accepted contract. Do not add non-standard required fields such as `requestId` or `code` unless the project owns them.
- Do not expose raw inputs, secrets, stack traces, or unapproved internal details.

## Error mapping
- Reuse the project-owned mapping for validation, auth, conflict, upstream, configuration, and unknown failures.
- Do not map every `HTTPException` 4xx to a validation code; preserve the specific accepted error semantics.
- When no authoritative mapping exists, stop or return bounded guidance instead of inventing public statuses/codes.

## Controlled errors
- Use `HTTPException` only when it fits the existing Hono error boundary; it does not imply Problem Details or any project-specific envelope.
- `HTTPException.getResponse()` does not include headers already set on the Context. If you rely on context headers, merge them explicitly.

When preserving Context headers, copy them into the `HTTPException` response without changing the project-owned unknown-error status, media type, body, or redaction behavior. Use a named project failure mapper when the non-`HTTPException` branch is not already defined.

## Logging
- Preserve the project-owned log format, fields, correlation, sampling, retention, and redaction rules.
- Hono's built-in `logger` is available for development; production logging format is an observability decision, not a Hono default.

## Redaction rules
- Apply the project redaction boundary before logging. Never invent a `redactValue()` helper or claim coverage without inspecting the implementation.
- Do not log tokens, cookies, API keys, or request/response bodies unless an accepted, field-specific policy explicitly permits it.
