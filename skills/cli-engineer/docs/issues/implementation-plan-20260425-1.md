# Implementation Plan

## Language

Русский.

## Plan ID

`implementation-plan-20260425-1`

## Related Issue

`issue-20260425-1` - [issue-20260425-1.md](issue-20260425-1.md)

## Source Artifacts

- [issue-20260425-1.md](issue-20260425-1.md) - audited problem statement, acceptance criteria, constraints, and non-goals.
- `skills/cli-engineer/AGENTS.md` - generated-skill maintenance rule: update the source bundle first and regenerate generated files.
- `skills/cli-engineer/skill.yaml` - source-of-truth manifest, active reference declarations, source version, and generated-surface metadata.
- `skills/cli-engineer/fragments/overview.md` - root skill overview, non-negotiables, quick workflow, and high-signal triggers rendered into `SKILL.md`.
- `skills/cli-engineer/references/clig-baseline.md` - baseline CLI option, contract, and future-proofing guidance.
- `skills/cli-engineer/references/architecture-and-layout.md` - CLI/application/side-effect boundary and command grammar evolution guidance.
- `skills/cli-engineer/references/service-backed-clis.md` - service-backed operator command taxonomy and narrow write-action guidance.
- `skills/cli-engineer/references/testing-and-release.md` - unit, integration, contract, deprecation, and release verification guidance.
- `skills/cli-engineer/references/ux-and-security.md` - prompts, destructive actions, subprocess safety, and CLI security guidance.
- `skills/cli-engineer/SKILL.md` - generated output that must be refreshed from the source bundle, not hand-edited.
- `skills/cli-engineer/docs/compile-report.md` - generated traceability report that must be refreshed after source changes.
- `skills/skill-source-compiler/SKILL.md` and `skills/skill-source-compiler/references/maintenance.md` - regeneration/check workflow for source-bundle-backed skills.

The retrospective evidence paths listed in the issue are treated as supporting provenance captured by the audited issue. The implementation should not introduce those external paths as required skill dependencies.

## Objective

Add active, portable, framework-neutral `Protected command option contracts` guidance to `cli-engineer` so agents treat unknown, removed, or prohibited legacy flags on side-effecting operator commands as a pre-side-effect safety failure, not only as a UX or parser preference.

The resulting skill should make clear:

- when a command is protected;
- why ordinary read/list commands and protected side-effecting commands have different option-validation risk;
- which option allowlist, alias, deprecation, and test contracts protected commands require;
- where validation must happen relative to service, executor, subprocess, network, filesystem, or persistence side effects.

## Assumptions

- This is a documentation-only change to `cli-engineer`; there is no skill-local runtime or test package to update.
- `skill.source-version` should be bumped because the active instruction surface changes.
- The smallest sufficient implementation is to add one canonical protected-option contract section in an active reference, then point root `SKILL.md` guidance to it.
- `references/ux-and-security.md` is the best canonical home for the detailed protected-option safety rule because it already owns destructive actions, subprocess safety, and security anti-patterns.
- `references/testing-and-release.md` should receive the explicit contract-test checklist because it already owns CLI contract, deprecation, and release verification coverage.
- `references/architecture-and-layout.md` should receive only boundary-level guidance: option validation belongs in the CLI layer before app/use-case/executor invocation.
- `references/service-backed-clis.md` should connect protected option contracts to narrow write/operator commands without redefining the full rule.
- `references/clig-baseline.md` should get a short future-proofing/contract note, not a duplicate long section.
- Deprecated-but-supported aliases must stay explicit, warning/migration-oriented, and tested until removal; the plan must not require immediate breaking removal.

## Scope

In scope:

- Update the `cli-engineer` source bundle first: `skill.yaml`, `fragments/overview.md`, and active `references/*`.
- Add the protected command definition and option contract to active guidance.
- Add review guidance that missing strict option allowlist and tests for protected commands is a blocker.
- Add test checklist coverage for unknown flags, removed/prohibited legacy flags, deprecated-but-supported aliases, and fail-before-side-effects assertions.
- Regenerate `SKILL.md` and `docs/compile-report.md` through `skill-source-compiler`.
- Update `docs/README.md` navigation for this plan.
- Run compiler lint/check and portability-oriented scans.

Out of scope:

