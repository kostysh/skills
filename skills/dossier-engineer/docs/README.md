# `dossier-engineer` Docs

This folder contains supporting documentation for the `dossier-engineer` skill and its CLI utility.

`dossier-engineer` is a lean docs-as-code workflow for large software projects with AI agents. It is built around one Feature Dossier per selected backlog work, one global index, stable traceability IDs, machine-checkable verification artifacts, and independent review before step closure.

## Start Here

- Read [../SKILL.md](../SKILL.md) for the operator-facing workflow, rules, and command guidance.
- Read [../references/workflow.md](../references/workflow.md) for a compact workflow reference.
- Use this `docs/` folder when you need deeper utility-specific architecture or behavior details.

## Document Map

| File | Purpose | When to read |
| --- | --- | --- |
| [utility-architecture.md](utility-architecture.md) | Technical architecture of the `dossier-engineer` CLI: runtime model, module boundaries, core layers, and testing approach. | Read first when you need to understand how the utility is structured internally. |
| [utility-spec.ru.md](utility-spec.ru.md) | Current behavioral specification of the CLI utility, including command contracts, artifacts, path rules, and exit-code behavior. This document is written in Russian. | Read when you need exact runtime behavior or want to validate implementation details against the documented contract. |
| [AGENTS.md](AGENTS.md) | Local process rules for planning, implementation, review, and logging during dossier/backlog harmonization work. | Read before executing any refactor package from the harmonization plans. |
| [backlog-harmonization-prep.ru.md](backlog-harmonization-prep.ru.md) | Preparatory report for harmonizing `dossier-engineer` with `backlog-engineer`: role boundaries, overlap map, friction points, migration from legacy candidate-backlog to backlog-driven model, and recommended direction. This document is written in Russian. | Read before planning dossier/backlog harmonization work. |
| [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md) | Target cross-skill development process: how `backlog-engineer` and `dossier-engineer` should work together from backlog creation to intake, spec, planning, implementation, closure, and backlog sync. This document is written in Russian. | Read when you need the agreed target process before comparing it with current skill behavior. |
| [change-proposal-cross-skill-use-cases.ru.md](change-proposal-cross-skill-use-cases.ru.md) | Matrix of real operator-facing `change-proposal` scenarios across `dossier-engineer` and `backlog-engineer`: dossier-side workflow, backlog-side workflow, and current support status. This document is written in Russian. | Read when you need to reason about requirement-change flows after the initial dossier/backlog handshake. |
| [dossier-process-gap-analysis.ru.md](dossier-process-gap-analysis.ru.md) | Detailed gap analysis of `dossier-engineer` against the target cross-skill process: what conflicts, what must be removed, what must be rewritten, and what can stay. This document is written in Russian. | Read before designing the dossier refactor. |
| [backlog-process-gap-analysis.ru.md](backlog-process-gap-analysis.ru.md) | Detailed gap analysis of `backlog-engineer` against the target cross-skill process: what already fits, what interop rules are still missing, and what should be adjusted later for full alignment. This document is written in Russian. | Read after the dossier gap analysis, before planning backlog-side alignment changes. |
| [refactoring-plan-1.ru.md](refactoring-plan-1.ru.md) | Stage-1 refactoring plan for `dossier-engineer` under the backlog-driven process: fixed decisions, work packages, sequencing, and acceptance gates. This document is written in Russian. | Read when moving from process analysis to actual dossier-side refactoring work. |
| [implementation-log-1.ru.md](implementation-log-1.ru.md) | Incremental log for dossier harmonization implementation work. This document is written in Russian. | Read when you need the package-by-package record of decisions, checks, review rounds, and commits. |
| [refactoring-plan-2.ru.md](refactoring-plan-2.ru.md) | Corrective UX pass plan after operator/agent audit: command-surface cleanup, durable backlog handoff, step-local backlog sync, and safe `next-step` targeting. This document is written in Russian. | Read when working on the post-refactor UX hardening cycle. |
| [implementation-log-2.ru.md](implementation-log-2.ru.md) | Incremental log for the UX corrective pass. This document is written in Russian. | Read when you need the package-by-package record for the UX hardening cycle. |
| [refactoring-plan-3.ru.md](refactoring-plan-3.ru.md) | Second UX corrective pass plan after targeted operator/agent audit: closure-path wording, help/output clarity, explicit reviewer provenance, and refresh-contract alignment. This document is written in Russian. | Read when working on the follow-up UX hardening cycle after the first corrective pass. |
| [implementation-log-3.ru.md](implementation-log-3.ru.md) | Incremental log for the second UX corrective pass. This document is written in Russian. | Read when you need the package-by-package record for the latest UX hardening cycle. |
| [refactoring-plan-4.ru.md](refactoring-plan-4.ru.md) | Stage-2 harmonization plan for `backlog-engineer`: explicit backlog→dossier handoff, backlog status actualization after dossier steps, dossier-supporting evidence rules, and cross-skill doc/spec alignment. This document is written in Russian. | Read when moving from dossier-side harmonization to backlog-side cross-skill alignment work. |
| [implementation-log-4.ru.md](implementation-log-4.ru.md) | Incremental log for backlog-side harmonization work. This document is written in Russian. | Read when you need the package-by-package record for stage-2 backlog-engineer alignment. |
| [implementation-log-5.ru.md](implementation-log-5.ru.md) | Incremental log for the narrow cross-skill UX corrective pass after the first end-to-end harmonized audit. This document is written in Russian. | Read when you need the record of literal wording and handoff/closure contract fixes after the cross-skill UX audit. |
| [refactoring-plan-5.ru.md](refactoring-plan-5.ru.md) | Process-hardening plan for `dossier-engineer`: audit management, implementation logging contract, metrics, and stronger `spec-compact` / `plan-slice` process rules. This document is written in Russian. | Read when planning how to carry implementation discipline and real-usage lessons into future projects. |
| [implementation-log-6.ru.md](implementation-log-6.ru.md) | Incremental log for the process-hardening implementation cycle that moves audit and logging discipline into the canonical skill contract. This document is written in Russian. | Read when you need the package-by-package record for the process-hardening cycle. |
| [refactoring-plan-6.ru.md](refactoring-plan-6.ru.md) | Dossier-side implementation plan for `change-proposal` cross-skill hardening: explicit backlog-impact classifier, stage-level handoff, and optional runtime hints without new commands or artifacts. This document is written in Russian. | Read when planning the dossier-side half of the `change-proposal` harmonization cycle. |
| [implementation-log-7.ru.md](implementation-log-7.ru.md) | Incremental log for the dossier-side `change-proposal` hardening cycle: explicit backlog-impact verdict, closure semantics, and runtime-boundary decisions for `contract-drift-audit`. This document is written in Russian. | Read when you need the package-by-package record for the dossier-side half of `change-proposal` harmonization. |
| [refactoring-plan-7.ru.md](refactoring-plan-7.ru.md) | Plan for unifying workflow-stage logging across `spec-compact`, `plan-slice`, and `implementation`. This document is written in Russian. | Read when updating process telemetry rules for dossier workflow stages. |
| [refactoring-plan-8.ru.md](refactoring-plan-8.ru.md) | Plan for giving `feature-intake` its own command-level process logging contract and active-reference protection. This document is written in Russian. | Read when hardening intake-specific process telemetry and docs-contract coverage. |
| [implementation-log-8.ru.md](implementation-log-8.ru.md) | Incremental log for the workflow-stage logging policy implementation cycle. This document is written in Russian. | Read when you need the package record for the stage-logging policy cycle. |
| [refactoring-plan-9.ru.md](refactoring-plan-9.ru.md) | Plan for implementation completion guard, early security seam checkpoint, and freshness-aware closure artifacts. This document is written in Russian. | Read when tightening implementation close-out semantics and early security review triggers. |
| [refactoring-plan-10.ru.md](refactoring-plan-10.ru.md) | Plan for adversarial proof obligations across `spec-compact` and `plan-slice`. This document is written in Russian. | Read when hardening risk-to-proof discipline before implementation starts. |
| [refactoring-plan-11.ru.md](refactoring-plan-11.ru.md) | Plan for a fail-closed audit launch gate before blocking external audits. This document is written in Russian. | Read when tightening model/reasoning policy for spawned audit and review agents. |
| [refactoring-plan-12.ru.md](refactoring-plan-12.ru.md) | Plan for fail-closed canonical backlog reads in the cross-skill backlog/dossier workflow. This document is written in Russian. | Read when hardening canonical backlog access and preventing `.backlog/*` shortcut reads. |

