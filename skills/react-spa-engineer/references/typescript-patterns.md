# TypeScript Patterns for React SPA

This reference covers React-specific typing. `typescript-engineer` owns TypeScript
language, compiler, tsconfig, module-resolution, Biome, and ESLint decisions.

Inspect the repository's installed TypeScript/React versions and config before
using a snippet. Do not replace project compiler settings with a portable
example.

Unless a block is explicitly labeled copyable, code blocks in this reference
are conceptual and omit project imports, runtime validation, and error behavior.

## Props and native elements

Use an interface or type alias that expresses the shape clearly and follows the
repository convention. Interfaces are useful for extension; type aliases are
useful for unions, intersections, mapped types, and utility-derived props.

```tsx
type ButtonProps = React.ComponentPropsWithoutRef<'button'> & {
  variant?: 'primary' | 'secondary';
  pending?: boolean;
};

function Button({ variant = 'primary', pending, children, ...props }: ButtonProps) {
  return (
    <button {...props} aria-busy={pending || undefined} disabled={pending || props.disabled}>
      {children}
    </button>
  );
}
```

Do not narrow native props accidentally when wrapping an element. Reusable
polymorphic/forwarded-ref APIs belong to `react-components-engineer` when their
correctness is the primary task.

## State and reducers

Let inference handle simple non-null initial state. Provide explicit types for
nullable values, empty collections, discriminated unions, or lazy
initialization.

```tsx
type LoadState<T> =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

const [selection, setSelection] = useState<string | null>(null);
const [items, setItems] = useState<Item[]>([]);
```

Reducers are pure and exhaustive. Use functional state updates when the next
value depends on the previous value; never mutate state in place.

```ts
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'selected':
      return { ...state, selectedId: action.id };
    case 'cleared':
      return { ...state, selectedId: null };
    default: {
      const neverAction: never = action;
      return neverAction;
    }
  }
}
```

## Refs

```tsx
const inputRef = useRef<HTMLInputElement>(null);
const latestRequestId = useRef<string | null>(null);
```

DOM refs start at `null` and are checked before use. A ref is appropriate for a
mutable value that does not drive rendering; do not use it to hide state that the
UI must observe.

## Events

Prefer contextual inference for inline handlers. Use React event types for named
handlers:

```tsx
function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
}

function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
  setValue(event.currentTarget.value);
}
```

Use `currentTarget` for the element on which the handler is registered. Preserve
native form/button semantics rather than manually recreating them with generic
div events.

## Generic UI helpers

Use generics when one component genuinely preserves a relationship between its
inputs and callbacks:

```tsx
interface ListProps<T> {
  items: readonly T[];
  getKey: (item: T) => React.Key;
  renderItem: (item: T) => React.ReactNode;
}

function List<T>({ items, getKey, renderItem }: ListProps<T>) {
  return <ul>{items.map((item) => <li key={getKey(item)}>{renderItem(item)}</li>)}</ul>;
}
```

Do not introduce a generic abstraction for a single call site or erase domain
constraints to make an API look reusable.

## Runtime schemas and API data

Zod runtime validation narrows unknown data. Type inference alone does not
validate a response.

```ts
const userSchema = z.object({
  id: z.string(),
  displayName: z.string(),
});

export type User = z.infer<typeof userSchema>;

export function parseUser(input: unknown): User {
  return userSchema.parse(input);
}
```

Project transport and raw response parsing remain under `shared/api`; components
do not call `fetch` merely to demonstrate the type. Reuse an authoritative
browser-compatible schema when deliberately exported by the backend contract;
otherwise keep client parsing mapped to that contract and test for drift.

## Persistence typing

Do not use a generic `useLocalStorage<T>` that trusts `JSON.parse` and bypasses
the fixed persistence architecture. Approved tiny preferences need explicit
schema/version validation and guarded storage access. Structured, scoped, or
evolving durable data belongs in typed Dexie tables.

Types do not make browser storage safe, current, or authorized.

## Strictness and assertions

- Keep `strict` and repository safety flags effective; do not silence a
  diagnostic with broad `any`, double assertions, or unchecked non-null
  assertions.
- With `noUncheckedIndexedAccess`, prove indexed values exist before use.
- With `exactOptionalPropertyTypes`, distinguish absent from explicitly
  `undefined` according to the public contract.
- Any unavoidable boundary assertion stays narrow, documented, and protected by
  runtime validation or an exact test.

## Evidence

Run the repository's real TypeScript command and confirm it includes the affected
project rather than an empty or partial solution. Typecheck success proves the
checked type contour only; it does not prove React behavior, Zod parsing,
transport, persistence, accessibility, or the integrated SPA flow.
