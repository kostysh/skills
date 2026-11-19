---
name: payload
description: "Use when working with Payload CMS projects: payload.config.ts,
  collections, globals, fields, hooks, access control, Payload
  Local/REST/GraphQL APIs, adapters, endpoints, jobs, plugins, and
  Payload-specific validation, security, relationship, transaction, or hook
  behavior."
metadata:
  source-version: 0.1.3
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 04c6f843ceb054b4dcf70d01e78037459ce928f593eaa8d860100157ecc2668f
---

# payload

## Start here

1. Confirm the project actually uses Payload CMS or the task is explicitly about Payload behavior.
2. Inspect local Payload version, package manager, database adapter, payload.config.ts, collection/global files, generated types, and available validation commands before choosing a pattern.
3. Reuse the accepted task, environment and mutation authority; reviews stay read-only. Missing facts or permissions stop only dependent work, and existing approval is not requested again.
4. Compare installed exports/peers with version-matched official docs before current API recommendations; no automatic major upgrade or canary adoption.
5. Load only the reference files that match the touched Payload surface; do not read every reference by default.
6. Preserve existing project conventions unless they conflict with Payload access, transaction, hook, type, or adapter semantics.
7. Verify the requested behavior through the caller's Payload interface. For access claims, report the acting user, how access was enforced, and any separate query filter.

## When to use this skill

- Building, changing, reviewing, or debugging Payload CMS applications.
- Working on payload.config.ts, collections, globals, fields, hooks, access control, Local API, REST, GraphQL, adapters, endpoints, jobs, plugins, admin components, or generated Payload types.
- Investigating Payload-specific validation errors, security problems, relationship queries, hook loops, transaction issues, adapter behavior, or plugin composition.

## When NOT to use this skill

- The task is only a generic Next.js, React, Node.js, TypeScript, or database problem with no Payload-specific API or config surface.
- The task owns source extraction, mapping, import, rerun, or reconciliation into Payload; use payload-migration, pairing this skill for target runtime mechanics.
- The request is a security audit across auth, secrets, webhooks, or permissions rather than Payload-specific guidance; pair with security-reviewer.
- The work is pure visual design or admin UI layout without Payload framework behavior.

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

## Workflow stages

### Workflow stage: Establish Payload context

Ground the work in the installed Payload version, project structure, adapter, and runtime constraints.

1. Inspect package metadata, payload.config.ts, collection/global definitions, generated type location, database/storage adapters, and local commands.
2. Identify whether the change touches access control, hooks, transactions, fields, endpoints, adapter setup, or plugin composition.
3. Select the smallest relevant reference file for that surface.

Validation:

- The chosen approach matches the local Payload version and project conventions or leaves only the unsupported version-dependent conclusion open.
- The task is scoped to concrete Payload behavior, not generic framework advice.

### Workflow stage: Apply the Payload pattern

Implement or review the Payload change using the framework primitive that preserves type safety, access behavior, hook behavior, and transaction boundaries.

1. Use the loaded reference guidance together with local code style.
2. Keep access-control decisions explicit, especially Local API calls that operate for a user.
3. Thread req and await nested operations; establish adapter support and enabled transactions before claiming atomicity.
4. Use context flags or equivalent guards for hook-triggered follow-up operations that could recurse.

Validation:

- The result avoids known Payload pitfalls for access control, hooks, transactions, fields, and relationships.
- Any substrate-only output is not described as completed runtime behavior unless verified.

### Workflow stage: Verify Payload behavior

Prove the changed Payload surface with the narrowest meaningful project check.

1. Run existing type generation, typecheck, lint, tests, build, or a targeted API/admin smoke check when available.
2. Use a config load or type generation for schema claims. For access, hook, or delivered-data changes, exercise the operation and compare the observed records or side effects with the expected outcome.
3. If validation cannot run, perform the next-best static check and report the limitation.

Validation:

- The final report names the checks that passed or the exact verification gap.

## Interop priority

