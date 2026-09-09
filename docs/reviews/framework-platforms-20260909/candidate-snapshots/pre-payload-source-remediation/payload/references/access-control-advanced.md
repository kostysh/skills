# Payload Access Control - Advanced Patterns

Application policy fragments for context, time, subscriptions and factories. Role/org/subscription fields and helpers are supplied by the host, not built-in Payload features. Use the operation/authorization matrix in [access control](access-control.md).

## Context-Aware Access Patterns

### Locale-Specific Access

Control access based on user locale for internationalized content.

```ts
import type { Access, CollectionConfig } from 'payload'

export const localeSpecificAccess: Access = ({ req: { user, locale } }) => {
  // Authenticated users can access all locales
  if (user) return true

  // Public users can only access English content
  if (locale === 'en') return true

  return false
}

// Usage in collection
export const Posts: CollectionConfig = {
  slug: 'posts',
  access: {
    read: localeSpecificAccess,
  },
  fields: [{ name: 'title', type: 'text', localized: true }],
}
```

**Source**: `docs/access-control/overview.mdx` (req.locale argument)

### Device-Specific Access

Restrict access based on device type or user agent.

```ts
import type { Access, CollectionConfig } from 'payload'

export const mobileOnlyAccess: Access = ({ req: { headers } }) => {
  const userAgent = headers?.get('user-agent') || ''
  return /mobile|android|iphone/i.test(userAgent)
}

export const desktopOnlyAccess: Access = ({ req: { headers } }) => {
  const userAgent = headers?.get('user-agent') || ''
  return !/mobile|android|iphone/i.test(userAgent)
}

// Usage
export const MobileContent: CollectionConfig = {
  slug: 'mobile-content',
  access: {
    read: mobileOnlyAccess,
  },
  fields: [{ name: 'title', type: 'text' }],
}
```

**Source**: Synthesized (headers pattern)

### IP-Based Access

Forwarded headers are user-controlled unless the deployment's trusted proxy removes incoming values and sets a canonical client address. Bind that trust boundary before using an IP policy. Exact-address checks do not implement CIDR.

```ts
import type { Access } from 'payload'
// Application-provided, trusted-proxy address resolver and parsed range matcher.
export const restrictedIpAccess = (
  resolveTrustedIP: (req: Parameters<Access>[0]['req']) => string | undefined,
  inAllowedRange: (ip: string) => boolean,
): Access => ({ req }) => {
  const ip = resolveTrustedIP(req)
  return Boolean(req.user && ip && inAllowedRange(ip))
}
```

Use an explicitly installed IP parser when CIDR is required and test IPv4/IPv6, malformed input and spoofed forwarded headers. User-Agent/device patterns above are spoofable content hints and cannot authenticate or authorize private data.

## Time-Based Access Patterns

### Today's Records Only

```ts
import type { Access, CollectionConfig } from 'payload'

export const todayOnlyAccess: Access = ({ req: { user } }) => {
  if (!user) return false

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(startOfDay)
  endOfDay.setDate(endOfDay.getDate() + 1) // Calendar day; choose the project timezone explicitly

  return {
    createdAt: {
      greater_than_equal: startOfDay.toISOString(),
      less_than: endOfDay.toISOString(),
    },
  }
}
```

**Source**: `test/access-control/config.ts` (query constraint patterns)

### Recent Records (Last N Days)

```ts
import type { Access, CollectionConfig } from 'payload'

export const recentRecordsAccess = (days: number): Access => {
  return ({ req: { user } }) => {
    if (!user) return false
    if (user.roles?.includes('admin')) return true

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    return {
      createdAt: {
        greater_than_equal: cutoff.toISOString(),
      },
    }
  }
}

// Usage: Users see only last 30 days, admins see all
export const Logs: CollectionConfig = {
  slug: 'logs',
  access: {
    read: recentRecordsAccess(30),
  },
  fields: [{ name: 'message', type: 'text' }],
}
```

### Scheduled Content (Publish Date Range)

```ts
import type { Access, CollectionConfig } from 'payload'

export const scheduledContentAccess: Access = ({ req: { user } }) => {
  // Editors see all content
  if (user?.roles?.includes('admin') || user?.roles?.includes('editor')) {
    return true
  }

  const now = new Date().toISOString()

  // Public sees only content within publish window
  return {
    and: [
      { publishDate: { less_than_equal: now } },
      {
        or: [{ unpublishDate: { exists: false } }, { unpublishDate: { greater_than: now } }],
      },
    ],
  }
}
```

**Source**: Synthesized (query constraint + date patterns)

## Subscription-Based Access

### Active Subscription Required

