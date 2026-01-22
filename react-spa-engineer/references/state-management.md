# State Management for React SPA

## State Hierarchy (local to global)

```
Local State (useState)
    ↓
Complex Local State (useReducer)
    ↓
Lifted State (props drilling)
    ↓
Cross-cutting State (Context API)
    ↓
Global Client State (Zustand)
```

**Persistence is orthogonal**: persist only what improves UX. Prefer IndexedDB (Dexie) for structured/offline data; use localStorage/sessionStorage only for small settings.

---

## 1. useState - Local State

**Rule: Use for simple, component-scoped state.**

```tsx
// Basic usage
const [count, setCount] = useState(0);
const [name, setName] = useState('');
const [items, setItems] = useState<string[]>([]);

// With type inference
const [user, setUser] = useState<User | null>(null);
```

### Critical Rules

```tsx
// 1. Use updater function for state based on previous value
function handleClick() {
  setCount(prev => prev + 1);  // Correct
  setCount(prev => prev + 1);  // Both will apply
  setCount(prev => prev + 1);  // Result: +3
}

// Wrong - only results in +1
function handleClickWrong() {
  setCount(count + 1);
  setCount(count + 1);
  setCount(count + 1);
}

// 2. Never mutate state directly
// Wrong
obj.x = 10;
setObj(obj);

// Correct - create new object
setObj({ ...obj, x: 10 });

// 3. Lazy initialization for expensive computations
// Wrong - runs every render
const [data, setData] = useState(expensiveComputation());

// Correct - runs only on mount
const [data, setData] = useState(() => expensiveComputation());

// 4. State updates are not immediate
function handleClick() {
  setName('Robin');
  console.log(name); // Still old value!

  // Correct approach
  const nextName = 'Robin';
  setName(nextName);
  console.log(nextName); // Correct
}
```

---

## 2. useReducer - Complex Local State

**Rule: Use when state logic is complex or multiple values are related.**

```tsx
interface State {
  count: number;
  error: string | null;
  loading: boolean;
}

type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'setError'; payload: string }
  | { type: 'setLoading'; payload: boolean };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + 1 };
    case 'decrement':
      return { ...state, count: state.count - 1 };
    case 'setError':
      return { ...state, error: action.payload };
    case 'setLoading':
      return { ...state, loading: action.payload };
    default:
      throw new Error(`Unknown action type`);
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, {
    count: 0,
    error: null,
    loading: false,
  });

  return (
    <button onClick={() => dispatch({ type: 'increment' })}>
      Count: {state.count}
    </button>
  );
}
```

### Critical Rules

```tsx
// 1. Reducer must be pure - no side effects
// Wrong
function reducer(state, action) {
  fetch('/api/update');  // Side effect!
  return { ...state, count: state.count + 1 };
}

// 2. Never mutate state
// Wrong
function reducer(state, action) {
  state.items.push(action.payload);  // Mutation!
  return state;
}

// Correct
function reducer(state, action) {
  return {
    ...state,
    items: [...state.items, action.payload],
  };
}

// 3. Always spread existing state
// Wrong - loses other fields
case 'increment':
  return { count: state.count + 1 };

// Correct
case 'increment':
  return { ...state, count: state.count + 1 };

// 4. Lazy initialization
const [state, dispatch] = useReducer(
  reducer,
  initialArg,
  createInitialState  // Function, not function call
);
```

---

## 3. Context API - Cross-cutting Data

**Rule: Use for data needed by many components at different nesting levels (auth, theme, locale).**

```tsx
// 1. Create context with type
interface AuthContextType {
  user: User | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// 2. Create provider component
interface AuthProviderProps {
  children: React.ReactNode;
}

function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (credentials: Credentials) => {
    const response = await authApi.login(credentials);
    setUser(response.user);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  // Memoize value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({ user, login, logout }),
    [user, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. Create custom hook with error handling
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// 4. Usage
function UserProfile() {
  const { user, logout } = useAuth();

  if (!user) return <LoginPrompt />;

  return (
    <div>
      <p>Welcome, {user.name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Theme Context Example

```tsx
type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
}

function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>('light');

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

### Critical Rules for Context

