# План имплементации `ISS-08`

Issue: [issue-20260425-1.md](issue-20260425-1.md)

Status: audited

## Рабочие допущения

- `review-artifact`, `dossier-step-close`, `post-close-hygiene`, stage state и immutable review attempts уже реализованы; задача связывает эти primitives в operator/agent-facing recipes.
- Audit handoff recipe является active guidance, а не новым workflow stage и не новым runtime command.
- Reviewer analysis остается read-only: аудитор не меняет product/source/test/backlog truth files и не меняет `HEAD`.
- Единственное допустимое reviewer write исключение - узкий helper-owned accounting write через `review-artifact` после вынесения verdict, ограниченный managed review artifact / stage-state paths.
- `plan-slice` protected side-effect preset является semantic handoff guidance and audit-scope guidance; runtime не должен infer-ить этот preset из filenames, diff, prose или keywords.
- Protected side-effect preset должен срабатывать, когда implementation target затрагивает deploy, rollback, release, external executor, host/container boundary, caller-controlled input или другой protected side effect.
- Pre-close hygiene rehearsal нужен до final verification / final review bundle, если refresh/status/attention/source-review checks могут открыть или изменить backlog/source-review truth.
- Pre-close hygiene rehearsal выполняет refresh/status/attention/source-review checks without auto-ack; любые source-review/attention blockers решаются explicit backlog truth actions до финальной verification/review.
- Post-close hygiene после успешного `implementation` close остается обязательным confirmation checkpoint и не заменяется pre-close rehearsal.
- Командные примеры должны быть portable: `dossier-engineer ...` или documented equivalent, без абсолютных локальных путей.

## Цель

После implementation основной агент сможет запустить required dossier audit по готовому recipe, не сочиняя prompt заново.

Observable outcome:

- active guidance содержит canonical audit handoff recipes для `spec-conformance-reviewer`, `code-reviewer` и `security-reviewer`;
- каждый recipe явно включает audit task, audit class, checked scope, commit, read-only audit-analysis boundary, `Shared risk map`, `Reviewer focus`, PASS/FAIL `review-artifact` commands и правило immutable artifact required;
- `security-reviewer` recipe сохраняет обязательный `--security-trigger-reason` для code-bearing implementation security audit;
- active policy объясняет, что `review-artifact` после verdict является narrow reviewer-owned accounting evidence, not material mutation;
- `plan-slice` handoff guidance содержит protected side-effect risk preset and required invariants;
- closure guidance содержит pre-close hygiene rehearsal without auto-ack, ordering before final verification/review when it can mutate backlog truth, rerun rule after material backlog/source-review mutation, and separate post-close confirmation;
- docs do not add new stage-log fields or a new mandatory intermediate review stage;
- all new mandatory references are reachable from `SKILL.md`.

## Scope

- New active reference:
  - `references/audit-handoff-recipes.md`
- Existing active references:
  - [../../references/audit-policy.md](../../references/audit-policy.md)
  - [../../references/delivery-workflow-layer.md](../../references/delivery-workflow-layer.md)
  - [../../references/commandized-stage-control.md](../../references/commandized-stage-control.md)
  - [../../references/telemetry-and-closure.md](../../references/telemetry-and-closure.md)
  - [../../references/implementation-pre-review-checklists.md](../../references/implementation-pre-review-checklists.md), only if cross-reference wording is needed
  - [../../references/runtime-and-command-boundary.md](../../references/runtime-and-command-boundary.md), only if recipe command examples expose runtime boundary wording
- Source bundle and generated output:
  - `skill.yaml`
  - `fragments/overview.md`, only if the short start guidance needs to point agents to recipes
  - generated `SKILL.md`
  - `docs/compile-report.md`
- Maintainer-facing utility spec:
  - [../utility-spec.ru.md](../utility-spec.ru.md), only for runtime-facing command/example parity and no-automation boundaries
- Tests:
  - `test/docs-contract.test.ts`
  - runtime/help tests only if implementation changes shipped command syntax or help text
- Supporting docs:
  - [../README.md](../README.md)
  - future implementation log under `docs/logs/`

## Non-Goals

- Не реализовывать новый audit stage или intermediate review workflow.
- Не менять глобальные skills `spec-conformance-reviewer`, `code-reviewer`, `security-reviewer`.
- Не заменять external independent audit self-checklist-ом или implementation pre-review checklist-ом.
- Не ослаблять freshness, provenance, same-thread, audit-order, implementation-scope или security-trigger checks в `review-artifact` / `dossier-step-close`.
- Не разрешать аудитору менять material files, backlog truth или `HEAD`.
- Не менять `.dossier/reviews/*` storage layout или review artifact schema.
- Не добавлять новые stage-log fields для FAIL history или handoff recipes.
- Не добавлять domain-specific protected side-effect rules beyond compact preset.
- Не документировать runnable command, если runtime/help/tests его не ship-ят.

## Затронутые поверхности

### Active instructions

