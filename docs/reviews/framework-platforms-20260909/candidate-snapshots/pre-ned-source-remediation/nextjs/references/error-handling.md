# Error Handling

Handle errors gracefully in Next.js applications.

Reference: https://nextjs.org/docs/app/getting-started/error-handling

## Error Boundaries

### `error.tsx`

Catches errors in a route segment and its children:

```tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

**Important:** `error.tsx` must be a Client Component.

### `global-error.tsx`

Catches errors in root layout:

```tsx
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  )
}
```

**Important:** Must include `<html>` and `<body>` tags.

## Server Actions: Navigation API Gotcha

**Do NOT wrap navigation APIs in try-catch.** They throw special errors that Next.js handles internally.

Reference: https://nextjs.org/docs/app/api-reference/functions/redirect#behavior

```tsx
'use server'
import { redirect } from 'next/navigation'
import { createAuthorizedPost } from '@/lib/posts'

export async function createPost(formData: FormData) {
  // App-owned service authenticates, validates input and enforces ownership.
  // Do not catch framework control-flow throws by matching error.message.
  const post = await createAuthorizedPost(formData)
  redirect(`/posts/${post.id}`)
}
```

If ordinary operation errors need conversion to form state, keep redirect outside that catch and ensure the caught operation does not swallow framework control flow. `unstable_rethrow` is explicitly unstable and not recommended for production; use only an intentionally experimental, version-verified branch, not the default.

`redirect` usually returns 307, but Server Actions use 303 and streaming may emit a client redirect. `permanentRedirect` uses 308. `notFound` renders the nearest not-found UI; streamed responses can already be HTTP 200, while non-streamed responses return 404.

## Redirects

```tsx
import { redirect, permanentRedirect } from 'next/navigation'

// 307 Temporary - use for most cases
redirect('/new-path')

// 308 Permanent - use for URL migrations (cached by browsers)
permanentRedirect('/new-url')
```

## Auth Errors

For stable production work, use the app Auth/DAL decision at each protected operation; return explicit 401/403 from Route Handlers or the established form error/login redirect contract for Actions/UI.

The following optional branch is **experimental**, requires `experimental.authInterrupts: true`, and is not recommended for production. Verify installed support before using `forbidden`/`unauthorized`; never enable the flag implicitly. It does not replace action authorization:

```tsx
import { forbidden, unauthorized } from 'next/navigation'

async function Page() {
  const session = await getSession()

  if (!session) {
    unauthorized() // Renders unauthorized.tsx (401)
  }

  if (!session.hasAccess) {
    forbidden() // Renders forbidden.tsx (403)
  }

  return <Dashboard />
}
```

Create corresponding error pages:

```tsx
// app/forbidden.tsx
export default function Forbidden() {
  return <div>You don't have access to this resource</div>
}

// app/unauthorized.tsx
export default function Unauthorized() {
  return <div>Please log in to continue</div>
}
```

## Not Found

### `not-found.tsx`

Custom 404 page for a route segment:

```tsx
export default function NotFound() {
  return (
    <div>
      <h2>Not Found</h2>
      <p>Could not find the requested resource</p>
    </div>
  )
}
```

### Triggering Not Found

```tsx
import { notFound } from 'next/navigation'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await getPost(id)

  if (!post) {
    notFound()  // Renders closest not-found.tsx
  }

  return <div>{post.title}</div>
}
```

## Error Hierarchy

Errors bubble up to the nearest error boundary:

```
app/
├── error.tsx           # Catches errors from all children
├── blog/
│   ├── error.tsx       # Catches errors in /blog/*
│   └── [slug]/
│       ├── error.tsx   # Catches errors in /blog/[slug]
│       └── page.tsx
└── layout.tsx          # Errors here go to global-error.tsx
```
