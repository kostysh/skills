---
name: architecture-backlog-engineer
description: Convert architecture and ADRs into a deterministic, machine-checkable backlog graph with ownership seams, feature slices, controls, migrations, retirements, bounded spikes, proof bundles, review gates, and roadmap ordering. Use when deriving or auditing a feature backlog from architecture, checking whether backlog reaches a real working system, finding missing owner seams, or re-baselining backlog after architecture/runtime drift.
---

# Architecture Backlog Engineer

## Overview

Use this skill to turn architecture into a backlog graph that is:

- whole-system aware;
- normalized against current runtime truth;
- explicit about missing owners;
- safe for planning and implementation;
- auditable and re-baselinable.

Do not treat prose backlog tables or markdown reports as primary truth. Build or audit the structured backlog graph first, then render a human-facing report from it.

## When to use

Use this skill when the job is to derive or audit backlog truth from architecture-level inputs, for example:

| Situation | Use this skill | Reason |
| --- | --- | --- |
| Architecture docs or ADRs must become planning-ready backlog | Yes | It builds the graph, ownership seams, controls, migrations, and proof obligations. |
| Existing backlog must be checked for claim coverage, missing owners, or closure gaps | Yes | It audits the backlog against architecture and runtime truth. |
| Delivered system drifted from architecture and backlog must be re-baselined | Yes | It preserves delivered lineage and normalizes current reality before reshaping work. |
| Team already has a validated backlog graph and only needs sprint breakdown | No | This skill is for graph-level discovery and governance, not sprint tasking. |
| Work is a single implementation task, bug fix, or local refactor | No | Use normal engineering decomposition; this skill is too heavyweight for local changes. |

## When NOT to use

Do not use this skill as a replacement for:

- simple feature breakdown once backlog graph truth already exists;
- day-to-day implementation task lists;
- bug triage or defect investigation without architecture/backlog reshaping;
- freeform brainstorming when no authoritative sources or runtime evidence are available.

## Operator Contract

The operator should normally provide only:

- one or more architecture sources;
- optional runtime-evidence sources;
- optional explicit source-packet refs when the agent already has structured packet output;
- one run directory;
- optional acceptance target.

The operator should not have to remember:

- whether the CLI is installed;
- whether a run must be initialized;
- how to recover derivable canonical files when a run bundle is partially damaged;
- which files are canonical;
- which report files are disposable.

This skill owns those bootstrap decisions.

## Execution Contract

When this skill is invoked, follow this sequence unless the user explicitly overrides it:

1. Resolve the bundled runtime artifact.
2. Inspect the target run directory.
3. Initialize the run automatically if canonical artifacts are missing.
4. Reuse the run if canonical artifacts already exist.
5. Resolve real source inputs, extract embedded discovery packets, and populate or update `backlog.json`.
6. Refresh source fingerprints from the actual source refs before computing drift or acceptance.
7. Run `validate`.
8. Repair canonical state if validation fails and the repair is derivable from the available evidence.
9. Run `render`.
10. Return the achieved acceptance class, main gaps, and report path.

Do not ask the operator to remember internal lifecycle steps.

## Bootstrap Decision Tree

Apply these rules in order:

1. If `scripts/architecture-backlog.mjs` exists, use it directly.
2. If the runtime artifact is missing after local source edits, rebuild it from this skill package.
3. If the target run directory contains no canonical files, run `init`.
4. If the target run directory contains draft artifacts from an older pre-GA schema, stop and require an explicit rewrite to schema v3 or a fresh `init`.
5. If a legacy v1 run layout is detected, stop and report the rewrite issue clearly.
6. Never overwrite an existing run unless the operator explicitly requests it.

## Workflow

Follow this order:

1. Resolve authoritative sources and exclusions.
2. Reconstruct the target system, closure tracks, and first shippable journeys.
3. Reconstruct the as-built runtime, deployable surfaces, and ownership reality.
4. Extract typed claims, negative scope, quality obligations, contracts, and policy decisions.
5. Normalize current reality, preserve delivered lineage, and classify uncertainty.
6. Build owner seams and backlog graph relations.
7. Slice planning-ready work items.
8. Bind contract, migration, NFR, proof, rollout, rollback/recovery, docs, and support obligations.
9. Apply Ready gates, ordering, economics, review applicability, and acceptance gates.
10. Validate the graph, then render the report.

## Core Rules

1. Keep semantic levels separate:
   - architecture seam
   - feature slice
   - control / guardrail
   - migration
   - retirement
   - spike
   - operational enablement
   - documentation/support enablement
2. Never count stubs, compatibility-only paths, or manual-only critical-path behavior as closure.
3. Never rewrite delivered lineage to solve a newly discovered gap.
4. Never leave mandatory missing owners only in prose.
5. Never let `report.md` become source-of-truth input for later phases.
6. Record missing owner input as gaps or blocked items; do not silently invent it.

## Outputs

Prefer a small canonical core and one generated report.

- canonical:
  - `manifest.json`
  - `backlog.json`
  - `assessment.json`
  - `journal.ndjson`
- generated:
  - `report.md`

If the report is stale or damaged, rebuild it. Do not block the whole process unless canonical state is invalid.

## CLI

Use the bundled CLI for deterministic scaffolding, validation, drift checks, rebaselining, status checks, and report rendering.

