# Implementation Plan

## Language

Русский.

## Plan ID

`implementation-plan-20260501-1`

## Related Issue

`issue-20260501-1` — `skills/dossier-engineer/docs/issues/issue-20260501-1.md`

## Source Artifacts

- `skills/dossier-engineer/docs/issues/issue-20260501-1.md`
- `skills/dossier-engineer/docs/dossier-engineer-problem-analysis-and-proposals.ru.md`
- `skills/dossier-engineer/skill.yaml`
- `skills/dossier-engineer/fragments/*`
- `skills/dossier-engineer/references/workflow.md`
- `skills/dossier-engineer/references/body-completion.md`
- `skills/dossier-engineer/references/runtime-commands.md`
- `skills/dossier-engineer/references/review-and-closure.md`
- `skills/dossier-engineer/src/app.ts`
- `skills/dossier-engineer/src/domain.ts`
- `skills/dossier-engineer/src/cli/run-cli.ts`
- `skills/dossier-engineer/test/cli.test.ts`

## Objective

Сделать Phase 1 observable в runtime: `queue` больше не выдаёт implementation readiness там, где есть только protocol next action; capability work не закрывает `spec-compact` / `plan-slice` без содержательных body-блоков; `plan-slice close` требует current PASS concept review; implementation close переводит work item только в `implemented`, а terminal handoff возникает после successful hygiene.

Anti-claim: этот план не реализует Phase 2 concurrency, Phase 3 live-app evidence semantics или Phase 4 review freshness policy.

## Assumptions

- Existing generated skill maintenance flow remains source-first: update `skill.yaml`, `fragments/*`, `references/*`, `src/*`, `test/*`, then regenerate/build generated outputs.
- `Spec Compact` and `Plan Slice` live in the existing work item body; no new mandatory artifact family is introduced.
- Phase 1 checks can be structural and conservative: section presence, non-placeholder content, required subsection coverage, and explicit plan path. Semantic proof of live-app evidence remains Phase 3.
- Concept-conformance freshness beyond current PASS for `plan-slice` is deferred to Phase 4.

## Scope

In scope:

- Runtime `queue` output wording/grouping and `implementation_ready` signal.
- Work item scaffold additions for `Spec Compact` and `Plan Slice`.
- Stage close blockers for missing/placeholder/template-only `Spec Compact` and `Plan Slice`.
- Body Completion and operator-language requirement for those sections.
- `plan-slice close` blocker for missing current PASS `concept-conformance-reviewer` review.
- Stage-aware `review required` or equivalent `next` / blocker command guidance for `plan-slice`.
- Terminal lifecycle model: implementation close -> `lifecycle=implemented`; hygiene pass -> terminal closed/handoff-complete.
- Lifecycle enum/schema and backwards-compatible parsing for terminal closed/handoff-complete state if it is not already represented in the domain model.
- `next` behavior for already-hygiened closed work.
- Runtime tests and active guidance/regeneration.

Out of scope:

- Write locks and atomic writes.
- Live-app evidence closure semantics.
- Consolidated review freshness / material scope hash semantics beyond the plan-slice gate.
- New artifact families.

## Proposed Changes

- Update active workflow/runtime command guidance to state that `queue` shows actionable next work, not implementation readiness.
- Extend work item body scaffold in `src/app.ts` to include `Spec Compact` and `Plan Slice` sections for capability work.
- Add helper checks for material section presence and non-placeholder content.
- Extend `stageGateFindings` for `spec-compact` and `plan-slice`.
- Add explicit `plan-slice` gates for user-visible `Integration path` with production entrypoint/runtime path, not only subsection headings.
- Add explicit `plan-slice` gate for the AC-to-evidence matrix.
- Add active Stage Quality Rubric guidance and, where useful, blocker text for `spec-compact` and `plan-slice`.
- Update review requirement logic so `plan-slice` can report required concept-conformance review.
- Update `stage close` implementation transition and hygiene/next logic to match the selected terminal model.
- Update lifecycle enum/schema and backwards-compatible parsing if `closed` or handoff-complete terminal state is not already represented in the domain model.
- Update tests in `test/cli.test.ts`.
- Regenerate `SKILL.md` and rebuild `scripts/dossier-engineer.mjs`.

## Implementation Steps

