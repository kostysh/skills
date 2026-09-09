# Observability & Debugging

## Metrics + tracing
- Use the project's accepted counters, latency histograms and tracing to answer the current diagnostic question. Add instrumentation only when the requested task and observability owner establish the fields, scope and destination.
- Preserve the accepted trace-ID propagation across API and Edge Functions; Supabase integration does not define a new HTTP header or telemetry contract.

## Structured logging
- Record only the diagnostic fields allowed by the project's logging/privacy contract, such as a request correlation ID and latency when needed. Do not add user IDs or data contents by default.
- Redact credentials, tokens, cookies and sensitive payloads; collect only the evidence required for the current question.

## Health check
- If the accepted HTTP/operations contract includes a health or readiness endpoint, verify its defined dependency checks and failure behavior. A diagnostic request does not authorize adding a public `/health` route; use an existing scoped check or report the missing observability decision.

## Debug bundle (support escalation)
When support escalation is in scope, collect a redacted bundle with the relevant:
- SDK version and runtime info
- Recent logs (redacted)
- Config summary (secrets masked)
- Connectivity check to Supabase API

## Incident triage cues
- 401/403: distinguish `apikey`, user JWT, Edge Function auth mode, grants, and RLS before rotating credentials.
- 429: inspect the actual limit, workload and `Retry-After`; apply the accepted total retry/deadline/idempotency policy. Queueing requires a measured need and an owning recovery contract; it is not an automatic fix.
- 5xx: inspect service status and the failing boundary, then apply only the accepted degradation/recovery behavior. Keep missing evidence distinct from a healthy result.
