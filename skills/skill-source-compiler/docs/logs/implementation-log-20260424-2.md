# Implementation Log

## Language

Русский.

## Log ID

`implementation-log-20260424-2`

## Related Issue

`issue-20260424-2` - [../issues/issue-20260424-2.md](../issues/issue-20260424-2.md)

## Related Plan

`implementation-plan-20260424-2` - [../issues/implementation-plan-20260424-2.md](../issues/implementation-plan-20260424-2.md)

## Operator Request

Оператор попросил имплементировать план поддержки простых source bundle без искусственных `references/*` файлов.

## Summary

Реализована условная проверка reference-секций:

- source bundles могут не объявлять active references;
- generated `SKILL.md` для таких bundles не содержит `## Required active references` и `## Optional references`;
- `check` проходит для корректных no-reference source bundles и compiled skills;
- существующие `references/...` ссылки и manifest-declared active references продолжают проверяться.

## Changes Made

- `src/check.ts` - reference headings and expected links are now conditional; source-bundle mode derives expected reference targets from `skill.yaml`, while compiled-skill mode validates only links that actually exist.
- `test/check.test.ts` - added no-reference source-bundle and compiled-skill checks; preserved missing-linked-reference regression.
- `test/lint.test.ts` - added explicit lint regression for source bundles without active references.
- `test/compile.test.ts` and `test/cli.test.ts` - updated expected skill source version.
- `references/source-language.md` - documents that references are optional and placeholder references should not be created.
- `references/output-structure.md` - marks references and assets as conditional output sections.
- `references/maintenance.md` - clarifies that simple self-contained skills should not add placeholder references.
- `skill.yaml` - bumped `skill.source-version` to `0.2.2` and added optional-reference policy/gotcha.
- `package.json` - bumped runtime package version to `0.2.1`.
- `scripts/skill-source-compiler.mjs` and `.map` - rebuilt shipped runtime artifact.
- `SKILL.md` and `docs/compile-report.md` - regenerated from the updated source bundle.

## Decisions

- Removed the unconditional `no-reference-links` failure instead of adding placeholder references.
- Kept validation for actual `references/...` links in compiled skills, because broken links remain a portability problem.
- In source-bundle mode, expected reference links come from `surfaces.active.requiredReferences` and `surfaces.active.optionalReferences`, so manifest-declared references remain strict.
- Did not add a new renderer branch, because renderer already omits empty reference sections correctly.

## Verification Performed

- `node --experimental-strip-types --test skills/skill-source-compiler/test/check.test.ts` - PASS.
- `node --experimental-strip-types --test skills/skill-source-compiler/test/lint.test.ts` - PASS.
- `pnpm --filter @kostysh/skill-source-compiler-cli test` - PASS outside sandbox, 25/25 tests.
- `pnpm --filter @kostysh/skill-source-compiler-cli run lint` - PASS.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/skill-source-compiler` - PASS.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/skill-source-compiler` - PASS.
- `git diff --check` - PASS.

## Deviations From Plan

No material deviations.

## Side Effects

- `check` is intentionally less strict for compiled skills without `skill.yaml`: absence of reference links is no longer an error.
- Existing reference links remain strict; missing linked reference files still fail with `missing-linked-reference`.

## Follow-up

Resume target skill migrations after this compiler fix is committed.

## Final Status

`PASS`
