# TypeScript Patterns for React SPA

React-specific TypeScript guidance. For language/toolchain baselines, follow `typescript-engineer`. If a rule conflicts, `typescript-engineer` wins.

## 1. Strict tsconfig

**Rule: Enable strict mode and additional safety checks.**

```json
{
  "compilerOptions": {
    "target": "ES2024",
    "lib": ["ES2024", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",

    // STRICT MODE - Required
    "strict": true,
    "noUncheckedIndexedAccess": true,  // Critical for array safety
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,

    // Additional safety
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true,

    // Module resolution
    "resolveJsonModule": true,
    "isolatedModules": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

### noUncheckedIndexedAccess Impact

```tsx
// With noUncheckedIndexedAccess: true
const items = ['a', 'b', 'c'];
const first = items[0];  // Type: string | undefined

// You MUST check before using
if (first !== undefined) {
  console.log(first.toUpperCase());  // Safe
}

// Or guard and narrow
const firstValue = items[0];
if (firstValue === undefined) {
  throw new Error('Expected at least one item');
}
console.log(firstValue.toUpperCase());
```

---

## 2. Props Typing with Interfaces

**Rule: Use interfaces for component props by default. Use `type` only when unions/conditional types or utility-derived props make interfaces awkward.**

```tsx
// Correct - Interface for props
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

