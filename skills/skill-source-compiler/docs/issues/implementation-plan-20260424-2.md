# Implementation Plan

## Language

Русский.

## Plan ID

`implementation-plan-20260424-2`

## Related Issue

`issue-20260424-2` - [issue-20260424-2.md](issue-20260424-2.md)

## Source Artifacts

- [issue-20260424-2.md](issue-20260424-2.md) - audited problem statement and acceptance boundaries.
- `skills/skill-source-compiler/src/schema.ts` - source language shape where `references` and active reference id lists are optional/default empty.
- `skills/skill-source-compiler/src/renderer.ts` - generated `SKILL.md` rendering, including conditional `renderReferenceList(...)` behavior.
- `skills/skill-source-compiler/src/check.ts` - current structural check that still requires `## Required active references` and emits `no-reference-links`.
- `skills/skill-source-compiler/src/compiler.ts` - render/regenerate/check support through `renderSourceBundle(...)`.
- `skills/skill-source-compiler/src/source-loader.ts` - manifest and referenced-file loading behavior.
- `skills/skill-source-compiler/src/lint.ts` - manifest validation behavior for required/optional references and declared files.
- `skills/skill-source-compiler/test/check.test.ts` - current source-bundle and compiled-skill check coverage.
- `skills/skill-source-compiler/test/compile.test.ts` - render/regenerate behavior coverage.
- `skills/skill-source-compiler/test/lint.test.ts` - source-bundle lint behavior coverage.
- `skills/skill-source-compiler/test/cli.test.ts` - built CLI contract coverage that may need no-reference regression fixtures.
- `skills/skill-source-compiler/skill.yaml` - active source-of-truth for compiler guidance and command/reference metadata.
- `skills/skill-source-compiler/references/source-language.md` - active source language reference that should state references are optional.
- `skills/skill-source-compiler/references/output-structure.md` - active output layout reference that should mark reference sections as conditional.
- `skills/skill-source-compiler/references/maintenance.md` - active maintenance guidance that should avoid placeholder reference recommendations.
- `skills/skill-source-compiler/scripts/skill-source-compiler.mjs` - built runtime artifact that must match source changes if runtime changes are implemented.

## Objective

Make `skill-source-compiler` support simple source bundles that do not need `references/*` files:

- source bundles with no active references should render `SKILL.md` without `## Required active references` and `## Optional references`;
- `check` should pass for valid source bundles and compiled skills with no reference links;
- declared or existing reference links should still be validated strictly;
- docs, tests, runtime, and generated compiler skill output should describe the same conditional reference-section contract.

## Assumptions

- `references` are optional by design because the source schema already defaults them to `[]` and the renderer already omits empty reference sections.
- The fix should not introduce placeholder reference files for simple skills.
- The fix should not weaken validation for bundles that do declare required or optional references.
- Source-bundle check can use manifest data to know exactly which reference sections are expected.
- Compiled-skill check without `skill.yaml` cannot know the original manifest; it should validate reference links that exist, but should not require at least one reference link.
- This is a runtime/docs/test change for `skill-source-compiler`, so `package.json` version and `skill.yaml` `skill.source-version` should be bumped if shipped behavior changes.

## Scope

In scope:

- Update structural check behavior for source bundles and compiled skills with no references.
- Preserve existing validation for declared reference ids, generated reference links, and missing linked files.
- Add regression coverage for no-reference source bundle rendering/regeneration/checking.
- Add regression coverage for compiled skills without `skill.yaml` and without `references/*`.
- Add regression coverage that declared references are still enforced.
- Update active documentation and generated compiler output to describe conditional reference sections.
- Rebuild `scripts/skill-source-compiler.mjs` if source runtime changes are made.
- Update `docs/README.md` navigation for this plan.

Out of scope:

- Migrating target skills after the compiler fix.
- Changing source language semantics for assets, copies, supporting docs, commands, gotchas, or policies.
- Automatically moving large `SKILL.md` content into references.
- Relaxing portability checks for files that are declared or linked.
- Reworking generated section order beyond making reference sections conditional.

