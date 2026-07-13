# Routing with React Router

Use this reference for React Router navigation, URL state, route objects, loaders,
route admission, and error boundaries. Existing projects follow the installed
major version and package imports. Greenfield work follows the current stable
major after checking its official installation and migration contracts; the
conceptual Data Mode examples below are verified against React Router v8 and use
APIs shared with supported v7 projects unless stated otherwise.

Unless a block is explicitly labeled copyable, code blocks in this reference
are conceptual and omit project imports, API contracts, and error behavior.

Official route objects: <https://reactrouter.com/start/data/route-object>
Official v7 to v8 migration: <https://reactrouter.com/upgrading/v7>

## Fixed-stack boundary

React Router supports loaders, actions, `<Form>`, and fetchers. This skill makes
an intentional narrower ownership choice so the fixed stack has one project
server-state owner:

- React Router owns route matching, navigation, URL state, route-level timing,
  loader orchestration, redirects, and route error rendering.
- TanStack Query owns project server reads, mutations, retries, invalidation, and
  runtime cache.
- `shared/api` owns transport and typed API errors.

Use `<Form method="get">` for URL navigation state. Do not also use Router
actions, `fetcher.load`, or `fetcher.submit` for project server IO in this
architecture. This is a project consistency policy, not a claim that React
Router lacks those APIs.

## Route objects

```tsx
const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    ErrorBoundary: RootRouteError,
    children: [
      { index: true, Component: HomeRoute },
      {
        path: 'orders/:orderId',
        loader: orderLoader,
        Component: OrderRoute,
        ErrorBoundary: OrderRouteError,
      },
    ],
  },
]);
```

- Prefer `Component` for named route components and `element` only when inline
  composition or explicit props are needed. Never set both for one route.
- Parent layouts render child routes with `<Outlet>`.
- Validate route parameters before using them; `useParams` values may be
  missing and are strings before domain parsing.
- Use splats only for accepted catch-all behavior; do not let a broad splat hide
  a more specific route or validation requirement.

## Loader and Query orchestration

Loaders may ensure Query data before route render:

```tsx
const orderLoader = ({ params }: LoaderFunctionArgs) => {
  const orderId = parseOrderId(params.orderId);
  const access = readAcceptedClientAccessContext();

  return queryClient.ensureQueryData(orderDetailOptions(access, orderId));
};
```

This example is conceptual: parameter validation, client access context, API
errors, and navigation cancellation semantics come from the project. Reuse one
Query option factory rather than creating a second loader-only key or query
function.

Components may call the same Query options to remain reactive after loader
prefill. Do not duplicate query keys or query functions between the loader and
component.

## URL state

The URL is authoritative for link-reproducible filters, sort, pagination, search,
and view state.

- Parse and canonicalize at route/page entry.
- Choose a deterministic fallback for missing/invalid values and write the
  canonical representation back with the accepted history behavior.
- UI controls update URL params; they do not maintain a competing Zustand/local
  copy.
- Reset dependent values explicitly, such as returning to page 1 after a filter
  change.
- Preserve unrelated search params unless the product contract removes them.
- Verify direct link, reload, back/forward, manual edits, and share/copy behavior.

```tsx
function OrdersFilters() {
  const [searchParams] = useSearchParams();

  return (
    <Form method="get" replace>
      <input name="search" defaultValue={searchParams.get('search') ?? ''} />
      <button type="submit">Apply</button>
    </Form>
  );
}
```

For controls that update immediately, use `setSearchParams` with the same
canonicalization and dependent-value rules.

## Navigation after mutations

Execute the server mutation through TanStack Query. On accepted success, update
or invalidate Query/Dexie state and then navigate according to the product
contract.

```tsx
const createOrder = useMutation({
  mutationFn: api.orders.create,
  onSuccess: async (order) => {
    await queryClient.invalidateQueries({ queryKey: orderKeys.lists(access) });
    navigate(`/orders/${order.id}`);
  },
});
```

Submission idempotency, field errors, cancellation, and navigation timing remain
project contracts; the compact example does not define them.

## Route admission is not authorization

A loader redirect or client wrapper can prevent confusing UI and avoid rendering
known-inaccessible routes. It cannot authorize data access or a mutation.

- Bootstrap states distinguish loading, guest, authenticated, and recoverable
  error according to the accepted session contract.
- Protected requests still rely on server authentication and authorization.
- Do not infer roles or permissions from hidden controls, local storage, route
  metadata, or cache keys.
- On unauthorized responses, follow the accepted shared API recovery contract and
  clear old-context client state without claiming that client cleanup enforces
  security.

## Errors and focus

Use the installed version's route error API consistently (`ErrorBoundary` or
`errorElement` as applicable). Handle route error responses, ordinary `Error`
instances, and unknown values without exposing sensitive server details.

Provide recovery actions and apply the accepted navigation focus policy. Error
boundaries are not a replacement for form validation or expected empty states.

## Evidence

- Route-object and loader tests can prove local matching, parameter handling, and
  Query orchestration.
- Browser tests must exercise direct URLs, history, canonicalization, redirects,
  errors, mutation navigation, and reload where claimed.
- A registered route, loader unit test, redirect wrapper, or screenshot does not
  prove server authorization or an integrated user flow.
