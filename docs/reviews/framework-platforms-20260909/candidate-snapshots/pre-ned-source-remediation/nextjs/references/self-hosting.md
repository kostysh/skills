# Self-Hosting Next.js

Deploy Next.js outside of Vercel with confidence.

## Quick Start: Standalone Output

For Docker or any containerized deployment, use standalone output:

```js
// next.config.js
module.exports = {
  output: 'standalone',
};
```

This creates a minimal `standalone` folder with only production dependencies:

```
.next/
├── standalone/
│   ├── server.js          # Entry point
│   ├── node_modules/      # Only production deps
│   └── .next/             # Build output
└── static/                # Must be copied separately
```

## Docker Deployment

### Dockerfile

Example for a new compatible Node 24 LTS/npm project; preserve the existing package manager, lockfile and supported runtime. Node 20 is EOL at the 2026-09-09 source check. Pin the chosen image/version per deployment policy; this example assumes a public directory exists.

```dockerfile
FROM node:24-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## PM2 Deployment

For an existing PM2-based server deployment (a supervisor/container choice is not a universal Next requirement):

```js
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'nextjs',
    script: '.next/standalone/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
  }],
};
```

```bash
npm run build
pm2 start ecosystem.config.js
```

## ISR and Cache Handlers

### The Problem

ISR (Incremental Static Regeneration) uses filesystem caching by default. This **breaks with multiple instances**:

- Instance A regenerates page → saves to its local disk
- Instance B serves stale page → doesn't see Instance A's cache
- Load balancer sends users to random instances → inconsistent content

### Solution: Custom Cache Handler

Next.js 14+ supports custom cache handlers for shared storage:

```js
// next.config.js
module.exports = {
  cacheHandler: require.resolve('./cache-handler.js'),
  cacheMaxMemorySize: 0, // Disable in-memory cache
};
```

### Shared invalidation contract

A Redis/S3 get/set sketch is not a working shared cache handler. Choose an existing maintained handler or implement the installed Next `cacheHandler` API, including tag/path invalidation semantics, metadata/lifetimes, serialization, failures and concurrency. `cacheHandlers` for Cache Components is a different interface; do not swap these configuration keys.

All instances need coherent invalidation, compatible cache namespaces/build identity and consistent Server Action encryption keys where used. Sharing stored values alone cannot guarantee freshness. See the version-matched [cacheHandler API](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheHandler) and [self-hosting guide](https://nextjs.org/docs/app/guides/self-hosting).

Before claiming multi-instance correctness, cache an old value on instance B, mutate and invalidate through authorized instance A, then read B according to the selected immediate or SWR contract and repeat after reload. Include denied mutation and failure behavior. A local build, single-instance success, or equal initial pages does not prove this boundary.

## Deployment feature boundaries

SSR/SSG, image optimization, request-time rendering, draft cookies, Proxy/middleware and caching depend on the selected output, runtime and adapter. `next start` runs a completed normal build; standalone uses its generated `server.js` with separately copied `public` and `.next/static`. Static export cannot supply Server Actions, ISR or other server-only features. Proxy in Next 16 is Node; legacy middleware runtime is version-dependent.

## Image Optimization

Next.js Image Optimization works out of the box but is CPU-intensive.

### Option 1: Built-in (Simple)

Works automatically, but consider:
- Set `deviceSizes` and `imageSizes` in config to limit variants
- Use `minimumCacheTTL` to reduce regeneration

```js
// next.config.js
module.exports = {
  images: {
    minimumCacheTTL: 60 * 60 * 24, // 24 hours
    deviceSizes: [640, 750, 1080, 1920], // Limit sizes
  },
};
```

### Option 2: External Loader (Recommended for Scale)

Offload to Cloudinary, Imgix, or similar:

```js
// next.config.js
module.exports = {
  images: {
    loader: 'custom',
    loaderFile: './lib/image-loader.js',
  },
};
```

```js
// lib/image-loader.js
export default function cloudinaryLoader({ src, width, quality }) {
  const params = ['f_auto', 'c_limit', `w_${width}`, `q_${quality || 'auto'}`];
  return `https://res.cloudinary.com/demo/image/upload/${params.join(',')}${src}`;
}
```

## Environment Variables

### Build-time vs Runtime

```js
// Available at build time only (baked into bundle)
NEXT_PUBLIC_API_URL=https://api.example.com

// Available at runtime (server-side only)
DATABASE_URL=postgresql://...
API_SECRET=...
```

### Runtime Configuration

For truly dynamic config, don't use `NEXT_PUBLIC_*`. Instead:

```tsx
// app/api/config/route.ts
export async function GET() {
  return Response.json({
    apiUrl: process.env.API_URL,
    features: process.env.FEATURES?.split(','),
  });
}
```

## OpenNext: Serverless Without Vercel

[OpenNext](https://opennext.js.org/) provides separately maintained adapters, including AWS and Cloudflare. Select the exact adapter and supported Next version/feature matrix before running its locally installed build command. Do not infer Netlify/Deno support, Edge/Node parity or production readiness from the OpenNext name. Preserve a working existing deployment unless migration is authorized.

## Health Check Endpoint

Always include a health check for load balancers:

```tsx
// app/api/health/route.ts
export async function GET() {
  try {
    // Optional: check database connection
    // await db.$queryRaw`SELECT 1`;

    return Response.json({ status: 'healthy' }, { status: 200 });
  } catch (error) {
    return Response.json({ status: 'unhealthy' }, { status: 503 });
  }
}
```

## Pre-Deployment Checklist

1. **Build locally first**: `npm run build` - catch errors before deploy
2. **Test standalone output**: `node .next/standalone/server.js`
3. **Set `output: 'standalone'`** for Docker
4. **Configure cache handler** for multi-instance ISR
5. **Set `HOSTNAME="0.0.0.0"`** for containers
6. **Copy `public/` and `.next/static/`** - not included in standalone
7. **Add health check endpoint**
8. **Test ISR revalidation** after deployment
9. **Monitor memory usage** - Node.js defaults may need tuning

## Testing Cache Handler

On a Next upgrade, repeat the shared-invalidation scenario above using the existing authenticated mutation/revalidation boundary. Do not introduce an unauthenticated GET `/api/revalidate` endpoint for a smoke check. Record writer/reader instance identity, old/new values and the freshness policy; an unavailable distributed fixture leaves that claim open.
