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

### Compact-spec and planning nudges for shaped/planned+ dossiers
- `Definition of Done` should be present once the dossier reaches `shaped` or later.
- The dossier should contain a verification section or initial coverage plan once it reaches `shaped` or later.
- If a shaped/planned+ dossier describes boundary I/O, lint expects at least one contract/schema/error-model cue.
- If an NFR is normative, lint expects a metric, budget/threshold, or observable signal.
- If an `Open questions` section is non-empty, lint expects owner/date plus a `needed_by` readiness cue.
- If a planned/in-progress dossier has `depends_on` entries, lint expects the slicing plan to expose `Depends on:` / unblock visibility when those dependencies matter to delivery order.
- If migration, feature flags, cutover, backfill, or irreversible activation appears in planning/design text, lint expects a rollout / activation cue.
- If a planned/in-progress dossier has replanning entries in the change log, lint recommends a short reason tag such as `[clarification]`, `[scope realignment]`, `[dependency realignment]`, `[risk discovery]`, or `[contract drift]`.

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

Lint stays deterministic:
- it validates declared structure and documented dossier conventions;
- it may use exact markers and narrow documented heuristics to surface debt-minimization issues;
- workflow-resolution commands still do not infer blockers or next actions from dossier prose.
