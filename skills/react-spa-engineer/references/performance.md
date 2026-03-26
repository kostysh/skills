# Performance Optimization for React SPA

## Core Principle

**Rule: Profile first, optimize second. Premature optimization is counterproductive.**

```tsx
// Measure before optimizing
console.time('expensive operation');
const result = expensiveOperation();
console.timeEnd('expensive operation');

// Use React DevTools Profiler for component render times
// Use browser Performance tab for overall app performance
```

## Performance Triage Order

Apply optimizations in this order:

1. **Eliminate waterfalls first** - parallelize independent async work before touching memoization.
2. **Cut initial bundle cost** - route-level splitting, direct imports, defer non-critical modules.
3. **Protect interaction latency** - use `startTransition` or `useDeferredValue` when typing/filtering drives expensive renders.
4. **Skip off-screen work** - virtualize or use `content-visibility: auto` for long feeds and lists.
5. **Harden client persistence** - prefer Dexie for reload-safe state and local caches; if `localStorage` is unavoidable, keep it minimal, versioned, and failure-tolerant.
6. **Profile before memoization** - `useMemo` and `useCallback` come after the larger wins above.

---

## 1. React.lazy + Suspense for Code Splitting

**Rule: Split code at route level and for large components. Declare lazy components at module level.**

```tsx
import { lazy, Suspense } from 'react';

// CRITICAL: Declare at module level, NOT inside components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const UserProfile = lazy(() => import('./pages/UserProfile'));

// Heavy component that's not always needed
const DataVisualization = lazy(() => import('./components/DataVisualization'));

// Route-based code splitting
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<DashboardSkeleton />}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<SettingsSkeleton />}>
            <Settings />
          </Suspense>
        ),
      },
    ],
  },
]);

// Conditional rendering with lazy
interface AnalyticsPanelProps {
  showCharts: boolean;
}

function AnalyticsPanel({ showCharts }: AnalyticsPanelProps) {
  return (
    <div>
      <h2>Analytics</h2>
      {showCharts && (
        <Suspense fallback={<ChartSkeleton />}>
          <DataVisualization />
        </Suspense>
      )}
    </div>
  );
}
```

### Common Mistake - Declaring Inside Components

```tsx
// WRONG - causes state reset on every parent re-render
function ParentComponent() {
  // This creates a NEW lazy component on each render!
  const ChildComponent = lazy(() => import('./Child'));

  return (
    <Suspense fallback={<Loading />}>
      <ChildComponent />
    </Suspense>
  );
}

// CORRECT - declare at module level
const ChildComponent = lazy(() => import('./Child'));

function ParentComponent() {
  return (
    <Suspense fallback={<Loading />}>
      <ChildComponent />
    </Suspense>
  );
}
```

---

## 2. useMemo - Only After Profiling

**Rule: Use useMemo only for expensive calculations (>1ms). Measure first.**

### When to Use

```tsx
// 1. Expensive calculations
function ProductList({ products, filter }: Props) {
  const filteredProducts = useMemo(() => {
    // Only memoize if this is actually slow (>1ms)
    return products
      .filter((p) => p.category === filter)
      .sort((a, b) => a.price - b.price)
      .slice(0, 100);
  }, [products, filter]);

  return <List items={filteredProducts} />;
}

// 2. Objects passed to memoized children
function Parent() {
  const config = useMemo(
    () => ({
      theme: 'dark',
      locale: 'en',
    }),
    []
  );

  // MemoizedChild won't re-render unnecessarily
  return <MemoizedChild config={config} />;
}

// 3. Values used as Effect dependencies
interface ChatRoomProps {
  roomId: string;
}

function ChatRoom({ roomId }: ChatRoomProps) {
  const options = useMemo(
    () => ({
      serverUrl: 'https://localhost:1234',
      roomId,
    }),
    [roomId]
  );

  useEffect(() => {
    const connection = createConnection(options);
    connection.connect();
    return () => connection.disconnect();
  }, [options]);
}
```

### When NOT to Use

