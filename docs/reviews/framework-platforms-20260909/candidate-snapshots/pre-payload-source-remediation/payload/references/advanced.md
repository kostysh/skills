# Payload Advanced Features

Integration fragments for the version established in SKILL.md. Preserve the complete host buildConfig (db, secret, collections, editor), declared helpers and imports; these fragments are not standalone runnable apps.

## Authentication

### Login

```ts
// REST API
const response = await fetch('/api/users/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password',
  }),
})

// Local API
const result = await payload.login({
  collection: 'users',
  data: {
    email: 'user@example.com',
    password: 'password',
  },
})
```

### Forgot Password

```ts
await payload.forgotPassword({
  collection: 'users',
  data: {
    email: 'user@example.com',
  },
})
```

### Custom Strategy

```ts
import type { CollectionConfig, AuthStrategyFunction } from 'payload'

const authenticate: AuthStrategyFunction = async ({ payload, headers }) => {
  const token = headers.get('authorization')?.split(' ')[1]
  if (!token) return { user: null }
  const user = await verifyToken(token)
  return { user }
}

const customStrategy = {
  name: 'custom',
  authenticate,
}

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    strategies: [customStrategy],
  },
  fields: [],
}
```

`verifyToken` is an application verifier: validate signature, issuer, audience and expiry, then resolve an actual Payload user (including collection) or null. Restart after changing strategies. Local login returns a token; it does not set a browser cookie. Observe cookie/session behavior through the actual HTTP login path.

### API Keys

```ts
import type { CollectionConfig } from 'payload'

export const APIKeys: CollectionConfig = {
  slug: 'api-keys',
  auth: {
    disableLocalStrategy: true,
    useAPIKey: true,
  },
  fields: [],
}
```

## Jobs Queue

Offload long-running or scheduled tasks to background workers.

### Tasks

```ts
import { buildConfig } from 'payload'
import type { TaskConfig } from 'payload'

export default buildConfig({
  jobs: {
    tasks: [
      {
        slug: 'sendWelcomeEmail',
        inputSchema: [
          { name: 'userEmail', type: 'text', required: true },
          { name: 'userName', type: 'text', required: true },
        ],
        outputSchema: [{ name: 'emailSent', type: 'checkbox', required: true }],
        retries: 2, // Retry up to 2 times on failure
        handler: async ({ input, req }) => {
          await sendEmail({
            to: input.userEmail,
            subject: `Welcome ${input.userName}`,
          })
          return { output: { emailSent: true } }
        },
      } as TaskConfig<'sendWelcomeEmail'>,
    ],
  },
})
```

### Queueing Jobs

```ts
// In a hook or endpoint
await req.payload.jobs.queue({
  req,
  task: 'sendWelcomeEmail',
  input: {
    userEmail: 'user@example.com',
    userName: 'John',
  },
  waitUntil: new Date('2024-12-31'), // Optional: schedule for future
})
```

### Workflows

Multi-step jobs that run in sequence:

```ts
import type { WorkflowConfig } from 'payload'
// sendEmail/createTasks are app-supplied idempotent side effects.
export const onboardUser: WorkflowConfig<{ userId: string }> = {
  slug: 'onboardUser',
  inputSchema: [{ name: 'userId', type: 'text', required: true }],
  handler: async ({ job, inlineTask }) => {
    await inlineTask('welcome-email', {
      input: { userId: job.input.userId },
      task: async ({ input }) => {
        await sendEmail(input.userId)
        return { output: { emailSent: true } }
      },
    })
    await inlineTask('onboarding-tasks', {
      input: { userId: job.input.userId },
      task: async ({ input }) => {
        await createTasks(input.userId)
        return { output: { tasksCreated: true } }
      },
    })
  },
}
```

`jobs.queue` persists pending work. A configured worker or authorized `payload.jobs.run` must process it; inspect terminal job state, error/log, retries and the resulting records. A resolved run call can still contain failed jobs. Stable step IDs support retry bookkeeping; external effects must remain idempotent. Optional concurrency is version-sensitive (introduced v3.71); inspect the installed release for retry fixes rather than changing existing policy.

## Custom Endpoints

Add custom REST API routes to collections, globals, or root config. See [ENDPOINTS.md](endpoints.md) for detailed patterns, authentication, helpers, and real-world examples.

### Root Endpoints

```ts
import { buildConfig } from 'payload'
import type { Endpoint } from 'payload'

const helloEndpoint: Endpoint = {
  path: '/hello',
  method: 'get',
  handler: () => {
    return Response.json({ message: 'Hello!' })
  },
}

const greetEndpoint: Endpoint = {
  path: '/greet/:name',
  method: 'get',
  handler: (req) => {
    return Response.json({
      message: `Hello ${req.routeParams.name}!`,
    })
  },
}

export default buildConfig({
  endpoints: [helloEndpoint, greetEndpoint],
  collections: [],
  secret: process.env.PAYLOAD_SECRET || '',
})
```

### Collection Endpoints

```ts
import type { CollectionConfig, Endpoint } from 'payload'

const featuredEndpoint: Endpoint = {
  path: '/featured',
  method: 'get',
  handler: async (req) => {
    const posts = await req.payload.find({
      req,
      overrideAccess: false,
      collection: 'posts',
      where: { featured: { equals: true } },
    })
    return Response.json(posts)
  },
}

export const Posts: CollectionConfig = {
  slug: 'posts',
  endpoints: [featuredEndpoint],
  fields: [
    { name: 'title', type: 'text' },
    { name: 'featured', type: 'checkbox' },
  ],
}
```