## Related Materials

- [../references/workflow.md](../references/workflow.md) explains the end-to-end dossier workflow.
- [../references/implementation-audit-policy.md](../references/implementation-audit-policy.md) defines the external audit stack for implementation work.
- [../references/workflow-stage-logging.md](../references/workflow-stage-logging.md) defines the logging contract and metrics for `spec-compact`, `plan-slice`, and `implementation`.
- [../references/spec-and-plan-risk-patterns.md](../references/spec-and-plan-risk-patterns.md) defines the contract-risk patterns that `spec-compact` and `plan-slice` should kill before late corrective cycles.
- [../references/DOSSIER_TEMPLATE.md](../references/DOSSIER_TEMPLATE.md) provides the canonical Feature Dossier template.
- [../references/SSOT_INDEX_TEMPLATE.md](../references/SSOT_INDEX_TEMPLATE.md) provides the global index template.
- [../references/example-feature-dossier.md](../references/example-feature-dossier.md) shows a worked dossier example.
- [../assets/example-repo/](../assets/example-repo/) contains a small example repository that demonstrates the expected repo layout.

## Suggested Reading Paths

### If you are new to the skill

1. [../SKILL.md](../SKILL.md)
2. [../references/workflow.md](../references/workflow.md)
3. [../references/example-feature-dossier.md](../references/example-feature-dossier.md)

