# Implementation Log

## Log ID

`implementation-log-20260502-4`

## Related Issue

`issue-20260501-4` — `docs/issues/issue-20260501-4.md`

## Related Plan

`implementation-plan-20260501-4` — `docs/issues/implementation-plan-20260501-4.md`

## Operator Request

Оператор попросил реализовать Phase 4: review freshness / material scope hash после Phase 3.

## Summary

Реализована Phase 4 runtime-семантика: review freshness теперь считается от нормализованного material scope, implementation reviews учитывают актуальный live-app evidence path, final implementation closure требует fresh PASS bundle по всем required review classes, а consolidated review закреплён как timing/scope policy без нового review class.

## Changes Made

- `skills/dossier-engineer/src/app.ts` — добавлены normalized material section hashing, current material work/review hash helpers, implementation review freshness against live-app evidence path, and final required review class bundle checks.
- `skills/dossier-engineer/test/cli.test.ts` — добавлены acceptance tests для normalized material sections, editorial-note non-staling, material plan change staling, live-app evidence path staling implementation reviews, and final fresh concept/spec review bundle.
- `skills/dossier-engineer/references/*` — обновлены active contracts for review freshness, consolidated review policy, material re-review triggers, runtime command semantics, artifact hash semantics, and plan-slice concept review timing.
- `skills/dossier-engineer/docs/README.md` — обновлена навигация по implementation logs and plan status.
- `skills/dossier-engineer/skill.yaml` — обновлена source version.
- `skills/dossier-engineer/scripts/dossier-engineer.mjs` и `.map` — rebuilt runtime artifacts.
- `skills/dossier-engineer/SKILL.md` — regenerated from source bundle.

## Decisions

- Consolidated review is not a new review class. Runtime keeps using existing required review classes and computes freshness for the final material scope.
- Plan-slice reviews use normalized work/source/capability material scope. Implementation reviews additionally include passing live-app behavioral-demo evidence metadata when applicable, so early reviews before final live-app evidence become stale.
- Material body hashing covers required `Spec Compact` and `Plan Slice` subsections instead of hashing the whole Markdown body blindly. Editorial sections outside material subsections do not stale reviews.
- No new mandatory artifact family was added; review and verification artifacts keep carrying `material_scope_hash`.

## Verification Performed

- `cd skills/dossier-engineer && pnpm run format` — PASS.
- `cd skills/dossier-engineer && pnpm test` — PASS, 16 runtime acceptance tests.
- `cd skills/dossier-engineer && pnpm run lint` — PASS, including Biome, ESLint, and TypeScript typecheck.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/dossier-engineer` — PASS.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/dossier-engineer` — PASS.
- Instruction quality audit from `skill-source-compiler` — PASS: active guidance now distinguishes consolidated review timing from review classes, defines material freshness inputs, states note-only micro-fix limits, and keeps runtime/docs/test parity.

## Deviations From Plan

- Note-only micro-fix visibility remains a guidance-level contract backed by final freshness gates; no new note artifact or CLI command was added.
- Trust/security-specific review classes remain driven by existing risk/review policy. Phase 4 ensures any required class must be fresh, but does not add new risk classification logic.

## Side Effects

- Reviews recorded before final live-app evidence for user-visible capability work no longer satisfy implementation closure.
- Purely editorial notes outside required material subsections no longer stale plan-slice review freshness.
- Material changes in `Spec Compact`, `Plan Slice`, acceptance, falsifiers, demo, integration path, or source/capability scope stale existing reviews.

## Follow-up

- Future work can add more granular risk-policy triggers for `code-reviewer`, `security-reviewer`, `contract-reviewer`, and `release-reviewer` without changing the Phase 4 freshness contract.

## Final Status

PASS
