# Implementation Plan

## Language

Русский.

## Plan ID

`implementation-plan-20260429-1`

## Related Issue

`issue-20260429-1` - `docs/issues/issue-20260429-1.md`.

## Source Artifacts

- `docs/issues/issue-20260429-1.md`.
- `AGENTS.md`.
- `skill.yaml`, `fragments/*`, `references/*`, `src/*`, `test/*`, `package.json`.
- `SKILL.md`, generated active surface.
- `references/audit-policy.md`.
- `references/audit-handoff-recipes.md`.
- `references/delivery-workflow-layer.md`.
- `src/vendor/dossier-engineer/commands.ts`.
- `test/docs-contract.test.ts` and runtime command tests that cover `review-artifact`, `dossier-verify`, and `dossier-step-close`.

## Objective

После реализации `unified-dossier-engineer` должен явно вести authoring agent и reviewer через reviewer-owned `review-artifact` accounting, проверять portable repository-declared verification profile для protected side-effect implementation, и направлять repair после повторного blocking review artifact в одном structured dossier risk family на adjacent scenarios перед следующим rerun.

## Assumptions

- Skill сопровождается как code-backed generated source bundle: первичные изменения делаются в `skill.yaml`, `fragments/*`, `references/*`, `src/*`, `test/*`, затем regenerated outputs обновляются через `skill-source-compiler`.
- В runtime уже есть часть provenance vocabulary, включая observable reviewer provenance и same-thread/process-miss diagnostics; implementation должна сначала инвентаризировать существующее поведение и расширять его без дублирования semantics.
- `dossier-verify` не должен hard-code package-manager commands. Portable contract задается явным `--verification-profile <repo-relative-json>` для dossier-scoped verification; команды вроде `pnpm format` остаются examples originating project.
- Historical artifacts без writer provenance остаются compatibility case: unknown provenance не доказывает reviewer ownership, но не приравнивается автоматически к known parent-authored artifact.
- Runtime/container smoke checks считаются обязательными только когда repository-declared profile или implementation plan объявляет их required.

## Scope

Входит в scope:

- active wording в `references/audit-handoff-recipes.md`, `references/audit-policy.md`, `references/delivery-workflow-layer.md` и generated `SKILL.md`;
- runtime eligibility для known parent-authored external review artifacts при `review-artifact` / `dossier-step-close`;
- portable verification profile contract в `dossier-verify`;
- repair rerun guidance для repeated blocking review artifacts в одном declared structured dossier risk family;
- docs-contract, runtime tests, generated output regeneration и package/source version bump в correct scope.

Не входит в scope:

- изменение независимых review/testing/security/implementation-discipline skills;
- backfill historical review artifacts;
- внедрение project-specific command defaults;
- изменение consumer application code;
- попытка runtime доказать launch-mode independence beyond observable provenance.

## Proposed Changes

1. В source bundle обновить audit handoff wording:
   - reviewer execution выполняет `review-artifact` commands для blocking external audit;
   - authoring flow при отсутствии reviewer-written artifact выбирает relaunch reviewer или structured process miss.
2. В audit policy уточнить closure rule:
   - known parent-authored external review artifact is invalid for closure;
   - unknown historical writer provenance получает documented compatibility behavior и clear diagnostics.
3. В runtime проверить и доработать provenance eligibility:
   - `review-artifact` сохраняет observable writer/reviewer provenance, когда runtime может его определить;
   - `dossier-step-close` rejects known parent-authored external review artifacts with clear next action;
   - unknown provenance не считается proof of reviewer ownership и покрывается отдельным test case.
4. В `dossier-verify` добавить repository-declared implementation verification profile:
   - CLI: `dossier-verify --dossier <path> --step implementation --verification-profile <repo-relative-json>`;
   - `--verification-profile` accepts repo-relative JSON and is required for code-bearing protected route or side-effect implementation profile enforcement;
   - `--extra` remains free-form evidence and is not a verification profile contract;
   - profile schema includes `version`, `scope`, `required_categories`, `categories.<name>.command`, `categories.<name>.evidence`, `categories.<name>.required`, and optional `categories.<name>.side_effectful`;
   - категории evidence: formatting, type/static checks, lint/static analysis, focused behavior tests, full relevant test suite, runtime/container smoke when declared;
   - runtime/container smoke category is required only when declared with `required: true`;
   - output artifact должен показывать `verification_profile_source`, `required_categories`, `satisfied_categories`, `missing_categories`, `side_effectful_categories`, and `next_action`;
   - hard-coded command names допускаются только как examples in docs/tests, not universal defaults.
5. В delivery workflow добавить repair rerun guidance:
   - trigger uses only declared structured dossier risk family data;
   - after second blocking review artifact in the same structured dossier risk family, authoring agent expands repair to adjacent scenarios and regression evidence before rerun.
6. Добавить structured risk-family path для FAIL review artifacts:
   - extend FAIL `review-artifact` with repeatable `--risk-family <id>`;
   - allow `--risk-family` only for `--verdict FAIL`;
   - validate each value against implementation stage declared `pre_review_risk_families` or equivalent existing structured field; invalid or undeclared family fails with clear diagnostic;
   - persist `risk_families` in immutable review artifacts and helper-managed stage `review_events`;
   - when a second blocking FAIL in the same declared risk family is recorded for the same implementation scope, helper diagnostics record next action requiring adjacent scenario repair and regression evidence before rerun.
