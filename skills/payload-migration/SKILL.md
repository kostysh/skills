---
name: payload-migration
description: Use when migrating content from WordPress, Contentful, Strapi,
  Sanity, Webflow, CSV/JSON exports, or another CMS into Payload CMS; especially
  when analyzing source data, designing Payload collections, mapping fields,
  resolving relationships, media, rich text, localization, and planning an
  import strategy.
compatibility: Portable documentation-only migration planning skill based on the
  upstream payloadcms/skills cms-migration guidance. Use payload for general
  Payload implementation after the migration model is agreed.
metadata:
  source-version: 0.1.0
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: b5c584a8826abf246763a3f9f91072272b97ac48e5d0e8d735d06070c734b165
---

# payload-migration

## Start here

1. Confirm the task is about migrating content or schema into Payload CMS.
2. Ask for representative source data, schema, or export samples before proposing collection configs; one happy-path row is not enough when edge cases matter.
3. Use a config-first workflow: design and confirm Payload collections before planning or writing an import.
4. Load the field reference when choosing Payload field types or mapping CMS-specific patterns.
5. Do not claim data has been migrated until import code or a migration run has been verified against real or representative data.

## When to use this skill

- Migrating content from WordPress, Contentful, Strapi, Sanity, Webflow, custom CMSs, CSV, JSON, API responses, or database schemas into Payload CMS.
- Mapping source fields to Payload text, textarea, richText, number, date, relationship, upload, array, blocks, group, select, json, auth, or upload collection configs.
- Designing migration order, source-ID to Payload-ID mapping, media handling, rich text conversion, localization, and seed/import scripts after collection configs are confirmed.

## When NOT to use this skill

- The task is general Payload application development with an existing schema; use payload.
- The migration target is not Payload CMS.
- The user only needs generic ETL, database import, or data cleaning with no Payload collection or field design.
- The user asks to execute a destructive import but source data, target environment, rollback, or verification path is unclear; stop and ask.

## Overview

Interactive workflow to design Payload collections from source CMS data. Config-first approach: establish the data structure through conversation before any data import.

## Workflow

```
Start
  v
Ask for data sample
  v
Analyze data shape
  v
Propose collection config
  v
User reviews --------------+
  |                        |
  |-- changes needed ----> Adjust config ---> (back to User reviews)
  |
  `-- looks good ----> Config confirmed
                            v
                    More collections? ------+
                            |               |
                            |-- yes ---> (back to Ask for data sample)
                            |
                            `-- no ----> All collections confirmed
                                              v
                                      Discuss migration approach
                                              v
                                            Done
```

## Phase 1: Data Analysis

When user provides data (JSON, CSV, or describes their schema):

1. **Identify field types** - text, number, date, relationships, media, rich text
2. **Spot patterns** - IDs, timestamps, nested objects, arrays
3. **Note relationships** - foreign keys, embedded refs, linked content types
4. **Flag ambiguities** - fields that could be multiple types, unclear purposes

## Phase 2: Propose Collection Config

Present a Payload collection config based on analysis:

```typescript
// Example output format
export const Posts: CollectionConfig = {
  slug: 'posts',
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'content', type: 'richText' },
    { name: 'author', type: 'relationship', relationTo: 'users' },
    // ...
  ],
}
```

Explain your reasoning for each field choice. When something could go multiple ways (group vs JSON, text vs textarea, select vs relationship), ask rather than assume.

## Phase 3: Iterate with User

Work through uncertainties: required fields, hasMany relationships, rich text vs HTML, custom timestamps vs built-in. Continue until the user confirms the config.

## Phase 4: Additional Collections

After each confirmation, ask:

> "Are there other content types we should create collections for?"

If yes, loop back to Phase 1 with new data sample.

Common related collections to prompt for:
- Media/uploads
- Users/authors
- Categories/tags
- Settings (global)

## Phase 5: Migration Approach

Only after ALL collections are confirmed, discuss data import:

1. **Order matters** - which collections have no dependencies? Migrate those first
2. **Relationship mapping** - how to resolve source IDs to Payload IDs
3. **Media handling** - download/re-upload vs external URLs
4. **Rich text** - HTML conversion needs or keep raw

Offer to generate a seed script or walk through manual import.

## Things to Clarify

Throughout the process, watch for these:

- **ID references** - are they relationships to other collections?
- **Image/file URLs** - upload fields or keep as external URLs?
- **Nested objects** - group, array, or blocks?
- **Localization** - any fields need per-locale values?
- **Access control** - who can read/write this collection?
- **Related content types** - categories, tags, authors that need their own collections?

## Critical: Select vs Relationship

**This is the most common migration mistake.** Data that looks static often needs to be dynamic.

When you see repeated string values (categories, tags, types, statuses):

```json
{ "category": "Technology" }
{ "category": "News" }
{ "category": "Technology" }
```

**Don't assume it's a select field.** Ask:

