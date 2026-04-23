# Implementation Plan

## Language

Русский.

## Plan ID

`implementation-plan-20260424-1`

## Related Issue

`issue-20260424-1` - [issue-20260424-1.md](issue-20260424-1.md)

## Source Artifacts

- [issue-20260424-1.md](issue-20260424-1.md) - audited problem statement and acceptance boundaries.
- `skills/skill-source-compiler/src/compiler.ts` - current out-of-place compile implementation and destructive `removeDirectory(outputDir)` call.
- `skills/skill-source-compiler/src/fs-utils.ts` - recursive `removeDirectory` and copy/write helpers.
- `skills/skill-source-compiler/src/run-cli.ts` - shipped CLI command surface and `--out-dir` parsing.
- `skills/skill-source-compiler/src/check.ts` - current compiled-folder check that recursively scans all files.
- `skills/skill-source-compiler/src/source-loader.ts` - manifest loading and referenced-file collection behavior.
- `skills/skill-source-compiler/src/lint.ts` and `src/schema.ts` - source validation and manifest shape.
- `skills/skill-source-compiler/src/renderer.ts` - generated `SKILL.md` and `docs/compile-report.md` rendering.
- `skills/skill-source-compiler/test/compile.test.ts` - compiler behavior tests.
- `skills/skill-source-compiler/test/cli.test.ts` - built CLI contract tests.
- `skills/skill-source-compiler/test/check.test.ts` - check behavior tests.
- `skills/skill-source-compiler/skill.yaml` - source-of-truth command/documentation surface.
- `skills/skill-source-compiler/references/maintenance.md` - generated-skill maintenance workflow.
- `skills/skill-source-compiler/references/source-language.md` - source bundle and rendering model.
- `skills/skill-source-compiler/references/authoring-guidelines.md` - current utility invocation example.
- `skills/skill-source-compiler/AGENTS.md` - maintainer source-of-truth and regeneration guidance.
- `skills/skill-source-compiler/package.json` - runtime package version, build/test scripts, and packaged CLI metadata.
- `skills/skill-source-compiler/scripts/skill-source-compiler.mjs` - built runtime artifact that must be regenerated from `src/`.

## Objective

Make `skill-source-compiler` safe for the repo's intended generated-skill maintenance workflow:

- in-place regeneration must refresh generated outputs inside the source-bundle folder without deleting source files;
- out-of-place packaging must keep the current `compile --out-dir` use case but fail closed on destructive path overlap;
- `compile-all` must preflight all child bundles before the first destructive write;
- source-bundle checking must not recursively scan unrelated dev-tree files;
- docs, runtime help, built script, and tests must describe the same command contract.

## Assumptions

- Existing `compile <source-dir> --out-dir <skills-dir>` remains a supported out-of-place packaging command for independent output directories.
- A new explicit `regenerate <source-dir>` command is the least disruptive way to support in-place maintenance; it avoids changing the established `compile` argument contract.
- First implementation should not add a manifest ownership schema. Until ownership is explicit, in-place regeneration writes only compiler-owned generated files: `SKILL.md` and `docs/compile-report.md`.
- Manifest entries whose resolved `source` equals resolved `target` are validation-only in in-place mode.
- Manifest entries whose resolved `source` differs from resolved `target` are unsafe for in-place copying unless a future ownership marker exists; this implementation should fail closed for them.
- `check <dir>` can auto-detect source-bundle folders by the presence of `skill.yaml`; compiled output folders currently do not include `skill.yaml`.
- Because CLI behavior and generated instruction surface both change, bump both `package.json` `version` and `skill.yaml` `skill.source-version`.
- Issue, plan, and maintenance README files remain supporting docs. They should not be added to `skill.yaml` unless intentionally promoted into emitted output.

## Scope

In scope:

- Add safe in-place regeneration command and implementation.
- Add path-overlap guards for `compile` and `compile-all`.
- Prevent `compile-all` from writing any output until all child bundle output paths pass safety checks.
- Define and implement source-bundle-aware `check` behavior.
- Update unit/contract tests for runtime, CLI help, guard behavior, same-path manifest entries, and source-bundle check.
- Update active docs and generated output parity for the new command contract.
- Rebuild `scripts/skill-source-compiler.mjs` from `src/`.
- Update `docs/README.md` navigation for this issue and plan.

Out of scope:

- Migrating other skills to `skill-source-compiler`.
- Adding manifest ownership markers for generated/copy targets.
- Reworking the entire source language schema beyond the minimal command/contract updates.
- Changing unrelated lint rules, rendering layout, or generated `SKILL.md` section ordering.
- Registering maintenance issue/plan docs in `skill.yaml`.

## Proposed Changes

### Runtime

- Add path safety helpers, either in `src/compiler.ts` or a small local helper module:
  - normalize source and output directories with `resolve`;
  - detect same path;
  - detect ancestor/descendant overlap in both directions;
  - produce deterministic `SkillforgeError` diagnostics for unsafe output overlap.
