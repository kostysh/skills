# Runtime and command boundary

Use this reference when maintaining the shipped runtime surface for this skill.

## Purpose

This runtime ships one canonical public contract.
This reference defines the active shipped boundary.

## Primary runtime rule

The runtime exposes exactly one public utility contract:

```text
dossier-engineer <command> [options]
```

Important:

- this is both the semantic and physical public boundary;
- no compatibility launchers or compatibility aliases are part of the shipped contract;
- no migration or rollout command family is part of the shipped contract.

## Shipped command families

The shipped help surface groups commands by family.

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

Contract for this family:

- stage-controller write paths require `--session-id <id>` as explicit agent-owned provenance input;
- optional `--trace-runtime <name>` is explicit metadata only, not a runtime-specific default;
- missing required `--session-id` fails closed before stage log or helper-managed stage-state writes;
- the runtime must not make Codex-local trace stores, private filesystem layouts, or environment variables the canonical way to resolve session provenance.
- only `implementation` accepts repeatable `--risk-family <id>` and `--pre-review-check <dsl>` inputs for author-side pre-review checklist readiness evidence;
- declared implementation risk families are never inferred from keywords, filenames, source code, diff heuristics, chat summaries, review findings, or dossier prose;
- `implementation --ready-for-close` fails before writing `stage_state: ready_for_close` when declared checklist evidence is `missing` or `blocked`.

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

- `review-artifact` persists one immutable already obtained audit attempt for one audit class;
- default review-attempt paths are bounded deterministic artifacts under `.dossier/reviews/<feature>/`;
- stable/latest review paths, when written, are backward-compatible full JSON copies that point back to the immutable attempt and are not the only durable evidence;
- `dossier-step-close` validates the policy-required audit bundle for the stage being closed;
- `dossier-step-close` accepts immutable attempt paths directly and resolves latest-copy paths back to managed immutable attempts before recording closure outputs;
- both helpers read and update the helper-managed stage state under `.dossier/stages/*` for current-cycle review-bundle coordination and validation;
- both helpers validate only observable durable provenance and must not claim to prove launch-mode facts such as `fork_context`, full-history inheritance, prompt mutability, or model tier;
- neither helper performs the audit itself.
- implementation pre-review checklist evidence is not an audit artifact and cannot satisfy or weaken the audit bundle validated by `dossier-step-close`.

Lifecycle-reconciliation rule for this family:

- `dossier-step-close` enforces selected backlog item lifecycle reconciliation for `spec-compact`, `plan-slice`, and `implementation`;
- the helper reads current backlog truth through the canonical backlog state/read model;
- backlog actualization artifacts are accepted only as managed trace links and must not bypass current-state validation;
- backlog read surfaces expose deterministic lifecycle drift so a mapped done feature cannot silently reappear as ordinary queue work.

## Workflow stages versus runnable commands

Runtime design keeps this rule explicit:

- a workflow stage is not a shipped command unless it appears in the real help surface;
- stage names may stay active design vocabulary in references before code lands;
- once a command ships, its help/runtime/tests become the authoritative boundary for that command.

## Runtime module boundary

The runtime stays mechanically unified but internally modular.

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

Implemented through vendored dossier helper surface plus runtime wrappers.

### Telemetry / indexing modules

Responsibilities:

- lifecycle snapshots
- session index refresh
- index sync / refresh
- closure-backed aggregation helpers

Implemented through the shipped lifecycle/closure surface without separate migration modules.

## Help surface contract

Top-level help for the utility must:

- identify `dossier-engineer` as the only public utility;
- group commands by the families above;
- distinguish stage-controller commands from helper/closure commands;
- avoid presenting workflow prose terms that are not real commands;
- explicitly state that only the canonical `.dossier` + `docs/ssot` layout is supported.

Command-local help must:

- show only shipped options and output guarantees;
- show `--risk-family` and `--pre-review-check` only for `implementation`;
- reflect the shipped command contract rather than inventing ad hoc wording;
- avoid compatibility or migration wording.

## Negative rules

- do not add compatibility wrappers as a second public contract;
- do not promote commands or flags into `skill.yaml` if runtime code and tests do not ship them;
- do not let top-level help blur backlog truth commands with delivery-stage commands;
- do not let helper commands absorb stage-controller responsibilities or vice versa;
- do not imply that stage-controller commands author or validate semantic `plan-slice` execution-target content;
- do not imply runtime support for automatic operator-language detection, translation, or localization unless shipped runtime code and tests explicitly implement that behavior;
- do not imply support for alternate roots, extra launchers, or unshipped adaptation flows.