> "I see `category` has values like 'Technology', 'News'. Should this be:
> - A **select field** with fixed options (values won't change)
> - A **relationship** to a Categories collection (users can add/edit/remove categories later)"

**Default to relationship** for anything that looks like:
- Categories, tags, topics, labels
- Authors, assignees, reviewers
- Statuses beyond simple draft/published
- Types that might expand over time

**Use select only for:**
- Truly fixed enums (yes/no, draft/published/archived)
- Options defined by business logic, not content (payment status, priority levels)
- Values that would break functionality if changed (role types with code dependencies)

If creating a relationship, remember to add the related collection (Categories, Tags, etc.) to the migration plan.

## Reference Documentation

- **[PAYLOAD-FIELD-REFERENCE.md](references/payload-field-reference.md)** - Complete Payload field type schemas with examples

## Common Pitfalls

| Issue | How to Handle |
|-------|---------------|
| User provides partial data | Ask for more samples, especially edge cases |
| Unclear relationships | Ask user to describe how content types connect |
| Rich text ambiguity | Clarify: Lexical editor, Slate, or store raw HTML |
| Missing media collection | Always confirm upload collection exists before referencing |
| Overly complex nested data | Consider flattening or using blocks instead of deep groups |

## Workflow stages

### Workflow stage: Analyze source data

Understand the source content model, field shapes, relationships, and edge cases before proposing Payload config.

1. Inspect sample JSON, CSV headers, API responses, database schemas, or user-provided CMS descriptions.
2. Identify field types, repeated patterns, IDs, timestamps, nested objects, arrays, media URLs, rich text, localization, and relationship candidates.
3. Flag ambiguous fields instead of silently choosing a Payload type.

Validation:

- The analysis names source content types, candidate relationships, and missing samples or edge cases.
- Ambiguities that affect Payload field choice are explicit.

### Workflow stage: Propose collection config

Produce Payload collection configs that match the source model and can be reviewed before data import.

1. Use Payload field types from the field reference and local project conventions when available.
2. Prefer relationships for dynamic content concepts such as categories, tags, authors, assignees, topics, and labels unless the user confirms they are fixed enums.
3. Explain uncertain choices and ask for confirmation when select vs relationship, rich text format, media handling, nesting, or localization is unclear.

Validation:

- Proposed configs are copy-paste-ready TypeScript or clearly marked pseudocode when project context is missing.
- Related collections needed by relationship fields are included in the migration model.

### Workflow stage: Confirm complete model

Iterate until all collections and globals needed for the migration are agreed.

1. Incorporate user feedback into the collection configs.
2. Ask whether more content types, media, users/authors, categories/tags, or settings/globals must be modeled.
3. Do not move to import planning until the user confirms the collection set.

Validation:

- The final model lists every collection/global needed for the migration.
- Unresolved schema decisions are either closed or explicitly deferred.

### Workflow stage: Plan import

Define an import approach that respects dependency order, identity mapping, media, rich text, localization, and verification.

1. Order collections by dependency and identify source-ID to Payload-ID mapping storage.
2. Define media download/re-upload versus external URL handling.
3. Define rich text conversion strategy and any fields that must remain raw.
4. Offer a seed/import script only after the model is confirmed.

Validation:

- The plan separates generated configs from actual data import behavior.
- Verification includes representative migrated records, relationships, media, and rich text where applicable.

## Interop priority

- **general Payload project implementation after schema decisions are made:** payload. payload-migration owns source-to-Payload mapping; payload owns ongoing Payload app development.
- **TypeScript language, module structure, type generation, and compile errors in import scripts:** typescript-engineer. This skill owns migration modeling; TypeScript language/toolchain rules belong to typescript-engineer.
- **deterministic tests for import scripts, fixtures, and parity checks:** typescript-test-engineer. This skill defines migration verification targets; test design belongs to typescript-test-engineer.

## Gotchas

- **high** — Repeated strings such as categories, tags, authors, topics, or labels often need relationship collections, not select fields.
- **high** — Partial source data can hide nullable fields, mixed types, relationship cardinality, rich text formats, media variants, and localization.
- **high** — Collection config approval is not a completed migration; import code or execution needs separate verification.
- **medium** — Rich text sources may be HTML, Markdown, Lexical JSON, Slate JSON, or vendor-specific ASTs; choose a conversion path explicitly.
- **medium** — Media URLs are not equivalent to Payload upload relationships unless download, upload, metadata, and failure handling are planned.

## Policies

### Config-first policy
Design and confirm the Payload content model before writing or running data import code.

### Ambiguity policy
Ask when a source field could reasonably map to multiple Payload types; do not hide irreversible modeling choices inside generated config.

### Capability claims policy
Distinguish schema design, import planning, generated scripts, and verified migrated data in final reports.

## Required active references
- [Payload Field Reference](references/payload-field-reference.md) — Read this when mapping source fields, nested data, arrays, media, rich text, relationships, auth/upload collections, or CMS-specific patterns to Payload field configs.

## Portability rules

- Do not reference machine-specific absolute paths or local files outside this skill folder.
- Keep all mandatory migration guidance inside this skill folder through SKILL.md and local references.
- Use relative links for local references, assets, scripts, tests, and supporting docs.

## Portability checklist before finishing

- Run the skill-source-compiler check command after regeneration.
- Search the skill folder for absolute local paths before finishing.
- Confirm every required reference listed by SKILL.md exists inside this skill folder.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
- Supporting glob: `docs/logs/*`