## Custom Components

### Field Component (Client)

```tsx
'use client'
import { useField } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'

export const CustomField: TextFieldClientComponent = ({ path }) => {
  const { value, setValue } = useField<string>({ path })

  return <input value={value || ''} onChange={(e) => setValue(e.target.value)} />
}
```

### Custom View

```tsx
import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'

export const CustomView = ({ initPageResult, params, searchParams }: AdminViewServerProps) => (
  <DefaultTemplate
    i18n={initPageResult.req.i18n}
    locale={initPageResult.locale}
    params={params}
    payload={initPageResult.req.payload}
    permissions={initPageResult.permissions}
    searchParams={searchParams}
    user={initPageResult.req.user || undefined}
    visibleEntities={initPageResult.visibleEntities}
  >
    <h1>Custom Dashboard</h1>
  </DefaultTemplate>
)
```

Keep this view server-side; place interactive children in separate client components. Register the component path and regenerate the host import map, then verify the actual Admin view.

### Admin Config

```ts
import { buildConfig } from 'payload'

export default buildConfig({
  admin: {
    components: {
      beforeDashboard: ['/components/BeforeDashboard'],
      beforeLogin: ['/components/BeforeLogin'],
      views: {
        custom: {
          Component: '/views/Custom',
          path: '/custom',
        },
      },
    },
  },
  collections: [],
  secret: process.env.PAYLOAD_SECRET || '',
})
```

## Plugins

### Available Plugins

- **@payloadcms/plugin-seo** - SEO fields with meta title/description, Open Graph, preview generation
- **@payloadcms/plugin-redirects** - Store redirect records; frontend code must implement and verify HTTP redirects
- **@payloadcms/plugin-nested-docs** - Hierarchical document structures with breadcrumbs
- **@payloadcms/plugin-form-builder** - Dynamic form builder with submissions and validation
- **@payloadcms/plugin-search** - First-party search collection/index; external search integration is separate
- **@payloadcms/plugin-stripe** - Stripe payments, subscriptions, webhooks
- **@payloadcms/plugin-ecommerce** - Complete ecommerce solution (products, variants, carts, orders)
- **@payloadcms/plugin-import-export** - Import/export CSV and JSON; job execution requires a runner
- **@payloadcms/plugin-multi-tenant** - Multi-tenancy with tenant isolation
- **@payloadcms/plugin-sentry** - Sentry error tracking integration
- **@payloadcms/plugin-mcp** - Model Context Protocol for AI integrations

### Using Plugins

```ts
import { buildConfig } from 'payload'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'

export default buildConfig({
  plugins: [
    seoPlugin({
      collections: ['posts', 'pages'],
    }),
    redirectsPlugin({
      collections: ['pages'],
    }),
  ],
  collections: [],
  secret: process.env.PAYLOAD_SECRET || '',
})
```

### Creating Plugins

```ts
import type { Config } from 'payload'

interface PluginOptions {
  enabled?: boolean
}

export const myPlugin =
  (options: PluginOptions) =>
  (config: Config): Config => ({
    ...config,
    collections: [
      ...(config.collections || []),
      {
        slug: 'plugin-collection',
        fields: [{ name: 'title', type: 'text' }],
      },
    ],
    onInit: async (payload) => {
      if (config.onInit) await config.onInit(payload)
      // Plugin initialization
    },
  })
```

## Localization

```ts
import { buildConfig } from 'payload'
import type { TextField } from 'payload'

export default buildConfig({
  localization: {
    locales: ['en', 'es', 'de'],
    defaultLocale: 'en',
    fallback: true,
  },
  collections: [],
  secret: process.env.PAYLOAD_SECRET || '',
})

// Localized field
const localizedField: TextField = {
  name: 'title',
  type: 'text',
  localized: true,
}

// Query with locale
const posts = await payload.find({
  collection: 'posts',
  locale: 'es',
})
```

## TypeScript Type References

For complete TypeScript type definitions and signatures, reference these files from the Payload source:

### Core Configuration Types

- **[All Commonly-Used Types](https://github.com/payloadcms/payload/blob/v3.88.0/packages/payload/src/index.ts)** - Check here first for commonly used types and interfaces. All core types are exported from this file.

### Database & Adapters

- **[Database Adapter Types](https://github.com/payloadcms/payload/blob/v3.88.0/packages/payload/src/database/types.ts)** - Base adapter interface
- **[MongoDB Adapter](https://github.com/payloadcms/payload/blob/v3.88.0/packages/db-mongodb/src/index.ts)** - MongoDB-specific options
- **[Postgres Adapter](https://github.com/payloadcms/payload/blob/v3.88.0/packages/db-postgres/src/index.ts)** - Postgres-specific options

### Rich Text & Plugins

- **[Lexical Types](https://github.com/payloadcms/payload/blob/v3.88.0/packages/richtext-lexical/src/exports/server/index.ts)** - Lexical editor configuration

For another installed release, use that exact tag/installed exported definitions; these links pin the reviewed 3.88.0 source. Localization completeness must be read per locale with fallback disabled.
