# Routers

Hono supports multiple routers. The default is **SmartRouter**, which picks the best router based on your routes.

## Router types (high level)
- **SmartRouter**: default; selects the fastest router after analyzing registered routes.
- **RegExpRouter**: very fast matching using a single compiled RegExp; great for many static routes.
- **TrieRouter**: tree-based router; good general‑purpose choice when patterns are complex.
- **LinearRouter**: fast route registration; good for runtimes that re‑initialize frequently.
- **PatternRouter**: smallest footprint; simpler matching.

## Selecting a router
Only override the default if you have a measured reason (bundle size, init time, route patterns).

Minimal example:
```ts
import { Hono } from 'hono'
import { RegExpRouter } from 'hono/router/reg-exp-router'

const app = new Hono({ router: new RegExpRouter() })
```
