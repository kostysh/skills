# Migration guide: from `sdd-engineer` to `dossier-engineer`

## What changes
`sdd-engineer` (full) typically creates multiple artifacts per ticket:
- Requirements (R), Spec (S), Plan (P), Tasks (T), ADR, Validation (V), Handover (H)

`dossier-engineer` replaces that with:
- **One Feature Dossier** per feature
- **One global index**
- Optional ADR files only when cross-cutting

## Mapping table

| sdd-engineer artifact | Where it goes in the dossier |
|---|---|
| `R*` requirements | Section “Requirements & Acceptance Criteria” (SSoT) |
| `S*` specification | Section “Design (compact)” |
| `P*` plan | Section “Slicing plan” |
| `T*` tasks | Section “Task list” |
| `ADR*` | Section “Decision log (ADR blocks)” OR `docs/adr/*.md` |
| `V*` validation | Section “Definition of Done / Validation commands” |
| `H*` handover | Section “Runbook / Handover” |
| status reports | Dossier frontmatter `status` + `docs/ssot/index.md` |

## Touch-to-migrate rule
Do not migrate everything up-front. Migrate dossiers when:
- you start working on a feature again, or
- you need the knowledge for new dependent work.

## Safe deprecation pattern
Once migrated:
1) Keep old files but add a header: “Superseded by …”
2) Update the global index to point to the dossier.
3) After 2–4 weeks, archive or delete old docs.
