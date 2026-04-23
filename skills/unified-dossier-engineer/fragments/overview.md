This skill is the code-backed home of the canonical dossier/backlog runtime. Its job is to maintain the architecture, artifact model, runtime boundary, and canonical CLI.

The shipped runtime serves one canonical model: `.dossier` for accounting/process truth and `docs/ssot` for project-facing SSOT. Only that layout and the `dossier-engineer` launcher are supported.

Every mutating dossier stage requires external review before truthful closure. Blocking external reviews must be launched as separate reviewer executions without forked/full-history authoring context. In Codex this means `fork_context: false`; in other runtimes use the equivalent no-full-context-inheritance mode. If an audit was launched with forked/full-history context, discard it and rerun it correctly.

`review-artifact` records one already obtained audit result for one audit class. `dossier-step-close` validates the policy-required audit bundle before truthful closure. These helpers record and validate only observable durable provenance; they do not prove reviewer launch-mode independence.

This skill preserves two distinct semantic layers inside one runtime:

- `backlog truth layer` for backlog graph, source registry, packets, patches, and source-review discipline
- `delivery workflow layer` for intake, spec, planning, implementation, coverage, review, closure, and telemetry

For stage-controller writes, session provenance is agent-owned explicit input. The agent determines the session id before invoking the runtime and passes it with `--session-id`; the runtime must not discover session ids from runtime-private stores or silently fall back to environment variables.