- **source CMS extraction, mapping, authorized import, rerun, and reconciliation:** payload-migration. Supply the target version and adapter, accepted fields, source keys and relationship IDs, and a read through the intended caller when needed for reconciliation. payload-migration owns mapping, execution, retries, and reconciliation.
- **Next.js routing, React Server Components, Server Actions, metadata, images, fonts, bundling, or self-hosting:** nextjs. Payload owns the CMS read for the intended caller. nextjs owns v3 page routing, caching, and rendering. For a page claim, follow the actual document value through the route and a fresh request. Existing v2 projects retain their Express entry point.
- **TypeScript language, tsconfig, linting, and type-system issues:** typescript-engineer. This skill owns Payload APIs and idioms; TypeScript language and toolchain rules belong to typescript-engineer.
- **TypeScript test design, mocks, fixtures, determinism, and runner behavior:** typescript-test-engineer. This skill names Payload verification targets; TypeScript test structure belongs to typescript-test-engineer.
- **cross-cutting security review, threat modeling, secrets, webhook verification, and vulnerability triage:** security-reviewer. Use this skill for Payload-specific access semantics; use security-reviewer for broader security audit workflow.

## Gotchas

- **high** — Payload Local API bypasses access control by default; set overrideAccess false when operating on behalf of a user.
- **high** — Nested operations in hooks or request flows can leave the transaction boundary unless req is threaded through supported operations.
- **high** — Hook-triggered operations can recurse; use context or another explicit guard when an operation could trigger the same hook again.
- **medium** — Do not load the full reference set by default; choose the file whose trigger matches the current Payload surface.
- **medium** — Payload examples are version-sensitive; verify local package versions and generated types before applying remembered API details.

## Policies

### Access evidence policy
Access-control changes must state whether they affect admin UI, Local API, REST, GraphQL, or all paths, and verification should exercise the relevant path when possible.

### Transaction evidence policy
Hook or nested-operation changes must preserve the intended transaction boundary or explicitly state when atomicity is not required.

### Output reporting policy
Final reports must distinguish implemented Payload behavior from supporting config, generated files, docs, or unverified examples.

## Required active references
- [Access Control](references/access-control.md) — Read this when implementing collection, field, global, RBAC, multi-tenant, or Local API access behavior.
- [Access Control Advanced](references/access-control-advanced.md) — Read this when access depends on context, time, subscriptions, factory functions, templates, debugging, or performance.
- [Adapters](references/adapters.md) — Read this when configuring database, storage, email adapters, transactions, or nested operations that must share req.
- [Advanced](references/advanced.md) — Read this when working with auth flows, jobs queue, custom endpoints, admin components, plugins, localization, or core Payload types.
- [Collections](references/collections.md) — Read this when designing collections, auth collections, uploads, live preview, drafts, versions, or globals.
- [Endpoints](references/endpoints.md) — Read this when adding or debugging custom root, collection, or global endpoints, request helpers, CORS, or endpoint auth.
- [Field Type Guards](references/field-type-guards.md) — Read this when traversing Payload fields at runtime or narrowing field config types safely.
- [Fields](references/fields.md) — Read this when choosing or configuring field types, validation, admin options, virtual fields, joins, arrays, blocks, tabs, or field factories.
- [Hooks](references/hooks.md) — Read this when implementing collection or field hooks, hook context, revalidation, auto-set fields, or loop prevention.
- [Plugin Development](references/plugin-development.md) — Read this when creating or maintaining Payload plugins, plugin package structure, field/collection injection, hooks, endpoints, admin components, or i18n.
- [Queries](references/queries.md) — Read this when using Local API, REST, GraphQL, query operators, relationship depth, select, transactions, or access-aware user operations.

## Portability rules

- Portable documentation-only skill based on the upstream payloadcms/skills Payload guidance. Use alongside framework, TypeScript, testing, and security skills for non-Payload concerns.
- Do not reference machine-specific absolute paths or local files outside this skill folder.
- Keep all mandatory Payload guidance inside this skill folder through SKILL.md and local references.
- Use relative links for local references, assets, scripts, tests, and supporting docs.

## Portability checklist before finishing

- Run the skill-source-compiler check command after regeneration.
- Search the skill folder for absolute local paths before finishing.
- Confirm every required reference listed by SKILL.md exists inside this skill folder.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
- Supporting glob: `docs/logs/*`
