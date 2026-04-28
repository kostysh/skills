# План имплементации `ISS-10`

Plan ID: `implementation-plan-20260428-1`

Related issue: [issue-20260428-1.md](issue-20260428-1.md)

Status: audited

## Source Artifacts

- [issue-20260428-1.md](issue-20260428-1.md) — proposal and acceptance criteria for explicit post-intake `intaken` backlog state.
- [improvement-proposal-20260424-1.md](improvement-proposal-20260424-1.md), [implementation-plan-20260424-1.md](implementation-plan-20260424-1.md), [../logs/implementation-log-20260424-1.md](../logs/implementation-log-20260424-1.md) — existing lifecycle reconciliation design for `spec-compact`, `plan-slice`, and `implementation`.
- [../../references/status-and-scope.md](../../references/status-and-scope.md) — hard invariants for canonical runtime scope and lifecycle truth.
- [../../references/delivery-workflow-layer.md](../../references/delivery-workflow-layer.md) — delivery-stage obligations, backlog actualization boundary, and closure gates.
- [../../references/backlog-truth-layer.md](../../references/backlog-truth-layer.md) — backlog read models, mutation ownership, and selected-feature lifecycle targets.
- [../../references/commandized-stage-control.md](../../references/commandized-stage-control.md) — stage-controller authority boundary and non-mutating backlog follow-up state.
- [../../references/runtime-and-command-boundary.md](../../references/runtime-and-command-boundary.md) — shipped CLI/help/runtime parity requirements.
- [../../references/telemetry-and-closure.md](../../references/telemetry-and-closure.md) — stage-state parity fields and closure telemetry.
- [../../references/source-bundle-governance.md](../../references/source-bundle-governance.md) — source-bundle-first maintenance workflow for active references and generated `SKILL.md`.
- [../utility-spec.ru.md](../utility-spec.ru.md) — maintainer-facing runtime contract to keep aligned with CLI behavior.
- Current runtime surfaces:
  - `../../src/shared/lifecycle-reconciliation.ts`
  - `../../src/shared/stage-state.ts`
  - `../../src/delivery/stage-control.ts`
  - `../../src/unified-cli.ts`
  - `../../src/backlog/commands.ts`
  - `../../src/vendor/backlog-engineer/schemas/*`
  - `../../src/vendor/backlog-engineer/schemas/commands.ts`
  - `../../src/vendor/backlog-engineer/core/replay-pipeline.ts`
  - `../../src/vendor/backlog-engineer/core/queue-service.ts`
  - `../../src/vendor/backlog-engineer/commands/status.ts`
  - `../../src/vendor/backlog-engineer/commands/refresh-helpers.ts`
  - `../../src/vendor/backlog-engineer/core/search-service.ts`
  - `../../src/vendor/backlog-engineer/reports/*`
  - `../../src/vendor/backlog-engineer/templates/*`
- Test surfaces:
  - `../../test/cli.test.ts`
  - `../../test/docs-contract.test.ts`

## Objective

После truthful close of `feature-intake` selected backlog item больше не должен оставаться неотличимым от ordinary not-yet-intaken `defined` work.

Target lifecycle order:

```text
defined < intaken < specified < planned < implemented
```

Observable outcome:

- `feature-intake` creates the feature dossier and records lifecycle target `intaken`;
- while selected item is still `defined`, `feature-intake` stage state/log show unresolved backlog lifecycle actualization;
- `dossier-step-close --step feature-intake` fails before step artifact write while current backlog truth is below `intaken`;
- canonical `patch-item` actualization from `defined` to `intaken`, passed through `--backlog-actualization-artifact`, allows truthful `feature-intake` closure;
- `queue` no longer silently returns already-intaken work as a fresh intake candidate;
- `status`, `items`, `search`, and `report` expose `intaken` as a distinct backlog lifecycle state;
- `next-step` remains dossier-local and continues to return `spec-compact` for the mapped feature dossier.

## Assumptions

- The issue audit status is accepted as valid input for implementation planning.
- `intaken` means dossier handoff exists; it is not requirements specification, planning, implementation readiness, or dossier maturity.
- Historical backlog items and existing dossiers are not migrated in this issue.
- Existing `backlog_actualization_artifacts` and `--backlog-actualization-artifact` remain trace evidence only; current backlog truth remains authoritative.
- The existing lifecycle reconciliation helper is the right extension point; adding a parallel lifecycle model would increase drift risk.
- `feature-intake` currently has a custom wrapper path in `src/unified-cli.ts` plus `appendFeatureIntakeLog` in `src/delivery/stage-control.ts`; this issue must update that path as well as the generic stage-controller path.
- The implementation may add deterministic fields such as `intaken_count` and warning/classification fields, but must not redesign queue ranking.

