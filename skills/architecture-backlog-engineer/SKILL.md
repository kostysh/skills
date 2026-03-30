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

Do not treat prose backlog tables or markdown reports as primary truth. The canonical output is the structured backlog graph; `report.md` is only a generated read model.

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

## Role split

Keep the agent and the CLI separate.

Agent responsibilities:

- read prose sources such as architecture docs, ADRs, and runtime evidence;
- interpret claims, seams, obligations, gaps, unknowns, and candidate work;
- author explicit packet files that encode this meaning in the expected schema;
- register sources and packet refs through the bundled CLI.

CLI responsibilities:

- read registered source refs and packet refs;
- load packet payload from those refs;
- merge packet content into the canonical backlog graph;
- update derivable canonical state;
- validate canonical state;
- render the generated report.

The agent does not write `backlog.json` directly. The CLI materializes the canonical graph from registered packet inputs.

## Operator contract

The operator normally provides:

- one or more architecture, ADR, runtime, deployment, or evidence documents;
- an optional `run-dir`;
- an optional acceptance target;
- natural-language create, audit, or edit requests.

The operator does not:

- author packet files;
- edit canonical artifacts by hand;
- manage internal lifecycle steps of the CLI.

Official operator-facing help lives in:

- [references/operator-manual.md](references/operator-manual.md)

## Canonical artifacts

The methodology-owned artifacts are:

- `manifest.json`
- `backlog.json`
- `assessment.json`
- `journal.ndjson`
- `report.md`

Truth lives in the first four files. `report.md` is disposable and must be rebuilt from canonical state.

## Execution contract

When this skill is invoked, follow this sequence unless the user explicitly overrides it:

1. Resolve the bundled runtime artifact.
2. Inspect the target run directory.
3. Initialize the run automatically if canonical artifacts are missing.
4. Reuse the run if canonical artifacts already exist.
5. Read authoritative sources.
6. Interpret the prose sources and author explicit packet files as needed.
7. Register sources and packets through `discover`.
8. Let the CLI materialize or update `backlog.json`.
9. Let the CLI refresh fingerprints, repair derivable state, validate, and render.
10. Return the achieved acceptance class, the main gaps or blockers, and the report path.

Do not ask the operator to remember internal lifecycle steps.

## Core rules

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
7. Use only the bundled CLI to create, update, validate, repair, rebaseline, or render methodology-owned artifacts.
8. Do not create ad hoc generators, mutation scripts, or direct editors for methodology-owned artifacts during normal workflow.

## CLI

Use the bundled CLI for deterministic scaffolding, ingestion, validation, drift checks, rebaselining, status checks, and report rendering.

Runtime entry:

- `node scripts/architecture-backlog.mjs`
- Bundled artifact path inside this skill package: [scripts/architecture-backlog.mjs](scripts/architecture-backlog.mjs)
  If the target repo does not have a repo-local copy, use this bundled file directly.

Primary commands:

- `node scripts/architecture-backlog.mjs init /path/to/run-dir`
  Initializes the compact discovery bundle.
- `node scripts/architecture-backlog.mjs discover /path/to/run-dir --architecture-source ./docs/architecture.md --source-packet ./tmp/packet.json`
  Registers sources and explicit packet refs, materializes or updates the canonical graph, refreshes fingerprints, repairs derivable state, validates, and renders.
- `node scripts/architecture-backlog.mjs repair /path/to/run-dir`
  Repairs derivable canonical state from the existing run and declared source refs, then validates and renders.
- `node scripts/architecture-backlog.mjs status /path/to/run-dir`
  Shows phase, acceptance, score, stale entities, drift state, review gaps, and next actions.
- `node scripts/architecture-backlog.mjs validate /path/to/run-dir`
  Validates canonical state and refreshes `assessment.json`.
- `node scripts/architecture-backlog.mjs delta /path/to/run-dir`
  Recomputes drift against the current baseline and refreshes `assessment.json`.
- `node scripts/architecture-backlog.mjs rebaseline /path/to/run-dir`
  Accepts current canonical and source state as the new baseline and refreshes `assessment.json`.
- `node scripts/architecture-backlog.mjs render /path/to/run-dir`
  Rebuilds `report.md` from canonical state.

Compatibility aliases are also accepted:

- `init-discovery-run`
- `discover-discovery-run`
- `status-discovery-run`
- `repair-discovery-run`
- `validate-discovery-run`
- `delta-discovery-run`
- `rebaseline-discovery-run`
- `render-discovery-views`

## First use

For a new run:

1. Read the architecture and related prose sources.
2. Author explicit packet files that encode the intended graph updates. Use [references/packet-schema.md](references/packet-schema.md) when you need the envelope, merge modes, allowed section keys, or minimal examples.
3. Run `discover` with the relevant `--*-source` refs and `--source-packet` refs.
4. Let the CLI initialize the run if it does not exist.
5. Let the CLI materialize the canonical graph, validate it, and render `report.md`.

Do not stop after `init` unless the user asked only for scaffolding.

## Repeat use

For an existing run:

1. Inspect `status`.
2. Read changed prose sources.
3. Author updated explicit packet files as needed.
4. Run `discover` again with the relevant sources and packet refs.
5. Run `repair`, `validate`, `delta`, or `rebaseline` only when the situation calls for those workflows.
6. Use `render` only to rebuild generated output from existing canonical state.

Never edit canonical artifacts by hand during the normal workflow.

## Progressive disclosure

Load [references/standard.md](references/standard.md) when you need the full normative standard:

- hard-fail invariants;
- scoring rubric;
- phase-by-phase method;
- class-sensitive DoR/DoD and proof rules;
- contract and migration governance;
- validation contract;
- review applicability and waiver rules.

Load [references/artifact-model.md](references/artifact-model.md) when you need:

- the compact artifact split;
- bootstrap rules;
- failure handling;
- the default command sequence.

Load [references/packet-schema.md](references/packet-schema.md) when you need:

- the explicit packet envelope;
- allowed `source` and `packet_provenance` keys;
- allowed section keys and upsert identities;
- merge-mode restrictions;
- minimal packet examples.

Load [docs/concept-baseline.ru.md](docs/concept-baseline.ru.md) when you need the non-negotiable role split:

- prose interpretation belongs to the agent;
- packet authoring belongs to the agent;
- canonical graph materialization belongs to the CLI;
- ad hoc tooling is forbidden in the normal methodology workflow.

## Interop priority

When this skill is used alongside `dossier-engineer`, treat it as the discovery-layer specialist:

- this skill shapes and validates the backlog graph;
- `dossier-engineer` should intake only items that already passed graph-level shaping and validation.

When conflict exists:

- this skill wins on backlog graph semantics, source authority, ownership seams, and validation gates;
- `dossier-engineer` wins on dossier intake workflow, per-feature execution tracking, and downstream implementation packaging.

Do not collapse the two skills into one large prompt during debugging. Keep this skill focused on architecture-to-backlog transformation and backlog-graph governance.
