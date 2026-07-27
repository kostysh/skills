# State Management for the Fixed SPA Stack

Use this reference when a concrete value needs an owner. Do not begin by adding
a store; begin with the behavior that must survive navigation, reload, sharing,
or an access-context change.

Unless a block is explicitly labeled copyable, code blocks in this reference
are conceptual and omit project composition and verification wiring.

## Ownership decision

| Required behavior | Owner |
| --- | --- |
| Private to one component or close subtree | React state or `useReducer` |
| Stable cross-cutting dependency such as theme or locale | Context when the project already uses it |
| Link-reproducible filter, sort, page, search, tab, or view | React Router URL state |
| Remote read, mutation, retry, invalidation, or runtime server cache | TanStack Query |
| Cross-feature runtime-only UI coordination | Zustand |
| Approved data that must survive reload | Dexie |
| Business truth, permissions, or authorization | Server contract |

Choose the lowest and narrowest owner that satisfies the required lifetime. A
value must not have competing writable copies in URL state, React state,
Zustand, Query, and Dexie.

## React state and reducers

- Use component state for local interaction state.
- Use functional updates when the next value depends on the previous value.
- Keep reducers pure and immutable; network, storage, navigation, and telemetry
  effects stay outside the reducer.
- Lift state only to the nearest real common owner. Do not create application
  Context solely to avoid a small, stable prop path.
- Treat memoization as a measured identity or rendering decision, not a default
  requirement for every callback or provider value. Follow the installed React
  and React Compiler configuration.

## Context

Context distributes an accepted dependency; it is not a general server cache or
durable store.

- Keep the provider above every consumer and fail clearly when a required
  provider is missing.
- Separate independently changing concerns when broad invalidation is observed
  or architecturally harmful.
- A session Context may expose the accepted client session snapshot and UX
  transitions. Login/logout transport and server state still belong to
  `shared/api` and TanStack Query, and authorization stays on the server.
- Do not mirror Query entities into Context.

## Zustand

Use Zustand only when multiple features coordinate mutable runtime UI state and
local React/Context/URL state is insufficient.

Conceptual store shape; persistence, server IO, and feature-specific behavior
are intentionally omitted:

```ts
import { create } from 'zustand';

type WorkspaceUiState = {
  selectedItemId: string | null;
  isInspectorOpen: boolean;
  selectItem: (itemId: string | null) => void;
  setInspectorOpen: (open: boolean) => void;
  reset: () => void;
};

export const useWorkspaceUi = create<WorkspaceUiState>()((set) => ({
  selectedItemId: null,
  isInspectorOpen: false,
  selectItem: (selectedItemId) => set({ selectedItemId }),
  setInspectorOpen: (isInspectorOpen) => set({ isInspectorOpen }),
  reset: () => set({ selectedItemId: null, isInspectorOpen: false }),
}));
```

- Select the smallest value needed by a component. Use `useShallow` only when a
  selector intentionally returns an object or tuple and shallow equality
  matches its semantics.
- Store actions update runtime UI state only. They do not call project
  transport, write Dexie, navigate, or own Query invalidation.
- Reset access-context-dependent state on logout, tenant switch, or user switch.
- Do not add Zustand persistence middleware to bypass the Dexie allowlist,
  migration, TTL, scoping, or cleanup contract.

## Cross-layer derived state

Prefer deriving display values at read time. Materialize a duplicate only when
the accepted behavior requires an independent lifecycle and defines:

- which owner is authoritative;
- how updates propagate;
- invalidation and conflict behavior;
- reload and access-context-switch behavior;
- evidence that detects divergence.

For a URL + Query + Dexie flow, the URL owns representation parameters, Query
owns live server data, and Dexie owns only an approved non-authoritative durable
projection. Zustand may coordinate runtime UI but must not become another copy
of the entity list.

## Mutation UI ownership

Choose mutation UI ownership from the full attempt and verification lifetime,
not from the component that renders the submit button. Keep form editing state
local when it may safely disappear, but place required in-flight, pending,
verification, and recoverable-failure presentation at the nearest owner that
survives the accepted child, portal, or route remount.

Key mutation state by every identity that changes its meaning: route, access
scope, entity, attempt, and outcome-verification sequence. On tenant, user, or
other access-context change, prevent old-context status and cache from becoming
visible in the new context and fence late completion. Do not add a global store
when Query mutation state or a narrow existing route or feature owner already
satisfies the required lifetime.

## Evidence

- Reducer/store tests prove only the tested state transitions.
- Component tests prove local subscription and rendering behavior.
- URL ownership needs direct-link, reload, canonicalization, and history checks.
- Runtime store reset needs logout/user/tenant-switch evidence.
- A passing store test does not prove server mutation, persistence, security, or
  the integrated user flow.

See [Persistence Architecture](persistence-architecture.md) when the same flow
crosses URL, Query, Zustand, and Dexie. See
[IndexedDB Persistence](indexeddb-persistence.md) for durable record contracts.
