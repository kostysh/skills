# Directives

## React Directives

These are React directives, not Next.js specific.

### `'use client'`

Marks a component as a Client Component. Required for:
- React hooks (`useState`, `useEffect`, etc.)
- Event handlers (`onClick`, `onChange`)
- Browser APIs (`window`, `localStorage`)

```tsx
'use client'

import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

Reference: https://react.dev/reference/rsc/use-client

### `'use server'`

Marks a server function, callable as an Action from UI. It can be passed to Client Components. It is not an access-control boundary: authenticate, validate and authorize each mutation as described in [Data Patterns](data-patterns.md). The directive-only examples below do not implement a mutation.

```tsx
'use server'

export async function submitForm(formData: FormData) {
  // Runs on server
}
```

Or inline within a Server Component:

```tsx
export default function Page() {
  async function submit() {
    'use server'
    // Runs on server
  }
  return <form action={submit}>...</form>
}
```

Reference: https://react.dev/reference/rsc/use-server

---

## Next.js Directive

### `'use cache'`

Marks a function or component for caching. Part of Next.js Cache Components.

```tsx
'use cache'

export async function getCachedData() {
  return await fetchData()
}
```

Check the effective `next.config`. In 16.4, `create-next-app` enables Cache Components for new apps. Existing 16.x apps retain their configured mode. When adopting the 16.4 model, set `cacheComponents: true` and `partialPrefetching: true`. An app migrating from the earlier Cache Components model can explicitly set the latter to `false` during migration. [Next.js 16.4](https://nextjs.org/blog/next-16-4) · [Configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents)

For ordinary `'use cache'`, read request-time values such as cookies and headers outside the cached scope. Pass only values appropriate for its caching and access policy. Use `cacheLife` and `cacheTag` from `next/cache` for lifetime and tags. [Data Patterns](data-patterns.md) covers mutation freshness.

Reference: https://nextjs.org/docs/app/api-reference/directives/use-cache