7. Обновить tests:
   - docs-contract tests for reviewer-owned accounting wording and risk-family repair guidance;
   - runtime tests for parent-authored, reviewer-authored, and unknown provenance artifacts;
   - `dossier-verify` tests for repository-declared profile success/failure and missing required evidence;
   - `review-artifact` tests for valid/invalid `--risk-family`, persistence, and second-FAIL same-family next action;
   - help/output snapshot tests if CLI text changes.

## Implementation Steps

1. Инвентаризировать существующие provenance fields, process-miss categories, `review-artifact` output schema, `dossier-step-close` closure selection, and `dossier-verify` artifact schema.
2. Update source bundle docs/references first: audit handoff, audit policy, delivery workflow, and any fragment/manifest entries that render into `SKILL.md`.
3. Add or adjust runtime schema/types for verification profile and review artifact provenance without changing historical artifact compatibility.
4. Implement `dossier-verify --verification-profile <repo-relative-json>` parsing, schema validation, category satisfaction, and artifact output diagnostics.
5. Reject using `--extra` as profile evidence by documenting and testing that `--extra` remains supplementary free-form evidence only.
6. Implement closure eligibility checks for known parent-authored external review artifacts and explicit handling for unknown provenance.
7. Extend FAIL `review-artifact` with repeatable `--risk-family <id>`, validate against declared implementation risk families, and persist the structured field in immutable artifacts and stage review events.
8. Add second-FAIL same-family diagnostics and repair rerun wording that require adjacent scenario evidence before rerun.
9. Add repair rerun wording and docs-contract tests around declared structured dossier risk families.
10. Update command help text only for shipped behavior that actually exists.
11. Bump source/package version in the correct scope, regenerate compiler-owned outputs, and review generated diff.
12. Run focused tests first, then full skill verification.
13. Record implementation log after code/docs are complete and externally audited, if implementation proceeds after this plan.

## Verification Plan

- `skill-source-compiler regenerate` for `skills/unified-dossier-engineer`.
- `skill-source-compiler check` for `skills/unified-dossier-engineer`.
- Instruction-quality audit from `skill-source-compiler` for changed active guidance.
- `pnpm --filter @kostysh/unified-dossier-engineer typecheck`.
- `pnpm --filter @kostysh/unified-dossier-engineer lint`.
- `pnpm --filter @kostysh/unified-dossier-engineer test`.
- Focused runtime tests:
  - known parent-authored external artifact is invalid for closure with clear reason;
  - known reviewer-authored artifact remains eligible through existing gates;
  - unknown historical writer provenance follows documented compatibility behavior;
  - `dossier-verify --verification-profile <repo-relative-json>` rejects malformed or non-repo-relative profile paths;
  - `dossier-verify` fails when repository-declared protected side-effect profile evidence is missing;
  - `dossier-verify` passes when all required categories are present;
  - `dossier-verify` output includes `verification_profile_source`, `required_categories`, `satisfied_categories`, `missing_categories`, `side_effectful_categories`, and `next_action`;
  - FAIL `review-artifact --risk-family <id>` rejects undeclared families and PASS `review-artifact --risk-family <id>` is rejected;
  - valid FAIL `review-artifact --risk-family <id>` persists `risk_families` in immutable artifact and stage `review_events`;
  - repeated blocking artifacts in one declared structured dossier risk family require adjacent scenario evidence before rerun.
- Portability check: no absolute local paths and no project-specific commands as universal defaults.
- External independent audit of the implementation package before final close.

## Risks and Side Effects

- Stricter closure eligibility can block workflows that previously closed with parent-authored artifacts. Mitigation: apply strict rejection only to known parent-authored artifacts, document unknown provenance compatibility, and provide clear next action.
- Verification profile can become package-manager-specific. Mitigation: validate categories and repository-declared commands, not hard-coded command names.
- Runtime/container checks can be expensive or side-effectful. Mitigation: require them only when declared by repository profile or plan.
- Repair guidance can expand implementation scope. Mitigation: trigger only after repeated blocking artifacts in the same declared structured dossier risk family and limit expansion to adjacent scenarios for that family.
- Docs/runtime drift can occur in a generated skill. Mitigation: source-first edits, regeneration, docs-contract tests, runtime tests, and compiler check.

## Rollback Plan

Revert the implementation commit that changes `skill.yaml`, `fragments/*`, `references/*`, `src/*`, `test/*`, `package.json`, generated `SKILL.md`, `docs/compile-report.md`, and built `scripts/*`. If rollback happens after runtime artifact schema changes shipped, keep a compatibility note or migration fixture in the revert commit explaining how previously generated artifacts are treated.

## Independent Audit

Audit status: `PASS`

Auditor: Curie, external agent audit, `gpt-5.5` medium.

Audit criteria:
- Conformance to the related issue.
- Coverage of all source artifacts describing the problem.
- Sufficiency and safety of the proposed implementation.

Audit notes: Проверены related issue, plan, оба `AGENTS.md`, `SKILL.md`, active references, `src/vendor/dossier-engineer/commands.ts`, `test/docs-contract.test.ts` и root implementation plan template. План задает self-contained `repository-declared verification profile` через `dossier-verify --verification-profile <repo-relative-json>`, schema, trigger, artifact fields, and explicitly separates `--extra` from the profile contract. План также задает structured data path для same risk family через `review-artifact --risk-family`, validation against declared implementation risk families, persistence in immutable artifacts/stage `review_events`, and second-FAIL diagnostics.

Required corrections: Предыдущий `FAIL` требовал конкретизировать verification profile contract и structured risk-family data path. Исправлено, повторный аудит дал `PASS`.

Final status: `PASS`
