# Pattern catalog

Use this catalog after ASR and forces are explicit. Do not choose patterns by name first.

## System shape

| Pattern | Good fit | Avoid when | Validation focus |
| --- | --- | --- | --- |
| Modular monolith | Small/medium team, unstable domains, need fast delivery with internal boundaries | Teams require independent deployability now | Module boundaries, dependency direction, extraction path |
| Service-based architecture | A few clear deployable services and integration boundaries | Domain boundaries unclear or ops maturity low | API contracts, observability, deployment failure modes |
| Microservices | Independent teams, distinct scaling profiles, mature platform ops | Single small team, weak observability, unstable domains | Contract tests, distributed tracing, data ownership, incident response |
| Event-driven architecture | Async workflows, provider decoupling, integration fanout | Need immediate consistency everywhere or no idempotency strategy | Outbox, ordering, DLQ, replay, observability |
| CQRS-lite | Read-heavy workload with distinct query model | Simple CRUD and no read pressure | Freshness, backfill, invalidation, consistency expectations |
| Event sourcing | Need state reconstruction, temporal queries, audit as source of truth | Audit log alone is enough | Event schema evolution, replay, snapshots, invariants |

## Frontend

| Force | Pattern options | Watch for |
| --- | --- | --- |
| SEO / first load | SSR, SSG, ISR, edge rendering | cache invalidation, auth personalization |
| Rich interactions | SPA islands, client state plus server state | hydration cost, stale server data |
| Frequent UI change | design system, route-level composition | component sprawl, inconsistent UX |
| Reliability UX | error boundaries, skeletons, offline/degraded states | false success states |
| Security | CSP, output encoding, token isolation | token leakage, XSS, mixed trust surfaces |

## Backend

| Force | Pattern options | Watch for |
| --- | --- | --- |
| Stable public integration | REST/OpenAPI, contract tests | versioning, backward compatibility |
| Type-safe internal app API | tRPC/RPC with schema validation | coupling frontend/backend release cadence |
| Complex client query needs | GraphQL | authz, query cost, schema ownership |
| Domain complexity | hexagonal boundaries, domain services | over-abstraction, anemic modules |
| Retry side effects | idempotency keys, outbox, dedupe | exactly-once claims without proof |

## Data

| Force | Pattern options | Watch for |
| --- | --- | --- |
| Transactional source of truth | relational DB, explicit transaction boundaries | cross-service transactions |
| High read load | indexes, cache, materialized view, read model | invalidation and freshness |
| Tenant isolation | shared schema, schema-per-tenant, DB-per-tenant | noisy neighbor, migration complexity |
| Audit | append-only audit log, event log | confusing audit with event sourcing |
| Migration risk | expand/contract, dual read/write, backfill | rollback and compatibility window |

## Integration

| Force | Pattern options | Watch for |
| --- | --- | --- |
| External unreliability | adapter, queue, retry, circuit breaker | unbounded retries, hidden failures |
| Side-effect safety | idempotency key, outbox, dedupe store | duplicate side effects |
| Provider rate limits | batching, throttling, backoff | user-visible freshness degradation |
| Multi-step process | process manager, saga | compensation semantics |
| Contract uncertainty | sandbox spike, contract tests | mocks that do not match real provider |

## Security and privacy

| Force | Pattern options | Watch for |
| --- | --- | --- |
| Authorization | centralized policy, RBAC, ABAC, resource-scoped checks | bypass paths and inconsistent enforcement |
| Tenant isolation | tenant-scoped queries, policy enforcement, DB separation | missing tenant predicate, admin paths |
| Secrets | backend-owned secret storage, envelope encryption | secrets in logs, frontend exposure |
| Audit | structured audit log with actor/action/resource/result | audit without integrity or retention policy |
| Privacy | data minimization, retention/deletion workflow | orphaned data and analytics leakage |

## Operations and delivery safety

| Force | Pattern options | Watch for |
| --- | --- | --- |
| Safe rollout | feature flags, canary, blue/green, rolling deploy | flags without cleanup or rollback semantics |
| Observability | logs, metrics, traces, dashboards, runbooks | metrics unrelated to ASR |
| Reliability | SLO, error budget, alert routing, degraded modes | alert fatigue, no owner |
| Migration | expand/contract, migration checks, rollback plan | irreversible operations without validation |
| Cost | cost tags, quotas, rate limits, budget alerts | hidden API/model/egress cost |
| Sustainability when material | efficient utilization, autoscaling, workload scheduling, data lifecycle | unmeasured claims or treating cost as a complete proxy |

## Catalog use rules

- Select candidate patterns only after ASR and forces are stated.
- Include the simplest baseline unless it cannot satisfy the ASR.
- Reject one-implementation abstraction layers unless they protect a current boundary, contract, migration path, plugin point, or validation obligation.
- Do not treat this catalog as exhaustive; add a candidate when repository evidence or a domain skill justifies it.
- For significant decisions, score candidates using the matrix in [Architecture methodology](methodology.md).
- If a pattern needs runtime- or framework-specific validation, load the relevant domain skill before finalizing the decision.
