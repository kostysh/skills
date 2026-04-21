# Runtime and command boundary

Use this reference when designing the future merged runtime surface for `unified-dossier-engineer`.

## Purpose

`Package 7` fixed the maintainer-facing utility specification.
`Package 8` turns that specification into a deterministic runtime/help/module boundary for the future shipped utility.

This reference defines that boundary.
It does **not** claim that the merged runtime already ships these commands.

## Primary runtime rule

The future merged runtime must expose **one semantic public utility contract**:

```text
dossier-engineer <command> [options]
```

This is the primary public command form after the merge stabilizes.

Important:

- this is a semantic public boundary, not a promise that only one physical launcher must exist from day one;
- the first merged runtime may still keep compatibility entry points while the public contract converges;
- the design must not require one monolithic binary on day one if compatibility or rollout safety argue for wrappers.

## Future command families

The shipped merged help surface must group commands by family, even if commands stay top-level.

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
- `marker-audit` as compatibility alias only
- `dependency-graph`
- `sync-index`
- `index-refresh`
- `lint-dossiers`
- `dossier-verify`
- `review-artifact`
- `dossier-step-close`
- `next-step`
- `lifecycle-refresh`

## Workflow stages versus runnable commands

Merged runtime design must keep this rule explicit:

- a workflow stage is not a shipped command unless it appears in the real help surface;
- stage names may stay active design vocabulary in references before code lands;
- once a command ships, its help/runtime/tests become the authoritative boundary for that command.

Implication for this planning-stage skill:

- active references may define future command families and module boundaries;
- generated `SKILL.md` must still avoid presenting those commands as already runnable in this skill package.

## Runtime module boundary

The future merged runtime should stay mechanically unified but internally modular.

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
src/delivery/stages/
```

### Delivery helper / closure modules

Responsibilities:

- audits
- verification helpers
- review persistence
- step close
- dossier-local querying

Suggested source boundary:

```text
src/delivery/helpers/
```

### Telemetry / indexing modules

Responsibilities:

- lifecycle snapshots
- session index refresh
- index sync / refresh
- closure-backed aggregation helpers

Suggested source boundary:

```text
src/telemetry/
```

### Compatibility modules

Responsibilities:

- compatibility launchers
- deprecation warnings
- old entry-point forwarding

Suggested source boundary:

```text
src/compat/
```

## Help surface contract

Top-level help for the future merged utility must:

- identify `dossier-engineer` as the primary public utility;
- group commands by the families above;
- distinguish stage-controller commands from helper/closure commands;
- surface deprecated compatibility entry points and aliases as deprecated;
- avoid presenting workflow prose terms that are not real commands.

Command-local help must:

- show only shipped options and output guarantees;
- reflect the utility specification rather than inventing ad hoc wording;
- make deprecation explicit when invoked through a compatibility launcher or alias.

## Migration of old entry points

The merged runtime must not break operators by collapsing every old entry point at once.

### Backlog launcher migration

During migration, `backlog-engineer` may remain as a compatibility launcher that forwards to the backlog truth family of the merged runtime.

Rules:

- the compatibility launcher must preserve machine-facing behavior for the delegated commands;
- it must emit a deprecation warning pointing to the primary public form `dossier-engineer <command>`;
- it must not invent commands outside the merged help surface.

### Dossier helper migration

Existing helper command names retained literally by the merged spec must continue to exist as shipped command names when the merged runtime lands:

- `contract-drift-audit`
- `dossier-verify`
- `review-artifact`
- `dossier-step-close`
- `lifecycle-refresh`
- `next-step`
- `coverage-audit`
- `debt-audit`
- `dependency-graph`
- `sync-index`
- `index-refresh`
- `lint-dossiers`

### Stage-name migration

Previously prose-only workflow names must not gain compatibility shims unless they become real shipped commands.

Implication:

- `spec-compact`, `plan-slice`, `implementation`, and `change-proposal` become runnable only when the merged runtime truly ships them;
- before that point they remain design intent, not compatibility aliases.

## Deprecation strategy

The split skills and launchers do not become legacy by declaration alone.

Required order:

1. merged runtime implements equivalent command families and artifacts;
2. help surface, runtime behavior, and tests prove the boundary;
3. compatibility launchers warn but still work;
4. only after parity and rollout criteria may the split launchers be removed.

Specific first-wave deprecation rules:

- `delete-backlog` stays deprecated from the merged runtime;
- `marker-audit` may survive only as a compatibility alias;
- no new destructive compatibility surface should be added just to mirror split history.

## Negative rules

- do not require one monolithic CLI binary from the first merged release;
- do not let compatibility wrappers become a second long-term public contract;
- do not promote future commands into `skill.yaml` command listings before runtime code and tests ship them;
- do not let top-level help blur backlog truth commands with delivery-stage commands;
- do not let helper commands absorb stage-controller responsibilities or vice versa.

## Package 9 handoff

`Package 9` must validate this boundary through parity and rollout checks.

Minimum downstream expectations:

- the primary public utility is obvious in help output;
- compatibility launchers/aliases are explicitly marked and tested;
- command families from this reference are preserved in shipped help/runtime/tests;
- split launchers are not retired before equivalent behavior is proven.
