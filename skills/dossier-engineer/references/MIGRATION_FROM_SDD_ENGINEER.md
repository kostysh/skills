# Migration guide: from `sdd-engineer` to `dossier-engineer`

## What changes
`sdd-engineer` typically creates multiple artifacts per ticket.

`dossier-engineer` replaces that with:
- **One Feature Dossier** per feature
- **One global index**
- **One explicit backlog file** for candidate discovery
- **Durable process artifacts** for verification, review, and step closure under `.dossier/`

## Mapping table

| sdd-engineer artifact | Where it goes now |
|---|---|
| `R*` requirements | Dossier section “Requirements & Acceptance Criteria” |
| `S*` specification | Dossier section “Design (compact)” |
| `P*` plan | Dossier section “Slicing plan” |
| `T*` tasks | Dossier section “Task list” |
| `ADR*` | Dossier ADR block or `docs/adr/*.md` |
| validation results | `.dossier/verification/*` |
| review sign-off | `.dossier/reviews/*` |
| step closure truth | `.dossier/steps/*` |
| status reports | Dossier frontmatter `status`, frontmatter `coverage_gate`, and `docs/ssot/index.md` |

## Touch-to-migrate rule
Do not migrate everything up front. Migrate dossiers when:
- you start working on a feature again, or
- you need the knowledge for new dependent work.

## Safe deprecation pattern
Once migrated:
1) Keep old files but add a header: “Superseded by …”
2) Update the global index to point to the dossier.
3) After 2–4 weeks, archive or delete old docs.
