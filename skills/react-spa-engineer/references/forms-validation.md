# Forms and Validation with React Hook Form and Zod

Use React Hook Form for form state and Zod for client runtime validation in the
fixed stack. Existing projects follow their installed major versions; greenfield
examples below target Zod 4 and the current React Hook Form API.

Unless a block is explicitly labeled copyable, code blocks in this reference
are conceptual and omit project fields, imports, API contracts, and rendering.

Zod 4 migration reference: <https://zod.dev/v4/changelog>

## Native form foundation

Start with real `<form>`, `<label>`, `<input>`, `<select>`, `<textarea>`, and
`<button>` elements. Preserve browser submission semantics, keyboard behavior,
autofill, accessible names, required state, and server validation when adding
React Hook Form or project components.

Do not introduce a custom field widget when the native control or an accepted
project component satisfies the behavior.

## Zod 4 schema and RHF setup

Copyable Zod 4 schema:

```ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email({ error: 'Enter a valid email address' }),
  password: z.string().min(8, { error: 'Use at least eight characters' }),
  terms: z.boolean().refine((accepted) => accepted, {
    error: 'Accept the terms to continue',
  }),
});

export type LoginFormData = z.infer<typeof loginSchema>;
```

Conceptual RHF integration excerpt; project fields and mutation wiring are
intentionally omitted:

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

function LoginForm() {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      terms: false,
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  return (
    <form onSubmit={form.handleSubmit((data) => loginMutation.mutate(data))}>
      {/* Project field components render labels, descriptions and errors. */}
    </form>
  );
}
```

The accepted API input, mutation, accessible field rendering, server errors,
pending UI, and success/failure navigation remain required production
obligations; the compact example does not define them.

For Zod 3 projects, use the installed Zod 3 API and its matching official docs.
Do not paste Zod 4 `error` or top-level format helpers into an unapproved Zod 3
codebase, and do not use removed Zod 3 `errorMap` examples while claiming Zod 4.

## Default values and field identity

- Provide complete `defaultValues` for registered editable fields; avoid
  `undefined` as a controlled value.
- For edit forms, map API data into an explicit editable form model instead of
  passing a broad server entity blindly.
- When authoritative data changes, call `reset(nextValues)` according to an
  accepted dirty-state policy; do not overwrite user edits implicitly.
- In `useFieldArray`, use the generated `field.id` as the React key and the array
  index only in the registered field path.

```tsx
{fields.map((field, index) => (
  <OrderLineFields
    key={field.id}
    index={index}
    register={form.register}
    error={form.formState.errors.items?.[index]}
  />
))}
```

## Input, form, and API contracts

Distinguish three shapes when they differ:

1. DOM input values, usually strings;
2. the validated form model;
3. the accepted API command.

Use Zod coercion or transformations only when their empty, invalid, locale, and
precision behavior matches the product contract. Money and other deterministic
financial rules belong to `financial-calculations-engineer`.

Prefer an authoritative shared schema/type only when the server deliberately
exports a browser-compatible contract. Do not import server-only code into the
client or invent a local domain schema that silently diverges from the accepted
API contract.

Before submission:

- validate the complete editable payload;
- convert it to the exact API command;
- omit fields only when the accepted API contract defines partial semantics;
- keep project transport and typed error parsing under `shared/api`;
- execute the server mutation through TanStack Query.

## Server validation and errors

Client validation improves UX; the server remains authoritative for security,
authorization, uniqueness, concurrency, and business rules.

Map typed API field errors through one shared adapter whose accepted field names
come from the form model. Unknown or root errors remain form-level errors rather
than unsafe casts into arbitrary fields.

```ts
type FieldErrors<TField extends string> = Partial<Record<TField, string>>;

export function applyFieldErrors<TField extends string>(
  setFieldError: (field: TField, message: string) => void,
  errors: FieldErrors<TField>,
): void {
  for (const [field, message] of Object.entries(errors) as Array<
    [TField, string]
  >) {
    setFieldError(field, message);
  }
}
```

Keep any unavoidable boundary assertion inside the adapter and prove it against
the exported API error contract. Do not scatter `as any` or stringly field casts
through screens.

## Submission behavior

- Disable or otherwise guard duplicate submission according to the accepted
  idempotency and UX contract.
- Show pending, success, field-error, root-error, and retry states accessibly.
- Preserve user input after recoverable server failure unless the product
  contract requires clearing it.
- Use the mutation result as authoritative; do not treat optimistic form state
  as server acceptance.
- Navigate only after the accepted success condition and update/invalidate Query
  and Dexie state coherently.

## Accessibility

Every field needs a programmatic name. Connect help and error content with
`aria-describedby`, set `aria-invalid` for actual errors, and announce newly
rendered submission errors. Required markers are owned by the field component,
not embedded inconsistently in label strings.

Custom comboboxes, date pickers, and similar fields must satisfy the complete
component and accessibility contracts; a `Controller` wrapper does not provide
those behaviors.

## Evidence

- Schema tests prove the tested parsing and validation cases.
- Component tests prove local field, keyboard, error, and submission wiring.
- Mocked transport proves only the local client contract.
- A material data-entry flow requires Playwright and browser execution; real
  backend evidence is required for authorization, uniqueness, idempotency, and
  business-rule claims.
