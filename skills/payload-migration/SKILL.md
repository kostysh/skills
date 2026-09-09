---
name: payload-migration
description: Migrate WordPress, Contentful, Strapi, Sanity, Webflow or CSV/JSON
  content into Payload. Analyze exports, design schemas, map fields, relations,
  media, rich text and locales; execute authorized imports, recover reruns and
  reconcile results. Use payload for target runtime mechanics.
compatibility: Portable documentation-only migration skill. Execution needs the
  supplied source, installed Payload environment and operation authority; no
  bundled importer or universal source CMS converter is claimed.
metadata:
  source-version: 0.1.2
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: c41fe7a14d0c6c8d1b1a8e653d0db669090e16a4690d27b0691a98d389986458
---

# payload-migration

## Start here

1. Establish the requested outcome (analysis, schema, script, import or reconciliation), source/version/format, target environment and existing authority from the conversation and project.
2. Reuse accepted schema, fixed enums, source mapping and execution approvals; do not restart confirmation when they are already supplied.
3. Inspect representative and edge-case source records, the accepted model, installed Payload/editor/adapter packages and declared project commands; missing facts stop only dependent work.
4. Load the field reference when mapping data or choosing target config; retain the source namespace and full expected identity set for execution.
5. Continue through the authorized import, recovery and reconciliation scope; report only the boundary actually exercised.

## When to use this skill

- Migrating WordPress, Contentful, Strapi, Sanity, Webflow, custom CMS, CSV, JSON, API or database content into Payload.
- Designing or implementing field mappings, collections/globals, source identity, relationships, media, rich text and locale conversion.
- Implementing or running authorized imports, recovering interrupted runs, rerunning safely and reconciling migrated data.

## When NOT to use this skill

- General Payload development unrelated to source migration; use payload for target runtime mechanisms.
- The migration target is not Payload CMS, or the task is generic ETL without a Payload boundary.
- A pure frontend rendering/cache task belongs to nextjs; pair it when migration acceptance needs a rendered page.

## Overview

The consumer is the owner of the target Payload application. Deliver the requested migration result: source-grounded schema/transformations when that is the scope, or persisted and reconciled content when execution is authorized. Reuse accepted choices and permissions throughout follow-ups.

## Version and minimum input boundary

The target examples were checked against **Payload 3.88.0 stable on 2026-09-09**. **4.0.0-canary.33** is a separate prerelease. Inspect the actual installed Payload, editor, database and storage packages; matching `@payloadcms/*` versions and peer compatibility matter. Preserve an existing supported v2 project and its initialization/storage/CLI contracts; do not upgrade it to make a v3 example work. Use exact installed types and official version-matched docs for another version.

For analysis, samples/schema plus the requested mapping are enough to make supported progress. Actual import additionally needs source access and namespace, accepted target model/environment, write authority, identity/update policy and a verification path. Destructive import, production mutation and cutover require that operation's authority. They do not require new permission when the current conversation already provides it. A missing expert/tool/current source limits only the dependent conclusion; this local method remains usable for supported data work.

## Durable identity and recovery

Use the source installation/space/dataset/environment, content type and source ID as a deterministic identity; include locale only if the accepted target stores locales as separate documents. Source IDs from different systems must not collide. Preserve the source snapshot/revision or export hash so a resumed run does not silently mix changing datasets.

Prefer an existing importer/identity field. Otherwise persist a unique source key with the target document or an equivalent transactionally safe durable map. The map records target collection/ID and per-record/per-locale/per-phase state, source revision/hash, retries and unresolved errors. A separate checkpoint file alone is insufficient: a crash after the target commit but before the checkpoint must recover the existing target through its source key. Uniqueness must also resolve concurrent create races. Advance a durable checkpoint only after persisted work is known; on uncertain responses reread by identity before retrying. Use a single writer unless the accepted importer handles concurrency.

