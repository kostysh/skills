# Data Fetching with TanStack Query

Use this reference for TanStack Query server-state behavior in the fixed SPA
stack. Existing projects follow their installed major version; greenfield
examples below target TanStack Query v5.

Unless a block is explicitly labeled copyable, code blocks in this reference
are conceptual and omit project types, API implementations, imports, and error
contracts.

Official v5 reference: <https://tanstack.com/query/latest/docs/framework/react/reference/useQuery>

## Ownership boundary

```text
UI -> feature Query adapters/options -> shared/api contracts -> shared/api transport
```

- `shared/api` owns project HTTP/SSE/WebSocket transport, credentials, CSRF
  attachment, response parsing, cancellation, and typed transport errors.
- TanStack Query owns server reads, mutations, retries, invalidation, and
  in-memory server-state lifecycle.
- React Router loaders may call `ensureQueryData` or prefetch Query options when
  route timing matters; Router actions/fetchers are not a second project-server
  mutation path in this skill's architecture.
- Components, routes, Zustand stores, and presentational hooks do not call
  project transport directly.

## Query status in v5

Use the status that matches the UI question:

| Signal | Meaning |
| --- | --- |
| `isPending` | The query has no successful data yet (`status === 'pending'`). |
| `isLoading` | The first fetch is currently in flight (`isPending && isFetching`). |
| `isFetching` | Any query function is executing, including background refetch. |
| `isRefetching` | A background refetch is executing and this is not the initial pending fetch. |

```tsx
const ordersQuery = useQuery({
  queryKey: orderKeys.list(access, params),
  queryFn: ({ signal }) => api.orders.list({ access, params, signal }),
});

if (ordersQuery.isPending) return <OrdersSkeleton />;
if (ordersQuery.isError) return <OrdersError error={ordersQuery.error} />;

return (
  <OrdersView
    orders={ordersQuery.data}
    refreshing={ordersQuery.isRefetching}
  />
);
```

Do not replace already rendered data with an initial-loading screen during a
background refetch.

## Query keys

Keys represent `domain / data type / access context / result parameters`.

- Include every value that changes the returned representation: tenant, user
  when user-dependent, filters, sort, pagination, search, locale, projection,
  and feature flags that affect data.
- Generate keys from centralized factories; UI code does not compose ad-hoc
  arrays.
- Canonicalize object-like parameters before using the same semantic identity as
  a Dexie `cacheKey`.
- A tenant/user key prevents accidental cache reuse; it is not authorization.

```ts
type Access = { tenantId: string; userId?: string };

export const orderKeys = {
  all: (access: Access) =>
    ['orders', access.tenantId, access.userId ?? 'shared'] as const,
  lists: (access: Access) => [...orderKeys.all(access), 'list'] as const,
  list: (access: Access, params: Readonly<OrderListParams>) =>
    [...orderKeys.lists(access), canonicalizeOrderParams(params)] as const,
  detail: (access: Access, orderId: string) =>
    [...orderKeys.all(access), 'detail', orderId] as const,
};
```

## Queries are reads

`queryFn` must be safe under Query retries, refetches, remounts, invalidation,
and focus/reconnect policies. Do not create a chat, send a message, rotate a
credential, submit a form, or perform another server mutation from `queryFn`.

If bootstrap requires a server mutation, model it explicitly:

1. query existing server state;
2. if the accepted product contract permits automatic creation, run a named
   mutation with the required idempotency contract;
3. invalidate or set the relevant Query data;
4. persist only the approved non-authoritative local projection.

Without an owner-supplied idempotency and retry contract, stop instead of hiding
the mutation in a query.

## Mutations and invalidation

```tsx
const updateOrder = useMutation({
  mutationFn: (input: UpdateOrderInput) => api.orders.update(input),
  onSuccess: async (order, input) => {
    queryClient.setQueryData(orderKeys.detail(input.access, order.id), order);
    await queryClient.invalidateQueries({
      queryKey: orderKeys.lists(input.access),
    });
  },
});
```

- Use `onMutate` only when the UI has a defined optimistic model and rollback.
- Preserve the previous typed value for rollback and reconcile with the server
  result.
- Invalidate/update Dexie and Query together when a mutation affects both.
- Do not swallow mutation failure in console output; expose an actionable and
  accessible recovery state.

## Retry and recovery

Retry only failures that are safe and useful to repeat. The accepted API
contract decides which status/error classes are retryable.

Auth and CSRF recovery need one named coordinator under `shared/api`:

- single-flight any refresh or token/CSRF reissue operation;
- bound replay to the accepted maximum;
- preserve abort/cancellation behavior;
- surface repeated failure as recoverable UI;
- clear scoped Query, Dexie, and runtime state when the session or access context
  becomes invalid.

Global `QueryCache`/`MutationCache` callbacks may observe and route typed errors,
but a fire-and-forget callback alone does not prove that the failed operation was
safely recovered or replayed.

Client recovery implements an accepted backend contract; it does not invent
session, CSRF, refresh, or authorization semantics.

## Router integration

```tsx
const orderDetailOptions = (access: Access, orderId: string) => ({
  queryKey: orderKeys.detail(access, orderId),
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    api.orders.get({ access, orderId, signal }),
});

const orderLoader = ({ params }: LoaderFunctionArgs) =>
  queryClient.ensureQueryData(orderDetailOptions(accessFromSession(), params.orderId!));
```

This pattern remains conceptual until `accessFromSession`, route parameter
validation, API types, and error behavior are supplied by the project. Those
omitted contracts must not be inferred from the example.

## Evidence

- Query-option tests can prove key construction and local retry/invalidation
  decisions.
- MSW proves the exercised browser-side network contract, not the real backend.
- Integrated API evidence is required for auth, CSRF, idempotency, and production
  error claims.
- A successful query, cache entry, or mocked happy path cannot establish the
  complete interactive flow.
