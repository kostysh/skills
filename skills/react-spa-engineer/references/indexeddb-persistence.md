# IndexedDB Persistence with Dexie

Use Dexie for approved structured browser persistence in the fixed SPA stack.
Dexie is a local convenience layer, never business truth, identity proof, or an
authorization control.

Unless a block is explicitly labeled copyable, code blocks in this reference
are conceptual and omit project schema, validation, quota, and error contracts.

## When Dexie owns the value

Use Dexie for data that must survive reload and benefits from structured records,
indexes, migrations, TTL, or scoped cleanup, such as approved drafts, wizard
progress, reference dictionaries, and non-authoritative local cache.

Do not move URL state, transient UI state, ordinary TanStack Query runtime cache,
or server-authoritative business state into Dexie merely because persistence is
available.

## Typed database and versions

```ts
import Dexie, { type Table } from 'dexie';

export interface DraftRow {
  id: string;
  tenantId: string;
  userId: string;
  updatedAt: string;
  payload: ApprovedDraftPayload;
}

class AppDb extends Dexie {
  drafts!: Table<DraftRow, string>;

  constructor() {
    super('app-db');
    this.version(1).stores({
      drafts: '&id, tenantId, userId, updatedAt, [tenantId+userId]',
    });
  }
}

export const db = new AppDb();
```

- Export one application database instance.
- Declare only fields that need IndexedDB indexes.
- Never rewrite a released version declaration. Add the next version and an
  explicit upgrade when stored data must transform.
- Retain earlier version declarations while users may still upgrade from them.
- Test migrations from representative prior data; a fresh-database test cannot
  prove upgrade safety.

## Durable record contract

Approved cache records include enough metadata to enforce identity, freshness,
and cleanup:

```ts
export interface CacheEntry<TData> {
  cacheKey: string;
  namespace: 'dictionary' | 'entity-list' | 'entity-detail' | 'derived';
  tenantId: string;
  userId?: string;
  loadedAt: string;
  expiresAt: string;
  data: TData;
}
```

- Build `cacheKey` from the same semantic components as the corresponding
  TanStack Query key.
- Include tenant and user only according to the server result's access context;
  never reuse a more weakly scoped key for convenience.
- Treat expiry as a refresh requirement, not as proof that an unexpired record
  is still authorized or current.
- Keep namespace allowlists and TTL policy in one storage boundary.

## Durable data denylist

Do not persist:

- OTPs, one-time challenges, CSRF tokens, cookies, JWTs, session IDs, refresh
  tokens, or equivalent credentials;
- raw identity/provider payloads;
- raw requests, responses, headers, query strings, cookie values, or broad API
  envelopes;
- data whose stale copy can authorize or approve an action;
- sensitive fields that have not been explicitly approved for local-device
  storage.

Encryption at rest in the application does not automatically make browser
storage safe when the application also holds the decryption capability. Route
sensitive persistence decisions to the accepted security/privacy authority.

## Reactive reads

Use `useLiveQuery` when UI must react to Dexie writes. The query remains a local
database read; server fetching stays in TanStack Query.

```tsx
function useDrafts(tenantId: string, userId: string) {
  return useLiveQuery(
    () =>
      db.drafts
        .where('[tenantId+userId]')
        .equals([tenantId, userId])
        .sortBy('updatedAt'),
    [tenantId, userId],
    [],
  );
}
```

## Server cache flow

For a cache-first screen:

1. derive the canonical Query key and Dexie cache key;
2. read the exact scoped Dexie record;
3. render it only under the accepted stale-data policy;
4. fetch or refetch through TanStack Query;
5. validate and write the allowlisted server projection;
6. expose refresh failure without presenting stale data as current truth.

For strict-fresh screens, do not render Dexie data before server validation.
The product contract chooses the freshness policy.

## Mutations and bootstrap

`queryFn` is for repeatable reads. Do not create server entities from a Query
bootstrap function.

If the accepted flow may create a missing entity:

1. query whether the entity exists;
2. run a named TanStack Query mutation with the accepted idempotency contract;
3. update/invalidate Query state;
4. persist only the approved local identifier or projection;
5. surface partial failure and retry semantics explicitly.

Transactions can make local multi-table changes atomic; they cannot make a
server request and IndexedDB write one atomic distributed transaction. Define
reconciliation for failure between those boundaries.

## Realtime transport

Project SSE/WebSocket construction and protocol parsing live under `shared/api`.
A feature hook subscribes to the typed adapter and writes validated, allowlisted
events to Dexie when persistence is required.

```ts
// shared/api/events.ts
export interface EventSubscription {
  close(): void;
}

export function subscribeToChatEvents(
  input: ChatEventSubscriptionInput,
  handlers: ChatEventHandlers,
): EventSubscription {
  // Transport, credentials, parsing, reconnect and error policy live here.
  return projectEventTransport.subscribe(input, handlers);
}
```

The example is conceptual: the accepted event schema, authentication, reconnect,
ordering, deduplication, cancellation, and backpressure contracts must come from
the project. Do not open `EventSource` directly in a UI hook and bypass those
owners.

## Invalidation and context switch

After a related server mutation, update or invalidate both Query and Dexie under
one feature data-layer operation. On logout or tenant/user switch:

1. cancel or detach subscriptions for the old context;
2. delete old-context Dexie records;
3. remove/reset old-context Query data;
4. reset Zustand runtime state;
5. establish the new context before starting new reads.

Order and failure handling must prevent the old context from repopulating cache
after cleanup.

## Evidence

- Unit tests can prove key, TTL, allowlist, and local transaction logic.
- Browser tests must exercise reload, migration, quota/storage failure where
  relevant, stale/expired behavior, and user/tenant switching.
- Mocked records do not prove a released-version migration.
- A populated IndexedDB table does not prove freshness, authorization, server
  acceptance, or a complete user flow.