State the policy for existing target records: create missing, update the accepted fields, skip unchanged, retry failed phases, and surface conflicts with target edits. Do not delete records or replace unrelated data because they are absent from the current source sample. A retry is not an unbounded loop; distinguish transient transport failures from malformed source, schema violations, denied access and unresolved mappings.

## Relationships, media, rich text and locales

Import entities/media to obtain real target IDs, then resolve cyclic references in a second pass. Required cyclic fields may need an already accepted staging/draft model or an atomic adapter-supported strategy; do not silently weaken schema or insert fake IDs. Preserve relation collection/cardinality, ordered arrays and block discriminators. Keep unresolved references in the failure ledger.

For media, persist source identity and returned upload ID, validate response status and bytes/type/metadata, and recover transient failures without re-upload duplicates. Preimport media before converting embedded editor uploads and internal links. External URLs are not upload relationships. Use the installed editor's supported converter/nodes: HTML, Markdown, Contentful AST, Strapi Blocks and Sanity Portable Text are different inputs. Preserve unknown nodes/raw source as diagnostic material when permitted and mark required content partial; do not silently flatten or label raw HTML as Lexical.

Write each supplied locale explicitly and reread it with `fallbackLocale: false`; a fallback value must not disguise a missing translation. Preserve the difference between missing, explicit null/empty and a provided value under the accepted mapping. Retain source status/privacy/timezone semantics instead of assuming every status maps to Payload draft/published.

## Verification and handoff

Freeze or account for source changes and enumerate all pages. Reconcile complete expected source-key sets against authoritative target queries, including records missed by the checkpoint. Compare counts per collection and explicit locale; detect duplicates, missing/extra imports, failed media, unresolved relations and content differences. Sampling is useful for visual checks but not proof of full ID coverage.

A reliable-rerun claim needs an interrupted/partial run followed by recovery and a repeat run with unchanged source; inspect persisted state for duplicates and omissions. Test the same actor and data path. Payload owns target adapter/API/access mechanisms, TypeScript/test skills own language/test mechanics, and nextjs owns frontend rendering/cache. Supply IDs, expected content and requested routes to those owners and consume their actual observations; their config or build cannot replace migration reconciliation.

The final result names the requested and completed scope, source/target versions/environment, created/updated/skipped/failed counts, full identity reconciliation, unresolved content, rerun/check results and evidence limits. Report partial until every required record, relation, locale, media and node is accounted for. A dry run, generated script, local database import, public API read and rendered page are distinct evidence boundaries.

## Schema decisions

Use relationships for editor-managed categories/tags/authors and select for accepted fixed enums. Repetition in a sample alone does not establish either. Do not reopen an accepted enum. Model required related collections and globals, preserving nesting, array order and accepted cardinality. Read [Payload Field Reference](references/payload-field-reference.md) for field and source-format details.

## Workflow stages

### Workflow stage: Establish source and accepted target

Resolve the source contract and the existing target model without inventing missing semantics.

1. Identify source system/version/API or export shape, identity namespace, content types, all pages, source snapshot boundaries and expected IDs.
2. Identify null/absent values, timestamps and units, statuses/privacy, relationships, arrays/blocks, media, editor format and explicit locale variants.
3. Reuse accepted collections/globals, cardinality, enums and constraints; propose changes only for a material uncovered source requirement.
4. Ask only for missing or conflicting decisions that affect the dependent mapping or action; continue supported inspection or pure transformation.

Validation:

- The model includes the required related collections/globals and preserves accepted choices.
- Unsupported source formats or nodes remain explicit gaps, not invented conversions.

### Workflow stage: Prepare schema and transformations

Produce version-matched target config and transformations for the agreed source model.

1. Use exported Payload types and installed version-specific APIs; pair payload for target config/access/adapter behavior and preserve existing supported legacy versions.
2. Prefer relationships for editable content vocabularies and select for accepted fixed enums; sample repetition alone does not decide either.
3. Define source-ID to target-ID keys, media import and editor-specific node/link conversion, locale writes and the create/update/retry policy before executing dependent writes.
4. Validate the actual config and pure transformations with declared project checks; label incomplete fragments and unsupported values honestly.