## Proposed Changes

### Runtime Check Behavior

- Refactor `checkSkillMarkdown(...)` so reference requirements are explicit inputs instead of hardcoded global assumptions.
- Split required headings into:
  - unconditional generated headings;
  - conditional `## Required active references`;
  - conditional `## Optional references`.
- For source-bundle check:
  - derive expected required and optional reference targets from `rendered.loaded.source.surfaces.active`;
  - require `## Required active references` only when required reference ids are present;
  - require `## Optional references` only when optional reference ids are present;
  - require links to declared reference targets when manifest references are active;
  - continue reporting missing linked references if a generated link points to a file outside the emitted file set.
- For compiled-skill check without `skill.yaml`:
  - remove the unconditional `no-reference-links` failure;
  - keep validation for any `references/...` links that are present in `SKILL.md`;
  - keep frontmatter, portability, heading, and absolute-path checks unchanged.
- Remove or narrow diagnostic `no-reference-links`:
  - do not emit it for no-reference skills;
  - if retained, emit it only when source-bundle manifest expects reference links but rendered markdown lacks them.

### Rendering And Source Language

- Keep renderer behavior unchanged if it already omits empty reference sections.
- Confirm `renderReferenceList(...)` still emits required/optional sections when reference id lists are non-empty.
- Do not add placeholder files or artificial references in generated output.

### Tests

- Add a minimal no-reference source bundle fixture or construct one in tests with:
  - `references: []`;
  - `surfaces.active.requiredReferences: []`;
  - `surfaces.active.optionalReferences: []`;
  - one workflow stage and portability section.
- Add explicit lint coverage for the no-reference bundle in `lint.test.ts` or built CLI lint coverage.
- Test `renderSourceBundle(...)` or `regenerateSourceBundle(...)` for the no-reference bundle:
  - generated `SKILL.md` has no `## Required active references`;
  - generated `SKILL.md` has no `## Optional references`;
  - generated `SKILL.md` still has required base sections.
- Test `checkCompiledSkill(...)` on a no-reference source bundle after regeneration.
- Test `checkCompiledSkill(...)` on a compiled skill folder without `skill.yaml` and without `references/*`.
- Test declared references remain strict:
  - a source bundle with a declared required reference still renders/checks with `## Required active references`;
  - a compiled folder with a `references/...` link to a missing file still fails with `missing-linked-reference`.
- Keep existing source-bundle drift tests passing.

### Documentation And Generated Surface

- Update `references/source-language.md`:
  - state that references are optional;
  - recommend references only when progressive disclosure, reusable detailed guidance, templates, or large content justify them.
- Update `references/output-structure.md`:
  - mark Required active references, Optional references, and Assets as conditional sections.
- Update `references/maintenance.md`:
  - explicitly say simple skills should not create placeholder references just to satisfy checks.
- Update `skill.yaml`:
  - bump `skill.source-version`;
  - add or update a policy/gotcha if useful to document optional references.
- Bump `package.json` version because shipped check behavior changes.
- Rebuild `scripts/skill-source-compiler.mjs`.
- Run `regenerate` for `skills/skill-source-compiler` to update `SKILL.md` and `docs/compile-report.md`.
- Update [../README.md](../README.md) to link this plan and mark it as audited/planned.

## Implementation Steps

1. Add failing no-reference tests for source bundle render/regenerate/check behavior.
2. Add failing compiled-skill check test for a folder without `skill.yaml` and without reference links.
3. Add or confirm a strict declared-reference test that fails when a linked `references/...` file is missing.
4. Refactor `checkSkillMarkdown(...)` to accept conditional reference expectations.
5. Update source-bundle check to pass manifest-derived expected reference targets into `checkSkillMarkdown(...)`.
6. Update compiled-skill check to allow no reference links while still validating any links that exist.
7. Remove or narrow `no-reference-links` as a conditional diagnostic.
8. Run focused tests for `check`, `compile`, and `lint`.
9. Update active references and `skill.yaml` for the optional-reference contract.
10. Bump `skill.yaml` `skill.source-version` and `package.json` version.
11. Rebuild the packaged script in `scripts/skill-source-compiler.mjs`.
12. Run `node scripts/skill-source-compiler.mjs regenerate .` from the `skills/skill-source-compiler` root, or the equivalent workspace-root command.
13. Run full package tests and compiler self-check.
14. Inspect diffs to confirm no placeholder references were added and no unrelated compiler behavior changed.
15. Create an implementation log under `docs/logs/` after implementation and update `docs/README.md`.