function Button({
  label,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} btn-${size}`}
    >
      {label}
    </button>
  );
}

// Extending interfaces
interface IconButtonProps extends ButtonProps {
  icon: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

// Omitting and picking
interface CardProps extends Omit<ButtonProps, 'onClick'> {
  title: string;
  onSelect?: () => void;
}

// With children
interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}
```

### Why Interfaces Over Types

```tsx
// Interfaces - can be extended/merged
interface BaseProps {
  id: string;
}

interface ExtendedProps extends BaseProps {
  name: string;
}

// Declaration merging (useful for augmenting libraries)
interface Window {
  myCustomProperty: string;
}

// Types - use for unions and complex types
type Status = 'idle' | 'loading' | 'success' | 'error';
type Handler = () => void | Promise<void>;
```

---

## 3. Generic Components

**Rule: Use generics for reusable components with varying data types.**

```tsx
// Generic List component
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
}

function List<T>({
  items,
  renderItem,
  keyExtractor,
  emptyMessage = 'No items',
}: ListProps<T>) {
  if (items.length === 0) {
    return <p>{emptyMessage}</p>;
  }

  return (
    <ul>
      {items.map((item, index) => (
        <li key={keyExtractor(item)}>{renderItem(item, index)}</li>
      ))}
    </ul>
  );
}

// Usage - TypeScript infers T from items
<List
  items={users}
  renderItem={(user) => <span>{user.name}</span>}
  keyExtractor={(user) => user.id}
/>

// Generic Select component
interface SelectProps<T> {
  options: T[];
  value: T | null;
  onChange: (value: T) => void;
  getLabel: (option: T) => string;
  getValue: (option: T) => string | number;
}

function Select<T>({
  options,
  value,
  onChange,
  getLabel,
  getValue,
}: SelectProps<T>) {
  return (
    <select
      value={value ? String(getValue(value)) : ''}
      onChange={(e) => {
        const selected = options.find(
          (opt) => String(getValue(opt)) === e.target.value
        );
        if (selected) onChange(selected);
      }}
    >
      <option value="">Select...</option>
      {options.map((option) => (
        <option key={getValue(option)} value={getValue(option)}>
          {getLabel(option)}
        </option>
      ))}
    </select>
  );
}
```

### Generic with Constraints

```tsx
interface HasId {
  id: string | number;
}

interface DataTableProps<T extends HasId> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
}

function DataTable<T extends HasId>({
  data,
  columns,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <table>
      <tbody>
        {data.map((item) => (
          <tr key={item.id} onClick={() => onRowClick?.(item)}>
            {columns.map((col) => (
              <td key={col.key}>{col.render(item)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## 4. Hook Typing

### useState

```tsx
// Inferred type
const [count, setCount] = useState(0);  // number

// Explicit type for complex/nullable values
const [user, setUser] = useState<User | null>(null);

// Union types
type Status = 'idle' | 'loading' | 'success' | 'error';
const [status, setStatus] = useState<Status>('idle');

// Arrays
const [items, setItems] = useState<string[]>([]);
const [users, setUsers] = useState<User[]>([]);

// Lazy initialization
const [state, setState] = useState<ComplexState>(() => computeInitialState());
```

### useRef

```tsx
// DOM element refs (null initial value)
const inputRef = useRef<HTMLInputElement>(null);
const divRef = useRef<HTMLDivElement>(null);
const buttonRef = useRef<HTMLButtonElement>(null);

// Using the ref
function focusInput() {
  inputRef.current?.focus();
}

// Mutable refs (value stored across renders)
const countRef = useRef<number>(0);  // Can be mutated: countRef.current = 5

// Ref for storing previous value
const prevValueRef = useRef<string | undefined>(undefined);
useEffect(() => {
  prevValueRef.current = value;
}, [value]);
```

### useReducer

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
  | { type: 'setLoading'; payload: boolean }
  | { type: 'reset' };

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
    case 'reset':
      return initialState;
    default:
      // Exhaustiveness check
      const _exhaustive: never = action;
      return state;
  }
}

const initialState: State = { count: 0, error: null, loading: false };

function Counter() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <button onClick={() => dispatch({ type: 'increment' })}>
      {state.count}
    </button>
  );
}
```

### Custom Hooks

```tsx
// Return tuple
function useToggle(initial: boolean = false): [boolean, () => void] {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue((v) => !v), []);
  return [value, toggle];
}

// Return object
interface UseCounterReturn {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

function useCounter(initial: number = 0): UseCounterReturn {
  const [count, setCount] = useState(initial);

  const increment = useCallback(() => setCount((c) => c + 1), []);
  const decrement = useCallback(() => setCount((c) => c - 1), []);
  const reset = useCallback(() => setCount(initial), [initial]);

  return { count, increment, decrement, reset };
}

// Generic hook
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [stored, setStored] = useState<T>(() => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStored((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        localStorage.setItem(key, JSON.stringify(next));
        return next;
      });
    },
    [key]
  );

  return [stored, setValue];
}
```

---

## 5. Event Types

```tsx
// Mouse events
function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
  console.log(event.clientX, event.clientY);
}

// Change events
function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
  console.log(event.target.value);
}

function handleSelectChange(event: React.ChangeEvent<HTMLSelectElement>) {
  console.log(event.target.value);
}

function handleTextareaChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
  console.log(event.target.value);
}

// Form events
function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
}

// Keyboard events
function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
  if (event.key === 'Enter') {
    // Handle enter
  }
  if (event.key === 'Escape') {
    // Handle escape
  }
}

// Focus events
function handleFocus(event: React.FocusEvent<HTMLInputElement>) {
  event.target.select();
}

function handleBlur(event: React.FocusEvent<HTMLInputElement>) {
  // Validate on blur
}

// Drag events
function handleDragStart(event: React.DragEvent<HTMLDivElement>) {
  event.dataTransfer.setData('text/plain', 'data');
}

// Touch events
function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
  const touch = event.touches[0];
}
```

### Event Handler Props

```tsx
interface InputProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

// Simplified callback types
interface ButtonProps {
  onClick: () => void;  // Simple callback
  onClickWithEvent?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}
```

---

## 6. Zod with z.infer

**Rule: Use Zod schemas as single source of truth for types.**

```tsx
import { z } from 'zod';

// Define schema
const userSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['admin', 'user', 'guest']),
  settings: z.object({
    theme: z.enum(['light', 'dark']),
    notifications: z.boolean(),
  }),
  createdAt: z.string().datetime(),
});

// Extract type
type User = z.infer<typeof userSchema>;
// Equivalent to:
// type User = {
//   id: number;
//   name: string;
//   email: string;
//   role: 'admin' | 'user' | 'guest';
//   settings: {
//     theme: 'light' | 'dark';
//     notifications: boolean;
//   };
//   createdAt: string;
// }

// Use in API calls
async function fetchUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  const data = await response.json();

  // Runtime validation + type narrowing
  return userSchema.parse(data);
}

// Partial types
const userUpdateSchema = userSchema.partial().omit({ id: true, createdAt: true });
type UserUpdate = z.infer<typeof userUpdateSchema>;

// Required subset
const userLoginSchema = userSchema.pick({ email: true }).extend({
  password: z.string().min(8),
});
type UserLogin = z.infer<typeof userLoginSchema>;
```

---

## 7. Utility Types for React

```tsx
// ComponentProps - extract props from component
interface ButtonProps extends React.ComponentProps<'button'> {}
interface InputProps extends React.ComponentProps<'input'> {}
interface DivProps extends React.ComponentProps<'div'> {}

// Extend native element props
interface CustomButtonProps extends React.ComponentProps<'button'> {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
}

// PropsWithChildren
interface CardProps {
  title: string;
}

function Card({ title, children }: React.PropsWithChildren<CardProps>) {
  return (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  );
}

// HTMLAttributes for div-like components
interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: number;
}

function Box({ padding, className, ...props }: BoxProps) {
  return (
    <div
      className={className}
      style={{ padding }}
      {...props}
    />
  );
}

// Polymorphic components with "as" prop
type AsProp<C extends React.ElementType> = {
  as?: C;
};

type PropsToOmit<C extends React.ElementType, P> = keyof (AsProp<C> & P);

type PolymorphicProps<
  C extends React.ElementType,
  Props = {}
> = React.PropsWithChildren<Props & AsProp<C>> &
  Omit<React.ComponentPropsWithoutRef<C>, PropsToOmit<C, Props>>;

interface TextProps {
  color?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

function Text<C extends React.ElementType = 'span'>({
  as,
  color,
  size,
  children,
  ...props
}: PolymorphicProps<C, TextProps>) {
  const Component = as || 'span';
  return <Component {...props}>{children}</Component>;
}

// Usage
<Text>Default span</Text>
<Text as="p">Paragraph</Text>
<Text as="h1" size="lg">Heading</Text>
<Text as={Link} to="/home">Link</Text>
```

---

## Best Practices Summary

1. **Enable strict mode** in tsconfig with `noUncheckedIndexedAccess`
2. **Use interfaces** for component props (extendable, mergeable)
3. **Use generics** for reusable components with varying data types
4. **Type useState** explicitly for complex/nullable values
5. **Type useRef** with element type and null: `useRef<HTMLInputElement>(null)`
6. **Use discriminated unions** for action types in reducers
7. **Return tuples or objects** from custom hooks with explicit types
8. **Use React event types**: `React.MouseEvent`, `React.ChangeEvent`, etc.
9. **z.infer<typeof schema>** - Single source of truth from Zod
10. **ComponentProps** - Extract and extend native element props
