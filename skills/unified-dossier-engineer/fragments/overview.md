This skill is the code-backed home of the canonical dossier/backlog runtime. Its job is to maintain the architecture, artifact model, runtime boundary, and canonical CLI.

The shipped runtime serves one canonical model: `.dossier` for accounting/process truth and `docs/ssot` for project-facing SSOT. Only that layout and the `dossier-engineer` launcher are supported.

Every mutating dossier stage requires external review before truthful closure. `review-artifact` records one already obtained audit result for one audit class. `dossier-step-close` validates the policy-required audit bundle before truthful closure.

This skill preserves two distinct semantic layers inside one runtime:

- `backlog truth layer` for backlog graph, source registry, packets, patches, and source-review discipline
- `delivery workflow layer` for intake, spec, planning, implementation, coverage, review, closure, and telemetry
