# Supabase Architecture Drivers

Do not choose a monolith, service layer, microservice, queue, cache, or Kubernetes deployment from DAU alone. User count does not reveal concurrency, workload shape, latency, consistency, isolation, team ownership, recovery, or cost constraints.

## Required decision inputs

- request and background workload shape, concurrency, data volume, and growth;
- latency, availability, consistency, recovery, and regional requirements;
- tenant and trust boundaries, elevated-key isolation, and data residency;
- transactional boundaries and whether work must remain inside Postgres;
- team ownership, deployment independence, operational maturity, and cost ceiling;
- measured bottlenecks or a bounded experiment when scale is only forecast.

## Supabase-owned constraints

`supabase-engineer` should identify:

- which paths use direct Data API/RLS, RPC, Edge Functions, Realtime, Storage, queues, or direct Postgres connections;
- where user-scoped and elevated clients live;
- which operations require one database transaction;
- which platform quotas, connection limits, regions, or product boundaries need current verification;
- how migrations, secrets, observability, and rollback cross service boundaries.

## Handoff

Route general topology and service-decomposition decisions to `architecture-engineer` with the inputs above. Return `blocked` when a topology choice would require inventing missing architecture drivers. If a simple existing topology satisfies the known constraints, preserve it and avoid adding layers for hypothetical scale.

Architecture evidence must be a requirement trace, measurement, or bounded experiment. A folder tree, deployment manifest, queue, or cache is substrate and does not prove scalability or reliability.