## Scope

In scope:

- add `intaken` to backlog delivery-state validation, TypeScript types, lifecycle ordering, and dependency readiness ranking;
- extend selected-feature lifecycle target mapping with `feature-intake -> intaken`;
- make `feature-intake` stage state/log expose `backlog_lifecycle_target`, `backlog_lifecycle_current`, `backlog_lifecycle_reconciled`, `backlog_actualization_artifacts`, and `backlog_actualization_verdict`;
- enforce `dossier-step-close --step feature-intake` against current backlog truth before writing a step artifact;
- keep backlog truth mutation owned by `patch-item` or `refresh + patch`;
- update status/read-model/report/search/item behavior so `intaken` is visible and deterministic;
- update active references, utility spec, generated `SKILL.md`, runtime help if text changes, and docs-contract tests in the same change set;
- update CLI tests to cover the new lifecycle state and no-regression paths.

Out of scope:

- no command-owned backlog mutation in `feature-intake`;
- no broad queue redesign, scoring rewrite, or dependency policy redesign beyond handling `intaken` explicitly;
- no migration of historical `defined` items already associated with existing dossiers;
- no change to the meaning of `specified`, `planned`, or `implemented`;
- no change to stage names, command names, artifact families, audit policy, review freshness, or closure gates;
- no automatic source-review acknowledgement or dependency attention cleanup because an item became `intaken`.

## Proposed Changes

### Active Instructions And Utility Spec

Update source-bundle files first, then regenerate generated artifacts:

- `references/delivery-workflow-layer.md`:
  - change selected-feature lifecycle target list to include `feature-intake -> intaken`;
  - state that `feature-intake` closure is not truthful until current backlog truth is at least `intaken`;
  - preserve the rule that `intaken` is only backlog handoff state.
- `references/backlog-truth-layer.md`:
  - define lifecycle order `defined < intaken < specified < planned < implemented`;
  - state that `queue` must not present `intaken` items as fresh intake candidates;
  - state that `status` exposes `intaken_count`.
- `references/commandized-stage-control.md`:
  - extend selected-feature lifecycle progression list with `feature-intake -> intaken`;
  - keep stage controllers non-mutating and require unresolved follow-up while current truth is below target.
- `references/runtime-and-command-boundary.md` and `references/telemetry-and-closure.md`:
  - align `dossier-step-close` lifecycle enforcement wording with `feature-intake`;
  - ensure stage-state parity wording includes the new target without implying runtime proof of reviewer launch independence.
- `docs/utility-spec.ru.md`:
  - update lifecycle order, status fields, close-out error condition, and feature-intake actualization flow.
- `skill.yaml` / generated `SKILL.md`:
  - regenerate if changed references or command summaries affect emitted guidance.
- `test/docs-contract.test.ts`:
  - pin that active docs mention `intaken`, `feature-intake -> intaken`, `status`/`queue` behavior, and the non-mutating actualization boundary.

### Runtime: Lifecycle State Model

Update one canonical state model instead of scattered local literals:

- `src/vendor/backlog-engineer/schemas/scalars.ts`: add `intaken` to `DeliveryStateSchema`.
- `src/shared/lifecycle-reconciliation.ts`: update `DELIVERY_STATES` to `['defined', 'intaken', 'specified', 'planned', 'implemented']`, add `feature-intake -> intaken`, and keep comparator semantics order-based.
- `src/vendor/backlog-engineer/core/replay-pipeline.ts`: update `stageRank` or replace it with a shared local helper so dependency readiness treats `intaken` between `defined` and `specified`.
- `src/vendor/backlog-engineer/schemas/packet.ts`, `patch.ts`, and `artifacts.ts`: validate `intaken` through the shared delivery-state schema with no special-case parser.
- Test helpers in `test/cli.test.ts`: extend `TestDeliveryState` to include `intaken`.

### Runtime: Feature Intake Reconciliation

Update the custom `feature-intake` path:

- In `src/unified-cli.ts`, after vendored `feature-intake` returns selected `backlog_item_key`, evaluate lifecycle reconciliation for `feature-intake`.
- In `appendFeatureIntakeLog` / `stageSchemaMetadata`, write lifecycle metadata and unresolved backlog follow-up when current state is below `intaken`.
- Return JSON/non-JSON feature-intake output with the existing stage fields plus lifecycle/follow-up fields, so operators can see that actualization is required.
- Do not call `patch-item`, edit `state.json`, or apply patches inside `feature-intake`.

Expected initial metadata when selected item remains `defined`:

