# Persistence Architecture for React SPA

## Table of Contents

1. [Layer Model](#1-layer-model)
2. [Source of Truth Rules](#2-source-of-truth-rules)
3. [Dexie Cache Record Contract](#3-dexie-cache-record-contract)
4. [Dictionary Caching Flow (TTL)](#4-dictionary-caching-flow-ttl)
5. [Freshness Policies by Screen](#5-freshness-policies-by-screen)
6. [Invalidation After Mutations](#6-invalidation-after-mutations)
7. [Context Switch Cleanup](#7-context-switch-cleanup)
8. [queryKey and cacheKey Standard](#8-querykey-and-cachekey-standard)
9. [Key Factory Pattern](#9-key-factory-pattern)
10. [Encapsulation Boundary](#10-encapsulation-boundary)

---

## 1. Layer Model

Use explicit persistence layers in every SPA feature:

| Layer | Purpose | Source of truth |
|------|---------|-----------------|
| URL state | Link-reproducible page state | URL (`path` + `search`) |
| Runtime UI state | In-memory interactive UI state | Zustand |
| Client persistence | Local data that survives reload/navigation | Dexie (IndexedDB) |
| Server state | Business truth, remote reads/mutations | Server (via TanStack Query) |

---

## 2. Source of Truth Rules

### URL state

Put state in URL when it must:
- restore on direct link open;
- survive reload;
- be reproducible from the same link.

At page entry, URL is authoritative for this state layer.

### Zustand state

Keep runtime-only UI state in Zustand:
- control state;
- temporary selections;
- modal/drawer visibility;
- transient UI flags.

Do not use Zustand as long-term storage for data that must survive reload.

### Dexie state

Persist long-lived client data in Dexie:
- form drafts;
- wizard progress;
- dictionaries/reference data;
- local caches.

Treat Zustand as an operational projection over Dexie and/or server state.
Dexie/local durable cache is allowlisted, scoped, TTL-bound, and non-authoritative. Never persist OTPs, CSRF tokens, cookies, JWT/session IDs, raw identity/provider payloads, or raw request/response/header/query/cookie data.

### Server interactions

All server reads/mutations must go through TanStack Query:
- `useQuery`
- `useMutation`
- `queryClient`

Components, UI hooks, and Zustand stores must not execute direct HTTP calls for app data.

---

## 3. Dexie Cache Record Contract

Store cache entries with metadata (minimum required):

```ts
type CacheEntry<TData> = {
  cacheKey: string;
  namespace: 'dictionary' | 'entity-list' | 'entity-detail' | 'derived';
  tenantId: string;
  userId?: string;
  loadedAt: string; // ISO datetime
  data: TData;
};
```

Schema/indexes must support:
- exact lookup by `cacheKey`;
- selective cleanup by `tenantId` / `userId`;
- cleanup by `namespace`.

---

## 4. Dictionary Caching Flow (TTL)

On dictionary request:

1. Build key from dictionary namespace + access context (`tenantId`, optional `userId`) + params.
2. Read cache entry from Dexie by `cacheKey`.
3. If no entry: fetch via TanStack Query, write Dexie, return data.
4. If entry exists and TTL not expired: return cached value immediately.
5. If entry exists and TTL expired: fetch via TanStack Query, update Dexie, return fresh value.

Define TTLs centrally (config/env). Allow per-dictionary TTL overrides when business logic requires.

---

## 5. Freshness Policies by Screen

Use one explicit policy per scenario:

| Policy | Behavior | Use when |
|--------|----------|----------|
| Cache-first with background refresh | Show Dexie cache immediately, then refresh from server | Responsiveness-first screens |
| Strict-fresh | Load from server before showing data | Accuracy-critical screens |

Implement policy via TanStack Query lifecycle and Dexie cache access in data-layer hooks/services.

---

## 6. Invalidation After Mutations

After mutation that changes cached data:

1. Invalidate/update affected TanStack Query caches (`queryClient.invalidateQueries`, `setQueryData`).
2. Invalidate/update related Dexie entries (dictionary/list/detail/derived caches).
3. Keep invalidation logic near mutation in data layer (not in UI component).

Rules must support:
- point invalidation (single entry);
- group invalidation by namespace/prefix.

---

## 7. Context Switch Cleanup

On logout, user switch, or tenant switch:

1. Clear scoped Dexie data for previous context.
2. Reset runtime UI state (Zustand).
3. Clear/reset TanStack Query runtime cache for previous context.

After context switch, UI and data layer must operate only on new context keys.

---

## 8. queryKey and cacheKey Standard

Use the same semantic identity in both keys:

`domain / data-type / access-context / query-params`

Required:
- include `tenantId` for tenant-scoped data;
- include `userId` when user-dependent;
- include all parameters that change result or representation:
  - filters
  - sort
  - pagination
  - search
  - locale
  - projection/view/include/fields

For object params, canonicalize deterministically (stable field order and value format).

---

## 9. Key Factory Pattern

Centralize key generation; components/hooks consume factories only.

```ts
type Access = { tenantId: string; userId?: string };

const dictionaryKeys = {
  all: (access: Access) =>
    ['dictionary', access.tenantId, access.userId ?? 'anon'] as const,
  byName: (access: Access, name: string, locale: string) =>
    [...dictionaryKeys.all(access), name, { locale }] as const,
};

const stableStringify = (value: unknown): string =>
  JSON.stringify(value, (_, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.keys(v as Record<string, unknown>)
          .sort()
          .reduce<Record<string, unknown>>((acc, key) => {
            acc[key] = (v as Record<string, unknown>)[key];
            return acc;
          }, {})
      : v
  );

const toCacheKey = (queryKey: readonly unknown[]): string =>
  stableStringify(queryKey);
```

`cacheKey` and `queryKey` must stay aligned by construction.

---

## 10. Encapsulation Boundary

Encapsulate persistence operations in application layer modules:
- feature data hooks;
- data services;
- store actions.

Do not spread raw URL parsing/writing, Dexie operations, and query invalidation logic across UI components.
This keeps persistence policy consistent across the project.

`shared/storage` owns durable storage primitives. Feature modules may define allowlisted cache namespaces, but they must not bypass shared TTL, scoping, cleanup, and denylist rules.
