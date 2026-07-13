# Observability

## Logging
- Preserve the accepted logging schema and transport. Add `requestId`, route/status/timing, or tenant/client dimensions only when the project observability contract defines and safely redacts them.

## Metrics & tracing
- Emit only the metrics/traces selected by the project observability owner; common candidates include latency, error, cache, and rate-limit signals.
- Use the accepted exporter. On Workers, `waitUntil()` is bounded best-effort lifecycle extension, not a guarantee that telemetry is delivered.

## Correlation
- Preserve the accepted correlation boundary. Do not expose or trust an externally supplied request ID without the project-defined validation/generation policy.

## Client telemetry ingestion
- If client telemetry ingestion is in scope, integrate it through a project-owned API route and the accepted auth/session, redaction, rate-limit, and retention controls.
- Do not add third-party RUM/session replay as the default path for client errors. If a product explicitly chooses it, document the data contract, consent/privacy implications, sampling, and redaction before shipping.
- Apply the project-approved redaction policy. Raw stacks/source maps, props, bodies, headers, query strings, cookies, OTPs, CSRF tokens, bearer tokens, and identity payloads are sensitive candidates to classify with the security/privacy owner, not fields this reference authorizes collecting.

## Live debugging
- Use platform log tailing only when the task requires live evidence and the project access/redaction policy permits it.
