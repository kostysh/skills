# Implementation Plan

## Language

Русский.

## Plan ID

`implementation-plan-20260501-3`

## Related Issue

`issue-20260501-3` — `skills/dossier-engineer/docs/issues/issue-20260501-3.md`

## Source Artifacts

- `skills/dossier-engineer/docs/issues/issue-20260501-3.md`
- `skills/dossier-engineer/docs/dossier-engineer-problem-analysis-and-proposals.ru.md`
- `skills/dossier-engineer/references/capability-governance.md`
- `skills/dossier-engineer/references/review-and-closure.md`
- `skills/dossier-engineer/references/workflow.md`
- `skills/dossier-engineer/references/runtime-commands.md`
- `skills/dossier-engineer/src/app.ts`
- `skills/dossier-engineer/src/domain.ts`
- `skills/dossier-engineer/src/cli/run-cli.ts`
- `skills/dossier-engineer/test/cli.test.ts`

## Objective

Сделать Phase 3 runtime-observable: user-visible capability work cannot close implementation using only mock/headless/substrate evidence; `Plan Slice` semantics require a specific production path; live-app evidence has minimal structured fields; testable anti-claims become structural negative/falsifier criteria.

Anti-claim: этот план не добавляет новый evidence artifact family и не запрещает mock/headless/unit evidence as supporting verification.

## Assumptions

- Phase 1 already introduced section presence checks for `Integration Path` and AC/evidence matrix.
- Phase 3 upgrades semantics and closure evidence requirements rather than duplicating Phase 1 section-presence work.
- Capability work is treated as user-visible/operator-visible unless `Plan Slice` records explicit `non-user-visible` rationale.
- Preferred target is new acceptance kinds `negative` and `falsifier`; fallback storage is allowed only if machine-checkable.
- Runtime is not expected to infer testability from anti-claim prose. The agent must classify testable anti-claims explicitly in the body or through the acceptance matrix; stage close verifies negative/falsifier criteria for claims marked or represented as testable.

## Scope

In scope:

- `negative` and `falsifier` acceptance kinds or a machine-checkable equivalent.
- Live-app evidence metadata on existing verification artifacts.
- Kebab-case CLI flags and snake_case stored frontmatter fields.
- Stage/closure blockers for missing production path, weak matrix semantics, missing live-app evidence, and unconverted testable anti-claims.
- Explicit anti-claim testability classification through body/acceptance matrix, without semantic inference from prose.
- Capability check distinction between support evidence and live-app behavioral evidence.
- Tests and active guidance updates.

Out of scope:

- New verification artifact family.
- Ban on supporting mock/headless/unit tests.
- Phase 4 review freshness policy.
- Complex capability taxonomy beyond explicit non-user-visible rationale.

## Proposed Changes

- Extend domain validation for acceptance kinds with `negative` and `falsifier`.
- Update `work acceptance add` parsing/validation and tests.
- Add live-app evidence fields to `verify record`: `--evidence-class live-app`, `--entrypoint`, `--runtime-path`, stored as `evidence_class`, `entrypoint`, `runtime_path`.
- Extend verification artifact body guidance for before/action/after/continuity/falsifiers.
- Add plan-slice semantic checks for specific production entrypoint/runtime path and AC/evidence/falsifier matrix.
- Enforce the full `Integration path` field contract: actor entrypoint, runtime path, production components touched, UI/API/agent path, state/effect path, continuity path, what proves integration, and what proves substrate-only.
- Add Stage Quality Rubric checks for files/interfaces/components touched and change-proposal trigger before `plan-slice` close.
- Add implementation closure checks: user-visible capability requires passing live-app behavioral-demo evidence exercising the named production path.
- Add guidance and checks stating that runtime does not infer anti-claim testability from prose; agents must mark or represent testable anti-claims explicitly.
- Allow explicit non-user-visible rationale to use appropriate non-live evidence.
- Update active references and command help.

## Implementation Steps