```yaml
backlog_followup_required: true
backlog_followup_kind: backlog-lifecycle-actualization
backlog_followup_resolved: false
backlog_lifecycle_target: intaken
backlog_lifecycle_current: defined
backlog_lifecycle_reconciled: false
backlog_actualization_verdict: actualization_required
```

Expected metadata after accepted patch and close:

```yaml
backlog_lifecycle_target: intaken
backlog_lifecycle_current: intaken
backlog_lifecycle_reconciled: true
backlog_actualization_verdict: actualized_by_backlog_artifact
```

### Runtime: Step Close Enforcement

Extend the existing `dossier-step-close` wrapper behavior:

- rely on `lifecycleTargetForStage('feature-intake') === 'intaken'`;
- resolve selected backlog item from helper-managed `feature-intake` stage state or dossier frontmatter;
- fail with existing `UDE_BACKLOG_ACTUALIZATION_REQUIRED` before vendored close-out when current state is below `intaken`;
- accept `--backlog-actualization-artifact <path>` only as a managed applied patch artifact that targets the selected item;
- record lifecycle reconciliation fields into helper-managed stage state and mirrored stage log through the existing `recordStepCloseOnStageLog` path.

Do not weaken existing close-out gates: external audit, verification artifact, review freshness, dirty-worktree behavior, and existing step artifact validation remain unchanged.

### Runtime: Read Models And Operator Signals

Update backlog read surfaces without broad redesign:

- `status`:
  - add `intaken_count`;
  - keep `ready_for_next_step_count` deterministic after queue/source-review/lifecycle overlays;
  - treat `ready_for_next_step_count` as ordinary backlog next-intake readiness: exclude `intaken` item keys from that adjusted count and use `intaken_count` as the dedicated handoff count;
  - preserve existing lifecycle drift and post-close hygiene fields.
- `queue`:
  - exclude or explicitly classify `intaken` items so they are not ordinary fresh intake candidates;
  - prefer a clear warning or envelope field for excluded `intaken` item keys if this can be done without changing vendored queue-chain shape;
  - preserve current source-review and lifecycle-drift overlays.
- `items`:
  - no special overlay is required beyond ensuring item cards can carry `delivery_state: intaken`; add tests that prove the distinction from `defined`.
- `search`:
  - allow `--delivery-state intaken`;
  - return `match_reasons: ["delivery_state=intaken"]` for matching items.
- `report`:
  - ensure generated metrics and item sections show `intaken` in delivery-state summaries.
- `template`:
  - keep packet template default as `defined`; do not encourage new work to start as `intaken`.

### Tests

Add or update CLI tests for:

- packet/patch validation accepts `intaken`;
- dependency readiness treats `intaken` as after `defined` and before `specified`;
- `feature-intake` on a `defined` item records unresolved `feature-intake -> intaken` lifecycle metadata;
- `dossier-step-close --step feature-intake` fails with `UDE_BACKLOG_ACTUALIZATION_REQUIRED` while selected item is still `defined`;
- canonical `patch-item` actualization to `intaken` plus `--backlog-actualization-artifact` allows feature-intake close and records accepted artifact evidence;
- `queue` does not silently return an already-intaken item as ordinary intake-ready work;
- `status` includes `intaken_count` and its adjusted `ready_for_next_step_count` does not count `intaken` item keys as fresh intake-ready work;
- `items`, `search`, and `report` expose `intaken`;
- `spec-compact` cannot close when current backlog state is only `intaken`;
- existing `specified -> planned -> implemented` lifecycle reconciliation tests still pass;
- no regression for source-review overlays, post-close hygiene warnings, and immutable review artifact close-out behavior.

Add docs-contract tests for:

- active references contain `defined < intaken < specified < planned < implemented`;
- active references state `feature-intake -> intaken`;
- active references say `intaken` is not equivalent to `specified`;
- active references preserve `feature-intake` non-mutation and `patch-item` / `refresh + patch` ownership;
- utility spec and runtime-boundary docs mention `intaken_count` or equivalent deterministic status field.

## Implementation Steps

