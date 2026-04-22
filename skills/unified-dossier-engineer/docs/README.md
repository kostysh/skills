# `unified-dossier-engineer` Docs

This folder contains supporting design, planning, and implementation documents for the merged `dossier-engineer` skill.

Current status:

- canonical merged runtime is shipped
- generated source bundle remains the source of truth
- no legacy split-model support is shipped

## Start Here

1. Read [../SKILL.md](../SKILL.md) for the active merged-skill workflow and shipped command surface.
2. Read [issues/unified-dossier-engineer-concept-2026-04-20.md](issues/unified-dossier-engineer-concept-2026-04-20.md) for the target merged architecture.
3. Read [refactoring-plan-1.ru.md](refactoring-plan-1.ru.md) before starting implementation of the merged skill.

## Document Map

| File | Purpose | When to read |
| --- | --- | --- |
| [issues/unified-dossier-engineer-concept-2026-04-20.md](issues/unified-dossier-engineer-concept-2026-04-20.md) | Target concept for merging `backlog-engineer` and `dossier-engineer`, including artifact model, unified `.dossier`, telemetry, source-review, and compiler-first development rules. | Read first when validating or evolving the merged design. |
| [issues/improvement-proposal-20260421-1.md](issues/improvement-proposal-20260421-1.md) | Proposal to restore operator-facing stage-log value after the merged contract over-shifted toward thin telemetry and mechanical transitions. | Read when evolving the merged log contract or evaluating whether current stage logs preserve enough process evidence. |
| [issues/improvement-proposal-20260422-1.md](issues/improvement-proposal-20260422-1.md) | Proposal to restore the mandatory dossier-stage audit policy, including stage-wide external-review baseline and stronger implementation audit bundles. | Read when correcting mutating-stage review policy, independent-review rules, or mandatory `security-reviewer` coverage. |
| [issues/improvement-proposal-20260422-2.md](issues/improvement-proposal-20260422-2.md) | Proposal to remove stale split-skill and merge-era wording from the active surface so the canonical unified skill no longer speaks as if deleted split skills still exist. | Read when cleaning active wording, source-bundle phrasing, or generated-skill identity text. |
| [refactoring-plan-3.ru.md](refactoring-plan-3.ru.md) | Implementation plan for restoring canonical dossier-stage audit policy, including stage-wide external-review baseline and required implementation audit bundles. | Read before changing dossier-stage review policy, review telemetry, or `review-artifact` semantics. |
| [refactoring-plan-4.ru.md](refactoring-plan-4.ru.md) | Implementation plan for removing stale split-skill / merge-era wording from the active and operator-facing surface of the canonical unified skill. | Read before cleaning source-bundle wording, generated `SKILL.md`, or help/runtime identity text. |
| [refactoring-plan-2.ru.md](refactoring-plan-2.ru.md) | Implementation plan for restoring operator-facing stage-log value while preserving deterministic telemetry and closure truth. | Read before changing the merged log contract, log scaffold runtime, or log-related tests. |
| [refactoring-plan-1.ru.md](refactoring-plan-1.ru.md) | Initial implementation plan for building the merged skill from the concept. | Read before planning or executing implementation work. |
| [legacy-repo-migration.ru.md](legacy-repo-migration.ru.md) | One-shot manual migration guide for moving a legacy split repository onto the canonical unified runtime layout. | Read when converting an existing split repo such as `yaagi` to the new skill/runtime. |
| [implementation-log-1.ru.md](implementation-log-1.ru.md) | Log for `Package 1`: generated-skill scaffold, active surface boundaries, compiler-first maintenance model, and emitted `SKILL.md` stabilization. | Read when verifying or reconstructing the first implementation wave. |
| [implementation-log-2.ru.md](implementation-log-2.ru.md) | Log for grouped wave `Package 2 + Package 3 + Package 5`: unified `.dossier` topology, backlog truth layer, and source-review redesign as active references. | Read when verifying the first merged-domain modeling wave after the initial scaffold. |
| [implementation-log-3.ru.md](implementation-log-3.ru.md) | Log for grouped wave `Package 4 + Package 6`: delivery workflow layer, telemetry/closure model, and preserved closure discipline as active references. | Read when verifying the second merged-domain modeling wave before utility-spec/runtime work starts. |
| [implementation-log-4.ru.md](implementation-log-4.ru.md) | Log for `Package 6.1`: commandized stage-control model for primary delivery workflows, with explicit separation from closure/helper commands. | Read when verifying the pre-utility-spec command/state/logging model. |
| [utility-spec.ru.md](utility-spec.ru.md) | Canonical maintainer-facing specification for the merged utility: command families, artifact contracts, root discovery, locking, output/error envelopes, and truthful closure boundaries. | Read before changing merged runtime/CLI behavior. |
| [implementation-log-5.ru.md](implementation-log-5.ru.md) | Log for `Package 7`: unified utility specification that turns the merged concept and package sequence into a concrete maintainer-facing contract for Package 8. | Read when validating the utility-spec wave and its handoff into runtime design. |
| [implementation-log-6.ru.md](implementation-log-6.ru.md) | Log for `Package 8`: active runtime/help/module boundary for the merged utility. | Read when validating runtime-surface design before CLI implementation changes. |
| [implementation-log-7.ru.md](implementation-log-7.ru.md) | Log for `Package 9`: first-wave merged runtime implementation, stage controllers, source-review mechanics, and command-behavior tests. | Read when validating shipped Package 9 behavior before Package 10 hardening. |
| [implementation-log-8.ru.md](implementation-log-8.ru.md) | Log for `Package 10`: canonical hardening, no-legacy cleanup, parity suites, and source-bundle/runtime alignment. | Read when validating the final canonical-only contract. |
| [implementation-log-9.ru.md](implementation-log-9.ru.md) | Log for post-plan hardening that restores operator-facing stage-log value while preserving deterministic telemetry and closure truth. | Read when validating the restored stage-log contract and its runtime/test parity. |
| [implementation-log-10.ru.md](implementation-log-10.ru.md) | Log for audit-policy restoration: stage-wide external-review baseline, implementation audit bundles, and runtime-enforced review-bundle closure semantics. | Read when validating the restored dossier audit policy and its runtime/telemetry parity. |

## Scope of This Folder

- `docs/issues/*` contains concepts and proposals.
- `docs/*.ru.md` contains execution planning.
- `docs/compile-report.md` is generated and non-normative.
