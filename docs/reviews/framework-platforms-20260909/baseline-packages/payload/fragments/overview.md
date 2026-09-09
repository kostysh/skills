Payload is a Next.js native CMS with TypeScript-first architecture, providing admin panel, database management, REST/GraphQL APIs, authentication, and file storage.

## Quick Reference

| Task                     | Solution                                  | Details                                                                                                                          |
| ------------------------ | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Auto-generate slugs      | `slugField()`                             | [FIELDS.md](references/fields.md)                                                             |
| Restrict content by user | Access control with query                 | [ACCESS-CONTROL.md](references/access-control.md) |
| Local API user ops       | `user` + `overrideAccess: false`          | [QUERIES.md](references/queries.md)                                       |
| Draft/publish workflow   | `versions: { drafts: true }`              | [COLLECTIONS.md](references/collections.md)                                                 |
| Computed fields          | `virtual: true` with afterRead            | [FIELDS.md](references/fields.md)                                                                   |
| Conditional fields       | `admin.condition`                         | [FIELDS.md](references/fields.md)                                                           |
| Custom field validation  | `validate` function                       | [FIELDS.md](references/fields.md)                                                                           |
| Filter relationship list | `filterOptions` on field                  | [FIELDS.md](references/fields.md)                                                                       |
| Select specific fields   | `select` parameter                        | [QUERIES.md](references/queries.md)                                                                           |
| Auto-set author/dates    | beforeChange hook                         | [HOOKS.md](references/hooks.md)                                                                 |
| Prevent hook loops       | `req.context` check                       | [HOOKS.md](references/hooks.md)                                                                         |
| Cascading deletes        | beforeDelete hook                         | [HOOKS.md](references/hooks.md)                                                                 |
| Geospatial queries       | `point` field with `near`/`within`        | [FIELDS.md](references/fields.md)                                                             |
| Reverse relationships    | `join` field type                         | [FIELDS.md](references/fields.md)                                                                         |
| Next.js revalidation     | Context control in afterChange            | [HOOKS.md](references/hooks.md)                 |
| Query by relationship    | Nested property syntax                    | [QUERIES.md](references/queries.md)                                                           |
| Complex queries          | AND/OR logic                              | [QUERIES.md](references/queries.md)                                                                       |
| Transactions             | Pass `req` to operations                  | [ADAPTERS.md](references/adapters.md)                           |
| Background jobs          | Jobs queue with tasks                     | [ADVANCED.md](references/advanced.md)                                                                       |
| Custom API routes        | Collection custom endpoints               | [ADVANCED.md](references/advanced.md)                                                           |
| Cloud storage            | Storage adapter plugins                   | [ADAPTERS.md](references/adapters.md)                                                           |
| Multi-language           | `localization` config + `localized: true` | [ADVANCED.md](references/advanced.md)                                                                   |
| Create plugin            | `(options) => (config) => Config`         | [PLUGIN-DEVELOPMENT.md](references/plugin-development.md)                                 |
| Plugin package setup     | Package structure with SWC                | [PLUGIN-DEVELOPMENT.md](references/plugin-development.md)                       |
| Add fields to collection | Map collections, spread fields            | [PLUGIN-DEVELOPMENT.md](references/plugin-development.md)               |
| Plugin hooks             | Preserve existing hooks in array          | [PLUGIN-DEVELOPMENT.md](references/plugin-development.md)                                               |
| Check field type         | Type guard functions                      | [FIELD-TYPE-GUARDS.md](references/field-type-guards.md)                                                                           |

## Security Pitfalls

### 1. Local API Access Control (CRITICAL)

**By default, Local API operations bypass ALL access control**, even when passing a user.

```ts
// WRONG SECURITY BUG: Passes user but ignores their permissions
await payload.find({
  collection: 'posts',
  user: someUser, // Access control is BYPASSED!
})

// OK SECURE: Actually enforces the user's permissions
await payload.find({
  collection: 'posts',
  user: someUser,
  overrideAccess: false, // REQUIRED for access control
})
```

**When to use each:**

- `overrideAccess: true` (default) - Server-side operations you trust (cron jobs, system tasks)
- `overrideAccess: false` - When operating on behalf of a user (API routes, webhooks)

See [QUERIES.md](references/queries.md).

### 2. Transaction Failures in Hooks

**Nested operations in hooks without `req` break transaction atomicity.**

```ts
// WRONG DATA CORRUPTION RISK: Separate transaction
hooks: {
  afterChange: [
    async ({ doc, req }) => {
      await req.payload.create({
        collection: 'audit-log',
        data: { docId: doc.id },
        // Missing req - runs in separate transaction!
      })
    },
  ]
}

// OK ATOMIC: Same transaction
hooks: {
  afterChange: [
    async ({ doc, req }) => {
      await req.payload.create({
        collection: 'audit-log',
        data: { docId: doc.id },
        req, // Maintains atomicity
      })
    },
  ]
}
```

See [ADAPTERS.md](references/adapters.md).

### 3. Infinite Hook Loops

**Hooks triggering operations that trigger the same hooks create infinite loops.**

```ts
// WRONG INFINITE LOOP
hooks: {
  afterChange: [
    async ({ doc, req }) => {
      await req.payload.update({
        collection: 'posts',
        id: doc.id,
        data: { views: doc.views + 1 },
        req,
      }) // Triggers afterChange again!
    },
  ]
}

// OK SAFE: Use context flag
hooks: {
  afterChange: [
    async ({ doc, req, context }) => {
      if (context.skipHooks) return

      await req.payload.update({
        collection: 'posts',
        id: doc.id,
        data: { views: doc.views + 1 },
        context: { skipHooks: true },
        req,
      })
    },
  ]
}
```

See [HOOKS.md](references/hooks.md).

## Reference Documentation

- **[FIELDS.md](references/fields.md)** - All field types, validation, admin options
- **[FIELD-TYPE-GUARDS.md](references/field-type-guards.md)** - Type guards for runtime field type checking and narrowing
- **[COLLECTIONS.md](references/collections.md)** - Collection configs, auth, upload, drafts, live preview
- **[HOOKS.md](references/hooks.md)** - Collection hooks, field hooks, context patterns
- **[ACCESS-CONTROL.md](references/access-control.md)** - Collection, field, global access control, RBAC, multi-tenant
- **[ACCESS-CONTROL-ADVANCED.md](references/access-control-advanced.md)** - Context-aware, time-based, subscription-based access, factory functions, templates
- **[QUERIES.md](references/queries.md)** - Query operators, Local/REST/GraphQL APIs
- **[ENDPOINTS.md](references/endpoints.md)** - Custom API endpoints: authentication, helpers, request/response patterns
- **[ADAPTERS.md](references/adapters.md)** - Database, storage, email adapters, transactions
- **[ADVANCED.md](references/advanced.md)** - Authentication, jobs, endpoints, components, plugins, localization
- **[PLUGIN-DEVELOPMENT.md](references/plugin-development.md)** - Plugin architecture, monorepo structure, patterns, best practices

## Resources

- llms-full.txt: <https://payloadcms.com/llms-full.txt>
- Docs: <https://payloadcms.com/docs>
- GitHub: <https://github.com/payloadcms/payload>
- Examples: <https://github.com/payloadcms/payload/tree/main/examples>
- Templates: <https://github.com/payloadcms/payload/tree/main/templates>
