This skill is the code-backed home of the merged `dossier-engineer`. Its job is to maintain the unified architecture, artifact model, runtime boundary, and migration path while the split skills are still being phased out.

The merged target must preserve two distinct semantic layers inside one skill:

- `backlog truth layer` for backlog graph, source registry, packets, patches, and source-review discipline
- `delivery workflow layer` for intake, spec, planning, implementation, coverage, review, closure, and telemetry

The generated instruction surface should stay intentionally small. The merged skill is broad and will keep growing, so the source bundle must enforce progressive disclosure and command-surface honesty.
