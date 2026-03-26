# Forms and Validation in React SPA

## React Hook Form + Zod Integration

**Rule: Use React Hook Form for form state, Zod for schema validation.**

### Setup

```bash
pnpm add react-hook-form zod @hookform/resolvers
```

---

## 1. Basic Form with Zod Schema

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// 1. Define Zod schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// 2. Infer TypeScript type from schema
type LoginFormData = z.infer<typeof loginSchema>;

// 3. Create form component
function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',           // Validate on blur
    reValidateMode: 'onChange', // Re-validate on change after error
  });

  const onSubmit = async (data: LoginFormData) => {
    await loginUser(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          {...register('email')}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <span id="email-error" role="alert">
            {errors.email.message}
          </span>
        )}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          {...register('password')}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
        />
        {errors.password && (
          <span id="password-error" role="alert">
            {errors.password.message}
          </span>
        )}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Log In'}
      </button>
    </form>
  );
}
```

---

## 2. Validation Modes: "Reward Early, Punish Late"

**Rule: Use `mode: 'onBlur'` with `reValidateMode: 'onChange'`.**

```tsx
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: { ... },

  // "Punish late" - don't show errors until user leaves field
  mode: 'onBlur',

  // "Reward early" - clear errors as soon as user fixes them
  reValidateMode: 'onChange',
});
```

### Mode Options

| Mode | When Validation Triggers |
|------|--------------------------|
| `onSubmit` | On form submit only (default) |
| `onBlur` | When user leaves field |
| `onChange` | On every keystroke (performance impact) |
| `onTouched` | First blur, then on change |
| `all` | Both blur and change |

---

## 3. defaultValues Requirement

**Rule: Always provide defaultValues. Never use undefined.**

```tsx
// Correct - all fields have defaults
useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: {
    name: '',
    email: '',
    age: 0,
    items: [],
    settings: {
      notifications: true,
      theme: 'light',
    },
  },
});

// Wrong - undefined causes issues with controlled components
useForm<FormData>({
  defaultValues: {
    name: undefined,  // Don't do this!
  },
});

// Async default values
useForm<FormData>({
  defaultValues: async () => {
    const user = await fetchUser();
    return {
      name: user.name,
      email: user.email,
    };
  },
});
```

---

## 4. Zod Schema Patterns

### Basic Types

```tsx
const schema = z.object({
  // Strings
  name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  url: z.string().url('Invalid URL'),

  // Numbers
  age: z.number().min(0).max(150),
  price: z.number().positive('Must be positive'),

  // Boolean
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms' }),
  }),

  // Enums
  role: z.enum(['admin', 'user', 'guest']),

  // Optional fields
  nickname: z.string().optional(),
  bio: z.string().nullable(),

  // Arrays
  tags: z.array(z.string()).min(1, 'Add at least one tag'),

  // Objects
  address: z.object({
    street: z.string(),
    city: z.string(),
    zip: z.string(),
  }),
});
```

### z.infer for Type Extraction

```tsx
const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'user']),
});

// Extract TypeScript type
type User = z.infer<typeof userSchema>;
// Equivalent to:
// type User = {
//   id: number;
//   name: string;
//   email: string;
//   role: 'admin' | 'user';
// }
```

### refine for Custom Validation

```tsx
const passwordSchema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'], // Error shows on this field
  }
);

// Multiple refinements
const dateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
}).refine(
  (data) => data.endDate > data.startDate,
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
).refine(
  (data) => data.startDate >= new Date(),
  {
    message: 'Start date cannot be in the past',
    path: ['startDate'],
  }
);
```

### transform for Data Transformation

```tsx
const formSchema = z.object({
  // Trim whitespace
  name: z.string().transform((val) => val.trim()),

  // Convert string to number
  age: z.string().transform((val) => parseInt(val, 10)),

  // Convert to lowercase
  email: z.string().email().transform((val) => val.toLowerCase()),

  // Parse date string
  birthDate: z.string().transform((val) => new Date(val)),
});

// Chain refine after transform
const priceSchema = z.string()
  .transform((val) => parseFloat(val))
  .refine((val) => !isNaN(val), 'Must be a valid number')
  .refine((val) => val > 0, 'Must be positive');
```

---

## 5. useFieldArray for Dynamic Fields

**Critical Rule: Use `key={field.id}`, NOT `key={index}`.**

```tsx
import { useForm, useFieldArray } from 'react-hook-form';

