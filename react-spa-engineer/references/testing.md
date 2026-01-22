# Testing React SPA

## Stack: Vitest + React Testing Library

**Rule: Use Vitest for test runner, React Testing Library for component testing, Playwright for E2E.**

### Setup

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
});
```

```ts
// src/test/setup.ts
import '@testing-library/jest-dom';
```

---

## 1. Query Priority (Most Important First)

**Rule: Query by how users interact with your app, not implementation details.**

### Priority Order

| Priority | Query | When to Use |
|----------|-------|-------------|
| 1 | `getByRole` | Almost always - accessible to everyone |
| 2 | `getByLabelText` | Form fields with labels |
| 3 | `getByPlaceholderText` | When label isn't available |
| 4 | `getByText` | Non-interactive content |
| 5 | `getByDisplayValue` | Form elements with current value |
| 6 | `getByAltText` | Images |
| 7 | `getByTitle` | Less reliable - avoid if possible |
| 8 | `getByTestId` | Last resort - invisible to users |

### Examples

```tsx
import { render, screen } from '@testing-library/react';

function LoginForm() {
  return (
    <form>
      <label htmlFor="email">Email</label>
      <input id="email" type="email" />

      <label htmlFor="password">Password</label>
      <input id="password" type="password" />

      <button type="submit">Log In</button>
    </form>
  );
}

test('renders login form', () => {
  render(<LoginForm />);

  // 1. getByRole - BEST
  expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();

  // 2. getByLabelText - for form fields
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

  // 3. getByText - for static content
  expect(screen.getByText(/log in/i)).toBeInTheDocument();

  // 8. getByTestId - LAST RESORT
  // Only when semantic queries don't work
  // <div data-testid="custom-element">...</div>
  // screen.getByTestId('custom-element')
});
```

### Common Roles

```tsx
// Buttons
screen.getByRole('button', { name: /submit/i });

// Links
screen.getByRole('link', { name: /home/i });

// Text inputs (not password, not checkbox)
screen.getByRole('textbox', { name: /username/i });

// Checkboxes
screen.getByRole('checkbox', { name: /agree/i });

// Radio buttons
screen.getByRole('radio', { name: /option 1/i });

// Combobox (select)
screen.getByRole('combobox', { name: /country/i });

// Headings
screen.getByRole('heading', { level: 1 }); // <h1>
screen.getByRole('heading', { name: /welcome/i });

// Lists
screen.getByRole('list');
screen.getAllByRole('listitem');

// Navigation
screen.getByRole('navigation');

// Alert
screen.getByRole('alert');

// Dialog
screen.getByRole('dialog');
```

---

## 2. userEvent vs fireEvent

**Rule: Always use userEvent. It simulates real user interactions.**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('user interactions', async () => {
  // CRITICAL: Setup userEvent before render
  const user = userEvent.setup();

  render(<MyComponent />);

  // Click
  await user.click(screen.getByRole('button', { name: /submit/i }));

  // Type
  await user.type(screen.getByRole('textbox'), 'hello world');

  // Clear and type
  await user.clear(screen.getByRole('textbox'));
  await user.type(screen.getByRole('textbox'), 'new value');

  // Tab navigation
  await user.tab();

  // Keyboard shortcuts
  await user.keyboard('{Enter}');
  await user.keyboard('{Escape}');
  await user.keyboard('{ArrowDown}');

  // Hover
  await user.hover(screen.getByText(/menu/i));
  await user.unhover(screen.getByText(/menu/i));

  // Select option
  await user.selectOptions(screen.getByRole('combobox'), 'option-value');

  // Checkbox/Radio
  await user.click(screen.getByRole('checkbox'));

  // Upload file
  const file = new File(['content'], 'test.png', { type: 'image/png' });
  await user.upload(screen.getByLabelText(/upload/i), file);
});
```

### Why userEvent Over fireEvent

```tsx
// fireEvent - dispatches single event
fireEvent.click(button);  // Just click event

// userEvent - simulates full interaction
await user.click(button);
// Fires: pointerOver, mouseOver, pointerMove, mouseMove,
// pointerDown, mouseDown, pointerUp, mouseUp, click
// Also handles focus, checks element visibility/interactivity
```

---

## 3. Async Testing: findBy* and waitFor

**Rule: Use findBy* for elements that appear asynchronously. Use waitFor for assertions.**

### findBy* Queries

```tsx
test('loads user data', async () => {
  render(<UserProfile userId="1" />);

  // findBy* waits for element to appear (default 1000ms timeout)
  const userName = await screen.findByText(/john doe/i);
  expect(userName).toBeInTheDocument();

  // With custom timeout
  const slowElement = await screen.findByRole('button', {}, { timeout: 3000 });
});
```

### waitFor for Assertions

```tsx
import { render, screen, waitFor } from '@testing-library/react';

test('removes item after delete', async () => {
  const user = userEvent.setup();
  render(<TodoList />);

  // Item exists initially
  expect(screen.getByText(/buy milk/i)).toBeInTheDocument();

  // Delete item
  await user.click(screen.getByRole('button', { name: /delete/i }));

  // Wait for item to be removed
  await waitFor(() => {
    expect(screen.queryByText(/buy milk/i)).not.toBeInTheDocument();
  });
});

test('shows error message', async () => {
  const user = userEvent.setup();
  render(<LoginForm />);

  await user.click(screen.getByRole('button', { name: /submit/i }));

  // Wait for error to appear
  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent(/email is required/i);
  });
});
```

