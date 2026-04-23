# Implementation Log

## Language

Русский.

## Log ID

`implementation-log-20260424-1`

## Related Issue

`issue-20260424-1` - [../issues/issue-20260424-1.md](../issues/issue-20260424-1.md)

## Related Plan

`implementation-plan-20260424-1` - [../issues/implementation-plan-20260424-1.md](../issues/implementation-plan-20260424-1.md)

## Operator Request

Оператор попросил сначала закоммитить подготовленные supporting docs, затем выполнить реализацию исправления для destructive overlap в `skill-source-compiler`.

После первичной реализации оператор уточнил, что техдолг оставлять нельзя, и затем попросил убрать `commands.tests` из `skills/skill-source-compiler/skill.yaml`, потому что ссылки на тесты в скомпилированном `SKILL.md` бесполезны для агентов-потребителей.

## Summary

Реализован безопасный maintainer workflow:

- `regenerate <source-dir>` обновляет generated-файлы внутри папки с `skill.yaml` без удаления source bundle.
- `compile` и `compile-all` сохраняют out-of-place packaging, но fail closed при overlap source/output до destructive write.
- `check` распознает source bundle по `skill.yaml` и проверяет rendered/declared surface, не сканируя всю dev tree.
- Runnable command sections in generated `SKILL.md` no longer include `Tests:` links.

## Changes Made

- `src/compiler.ts` - добавлены подготовка render output до записи, overlap guard, `regenerateSourceBundle`, fail-closed in-place copy semantics и preflight для `compile-all`.
- `src/lint.ts` - duplicate-guidance lint больше не считает повторяемые CLI `inputs`/`outputs` техдолгом, потому что это структурные поля command contract.
- `src/check.ts` - добавлена source-bundle ветка `check`, drift diagnostics для `SKILL.md` и `docs/compile-report.md`, проверка только emitted/declared surface.
- `src/run-cli.ts` - добавлена CLI-команда `regenerate`; help для `compile`, `compile-all` и `check` уточнен под новый contract.
- `src/index.ts` - экспортированы новые runtime APIs.
- `test/compile.test.ts`, `test/check.test.ts`, `test/cli.test.ts` - добавлены regression/contract tests для overlap safety, in-place regeneration, source-bundle check и CLI help.
- `test/lint.test.ts` - self-hosted source bundle теперь проверяется на отсутствие lint diagnostics.
- `skill.yaml`, `references/maintenance.md`, `references/source-language.md`, `references/authoring-guidelines.md` - обновлен active instruction surface и command contract.
- `skill.yaml` - удалены `commands.tests`; `skill.source-version` bumped to `0.2.1`.
- `package.json` - bumped runtime package version to `0.2.0`.
- `scripts/skill-source-compiler.mjs`, `scripts/skill-source-compiler.mjs.map` - rebuilt shipped runtime artifacts.
- `SKILL.md`, `docs/compile-report.md` - regenerated from updated source bundle.

## Decisions

- In-place maintenance реализована отдельной командой `regenerate`, чтобы не ломать существующий explicit `compile --out-dir` packaging contract.
- In-place режим пишет только compiler-owned generated files: `SKILL.md` и `docs/compile-report.md`.
- Manifest entries with same resolved source and target are validation-only in in-place mode.
- Manifest entries with different resolved source and target fail closed in in-place mode until the manifest language has an explicit ownership marker.
- `compile-all` preflights every child output path before first write, because partial batch writes are harder to reason about and recover from.
- CLI command `inputs` and `outputs` are excluded from duplicate-guidance lint because repeated phrases there are schema-level contract vocabulary, not duplicated prose guidance.
- `commands.tests` is intentionally omitted from this source bundle even though the schema still supports it; generated command documentation should not link to repository tests that are irrelevant for normal skill consumers.

## Verification Performed

- `pnpm --filter @kostysh/skill-source-compiler-cli run typecheck` - PASS.
- `pnpm --filter @kostysh/skill-source-compiler-cli run lint` - PASS.
- `pnpm --filter @kostysh/skill-source-compiler-cli test` - PASS, 21/21 tests.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/skill-source-compiler` - PASS.
- Regenerate output no longer includes duplicate-guidance warnings - PASS.
- Generated `SKILL.md` no longer contains `**Tests:**` command fields - PASS.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/skill-source-compiler` - PASS.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs compile skills/skill-source-compiler --out-dir <independent-temp-dir>` - PASS.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check <independent-temp-dir>/skill-source-compiler` - PASS.
- Dangerous temp regression: `compile <danger-temp-dir>/skill-source-compiler --out-dir <danger-temp-dir>` - expected FAIL before writes; `skill.yaml`, `src/`, `test/`, `references/` remained present.
- Dangerous temp batch regression: `compile-all <danger-temp-dir> --out-dir <danger-temp-dir>` - expected FAIL before writes; `skill.yaml`, `src/`, `test/`, `references/` remained present.

## Deviations From Plan

No material deviations.

## Side Effects

- `compile` and `compile-all` now reject overlapping output directories that were previously accepted and dangerous.
- `check <source-dir-with-skill.yaml>` now uses source-bundle semantics instead of compiled-folder recursive scan semantics.

## Follow-up

None.

## Final Status

`PASS`
