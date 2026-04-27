This skill is the code-backed home of the canonical dossier/backlog runtime. Its job is to maintain the architecture, artifact model, runtime boundary, and canonical CLI.

The shipped runtime serves one canonical model: `.dossier` for accounting/process truth and `docs/ssot` for project-facing SSOT. Only that layout and the `dossier-engineer` launcher are supported.

Every mutating dossier stage requires external review before truthful closure. Blocking external reviews must be launched as separate reviewer executions without forked/full-history authoring context. In Codex this means `fork_context: false`; in other runtimes use the equivalent no-full-context-inheritance mode. If an audit was launched with forked/full-history context, discard it and rerun it correctly.

Use the audit handoff recipes when launching required external audits so scope, read-only boundaries, shared risk map, reviewer focus, and PASS/FAIL `review-artifact` persistence are not reconstructed ad hoc.

`review-artifact` records one immutable already obtained audit attempt for one audit class. Stable/latest review copies are compatibility conveniences, not the sole evidence. `dossier-step-close` validates the policy-required audit bundle before truthful closure and records selected immutable PASS attempt paths. These helpers record and validate only observable durable provenance; they do not prove reviewer launch-mode independence.

Implementation pre-review checklists are author-side readiness evidence for explicitly declared risk families before external review handoff. They are not correctness proof and never replace required external audits.

This skill preserves two distinct semantic layers inside one runtime:

- `backlog truth layer` for backlog graph, source registry, packets, patches, and source-review discipline
- `delivery workflow layer` for intake, spec, planning, implementation, coverage, review, closure, and telemetry

For stage-controller writes, session provenance is agent-owned explicit input. The agent determines the session id before invoking the runtime and passes it with `--session-id`; the runtime must not discover session ids from runtime-private stores or silently fall back to environment variables.

For machine-complete stage artifacts, helper-managed `.dossier/stages/*` is the authoritative structured coordination and validation surface. Stage log frontmatter mirrors bounded machine fields such as artifact links, review attempt events, backlog follow-up state, explicit skill annotations, structured `process_misses`, scope identity, and optional commit trace links.
