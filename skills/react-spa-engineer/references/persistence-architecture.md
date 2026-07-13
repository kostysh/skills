# Persistence Architecture for the Fixed SPA Stack

Use this reference when one user flow crosses URL state, runtime UI state,
TanStack Query, and Dexie. Its purpose is to keep one source of truth, one
transport boundary, and explicit freshness and cleanup behavior.

Unless a block is explicitly labeled copyable, code blocks in this reference
are conceptual and omit project identity, validation, and error contracts.

## Layer map

| Layer | Owns | Must not own |
| --- | --- | --- |
| React Router URL | Link-reproducible representation state | Entities, credentials, hidden authorization state |
| React or Zustand | Current runtime-only UI coordination | Server cache or reload-safe records |
| `shared/api` | HTTP, SSE, WebSocket, credentials, parsing, cancellation, typed transport errors | UI state or durable cache policy |
| TanStack Query | Server reads/mutations, retries, invalidation, runtime cache | Long-lived browser authority |
| Dexie | Allowlisted, scoped, versioned, TTL-bound durable projections | Business truth, authorization, secrets |
| Server | Business truth and authorization | Client presentation state |

Every value and side effect gets one writable owner. Other layers may hold a
projection only when its refresh, invalidation, conflict, and cleanup contract
is explicit.

## Flow contract

For each affected value, record:

1. semantic identity and authoritative owner;
2. readers and writers;
3. lifetime across navigation, reload, offline periods, logout, tenant switch,
   and user switch;
4. freshness and conflict policy;
5. invalidation and cleanup triggers;
6. user-visible pending, stale, error, retry, and empty behavior;
7. evidence required for the claimed outcome.

If a required backend freshness, idempotency, authorization, or conflict policy
is missing or disputed, return `blocked`; do not encode a guess in browser
state.

## Query and durable cache identity

Use the same canonical semantic identity for Query and Dexie:

`domain / data kind / tenant / user when user-specific / representation params`

Include every parameter that changes the result: filters, sort, pagination,
search, locale, projection, and relevant feature flags. Centralize Query key and
Dexie cache-key construction so equivalent inputs cannot serialize differently.

Conceptual identity shape; canonicalization, domain validation, and actual key
factories are intentionally project-owned:

```ts
type DataIdentity = {
  domain: string;
  kind: string;
  tenantId: string;
  userId?: string;
  params: Readonly<Record<string, unknown>>;
};
```

A scoped key reduces accidental cross-context reuse; it does not authorize a
request.

## Read and refresh policies

Choose one accepted policy per screen or resource:

- **network-first:** obtain current server data before presenting the claimed
  result;
- **cache-first with refresh:** show an unexpired or explicitly stale local
  projection, label freshness when material, then refresh through Query;
- **offline-capable:** define what operations are available offline, how writes
  are queued or rejected, and how conflicts are resolved after reconnection.

Dexie reads and writes stay in `shared/storage` or a feature data adapter.
Project transport stays in `shared/api`. Query options/mutations orchestrate the
server lifecycle; UI components do not call either primitive directly.

Do not place a server mutation in `queryFn` to bootstrap missing state. Use an
explicit mutation with the accepted idempotency contract, update/invalidate
Query, then persist only the allowlisted local projection.

## Invalidation and context changes

After an accepted server mutation:

1. update or invalidate every affected Query identity;
2. update or invalidate affected Dexie projections;
3. preserve or reset runtime UI according to the product contract;
4. expose failure and recovery rather than hiding partial divergence.

On logout, tenant switch, or user switch:

1. cancel or fence old-context work;
2. remove old-context Query data;
3. clear scoped Dexie records;
4. reset dependent Zustand/React state;
5. prove that late responses cannot repopulate the new context.

Cleanup supports isolation and UX correctness. It is not a substitute for
server authorization.

## Durable-data constraints

Every Dexie record family defines schema version, access scope, TTL/freshness,
migration behavior, deletion trigger, quota/error behavior, and denylisted
sensitive fields. See [IndexedDB Persistence](indexeddb-persistence.md) for the
record and migration details.

Do not persist cookies, session identifiers, bearer or refresh tokens, CSRF
secrets, OTPs, raw provider identity payloads, or unfiltered request/response
captures.

## Evidence

- Key-factory tests prove only canonical identity construction.
- Query and storage adapter tests prove only their exercised transitions.
- Persistence claims require reload, migration, TTL/expiry, quota/error, and
  user/tenant-switch scenarios.
- Cache-first behavior needs browser evidence for stale/fresh UI transitions and
  failed refresh recovery.
- Authorization and conflict-resolution claims require the real backend
  boundary and the owning security or domain reviewer.
- A populated IndexedDB table, passing mock, or successful build is not proof of
  the integrated persistence flow.
