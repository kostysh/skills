This skill is the code-backed home of the merged `dossier-engineer`. Its job is to maintain the unified architecture, artifact model, runtime boundary, and canonical unified CLI for the merged skill.

The shipped runtime serves only the canonical unified model: `.dossier` for accounting/process truth and `docs/ssot` for project-facing SSOT. It does not ship split-model migration, rollout checks, or compatibility launchers.

Every mutating dossier stage requires external review before truthful closure. `review-artifact` records one already obtained audit result for one audit class. `dossier-step-close` validates the policy-required audit bundle before truthful closure.

The merged target must preserve two distinct semantic layers inside one skill:

- `backlog truth layer` for backlog graph, source registry, packets, patches, and source-review discipline
- `delivery workflow layer` for intake, spec, planning, implementation, coverage, review, closure, and telemetry

The generated instruction surface should stay intentionally small. The merged skill is broad and will keep growing, so the source bundle must enforce progressive disclosure and command-surface honesty.
