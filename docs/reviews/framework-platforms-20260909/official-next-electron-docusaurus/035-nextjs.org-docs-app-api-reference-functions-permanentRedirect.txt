---
title: permanentRedirect
description: API Reference for the permanentRedirect function.
url: "https://nextjs.org/docs/app/api-reference/functions/permanentRedirect"
docs_index: /docs/llms.txt
version: 16.3.4
lastUpdated: 2026-08-25
prerequisites:
  - "API Reference: /docs/app/api-reference"
  - "Functions: /docs/app/api-reference/functions"
related:
  - app/api-reference/functions/redirect
---


> For an index of all Next.js documentation, see [/docs/llms.txt](/docs/llms.txt).
The `permanentRedirect` function allows you to redirect the user to another URL. `permanentRedirect` can be used in Server Components, Client Components, [Route Handlers](/docs/app/api-reference/file-conventions/route), and [Server Functions](/docs/app/getting-started/mutating-data).

When used in a streaming context, this will insert a meta tag to emit the redirect on the client side. In a Server Action, `permanentRedirect` performs a client-side navigation when JavaScript is available. For progressive enhancement form submissions, it serves a 303 HTTP redirect response. Otherwise, it serves a 308 (Permanent) HTTP redirect response.

If a resource doesn't exist, you can use the [`notFound` function](/docs/app/api-reference/functions/not-found) instead.

## Parameters

The `permanentRedirect` function accepts two arguments:

```js
permanentRedirect(path, type)
```

| Parameter | Type                                                          | Description                                                 |
| --------- | ------------------------------------------------------------- | ----------------------------------------------------------- |
| `path`    | `string`                                                      | The URL to redirect to. Can be a relative or absolute path. |
| `type`    | `'replace'` (default) or `'push'` (default in Server Actions) | The type of redirect to perform.                            |

By default, `permanentRedirect` will use `push` (adding a new entry to the browser history stack) in [Server Actions](/docs/app/getting-started/mutating-data) and `replace` (replacing the current URL in the browser history stack) everywhere else. You can override this behavior by specifying the `type` parameter.

The `RedirectType` object contains the available options for the `type` parameter.

```ts
import { permanentRedirect, RedirectType } from 'next/navigation'

permanentRedirect('/redirect-to', RedirectType.replace)
// or
permanentRedirect('/redirect-to', RedirectType.push)
```

The `type` parameter has no effect when used in Server Components.

## Returns

`permanentRedirect` does not return a value.

## Behavior

* In Server Actions and Route Handlers, `permanentRedirect` should be called **outside** the `try` block when using `try/catch` statements because it throws an error.
* If you prefer to return a 307 (Temporary) HTTP redirect instead of 308 (Permanent), you can use the [`redirect` function](/docs/app/api-reference/functions/redirect) instead.

## Example

Invoking the `permanentRedirect()` function throws a `NEXT_REDIRECT` error and terminates rendering of the route segment in which it was thrown.

```jsx filename="app/team/[id]/page.js"
import { permanentRedirect } from 'next/navigation'

async function fetchTeam(id) {
  const res = await fetch('https://...')
  if (!res.ok) return undefined
  return res.json()
}

export default async function Profile({ params }) {
  const { id } = await params
  const team = await fetchTeam(id)
  if (!team) {
    permanentRedirect('/login')
  }

  // ...
}
```

> **Good to know**: `permanentRedirect` does not require you to use `return permanentRedirect()` as it uses the TypeScript [`never`](https://www.typescriptlang.org/docs/handbook/2/functions.html#never) type.
- [redirect](/docs/app/api-reference/functions/redirect)
  - API Reference for the redirect function.

---

For a semantic overview of all documentation, see [/docs/sitemap.md](/docs/sitemap.md)

For an index of all available documentation, see [/docs/llms.txt](/docs/llms.txt)