Runtime entry:

- `node scripts/architecture-backlog.mjs`

Primary commands:

- `node scripts/architecture-backlog.mjs init /path/to/run-dir`
  Creates the compact discovery bundle:
  - `manifest.json`
  - `backlog.json`
  - `assessment.json`
  - `journal.ndjson`
- `node scripts/architecture-backlog.mjs discover /path/to/run-dir --architecture-source ./docs/architecture.md --runtime-source ./ops/runtime.md`
  Resolves source inputs, auto-initializes or reuses the run, extracts embedded discovery packets, refreshes source fingerprints from the real source content, applies derivable repairs, validates, and renders.
- `node scripts/architecture-backlog.mjs repair /path/to/run-dir`
  Recreates derivable missing canonical files when possible, refreshes source fingerprints from the declared source refs, rebuilds derivable canonical fields such as summary labels and roadmap matrix, validates, and renders.
- `node scripts/architecture-backlog.mjs status /path/to/run-dir`
  Shows phase, acceptance, score, stale entities, drift state, review gaps, and next actions.
- `node scripts/architecture-backlog.mjs validate /path/to/run-dir`
  Repairs derivable bundle files when possible, refreshes source fingerprints from the declared source refs, hard-fails unreadable source truth, validates canonical state, and writes a fresh `assessment.json`.
- `node scripts/architecture-backlog.mjs delta /path/to/run-dir`
  Repairs derivable bundle files when possible, refreshes real source fingerprints, hard-fails unreadable source truth, then recomputes drift against the current baseline and refreshes `assessment.json`.
- `node scripts/architecture-backlog.mjs rebaseline /path/to/run-dir`
  Repairs derivable bundle files when possible, refreshes real source fingerprints, hard-fails unreadable source truth, accepts current canonical/source hashes as the new baseline, and refreshes `assessment.json`.
- `node scripts/architecture-backlog.mjs render /path/to/run-dir`
  Renders `report.md`, including roadmap-matrix projection, lifecycle/drift state, review governance, and final operating questions.
- `node scripts/architecture-backlog.mjs help`
  Shows global help.

Compatibility aliases are also accepted by the same binary:

- `init-discovery-run`
- `discover-discovery-run`
- `status-discovery-run`
- `repair-discovery-run`
- `validate-discovery-run`
- `delta-discovery-run`
- `rebaseline-discovery-run`
- `render-discovery-views`

When you change the CLI source, rebuild the runtime artifact in `scripts/`:

- `pnpm --filter @kostysh/architecture-backlog-engineer-cli build`
- `pnpm --filter @kostysh/architecture-backlog-engineer-cli test`

Use this CLI as the default path during debugging instead of inventing ad hoc files.

## First Use

For a new run:

1. Run `discover` with the available architecture, ADR, runtime, deployment-contract, or evidence sources.
2. Let the CLI initialize the run if it does not exist.
3. Let the CLI extract embedded discovery packets and populate `backlog.json`.
4. Let the CLI repair derivable canonical state, validate, and render `report.md`.

Do not stop after `init` unless the user asked only for scaffolding.

## Repeat Use

For an existing run:

1. Inspect `status`.
2. Run `discover` again with new architecture, ADR, runtime, or evidence sources to update the canonical graph from source truth.
3. Run `repair` when canonical state drift is derivable from existing evidence and only normalized graph state must be rebuilt.
4. Run `delta` when source fingerprints, topology, contracts, or gates have drifted.
5. Re-run `validate`.
6. If drift is accepted into the new baseline, run `rebaseline`.
7. Re-render `report.md`.

Never edit `assessment.json` by hand unless you are repairing corrupted generated state during debugging.

## Progressive Disclosure

Load [references/standard.md](references/standard.md) when you need the full normative standard:

- hard-fail invariants;
- scoring rubric;
- phase-by-phase method;
- class-sensitive DoR/DoD and proof rules;
- contract/migration governance;
- validation contract;
- review applicability and waiver rules.

Use `rg` on the reference when you only need a specific section, for example:

- `rg -n "Hard-Fail Invariants|Scoring Rubric" references/standard.md`
- `rg -n "Phase 6|Phase 7|Phase 8" references/standard.md`
- `rg -n "Definition of Ready|Definition of Done" references/standard.md`
- `rg -n "Appendix A\\. Validation Contract" references/standard.md`

Treat [references/standard.md](references/standard.md) as the bundled normative copy of the methodology for this skill. Do not depend on external local drafts to apply the workflow.

Load [references/artifact-model.md](references/artifact-model.md) when you need:

- the compact artifact split;
- the bootstrap rules;
- failure handling;
- the default command sequence.

## Interop Priority

When this skill is used alongside `dossier-engineer`, treat it as the discovery-layer specialist:

- this skill shapes and validates the backlog graph;
- `dossier-engineer` should intake only items that already passed graph-level shaping and validation.

When conflict exists:

- this skill wins on backlog graph semantics, source authority, ownership seams, and validation gates;
- `dossier-engineer` wins on dossier intake workflow, per-feature execution tracking, and downstream implementation packaging.

Do not collapse the two skills into one large prompt during debugging. Keep this skill focused on architecture-to-backlog transformation and backlog-graph governance.