```tsx
// DON'T - trivial calculations
const doubled = useMemo(() => count * 2, [count]);  // Unnecessary!
const doubled = count * 2;  // Just do this

// DON'T - no memoized children benefiting
function Parent() {
  const items = useMemo(() => data.filter(x => x.active), [data]);
  return <RegularChild items={items} />;  // RegularChild re-renders anyway!
}

// DON'T - single "always changing" dependency defeats the purpose
const result = useMemo(
  () => expensiveCalc(input),
  [input]  // If input changes every render, useMemo is pointless
);
```

---

## 3. useCallback - Only for Memoized Children

**Rule: Use useCallback only when passing functions to memo() components.**

### When to Use

```tsx
// 1. Functions passed to memoized children
interface MemoizedButtonProps {
  onClick: () => void;
}

const MemoizedButton = memo(function Button({ onClick }: MemoizedButtonProps) {
  return <button onClick={onClick}>Click</button>;
});

function Parent() {
  // Without useCallback, MemoizedButton re-renders every time Parent renders
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  return <MemoizedButton onClick={handleClick} />;
}

// 2. Functions used as dependencies in other hooks
interface SearchComponentProps {
  query: string;
}

function SearchComponent({ query }: SearchComponentProps) {
  const debouncedSearch = useCallback(
    debounce((q: string) => performSearch(q), 300),
    []
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);
}

// 3. Custom hooks returning functions
function useCounter() {
  const [count, setCount] = useState(0);

  const increment = useCallback(() => setCount((c) => c + 1), []);
  const decrement = useCallback(() => setCount((c) => c - 1), []);

  return { count, increment, decrement };
}
```

### When NOT to Use

```tsx
// DON'T - no memoized children
function Parent() {
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  // Regular component re-renders anyway!
  return <button onClick={handleClick}>Click</button>;
}

// BETTER - just inline it
function Parent() {
  return <button onClick={() => console.log('clicked')}>Click</button>;
}
```

---

## 4. Promise.all for Parallel Requests

**Rule: Use Promise.all when requests are independent.**

```tsx
// WRONG - Sequential (slow)
async function loadDashboard() {
  const users = await fetchUsers();      // Wait...
  const products = await fetchProducts(); // Then wait...
  const orders = await fetchOrders();     // Then wait...
  return { users, products, orders };
}

// CORRECT - Parallel (fast)
async function loadDashboard() {
  const [users, products, orders] = await Promise.all([
    fetchUsers(),
    fetchProducts(),
    fetchOrders(),
  ]);
  return { users, products, orders };
}

// With error handling
async function loadDashboardSafe() {
  const results = await Promise.allSettled([
    fetchUsers(),
    fetchProducts(),
    fetchOrders(),
  ]);

  return {
    users: results[0].status === 'fulfilled' ? results[0].value : [],
    products: results[1].status === 'fulfilled' ? results[1].value : [],
    orders: results[2].status === 'fulfilled' ? results[2].value : [],
  };
}

// In React Router loader
export async function dashboardLoader() {
  const [users, stats, notifications] = await Promise.all([
    queryClient.ensureQueryData({ queryKey: ['users'], queryFn: fetchUsers }),
    queryClient.ensureQueryData({ queryKey: ['stats'], queryFn: fetchStats }),
    queryClient.ensureQueryData({ queryKey: ['notifications'], queryFn: fetchNotifications }),
  ]);

  return { users, stats, notifications };
}
```

---

## 5. startTransition for Non-Urgent Updates

**Rule: Use startTransition for updates that can be interrupted (filtering, tab switching).**

```tsx
import { useState, startTransition } from 'react';

function SearchResults() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Item[]>([]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Urgent: Update input immediately
    setQuery(value);

    // Non-urgent: Can be interrupted
    startTransition(() => {
      const filtered = filterItems(allItems, value);
      setResults(filtered);
    });
  };

  return (
    <div>
      <input value={query} onChange={handleSearch} />
      <ResultsList results={results} />
    </div>
  );
}
```

### useTransition for Pending State

