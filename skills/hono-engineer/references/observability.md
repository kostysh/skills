# Observability

## Logging
- Emit structured JSON logs with a stable schema.
- Include `requestId`, `route`, `status`, `durationMs`, and key dimensions (tenant/client when safe).
- Redact sensitive data before logging.

## Metrics & tracing
- Track latency (total + upstream), error rates, cache hit/miss, and rate-limit events.
- Use platform-native metrics where possible; export to external systems via background tasks.

## Correlation
- Propagate `requestId` to upstream calls, include it in error responses, and return it in response headers.

## Client telemetry ingestion
- Ingest client telemetry through a project-owned API route that uses the same requestId, auth/session, redaction, rate-limit, and retention controls as the rest of the observability boundary.
- Do not add third-party RUM/session replay as the default path for client errors. If a product explicitly chooses it, document the data contract, consent/privacy implications, sampling, and redaction before shipping.
- Reject or redact raw stack/source maps, component props, request bodies, response bodies, headers, query strings, cookies, OTPs, CSRF tokens, bearer tokens, and raw identity payloads.

## Live debugging
- Use platform log tailing tools when available for real-time debugging.