### If you are working on the CLI

1. [utility-architecture.md](utility-architecture.md)
2. [utility-spec.ru.md](utility-spec.ru.md)
3. [../src/](../src/)
4. [../test/](../test/)

### If you are preparing backlog/dossier harmonization

1. [backlog-harmonization-prep.ru.md](backlog-harmonization-prep.ru.md)
2. [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)
3. [dossier-process-gap-analysis.ru.md](dossier-process-gap-analysis.ru.md)
4. [backlog-process-gap-analysis.ru.md](backlog-process-gap-analysis.ru.md)
5. [refactoring-plan-1.ru.md](refactoring-plan-1.ru.md)
6. [implementation-log-1.ru.md](implementation-log-1.ru.md)
7. [../SKILL.md](../SKILL.md)
8. [../references/workflow.md](../references/workflow.md)

### If you are working on the UX corrective pass

1. [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)
2. [refactoring-plan-2.ru.md](refactoring-plan-2.ru.md)
3. [implementation-log-2.ru.md](implementation-log-2.ru.md)
4. [../SKILL.md](../SKILL.md)
5. [../references/workflow.md](../references/workflow.md)

### If you are working on the second UX corrective pass

1. [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)
2. [refactoring-plan-3.ru.md](refactoring-plan-3.ru.md)
3. [implementation-log-3.ru.md](implementation-log-3.ru.md)
4. [../SKILL.md](../SKILL.md)
5. [../references/workflow.md](../references/workflow.md)

### If you are starting backlog-side harmonization

1. [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)
2. [change-proposal-cross-skill-use-cases.ru.md](change-proposal-cross-skill-use-cases.ru.md)
3. [backlog-process-gap-analysis.ru.md](backlog-process-gap-analysis.ru.md)
4. [refactoring-plan-4.ru.md](refactoring-plan-4.ru.md)
5. [implementation-log-4.ru.md](implementation-log-4.ru.md)
6. [../../backlog-engineer/SKILL.md](../../backlog-engineer/SKILL.md)
7. [../../backlog-engineer/references/operator-workflows.md](../../backlog-engineer/references/operator-workflows.md)
8. [../../backlog-engineer/references/command-reference.md](../../backlog-engineer/references/command-reference.md)

### If you are planning `change-proposal` harmonization

1. [change-proposal-cross-skill-use-cases.ru.md](change-proposal-cross-skill-use-cases.ru.md)
2. [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)
3. [refactoring-plan-6.ru.md](refactoring-plan-6.ru.md)
4. [implementation-log-7.ru.md](implementation-log-7.ru.md)
5. [../../backlog-engineer/docs/refactoring-plan-6.ru.md](../../backlog-engineer/docs/refactoring-plan-6.ru.md)
6. [../SKILL.md](../SKILL.md)
7. [../references/workflow-stage-change-proposal.md](../references/workflow-stage-change-proposal.md)

### If you are working on the narrow cross-skill UX corrective pass

1. [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)
2. [implementation-log-5.ru.md](implementation-log-5.ru.md)
3. [../SKILL.md](../SKILL.md)
4. [../references/workflow.md](../references/workflow.md)
5. [../../backlog-engineer/SKILL.md](../../backlog-engineer/SKILL.md)
6. [../../backlog-engineer/references/operator-workflows.md](../../backlog-engineer/references/operator-workflows.md)

### If you are hardening the future implementation process

1. [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)
2. [refactoring-plan-5.ru.md](refactoring-plan-5.ru.md)
3. [implementation-log-6.ru.md](implementation-log-6.ru.md)
4. [../references/implementation-audit-policy.md](../references/implementation-audit-policy.md)
5. [../references/workflow-stage-logging.md](../references/workflow-stage-logging.md)
6. [AGENTS.md](AGENTS.md)
7. [../SKILL.md](../SKILL.md)
8. [../references/workflow.md](../references/workflow.md)

### If you are hardening canonical backlog access

1. [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)
2. [backlog-process-gap-analysis.ru.md](backlog-process-gap-analysis.ru.md)
3. [refactoring-plan-12.ru.md](refactoring-plan-12.ru.md)
4. [../SKILL.md](../SKILL.md)
5. [../references/workflow.md](../references/workflow.md)
6. [../../backlog-engineer/SKILL.md](../../backlog-engineer/SKILL.md)
7. [../../backlog-engineer/references/command-reference.md](../../backlog-engineer/references/command-reference.md)

## Scope of This Folder

- This folder is for utility-focused documentation.
- The canonical skill contract lives in [../SKILL.md](../SKILL.md).
- Templates and reusable reference material live in [../references/](../references/).
- The built runtime lives at [../scripts/dossier.mjs](../scripts/dossier.mjs).
