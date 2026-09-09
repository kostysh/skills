# Async Patterns

In Next.js 15+, `params`, `searchParams`, `cookies()`, and `headers()` are asynchronous.

## Async Params and SearchParams

For request params in these Next 15/16 examples, type them as `Promise<...>` and await them. Next 15 had temporary synchronous compatibility; Next 16 removes it. `generateImageMetadata` input is a distinct synchronous exception, covered in [Metadata](metadata.md).

### Pages and Layouts

```tsx
type Props = { params: Promise<{ slug: string }> }

export default async function Page({ params }: Props) {
  const { slug } = await params
}
```

### Route Handlers

```tsx
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
}
```

### SearchParams

```tsx
type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ query?: string }>
}

export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params
  const { query } = await searchParams
}
```

### Synchronous Components

Use `React.use()` for non-async components:

```tsx
import { use } from 'react'

type Props = { params: Promise<{ slug: string }> }

export default function Page({ params }: Props) {
  const { slug } = use(params)
}
```

### generateMetadata

```tsx
type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return { title: slug }
}
```

## Async Cookies and Headers

```tsx
import { cookies, headers } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const headersList = await headers()

  const theme = cookieStore.get('theme')
  const userAgent = headersList.get('user-agent')
}
```

## Migration Codemod

Only for an authorized migration, choose a version-compatible codemod and review its diff; do not change dependencies merely to apply this example.

```bash
npx @next/codemod@latest next-async-request-api .
```
