# Routing in React SPA

## React Router v7 Data Mode

**Rule: Use createBrowserRouter with Data API for modern React SPA routing.**

**Package note**: For React Router v7, prefer installing/importing from `react-router`. `react-router-dom` is a compatibility re-export; avoid mixing both.

**Project policy**: Server reads/mutations must go through TanStack Query. In examples below, direct loader calls are conceptual shortcuts; production code should route IO through Query `queryFn` / `mutationFn` and `queryClient`.

**Component vs element**: Default to `Component` in route objects; use `element` only for inline composition/props. Never set both on the same route.

### Setup

```tsx
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router';

const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    ErrorBoundary: ErrorPage,
    children: [
      { index: true, Component: Home },
      { path: 'about', Component: About },
      {
        path: 'users',
        Component: UsersLayout,
        children: [
          { index: true, Component: UsersList },
          { path: ':userId', Component: UserDetail },
        ],
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}
```

---

## 1. Nested Routes with Outlet

**Rule: Use Outlet to render child routes in parent layouts.**

```tsx
// routes.tsx
const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: Home },
      {
        path: 'dashboard',
        Component: DashboardLayout,
        children: [
          { index: true, Component: DashboardHome },
          { path: 'settings', Component: Settings },
          { path: 'profile', Component: Profile },
        ],
      },
    ],
  },
]);

// RootLayout.tsx
import { Outlet, Link } from 'react-router';

function RootLayout() {
  return (
    <div>
      <header>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/dashboard">Dashboard</Link>
        </nav>
      </header>

      <main>
        <Outlet /> {/* Child routes render here */}
      </main>

      <footer>Footer content</footer>
    </div>
  );
}

// DashboardLayout.tsx
function DashboardLayout() {
  return (
    <div className="dashboard">
      <aside>
        <nav>
          <Link to="/dashboard">Overview</Link>
          <Link to="/dashboard/settings">Settings</Link>
          <Link to="/dashboard/profile">Profile</Link>
        </nav>
      </aside>

      <section>
        <Outlet /> {/* Nested child routes render here */}
      </section>
    </div>
  );
}
```

### URL Structure

```
/                    -> RootLayout > Home
/dashboard           -> RootLayout > DashboardLayout > DashboardHome
/dashboard/settings  -> RootLayout > DashboardLayout > Settings
/dashboard/profile   -> RootLayout > DashboardLayout > Profile
```

---

## 2. Dynamic Segments

**Rule: Use `:paramName` for dynamic URL segments. Access via useParams or loader params.**

```tsx
// Route definition
{
  path: 'users/:userId',
  Component: UserDetail,
  loader: userLoader,
}

// With multiple segments
{
  path: 'categories/:categoryId/products/:productId',
  Component: ProductDetail,
}

// Component access
import { useParams } from 'react-router';

function UserDetail() {
  const { userId } = useParams<{ userId: string }>();

  // userId is always string - parse if needed
  const id = parseInt(userId!, 10);

  return <div>User ID: {userId}</div>;
}

// Loader access
async function userLoader({ params }: LoaderFunctionArgs) {
  const user = await fetchUser(params.userId!);
  return { user };
}
```

---

## 3. Splat Routes (Catch-all)

**Rule: Use `*` for catch-all routes. Access matched path via `params['*']`.**

```tsx
// Catch-all for 404
{
  path: '*',
  Component: NotFound,
}

// File browser example
{
  path: 'files/*',
  Component: FileBrowser,
  loader: filesLoader,
}

// Access splat in component
function FileBrowser() {
  const params = useParams();
  const filePath = params['*']; // e.g., "documents/reports/2024"

  return <div>Path: {filePath}</div>;
}

// Access in loader
async function filesLoader({ params }: LoaderFunctionArgs) {
  const path = params['*'] || '';
  const files = await fetchFiles(path);
  return { files, path };
}
```

---

## 4. Loaders vs useEffect

**Rule: Prefer loaders for data fetching. Use useEffect only for side effects that don't need route data.**

