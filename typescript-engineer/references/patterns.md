# Patterns Reference

> **Load when:** User asks about error handling, validation, Result types, branded types, or project organization.

Proven patterns for building maintainable TypeScript applications.

## Contents

- [Error Handling](#error-handling)
- [Validation Patterns](#validation-patterns)
- [Branded Types](#branded-types)
- [Project Organization](#project-organization)

---

## Error Handling

### Result Type Pattern

Instead of throwing exceptions, return typed results:

```typescript
// Define Result type
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// Helper functions
function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

// Usage
interface ValidationError {
  field: string;
  message: string;
}

function parseEmail(input: string): Result<string, ValidationError> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(input)) {
    return err({ field: "email", message: "Invalid email format" });
  }

  return ok(input.toLowerCase());
}

// Consuming Result
const result = parseEmail(userInput);

if (result.success) {
  console.log(`Valid email: ${result.data}`);
} else {
  console.error(`Error in ${result.error.field}: ${result.error.message}`);
}
```

### Typed Error Classes

```typescript
// Base application error
abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error types
class NotFoundError extends AppError {
  readonly code = "NOT_FOUND";
  readonly statusCode = 404;

  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`);
  }
}

class ValidationError extends AppError {
  readonly code = "VALIDATION_ERROR";
  readonly statusCode = 400;

  constructor(
    message: string,
    public readonly fields: Record<string, string[]>
  ) {
    super(message);
  }
}

class UnauthorizedError extends AppError {
  readonly code = "UNAUTHORIZED";
  readonly statusCode = 401;

  constructor(message = "Authentication required") {
    super(message);
  }
}

// Type guard for app errors
function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

// Error handler
function handleError(error: unknown): { status: number; body: object } {
  if (isAppError(error)) {
    return {
      status: error.statusCode,
      body: {
        code: error.code,
        message: error.message,
        ...(error instanceof ValidationError && { fields: error.fields })
      }
    };
  }

  console.error("Unexpected error:", error);
  return {
    status: 500,
    body: { code: "INTERNAL_ERROR", message: "Internal server error" }
  };
}
```

---

## Validation Patterns

### Zod Schema Validation

```typescript
import { z } from 'zod';

// Define schemas
const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(0).max(150).optional(),
  role: z.enum(["user", "admin", "moderator"]),
  metadata: z.record(z.string()).optional()
});

// Infer TypeScript type
type User = z.infer<typeof UserSchema>;

// Create DTO schemas
const CreateUserSchema = UserSchema.omit({ id: true });
type CreateUserDto = z.infer<typeof CreateUserSchema>;

const UpdateUserSchema = UserSchema.partial().omit({ id: true });
type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

// Validation functions
function validateCreateUser(data: unknown): Result<CreateUserDto, z.ZodError> {
  const result = CreateUserSchema.safeParse(data);

  if (result.success) {
    return ok(result.data);
  }

  return err(result.error);
}

// Transform Zod errors to user-friendly format
function formatZodError(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }

  return formatted;
}
```

### Single Source of Truth (infer, don't declare)

Prefer deriving types from runtime schemas or source-of-truth definitions to avoid drift:
- Schema-first: define Zod schemas and use `z.infer<typeof Schema>`.
- Database-first: generate types from the database schema/migrations when supported.
- API-first: generate types from RPC or OpenAPI contracts.

This ensures changes to data shape are caught by the compiler everywhere.

### Type-Safe Environment Variables

```typescript
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  REDIS_URL: z.string().url().optional()
});

// Validate on startup
function loadEnv() {
  const result = EnvSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid environment variables:');
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
}

export const env = loadEnv();

// Usage: fully typed
env.PORT;        // number
env.NODE_ENV;    // "development" | "production" | "test"
env.REDIS_URL;   // string | undefined
```

---

## Branded Types

### Nominal Typing with Brands

```typescript
// Branded/Nominal types
declare const EmailBrand: unique symbol;
type Email = string & { readonly [EmailBrand]: true };

