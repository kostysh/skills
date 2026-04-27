# Лог имплементации `ISS-09`

Issue: `../issues/issue-20260427-1.md`

Plan: `../issues/implementation-plan-20260427-1.md`

Status: implemented

## Scope

Реализована model-agnostic hardening правка active guidance для reasoning-model orchestration без изменения runtime semantics. Изменение переводит часть agent-facing guidance в progressive disclosure, hard invariants, decision/stop rules, outcome-first audit handoff и schema-as-runtime-contract wording, сохраняя существующие команды, stages, audit policy, helper boundaries, artifacts, source-review flow, pre-review checklists и post-close hygiene.

## Что изменено

- `skill.yaml` повышен до `skill.source-version: 0.2.3`; Start here теперь явно читает `status-and-scope` первым и грузит остальные required references только по trigger/surface.
- `references/status-and-scope.md` разделяет `Hard invariants`, model-agnostic operating posture и agent decision rules; no-loss guidance закрепляет запрет de-noising через удаление функций.
- `references/source-bundle-governance.md` получил maintainer-facing no-loss de-noising rule и запрет active reference filenames с конкретным номером модели.
- `references/audit-policy.md` заменяет informal weak/mini wording на approved reviewer-grade profile и добавляет fail-closed rule для отсутствующего permission / unavailable independent reviewer execution.
- `references/audit-handoff-recipes.md` переписан в outcome-first skeleton с Goal, Success criteria, Inputs, Constraints, Output, Stop rules, missing-evidence FAIL behavior и сохраненными PASS/FAIL `review-artifact` templates.
- `references/delivery-workflow-layer.md` добавляет stage-level continue / ask operator / block / stop table и progress-update rule как UX-only, not closure truth.
- `references/source-review-contract.md` добавляет source-review decision rules без auto-ack и без item-level flood.
- `references/runtime-and-command-boundary.md`, `commandized-stage-control.md`, `telemetry-and-closure.md` и `implementation-pre-review-checklists.md` уточняют, что schema/DSL snippets являются runtime/artifact contracts, not free-form model output prompts.
- `commandized-stage-control.md` и `telemetry-and-closure.md` уточняют, что `phase_scope` является dossier workflow accounting field, not OpenAI Responses API `phase`.
- `test/docs-contract.test.ts` получил regression guards для no-loss baseline, progressive disclosure, model-neutral active references, audit delegation stop rule, outcome-first recipes, stage/source-review stop rules, schema-contract wording и `phase_scope` clarification.
- Generated `SKILL.md` and `docs/compile-report.md` regenerated через `skill-source-compiler`.

## Что сознательно не менялось

- Runtime code, command behavior, help semantics, package version and built CLI public surface не менялись.
- Не добавлялись новые runnable commands, flags, output fields, artifact fields, workflow stages или storage layout.
- Required audit classes, code-bearing implementation audit order, immutable review attempts, freshness/invalidation, same-thread rejection and `fork_context: false`/no-full-history policy не ослаблялись.
- Source-review explicit resolution paths, no-auto-ack behavior, post-close hygiene checkpoint and implementation pre-review checklist semantics сохранены.
- `references/gpt-5.5-operating-profile.md` или другой model-numbered active reference не создавался.

## Проверки

- `pnpm --filter @kostysh/unified-dossier-engineer format` — PASS.
- `pnpm --filter @kostysh/unified-dossier-engineer lint` — PASS.
- `pnpm --filter @kostysh/unified-dossier-engineer typecheck` — PASS.
- `pnpm --filter @kostysh/unified-dossier-engineer test` — PASS, 95/95. Команда запускалась вне sandbox, потому что CLI suite использует child-process `spawnSync`; sandbox run failed with EPERM and empty child stdout.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint skills/unified-dossier-engineer` — PASS.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check skills/unified-dossier-engineer` — PASS.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs compile skills/unified-dossier-engineer --out-dir <tmpdir>` — PASS.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check <tmpdir>/unified-dossier-engineer` — PASS.
- `node skills/unified-dossier-engineer/scripts/dossier-engineer.mjs help` — PASS.
- `node skills/unified-dossier-engineer/scripts/dossier-engineer.mjs help implementation` — PASS.
- `node skills/unified-dossier-engineer/scripts/dossier-engineer.mjs help review-artifact` — PASS.
- `node skills/unified-dossier-engineer/scripts/dossier-engineer.mjs help dossier-step-close` — PASS.
- `node skills/unified-dossier-engineer/scripts/dossier-engineer.mjs help post-close-hygiene` — PASS.
- Model-numbered active reference scan — PASS, matches отсутствуют.
- Portable absolute-path scan for `skills/unified-dossier-engineer` — PASS, matches отсутствуют.
- `git diff --check -- skills/unified-dossier-engineer` — PASS.

## External Audits

- Implementation external audit / external agent `Newton` / `PASS`.
  - Scope: issue/plan acceptance criteria, no-loss preservation, model-neutral active guidance, runtime/help/tests parity, docs-contract coverage, README/log consistency.
  - Findings: none blocking.
  - Residual non-blocking risks: docs-contract no-loss guard is representative rather than a formal equality check of the full command catalog; README/log were pending during read-only audit and were updated after the audit.

## Follow-ups

- none.
