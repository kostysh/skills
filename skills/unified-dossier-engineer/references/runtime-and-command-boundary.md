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
- only `plan-slice` accepts `--policy-admission-risk-profile`, `--policy-admission-risk-rationale`, repeatable `--policy-admission-risk`, and repeatable `--policy-admission-negative` inputs for policy/admission readiness evidence;
- policy/admission classification and negative-matrix applicability are explicit inputs and are never inferred from keywords, filenames, source code, diff heuristics, chat summaries, review findings, or dossier prose;
- `plan-slice --ready-for-close` fails before writing `stage_state: ready_for_close` when classification is missing, `not_applicable` lacks rationale, risk ids are unknown, or applicable risks lack negative-matrix coverage;
- only `implementation` accepts repeatable `--risk-family <id>` and `--pre-review-check <dsl>` inputs for author-side pre-review checklist readiness evidence;
- declared implementation risk families are never inferred from keywords, filenames, source code, diff heuristics, chat summaries, review findings, or dossier prose;
- `implementation --ready-for-close` fails before writing `stage_state: ready_for_close` when declared checklist evidence is `missing` or `blocked`.
- `implementation --ready-for-close` also rechecks latest `plan-slice` policy/admission matrix status before material close readiness.

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
- `post-close-hygiene`
- `next-step`
- `lifecycle-refresh`

Audit-policy rule for this family:

- `review-artifact` persists one immutable already obtained audit attempt for one audit class;
- FAIL `review-artifact` attempts require at least one `--must-fix` and at least one `--evidence`; PASS attempts must not carry `--must-fix`;
- audit handoff recipes may tell reviewers to run `dossier-engineer review-artifact` after deciding PASS or FAIL, but the runtime does not synthesize reviewer prompts or perform the audit;
- default review-attempt paths are bounded deterministic artifacts under `.dossier/reviews/<feature>/`;
- stable/latest review paths, when written, are backward-compatible full JSON copies that point back to the immutable attempt and are not the only durable evidence;
- `dossier-step-close` validates the policy-required audit bundle for the stage being closed;
- `dossier-step-close` accepts immutable attempt paths directly and resolves latest-copy paths back to managed immutable attempts before recording closure outputs;
- `dossier-step-close` records selected closure bundle fields and RPA producer fields after successful close;
- in git repositories, selected review and verification artifact `event_commit` values are material-scope freshness anchors; stage-level commit fields remain optional trace context, not closure proof;
- both helpers read and update the helper-managed stage state under `.dossier/stages/*` for current-cycle review-bundle coordination and validation;
- both helpers validate only observable durable provenance and must not claim to prove launch-mode facts such as `fork_context`, full-history inheritance, prompt mutability, or model tier;
- neither helper performs the audit itself.
- implementation pre-review checklist evidence is not an audit artifact and cannot satisfy or weaken the audit bundle validated by `dossier-step-close`.
- `post-close-hygiene` runs explicit refresh/status/attention/queue evidence after successful `implementation` closure, writes a global refresh artifact plus per-feature `.dossier/verification/<feature>/implementation-post-close-backlog-hygiene.json` artifacts, and updates helper-managed implementation stage state;
- `post-close-hygiene` serializes the global refresh and per-feature evidence writes, writes a durable global artifact before any per-feature state points to it, records `run_id`, affected/failed feature ids, pre/post status summaries, per-feature statuses, and returns non-zero with JSON result `fail` plus a retry command for failed or partial runs; it must not report post-close partial feature failures as `partial_success`;
- `post-close-hygiene` never auto-acks source-review records and never applies backlog patches or packets on behalf of the operator.

Lifecycle-reconciliation rule for this family:

- `dossier-step-close` enforces selected backlog item lifecycle reconciliation for `feature-intake`, `spec-compact`, `plan-slice`, and `implementation`;
- the helper reads current backlog truth through the canonical backlog state/read model;
- backlog actualization artifacts are accepted only as managed trace links and must not bypass current-state validation;
- backlog read surfaces expose deterministic lifecycle drift so a mapped done feature cannot silently reappear as ordinary queue work.
- `status` exposes `intaken_count`, and `queue` must not silently return `intaken` items as fresh intake-ready work.
- `status`, `queue`, and `next-step` expose missing, stale, or blocked post-close hygiene after implementation closure without changing queue ranking.

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

## Schema and help contract

Schema snippets, JSON examples, and CLI DSL snippets in this skill describe persisted runtime artifacts, helper-managed stage state, or command input contracts. They are not prompts for free-form model output.

Rules:

- agents should use shipped templates, helper commands, runtime validation, docs-contract tests, and command-behavior tests instead of hand-authoring machine state from prose;
- before documenting or invoking a command option, confirm it exists in the shipped help surface when practical;
- if prose would require a new command, flag, output field, error code, artifact path, or schema field, update runtime/help/tests in the same change set before treating it as shipped behavior.

## Help surface contract

Top-level help for the utility must:

- identify `dossier-engineer` as the only public utility;
- group commands by the families above;
- distinguish stage-controller commands from helper/closure commands;
- avoid presenting workflow prose terms that are not real commands;
- explicitly state that only the canonical `.dossier` + `docs/ssot` layout is supported.

Command-local help must:

- show only shipped options and output guarantees;
- show `--policy-admission-risk-profile`, `--policy-admission-risk-rationale`, `--policy-admission-risk`, and `--policy-admission-negative` only for `plan-slice`;
- show `--risk-family` and `--pre-review-check` only for `implementation`;
- show `post-close-hygiene` only because the runtime, help, and tests ship it;
- reflect the shipped command contract rather than inventing ad hoc wording;
- avoid compatibility or migration wording.

## Negative rules

- do not add compatibility wrappers as a second public contract;
- do not promote commands or flags into `skill.yaml` if runtime code and tests do not ship them;
- do not document policy/admission flags unless the shipped help/runtime/tests expose them;
- do not let top-level help blur backlog truth commands with delivery-stage commands;
- do not let helper commands absorb stage-controller responsibilities or vice versa;
- do not imply that stage-controller commands author or validate semantic `plan-slice` execution-target content;
- do not imply that runtime commands infer protected side-effect presets or perform pre-close hygiene rehearsal;
- do not imply runtime support for automatic operator-language detection, translation, or localization unless shipped runtime code and tests explicitly implement that behavior;
- do not imply `dossier-step-close` auto-refreshes sources or auto-resolves source reviews;
- do not imply support for alternate roots, extra launchers, or unshipped adaptation flows.
