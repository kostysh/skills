# Workflow stage steps: `dependency-check`

1. Read `depends_on` and `impacts` from dossier frontmatter.
2. Validate that all referenced `F-*` dossiers exist.
3. Generate a Mermaid graph via `node scripts/dossier.mjs dependency-graph`.
4. Use `node scripts/dossier.mjs index-refresh` as the canonical full refresh path.
   Use `sync-index` only when you intentionally want table/graph refresh without a Red flags update.