```ts
import type { Access, CollectionConfig } from 'payload'

export const activeSubscriptionAccess: Access = async ({ req }) => {
  const { user } = req
  if (!user) return false
  if (user.roles?.includes('admin')) return true

  try {
    const subscription = await req.payload.findByID({
      req,
      overrideAccess: true, // Policy-owned entitlement lookup, not returned to caller
      collection: 'subscriptions',
      id: user.subscriptionId,
    })

    return subscription?.status === 'active'
  } catch {
    return false
  }
}

// Usage
export const PremiumContent: CollectionConfig = {
  slug: 'premium-content',
  access: {
    read: activeSubscriptionAccess,
  },
  fields: [{ name: 'title', type: 'text' }],
}
```

### Subscription Tier-Based Access

```ts
import type { Access, CollectionConfig } from 'payload'

export const tierBasedAccess = (requiredTier: string): Access => {
  const tierHierarchy = ['free', 'basic', 'pro', 'enterprise']

  return async ({ req }) => {
    const { user } = req
    if (!user) return false
    if (user.roles?.includes('admin')) return true

    try {
      const subscription = await req.payload.findByID({
        req,
        overrideAccess: true, // Policy-owned entitlement lookup, not returned to caller
        collection: 'subscriptions',
        id: user.subscriptionId,
      })

      if (subscription?.status !== 'active') return false

      const userTierIndex = tierHierarchy.indexOf(subscription.tier)
      const requiredTierIndex = tierHierarchy.indexOf(requiredTier)

      return requiredTierIndex >= 0 && userTierIndex >= requiredTierIndex
    } catch {
      return false
    }
  }
}

// Usage
export const EnterpriseFeatures: CollectionConfig = {
  slug: 'enterprise-features',
  access: {
    read: tierBasedAccess('enterprise'),
  },
  fields: [{ name: 'feature', type: 'text' }],
}
```

**Source**: Synthesized (async + cross-collection pattern)

## Factory Functions

Reusable functions that generate access control configurations.

### createRoleBasedAccess

Generate access control for specific roles.

```ts
import type { Access, CollectionConfig } from 'payload'

export function createRoleBasedAccess(roles: string[]): Access {
  return ({ req: { user } }) => {
    if (!user) return false
    return roles.some((role) => user.roles?.includes(role))
  }
}

// Usage
const adminOrEditor = createRoleBasedAccess(['admin', 'editor'])
const moderatorAccess = createRoleBasedAccess(['admin', 'moderator'])

export const Posts: CollectionConfig = {
  slug: 'posts',
  access: {
    create: adminOrEditor,
    update: adminOrEditor,
    delete: moderatorAccess,
  },
  fields: [{ name: 'title', type: 'text' }],
}
```

**Source**: `test/access-control/config.ts`

### createOrgScopedAccess

Generate organization-scoped access with optional admin bypass.

```ts
import type { Access, CollectionConfig } from 'payload'

export function createOrgScopedAccess(allowAdmin = true): Access {
  return ({ req: { user } }) => {
    if (!user) return false
    if (allowAdmin && user.roles?.includes('admin')) return true

    return {
      organizationId: { in: user.organizationIds || [] },
    }
  }
}

// Usage
const orgScoped = createOrgScopedAccess() // Admins bypass
const strictOrgScoped = createOrgScopedAccess(false) // Admins also scoped

export const Projects: CollectionConfig = {
  slug: 'projects',
  access: {
    read: orgScoped,
    update: orgScoped,
    delete: strictOrgScoped,
  },
  fields: [
    { name: 'title', type: 'text' },
    { name: 'organizationId', type: 'text', required: true },
  ],
}
```

**Source**: `test/access-control/config.ts`

### createTeamBasedAccess

Generate team-scoped access with configurable field name.

```ts
import type { Access, CollectionConfig } from 'payload'

export function createTeamBasedAccess(teamField = 'teamId'): Access {
  return ({ req: { user } }) => {
    if (!user) return false
    if (user.roles?.includes('admin')) return true

    return {
      [teamField]: { in: user.teamIds || [] },
    }
  }
}

// Usage with custom field name
const projectTeamAccess = createTeamBasedAccess('projectTeam')

export const Tasks: CollectionConfig = {
  slug: 'tasks',
  access: {
    read: projectTeamAccess,
    update: projectTeamAccess,
  },
  fields: [
    { name: 'title', type: 'text' },
    { name: 'projectTeam', type: 'text', required: true },
  ],
}
```

**Source**: Synthesized (org pattern variation)

### createTimeLimitedAccess

Generate access limited to records within specified days.

