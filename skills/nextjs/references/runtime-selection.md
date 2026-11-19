# Runtime Selection

## Use Node.js Runtime by Default

Check the app’s Cache Components configuration first. With Cache Components enabled on Next.js 16, use the implicit Node.js runtime and omit the segment’s `runtime` export, including `'nodejs'`. For other configurations, use the default Node.js runtime unless the project requires and supports Edge. [Cache Components configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents)

```tsx
// Good: Default - no runtime config needed (uses Node.js)
export default function Page() { ... }

// Only for a supported Edge route with Cache Components disabled
export const runtime = 'edge'
```

## When to Use Each

### Node.js Runtime (Default)

- Full Node.js API support
- File system access (`fs`)
- Full `crypto` support
- Database connections
- Most npm packages work

### Edge Runtime

- Only for specific edge-location latency requirements
- Limited API (no `fs`, limited `crypto`)
- No ISR; no native Node APIs, native addons, or unrestricted dynamic code evaluation
- Cold-start latency and geographic placement depend on host/adapter; measure rather than promise

## Detection

**Before adding `runtime = 'edge'`**, check:
1. Does the project already use Edge runtime?
2. Is there a specific latency requirement?
3. Are all dependencies Edge-compatible?

If unsure, use Node.js runtime.
