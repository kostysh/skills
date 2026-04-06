# Lint rules for dossiers and index

These are the checks enforced by `node scripts/dossier.mjs lint-dossiers`.

## Dossier file checks (`docs/features/F-*.md`)

### Frontmatter
Required keys:
- `id` (must match filename prefix `F-XXXX`)
- `title` (non-empty)
- `status` ∈ `{proposed, shaped, planned, in_progress, done, parked}`
- `coverage_gate` is recommended and should be explicit on mature dossiers
- `area`
- `owners` (non-empty array)
- `depends_on` (array)
- `impacts` (array)
- `created` (YYYY-MM-DD)
- `updated` (YYYY-MM-DD)

### Acceptance criteria
- Must contain at least one `AC-...` ID.
- AC IDs must match the dossier numeric ID.
- Lint warns on compound AC statements because each AC should carry one obligation.
- Lint warns on raw `TBD` and vague wording in executable sections because they often hide unresolved spec work.

### Compact-spec nudges for shaped/planned+ dossiers
- `Definition of Done` should be present once the dossier reaches `shaped` or later.
- The dossier should contain a verification section or initial coverage plan once it reaches `shaped` or later.
- If a shaped/planned+ dossier describes boundary I/O, lint expects at least one contract/schema/error-model cue.
- If an NFR is normative, lint expects a metric, budget/threshold, or observable signal.

### Coverage map
- If `coverage_gate` is `strict`, the dossier must include coverage rows for every AC.
- If coverage is deferred, missing coverage rows are warnings rather than blocking errors.

### Change log
- Must include at least an initial entry.

## Cross-file checks
- `depends_on` must reference existing dossiers.
- No duplicate feature IDs across dossiers.
- `docs/ssot/index.md` should reflect current dossier status and coverage gate when refreshed.

## Philosophy
The goal is to prevent:
- doc drift,
- overloaded status semantics,
- untraceable coverage enforcement,
- orphan docs without durable process truth.