Validation:

- Config, transformed data and required host dependencies are distinguished from an imported dataset.
- Genuine unresolved schema decisions remain with the owner; existing accepted decisions need no repeated approval.

### Workflow stage: Execute and recover the authorized import

Persist the intended dataset and recover partial failures without duplicates or lost relationships.

1. For analysis-only or script-only tasks, stop at the requested artifact. Otherwise continue using existing authorization for the named target; production/destructive actions need their own existing authority.
2. Import through the installed public Payload API or accepted project importer, using durable source identity, recoverable checkpoints and an explicit failure/skipped ledger.
3. Import entities and media before resolving cyclic relationships and embedded links; use a second pass where necessary and never invent placeholder IDs to satisfy required fields.
4. Recover interruption and transient failures using stable identities and source versions; verify persisted success before advancing checkpoints or retrying writes.
5. Preserve unrelated target records; deletion, overwriting user edits, source removal and cutover require their own accepted policy.

Validation:

- A retry can locate already-persisted records even after a crash between target write and checkpoint update.
- Failed media, unresolved links/nodes and missing locale values are visible; a successful process exit does not establish completeness.

### Workflow stage: Reconcile and report

Establish which source content survived the actual target boundary and what remains incomplete.

1. Compare full expected and observed source-identity sets and per-collection counts; detect missing, extra and duplicate imports independently of the in-memory checkpoint.
2. Reread content, relation IDs/cardinality/order, media bytes/metadata and locale fields with fallback disabled; compare explicit source values and agreed transforms.
3. Exercise interrupted or repeated runs when reliable rerun is claimed, and confirm they do not duplicate or silently omit data.
4. When requested, follow migrated content through public API and the consuming frontend after reload; pair nextjs for routing/cache/rendering and retain exact source-to-page evidence.
5. Report source/target versions, actions and target, counts and identity reconciliation, failures, rerun results, checks and unverified boundaries with the next supported action.

Validation:

- Completion applies only to the authorized dataset and requested evidence boundary; representative records alone do not prove a full import.
- Any unresolved required record, relation, media, locale or rich-text node keeps the migration partial.

## Interop priority

- **target Payload schema, Local API, access, hooks, adapters and transactions:** payload. payload supplies target runtime mechanisms and API/DB evidence; this skill retains extraction, transformation, execution, rerun and reconciliation ownership.
- **TypeScript language, module structure, type generation, and compile errors in import scripts:** typescript-engineer. This skill owns migration semantics; TypeScript language/toolchain rules belong to typescript-engineer.
- **deterministic tests for import scripts, fixtures, and parity checks:** typescript-test-engineer. This skill defines migration verification targets; test design belongs to typescript-test-engineer.
- **consuming frontend routing, rendering, cache and reload:** nextjs. Provide migrated IDs/URLs and expected content; consume actual page readback without treating build/cache config as rendered migration evidence. If unavailable, report that frontend boundary unverified and finish supported data work.

## Gotchas

- **high** — Repeated strings such as categories, tags, authors, topics, or labels often need relationship collections, not select fields.
- **high** — Partial source data can hide nullable fields, mixed types, relationship cardinality, rich text formats, media variants, and localization.
- **high** — Schema or script creation is not migrated data; complete the authorized execution and full reconciliation before claiming an import complete.
- **medium** — Rich text sources may be HTML, Markdown, Lexical JSON, Slate JSON, or vendor-specific ASTs; choose a conversion path explicitly.
- **medium** — Media URLs are not equivalent to Payload upload relationships unless download, upload, metadata, and failure handling are planned.

## Policies

### Config-first policy
Establish the accepted target model before dependent writes; reuse prior acceptance and authority. Missing or conflicting schema decisions stop only the affected mapping/action, not independent work.

### Ambiguity policy
Ask when a material choice lacks an accepted source; do not reopen an already accepted enum, cardinality or mapping merely because another design is possible.

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
