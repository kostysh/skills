# Bundling

Fix common bundling issues with third-party packages.

## Server-Incompatible Packages

Some packages use browser APIs (`window`, `document`, `localStorage`) and fail in Server Components.

### Error Signs

```
ReferenceError: window is not defined
ReferenceError: document is not defined
ReferenceError: localStorage is not defined
Module not found: Can't resolve 'fs'
```

### Solution 1: Mark as Client-Only

If the package is only needed on client:

```tsx
// Bad: Fails - package uses window
import SomeChart from 'some-chart-library'

export default function Page() {
  return <SomeChart />
}

// components/ClientChart.tsx (separate client entry)
'use client'
import dynamic from 'next/dynamic'

const SomeChart = dynamic(() => import('some-chart-library'), {
  ssr: false,
})

export default function Page() {
  return <SomeChart />
}
```

### Solution 2: Externalize from Server Bundle

For packages that should run on server but have bundling issues:

```js
// next.config.js
module.exports = {
  serverExternalPackages: ['problematic-package'],
}
```

Use this for:
- Packages with native bindings (sharp, bcrypt)
- Packages that don't bundle well (some ORMs)
- Packages with circular dependencies

`ssr: false` must be declared inside a Client Component module, which a Server Component can import. A `use client` wrapper alone still prerenders initial HTML and does not protect a library that touches window at import time.

### Solution 3: Client Component Wrapper

For a library that is SSR-safe but requires client hooks, wrap usage in a Client Component. For browser globals at import time, use the dynamic client entry above:

```tsx
// components/ChartWrapper.tsx
'use client'

import { Chart } from 'chart-library'

export function ChartWrapper(props) {
  return <Chart {...props} />
}

// app/page.tsx (server component)
import { ChartWrapper } from '@/components/ChartWrapper'

export default function Page() {
  return <ChartWrapper data={data} />
}
```

## CSS Imports

Import CSS files instead of using `<link>` tags. Next.js handles bundling and optimization.

```tsx
// Bad: Manual link tag
<link rel="stylesheet" href="/styles.css" />

// Good: Import CSS
import './styles.css'

// Good: CSS Modules
import styles from './Button.module.css'
```

## Polyfills

Next.js includes common polyfills automatically. Don't load redundant ones from polyfill.io or similar CDNs.

Check the installed Next/browser support policy before adding any missing polyfill; avoid redundant or untrusted CDN polyfills. Do not infer an exhaustive polyfill list from an older example.

## ESM/CommonJS Issues

### Error Signs

```
SyntaxError: Cannot use import statement outside a module
Error: require() of ES Module
Module not found: ESM packages need to be imported
```

### Conditional Solution: Transpile Package

ESM alone does not require transpilation. Inspect the actual failure, package exports, runtime target and installed Next support; use `transpilePackages` for a demonstrated transpilation/bundling need. Preserve runtime-only native dependencies through supported externalization when needed.

```js
// next.config.js
module.exports = {
  transpilePackages: ['some-esm-package', 'another-package'],
}
```

## Dependency-specific diagnosis

Native packages may already be automatically externalized by the installed Next version. Check that list before adding configuration. Browser libraries differ by version and entrypoint: prove the failing import instead of classifying an entire package as browser-only. When needed, dynamic `ssr: false` belongs inside a Client Component; do not substitute another library without task authority.

## Bundle Analysis

Analyze bundle size with the built-in analyzer (Next.js 16.1+):

```bash
next experimental-analyze
```

This opens an interactive UI to:
- Filter by route, environment (client/server), and type
- Inspect module sizes and import chains
- View treemap visualization

Save output for comparison:

```bash
next experimental-analyze --output
# Output saved to .next/diagnostics/analyze
```

Reference: https://nextjs.org/docs/app/guides/package-bundling

## Migrating from Webpack to Turbopack

Turbopack is the default for dev and build in Next.js 16. Next 15 has a separate opt-in/stability branch. Preserve a functioning webpack configuration unless migration is authorized or necessary for the requested fix. In Next 16 use the supported `--webpack` dev/build flag when the project still needs webpack; do not silently drop plugins. Check installed CLI help and dependency compatibility before a migration.

Reference: https://nextjs.org/docs/app/guides/upgrading/version-16