### Loader Pattern (Recommended)

```tsx
// Route with loader
{
  path: 'users/:userId',
  Component: UserProfile,
  loader: async ({ params }) => {
    const user = await fetchUser(params.userId!);
    return { user };
  },
}

// Component uses loader data
import { useLoaderData } from 'react-router';

interface LoaderData {
  user: User;
}

function UserProfile() {
  const { user } = useLoaderData() as LoaderData;

  // No loading state needed - data is already loaded
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

### Why Loaders Beat useEffect

```tsx
// With loader: Data loads DURING navigation
// - No flash of loading state
// - Browser shows loading indicator
// - Data ready when component mounts

// With useEffect: Data loads AFTER navigation
// - Flash of empty/loading state
// - Component mounts, then fetches
// - Worse UX, more code
```

### Combining with TanStack Query

```tsx
import { queryClient } from './queryClient';

// Route loader that works with TanStack Query
{
  path: 'users/:userId',
  Component: UserProfile,
  loader: async ({ params }) => {
    // ensureQueryData: returns cached data OR fetches
    const user = await queryClient.ensureQueryData({
      queryKey: ['user', params.userId],
      queryFn: () => fetchUser(params.userId!),
    });
    return { user };
  },
}

// Component still uses useQuery for reactivity
function UserProfile() {
  const { userId } = useParams();
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId!),
    // Data already in cache from loader
  });

  return <UserCard user={user} />;
}
```

---

## 5. Form vs useFetcher (Query-First Policy)

### Form for URL Navigation State

**Rule: Use `<Form method="get">` for URL updates, not for server mutations.**

```tsx
import { Form } from 'react-router';

function OrdersFilterForm() {
  return (
    <Form method="get" replace>
      <input name="search" placeholder="Search orders" />
      <select name="status" defaultValue="all">
        <option value="all">All</option>
        <option value="new">New</option>
        <option value="paid">Paid</option>
      </select>
      <button type="submit">Apply</button>
    </Form>
  );
}
```

### Server Mutations: `useMutation` + Navigate/Invalidate

**Rule: If action touches server data, execute it through TanStack Query mutation flow.**

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

function NewUserForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createUserMutation = useMutation({
    mutationFn: (input: { name: string; email: string }) =>
      api.users.create(input),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      navigate(`/users/${user.id}`);
    },
  });

  return <UserForm onSubmit={(values) => createUserMutation.mutate(values)} />;
}
```

### Non-navigation Data Reads

**Rule: Use TanStack Query for route-local reads instead of `fetcher.load` HTTP calls.**

```tsx
function SearchResults({ tenantId, userId }: { tenantId: string; userId: string }) {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';

  const searchQuery = useQuery({
    queryKey: searchKeys.list({ tenantId, userId, q }),
    queryFn: () => api.search.list({ tenantId, userId, q }),
    enabled: q.length > 0,
  });

  if (searchQuery.isPending) return <Spinner />;
  return <ResultsList items={searchQuery.data?.results ?? []} />;
}
```

---

## 6. Protected Routes

**Rule: Check authentication in loaders, redirect if unauthorized.**

```tsx
// auth.ts
export function requireAuth() {
  const user = getUser();
  if (!user) {
    throw redirect('/login');
  }
  return user;
}

export function requireAdmin() {
  const user = requireAuth();
  if (user.role !== 'admin') {
    throw redirect('/unauthorized');
  }
  return user;
}

// Protected route
{
  path: 'dashboard',
  Component: Dashboard,
  loader: async () => {
    const user = requireAuth();
    const data = await queryClient.ensureQueryData({
      queryKey: dashboardKeys.detail({ tenantId: user.tenantId, userId: user.id }),
      queryFn: () => api.dashboard.get({ tenantId: user.tenantId, userId: user.id }),
    });
    return { user, data };
  },
}

// Admin-only route
{
  path: 'admin',
  Component: AdminPanel,
  loader: async () => {
    const admin = requireAdmin();
    return { admin };
  },
}
```

