# High-risk backend contract matrix: Supabase ownership

Read this reference for high-risk Supabase-backed commands or reads involving a public API, persistent state, authorization, concurrency, money, external resources, or required audit evidence.

## Responsibility boundary

Consume the `HRB-*` matrix from the owning specification when one exists. `spec-engineer` owns the complete cross-layer handoff; this skill owns Supabase and PostgreSQL facts. Do not mark HTTP-only, product, legal, or architecture decisions complete. When no matrix exists yet, report the missing rows and provide Supabase-owned inputs without inventing the other layers.

For every applicable Supabase-owned row, return the exact database objects, privileges, invariants, failure semantics, and executable evidence. A row is incomplete when it names only a table, function, policy, migration, or happy-path test.

## Supabase-owned checks

| Row | Required Supabase contribution |
| --- | --- |
| `HRB-01` | Name the command-wide ledger owner, key scope, normalized fingerprint, reservation point, replay/conflict rule, committed outcome, and rollback behavior before later effects begin. |
| `HRB-02` | Name every lock and canonical row, deterministic acquisition order, winner/loser result, counter/allocation behavior, and a controlled concurrent test with a negative oracle. |
| `HRB-03` | Record exact `proacl` expectations, `REVOKE`/`GRANT`, RLS policies, `SECURITY DEFINER` owner and `search_path`, direct-table closure, elevated exceptions, and negative-role tests. |
| `HRB-04` | State which identity, session, context, role, tenant/scope, assignment, and maintenance facts are re-read at command entry and at each database-owned phase or delivery boundary. |
| `HRB-05` | Separate genuine transient database failures from durable domain outcomes. Manual class `40xxx` is forbidden for validation, authorization, not-found, state conflict, or unavailable outcomes; name retry count and the public-mapping handoff. |
| `HRB-06` | Define database representations for absence, `null`, expiry, revocation, rollback, commit-with-lost-readback, and unknown outcome without collapsing them into one sentinel. |
| `HRB-07` | Define database/domain numeric ranges and exact transport handoff for bigint or money values; require guards on every intermediate/result boundary owned by the database. |
| `HRB-09` | Name audit/evidence profile, bounded fields, transaction phase, correlation, append/failure behavior, and tests proving required evidence cannot silently disappear. |
| `HRB-10` | Pair every stored row/object transition with the actor, authorization, idempotency, expiry, discard/finalize, orphan prevention, and cleanup evidence. |
| `HRB-11` | Express eligible states and cross-entity rules as constraints, guarded RPC logic, or other executable checks plus negative tests. |
| `HRB-12` | Supply exact database result shapes and identifiers to the API owner; do not invent public DTO, status, message, or compatibility aliases. |

## Evidence gate

The generated test inventory must map each applicable row to a direct SQL/RPC/RLS or production-equivalent boundary check. Include negative principals, independent sessions where freshness matters, controlled races where locks matter, deliberate evidence failure, retry-attempt assertions, and rollback/readback-loss checks when applicable. Mocked API tests and migration presence are supporting evidence only.
