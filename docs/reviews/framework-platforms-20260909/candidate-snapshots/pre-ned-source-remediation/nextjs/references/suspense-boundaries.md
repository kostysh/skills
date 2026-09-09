# Suspense Boundaries

Client hooks that cause CSR bailout without Suspense boundaries.

## useSearchParams

On a statically rendered route, wrap the Client Component reading useSearchParams in the nearest appropriate Suspense boundary. Without it, production build fails; development on-demand rendering can conceal the defect. For intentionally dynamic rendering, establish a request boundary in the server route (for example supported connection()), not a blanket client conversion.

```tsx
// Bad on a static route without an ancestor Suspense: production build fails
'use client'

import { useSearchParams } from 'next/navigation'

export default function SearchBar() {
  const searchParams = useSearchParams()
  return <div>Query: {searchParams.get('q')}</div>
}
```

```tsx
// Good: Wrap in Suspense
import { Suspense } from 'react'
import SearchBar from './search-bar'

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchBar />
    </Suspense>
  )
}
```

## usePathname

With Cache Components enabled, usePathname may suspend for unknown dynamic parameters. Add Suspense for that case; a dynamic segment alone is not a universal requirement.

```tsx
// In dynamic route [slug]
// Bad: No Suspense
'use client'
import { usePathname } from 'next/navigation'

export function Breadcrumb() {
  const pathname = usePathname()
  return <nav>{pathname}</nav>
}
```

```tsx
// Good: Wrap in Suspense
<Suspense fallback={<BreadcrumbSkeleton />}>
  <Breadcrumb />
</Suspense>
```

If you use `generateStaticParams`, Suspense is optional.

## Quick Reference

| Hook | Suspense Required |
|------|-------------------|
| `useSearchParams()` | Static rendering: yes; verify production build |
| `usePathname()` | Cache Components with unknown dynamic params; generateStaticParams can avoid this requirement |
| `useParams()` | No |
| `useRouter()` | No |
