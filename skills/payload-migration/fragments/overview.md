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
