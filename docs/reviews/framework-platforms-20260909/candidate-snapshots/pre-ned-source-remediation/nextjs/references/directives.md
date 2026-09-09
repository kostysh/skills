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

Requires `cacheComponents: true` in `next.config.ts`.

Cache Components is an opt-in stable Next 16 model, not an automatic migration for Next 15 or legacy caching. Read cookies/headers and other request-time APIs outside a cached scope and pass permitted values explicitly; do not share user-private data through public cache keys. Use `cacheLife`/`cacheTag` from `next/cache` to establish lifetime/tags. [Data Patterns](data-patterns.md) owns mutation freshness and `updateTag` versus `revalidateTag`; an unavailable optional cache specialist does not block this local method.

Reference: https://nextjs.org/docs/app/api-reference/directives/use-cache