1. Update active references and `docs/utility-spec.ru.md` with the new lifecycle state, target mapping, actualization boundary, and read-model semantics.
2. Add docs-contract tests that fail until the active docs mention the required `intaken` rules.
3. Update `DeliveryStateSchema`, runtime TypeScript state types, lifecycle helper ordering, and dependency readiness ranking.
4. Update status schema/output with `intaken_count`; update search/filter/report/read-model schema behavior where the shared delivery-state schema flows through.
5. Update queue behavior to exclude or classify `intaken` items from fresh intake candidates while preserving existing drift/source-review overlays.
6. Wire `feature-intake -> intaken` reconciliation into `src/unified-cli.ts` and `appendFeatureIntakeLog`, including stage-state/frontmatter parity fields and output data.
7. Confirm `dossier-step-close` blocks `feature-intake` until current backlog truth satisfies `intaken`, then records accepted actualization artifact evidence on success.
8. Add focused CLI regression tests and update existing helper types/fixtures where they encode the old four-state lifecycle.
9. Rebuild runtime artifacts so `scripts/dossier-engineer.mjs` matches `src/`.
10. Regenerate generated skill artifacts through `skill-source-compiler` if source-bundle inputs changed.
11. Run the verification suite and inspect diffs for portability and docs/runtime/test parity.

## Verification Plan

Required commands:

```bash
pnpm --filter @kostysh/unified-dossier-engineer format
pnpm --filter @kostysh/unified-dossier-engineer lint
pnpm --filter @kostysh/unified-dossier-engineer typecheck
pnpm --filter @kostysh/unified-dossier-engineer test
node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint skills/unified-dossier-engineer
node skills/skill-source-compiler/scripts/skill-source-compiler.mjs compile skills/unified-dossier-engineer --out-dir <tmpdir>
node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check <tmpdir>/unified-dossier-engineer
git diff --check -- skills/unified-dossier-engineer
```

Targeted behavioral proof:

- create a `defined` backlog item, run `feature-intake`, and observe `backlog_lifecycle_target: intaken` with unresolved follow-up;
- attempt `dossier-step-close --step feature-intake` and confirm `UDE_BACKLOG_ACTUALIZATION_REQUIRED` with target `intaken`;
- apply a canonical `patch-item` artifact setting `delivery_state: intaken`;
- rerun close with `--backlog-actualization-artifact` and confirm step close succeeds and records the artifact;
- confirm `next-step` for the dossier remains `spec-compact`;
- confirm `queue` excludes or classifies the `intaken` item instead of returning it as ordinary fresh work;
- confirm `status` reports `intaken_count` and does not include `intaken` items in the ordinary `ready_for_next_step_count`;
- confirm `spec-compact` close still requires `specified`, so `intaken` alone is insufficient.

Portability checks:

- search changed skill files for absolute local paths;
- confirm required active references are reachable from `SKILL.md`;
- confirm no docs-only runtime behavior was introduced without source/test/help parity.

## Risks And Side Effects

- `status` output shape changes by adding `intaken_count`; consumers expecting exact status fields may need to tolerate the new field.
- `queue` behavior changes for `intaken` items by design; this may make some existing `defined`-era test fixtures require explicit state updates.
- Adding `intaken` to rank comparison can affect dependency readiness for chains involving mixed `defined`/`intaken`/`specified` items; tests must pin the intended order.
- If lifecycle state literals remain duplicated, future drift is likely. The implementation should minimize duplication or cover every rank/schema literal with tests.
- Historical items that should arguably be `intaken` will remain `defined` until a separate migration/backfill decision.
- Feature-intake close may become stricter for operators because it now requires explicit backlog actualization evidence before truthful close.

## Rollback Plan

- Revert the runtime enum/rank additions, feature-intake lifecycle target, read-model changes, tests, generated `scripts/dossier-engineer.mjs`, and regenerated skill artifacts in one revert.
- Existing `intaken` backlog artifacts created during a failed rollout would no longer validate after rollback; affected repositories must either reapply the forward fix or patch those items to one of the previous valid states with a documented operator decision.
- Do not delete user backlog data automatically during rollback; use explicit `patch-item` artifacts for any state normalization.

## Independent Audit

Audit status: `PASS`

Auditor: external agent `Beauvoir`

Audit criteria:

- Conformance to [issue-20260428-1.md](issue-20260428-1.md).
- Coverage of all source artifacts describing the problem.
- Sufficiency and safety of the proposed implementation.
- Preservation of the mutation boundary: no direct backlog truth mutation by `feature-intake`.
- Docs / runtime / tests parity for any promised command behavior, output field, or lifecycle state.

Audit notes:

- PASS with no must-fix findings.
- Should-fix applied: the source artifact list now calls out `src/vendor/backlog-engineer/schemas/commands.ts` and `src/vendor/backlog-engineer/commands/status.ts` explicitly for `StatusCommandOutputSchema` and status command parity.
- Should-fix applied: status semantics now state that the adjusted `ready_for_next_step_count` excludes `intaken` item keys from ordinary next-intake readiness while `intaken_count` carries the handoff count.

Required corrections:

- none

Final status: `PASS`
