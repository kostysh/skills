# План имплементации `ISS-09`

Issue: [issue-20260427-1.md](issue-20260427-1.md)

Status: audited

## Рабочие допущения

- Существующая функциональность `unified-dossier-engineer` является практически проверенной и сохраняется полностью. План не допускает удаления или редукции функций, даже если отдельные правила выглядят тяжелыми или повторяющимися.
- Изменение является active-guidance hardening: основная работа в `skill.yaml`, `fragments/*`, `references/*`, docs-contract tests, generated `SKILL.md` and `docs/compile-report.md`.
- Runtime behavior по умолчанию не меняется. Runtime changes допустимы только если новая формулировка требует command/help/output parity, и тогда runtime, built script and tests меняются в той же change set.
- Model-specific материалы остаются в датированном audit report. Durable active skill contract должен быть model-agnostic.
- `source-bundle-governance.md` сейчас не входит в emitted required references, но является maintainer source-bundle guidance. Изменения там допустимы как maintenance guidance; если guidance должна стать active agent contract, ее нужно продублировать или сослать из required active surface.
- `audit-handoff-recipes.md` уже является active required reference; его нужно сохранить как canonical recipe surface, а не заменить новым competing reference.

## Цель

После имплементации `unified-dossier-engineer` остается функционально тем же каноническим dossier/backlog runtime skill, но его active guidance становится лучше приспособлен к reasoning-model agents:

- hard invariants сохранены и видимо отделены от agent decision rules;
- agent получает явные stop conditions для длинных tool/audit/source-review workflows;
- progressive disclosure снижает ненужное чтение всех references перед первым действием;
- external audit delegation имеет fail-closed rule для отсутствующего разрешения или недоступной независимой reviewer execution;
- audit handoff recipes имеют outcome-first форму без потери audit evidence semantics;
- runtime schema snippets больше не выглядят как просьба к модели hand-author free-form JSON;
- `phase_scope` не путается с OpenAI Responses API `phase`;
- docs-contract tests фиксируют, что функции не удалены.

## Scope

- Active/source-bundle docs:
  - `skill.yaml`
  - `fragments/overview.md`
  - `references/status-and-scope.md`
  - `references/source-bundle-governance.md`
  - `references/audit-policy.md`
  - `references/audit-handoff-recipes.md`
  - `references/delivery-workflow-layer.md`
  - `references/commandized-stage-control.md`
  - `references/runtime-and-command-boundary.md`
  - `references/telemetry-and-closure.md`
  - `references/source-review-contract.md`
  - `references/implementation-pre-review-checklists.md` only if schema-contract wording needs local clarification
- Generated docs:
  - `SKILL.md`
  - `docs/compile-report.md`
- Tests:
  - `test/docs-contract.test.ts`
  - `test/cli.test.ts` only if runtime/help behavior changes
- Supporting docs:
  - `docs/README.md`
  - implementation log under `docs/logs/`

## Non-Goals

- Не удалять, не сокращать и не переименовывать существующие commands, command families, stages, audit classes, helper commands, artifact fields, lifecycle gates, source-review flows, stage-state schema, telemetry fields, post-close hygiene, pre-review checklists, canonical layout, no-legacy guarantees or runtime modules.
- Не вводить active reference с номером текущей модели в имени.
- Не менять model strings, API clients, SDK/provider setup, Codex config, reasoning settings or tool definitions outside this skill guidance.
- Не добавлять new workflow stage, new runnable command, new flag, new output field or new artifact field unless runtime/help/tests ship it in the same implementation.
- Не заменять external independent audits local self-checks, checklist evidence or chat-only summaries.
- Не redesign-ить `.dossier` storage layout, review artifact schema or source-review record schema.

## Затронутые поверхности

- Active instructions:
  - `skill.yaml`: startHere wording, reference triggers, source-version bump if source bundle changes.
  - `fragments/overview.md`: concise pointer to audit recipes / decision rules only if needed for discoverability.
  - `references/*`: guidance updates listed in Scope.
  - generated `SKILL.md`: regeneration output only.
- Runtime:
  - expected unchanged.
  - if implementation discovers contradiction between docs and shipped help/runtime, update `src/*`, `scripts/dossier-engineer.mjs`, `test/cli.test.ts`, and help/docs-contract together.
- Tests:
  - add docs-contract no-loss and new-guidance assertions.
  - keep existing no-legacy/canonical runtime assertions.
- Supporting docs:
  - `docs/README.md` issue/plan/log navigation.
  - implementation log with verification results and explicit "runtime unchanged" or runtime changes summary.

## No-Loss Baseline

Before editing active guidance, implementation must inventory and preserve these existing functions:

- Canonical scope:
  - `.dossier` accounting/process truth;
  - `docs/ssot` project-facing SSOT;
  - one feature = one backlog item;
  - one public launcher: `dossier-engineer`.
- Backlog truth:
  - `register-source`, `list-sources`, `update-source-path`, `remove-source`, `refresh`, `ack-source-review`;
  - `template`, `packet`, `patch-item`, `remove-item`;
  - `status`, `report`, `items`, `search`, `gaps`, `queue`, `attention`;
  - source-first review and no item-level flood on hash change;
  - no auto-ack in post-close hygiene.
