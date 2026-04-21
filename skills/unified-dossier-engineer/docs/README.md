# `unified-dossier-engineer` Docs

This folder contains supporting planning documents for the future merged `dossier-engineer` skill.

Current status:

- planning-stage only
- generated source bundle scaffold exists
- no shipped unified runtime contract yet

## Start Here

1. Read [../SKILL.md](../SKILL.md) for the active planning-stage workflow.
2. Read [issues/unified-dossier-engineer-concept-2026-04-20.md](issues/unified-dossier-engineer-concept-2026-04-20.md) for the target merged architecture.
3. Read [refactoring-plan-1.ru.md](refactoring-plan-1.ru.md) before starting implementation of the merged skill.

## Document Map

| File | Purpose | When to read |
| --- | --- | --- |
| [issues/unified-dossier-engineer-concept-2026-04-20.md](issues/unified-dossier-engineer-concept-2026-04-20.md) | Target concept for merging `backlog-engineer` and `dossier-engineer`, including artifact model, unified `.dossier`, telemetry, source-review, and compiler-first development rules. | Read first when validating or evolving the merged design. |
| [refactoring-plan-1.ru.md](refactoring-plan-1.ru.md) | Initial implementation plan for building the merged skill from the concept. | Read before planning or executing implementation work. |
| [implementation-log-1.ru.md](implementation-log-1.ru.md) | Log for `Package 1`: generated-skill scaffold, active surface boundaries, compiler-first maintenance model, and emitted `SKILL.md` stabilization. | Read when verifying or reconstructing the first implementation wave. |
| [implementation-log-2.ru.md](implementation-log-2.ru.md) | Log for grouped wave `Package 2 + Package 3 + Package 5`: unified `.dossier` topology, backlog truth layer, and source-review redesign as active references. | Read when verifying the first merged-domain modeling wave after the initial scaffold. |
| [implementation-log-3.ru.md](implementation-log-3.ru.md) | Log for grouped wave `Package 4 + Package 6`: delivery workflow layer, telemetry/closure model, and preserved closure discipline as active references. | Read when verifying the second merged-domain modeling wave before utility-spec/runtime work starts. |
| [implementation-log-4.ru.md](implementation-log-4.ru.md) | Log for `Package 6.1`: commandized stage-control model for primary delivery workflows, with explicit separation from closure/helper commands. | Read when verifying the pre-utility-spec command/state/logging model. |
| [utility-spec.ru.md](utility-spec.ru.md) | Canonical maintainer-facing specification for the future merged utility: command families, artifact contracts, root discovery, locking, output/error envelopes, and truthful closure boundaries. | Read before designing or reviewing merged runtime/CLI behavior. |
| [implementation-log-5.ru.md](implementation-log-5.ru.md) | Log for `Package 7`: unified utility specification that turns the merged concept and package sequence into a concrete maintainer-facing contract for Package 8. | Read when validating the utility-spec wave and its handoff into runtime design. |

## Scope of This Folder

- `docs/issues/*` contains concepts and proposals.
- `docs/*.ru.md` contains execution planning.
- `docs/compile-report.md` is generated and non-normative.