- Refactor compile preparation so rendering and warnings can be reused without performing writes:
  - lint/load source bundle;
  - render `SKILL.md`;
  - render `docs/compile-report.md`;
  - compute output directory and declared file copy set.
- Keep `compileSourceBundle(sourceDir, { outDir })` as out-of-place packaging:
  - compute `<out-dir>/<skill.name>`;
  - reject any overlap with `loaded.rootDir` before `removeDirectory`;
  - only then clean independent output and copy declared files.
- Add `regenerateSourceBundle(sourceDir)`:
  - lint/load source bundle;
  - render `SKILL.md` and `docs/compile-report.md`;
  - validate declared `references`, `assets`, `copies`, and `supporting` sources exist;
  - treat same resolved `source`/`target` entries as validation-only;
  - fail closed for in-place entries where resolved `source` and `target` differ;
  - write only `SKILL.md` and `docs/compile-report.md` into `loaded.rootDir`;
  - never call `removeDirectory` on the source bundle.
- Update `compileAllSourceBundles`:
  - enumerate direct child bundle directories;
  - lint/prepare every child and validate every computed output path before writing any output;
  - only after successful preflight perform independent output writes;
  - preserve the existing success summary format unless help text changes require a snapshot update.
- Update `check` behavior:
  - keep compiled-output checks for directories without `skill.yaml`;
  - add source-bundle check path for directories with `skill.yaml`;
  - validate rendered/generated surface without recursively scanning all dev files;
  - compare existing `SKILL.md` and `docs/compile-report.md` to current rendered output when they exist, reporting drift as diagnostics;
  - validate only manifest-declared emitted/copy files plus generated outputs for portability/link checks.

### CLI

- Add command `regenerate <source-dir>`.
- Update global help and command-local help:
  - `compile` becomes explicitly out-of-place packaging into independent output directories;
  - `regenerate` becomes the maintainer command for in-place generated output refresh;
  - `check` accepts either compiled output or source bundle if auto-detection is implemented.
- Keep exit-code conventions:
  - usage errors remain exit 2;
  - validation/runtime safety failures remain exit 1;
  - unexpected errors remain exit 3.
- Add clear failure messages for unsafe overlap, including source directory and computed output directory.

### Tests

- Add compiler-level tests:
  - dangerous `compile` with output overlap fails before source deletion and leaves `skill.yaml`, `references/`, `src/`, `test/`, `package.json` intact;
  - output descendant/ancestor overlap fails closed;
  - independent out-of-place compile still succeeds;
  - `regenerateSourceBundle` writes `SKILL.md` and `docs/compile-report.md` in place;
  - `regenerateSourceBundle` does not copy same-path manifest entries and does not change source-owned files;
  - non-same-path in-place manifest entry fails closed.
- Add `compile-all` tests:
  - dangerous overlap fails before any child output directory is removed or written;
  - independent batch compile still succeeds.
- Add check tests:
  - compiled output check still rejects invalid `SKILL.md`;
  - source-bundle check ignores unrelated dev-tree files such as `node_modules/.bin/*`;
  - source-bundle check detects drift in `SKILL.md` and/or `docs/compile-report.md`;
  - source-bundle check validates required linked references from rendered output.
- Add CLI tests:
  - help exposes `regenerate`;
  - command help for `compile`, `regenerate`, and `check` matches the new contract;
  - built CLI `regenerate` succeeds on a temp copy and preserves source files;
  - built CLI rejects dangerous `compile` and `compile-all` overlap with clear stderr.

### Documentation And Generated Surface

- Update `skill.yaml`:
  - bump `skill.source-version`;
  - add `command-regenerate`;
  - clarify `compile`, `compile-all`, and `check` summaries/inputs/examples;
  - add gotcha/policy wording for independent output directories and in-place regeneration boundaries.
- Update active references:
  - `references/maintenance.md`: replace ambiguous "regenerate" workflow with explicit `regenerate <skill-root>` and out-of-place packaging guidance;
  - `references/source-language.md`: describe in-place validation-only behavior for same-path manifest entries and fail-closed behavior for non-same-path entries;
  - `references/authoring-guidelines.md`: replace `compile . --out-dir ./out` as the maintainer example with `regenerate .`, while keeping out-of-place packaging example separately if useful.
- Update `package.json` version because shipped CLI behavior changes.
- Rebuild `scripts/skill-source-compiler.mjs`.
- Regenerate `SKILL.md` and `docs/compile-report.md` with the fixed compiler.
- Update [../README.md](../README.md) to show this issue has a planned implementation and link this plan.

## Implementation Steps

