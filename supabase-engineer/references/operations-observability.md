# Observability & Debugging

## Metrics + tracing
- Emit counters and latency histograms for Supabase calls.
- Propagate trace IDs across API and Edge Functions.

## Structured logging
- Log request ID, user ID (if safe), table name, and latency.
- Redact secrets and PII.

## Health check
- Expose a `/health` endpoint that verifies Supabase connectivity.

## Debug bundle (support escalation)
Collect a redacted bundle with:
- SDK version and runtime info
- Recent logs (redacted)
- Config summary (secrets masked)
- Connectivity check to Supabase API

## Incident triage cues
- 401/403: verify API keys and auth flow.
- 429: enable backoff/queueing.
- 5xx: enable graceful degradation and check status page.