```tsx
import { useState, useTransition } from 'react';

function TabContainer() {
  const [tab, setTab] = useState('home');
  const [isPending, startTransition] = useTransition();

  const handleTabChange = (newTab: string) => {
    startTransition(() => {
      setTab(newTab);
    });
  };

  return (
    <div>
      <TabButtons
        activeTab={tab}
        onTabChange={handleTabChange}
        isPending={isPending}
      />
      <div className={isPending ? 'opacity-50' : ''}>
        <TabContent tab={tab} />
      </div>
    </div>
  );
}
```

---

## 6. useDeferredValue for Expensive Derived Renders

**Rule: When user input drives an expensive derived render, defer the derived value instead of slowing the input path.**

```tsx
import { useDeferredValue, useMemo, useState } from 'react';

function SearchableList({ items }: { items: Item[] }) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const filteredItems = useMemo(
    () => items.filter((item) => fuzzyMatch(item, deferredQuery)),
    [items, deferredQuery]
  );

  const isStale = query !== deferredQuery;

  return (
    <section aria-busy={isStale}>
      <input value={query} onChange={(event) => setQuery(event.target.value)} />
      <ResultsList items={filteredItems} dimmed={isStale} />
    </section>
  );
}
```

Use this for typeahead, client-side filtering, and rich tables where the derived list is expensive. If the work is trivial, do not add deferral machinery.

---

## 7. useShallow for Zustand Selectors

**Rule: Use useShallow when selecting multiple properties to prevent unnecessary re-renders.**

```tsx
import { useShallow } from 'zustand/react/shallow';

// WRONG - Creates new object on every state change
function UserInfo() {
  const { name, email } = useStore((state) => ({
    name: state.name,
    email: state.email,
  }));
  // Re-renders when ANY state changes because object reference changes
}

// CORRECT - Shallow comparison prevents unnecessary re-renders
function UserInfo() {
  const { name, email } = useStore(
    useShallow((state) => ({
      name: state.name,
      email: state.email,
    }))
  );
  // Only re-renders when name or email actually change
}

// ALSO CORRECT - Select individually for single values
function UserName() {
  const name = useStore((state) => state.name);
  // Only re-renders when name changes
}
```

---

## 8. Avoid Barrel Imports

**Rule: Import directly from source files, not index.ts barrels.**

```tsx
// WRONG - Barrel import pulls entire module tree
import { Button, Input, Select } from '@/components';
// This imports ALL components even if you only need Button

// CORRECT - Direct imports enable tree shaking
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Select } from '@/components/Select';

// Project structure that avoids barrel issues
src/
  components/
    Button/
      Button.tsx        # export function Button
      index.ts          # export { Button } from './Button' (optional)
    Input/
      Input.tsx
      index.ts
    // NO components/index.ts barrel file!
```

### When Barrels Are Acceptable

```tsx
// Small, cohesive modules where you typically need everything
// e.g., type definitions
export type { User, Product, Order } from './types';

// Or internal implementation details
// internal/index.ts - only used within the module
```

---

## 9. memo() for Expensive Components

**Rule: Use memo() for components that render often with same props.**

```tsx
import { memo } from 'react';

// Memoize expensive list items
interface TodoItemProps {
  todo: Todo;
}

const TodoItem = memo(function TodoItem({ todo }: TodoItemProps) {
  return (
    <li>
      <span>{todo.title}</span>
      <span>{todo.completed ? 'Done' : 'Pending'}</span>
    </li>
  );
});

// Custom comparison for complex props
const UserCard = memo(
  function UserCard({ user, onSelect }: UserCardProps) {
    return (
      <div onClick={() => onSelect(user.id)}>
        <img src={user.avatar} alt={user.name} />
        <h3>{user.name}</h3>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Return true if props are equal (skip re-render)
    return prevProps.user.id === nextProps.user.id &&
           prevProps.user.avatar === nextProps.user.avatar &&
           prevProps.user.name === nextProps.user.name;
  }
);

// List with memoized items
interface TodoListProps {
  todos: Todo[];
}

function TodoList({ todos }: TodoListProps) {
  return (
    <ul>
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}
```

---

## 10. Virtualization for Long Lists

**Rule: Use virtualization for lists with 100+ items.**

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualListProps {
  items: Item[];
}