### Protected Route Wrapper (Alternative)

```tsx
// ProtectedRoute component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingSpinner />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Usage in routes
{
  path: 'dashboard',
  // Use element for inline composition (guards/providers).
  // Prefer loader-based auth for data routers.
  element: (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  ),
}
```

---

## URL State Contract

**Rule: If page state must be shareable/reload-safe, URL is the source of truth.**

Keep in URL:
- filters;
- sorting;
- pagination;
- search;
- view mode.

```tsx
import { useMemo } from 'react';
import { useSearchParams } from 'react-router';

function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL -> UI derivation (source of truth)
  const page = Number(searchParams.get('page') ?? '1');
  const search = searchParams.get('search') ?? '';
  const view = searchParams.get('view') ?? 'table';

  const setFilters = (next: { page?: number; search?: string; view?: string }) => {
    const merged = new URLSearchParams(searchParams);
    if (next.page !== undefined) merged.set('page', String(next.page));
    if (next.search !== undefined) merged.set('search', next.search);
    if (next.view !== undefined) merged.set('view', next.view);
    setSearchParams(merged, { replace: true });
  };

  const uiState = useMemo(() => ({ page, search, view }), [page, search, view]);
  return <OrdersScreen state={uiState} onChange={setFilters} />;
}
```

Do not duplicate this state in independent in-memory stores as a second source of truth.

---

## 7. Navigation Hooks

```tsx
import {
  useNavigate,
  useLocation,
  useSearchParams,
  Link,
  NavLink,
} from 'react-router';

function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Programmatic navigation
  const handleClick = () => {
    navigate('/dashboard');
    navigate('/users/123');
    navigate(-1); // Go back
    navigate('/login', { replace: true }); // Replace history
    navigate('/dashboard', { state: { from: location } }); // Pass state
  };

  // Search params
  const page = searchParams.get('page') || '1';
  const setPage = (newPage: number) => {
    setSearchParams({ page: String(newPage) });
  };

  // Active link styling
  return (
    <nav>
      <NavLink
        to="/dashboard"
        className={({ isActive }) => isActive ? 'active' : ''}
      >
        Dashboard
      </NavLink>

      <Link to="/users" state={{ fromNav: true }}>
        Users
      </Link>
    </nav>
  );
}
```

---

## 8. Error Handling

```tsx
import { useRouteError, isRouteErrorResponse } from 'react-router';

// Error boundary component
function ErrorPage() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    // Known HTTP errors
    return (
      <div>
        <h1>{error.status}</h1>
        <p>{error.statusText}</p>
      </div>
    );
  }

  // Unknown errors
  return (
    <div>
      <h1>Oops!</h1>
      <p>Something went wrong.</p>
    </div>
  );
}

// Route configuration
{
  path: '/',
  Component: RootLayout,
  ErrorBoundary: ErrorPage,
  children: [
    {
      path: 'users/:userId',
      Component: UserDetail,
      ErrorBoundary: UserError, // Route-specific error
      loader: async ({ params }) => {
        const user = await queryClient.ensureQueryData({
          queryKey: userKeys.detail(params.userId!),
          queryFn: () => api.users.get(params.userId!),
        });
        if (!user) {
          throw new Response('User not found', { status: 404 });
        }
        return { user };
      },
    },
  ],
}
```

---

## Best Practices Summary

1. **createBrowserRouter** - Use Data API mode for SPA
2. **Outlet for nested routes** - Parent layouts render children
3. **`:paramName` for dynamic segments** - Always strings, parse if needed
4. **`*` for catch-all routes** - 404 pages, file browsers
5. **Loaders over useEffect** - Data ready before component mounts
6. **`Form method="get"` for URL state** - Search/filter/pagination in URL
7. **Server mutations via TanStack Query** - `useMutation` + query invalidation/navigation
8. **Protected routes via loaders** - Check auth, throw redirect
9. **NavLink for active styling** - isActive prop for current route
10. **errorElement for error handling** - Per-route or global
