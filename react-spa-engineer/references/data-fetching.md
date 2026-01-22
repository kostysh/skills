# Data Fetching in React SPA

## TanStack Query v5 (React Query)

**Rule: Use TanStack Query for all server state management in SPA.**

### Setup

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30,   // 30 minutes (formerly cacheTime)
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
    </QueryClientProvider>
  );
}
```

---

## 1. Basic Queries - Object Syntax

**Rule: Always use object syntax in v5 (no positional arguments).**

```tsx
import { useQuery } from '@tanstack/react-query';

interface User {
  id: number;
  name: string;
  email: string;
}

interface UserProfileProps {
  userId: number;
}

function UserProfile({ userId }: UserProfileProps) {
  const {
    data,
    isPending,    // No cached data yet (first load)
    isLoading,    // Currently fetching (background or initial)
    isError,
    error,
    isSuccess,
    refetch,
  } = useQuery({
    queryKey: ['user', userId],  // Must be array
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json() as Promise<User>;
    },
    staleTime: 1000 * 60 * 5,  // Consider fresh for 5 min
  });

  if (isPending) return <UserSkeleton />;
  if (isError) return <ErrorMessage error={error} />;

  return <UserCard user={data} />;
}
```

### isPending vs isLoading

```tsx
// isPending: true when there's no cached data
// - Initial load (no cache)
// - After invalidation when cache is cleared

// isLoading: true when actively fetching
// - Initial load
// - Background refetch

// For initial loading states, use isPending
if (isPending) return <Skeleton />;

// For showing loading indicator during refetch
if (isLoading) return <LoadingSpinner />;

// For checking if we have data to show
if (data) return <Content data={data} />;
```

---

## 2. Query Keys

**Rule: Query keys must be arrays and should be hierarchical.**

```tsx
// Simple key
queryKey: ['todos']

// With parameters (hierarchical)
queryKey: ['todos', { status, page }]

// Nested resources
queryKey: ['users', userId, 'posts']
queryKey: ['users', userId, 'posts', postId, 'comments']

// Query key factory pattern (recommended)
const todoKeys = {
  all: ['todos'] as const,
  lists: () => [...todoKeys.all, 'list'] as const,
  list: (filters: Filters) => [...todoKeys.lists(), filters] as const,
  details: () => [...todoKeys.all, 'detail'] as const,
  detail: (id: number) => [...todoKeys.details(), id] as const,
};

// Usage
useQuery({
  queryKey: todoKeys.detail(todoId),
  queryFn: () => fetchTodo(todoId),
});

// Invalidation
queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
```

---

## 3. gcTime (Garbage Collection Time)

**Rule: gcTime replaces cacheTime in v5. Controls how long inactive data stays in cache.**

```tsx
useQuery({
  queryKey: ['user', userId],
  queryFn: fetchUser,
  staleTime: 1000 * 60 * 5,   // Data considered fresh for 5 min
  gcTime: 1000 * 60 * 30,     // Keep in cache for 30 min after last use
});

// staleTime: How long until data is "stale" and needs refetch
// gcTime: How long to keep unused data in memory
```

---

## 4. Mutations with useMutation

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CreateTodoInput {
  title: string;
  completed: boolean;
}

function AddTodo() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (newTodo: CreateTodoInput) => {
      const response = await fetch('/api/todos', {
        method: 'POST',
        body: JSON.stringify(newTodo),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to create todo');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
    onError: (error) => {
      console.error('Failed to create todo:', error);
    },
  });

  const handleSubmit = (data: CreateTodoInput) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Adding...' : 'Add Todo'}
      </button>
    </form>
  );
}
```

---

## 5. Optimistic Updates

**Rule: Use onMutate for optimistic updates, return context for rollback.**

```tsx
const mutation = useMutation({
  mutationFn: updateTodo,

  onMutate: async (newTodo) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['todos', newTodo.id] });

    // Snapshot previous value
    const previousTodo = queryClient.getQueryData(['todos', newTodo.id]);

    // Optimistically update
    queryClient.setQueryData(['todos', newTodo.id], newTodo);

    // Return context with snapshot
    return { previousTodo };
  },

  onError: (err, newTodo, context) => {
    // Rollback on error
    if (context?.previousTodo) {
      queryClient.setQueryData(['todos', newTodo.id], context.previousTodo);
    }
  },

  onSettled: () => {
    // Always refetch after error or success
    queryClient.invalidateQueries({ queryKey: ['todos'] });
  },
});
```

### useMutationState for UI Optimistic Updates

```tsx
import { useMutationState } from '@tanstack/react-query';

function TodoList() {
  const { data: todos } = useQuery({ queryKey: ['todos'], queryFn: fetchTodos });

  // Get pending mutations to show optimistic items
  const pendingTodos = useMutationState({
    filters: { mutationKey: ['addTodo'], status: 'pending' },
    select: (mutation) => mutation.state.variables as Todo,
  });

  return (
    <ul>
      {todos?.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
      {/* Show pending items with loading style */}
      {pendingTodos.map((todo) => (
        <TodoItem key={`pending-${todo.title}`} todo={todo} isPending />
      ))}
    </ul>
  );
}
```

---

## 6. Parallel Queries

**Rule: Multiple useQuery hooks run in parallel automatically.**