- Changing default framework recommendations or parser-library preferences.
- Requiring strict per-action allowlists for every small read-only utility.
- Adding project-specific deploy, rollback, release, or infra implementation examples.
- Changing `security-reviewer`.
- Redesigning the full CLI error taxonomy or packaging/release guidance.
- Removing supported aliases without explicit deprecation and migration guidance.

## Proposed Changes

### Source Manifest

- Bump `skills/cli-engineer/skill.yaml` `skill.source-version` from `0.1.0` to the next patch version.
- Keep the existing required reference list intact; no new reference file is required unless the implementation finds the canonical section makes an existing reference too large or unclear.
- If the implementation adds structured gotchas or policies in `skill.yaml`, keep them short and point to the canonical reference instead of duplicating the rule.

### Root Overview Fragment

- Update `fragments/overview.md` non-negotiables with a concise rule:
  - protected deploy/rollback/release/infra mutation/external executor commands must validate their per-action option contract before side effects.
- Update Quick Workflow so agents classify whether a command is protected before finalizing parsing, prompts, and command execution behavior.
- Add a high-signal trigger telling agents to read `references/ux-and-security.md`, `references/testing-and-release.md`, and `references/architecture-and-layout.md` when designing or reviewing protected side-effecting commands.

### `references/ux-and-security.md`

- Add a canonical section, for example `## Protected Command Option Contracts`.
- Define protected commands as commands that can trigger deploy, rollback, release, infra mutation, external executor/subprocess behavior, network mutation, persistence mutation, or comparable protected side effects.
- Explain the risk distinction:
  - ordinary read/list commands: unknown flags are mainly command-contract and automation compatibility issues;
  - protected commands: unknown, removed, or prohibited legacy flags are side-effect safety issues.
- Require protected commands to:
  - define an explicit per-action allowlist of accepted options;
  - reject unknown flags;
  - reject removed or prohibited legacy flags;
  - keep deprecated-but-supported aliases only as explicit aliases with warnings, migration behavior, and tests until removal;
  - fail before service, executor, subprocess, network, filesystem, or persistence side effects;
  - avoid parser-specific implementation mandates.
- Add review guidance: a protected CLI without strict option allowlist and pre-side-effect validation tests is a blocker.

### `references/testing-and-release.md`

- Extend contract-test guidance for protected commands with tests for:
  - unknown flag rejection;
  - removed/prohibited legacy flag rejection;
  - deprecated-but-supported alias warning/migration behavior when such an alias remains supported;
  - assertion that service/executor/subprocess/side-effect dependency is not invoked on validation failure.
- Add the same item to the review checklist so reviewers do not treat integration or smoke coverage as a substitute for the protected option contract.

### `references/architecture-and-layout.md`

- Add boundary guidance that option allowlist validation is CLI-layer contract validation and must happen before command handlers call app/use-case modules or infrastructure adapters.
- Preserve the existing separation between CLI contract and domain business rules.

### `references/service-backed-clis.md`

- Add a short note under command taxonomy or narrow write commands: service-backed operator write actions that mutate external systems are protected commands and should follow the protected option contract.
- Preserve the existing preference for narrow write actions, `--dry-run`, preview, or draft-first behavior where supported.

### `references/clig-baseline.md`

- Add a short contract/future-proofing note that unknown or removed flags on protected side-effecting commands must fail before side effects.
- Avoid duplicating the full protected-option checklist from `ux-and-security.md`.

### Generated Output

- Run in-place regeneration so `SKILL.md` and `docs/compile-report.md` reflect the source bundle.
- Inspect generated `SKILL.md` for a clear pointer to the protected-command references and no accidental promotion of `docs/*`.

### Supporting Docs

- Update [../README.md](../README.md) to link this plan and mark it as planned/audited after independent audit.
- Do not add issue, plan, or README files to `skill.yaml`; they remain supporting and historical surface.

## Implementation Steps

