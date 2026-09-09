---
title: authInterrupts
description: "Learn how to enable the experimental `authInterrupts` configuration option to use `forbidden` and `unauthorized`."
url: "https://nextjs.org/docs/app/api-reference/config/next-config-js/authInterrupts"
docs_index: /docs/llms.txt
version: 16.3.4
lastUpdated: 2025-06-16
prerequisites:
  - "Configuration: /docs/app/api-reference/config"
  - "next.config.js: /docs/app/api-reference/config/next-config-js"
related:
  - app/api-reference/functions/forbidden
  - app/api-reference/functions/unauthorized
  - app/api-reference/file-conventions/forbidden
  - app/api-reference/file-conventions/unauthorized
---


> For an index of all Next.js documentation, see [/docs/llms.txt](/docs/llms.txt).

> This feature is currently available in the canary channel and subject to change. Try it out by [upgrading Next.js](/docs/app/getting-started/upgrading#canary-version), and share your feedback on [GitHub](https://github.com/vercel/next.js/issues).

The `authInterrupts` configuration option allows you to use [`forbidden`](/docs/app/api-reference/functions/forbidden) and [`unauthorized`](/docs/app/api-reference/functions/unauthorized) APIs in your application. While these functions are experimental, you must enable the `authInterrupts` option in your `next.config.js` file to use them:

```ts filename="next.config.ts" switcher
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
  },
}

export default nextConfig
```

```js filename="next.config.js" switcher
module.exports = {
  experimental: {
    authInterrupts: true,
  },
}
```
- [forbidden](/docs/app/api-reference/functions/forbidden)
  - API Reference for the forbidden function.
- [unauthorized](/docs/app/api-reference/functions/unauthorized)
  - API Reference for the unauthorized function.
- [forbidden.js](/docs/app/api-reference/file-conventions/forbidden)
  - API reference for the forbidden.js special file.
- [unauthorized.js](/docs/app/api-reference/file-conventions/unauthorized)
  - API reference for the unauthorized.js special file.

---

For a semantic overview of all documentation, see [/docs/sitemap.md](/docs/sitemap.md)

For an index of all available documentation, see [/docs/llms.txt](/docs/llms.txt)