Add `references/audit-handoff-recipes.md` as the active place for reusable reviewer handoff prompts.

The reference should include:

- `When to use` / `When NOT to use`;
- common handoff skeleton with placeholders for stage, feature, audit class, material scope, trace commit, implementation scope, verification artifacts, prior review artifacts, and source materials;
- shared read-only boundary;
- explicit `review-artifact` accounting-write exception after verdict;
- `Shared risk map` section that can be reused across multiple auditors;
- per-class `Reviewer focus` for:
  - `spec-conformance-reviewer`;
  - `code-reviewer`;
  - `security-reviewer`;
- PASS and FAIL command templates using portable command form;
- rule that a blocking audit round is incomplete until `review-artifact` writes an immutable attempt artifact;
- security recipe requiring `--security-trigger-reason` for code-bearing implementation security audits.

Update existing active references:

- `audit-policy.md`: link the recipe reference, define the read-only analysis boundary and helper-owned accounting-write exception, and restate that `review-artifact` records already obtained verdicts only.
- `delivery-workflow-layer.md`: add pre-close hygiene rehearsal and protected side-effect preset obligations in the relevant stage sections.
- `delivery-workflow-layer.md`: carry the protected side-effect trigger set from the issue into `plan-slice` guidance: deploy, rollback, release, external executor, host/container boundary, caller-controlled input, or another protected side effect.
- `commandized-stage-control.md`: keep stage-controller boundaries mechanical and clarify that protected side-effect preset is agent-owned handoff content, not runtime inference.
- `telemetry-and-closure.md`: state recipes and rehearsal use existing artifacts/fields; no new stage-log fields are required.
- `implementation-pre-review-checklists.md`: only add a cross-reference if needed to distinguish protected side-effect preset from pre-review checklist evidence.
- `runtime-and-command-boundary.md` and `docs/utility-spec.ru.md`: align command examples and no-automation wording only if active recipes would otherwise overclaim runtime behavior.

Register the new reference in `skill.yaml` and regenerate `SKILL.md` / `docs/compile-report.md` through the source compiler rather than editing generated files by hand.

### Runtime

Default expectation: no runtime semantic change.

Runtime changes become in-scope only if implementation inventory finds that current help or command behavior cannot support the documented recipe without contradiction. If that happens, update runtime, built `scripts/dossier-engineer.mjs`, and CLI tests in the same change set.

Protected behavior to preserve:

- `review-artifact` remains helper persistence for an already completed audit attempt;
- `dossier-step-close` remains the authoritative closure validator;
- `post-close-hygiene` remains explicit post-close evidence and does not auto-ack source-review records;
- stage-controller commands do not author or validate semantic audit prompts, protected side-effect presets, or pre-close rehearsal reasoning.

### Tests

Add docs-contract coverage for:

- source-bundle reachability of `references/audit-handoff-recipes.md`;
- generated `SKILL.md` or active references pointing agents to the recipes;
- all three audit classes have recipes;
- recipes include `Shared risk map`, `Reviewer focus`, audit class, scope, commit, read-only boundary, PASS command, FAIL command, and immutable artifact requirement;
- `security-reviewer` recipe includes `--security-trigger-reason`;
- active policy permits only the narrow `review-artifact` accounting write after verdict and keeps other reviewer mutations invalidating;
- `plan-slice` protected side-effect preset includes:
  - reservation before side effect;
  - idempotent replay behavior;
  - terminal CAS / no terminal overwrite;
  - strict caller input;
  - live-vs-stale running behavior;
- closure guidance includes pre-close hygiene rehearsal before final verification/review when checks may mutate backlog/source-review truth;
- pre-close hygiene rehearsal explicitly runs refresh/status/attention/source-review checks without auto-ack;
- material backlog/source-review mutation after final audits requires rerunning affected verification and review artifacts before `dossier-step-close`;
- post-close hygiene remains separate confirmation after close;
- protected side-effect preset trigger set includes deploy, rollback, release, external executor, host/container boundary, caller-controlled input, or another protected side effect;
- docs do not introduce a new mandatory workflow stage, new stage-log fields, or global reviewer-skill changes.

Add CLI/runtime tests only if a shipped help/runtime behavior changes.

## План работ

1. Inventory current command syntax and active wording:
   - run or inspect `help review-artifact`, `help dossier-step-close`, `help post-close-hygiene`, `help implementation`;
   - confirm exact portable command templates and required flags, especially `--security-trigger-reason`;
   - list active references that need wording changes and verify no runtime semantic change is required.
2. Create `references/audit-handoff-recipes.md`:
   - define common handoff skeleton;
   - add per-class recipes for `spec-conformance-reviewer`, `code-reviewer`, `security-reviewer`;
   - include PASS/FAIL `review-artifact` commands and immutable-artifact completion rule;
   - include read-only boundary and helper-owned accounting-write exception.
