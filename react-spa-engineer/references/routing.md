# Routing in React SPA

## React Router v7 Data Mode

**Rule: Use createBrowserRouter with Data API for modern React SPA routing.**

**Package note**: For React Router v7, prefer installing/importing from `react-router`. `react-router-dom` is a compatibility re-export; avoid mixing both.

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

## 5. Form vs useFetcher

### Form for Navigation Mutations

**Rule: Use Form when mutation should navigate to new page.**

```tsx
import { Form, redirect } from 'react-router';

// Route with action
{
  path: 'users/new',
  Component: NewUserForm,
  action: async ({ request }) => {
    const formData = await request.formData();
    const user = await createUser({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
    });
    return redirect(`/users/${user.id}`);
  },
}

// Component
function NewUserForm() {
  return (
    <Form method="post">
      <input name="name" placeholder="Name" required />
      <input name="email" type="email" placeholder="Email" required />
      <button type="submit">Create User</button>
    </Form>
  );
}
```

### useFetcher for Non-Navigation Mutations

**Rule: Use useFetcher when mutation shouldn't change URL (inline edits, favorites, etc.).**

```tsx
import { useFetcher } from 'react-router';

// Route action
{
  path: 'todos/:todoId',
  action: async ({ request, params }) => {
    const formData = await request.formData();
    const intent = formData.get('intent');

    if (intent === 'toggle') {
      await toggleTodo(params.todoId!);
    } else if (intent === 'delete') {
      await deleteTodo(params.todoId!);
    }

    return { ok: true };
  },
}

// Component - stays on same page
interface TodoItemProps {
  todo: Todo;
}

function TodoItem({ todo }: TodoItemProps) {
  const fetcher = useFetcher();

  const isToggling = fetcher.state !== 'idle' &&
    fetcher.formData?.get('intent') === 'toggle';

  return (
    <div className={isToggling ? 'opacity-50' : ''}>
      <fetcher.Form method="post" action={`/todos/${todo.id}`}>
        <input type="hidden" name="intent" value="toggle" />
        <button type="submit">
          {todo.completed ? 'Undo' : 'Complete'}
        </button>
      </fetcher.Form>

      <span>{todo.title}</span>

      <fetcher.Form method="post" action={`/todos/${todo.id}`}>
        <input type="hidden" name="intent" value="delete" />
        <button type="submit">Delete</button>
      </fetcher.Form>
    </div>
  );
}
```

### useFetcher.load for Data Without Navigation

```tsx
function SearchResults() {
  const fetcher = useFetcher<SearchData>();

  useEffect(() => {
    fetcher.load('/api/search?q=react');
  }, []);

  if (fetcher.state === 'loading') return <Spinner />;

  return (
    <ul>
      {fetcher.data?.results.map((result) => (
        <li key={result.id}>{result.title}</li>
      ))}
    </ul>
  );
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
    const data = await fetchDashboardData(user.id);
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
        const user = await fetchUser(params.userId!);
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
6. **Form for navigation mutations** - Redirects after submit
7. **useFetcher for inline mutations** - Stays on same page
8. **Protected routes via loaders** - Check auth, throw redirect
9. **NavLink for active styling** - isActive prop for current route
10. **errorElement for error handling** - Per-route or global
