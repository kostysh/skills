# Reliability, Rate Limits, Performance

## Retry decision

Retry only when all are true:

- the failure is transient, such as an observed 429 or selected 5xx/network condition;
- the operation is read-only or has a verified idempotency contract;
- the retry budget, total deadline, cancellation behavior, and telemetry are bounded;
- `Retry-After` is honored when present.

`supabase-js` commonly returns `{ data, error }` instead of throwing. Normalize returned errors before a retry helper, and do not retry validation, authorization, RLS, constraint, or permanent configuration failures.

## Idempotent writes

- Define the deduplication key, scope, persistence, conflict result, and retention.
- Enforce idempotency at the durable transaction boundary, not only in process memory.
- Test duplicate, concurrent, timeout-after-commit, and replay behavior.

## Queues and circuit breakers

Add a queue, dead-letter path, circuit breaker, or bulkhead only for a measured failure mode and named recovery owner. Their existence does not prove delivery, ordering, replay safety, or graceful degradation.

## Performance

- Measure before adding caches, batching, pooling, or new infrastructure.
- Select required columns and index actual filter, join, ordering, and RLS predicates.
- Treat cache authorization, invalidation, tenant isolation, and staleness as correctness constraints.
- Use the project's supported pooler/connection mode and verify prepared-statement compatibility before changing connection behavior.

## Evidence

Record workload, environment, concurrency, measurement window, errors, latency distribution, and before/after result. A single happy-path request or architecture diagram is not reliability or scale evidence.