const schema = z.object({
  items: z.array(
    z.object({
      name: z.string().min(1, 'Required'),
      quantity: z.number().min(1),
    })
  ).min(1, 'Add at least one item'),
});

type FormData = z.infer<typeof schema>;

function OrderForm() {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      items: [{ name: '', quantity: 1 }],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'items',
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {fields.map((field, index) => (
        // CRITICAL: Use field.id as key, NOT index
        <div key={field.id}>
          <input
            {...register(`items.${index}.name`)}
            placeholder="Item name"
          />
          {errors.items?.[index]?.name && (
            <span role="alert">{errors.items[index]?.name?.message}</span>
          )}

          <input
            type="number"
            {...register(`items.${index}.quantity`, { valueAsNumber: true })}
          />

          <button type="button" onClick={() => remove(index)}>
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => append({ name: '', quantity: 1 })}
      >
        Add Item
      </button>

      <button type="submit">Submit</button>
    </form>
  );
}
```

### Why field.id is Required

```tsx
// Wrong - causes re-render issues and lost input
{fields.map((field, index) => (
  <div key={index}>  {/* DON'T DO THIS */}
    <input {...register(`items.${index}.name`)} />
  </div>
))}

// Correct - maintains field identity across re-renders
{fields.map((field, index) => (
  <div key={field.id}>  {/* ALWAYS USE field.id */}
    <input {...register(`items.${index}.name`)} />
  </div>
))}
```

---

## 6. Server-Side Validation

**Rule: Server validation is mandatory. Never trust client-side validation alone.**

```tsx
import { useMutation } from '@tanstack/react-query';

function RegistrationForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: registerUser,
    onError: (error: ApiError) => {
      // Set server errors on specific fields
      if (error.fieldErrors) {
        Object.entries(error.fieldErrors).forEach(([field, message]) => {
          form.setError(field as keyof FormData, {
            type: 'server',
            message,
          });
        });
      }

      // Set root-level error
      if (error.message) {
        form.setError('root.serverError', {
          type: 'server',
          message: error.message,
        });
      }
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Field inputs */}

      {/* Show server error */}
      {form.formState.errors.root?.serverError && (
        <div role="alert" className="error">
          {form.formState.errors.root.serverError.message}
        </div>
      )}

      <button type="submit" disabled={mutation.isPending}>
        Register
      </button>
    </form>
  );
}
```

### Revalidate Same Schema on Server

```tsx
// shared/schemas/user.ts - Use same schema on client AND server
export const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Server (API route or action)
async function handleRegistration(formData: unknown) {
  const result = userSchema.safeParse(formData);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    };
  }

  // Proceed with validated data
  const user = await createUser(result.data);
  return { success: true, user };
}
```

---

## 7. Controlled Components with Controller

```tsx
import { Controller } from 'react-hook-form';
import { DatePicker } from '@/components/ui/datepicker';

function EventForm() {
  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: null,
      category: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="date"
        control={control}
        render={({ field, fieldState }) => (
          <DatePicker
            selected={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        name="category"
        control={control}
        render={({ field, fieldState }) => (
          <Select
            {...field}
            options={categoryOptions}
            error={fieldState.error?.message}
          />
        )}
      />
    </form>
  );
}
```

---

## 8. Form Reset and Watch

```tsx
interface EditUserFormProps {
  user: User;
}

function EditUserForm({ user }: EditUserFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: user,
  });

  // Watch specific field
  const watchedEmail = form.watch('email');

  // Watch all fields
  const watchAll = form.watch();

  // Reset to initial values
  const handleCancel = () => {
    form.reset();
  };

  // Reset to new values
  const handleResetToNew = (newData: FormData) => {
    form.reset(newData);
  };

  // Reset specific field
  const handleResetField = () => {
    form.resetField('email');
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* ... */}
      <button type="button" onClick={handleCancel}>
        Cancel
      </button>
    </form>
  );
}
```

---

## Best Practices Summary

1. **React Hook Form + Zod** - Always use together
2. **mode: 'onBlur', reValidateMode: 'onChange'** - "Reward early, punish late"
3. **defaultValues required** - Never use undefined
4. **useFieldArray with key={field.id}** - Never use index as key
5. **z.infer<typeof schema>** - Extract types from schemas
6. **refine for cross-field validation** - Password confirmation, date ranges
7. **transform for data parsing** - String to number, trim whitespace
8. **Server validation mandatory** - Reuse Zod schemas server-side
9. **setError for server errors** - Map API errors to form fields
10. **Controller for custom components** - DatePickers, Select, etc.