- Delivery workflow:
  - `feature-intake`, `spec-compact`, `plan-slice`, `implementation`, `change-proposal`;
  - `contract-drift-audit`, backlog impact verdict, coverage gate;
  - selected backlog lifecycle targets: `specified`, `planned`, `implemented`;
  - `ready_for_close` not equal to closed.
- Closure and helpers:
  - `coverage-audit`, `debt-audit`, `dependency-graph`, `sync-index`, `index-refresh`, `lint-dossiers`, `dossier-verify`, `review-artifact`, `dossier-step-close`, `post-close-hygiene`, `next-step`, `lifecycle-refresh`;
  - authoritative closure stays with `dossier-step-close`;
  - lifecycle aggregation stays with `lifecycle-refresh` where needed;
  - post-close hygiene remains separate confirmation after implementation close.
- Audit policy:
  - required audit classes: `spec-conformance-reviewer`, `code-reviewer`, `security-reviewer`;
  - mutating-stage external-review baseline;
  - implementation code-bearing audit order: spec, code, security;
  - no self-review substitute;
  - no forked/full-history reviewer context;
  - immutable per-round review artifacts;
  - freshness and invalidation rules;
  - reviewer mutation of material files or `HEAD` invalidates the audit.
- Stage state / telemetry:
  - explicit `--session-id`;
  - helper-managed `.dossier/stages/*` as authoritative structured coordination surface;
  - parity-protected fields listed in `commandized-stage-control.md` and `telemetry-and-closure.md`;
  - `process_misses`, `skills_used`, `skill_issues`, `skill_followups`;
  - implementation pre-review checklist fields;
  - implementation post-close hygiene fields.

Implementation must add or update docs-contract assertions for representative no-loss terms if existing tests do not already cover them.

## План работ

1. Establish baseline and exact edit set:
   - inspect current `SKILL.md`, `skill.yaml`, `fragments/overview.md`, active `references/*`, `docs-contract.test.ts`, and relevant runtime help;
   - record which of T1-T14 from the audit each edit addresses;
   - decide whether model-agnostic operating posture fits in `status-and-scope.md` / `source-bundle-governance.md` or needs stable `references/agent-operating-profile.md`;
   - do not create a model-numbered reference.
2. Add progressive disclosure and model-agnostic operating posture:
   - update `skill.yaml` startHere to read `status-and-scope` first, then only references matching the current surface trigger;
   - add wording that required references are mandatory when their trigger applies, not a command to load all references upfront;
   - add model-agnostic operating posture: balanced/default reasoning for normal work, concise posture for direct read/help/report work, deeper effort only for risk/eval/operator-justified work;
   - keep this guidance model-family neutral.
3. Preserve functions while marking instruction layers:
   - add `Hard invariants` / `Agent decision rules` structure where it clarifies behavior without moving or deleting existing requirements;
   - keep all existing "must/must not" semantics for actual invariants;
   - convert only judgement areas into decision rules: reference loading, context gathering, pre-close rehearsal, rerun scope, operator question/blocking conditions.
4. Update external audit delegation rules:
   - in `audit-policy.md`, add explicit fail-closed rule for environments where independent reviewer execution requires operator permission or is unavailable;
   - preserve `fork_context: false` / no-full-history requirement;
   - replace ambiguous "weak or mini models" wording with approved reviewer-grade profile wording, while preserving that low-grade/non-approved reviewers do not satisfy blocking audit policy.
5. Rewrite audit handoff recipes into outcome-first shape:
   - keep all existing recipe fields, PASS/FAIL `review-artifact` commands, immutable artifact requirement, shared risk map, reviewer focus, read-only boundary, and `--security-trigger-reason`;
   - add Goal, Success criteria, Inputs, Constraints, Output, Stop rules;
   - include missing-evidence behavior: FAIL with the smallest missing evidence list;
   - do not add a new stage, new reviewer skill, new artifact field, or new command.
6. Add stage-level decision and stop rules:
   - in `delivery-workflow-layer.md`, add a compact table for `feature-intake`, `spec-compact`, `plan-slice`, `implementation`, and `change-proposal`;
   - columns: continue, ask operator, block, stop;
   - preserve current stage obligations, backlog actualization, audit bundles, pre-close hygiene, final verification/review, `dossier-step-close`, and post-close hygiene.
7. Clarify source-review and hygiene stop rules:
   - in `source-review-contract.md` and delivery/closure references, add minimum sufficient evidence and stop conditions for source-review triage;
   - preserve no-auto-ack, explicit resolution paths, readiness blocking, and no item-level flood first effect.
8. Clarify runtime schema contracts:
   - in `runtime-and-command-boundary.md` and local schema-heavy references, state that JSON/DSL snippets describe persisted runtime artifacts or CLI inputs, not prompts for free-form model output;
   - direct agents to use templates, helper commands, runtime validation, tests, and docs-contract checks.
9. Clarify `phase_scope`:
   - in `commandized-stage-control.md` and `telemetry-and-closure.md`, define `phase_scope` as dossier workflow accounting field;
   - explicitly state it is not OpenAI Responses API assistant-item `phase`;
   - if a host manually replays Responses output items, API `phase` must be preserved separately outside dossier schema.
