# Runtime and command boundary

Use this reference when maintaining the shipped merged runtime surface for `unified-dossier-engineer`.

## Purpose

`Package 7` fixed the maintainer-facing utility specification.
`Package 8` turned that specification into a deterministic runtime/help/module boundary.
`Package 9` shipped the canonical merged runtime.
`Package 10` hardens that runtime into a canonical-only public contract.

This reference defines the active shipped boundary.

## Primary runtime rule

The merged runtime exposes exactly one public utility contract:

```text
dossier-engineer <command> [options]
```

Important:

- this is both the semantic and physical public boundary;
- no compatibility launchers or compatibility aliases are part of the shipped contract;
- no migration or rollout command family is part of the shipped contract.

## Shipped command families

The shipped merged help surface groups commands by family.

### Bootstrap / root-management

- `help`
- `init`

### Backlog truth family

#### Source registry and source maintenance

- `register-source`
- `list-sources`
- `update-source-path`
- `remove-source`
- `refresh`
- `ack-source-review`

#### Backlog authoring / mutation

- `template`
- `packet`
- `patch-item`
- `remove-item`

#### Backlog read models

- `status`
- `report`
- `items`
- `queue`
- `attention`
- `gaps`
- `search`

### Delivery stage-controller family

- `feature-intake`
- `spec-compact`
- `plan-slice`
- `implementation`
- `change-proposal`

### Delivery helper / integrity / closure family

- `contract-drift-audit`
- `coverage-audit`
- `debt-audit`
- `dependency-graph`
- `sync-index`
- `index-refresh`
- `lint-dossiers`
- `dossier-verify`
- `review-artifact`
- `dossier-step-close`
- `next-step`
- `lifecycle-refresh`

Audit-policy rule for this family:

- `review-artifact` persists one already obtained audit result for one audit class;
- `dossier-step-close` validates the policy-required audit bundle for the stage being closed;
- both helpers read and update the helper-managed stage state under `.dossier/stages/*` for current-cycle review-bundle coordination and validation;
- neither helper performs the audit itself.

## Workflow stages versus runnable commands

Merged runtime design keeps this rule explicit:

- a workflow stage is not a shipped command unless it appears in the real help surface;
- stage names may stay active design vocabulary in references before code lands;
- once a command ships, its help/runtime/tests become the authoritative boundary for that command.

## Runtime module boundary

The merged runtime stays mechanically unified but internally modular.

Recommended module split:

### Shared/core modules

Responsibilities:

- root discovery
- path normalization
- lock handling
- JSON envelope / error-code helpers
- canonical artifact path helpers

Suggested source boundary:

```text
src/shared/
```

### Backlog modules

Responsibilities:

- source registry
- source-review records
- packet / patch / remove flows
- backlog read models
- reports and queueing

Suggested source boundary:

```text
src/backlog/
```

### Delivery stage-controller modules

Responsibilities:

- `feature-intake`
- `spec-compact`
- `plan-slice`
- `implementation`
- `change-proposal`

Suggested source boundary:

```text
src/delivery/
```

### Delivery helper / closure modules

Responsibilities:

- audits
- verification helpers
- review persistence
- step close
- dossier-local querying

Implemented through vendored dossier helper surface plus merged wrappers.

### Telemetry / indexing modules

Responsibilities:

- lifecycle snapshots
- session index refresh
- index sync / refresh
- closure-backed aggregation helpers

Implemented through the shipped lifecycle/closure surface without separate migration modules.

## Help surface contract

Top-level help for the merged utility must:

- identify `dossier-engineer` as the only public utility;
- group commands by the families above;
- distinguish stage-controller commands from helper/closure commands;
- avoid presenting workflow prose terms that are not real commands;
- explicitly state that only canonical unified layout is supported.

Command-local help must:

- show only shipped options and output guarantees;
- reflect the utility specification rather than inventing ad hoc wording;
- avoid compatibility or migration wording.

## Negative rules

- do not add compatibility wrappers as a second public contract;
- do not promote commands or flags into `skill.yaml` if runtime code and tests do not ship them;
- do not let top-level help blur backlog truth commands with delivery-stage commands;
- do not let helper commands absorb stage-controller responsibilities or vice versa;
- do not imply support for split roots, migration flows, or rollout switching.
