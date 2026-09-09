## Version and input boundary

The API examples target Payload **3.88.0 stable**, checked **2026-09-09**. **4.0.0-canary.33** is a separate prerelease, not an upgrade instruction. Inspect the installed `payload`, all `@payloadcms/*`, Node, Next/React and database/storage packages and the lockfile. Keep Payload packages on matching versions; check exact peer ranges before choosing a new fixture. In 3.88.0, `@payloadcms/next` accepts Next `>=15.2.9 <15.3.0 || >=15.3.9 <15.4.0 || >=15.4.11 <15.5.0 || >=16.2.6 <17.0.0`; the engine range alone does not prove the whole application compatible. Recheck these current facts for another version using installed exports and official tagged sources.

For an existing v2 application, keep its Express/local initialization, adapter versions, schema and declared commands. Use the official version-matched v2 source and the 2→3 guide only when an upgrade is requested. Do not transplant v3 Web Request handlers, Next routes, storage plugins or experimental fields into v2. If the exact source is unavailable, continue version-independent investigation and identify the affected unknown.

Minimum context is the requested behavior, relevant config/source, version and execution authority. Stronger runtime claims additionally need the actual adapter/environment and meaningful checks. Reference examples are independent integration fragments: collection slugs, generated user fields, application helpers, credentials, db/editor and imports must match the host. They are not complete standalone applications.

Sources: [installation](https://payloadcms.com/docs/getting-started/installation), [3.88.0 peers](https://github.com/payloadcms/payload/blob/v3.88.0/packages/next/package.json), [2→3 guide](https://payloadcms.com/docs/migration-guide/overview).

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