```tsx
// 1. Provider must be ABOVE consumers
// Wrong - MyComponent can't access context
function App() {
  return (
    <MyComponent>
      <ThemeContext.Provider value="dark">
        {/* ... */}
      </ThemeContext.Provider>
    </MyComponent>
  );
}

// Correct
function App() {
  return (
    <ThemeContext.Provider value="dark">
      <MyComponent />
    </ThemeContext.Provider>
  );
}

// 2. Memoize context value to prevent re-renders
// Wrong - new object on every render
<AuthContext.Provider value={{ user, login, logout }}>

// Correct
const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
<AuthContext.Provider value={value}>

// 3. Separate frequently changing values
// Wrong - every consumer re-renders on any change
const value = { user, settings, notifications, ... };

// Better - split into separate contexts
<UserContext.Provider value={user}>
  <SettingsContext.Provider value={settings}>
    {children}
  </SettingsContext.Provider>
</UserContext.Provider>
```

---

## 4. Zustand - Global Client State

**Rule: Use for global state that doesn't fit Context (complex, frequently updated, or accessed in many places).**

### Critical: TypeScript with create<T>()()

```tsx
import { create } from 'zustand';

interface BearState {
  bears: number;
  increasePopulation: () => void;
  removeAllBears: () => void;
  updateBears: (newBears: number) => void;
}

// CRITICAL: Use curried syntax create<T>()() for TypeScript
const useBearStore = create<BearState>()((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
  updateBears: (newBears) => set({ bears: newBears }),
}));
```

### Using Selectors

```tsx
// Select specific state to avoid unnecessary re-renders
function BearCounter() {
  const bears = useBearStore((state) => state.bears);
  return <h1>{bears} bears around here</h1>;
}

function Controls() {
  const increasePopulation = useBearStore((state) => state.increasePopulation);
  return <button onClick={increasePopulation}>Add bear</button>;
}
```

### useShallow for Multiple Selections

```tsx
import { useShallow } from 'zustand/react/shallow';

// CRITICAL: Use useShallow when selecting multiple properties
function BearInfo() {
  // Without useShallow - re-renders on ANY state change
  // const { bears, fish } = useBearStore((state) => ({
  //   bears: state.bears,
  //   fish: state.fish
  // }));

  // With useShallow - only re-renders when bears or fish change
  const { bears, fish } = useBearStore(
    useShallow((state) => ({ bears: state.bears, fish: state.fish }))
  );

  return <p>{bears} bears eating {fish} fish</p>;
}
```

### Async Actions

```tsx
interface TodoState {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  fetchTodos: () => Promise<void>;
  addTodo: (text: string) => Promise<void>;
}

const useTodoStore = create<TodoState>()((set, get) => ({
  todos: [],
  loading: false,
  error: null,

  fetchTodos: async () => {
    set({ loading: true, error: null });
    try {
      const todos = await api.getTodos();
      set({ todos, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch todos', loading: false });
    }
  },

  addTodo: async (text) => {
    const optimisticTodo = { id: Date.now(), text, completed: false };

    // Optimistic update
    set((state) => ({ todos: [...state.todos, optimisticTodo] }));

    try {
      const newTodo = await api.createTodo(text);
      // Replace optimistic with real
      set((state) => ({
        todos: state.todos.map((t) =>
          t.id === optimisticTodo.id ? newTodo : t
        ),
      }));
    } catch (error) {
      // Rollback on error
      set((state) => ({
        todos: state.todos.filter((t) => t.id !== optimisticTodo.id),
        error: 'Failed to add todo',
      }));
    }
  },
}));
```

---

## 5. Persistence (LocalStorage vs IndexedDB)

**Rule: Persist deliberately. Keep server state in TanStack Query; persist client state and offline data when it improves UX.**

**Use localStorage/sessionStorage when:**
- Small key-value settings (theme, locale, last tab)
- No offline requirements
- Data size is tiny and simple

**Use IndexedDB (Dexie) when:**
- Structured data, collections, or indexes are needed
- Data size exceeds localStorage limits
- Offline-first or reliable persistence matters
- UI should react to data changes

**Reference**: See [IndexedDB Persistence](indexeddb-persistence.md) for Dexie schemas, `useLiveQuery`, and offline patterns.

---

## State Selection Guidelines

| Scenario | Solution |
|----------|----------|
| Single component, simple value | `useState` |
| Single component, complex logic | `useReducer` |
| Few components, parent-child | Lift state + props |
| Auth, theme, locale | Context API |
| Many components, frequent updates | Zustand |
| Server data | TanStack Query (see data-fetching.md) |
| Offline or structured persistence | IndexedDB (Dexie) + `useLiveQuery` |