## Verification Plan

- `pnpm --filter @kostysh/skill-source-compiler-cli test`
- `pnpm --filter @kostysh/skill-source-compiler-cli run lint`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/skill-source-compiler`
- Temp no-reference source bundle:
  - `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint <no-reference-source-bundle>`
  - `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate <no-reference-source-bundle>`
  - `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check <no-reference-source-bundle>`
  - confirm generated `SKILL.md` omits `## Required active references` and `## Optional references`.
- Temp compiled no-reference skill:
  - remove or omit `skill.yaml`;
  - run `check`;
  - confirm no `no-reference-links` failure.
- Temp broken reference skill:
  - include a `references/...` link in `SKILL.md` without the referenced file;
  - run `check`;
  - confirm `missing-linked-reference` still fails.
- Drift regression:
  - modify generated `SKILL.md` in a source-bundle temp copy;
  - run `check`;
  - confirm `generated-skill-drift` still fails.
- `git diff --check`

## Risks and Side Effects

- **Reduced strictness for compiled skills:** a compiled skill without references will now pass.
  - Mitigation: this is intentional only for the existence of reference links; frontmatter, required base sections, portability, absolute paths, and existing links remain checked.
- **Missed broken reference section:** if a reference heading exists but no links are present, compiled-skill check might not know whether this is invalid.
  - Mitigation: source-bundle mode uses manifest expectations; compiled mode should still validate actual links and can optionally warn on empty reference headings.
- **Regression for generated skills that rely on reference headings:** tests may need updates to reflect conditional sections.
  - Mitigation: keep reference-heading tests for bundles that declare references.
- **Docs/runtime drift:** updating check semantics without updating active references would preserve confusion.
  - Mitigation: update source-language, output-structure, maintenance docs, generated `SKILL.md`, and compile report in the same change set.
- **Versioning oversight:** shipped CLI behavior changes may be released without version bump.
  - Mitigation: include package and source-version bump as explicit implementation steps.

## Rollback Plan

- If no-reference support causes false positives, revert the runtime/test/docs implementation commit while leaving this issue and plan as supporting context.
- If only compiled-skill mode is too permissive, restore stricter compiled-mode diagnostics and keep source-bundle manifest-aware behavior.
- If source-bundle mode misses declared references, revert the `checkSkillMarkdown(...)` refactor and reintroduce conditional behavior in a narrower helper.
- If generated output drifts, rerun `regenerate` from the corrected source bundle or restore generated artifacts from the previous commit.

## Independent Audit

Audit status: `PASS`

Auditor: spawned agent `Dirac`

Audit criteria:
- Conformance to the related issue.
- Coverage of all source artifacts describing the problem.
- Sufficiency and safety of the proposed implementation.

Audit notes:

- Аудитор подтвердил, что план соответствует `issue-20260424-2`.
- План покрывает conditional reference sections, source-bundle mode with `skill.yaml`, compiled-skill mode without manifest, preservation of existing `references/...` link validation, drift check, and runtime/tests/docs/generated surface parity.
- Non-blocking recommendation: explicitly add no-reference regression in `lint.test.ts` or CLI lint coverage.
- Recommendation applied by adding explicit lint coverage to the test plan.

Required corrections:

- None.

Final status:

`PASS` - Implementation plan `implementation-plan-20260424-2` conforms to `issue-20260424-2` and is sufficient for safe implementation.
