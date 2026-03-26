# Discovery Artifact Model

Use a small canonical core and generated projections.

## Canonical core

For each discovery run:

- `manifest.json`
  - run metadata, schema version, acceptance target, phase state
- `journal.ndjson`
  - append-only event log
- `state.snapshot.json`
  - materialized backlog graph state
- `validation.json`
  - latest validation result
- `closure.json`
  - acceptance/closure state

These are the only files that should matter for process continuity.

## Generated projections

Under `views/`:

- `feature-candidates.md`
- `roadmap.md`
- `gaps-and-validation.md`

They are disposable. Rebuild them from canonical state.

## Suggested command sequence

Initialize a run:

```bash
node scripts/architecture-backlog.mjs init /path/to/run-dir
```

Validate canonical state:

```bash
node scripts/architecture-backlog.mjs validate /path/to/run-dir
```

Render projections:

```bash
node scripts/architecture-backlog.mjs render /path/to/run-dir
```

## Failure handling

- corrupted projection:
  - rerender
- stale snapshot:
  - replay or rebuild from journal
- missing review:
  - block acceptance, not analysis
- invalid canonical state:
  - run validate, repair canonical files, rerun render

## Integration rule

When paired with `dossier-engineer`:

- discovery run shapes graph-level truth;
- dossier intake should consume only validated graph items;
- markdown outputs from this skill should never become source-of-truth inputs to later dossier steps.
