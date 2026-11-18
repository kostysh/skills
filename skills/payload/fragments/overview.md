## Version and input boundary

Start with the installed `payload`, database adapter, Node, and, for a Next.js app, `@payloadcms/next`, Next, and React. Use the lockfile and the published manifests for that release. The examples use Payload v3. The November 2026 reference release is **3.94.0 stable**. The v4 beta channel and the Express-based v2 line have their own entry points and version contracts. Use a prerelease or migrate a major version when the task calls for it.

For **3.94.0**, the published Next adapter peers with Payload 3.94.0. Its supported Next 16 interval is `>=16.4.5 <17.0.0`. The manifest also lists separate Next 15 patch intervals. Both core and the Next adapter declare Node `^22.23.5 || ^24.22.3 || >=26.13.1`. Verify the installed release before choosing an image. Some reference examples retain their explicitly marked 3.88.0 source. [Published adapter](https://registry.npmjs.org/@payloadcms%2fnext/3.94.0) · [Tagged core](https://github.com/payloadcms/payload/blob/v3.94.0/packages/payload/package.json)

For an existing v2 application, keep its Express or standalone Local API initialization, adapter, schema, and project commands. Use the matching tag for v2 behavior. Use the migration guide when an upgrade is requested. If a version fact is unavailable, continue tasks that do not require it. [v2.32.3 initialization](https://github.com/payloadcms/payload/blob/v2.32.3/packages/payload/src/index.ts) · [2→3 guide](https://payloadcms.com/docs/migration-guide/overview)

Reference examples are integration fragments. Match the collection slugs, generated user fields, helpers, database, editor, and imports to the host.

Payload v3 is a Next.js native CMS with TypeScript-first architecture, providing admin panel, database management, REST/GraphQL APIs, authentication, and file storage.

## Quick Reference

| Task                     | Solution                                  | Details                                                                                                                          |
| ------------------------ | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Auto-generate slugs      | Experimental `slugField()`                             | [FIELDS.md](references/fields.md)                                                             |
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
| Transactions             | Enabled transactions + same `req`                  | [ADAPTERS.md](references/adapters.md)                           |
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

- `overrideAccess: true` (default) - Explicitly authorized system operations (cron jobs, migration tasks); server location alone is not authority
- `overrideAccess: false` - When operating on behalf of a user (API routes, webhooks)

See [QUERIES.md](references/queries.md).

### 2. Transaction Failures in Hooks

**Nested operations need the same `req` and an enabled transaction-capable adapter for a shared database transaction.** SQLite disables transactions by default; see the adapter reference for opt-in. MongoDB needs a replica set. External email/storage side effects do not roll back with the database.

```ts
// WRONG DATA CORRUPTION RISK: Separate transaction
hooks: {
  afterChange: [
    async ({ doc, req }) => {
      await req.payload.create({
        overrideAccess: true, // Authorized system audit write; not caller privilege
        collection: 'audit-log',
        data: { docId: doc.id },
        // Missing req - runs in separate transaction!
      })
    },
  ]
}

// Same transaction only when the adapter has transactions enabled
hooks: {
  afterChange: [
    async ({ doc, req }) => {
      await req.payload.create({
        overrideAccess: true, // Authorized system audit write; not caller privilege
        collection: 'audit-log',
        data: { docId: doc.id },
        req, // Shares the existing transaction; does not enable one
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
        overrideAccess: false,
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
        overrideAccess: false,
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