function VirtualList({ items }: VirtualListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Estimated row height
    overscan: 5, // Render extra items for smooth scrolling
  });

  return (
    <div
      ref={parentRef}
      style={{ height: '400px', overflow: 'auto' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <ItemRow item={items[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 11. content-visibility for Long Lists

**Rule: If a list is long but virtualization is too heavy or awkward, use CSS `content-visibility` to skip off-screen layout and paint.**

```css
.message-item {
  content-visibility: auto;
  contain-intrinsic-size: 0 80px;
}
```

Use this for feed-like UIs where rows are mostly independent and approximate height is predictable. If row height is highly dynamic or list size is extreme, prefer virtualization.

---

## 12. Resource Hints and Intent Preloading

**Rule: Use resource hints only for resources that are either critical now or highly likely next.**

```tsx
import { preconnect } from 'react-dom';

function AppShell() {
  preconnect('https://api.example.com');

  const preloadDashboard = () => {
    void import('../pages/Dashboard');
  };

  return (
    <nav>
      <a href="/dashboard" onMouseEnter={preloadDashboard} onFocus={preloadDashboard}>
        Dashboard
      </a>
    </nav>
  );
}
```

Use `preconnect` for APIs or CDNs needed immediately. Use preload-on-intent for code-split routes or panels the user is likely to open next. Do not spam hints for low-probability paths.

---

## 13. Client Persistence Hygiene

**Rule: Default to Dexie for reload-safe persistence. Use `localStorage` only for tiny non-sensitive preferences or bootstrap hints.**

Prefer Dexie when any of these are true:
- data is user- or tenant-scoped;
- shape may evolve across releases;
- records need indexes, TTLs, or cleanup by context;
- payload is larger than a few primitive values.

If `localStorage` is still justified, version keys, store minimal fields, and wrap access in `try/catch`.

```tsx
const PREFS_KEY = 'prefs:v2';

export function savePreferences(prefs: { theme: 'light' | 'dark'; language: string }) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // private mode, disabled storage, or quota exceeded
  }
}

export function loadPreferences() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
```

Never persist access tokens, full server payloads, or context-scoped business cache in `localStorage`. Prefer URL state, TanStack Query cache, or Dexie when they match the ownership model better.

---

## 14. Global Event Listener Hygiene

**Rule: Avoid one global listener per component instance. Deduplicate listeners when multiple instances subscribe to the same browser event.**

- Keep the actual `window` or `document` listener shared at module or provider level.
- Use passive listeners for `scroll`, `wheel`, and touch events unless you intentionally call `preventDefault()`.
- Clean listeners up deterministically on unmount.

This matters for keyboard shortcuts, resize listeners, visibility handlers, and scroll-driven UI.

---

## 15. Image Optimization

```tsx
// Lazy loading images
<img
  src={imageUrl}
  alt={description}
  loading="lazy"
  decoding="async"
/>

// Responsive images
<img
  src={image.src}
  srcSet={`
    ${image.small} 480w,
    ${image.medium} 800w,
    ${image.large} 1200w
  `}
  sizes="(max-width: 600px) 480px, (max-width: 1000px) 800px, 1200px"
  alt={description}
/>

// Prevent layout shift with aspect ratio
<div style={{ aspectRatio: '16/9', position: 'relative' }}>
  <img
    src={imageUrl}
    alt={description}
    style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }}
    loading="lazy"
  />
</div>
```

---

## Best Practices Summary

1. **Profile first** - Never optimize without measuring
2. **Parallelize before memoizing** - Kill waterfalls with `Promise.all`
3. **React.lazy at module level** - Never inside components
4. **Protect interaction paths** - `startTransition` / `useDeferredValue` for expensive UI updates
5. **Profile `useMemo` and `useCallback`** - Add only when proven useful
6. **Use `useShallow` for Zustand** - When selecting multiple properties
7. **Avoid barrel imports** - Import directly from source
8. **Use `content-visibility` or virtualization** - Skip off-screen work
9. **Preload only high-likelihood next resources** - Use resource hints sparingly
10. **Use Dexie as the default persistence layer** - Keep `localStorage` narrow, tiny, and non-sensitive