```ts
import type { Access, CollectionConfig } from 'payload'

export function createTimeLimitedAccess(daysAccess: number): Access {
  return ({ req: { user } }) => {
    if (!user) return false
    if (user.roles?.includes('admin')) return true

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - daysAccess)

    return {
      createdAt: {
        greater_than_equal: cutoff.toISOString(),
      },
    }
  }
}

// Usage: Users see 90 days, admins see all
export const ActivityLogs: CollectionConfig = {
  slug: 'activity-logs',
  access: {
    read: createTimeLimitedAccess(90),
  },
  fields: [{ name: 'action', type: 'text' }],
}
```

**Source**: Synthesized (time + query pattern)

## Configuration Templates

Complete collection configurations for common scenarios.

### Basic Authenticated Collection

```ts
import type { CollectionConfig } from 'payload'

export const BasicCollection: CollectionConfig = {
  slug: 'basic-collection',
  access: {
    create: ({ req: { user } }) => Boolean(user),
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'content', type: 'richText' },
  ],
}
```

**Source**: `docs/access-control/collections.mdx`

### Public + Authenticated Collection

```ts
import type { CollectionConfig } from 'payload'

export const PublicAuthCollection: CollectionConfig = {
  slug: 'posts',
  access: {
    // Only admins/editors can create
    create: ({ req: { user } }) => {
      return user?.roles?.some((role) => ['admin', 'editor'].includes(role)) || false
    },

    // Authenticated users see all, public sees only published
    read: ({ req: { user } }) => {
      if (user) return true
      return { _status: { equals: 'published' } }
    },

    // Only admins/editors can update
    update: ({ req: { user } }) => {
      return user?.roles?.some((role) => ['admin', 'editor'].includes(role)) || false
    },

    // Only admins can delete
    delete: ({ req: { user } }) => {
      return user?.roles?.includes('admin') || false
    },
  },
  versions: {
    drafts: true,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'content', type: 'richText', required: true },
    { name: 'author', type: 'relationship', relationTo: 'users' },
  ],
}
```

**Source**: `templates/website/src/collections/Posts/index.ts`

### Multi-User/Self-Service Collection

```ts
import type { CollectionConfig } from 'payload'

export const SelfServiceCollection: CollectionConfig = {
  slug: 'users',
  auth: true,
  access: {
    // Admins can create users
    create: ({ req: { user } }) => user?.roles?.includes('admin') || false,

    // Anyone can read user profiles
    read: () => true,

    // Users can update self, admins can update anyone
    update: ({ req: { user }, id }) => {
      if (!user) return false
      if (user.roles?.includes('admin')) return true
      return user.id === id
    },

    // Only admins can delete
    delete: ({ req: { user } }) => user?.roles?.includes('admin') || false,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: ['admin', 'editor', 'user'],
      access: {
        // Only admins can assign/read/update roles
        create: ({ req: { user } }) => Boolean(user?.roles?.includes('admin')),
        read: ({ req: { user } }) => user?.roles?.includes('admin') || false,
        update: ({ req: { user } }) => user?.roles?.includes('admin') || false,
      },
    },
  ],
}
```

**Source**: `templates/website/src/collections/Users/index.ts`

## Debugging Tips

### Log Access Check Execution

```ts
export const debugAccess: Access = ({ req: { user }, id }) => {
  console.log('Access check:', {
    userId: user?.id,
    userRoles: user?.roles,
    docId: id,
    timestamp: new Date().toISOString(),
  })
  return true
}
```

### Verify Arguments Availability

```ts
export const checkArgsAccess: Access = (args) => {
  console.log('Available arguments:', {
    hasReq: 'req' in args,
    hasUser: args.req?.user ? 'yes' : 'no',
    hasId: args.id ? 'provided' : 'undefined',
    hasData: args.data ? 'provided' : 'undefined',
  })
  return true
}
```

### Measure Async Operation Timing

```ts
export const timedAsyncAccess: Access = async ({ req }) => {
  if (!req.user) return false
  const start = Date.now()

  const result = await fetch('https://auth-service.example.com/validate', {
    headers: { userId: String(req.user.id) },
  })

  console.log(`Access check took ${Date.now() - start}ms`)

  return result.ok
}
```

### Test Access Without User

```ts
// In test/development
const testAccess = await payload.find({
  collection: 'posts',
  overrideAccess: false, // Enforce access control
  user: undefined, // Simulate no user
})

console.log('Public access result:', testAccess.docs.length)
```

**Source**: Synthesized (debugging best practices)

## Performance Considerations

### Async Operations Impact