### Query Types Summary

| Query Type | Returns | Throws | Async |
|------------|---------|--------|-------|
| `getBy*` | Element | Yes if not found | No |
| `queryBy*` | Element or null | No | No |
| `findBy*` | Promise\<Element\> | Yes if not found | Yes |
| `getAllBy*` | Element[] | Yes if empty | No |
| `queryAllBy*` | Element[] (can be empty) | No | No |
| `findAllBy*` | Promise\<Element[]\> | Yes if empty | Yes |

---

## 4. Testing Components with Providers

```tsx
// test/utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';

interface WrapperProps {
  children: React.ReactNode;
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: WrapperProps) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          {children}
        </MemoryRouter>
      </QueryClientProvider>
    );
  };
}

function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: createWrapper(), ...options });
}

export * from '@testing-library/react';
export { customRender as render };
```

```tsx
// Usage in tests
import { render, screen } from '@/test/utils';

test('renders with providers', async () => {
  render(<UserProfile />);
  expect(await screen.findByText(/user name/i)).toBeInTheDocument();
});
```

---

## 5. Mocking

### Mocking Modules

```tsx
import { vi } from 'vitest';

// Mock entire module
vi.mock('./api', () => ({
  fetchUser: vi.fn(() => Promise.resolve({ id: 1, name: 'John' })),
}));

// Mock specific export
vi.mock('./utils', async () => {
  const actual = await vi.importActual('./utils');
  return {
    ...actual,
    formatDate: vi.fn(() => '2024-01-01'),
  };
});
```

### Mocking API Calls with MSW

```tsx
// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/users/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'John Doe',
      email: 'john@example.com',
    });
  }),

  http.post('/api/login', async ({ request }) => {
    const body = await request.json();
    if (body.email === 'invalid@example.com') {
      return HttpResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    return HttpResponse.json({ token: 'fake-token' });
  }),
];

// src/test/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// src/test/setup.ts
import { server } from './mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## 6. Testing Forms

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('submits form with valid data', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();

  render(<RegistrationForm onSubmit={onSubmit} />);

  // Fill form
  await user.type(screen.getByLabelText(/email/i), 'test@example.com');
  await user.type(screen.getByLabelText(/password/i), 'password123');
  await user.click(screen.getByRole('checkbox', { name: /terms/i }));

  // Submit
  await user.click(screen.getByRole('button', { name: /register/i }));

  // Assert
  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      acceptTerms: true,
    });
  });
});

test('shows validation errors', async () => {
  const user = userEvent.setup();
  render(<RegistrationForm onSubmit={vi.fn()} />);

  // Submit without filling
  await user.click(screen.getByRole('button', { name: /register/i }));

  // Check errors
  expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
  expect(screen.getByText(/password is required/i)).toBeInTheDocument();
});
```

---

## 7. Testing Hooks

```tsx
import { renderHook, act } from '@testing-library/react';

test('useCounter increments', () => {
  const { result } = renderHook(() => useCounter(0));

  expect(result.current.count).toBe(0);

  act(() => {
    result.current.increment();
  });

  expect(result.current.count).toBe(1);
});

test('useCounter with async', async () => {
  const { result } = renderHook(() => useAsyncCounter());

  expect(result.current.count).toBe(0);

  await act(async () => {
    await result.current.incrementAsync();
  });

  expect(result.current.count).toBe(1);
});
```

---

## 8. Playwright for E2E

### Setup

```bash
pnpm dlx playwright@latest
```

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Writing E2E Tests

```ts
// e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('successful login', async ({ page }) => {
    await page.goto('/login');

    // Fill form
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('password123');

    // Submit
    await page.getByRole('button', { name: 'Log In' }).click();

    // Assert redirect
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('invalid@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Log In' }).click();

    await expect(page.getByRole('alert')).toContainText('Invalid credentials');
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Log In' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('navigates to settings', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL('/settings');
  });
});
```

---

## 9. Test File Organization

```
src/
  components/
    Button/
      Button.tsx
      Button.test.tsx       # Unit tests co-located
  features/
    auth/
      LoginForm.tsx
      LoginForm.test.tsx
  hooks/
    useAuth.ts
    useAuth.test.ts
  test/
    setup.ts                # Test setup
    utils.tsx               # Custom render, providers
    mocks/
      handlers.ts           # MSW handlers
      server.ts             # MSW server setup
e2e/
  login.spec.ts             # Playwright E2E tests
  navigation.spec.ts
```

---

## Best Practices Summary

1. **getByRole first** - Most accessible, closest to user experience
2. **getByLabelText for forms** - Users find inputs by labels
3. **getByTestId last** - Only when semantic queries fail
4. **userEvent.setup()** - Always before render, always async
5. **findBy* for async** - Elements that appear after loading
6. **waitFor for assertions** - When checking async state changes
7. **queryBy* for absence** - Use with `.not.toBeInTheDocument()`
8. **Custom render with providers** - Wrap in QueryClient, Router, etc.
9. **MSW for API mocking** - Intercepts at network level
10. **Playwright for E2E** - Real browser, real user flows
