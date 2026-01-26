# AntD Forms with React Hook Form + Zod

## Table of Contents

- [When to use](#when-to-use)
- [When NOT to use](#when-not-to-use)
- [Alignment with other skills (no duplication)](#alignment-with-other-skills-no-duplication)
- [Setup and integration](#setup-and-integration)
- [Baseline integration pattern (AntD layout, RHF state)](#baseline-integration-pattern-antd-layout-rhf-state)
- [Simple form (RHF + Zod + AntD)](#simple-form-rhf--zod--antd)
- [Complex forms](#complex-forms)
  - [Nested fields](#nested-fields)
  - [Conditional fields](#conditional-fields)
  - [Arrays (useFieldArray)](#arrays-usefieldarray)
- [Form state management](#form-state-management)
  - [State in React Router](#state-in-react-router)
  - [State in local component store](#state-in-local-component-store)
  - [State in IndexedDB (Dexie)](#state-in-indexeddb-dexie)
- [Integrate with TanStack React Query](#integrate-with-tanstack-react-query)
- [Additional use cases](#additional-use-cases)
- [Best practices](#best-practices)
- [Anti-patterns](#anti-patterns)

---

## When to use

Use this reference when you need to build AntD forms with React Hook Form (RHF) and Zod:
- AntD UI components for fields, layout, and validation display.
- RHF as the single source of truth for form state and validation flow.
- Zod for schema validation on client and server.
- Form state persistence (URL, local state, IndexedDB) or API submission via React Query.

## When NOT to use

- If you want AntD Form to own state/validation (use AntD Form only).
- If you are not using RHF + Zod (follow the framework you selected).
- If you need per-component API details (use the antd-components skill).

## Alignment with other skills (no duplication)

Keep this skill consistent with the following:
- react-spa-engineer for RHF and Zod rules (defaultValues, validation modes, setError, useFieldArray key rules, server validation).
- antd-components for component props and API details.
- web-ui-reviewer for accessibility and form UX rules.
- typescript-engineer for Zod patterns and type inference.
- react-spa-engineer for Dexie persistence and React Router patterns.

Do not duplicate those rules here; reference them by skill name when needed.

---

## Setup and integration

Install dependencies (keep aligned with react-spa-engineer stack):

```bash
pnpm add antd @ant-design/icons react-hook-form zod @hookform/resolvers
```

Integration approach (recommended):
- RHF owns form state and validation.
- AntD Form and Form.Item are used for layout and error presentation only.
- Avoid AntD Form field registration (`name`, `rules`) when RHF is in charge.

---

## Baseline integration pattern (AntD layout, RHF state)

Key idea: render AntD layout but handle submit and state via RHF.

```tsx
import { Form, Input, Button } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

type LoginFormData = z.infer<typeof loginSchema>;

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
});

export function LoginForm() {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  return (
    <Form layout="vertical" component={false}>
      <form onSubmit={form.handleSubmit((data) => console.log(data))}>
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Form.Item
              label="Email"
              validateStatus={fieldState.error ? 'error' : ''}
              help={fieldState.error?.message}
            >
              <Input {...field} autoComplete="email" />
            </Form.Item>
          )}
        />

        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Form.Item
              label="Password"
              validateStatus={fieldState.error ? 'error' : ''}
              help={fieldState.error?.message}
            >
              <Input.Password {...field} autoComplete="current-password" />
            </Form.Item>
          )}
        />

        <Button type="primary" htmlType="submit">Log In</Button>
      </form>
    </Form>
  );
}
```

Notes:
- Keep AntD Form from owning state by avoiding `name` and `rules` on Form.Item.
- Use Controller for AntD inputs to ensure correct `value`/`onChange` wiring.
- Use RHF `form.handleSubmit` on the native `<form>` element.

---

## Simple form (RHF + Zod + AntD)

Simple pattern with text input, checkbox, and submit button:

```tsx
import { Form, Input, Checkbox, Button } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

type FormData = z.infer<typeof schema>;

const schema = z.object({
  email: z.string().email(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'Accept terms' }),
  }),
});

export function SimpleSignup() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', acceptTerms: false },
  });

  return (
    <Form layout="vertical" component={false}>
      <form onSubmit={form.handleSubmit((data) => console.log(data))}>
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Form.Item
              label="Email"
              validateStatus={fieldState.error ? 'error' : ''}
              help={fieldState.error?.message}
            >
              <Input {...field} autoComplete="email" spellCheck={false} />
            </Form.Item>
          )}
        />

        <Controller
          name="acceptTerms"
          control={form.control}
          render={({ field, fieldState }) => (
            <Form.Item
              validateStatus={fieldState.error ? 'error' : ''}
              help={fieldState.error?.message}
            >
              <Checkbox
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              >
                Accept terms
              </Checkbox>
            </Form.Item>
          )}
        />

        <Button type="primary" htmlType="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

---

## Complex forms

### Nested fields

Use dot-notation with RHF and a nested Zod schema.

```tsx
const schema = z.object({
  user: z.object({
    name: z.string().min(1),
    address: z.object({
      city: z.string().min(1),
      zip: z.string().min(1),
    }),
  }),
});

<Controller
  name="user.address.city"
  control={form.control}
  render={({ field, fieldState }) => (
    <Form.Item label="City" validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
      <Input {...field} />
    </Form.Item>
  )}
/>
```

### Conditional fields

Show/hide fields based on other values. Consider `shouldUnregister` to remove hidden fields from the payload.

```tsx
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: { hasCompany: false, companyName: '' },
  shouldUnregister: true,
});

const hasCompany = form.watch('hasCompany');

{hasCompany && (
  <Controller
    name="companyName"
    control={form.control}
    render={({ field, fieldState }) => (
      <Form.Item label="Company" validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
        <Input {...field} />
      </Form.Item>
    )}
  />
)}
```

### Arrays (useFieldArray)

Use RHF `useFieldArray` and AntD layout components (not AntD Form.List).

```tsx
import { useFieldArray } from 'react-hook-form';
import { Space, Button, Input } from 'antd';

const schema = z.object({
  contacts: z.array(
    z.object({
      name: z.string().min(1),
      email: z.string().email(),
    })
  ),
});

type FormData = z.infer<typeof schema>;

const { fields, append, remove } = useFieldArray({
  control: form.control,
  name: 'contacts',
});

{fields.map((field, index) => (
  <Space key={field.id} direction="vertical" size="middle">
    <Controller
      name={`contacts.${index}.name`}
      control={form.control}
      render={({ field, fieldState }) => (
        <Form.Item label="Name" validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
          <Input {...field} />
        </Form.Item>
      )}
    />
    <Controller
      name={`contacts.${index}.email`}
      control={form.control}
      render={({ field, fieldState }) => (
        <Form.Item label="Email" validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
          <Input {...field} />
        </Form.Item>
      )}
    />
    <Button onClick={() => remove(index)}>Remove</Button>
  </Space>
))}

<Button onClick={() => append({ name: '', email: '' })}>Add contact</Button>
```

---

## Form state management

### State in React Router

Use URL state for small, non-sensitive drafts only.

```tsx
import { useSearchParams } from 'react-router';

function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delayMs: number
) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const debounced = (...args: TArgs) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };
  return debounced;
}

const [searchParams, setSearchParams] = useSearchParams();

useEffect(() => {
  const saveDraft = debounce((values: FormData) => {
    const next = new URLSearchParams(searchParams);
    next.set('draft', btoa(JSON.stringify(values)));
    setSearchParams(next, { replace: true });
  }, 300);

  const subscription = form.watch((values) => saveDraft(values as FormData));
  return () => {
    subscription.unsubscribe();
    saveDraft.cancel();
  };
}, [form, searchParams, setSearchParams]);
```

Guidance:
- Never put secrets in URL.
- Debounce to reduce history churn.
- Keep payload small and schema-safe.

### State in local component store

Use local state for transient drafts or cross-step wizards.

```tsx
const [draft, setDraft] = useState<FormData | null>(null);

useEffect(() => {
  const sub = form.watch((values) => setDraft(values as FormData));
  return () => sub.unsubscribe();
}, [form]);

useEffect(() => {
  if (draft) form.reset(draft);
}, [draft, form]);
```

### State in IndexedDB (Dexie)

Persist drafts for long-lived or offline forms. Follow react-spa-engineer for Dexie setup.

```tsx
const draft = useLiveQuery(() => db.formDrafts.get(draftId), [draftId]);

useEffect(() => {
  if (draft?.values) form.reset(draft.values);
}, [draft, form]);

useEffect(() => {
  const saveDraft = debounce((values: FormData) => {
    db.formDrafts.put({ id: draftId, values, updatedAt: Date.now() });
  }, 500);

  const sub = form.watch((values) => saveDraft(values as FormData));
  return () => {
    sub.unsubscribe();
    saveDraft.cancel();
  };
}, [form, draftId]);
```

---

## Integrate with TanStack React Query

Use `useMutation` for submit and map server errors to RHF.

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: submitForm,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resource'] }),
  onError: (error: ApiError) => {
    if (error.fieldErrors) {
      Object.entries(error.fieldErrors).forEach(([field, message]) => {
        form.setError(field as keyof FormData, { type: 'server', message });
      });
    }
    if (error.message) {
      form.setError('root.serverError', { type: 'server', message: error.message });
    }
  },
});

const onSubmit = (values: FormData) => mutation.mutate(values);

<form onSubmit={form.handleSubmit(onSubmit)}>
  <Button htmlType="submit" disabled={mutation.isPending}>
    {mutation.isPending ? 'Saving...' : 'Save'}
  </Button>
</form>
```

---

## Additional use cases

| Use case | Recommended pattern | Notes |
| --- | --- | --- |
| Multi-step wizard | One RHF instance + `trigger(fields)` per step | Validate per step, submit once |
| Prefill from API | `useQuery` + `form.reset(data)` | Avoid double defaultValues |
| Async search select | AntD `Select` + debounced search | Disable local filter |
| Dependent fields | `watch` + `setValue` + Zod refine | Use `shouldUnregister` |
| File upload | AntD `Upload` via Controller | Store `fileList` in RHF |
| Date range | Zod `transform` for serialization | Keep `RangePicker` UI |
| Inline row edit | Per-row RHF or single RHF w/ nested fields | Choose by save granularity |
| Batch edit | One form + selected ids | Submit `{ ids, patch }` |
| Autosave drafts | `watch` + debounced persistence | Show saving state |
| Async validation | onBlur server check | Avoid per-keystroke calls |

### Multi-step wizard (AntD Steps + RHF)

Validate the current step before moving forward. Keep one RHF instance and validate a field subset per step.

```tsx
import { Steps, Button } from 'antd';

const steps = [
  { title: 'Account', fields: ['email', 'password'] },
  { title: 'Profile', fields: ['firstName', 'lastName'] },
  { title: 'Confirm', fields: [] },
];

const [current, setCurrent] = useState(0);

const next = async () => {
  const ok = await form.trigger(steps[current].fields as Array<keyof FormData>);
  if (ok) setCurrent((c) => c + 1);
};

return (
  <>
    <Steps current={current} items={steps.map((s) => ({ title: s.title }))} />
    {current < steps.length - 1 && <Button onClick={next}>Next</Button>}
    {current === steps.length - 1 && (
      <Button type="primary" htmlType="submit">Submit</Button>
    )}
  </>
);
```

### Prefill from API (React Query → form.reset)

```tsx
const { data, isPending } = useQuery({
  queryKey: ['profile'],
  queryFn: fetchProfile,
});

useEffect(() => {
  if (data) form.reset(data);
}, [data, form]);
```

### Async search Select (debounced)

Use AntD `Select` with `showSearch` and a debounced query call. Reuse the local `debounce` helper defined above.

```tsx
const [options, setOptions] = useState<Array<{ label: string; value: string }>>([]);

const doSearch = debounce(async (q: string) => {
  const results = await searchUsers(q);
  setOptions(results.map((u) => ({ label: u.name, value: u.id })));
}, 300);

<Controller
  name="assigneeId"
  control={form.control}
  render={({ field, fieldState }) => (
    <Form.Item label="Assignee" validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
      <Select
        {...field}
        showSearch
        onSearch={doSearch}
        options={options}
        filterOption={false}
      />
    </Form.Item>
  )}
/>
```

### Dependent fields (cascades + conditional required)

```tsx
const country = form.watch('country');

useEffect(() => {
  form.setValue('city', '', { shouldValidate: true });
}, [country, form]);
```

For conditional required rules, prefer Zod `refine` and `shouldUnregister: true` (see react-spa-engineer for details).

### File upload (AntD Upload + RHF)

Treat Upload as a controlled component via Controller. Store `fileList` in RHF.

```tsx
<Controller
  name="files"
  control={form.control}
  render={({ field, fieldState }) => (
    <Form.Item label="Attachments" validateStatus={fieldState.error ? 'error' : ''} help={fieldState.error?.message}>
      <Upload
        fileList={field.value ?? []}
        beforeUpload={() => false}
        onChange={({ fileList }) => field.onChange(fileList)}
      >
        <Button>Upload</Button>
      </Upload>
    </Form.Item>
  )}
/>
```

### Date range + transform

AntD `RangePicker` returns Dayjs by default. Serialize via Zod `transform` or map to `Date` in the Controller.

```tsx
import type { Dayjs } from 'dayjs';

const schema = z.object({
  range: z.tuple([z.custom<Dayjs>(), z.custom<Dayjs>()]).transform(([start, end]) => ({
    start: start.toISOString(),
    end: end.toISOString(),
  })),
});
```

### Inline edit in table rows

Pattern choice:
- Per-row RHF: best for independent saves, simpler validation, smaller re-renders.
- Single RHF: best for batch submit and cross-row validation; use nested fields like `rows.${index}.name`.

Tradeoffs:
- Per-row RHF: меньше перерисовок и проще валидация на строку, но сложнее делать проверки между строками.
- Single RHF: удобно для общего submit и кросс-строчных правил, но дороже по производительности и сложнее оптимизировать.

Example (per-row form, can be rendered inside a Table cell/row):

```tsx
import { Input, Button, Space } from 'antd';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';

type Row = { id: string; name: string; email: string };

function EditableRow({ row, onSave }: { row: Row; onSave: (v: Row) => void }) {
  const form = useForm<Row>({ defaultValues: row });

  useEffect(() => {
    form.reset(row);
  }, [row, form]);

  return (
    <form onSubmit={form.handleSubmit(onSave)}>
      <Space>
        <Controller
          name="name"
          control={form.control}
          render={({ field }) => <Input {...field} size="small" />}
        />
        <Controller
          name="email"
          control={form.control}
          render={({ field }) => <Input {...field} size="small" />}
        />
        <Button htmlType="submit" size="small" type="primary">Save</Button>
      </Space>
    </form>
  );
}
```

### Batch edit

Use a top-level form to apply changes to multiple selected rows. The form submits a payload like `{ ids: selectedIds, patch: values }`.

```tsx
import { Select, Button } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { useState } from 'react';

type BatchPatch = { status: 'active' | 'paused' };

const [selectedIds, setSelectedIds] = useState<string[]>([]); // update from table row selection

const form = useForm<BatchPatch>({
  defaultValues: { status: 'active' },
});

const onSubmit = (patch: BatchPatch) => {
  if (!selectedIds.length) return;
  submitBatch({ ids: selectedIds, patch });
};

<form onSubmit={form.handleSubmit(onSubmit)}>
  <Controller
    name="status"
    control={form.control}
    render={({ field }) => (
      <Select
        {...field}
        options={[
          { label: 'Active', value: 'active' },
          { label: 'Paused', value: 'paused' },
        ]}
      />
    )}
  />
  <Button htmlType="submit" disabled={!selectedIds.length}>
    Apply to {selectedIds.length} items
  </Button>
</form>
```

### Autosave drafts + save indicator

Use `form.watch` with a debounced save (see router/dexie patterns above), then show a UI hint:

```tsx
const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

const saveDraft = debounce(async (values: FormData) => {
  setStatus('saving');
  await persist(values);
  setStatus('saved');
}, 500);
```

### Field-level async validation

Use server validation as the source of truth; map errors back via `setError` (see react-spa-engineer). For simple async checks, trigger onBlur and call an API; avoid doing it on every keystroke.

---

## Best practices

- Use RHF as the single source of truth; use AntD Form for layout and error display only.
- Use Controller for AntD components to ensure correct `value`/`onChange` wiring.
- Always provide `defaultValues` and use `mode: 'onBlur'` with `reValidateMode: 'onChange'` (see react-spa-engineer).
- For arrays, use `useFieldArray` with `field.id` as key (see react-spa-engineer).
- Map server-side validation back into RHF `setError` (see react-spa-engineer).
- Apply form accessibility rules (labels, aria, inline errors) per web-ui-reviewer.
- Share Zod schemas across client/server to keep contracts aligned (see typescript-engineer).
- Persist drafts only when needed and avoid sensitive data in URL or IndexedDB.

## Anti-patterns

- Mixing AntD Form state (`name`, `rules`, `form` instance) with RHF state in the same form.
- Using AntD Form.List alongside RHF `useFieldArray`.
- Using uncontrolled AntD inputs without Controller when value wiring is unclear.
- Skipping `defaultValues` or leaving them undefined.
- Using URL persistence for large or sensitive drafts.
- Submitting without disabling the submit button while mutation is pending.
- Relying only on client-side validation (server validation is mandatory).
