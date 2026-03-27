# Discovery Artifact Model

Keep the default run compact.

The normal run bundle should be four canonical files plus one generated report.

## Canonical core

For each discovery run:

- `manifest.json`
  - lightweight run metadata
  - schema version
  - phase state
  - acceptance target
  - timestamps
  - baseline and current source fingerprints
  - baseline and current canonical hashes
  - dirty flags
  - last delta / rebaseline timestamps and causes
- `backlog.json`
  - the canonical backlog graph payload
  - glossary and aliases
  - source-authority ledger
  - target-system reconstruction
  - as-built reconstruction
  - claims, contracts, data domains
  - items, relations, proofs, reviews, tracks
- `assessment.json`
  - computed assessment only
  - validation errors and warnings
  - lint findings
  - stale claims, items, and proofs
  - drift delta summary
  - rebaseline-required flag
  - track gate failures
  - review coverage
  - score breakdown
  - acceptance result
  - closure status
  - next actions
- `journal.ndjson`
  - append-only event log

These four files carry process continuity.

## Generated report

- `report.md`
  - single human-facing report rendered from canonical state and assessment
  - includes run summary, source authority, feature candidates, roadmap, roadmap matrix, review governance, lifecycle/drift state, gaps, score, review, closure, and final operating questions

The report is disposable. Rebuild it from canonical state.

## Default command sequence

Initialize a run:

```bash
node scripts/architecture-backlog.mjs init /path/to/run-dir
```

Discover or update the backlog graph from architecture/runtime sources:

```bash
node scripts/architecture-backlog.mjs discover /path/to/run-dir \
  --architecture-source ./docs/architecture.md \
  --runtime-source ./ops/runtime.md
```

Repair derivable canonical state from the existing run and source refs:

```bash
node scripts/architecture-backlog.mjs repair /path/to/run-dir
```

Inspect status:

```bash
node scripts/architecture-backlog.mjs status /path/to/run-dir
```

Validate canonical state:

```bash
node scripts/architecture-backlog.mjs validate /path/to/run-dir
```

Compute drift delta:

```bash
node scripts/architecture-backlog.mjs delta /path/to/run-dir
```

Accept the current state as the new baseline:

```bash
node scripts/architecture-backlog.mjs rebaseline /path/to/run-dir
```

Render the report:

```bash
node scripts/architecture-backlog.mjs render /path/to/run-dir
```

## Bootstrap rules

- If the bundled runtime artifact `scripts/architecture-backlog.mjs` exists, use it directly.
- If it is missing after local source edits, rebuild it from the skill package.
- If the target run directory has no canonical files, `discover` should initialize it automatically.
- If the run already exists, reuse it; do not overwrite unless explicitly instructed.
- Prefer `discover` over manual `backlog.json` editing when the change originates from architecture, ADR, runtime, or evidence sources.
- Embedded `architecture-backlog-packet` blocks are the normal machine-readable transport for source-driven discovery.

## Failure handling

- missing canonical files:
  - initialize the run if it is intended to be a new run
  - otherwise repair the run directory
- new or changed architecture/runtime sources:
  - run `discover`
  - let the CLI refresh source fingerprints from the actual source refs
  - rerender `report.md`
- invalid canonical state:
  - run `repair`
  - rerun `validate`
  - rerender `report.md`
- partial compact bundle damage with `backlog.json` still present:
  - let the CLI recreate derivable missing files such as `manifest.json`, `assessment.json`, or `journal.ndjson`
  - then continue with `repair`, `validate`, `delta`, or `rebaseline`
- invalid source-driven packet merge:
  - fix the source packet or source metadata
  - rerun `validate`
  - rerender `report.md`
- stale report:
  - rerun `render`
- stale proofs:
  - refresh proof evidence
  - rerun `validate`
- drift detected:
  - run `delta`
  - delta uses fingerprints refreshed from the real source refs, not stale stored hashes alone
  - inspect stale claims, items, proofs, and track-gate recalculation requirements
  - if the new reality is accepted, run `rebaseline`
- unreadable source refs:
  - hard-fail `repair`, `validate`, `delta`, and `rebaseline`
  - repair or restore the underlying source truth before continuing
- missing reviews:
  - block planning-grade or implementation-grade acceptance
- legacy v1 layout detected:
  - stop and rewrite the draft artifacts to schema v3 or create a fresh v3 run

## Integration rule

When paired with `dossier-engineer`:

- discovery run shapes graph-level truth
- dossier intake should consume only validated graph items
- `report.md` must never become source-of-truth input for later dossier steps