1. Edit `fragments/overview.md` to add the protected-command classification trigger, concise non-negotiable, and workflow pointer.
2. Add the canonical `Protected Command Option Contracts` section to `references/ux-and-security.md`.
3. Add protected-command contract tests and review checklist items to `references/testing-and-release.md`.
4. Add CLI-layer pre-side-effect validation guidance to `references/architecture-and-layout.md`.
5. Add the service-backed operator write-action cross-reference to `references/service-backed-clis.md`.
6. Add the short CLIG baseline contract note to `references/clig-baseline.md`.
7. Update `skill.yaml` with the source-version bump and any short structured pointer that is needed for generated `SKILL.md` reachability.
8. Run `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint skills/cli-engineer`.
9. Run `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/cli-engineer`.
10. Run `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/cli-engineer`.
11. Search `skills/cli-engineer` for machine-specific absolute paths and confirm none were introduced.
12. Review generated `SKILL.md` and `docs/compile-report.md` for source/docs parity, required-reference reachability, and no accidental supporting-doc promotion.
13. Run `git diff --check`.
14. Create an implementation log under `docs/logs/` when the implementation itself is performed, then update `docs/README.md` with implementation status.

## Verification Plan

- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint skills/cli-engineer`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs regenerate skills/cli-engineer`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/cli-engineer`
- `rg -n '(/[h]ome/|/[c]ode/projects/|[A-Za-z]:\\\\)' skills/cli-engineer`
- `rg -n "Protected Command Option Contracts|unknown flag|removed|prohibited|deprecated-but-supported|fail before|allowlist" skills/cli-engineer/SKILL.md skills/cli-engineer/references`
- `git diff --check`
- Manual review:
  - protected command definition is present and clear;
  - ordinary read/list commands are not forced into the protected strictness rule;
  - deprecated-but-supported aliases keep warning/migration/test guidance;
  - validation is explicitly before service/executor/subprocess/network/filesystem/persistence side effects;
  - parser and framework recommendations are unchanged;
  - active references remain reachable from `SKILL.md`;
  - issue/plan/supporting docs remain non-normative.

## Risks and Side Effects

- **Over-broad strictness:** agents may apply protected allowlist requirements to every small read-only utility.
  - Mitigation: define protected commands narrowly and explicitly preserve ordinary-command distinction.
- **Parser-specific drift:** guidance may accidentally imply a specific parser library.
  - Mitigation: write the contract in framework-neutral terms and leave parser choice unchanged.
- **Alias breakage:** guidance could be read as requiring immediate removal of supported aliases.
  - Mitigation: explicitly distinguish removed/prohibited flags from deprecated-but-supported aliases with warnings, migration behavior, and tests.
- **Domain/CLI boundary confusion:** option validation could be mixed into business logic guidance.
  - Mitigation: place allowlist validation in the CLI-layer contract before app/use-case/infrastructure invocation.
- **Duplicated guidance:** adding the same checklist across many references could create drift later.
  - Mitigation: keep the canonical rule in `ux-and-security.md`; other references should cross-reference or summarize only what they own.
- **Generated-surface drift:** hand-editing generated files would leave source and output inconsistent.
  - Mitigation: edit the source bundle first, regenerate, and run compiler check.
- **Portability regression:** implementation could add machine-specific retrospective paths to active docs.
  - Mitigation: keep external evidence as issue provenance only and run an absolute-path scan.

## Rollback Plan

- If implementation overreaches or conflicts with existing `cli-engineer` guidance, revert the source-bundle edits and rerun regeneration to restore `SKILL.md` and `docs/compile-report.md`.
- If only one reference section is problematic, remove or narrow that source edit, then rerun compiler lint/regenerate/check.
- If generated output drifts, rerun regeneration from the corrected source bundle rather than hand-editing generated files.
- If the source-version bump is applied but the content change is rolled back before release, restore the previous `skill.source-version` in `skill.yaml` and regenerate.

## Independent Audit

Audit status: `PASS`

Auditor: spawned agent `Einstein`

Audit criteria:
- Conformance to the related issue.
- Coverage of all source artifacts describing the problem.
- Sufficiency and safety of the proposed implementation.

Audit notes:

- Auditor confirmed the plan conforms to `issue-20260425-1` and its acceptance criteria.
- Auditor found no blocking issues with source-bundle-first maintenance, generated output regeneration, framework/parser neutrality, protected-vs-ordinary command scope, alias migration handling, CLI/domain boundary, portability, or verification sufficiency.
- Residual risk is limited to implementation-time checks because `cli-engineer` is currently documentation-only and has no skill-local `src/`, `test/`, or package runtime.

Required corrections:

- None.

Final status:

`PASS` - Implementation plan `implementation-plan-20260425-1` conforms to `issue-20260425-1` and is sufficient for safe implementation.