3. Wire recipe reachability:
   - add the reference to `skill.yaml` as a required active reference;
   - update `fragments/overview.md` only if concise start guidance should mention recipes;
   - regenerate generated `SKILL.md` and `docs/compile-report.md`.
4. Update audit policy:
   - link the recipe reference;
   - make the `review-artifact` exception explicit;
   - preserve invalidation on material reviewer mutation and `HEAD` changes.
5. Update `plan-slice` guidance:
   - add protected side-effect risk preset to implementation handoff and audit scope;
   - carry the trigger set into active guidance: deploy, rollback, release, external executor, host/container boundary, caller-controlled input, or another protected side effect;
   - require the five compact invariants from the issue;
   - keep it semantic and agent-owned, without runtime inference or new checklist gate.
6. Update closure guidance:
   - add pre-close hygiene rehearsal before final verification/final review bundle when checks may mutate backlog/source-review truth;
   - require that pre-close refresh/status/attention/source-review checks run without auto-ack;
   - require resolving source-review/attention blockers before final verification/review;
   - require rerunning affected verification/reviews if material backlog/source-review mutation happens after final audits;
   - preserve post-close hygiene as post-close confirmation.
7. Align boundary references and utility spec:
   - confirm no new stage-log fields, schema fields, or runtime proof claims are introduced;
   - update `runtime-and-command-boundary.md` / `docs/utility-spec.ru.md` only where command examples or no-automation boundaries need parity.
8. Add docs-contract tests for recipes, protected side-effect preset, pre-close rehearsal, and negative constraints.
9. If runtime/help changed, update runtime code, generated script, and CLI tests; otherwise explicitly record "runtime unchanged" in the implementation log.
10. Create implementation log under `docs/logs/` and update [../README.md](../README.md) with final issue status.
11. Run verification and portability checks.

## Verification

Required checks for a docs-only implementation:

- `pnpm --filter @kostysh/unified-dossier-engineer format`
- `pnpm --filter @kostysh/unified-dossier-engineer lint`
- `pnpm --filter @kostysh/unified-dossier-engineer typecheck`
- `pnpm --filter @kostysh/unified-dossier-engineer test`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint skills/unified-dossier-engineer`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs compile skills/unified-dossier-engineer --out-dir <tmpdir>`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check <tmpdir>/unified-dossier-engineer`
- `git diff --check -- skills/unified-dossier-engineer`

Additional checks if runtime/help changes:

- targeted CLI tests for changed help/runtime behavior;
- `pnpm --filter @kostysh/unified-dossier-engineer test -- test/cli.test.ts` if the runner supports file selection, otherwise full package test.

Manual/contract proof:

- read generated `SKILL.md` and confirm the new active recipe reference is discoverable;
- use one recipe from each audit class and confirm the handoff can be filled from placeholders without inventing missing required prompt parts;
- verify every recipe has both PASS and FAIL `review-artifact` command templates;
- verify no absolute local paths appear in any changed skill docs, generated surfaces, source-bundle files, references, fragments, utility spec, README, implementation log, or the whole `skills/unified-dossier-engineer` folder if the implementation scope is broad;
- verify no new mandatory stage, stage-log field, or reviewer-skill dependency was introduced.

## Риски и side effects

- Recipe wording can accidentally make `review-artifact` look like the audit itself; docs-contract should guard that it records an already obtained verdict only.
- The read-only exception can be over-broadened; keep it limited to helper-managed review artifact / stage-state accounting writes after verdict.
- Pre-close rehearsal can be mistaken for post-close hygiene replacement; active wording must keep their ordering and purposes separate.
- Protected side-effect preset can turn into domain-specific policy sprawl; keep it to the compact five-invariant preset from the issue.
- Adding a new required reference requires source-bundle, generated `SKILL.md`, and docs-contract reachability updates in the same implementation.
- If command templates drift from current help/runtime syntax, the implementation must update runtime/help/tests or simplify the recipe to a documented supported form.

## External Audit

Status: reviewed

Final reviewer: external agent `Dirac`

Final verdict: `PASS`

Review history:

- external agent `Feynman`: `FAIL`
- external agent `Dirac`: `PASS`

First-review findings:

- `medium` — protected side-effect trigger set was not explicitly planned for active guidance or docs-contract coverage.
- `medium` — pre-close hygiene rehearsal did not explicitly require no-auto-ack behavior.
- `low` — portability verification was narrower than the planned changed docs surface.

Required changes addressed in draft:

- Added protected side-effect trigger set to assumptions, active-instruction work, docs-contract coverage, and work steps.
- Added no-auto-ack requirement for pre-close hygiene rehearsal to assumptions, acceptance target, docs-contract coverage, and work steps.
- Expanded portability verification to changed docs/generated/source-bundle surfaces and, for broad scope, the full skill folder.

Final audit result:

- `PASS`
- Findings: none.
- Required changes: none.
- Accepted residual risk: runtime changes remain conditional on command/help inventory; implementation must update runtime and tests if documented recipes conflict with shipped behavior.
