# Backlog truth layer

Use this reference when preserving or designing backlog-side capabilities inside the merged skill.

## What this layer owns

The backlog truth layer owns:

- source registry
- backlog items and dependency graph
- packet workflows for new items
- patch workflows for existing items
- utility-owned derived state
- source maintenance flows
- clean-confirmation and actualization semantics

It does not own dossier-local execution workflow for an already selected feature.

## Required read-model family

The merged skill must preserve these backlog read surfaces:

- `queue`
- `status`
- `gaps`
- `attention`
- `search`
- `report`
- `items`

Required readiness and selection signals:

- `ready_for_next_step`
- current `delivery_state`
- blockers and dependencies
- source traceability

## Read-model meanings

- `queue` decides what can move next at the backlog layer and is returned as ordered chains, not a flat list
- `status` gives a compact backlog-level summary and integrity view
- `gaps` shows explicit blockers or missing information
- `attention` shows review-oriented work selected by utility-owned state
- `search` is used when keys are unknown or filtering is needed
- `items` is used when keys are known and full cards are required
- `report` is the full document output path when the operator asked for a report artifact

## Mutation and actualization rules

The layer must preserve these mutation families:

- `register-source`
- `update-source-path`
- `remove-source`
- `packet`
- `patch-item`
- `remove-item`
- `refresh`

Canonical actualization after dossier-side lifecycle work stays bounded:

- `patch-item`
- `refresh + patch`

Truth-changing dossier stages do not close cleanly until backlog truth has been actualized.

## Clean confirmation

Mutation success alone is not truthful closure.

Default clean confirmation:

- use `items` as the scoped truth read whenever item-card truth changed
- use `status` as the artifact-integrity confirmation surface
- use `status --refresh` only when a broader global integrity sweep is explicitly needed

## Source maintenance and traceability

The merged skill must preserve:

- stable `source_id` identity across path moves via `update-source-path`
- explicit deletion path via `remove-source`
- source traceability on backlog items
- deterministic source-driven actualization rather than free-form agent mutation

## Negative rules

- do not reconstruct current truth from packet or patch files after registration
- do not let dossier-local prose mutate backlog truth directly
- do not drop backlog read surfaces while preserving only mutation commands
