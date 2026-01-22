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

## 6. useShallow for Zustand Selectors

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

## 7. Avoid Barrel Imports

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

## 8. memo() for Expensive Components

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

## 9. Virtualization for Long Lists

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

## 10. Image Optimization

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
2. **React.lazy at module level** - Never inside components
3. **useMemo after profiling** - Only for >1ms calculations
4. **useCallback with memo()** - Only when passing to memoized children
5. **Promise.all for parallel requests** - Don't await sequentially
6. **startTransition for non-urgent** - Filtering, tab switches
7. **useShallow for Zustand** - When selecting multiple properties
8. **Avoid barrel imports** - Import directly from source
9. **memo() for expensive components** - That render with same props
10. **Virtualize long lists** - 100+ items need virtualization
