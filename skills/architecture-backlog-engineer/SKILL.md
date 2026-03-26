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

Do not treat prose backlog tables as primary truth. Build or audit the structured backlog graph first, then render candidate lists and roadmap views from it.

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
10. Validate the graph, then render human-facing backlog and roadmap projections.

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
5. Never let derived markdown views become source-of-truth inputs for later phases.

## Outputs

Prefer a small canonical core and generated projections:

- canonical:
  - source-authority state
  - structured backlog graph
  - proof/validation state
  - review/closure state
- generated:
  - candidate backlog markdown
  - roadmap markdown
  - gap summaries
  - score summaries

If a generated view is stale or damaged, rebuild it. Do not block the whole process unless canonical state is invalid.

## Scripts

Use the bundled scripts for deterministic scaffolding and checks:

- `node scripts/init-discovery-run.mjs /path/to/run-dir`
  Creates the canonical discovery core:
  - `manifest.json`
  - `journal.ndjson`
  - `state.snapshot.json`
  - `validation.json`
  - `closure.json`
- `node scripts/validate-discovery-run.mjs /path/to/run-dir`
  Validates canonical state and writes a fresh `validation.json`.
- `node scripts/render-discovery-views.mjs /path/to/run-dir`
  Renders disposable markdown projections into `views/`.

Use these scripts as the default path during debugging instead of inventing ad hoc files.

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

- the canonical-vs-derived artifact split;
- the minimal run bundle;
- failure handling and rebuild expectations;
- the default command sequence.

## Interop Priority

When this skill is used alongside `dossier-engineer`, treat it as the discovery-layer specialist:

- this skill shapes and validates the backlog graph;
- `dossier-engineer` should intake only items that already passed graph-level shaping and validation.

When conflict exists:

- this skill wins on backlog graph semantics, source authority, ownership seams, and validation gates;
- `dossier-engineer` wins on dossier intake workflow, per-feature execution tracking, and downstream implementation packaging.

Do not collapse the two skills into one large prompt during debugging. Keep this skill focused on architecture-to-backlog transformation and backlog-graph governance.