1. Add failing tests for `negative` / `falsifier` acceptance kinds and invalid fallback/prose-only cases.
2. Add tests for `verify record --evidence-class live-app --entrypoint --runtime-path` and stored snake_case fields.
3. Add tests proving mock/headless evidence can be recorded but cannot close user-visible capability alone.
4. Implement domain and command parsing changes.
5. Implement plan-slice semantic checks and explicit non-user-visible rationale handling.
6. Implement full Integration Path field checks and Stage Quality Rubric checks for files/interfaces/components and change-proposal triggers.
7. Implement explicit anti-claim testability classification checks through body/acceptance matrix representation, without semantic prose inference.
8. Implement implementation closure/live-app evidence gates.
9. Update active guidance and examples without adding new artifact families.
10. Rebuild runtime and run full checks.

## Verification Plan

- `cd skills/dossier-engineer && pnpm run build`
- `cd skills/dossier-engineer && pnpm test`
- `cd skills/dossier-engineer && pnpm run lint`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/dossier-engineer`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/dossier-engineer`
- Runtime acceptance tests must cover:
  - `plan-slice close` blocks missing/specificity-poor integration path for user-visible capability;
  - `plan-slice close` blocks if any required Integration Path field is absent: production components touched, UI/API/agent path, state/effect path, continuity path, integration proof, or substrate-only falsifier;
  - `plan-slice close` blocks absent AC/evidence/falsifier matrix;
  - `plan-slice close` blocks when files/interfaces/components touched are absent without explicit non-code rationale;
  - `plan-slice close` blocks when change-proposal trigger guidance is absent;
  - `spec-compact close` blocks testable anti-claims not represented as `negative` or `falsifier`;
  - runtime does not attempt semantic inference from anti-claim prose; only anti-claims explicitly marked or represented as testable require linked negative/falsifier criteria;
  - `work acceptance add --kind negative` and `--kind falsifier` are accepted and machine-readable;
  - live-app evidence requires structured `entrypoint` and `runtime_path`;
  - CLI flags are kebab-case and stored frontmatter is snake_case;
  - mock/headless evidence supports verification but cannot close user-visible capability alone;
  - explicit non-user-visible rationale permits appropriate non-live closure evidence;
  - `capability check` distinguishes support evidence from live-app behavioral evidence.
- Perform `Audit instruction quality` workflow stage from `skill-source-compiler` after active guidance changes.

## Risks and Side Effects

- Live-app requirement can make UI/editor work harder to close. Mitigation: applies to closure evidence, not every supporting test.
- User-visible default can be too strict for internal capability work. Mitigation: explicit `non-user-visible` rationale.
- New acceptance kinds may require schema/test updates. Mitigation: keep them small and compatible with existing acceptance arrays.
- Fallback falsifier storage could weaken checks. Mitigation: fallback allowed only if machine-checkable and explicitly linked.

## Rollback Plan

- Revert acceptance-kind expansion and verification metadata changes.
- Remove new closure gates if they block unrelated work unexpectedly.
- Keep issue/plan artifacts for later redesign unless operator asks to remove them.
- If partial rollback is needed, keep command parsing backward-compatible for already recorded evidence.

## Independent Audit

Audit status: `PASS`

Auditor: spawned agents `Huygens`, `Epicurus`

Audit criteria:
- Conformance to the related issue.
- Coverage of all source artifacts describing the problem.
- Sufficiency and safety of the proposed implementation.

Audit notes:

- Initial audit found missing full `Integration path` field contract, files/interfaces/components checks, change-proposal trigger checks, and explicit instruction-quality audit verification.
- Corrections added those items to proposed changes, implementation steps, and verification.
- Re-audit confirmed the plan conforms to the issue and covers production integration path, AC/evidence/falsifier matrix, live-app behavioral evidence, testable anti-claims as `negative`/`falsifier`, live-app structured fields, kebab-case CLI flags, snake_case stored fields, user-visible default, and mock/headless evidence as supporting-only for user-visible closure.
- Final re-audit confirmed runtime is not expected to infer anti-claim testability from prose; agents must classify testable anti-claims explicitly in body or acceptance matrix, and stage close checks only claims marked or represented as testable.

Required corrections: None after re-audit.

Final status: `PASS`
