# Implementation Log

## Log ID

`implementation-log-20260502-3`

## Related Issue

`issue-20260501-3` — `docs/issues/issue-20260501-3.md`

## Related Plan

`implementation-plan-20260501-3` — `docs/issues/implementation-plan-20260501-3.md`

## Operator Request

Оператор попросил после коммита Phase 1 приступить к Phase 3: live-app evidence, integration correctness и negative/falsifier acceptance criteria.

## Summary

Реализована Phase 3 runtime-семантика: capability work по умолчанию считается user-visible/operator-visible, `plan-slice` проверяет production integration path и AC/evidence/falsifier matrix, `negative`/`falsifier` acceptance kinds поддерживаются структурно, а implementation closure требует fresh `live-app` behavioral-demo evidence с `entrypoint` и `runtime_path`.

## Changes Made

- `skills/dossier-engineer/src/domain.ts` — добавлены acceptance kinds `negative` и `falsifier`.
- `skills/dossier-engineer/src/app.ts` — добавлены full Integration Path field checks, AC/evidence/falsifier matrix checks, marked testable anti-claim gate, live-app verification freshness, live-app closure blocker, `verify required` live-app guidance, and `verify record --entrypoint --runtime-path` storage.
- `skills/dossier-engineer/test/cli.test.ts` — добавлены runtime acceptance tests для negative/falsifier criteria, weak plan-slice semantics, live-app field requirements, mock/headless supporting evidence, and live-app closure evidence.
- `skills/dossier-engineer/references/*` — обновлены active contracts for workflow, runtime commands, review/closure, capability governance, artifact schema, and body completion.
- `skills/dossier-engineer/skill.yaml` — обновлена версия source bundle и добавлен этот implementation log.
- `skills/dossier-engineer/scripts/dossier-engineer.mjs` и `.map` — пересобраны runtime artifacts.
- `skills/dossier-engineer/SKILL.md` — regenerated from source bundle.

## Decisions

- Runtime does not infer anti-claim testability from arbitrary prose. It enforces negative/falsifier criteria only when `Spec Compact` explicitly marks a testable anti-claim.
- Capability work is user-visible/operator-visible by default. An explicit `non-user-visible` rationale in `Plan Slice` exempts it from live-app closure evidence.
- `verify run` remains supporting evidence. Live-app evidence is recorded explicitly via `verify record --evidence-class live-app --entrypoint --runtime-path`.
- No new artifact family was added; existing work-item and verification artifacts carry the additional contract.

## Verification Performed

- `cd skills/dossier-engineer && pnpm test` — PASS after runtime/test changes.
- `cd skills/dossier-engineer && pnpm run typecheck` — PASS after runtime/test changes.
- `cd skills/dossier-engineer && pnpm run lint` — PASS.
- `cd skills/dossier-engineer && pnpm test` — PASS after documentation/source updates.
- `cd skills/dossier-engineer && pnpm run typecheck` — PASS after documentation/source updates.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/dossier-engineer` — PASS.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/dossier-engineer` — PASS.
- Instruction quality audit from `skill-source-compiler` — PASS: active guidance now states the observable live-app closure requirement, structural fields, allowed supporting evidence, fallback behavior for non-user-visible work, validation commands, and no new mandatory artifact families.

## Deviations From Plan

- The live-app path comparison is conservative string normalization against the named `Plan Slice` runtime path. It does not attempt deep semantic path inference.
- `verify record --evidence-class live-app` missing structured fields is treated as command usage failure rather than a blocked verification verdict.

## Side Effects

- User-visible capability work with only mock/headless/manual behavioral evidence now fails implementation readiness/closure.
- Existing capability work bodies may need richer `Plan Slice` content before plan-slice readiness.
- Existing tests or workflows using `behavioral-demo` without live-app metadata must either record explicit non-user-visible rationale or add live-app evidence.

## Follow-up

- Phase 4 should refine material scope hashing/review freshness using the richer plan/evidence/falsifier surface.

## Final Status

PASS