1. Add failing regression tests first for destructive `compile` overlap, `compile-all` preflight, in-place same-path entries, and source-bundle `check`.
2. Add path-safety helpers and overlap diagnostics.
3. Refactor compile preparation so rendering and output path computation can happen before destructive writes.
4. Implement out-of-place overlap guards in `compileSourceBundle`.
5. Implement `regenerateSourceBundle` with in-place writes limited to `SKILL.md` and `docs/compile-report.md`.
6. Refactor `compileAllSourceBundles` to preflight all child bundles before writing.
7. Implement source-bundle-aware `check` behavior and drift diagnostics.
8. Wire `regenerate` and updated `check` behavior into `run-cli.ts`.
9. Update CLI help tests and runtime tests.
10. Update active docs and `skill.yaml` command definitions.
11. Bump `skill.yaml` `skill.source-version` and `package.json` `version`.
12. Build the runtime artifact into `scripts/skill-source-compiler.mjs`.
13. Run the new `regenerate` command for `skills/skill-source-compiler` to refresh `SKILL.md` and `docs/compile-report.md`.
14. Run verification commands and inspect generated diffs for accidental issue/plan promotion or unrelated churn.
15. Create an implementation log under `docs/logs/` after implementation, then update `docs/README.md`.

## Verification Plan

- `pnpm --filter @kostysh/skill-source-compiler-cli test`
- `pnpm --filter @kostysh/skill-source-compiler-cli run lint`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/skill-source-compiler`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/skill-source-compiler`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs compile skills/skill-source-compiler --out-dir <independent-temp-dir>`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check <independent-temp-dir>/skill-source-compiler`
- Manual/temp regression:
  - copy `skills/skill-source-compiler` to a temp workspace;
  - run dangerous `compile <copied-skill> --out-dir <parent-of-copy>`;
  - confirm command fails and source files remain intact.
- Manual/temp batch regression:
  - create a temp sources root with copied bundles;
  - run dangerous `compile-all <sources-root> --out-dir <overlapping-parent>`;
  - confirm command fails before writes and all child source files remain intact.
- `git diff --check`
- Review changed `SKILL.md`, `docs/compile-report.md`, `scripts/skill-source-compiler.mjs`, active references, tests, and package/source versions for docs/runtime/test parity.

## Risks and Side Effects

- **CLI compatibility risk:** users of `compile --out-dir` may see new failures for overlapping paths they previously used.
  - Mitigation: preserve independent out-of-place packaging and provide explicit `regenerate` for source-folder maintenance.
- **False-positive overlap risk:** path guard may reject a layout that was technically non-destructive.
  - Mitigation: start conservative because destructive false-negatives are worse; document independent output requirement.
- **In-place ownership risk:** writing manifest targets in place could overwrite hand-authored files.
  - Mitigation: first implementation writes only `SKILL.md` and `docs/compile-report.md`; same-path manifest entries are validation-only; non-same-path entries fail closed.
- **Check behavior risk:** auto-detecting `skill.yaml` changes `check` semantics for source folders.
  - Mitigation: keep compiled-output behavior unchanged for folders without `skill.yaml`; add explicit tests and help wording.
- **Generated artifact drift risk:** updating runtime/docs requires `SKILL.md`, `docs/compile-report.md`, and built script to move together.
  - Mitigation: docs/runtime/test parity checks, package/source version bumps, and final diff review.
- **Issue/plan promotion risk:** supporting docs could be accidentally added to emitted skill output.
  - Mitigation: do not add issue/plan/README files to `skill.yaml` unless intentionally promoted.

## Rollback Plan

- If implementation breaks runtime behavior before release, revert the implementation commit(s) and keep this issue/plan as open supporting documentation.
- If only the new `regenerate` command is faulty, disable or remove the command while keeping overlap guards for `compile` and `compile-all`.
- If source-bundle `check` causes unacceptable noise, revert auto-detection and introduce a separate `check-source` command in a follow-up plan.
- If generated output drift is detected, rerun build/regenerate from the corrected source bundle or restore generated artifacts from the previous commit.

## Independent Audit

Audit status: `PASS`

Auditor: spawned agent `Faraday`

Audit criteria:
- Conformance to the related issue.
- Coverage of all source artifacts describing the problem.
- Sufficiency and safety of the proposed implementation.

Audit notes:

- The plan covers the destructive `compile` / `compile-all` path in `compiler.ts`, recursive removal in `fs-utils.ts`, CLI dispatch/help in `run-cli.ts`, source-bundle `check`, source loading/lint/schema behavior, rendered/generated surfaces, tests, docs, package versioning, and built runtime regeneration.
- Proposed implementation matches the issue: explicit safe `regenerate`, fail-closed overlap guards before destructive writes, full `compile-all` preflight, same-path manifest entries as validation-only, non-same-path in-place entries as fail-closed, source-bundle-aware `check`, and docs/runtime/test parity.
- Safety is adequate: in-place writes are limited to `SKILL.md` and `docs/compile-report.md`, independent out-of-place packaging remains supported, and regression tests cover destructive overlap, partial reconstruction prevention, source preservation, and CLI contract changes.

Required corrections:

- None.

Final status:

`PASS` - Implementation plan `implementation-plan-20260424-1` conforms to `issue-20260424-1` and is sufficient for safe implementation.
