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

## Live debugging
- Use platform log tailing tools when available for real-time debugging.