declare const UserIdBrand: unique symbol;
type UserId = string & { readonly [UserIdBrand]: true };

declare const PositiveNumberBrand: unique symbol;
type PositiveNumber = number & { readonly [PositiveNumberBrand]: true };

// Validation functions that return branded types
function validateEmail(input: string): Email {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(input)) {
    throw new ValidationError("Invalid email", { email: ["Invalid format"] });
  }
  return input as Email;
}

function validateUserId(input: string): UserId {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(input)) {
    throw new ValidationError("Invalid user ID", { id: ["Must be UUID"] });
  }
  return input as UserId;
}

function validatePositive(input: number): PositiveNumber {
  if (input <= 0) {
    throw new Error("Number must be positive");
  }
  return input as PositiveNumber;
}

// Usage: Functions require validated types
function sendEmail(to: Email, subject: string): void {
  // to is guaranteed to be valid email
}

function getUser(id: UserId): Promise<User> {
  // id is guaranteed to be valid UUID
}

function calculatePrice(quantity: PositiveNumber, price: PositiveNumber): number {
  return quantity * price;
}

// Compiler enforces validation
sendEmail("invalid", "Hello");           // Error: string not assignable to Email
sendEmail(validateEmail("a@b.com"), "Hello"); // OK
```

### Branded Types with Zod

```typescript
import { z } from 'zod';

// Define branded types with Zod
const EmailSchema = z.string().email().brand<'Email'>();
type Email = z.infer<typeof EmailSchema>;

const UserIdSchema = z.string().uuid().brand<'UserId'>();
type UserId = z.infer<typeof UserIdSchema>;

const PositiveSchema = z.number().positive().brand<'Positive'>();
type Positive = z.infer<typeof PositiveSchema>;

// Parse returns branded type
function parseEmail(input: string): Email {
  return EmailSchema.parse(input);
}

function parseUserId(input: string): UserId {
  return UserIdSchema.parse(input);
}
```

---

## Project Organization

### Co-locate Types with Code

Keep types near the modules they describe. Avoid dumping all types into a global `models.ts`.
Co-location reduces dependency tangles and makes refactors safer.

### Feature-Based Structure

```
src/
├── features/
│   ├── users/
│   │   ├── index.ts           # Public exports (barrel)
│   │   ├── user.types.ts      # Types and interfaces
│   │   ├── user.schema.ts     # Zod schemas
│   │   ├── user.service.ts    # Business logic
│   │   ├── user.repository.ts # Data access
│   │   └── __tests__/
│   │       └── user.service.test.ts
│   └── posts/
│       └── ...
├── shared/
│   ├── types/
│   │   ├── result.ts
│   │   └── pagination.ts
│   ├── utils/
│   │   ├── validation.ts
│   │   └── date.ts
│   └── errors/
│       └── app-error.ts
└── config/
    ├── index.ts
    └── env.ts
```

### Boundary Types (internal vs external)

Keep internal/server types separate from external/consumer types. Do not export ORM or
internal models directly to clients. Use DTOs or schema-derived types at API boundaries.

### Barrel Exports

```typescript
// features/users/index.ts
export type { User, CreateUserDto, UpdateUserDto } from './user.types';
export { UserSchema, CreateUserSchema } from './user.schema';
export { UserService } from './user.service';

// Don't export repository (internal detail)
// Don't export internal helper functions

// Usage in other modules
import { User, UserService } from '@/features/users';
```

### Path Aliases

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@features/*": ["src/features/*"],
      "@shared/*": ["src/shared/*"],
      "@config/*": ["src/config/*"]
    }
  }
}
```

### Module Boundaries

```typescript
// Define explicit public API for each module
// features/users/index.ts

// Public types
export type { User, CreateUserDto, UpdateUserDto } from './user.types';

// Public schemas (for validation at boundaries)
export { UserSchema, CreateUserSchema, UpdateUserSchema } from './user.schema';

// Public services
export { UserService } from './user.service';

// Do NOT export:
// - Internal helpers
// - Repository implementation details
// - Private types used only within the module
```
