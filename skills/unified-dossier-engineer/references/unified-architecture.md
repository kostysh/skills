# Unified architecture outline

The future merged `dossier-engineer` combines two internal subsystems:

## Backlog truth layer

Responsibilities:

- source registry
- backlog items and dependency graph
- packet and patch workflows
- source-review records

This layer owns the accounting truth for backlog state and source-driven follow-up.

For detailed artifact and contract rules, also read:

- [Unified artifact topology](unified-artifact-topology.md)
- [Backlog truth layer](backlog-truth-layer.md)
- [Source-review contract](source-review-contract.md)

## Delivery workflow layer

Responsibilities:

- feature intake
- `spec-compact`
- `plan-slice`
- `implementation`
- `change-proposal`
- `contract-drift-audit`
- backlog impact verdicts
- `coverage_gate`
- review and verification freshness
- step closure and lifecycle telemetry

This layer owns the accounting truth for feature execution.

For detailed workflow and telemetry rules, also read:

- [Delivery workflow layer](delivery-workflow-layer.md)
- [Telemetry and closure](telemetry-and-closure.md)

## Artifact split

Accounting and process artifacts:

- live under `.dossier`
- include backlog graph, feature-cycle logs, lifecycle snapshots, source-review records, and machine-checkable closure artifacts

Project SSOT artifacts:

- live under `docs/ssot`
- remain human-facing project truth for operators and future readers

## Merge safety rules

- one feature dossier maps to exactly one backlog item
- backlog truth and delivery state must not collapse into a single flat status enum
- the merged runtime must stay mechanical; semantic interpretation remains agent-owned
- telemetry and closure truth must remain explicit and step-close-backed
