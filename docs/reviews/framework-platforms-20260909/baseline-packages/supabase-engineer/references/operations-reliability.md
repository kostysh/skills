# Reliability, Rate Limits, Performance

## Retry decision

Retry only when all are true:

- the failure is transient, such as an observed 429 or selected 5xx/network condition;
- the operation is read-only or has a verified idempotency contract;
- the retry budget, total deadline, cancellation behavior, and telemetry are bounded;
- `Retry-After` is honored when present.

`supabase-js` commonly returns `{ data, error }` instead of throwing. Normalize returned errors before a retry helper, and do not retry validation, authorization, RLS, constraint, or permanent configuration failures.

For genuine PostgreSQL `40001` or `40P01`, automatic transaction retry means rerunning the whole transaction from an outer caller or framework boundary. Do not retry only one SQL statement or function after partial execution. Require a verified idempotency or replay-safety contract, a bounded attempt budget and deadline, and a fresh correct transaction boundary.

Treat explicit same-key recovery or idempotency-conflict handling as application behavior, not as automatic transaction retry. A validation, authorization, RLS, constraint, or domain conflict does not become retryable because a function manually assigned it a class `40` SQLSTATE; apply the classification rules in `db-functions.md` first.

Before recommending a database retry, inspect the effective function definitions and the public/private call chain, including any layer that translates or rethrows SQLSTATE. Do not add a generic retry helper, wrapper layer, registry, or instrumentation without a concrete current failure mode and a confirmed idempotency contract.

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
