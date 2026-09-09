# Parallel & Intercepting Routes

Parallel routes render multiple pages in the same layout. Intercepting routes show a different UI when navigating from within your app vs direct URL access. Together they enable modal patterns.

## File Structure

```
app/
├── @modal/                    # Parallel route slot
│   ├── default.tsx            # Required! Returns null
│   ├── (.)photos/             # Intercepts /photos/*
│   │   └── [id]/
│   │       └── page.tsx       # Modal content
│   └── [...catchAll]/         # Optional: catch unmatched
│       └── page.tsx
├── photos/
│   └── [id]/
│       └── page.tsx           # Full page (direct access)
├── layout.tsx                 # Renders both children and @modal
└── page.tsx
```

## Step 1: Root Layout with Slot

```tsx
// app/layout.tsx
export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html>
      <body>
        {children}
        {modal}
      </body>
    </html>
  );
}
```

## Step 2: Default File (Critical!)

Provide `default.tsx` for slots (including implicit children when needed) that can be unmatched on hard navigation; otherwise Next renders 404 for an unmatched slot.

```tsx
// app/@modal/default.tsx
export default function Default() {
  return null;
}
```

Without a matching page or default, hard navigation cannot recover the slot's active state and renders 404.

## Step 3: Intercepting Route (Modal)

The `(.)` prefix intercepts routes at the same level.

```tsx
// app/@modal/(.)photos/[id]/page.tsx
import { Modal } from '@/components/modal';

export default async function PhotoModal({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const photo = await getPhoto(id);

  return (
    <Modal>
      <img src={photo.url} alt={photo.title} />
    </Modal>
  );
}
```

## Step 4: Full Page (Direct Access)

```tsx
// app/photos/[id]/page.tsx
export default async function PhotoPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const photo = await getPhoto(id);

  return (
    <div className="full-page">
      <img src={photo.url} alt={photo.title} />
      <h1>{photo.title}</h1>
    </div>
  );
}
```

## Step 5: Modal Component with Correct Closing

For an intercepted modal entered from the gallery, `router.back()` restores that navigation. It moves the history cursor; it does not delete the entry. When entry history is not known, use an explicit destination with a matching null slot page (and a root null page when closing to `/`) rather than sending the user off-site.

```tsx
// components/modal.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

export function Modal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        router.back(); // Correct
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [router]);

  // Close on overlay click
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      router.back(); // Correct
    }
  }, [router]);

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <button
          onClick={() => router.back()} // Correct!
          className="absolute top-4 right-4"
        >
          Close
        </button>
        {children}
      </div>
    </div>
  );
}
```

### Closing through a destination

A `Link` or `router.push` can close the modal when the destination matches a slot page that returns null. `default.tsx` alone does not clear remembered slot state on soft navigation:

```tsx
// app/@modal/[...catchAll]/page.tsx
export default function CatchAll() { return null }
// Also app/@modal/page.tsx if the close destination is `/`.
```

Choose back for known intercepted history, or an explicit safe destination for direct entry. Test soft close, browser back/forward, direct URL and reload. The sample Modal below is for intercepted history only.

## Route Matcher Reference

Matchers match **route segments**, not filesystem paths:

| Matcher | Matches | Example |
|---------|---------|---------|
| `(.)` | Same level | `@modal/(.)photos` intercepts `/photos` |
| `(..)` | One level up | `@modal/(..)settings` from `/dashboard/@modal` intercepts `/settings` |
| `(..)(..)` | Two levels up | Rarely used |
| `(...)` | From root | `@modal/(...)photos` intercepts `/photos` from anywhere |

**Common mistake**: Thinking `(..)` means "parent folder" - it means "parent route segment".

## Handling Hard Navigation

When users directly visit `/photos/123` (bookmark, refresh, shared link):
- The intercepting route is bypassed
- The full `photos/[id]/page.tsx` renders
- Modal doesn't appear (expected behavior)

If product requirements also show a modal on direct access, use a separate close contract with an explicit safe destination; do not reuse the history-dependent back-only Modal unchanged.

## Common Gotchas

### 1. Missing `default.tsx` → 404 on Refresh

Every `@slot` folder needs a `default.tsx` that returns `null` (or appropriate content).

### 2. Modal Persists After Navigation

Check whether the close destination matches a null slot page; soft navigation preserves unmatched slot state.

### 3. Nested Parallel Routes Need Defaults Too

If you have `@modal` inside a route group, each level needs its own `default.tsx`:

```
app/
├── (marketing)/
│   ├── @modal/
│   │   └── default.tsx     # Needed!
│   └── layout.tsx
└── layout.tsx
```

### 4. Intercepted Route Shows Wrong Content

Check your matcher:
- `(.)photos` intercepts `/photos` from the same route level
- If your `@modal` is in `app/dashboard/@modal`, use `(.)photos` to intercept `/dashboard/photos`, not `/photos`

### 5. TypeScript Errors with `params`

In Next.js 15+, `params` is a Promise:

```tsx
// Correct
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

## Complete Example: Photo Gallery Modal

```
app/
├── @modal/
│   ├── default.tsx
│   └── (.)photos/
│       └── [id]/
│           └── page.tsx
├── photos/
│   ├── page.tsx           # Gallery grid
│   └── [id]/
│       └── page.tsx       # Full photo page
├── layout.tsx
└── page.tsx
```

Links in the gallery:

```tsx
// app/photos/page.tsx
import Link from 'next/link';

export default async function Gallery() {
  const photos = await getPhotos();

  return (
    <div className="grid grid-cols-3 gap-4">
      {photos.map(photo => (
        <Link key={photo.id} href={`/photos/${photo.id}`}>
          <img src={photo.thumbnail} alt={photo.title} />
        </Link>
      ))}
    </div>
  );
}
```

Clicking a photo → Modal opens (intercepted)
Direct URL → Full page renders
Refresh while modal open → Full page renders
