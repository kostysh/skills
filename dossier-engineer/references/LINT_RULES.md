# Lint rules for dossiers and index

These are the checks enforced by `scripts/lint-dossiers.mjs`.

## Dossier file checks (`docs/features/F-*.md`)

### Frontmatter
Required keys:
- `id` (must match filename prefix `F-XXXX`)
- `title` (non-empty)
- `status` ∈ `{proposed, shaped, planned, in_progress, done, parked}`
- `area` (short stable tag)
- `owners` (non-empty array of strings)
- `created` (YYYY-MM-DD)
- `updated` (YYYY-MM-DD)
Optional but recommended:
- `depends_on` (array of `F-XXXX`)
- `impacts` (array; typical values: client/server/db)

### Acceptance criteria
- Must contain at least one `AC-...` ID.
- All AC IDs must be unique within the dossier.
- AC IDs must follow `AC-Fdddd-nn` where `dddd` matches dossier numeric ID.
- AC text must be on the same line as the ID (so it can be reviewed and tested).

### Coverage map
- Must include a table row for every AC ID OR explicitly mark missing coverage with a justification (e.g. `not planned (reason)`).
- Test references should include file paths and (ideally) test names.

### Change log
- Must include at least an initial entry.

## Cross-file checks

- `depends_on` must reference existing dossiers.
- No duplicate feature IDs across dossiers.
- `docs/ssot/index.md` must contain a row for every dossier (index is generated, but lint ensures it matches).

## Philosophy
The goal is to prevent:
- doc drift,
- “second sources of truth”,
- untestable requirements,
- orphan docs without code/tests references.
