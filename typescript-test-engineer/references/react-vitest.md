# React Testing with Vitest (Vite apps)

> **Load when:** User asks about testing React UI, Vite + Vitest, Testing Library, jsdom/happy-dom, or frontend test setup.

## Core stack (recommended)
- Builder: Vite (assumed for React apps in this guide).
- Runner: Vitest (paired with Vite).
- DOM env: `jsdom` (or `happy-dom` for speed).
- UI testing: `@testing-library/react` + `@testing-library/user-event`.
- Matchers: `@testing-library/jest-dom`.

If the repo already uses a different runner (Jest/RTL config), follow existing conventions.

## Vitest configuration (best practices)
Based on the shared toolchain guidance for Vite projects:

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/*.d.ts', '**/*.config.*', '**/test/**']
    },
    typecheck: {
      enabled: true
    }
  }
});
```

Notes:
- Keep `globals: true` if your repo prefers global `describe/it/expect`; otherwise disable and import explicitly.
- Use `vite-tsconfig-paths` when TS path aliases exist.

## Setup file
```ts
// test/setup.ts
import '@testing-library/jest-dom/vitest';
```

## Testing patterns
- Prefer user-visible behavior over implementation details.
- Use `render` + `screen` queries from Testing Library.
- Use `userEvent` for interactions; avoid direct DOM mutations.
- Prefer `findBy*`/`waitFor` for async UI updates.

## Example tests
```ts
// src/components/Counter.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Counter } from './Counter';

describe('Counter', () => {
  it('increments on click', async () => {
    const user = userEvent.setup();
    render(<Counter />);

    await user.click(screen.getByRole('button', { name: /increment/i }));

    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
```

```ts
// src/features/profile/Profile.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Profile } from './Profile';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('Profile', () => {
  it('renders user name from API', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ name: 'Ada' })
    }) as unknown as typeof fetch;

    render(<Profile />);

    expect(await screen.findByText('Ada')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/api/profile');
  });
});
```

## Mocking and timers
- Use `vi.fn()` / `vi.spyOn()` for mocks and spies.
- Use `vi.useFakeTimers()` + `vi.setSystemTime()` for time-based UI; always `vi.useRealTimers()` after.
- Prefer mocking at the boundary (API clients, fetch) rather than internal component functions.

## Coverage
- Prefer `provider: 'v8'` with `reporter: ['text', 'json', 'html']`.
- Treat coverage as a signal; prioritize meaningful assertions and edge cases.
