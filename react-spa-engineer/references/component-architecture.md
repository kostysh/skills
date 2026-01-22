# Component Architecture Rules for React SPA

## 1. Functional Components Only

**Rule: Use functional components exclusively. Class components are only allowed for ErrorBoundary.**

```tsx
// Correct - Functional component
function MyButton() {
  return <button>Click me</button>;
}

// Correct - Arrow function component
const MyButton = () => {
  return <button>Click me</button>;
};

// Only exception - ErrorBoundary must be a class
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    logErrorToService(error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
```

## 2. PascalCase Naming Convention

**Rule: Component names MUST start with capital letter (PascalCase). HTML tags use lowercase.**

```tsx
// Correct
<MyButton />
<UserProfile />
<ShoppingCart />

// Incorrect - treated as HTML tag
<myButton />
<userProfile />
```

## 3. Props Through TypeScript Interfaces

**Rule: Define component props using TypeScript interfaces. Use `type` only for complex unions/utility-derived props.**

```tsx
// Correct - Interface for props
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

function Button({ label, onClick, disabled = false, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled} className={variant}>
      {label}
    </button>
  );
}

// Correct - Extending interfaces
interface IconButtonProps extends ButtonProps {
  icon: React.ReactNode;
}
```

## 4. One Component Per File

**Rule: Each component should be in its own file. Export as default or named export consistently.**

```
src/
  components/
    Button/
      Button.tsx        # Main component
      Button.test.tsx   # Tests
      index.ts          # Re-export
    UserCard/
      UserCard.tsx
      UserCard.test.tsx
      index.ts
```

```tsx
// Button/Button.tsx
interface ButtonProps {
  label: string;
}

export function Button({ label }: ButtonProps) {
  return <button>{label}</button>;
}

// Button/index.ts
export { Button } from './Button';
```

## 5. Children Pattern

**Rule: Use children prop for component composition.**

```tsx
interface CardProps {
  children: React.ReactNode;
  title?: string;
}

function Card({ children, title }: CardProps) {
  return (
    <div className="card">
      {title && <h2>{title}</h2>}
      <div className="card-content">
        {children}
      </div>
    </div>
  );
}

// Usage
<Card title="User Info">
  <p>Name: John</p>
  <p>Email: john@example.com</p>
</Card>
```

## 6. Render Props Pattern

**Rule: Use render props when children need access to internal state/logic.**

```tsx
interface MouseTrackerProps {
  render: (position: { x: number; y: number }) => React.ReactNode;
}

function MouseTracker({ render }: MouseTrackerProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    setPosition({ x: e.clientX, y: e.clientY });
  };

  return (
    <div onMouseMove={handleMouseMove}>
      {render(position)}
    </div>
  );
}

// Usage
<MouseTracker
  render={({ x, y }) => (
    <p>Mouse position: {x}, {y}</p>
  )}
/>
```

## 7. Compound Components Pattern

**Rule: Use compound components for complex UI that shares implicit state.**

```tsx
// Context for shared state
const SelectContext = createContext<{
  value: string;
  onChange: (value: string) => void;
} | null>(null);

// Parent component
interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}

function Select({ value, onChange, children }: SelectProps) {
  return (
    <SelectContext.Provider value={{ value, onChange }}>
      <div className="select" role="listbox">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

// Child component
interface OptionProps {
  value: string;
  children: React.ReactNode;
}

function Option({ value, children }: OptionProps) {
  const context = useContext(SelectContext);
  if (!context) throw new Error('Option must be used within Select');

  const isSelected = context.value === value;

  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={() => context.onChange(value)}
      className={isSelected ? 'selected' : ''}
    >
      {children}
    </div>
  );
}

// Attach child to parent
Select.Option = Option;

// Usage
<Select value={selected} onChange={setSelected}>
  <Select.Option value="apple">Apple</Select.Option>
  <Select.Option value="banana">Banana</Select.Option>
  <Select.Option value="cherry">Cherry</Select.Option>
</Select>
```

## 8. Lifting State Up

**Rule: Share state between siblings by moving it to their common parent.**

```tsx
interface CounterProps {
  count: number;
  onClick: () => void;
}

function Counter({ count, onClick }: CounterProps) {
  return (
    <button onClick={onClick}>
      Clicked {count} times
    </button>
  );
}

function App() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(count + 1);
  };

  return (
    <div>
      {/* Both counters share the same state */}
      <Counter count={count} onClick={handleClick} />
      <Counter count={count} onClick={handleClick} />
    </div>
  );
}
```

## Best Practices Summary

1. **Always use functional components** (except ErrorBoundary)
2. **Name components in PascalCase**
3. **Define props with TypeScript interfaces**
4. **One component per file**
5. **Use children for composition**
6. **Use render props for shared behavior with custom rendering**
7. **Use compound components for related UI elements**
8. **Lift state up for shared state between siblings**
