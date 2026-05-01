# Implementation Log

## Log ID

`implementation-log-20260502-2`

## Related Issue

`issue-20260501-1` — `docs/issues/issue-20260501-1.md`

## Related Plan

`implementation-plan-20260501-1` — `docs/issues/implementation-plan-20260501-1.md`

## Operator Request

Оператор попросил реализовать Phase 1 после завершения Phase 2: честный `queue`, содержательные `Spec Compact`/`Plan Slice`, stage-specific concept review gate и терминальную lifecycle-модель.

## Summary

Реализована Phase 1 runtime-семантика: `queue` теперь показывает next actionable work без ложного `Ready work items`, capability work получает и обязан заполнить `Spec Compact`/`Plan Slice`, `plan-slice` требует свежий PASS `concept-conformance-reviewer` review для этой стадии, а implementation close остаётся non-terminal до успешной hygiene.

## Changes Made

- `skills/dossier-engineer/src/app.ts` — добавлен capability work body scaffold с `Spec Compact` и `Plan Slice`, материализованы body gates для этих секций, добавлен `review required --stage plan-slice`, stage-specific review freshness, truthful queue output, terminal handoff detection и `next` без повторного hygiene после успешной hygiene.
- `skills/dossier-engineer/test/cli.test.ts` — добавлены runtime acceptance tests для queue output, body gates, plan-slice concept review, backward-compatible terminal detection и hygiene-once lifecycle.
- `skills/dossier-engineer/references/runtime-commands.md` — обновлён command contract для `queue`, `next`, `stage ready/close` и `review required --stage`.
- `skills/dossier-engineer/references/workflow.md` — обновлены stage gates для `spec-compact`, `plan-slice` и terminal lifecycle.
- `skills/dossier-engineer/references/body-completion.md` — добавлены minimum body requirements для capability `Spec Compact` и `Plan Slice`.
- `skills/dossier-engineer/references/review-and-closure.md` — уточнены plan-slice review freshness и terminal hygiene semantics.
- `skills/dossier-engineer/skill.yaml` — обновлена версия source bundle и добавлен этот implementation log в supporting surface.
- `skills/dossier-engineer/scripts/dossier-engineer.mjs` и `.map` — пересобраны runtime artifacts.
- `skills/dossier-engineer/SKILL.md` — regenerated from source bundle.

## Decisions

- `queue` intentionally reports `next_action`, `stage`, and `implementation_ready`; early-stage work can be actionable without being implementation-ready.
- `implementation_ready=true` is emitted only for implementation-stage actions, not for intake/spec/plan or post-close hygiene.
- Capability `Spec Compact` and `Plan Slice` body sections are validated structurally for project-specific content, but runtime does not attempt deep semantic language detection.
- `plan-slice` concept review is stage-specific: a PASS implementation review does not satisfy the plan-slice gate.
- `stage close --stage implementation` sets `lifecycle=implemented`; successful `hygiene run --stage implementation` sets the terminal closed/handoff-complete state.
- Older records with `lifecycle=implemented` and closed/passed implementation hygiene are treated as terminal handoff-complete without rewriting them.

## Verification Performed

- `cd skills/dossier-engineer && pnpm test` — PASS after Phase 1 runtime/test changes.
- `cd skills/dossier-engineer && pnpm run typecheck` — PASS after Phase 1 runtime/test changes.
- `cd skills/dossier-engineer && pnpm run lint` — PASS.
- `cd skills/dossier-engineer && pnpm test` — PASS after documentation/source updates.
- `cd skills/dossier-engineer && pnpm run typecheck` — PASS after documentation/source updates.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/dossier-engineer` — PASS.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/dossier-engineer` — PASS.
- Instruction quality audit from `skill-source-compiler` — PASS: active guidance now names observable runtime outcomes, stage-specific validation gates, terminal lifecycle semantics, allowed side effects, validation commands, and avoids adding new mandatory artifact families.

## Deviations From Plan

- Runtime enforces the plan-slice concept gate at readiness as well as close. This keeps the work item from entering `ready_for_close` when the close gate is already known to fail.
- Body gates use lightweight structural checks for required sections and key plan-slice terms. They do not infer operator language or semantic sufficiency beyond scaffold/placeholder/material-content detection.

## Side Effects

- Existing capability work created by the runtime now contains additional body headings that must be completed before `spec-compact` and `plan-slice` readiness/closure.
- Capability `plan-slice` closure now requires an explicit stage-specific concept review.
- `queue` no longer treats `lifecycle=implemented` as dependency-complete until hygiene has passed.

## Follow-up

- Phase 3 should strengthen the live-app evidence and negative/falsifier semantics that the new `Plan Slice` sections expose.
- Phase 4 should refine material scope hashing so review freshness is precise without creating editorial churn.

## Final Status

PASS