```ts
// WRONG Slow: Multiple sequential async calls
export const slowAccess: Access = async ({ req }) => {
  const { user } = req
  if (!user) return false
  const org = await req.payload.findByID({ collection: 'orgs', id: user.orgId, req, overrideAccess: true })
  const team = await req.payload.findByID({ collection: 'teams', id: user.teamId, req, overrideAccess: true })
  const subscription = await req.payload.findByID({ collection: 'subs', id: user.subId, req, overrideAccess: true })

  return org.active && team.active && subscription.active
}

// OK Fast: Use query constraints or cache in context
export const fastAccess: Access = async ({ req: { user, context } }) => {
  if (!user) return false
  // Cache expensive lookups
  if (!('orgStatus' in context)) {
    context.orgStatus = await checkOrgStatus(user.orgId)
  }

  return context.orgStatus === true
}
```

### Query Constraint Optimization

```ts
// WRONG Avoid: Non-indexed fields in constraints
export const slowQuery: Access = () => ({
  'metadata.internalCode': { equals: 'ABC123' }, // Slow if not indexed
})

// OK Better: Use indexed fields
export const fastQuery: Access = () => ({
  status: { equals: 'active' }, // Indexed field
  organizationId: { in: ['org1', 'org2'] }, // Indexed field
})
```

### Field Access on Large Arrays

```ts
// WRONG Slow: Complex access on array fields
const arrayField: ArrayField = {
  name: 'items',
  type: 'array',
  fields: [
    {
      name: 'secretData',
      type: 'text',
      access: {
        read: async ({ req }) => {
          // Async call runs for EVERY array item
          const result = await expensiveCheck()
          return result
        },
      },
    },
  ],
}

// OK Fast: Simple checks or cache result
const optimizedArrayField: ArrayField = {
  name: 'items',
  type: 'array',
  fields: [
    {
      name: 'secretData',
      type: 'text',
      access: {
        read: ({ req: { user, context } }) => {
          // Cache once, reuse for all items
          if (context.canReadSecret === undefined) {
            context.canReadSecret = Boolean(user?.roles?.includes('admin'))
          }
          return context.canReadSecret
        },
      },
    },
  ],
}
```

### Avoid N+1 Queries

```ts
// WRONG N+1 Problem: Query per access check
export const n1Access: Access = async ({ req, id }) => {
  // List access has no document id and runs once for the query, not once per result
  if (id == null) return false
  const doc = await req.payload.findByID({ collection: 'docs', id, req, overrideAccess: true })
  return doc.isPublic
}

// OK Better: Use query constraint to filter at DB level
export const efficientAccess: Access = () => {
  return { isPublic: { equals: true } }
}
```

**Performance Best Practices:**

1. **Minimize Async Operations**: Use query constraints over async lookups when possible
2. **Cache Expensive Checks**: Store results in `req.context` for reuse
3. **Index Query Fields**: Ensure fields in query constraints are indexed
4. **Avoid Complex Logic in Array Fields**: Simple boolean checks preferred
5. **Use Query Constraints**: Let database filter rather than loading all records

**Source**: Synthesized (operational best practices)

## Enhanced Best Practices

Comprehensive security and implementation guidelines:

1. **Default Deny**: Start with restrictive access, gradually add permissions
2. **Type Guards**: Use TypeScript for user type safety and better IDE support
3. **Validate Data**: Never trust frontend-provided IDs or data
4. **Async for Critical Checks**: Use async operations for important security decisions
5. **Consistent Logic**: Apply same rules at field and collection levels
6. **Test Edge Cases**: Test with no user, wrong user, admin user scenarios
7. **Monitor Access**: Log failed access attempts for security review
8. **Regular Audit**: Review access rules quarterly or after major changes
9. **Cache Wisely**: Use `req.context` for expensive operations
10. **Document Intent**: Add comments explaining complex access rules
11. **Avoid Secrets in Client**: Never expose sensitive logic to client-side
12. **Rate Limit External Calls**: Protect against DoS on external validation services
13. **Handle Errors Gracefully**: Access functions should return `false` on error, not throw
14. **Use Environment Vars**: Store configuration (IPs, API keys) in env vars
15. **Test Local API**: Remember to set `overrideAccess: false` when testing
16. **Consider Performance**: Measure impact of async operations on login time
17. **Version Control**: Track access control changes in git history
18. **Principle of Least Privilege**: Grant minimum access required for functionality

**Sources**: `docs/access-control/*.mdx`, synthesized best practices

Diagnostic callbacks returning true are temporary test probes, never replacement production policies. Cache only server-computed results within the same request and identity; distinguish absent entries from false, and include policy/tenant/locale keys if a request checks multiple contexts. Remote validation helpers need authenticated transport and fail-closed behavior.