10. Add portable preamble/progress-update guidance:
   - add a short rule for long-running tool/audit workflows: if the runtime supports visible progress updates, give a concise preamble before multi-step work;
   - state that progress updates are operator UX, not stage evidence or closure truth.
11. Update docs-contract tests:
   - add no-loss assertions for the baseline functions in this plan;
   - assert no model-numbered active reference filename is added;
   - assert progressive disclosure wording exists;
   - assert audit delegation permission/unavailable reviewer stop rule exists;
   - assert outcome-first handoff recipes still include existing audit evidence requirements;
   - assert `phase_scope` clarification exists;
   - assert schema snippets are runtime contracts, not free-form model output prompts.
12. Regenerate generated outputs:
   - run skill source compiler lint/compile/check;
   - copy generated `SKILL.md` and `docs/compile-report.md` back only through the established compiler workflow;
   - inspect generated `SKILL.md` for size, reachability, and no-loss wording.
13. Runtime parity check:
   - run top-level and targeted help commands;
   - if docs added no new runtime promise, record runtime unchanged in implementation log;
   - if docs require runtime wording changes, update runtime/help/tests in the same change set.
14. Update supporting docs:
   - create implementation log in `docs/logs/`;
   - update `docs/README.md` Document Map and Issue Status for `ISS-09`;
   - ensure issue, plan, and log remain in Russian.
15. Final verification:
   - run format/lint/typecheck/test and compiler checks;
   - run portability scan for absolute local paths;
   - run `git diff --check`;
   - inspect changed docs for accidental function loss or model-numbered active reference names.

## Verification

Required checks:

- `pnpm --filter @kostysh/unified-dossier-engineer format`
- `pnpm --filter @kostysh/unified-dossier-engineer lint`
- `pnpm --filter @kostysh/unified-dossier-engineer typecheck`
- `pnpm --filter @kostysh/unified-dossier-engineer test`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint skills/unified-dossier-engineer`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs compile skills/unified-dossier-engineer --out-dir <tmpdir>`
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check <tmpdir>/unified-dossier-engineer`
- `node skills/unified-dossier-engineer/scripts/dossier-engineer.mjs help`
- `node skills/unified-dossier-engineer/scripts/dossier-engineer.mjs help implementation`
- `node skills/unified-dossier-engineer/scripts/dossier-engineer.mjs help review-artifact`
- `node skills/unified-dossier-engineer/scripts/dossier-engineer.mjs help dossier-step-close`
- `node skills/unified-dossier-engineer/scripts/dossier-engineer.mjs help post-close-hygiene`
- `rg -n "gpt-5\\.5-operating-profile|gpt-5\\.6|references/gpt-5\\." skills/unified-dossier-engineer/SKILL.md skills/unified-dossier-engineer/skill.yaml skills/unified-dossier-engineer/references`
- `rg -n "<absolute-local-path-regex>" skills/unified-dossier-engineer`
- `git diff --check -- skills/unified-dossier-engineer`

Manual verification:

- compare generated `SKILL.md` command catalog before/after and confirm no command disappeared;
- compare active required references before/after and confirm every required reference is reachable;
- confirm all audit classes and audit order remain intact;
- confirm all stage-controller and helper boundaries remain intact;
- confirm no prose says existing functions can be removed as noise;
- confirm no new runnable surface is documented without runtime/help/tests.

## Риски и side effects

- Overzealous de-noising can silently remove workflow protections. Mitigation: no-loss baseline, docs-contract terms, and manual before/after comparison.
- New operating posture could be misread as model configuration policy. Mitigation: keep it model-agnostic and behavioral, not API/client configuration.
- Outcome-first audit recipe rewrite can accidentally drop existing fields or command examples. Mitigation: docs-contract assertions for all current recipe requirements.
- Delegation stop rule can accidentally weaken audit requirement by allowing fallback self-review. Mitigation: explicitly require blocked/open state when independent reviewer execution is unavailable.
- `phase_scope` clarification could overclaim API integration behavior. Mitigation: state it as host guidance only; dossier runtime does not prove API-level `phase`.
- Schema clarification could make runtime contracts look optional. Mitigation: say schemas are runtime contracts and must be validated through helpers/tests, not removed from guidance.
- Adding a new stable reference, if chosen, can bloat `SKILL.md` or break reachability. Mitigation: prefer embedding short posture in existing references unless size/structure requires a new file.

## External Audit

Status: reviewed

Verdict: `PASS`

Required changes:

- None.

Reviewer:

- External agent `Maxwell`.

Review notes:

- The plan sufficiently covers the audit report, active skill contract, functional preservation requirement, model-neutral durable contract, runtime/help/tests parity, destructive side effects, and README status accuracy.
- Accepted residual risks:
  - `source-bundle-governance.md` is currently maintainer guidance rather than an active required reference; the plan already requires duplicating or linking any agent-facing guidance through active surface.
  - T12 prompt-caching/static-first guidance is covered indirectly through de-noising/source-bundle governance and remains low-priority.