1. Add focused failing tests for queue wording, `implementation_ready`, scaffolded work item sections, section blockers, plan-slice concept gate, terminal lifecycle, and `next` hygiene behavior.
2. Implement work item scaffold updates and section-content validators.
3. Update `stageGateFindings` and command blockers for `spec-compact`, `plan-slice`, and implementation close, including explicit checks for `Integration path`, production entrypoint/runtime path, and AC-to-evidence matrix.
4. Update `queue`, `next`, and `review required` output to expose stage/action/readiness and plan-slice review guidance.
5. Update lifecycle enum/schema and backwards-compatible parsing for terminal closed/handoff-complete state if needed.
6. Update active source-bundle wording in `skill.yaml`, fragments, and references, including the short Stage Quality Rubric for `spec-compact` and `plan-slice`.
7. Rebuild runtime and regenerate generated skill files.
8. Run tests, lint, compiler checks, and instruction-quality audit.

## Verification Plan

- `cd skills/dossier-engineer && pnpm run build`
- `cd skills/dossier-engineer && pnpm test`
- `cd skills/dossier-engineer && pnpm run lint`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/dossier-engineer`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/dossier-engineer`
- Runtime acceptance tests must cover:
  - `queue` does not label `feature-intake:not_started` as implementation-ready.
  - `stage close --stage spec-compact` blocks missing/placeholder/heading-only `Spec Compact`.
  - `stage close --stage plan-slice` blocks missing/placeholder/heading-only `Plan Slice`.
  - Body content language rule is represented in active guidance.
  - `stage close --stage plan-slice` blocks if `Integration path` is missing for user-visible capability.
  - `stage close --stage plan-slice` blocks if `Integration path` lacks production entrypoint/runtime path and only names internal API/substrate.
  - `stage close --stage plan-slice` blocks if AC-to-evidence matrix is absent.
  - Active guidance/blocker text includes the Stage Quality Rubric for `spec-compact` and `plan-slice`.
  - `plan-slice close` blocks without current PASS `concept-conformance-reviewer`.
  - `review required --stage plan-slice` or equivalent blocker output reports the required review.
  - implementation close sets `lifecycle=implemented`.
  - successful hygiene reaches terminal closed/handoff-complete.
  - Existing work items with `lifecycle=implemented` and passed hygiene are reported as terminal/handoff-complete after the new logic, without corrupting older records.
  - `next` reports hygiene once after implementation close and not after successful hygiene.
- Perform instruction-quality audit for active guidance changes.

## Risks and Side Effects

- Existing work items may fail new stage gates. Mitigation: blockers must explain the missing section and recovery path.
- Structural content checks can encourage boilerplate. Mitigation: require project-specific bullets/rows and concrete implementation surface or explicit non-code rationale.
- Queue output changes may break snapshots or operator habits. Mitigation: update tests/help and keep next-action guidance explicit.
- Concept review gate can add earlier friction. Mitigation: Phase 4 prevents repeated concept review when scope remains fresh.

## Rollback Plan

- Revert runtime changes in `src/*`, tests, and built `scripts/*`.
- Revert source-bundle guidance and regenerate `SKILL.md`.
- Keep issue and plan artifacts as historical context unless the operator explicitly requests deletion.
- If partial rollout is needed, keep queue wording changes only if tests prove backward-compatible command behavior.

## Independent Audit

Audit status: `PASS`

Auditor: spawned agents `Planck`, `Euler`

Audit criteria:
- Conformance to the related issue.
- Coverage of all source artifacts describing the problem.
- Sufficiency and safety of the proposed implementation.

Audit notes:

- Initial audit found missing explicit coverage for `Integration path`, production entrypoint/runtime path, AC-to-evidence matrix, and Stage Quality Rubric.
- Corrections added explicit runtime gates, proposed changes, and verification checks for those items.
- Re-audit confirmed the plan conforms to the issue, avoids substrate-only/prose-only work, keeps `Spec Compact` and `Plan Slice` as body blocks in existing work items, and includes runtime tests, generated `SKILL.md`, rebuilt runtime, and instruction-quality audit.
- Final re-audit confirmed lifecycle enum/schema and backwards-compatible parsing coverage: older `lifecycle=implemented` plus passed hygiene records are reported terminal/handoff-complete without record corruption.

Required corrections: None after re-audit.

Final status: `PASS`