```tsx
function Dashboard() {
  // These run in parallel
  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  const statsQuery = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });

  if (usersQuery.isPending || projectsQuery.isPending || statsQuery.isPending) {
    return <DashboardSkeleton />;
  }

  return (
    <div>
      <UserList users={usersQuery.data} />
      <ProjectList projects={projectsQuery.data} />
      <StatsPanel stats={statsQuery.data} />
    </div>
  );
}
```

### useQueries for Dynamic Parallel Queries

```tsx
import { useQueries } from '@tanstack/react-query';

interface UserProfilesProps {
  userIds: number[];
}

function UserProfiles({ userIds }: UserProfilesProps) {
  const userQueries = useQueries({
    queries: userIds.map((id) => ({
      queryKey: ['user', id],
      queryFn: () => fetchUser(id),
    })),
  });

  const isLoading = userQueries.some((query) => query.isPending);
  const users = userQueries.map((query) => query.data).filter(Boolean);

  if (isLoading) return <Loading />;

  return (
    <div>
      {users.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

---

## 7. Dependent Queries

**Rule: Use enabled option to create query dependencies.**

```tsx
interface UserPostsProps {
  userId: number;
}

function UserPosts({ userId }: UserPostsProps) {
  // First query
  const userQuery = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  // Dependent query - only runs when user is loaded
  const postsQuery = useQuery({
    queryKey: ['posts', { authorId: userQuery.data?.id }],
    queryFn: () => fetchPosts(userQuery.data!.id),
    enabled: !!userQuery.data?.id,  // Only run when user.id exists
  });

  if (userQuery.isPending) return <UserSkeleton />;
  if (postsQuery.isPending) return <PostsSkeleton />;

  return (
    <div>
      <UserHeader user={userQuery.data} />
      <PostList posts={postsQuery.data} />
    </div>
  );
}
```

---

## 8. Prefetching

**Rule: Prefetch data before it's needed for instant navigation.**

```tsx
import { useQueryClient } from '@tanstack/react-query';

function TodoList() {
  const queryClient = useQueryClient();

  // Prefetch on hover
  const handleMouseEnter = (todoId: number) => {
    queryClient.prefetchQuery({
      queryKey: ['todo', todoId],
      queryFn: () => fetchTodo(todoId),
      staleTime: 1000 * 60 * 5, // Don't refetch if less than 5 min old
    });
  };

  return (
    <ul>
      {todos.map((todo) => (
        <li
          key={todo.id}
          onMouseEnter={() => handleMouseEnter(todo.id)}
        >
          <Link to={`/todos/${todo.id}`}>{todo.title}</Link>
        </li>
      ))}
    </ul>
  );
}
```

### Prefetch in Router Loaders

```tsx
// With React Router
const router = createBrowserRouter([
  {
    path: '/todos/:id',
    loader: async ({ params }) => {
      // Prefetch or return cached data
      await queryClient.ensureQueryData({
        queryKey: ['todo', params.id],
        queryFn: () => fetchTodo(params.id),
      });
      return null;
    },
    element: <TodoDetail />,
  },
]);
```

---

## 9. Cache Invalidation

```tsx
const queryClient = useQueryClient();

// Invalidate all queries starting with 'todos'
queryClient.invalidateQueries({ queryKey: ['todos'] });

// Invalidate specific query
queryClient.invalidateQueries({ queryKey: ['todos', todoId] });

// Invalidate with predicate
queryClient.invalidateQueries({
  predicate: (query) =>
    query.queryKey[0] === 'todos' &&
    query.state.data?.status === 'active',
});

// Remove from cache entirely
queryClient.removeQueries({ queryKey: ['todos', todoId] });

// Set query data directly
queryClient.setQueryData(['todos', todoId], updatedTodo);
```

---

## 10. Error Handling

```tsx
// Global error handler
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (error.message === 'Unauthorized') {
        // Redirect to login
        window.location.href = '/login';
      }
    },
  }),
});

// Per-query error handling
const { data, error, isError } = useQuery({
  queryKey: ['user', userId],
  queryFn: fetchUser,
  retry: (failureCount, error) => {
    // Don't retry on 404
    if (error.status === 404) return false;
    return failureCount < 3;
  },
});

// With Error Boundary
<QueryErrorResetBoundary>
  {({ reset }) => (
    <ErrorBoundary
      onReset={reset}
      fallbackRender={({ resetErrorBoundary }) => (
        <div>
          <p>Something went wrong</p>
          <button onClick={resetErrorBoundary}>Try again</button>
        </div>
      )}
    >
      <UserProfile userId={userId} />
    </ErrorBoundary>
  )}
</QueryErrorResetBoundary>
```

---

## Best Practices Summary

1. **Always use object syntax** in v5
2. **Use hierarchical query keys** with factory pattern
3. **isPending for initial load**, isLoading for any fetch
4. **gcTime replaces cacheTime** - controls cache garbage collection
5. **enabled option** for dependent queries
6. **Prefetch on hover/route** for instant navigation
7. **Optimistic updates** with onMutate/onError rollback
8. **useMutationState** for showing pending mutations in UI
9. **Invalidate broadly, fetch specifically**
10. **Never use useEffect for data fetching** - use TanStack Query
