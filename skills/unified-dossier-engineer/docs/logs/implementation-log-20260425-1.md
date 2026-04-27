# Лог имплементации `ISS-08`

Issue: `../issues/issue-20260425-1.md`

Plan: `../issues/implementation-plan-20260425-1.md`

Status: implemented

## Scope

Реализована active guidance для canonical audit handoff recipes, protected side-effect `plan-slice` handoff и pre-close hygiene rehearsal. Изменение связывает уже shipped primitives (`review-artifact`, immutable review attempts, `dossier-step-close`, `post-close-hygiene`, helper-managed stage state) в agent-facing workflow guidance без нового runtime stage и без изменения storage layout.

## Что изменено

- Добавлен active reference `references/audit-handoff-recipes.md` с common handoff skeleton, `Shared risk map`, per-class `Reviewer focus`, PASS/FAIL `review-artifact` command templates и completion rule для immutable review attempt.
- `skill.yaml` подключает новый required reference `ref-audit-handoff-recipes`; `skill.source-version` повышен до `0.2.2`.
- Generated `SKILL.md` и `docs/compile-report.md` regenerated через `skill-source-compiler`.
- `references/audit-policy.md` описывает read-only audit-analysis boundary и narrow `review-artifact` accounting-write exception after verdict.
- `references/delivery-workflow-layer.md` добавляет protected side-effect trigger set, пять protected side-effect invariants и pre-close hygiene rehearsal before final verification/review without auto-ack.
- `references/delivery-workflow-layer.md` добавляет compact implementation closure sequencing rule: `material commit freeze -> external reviewers write immutable review artifacts -> final verification -> dossier-step-close -> post-close hygiene`.
- `references/commandized-stage-control.md` и `references/runtime-and-command-boundary.md` фиксируют, что stage/runtime commands не infer-ят protected side-effect presets, не synthesise reviewer prompts и не perform pre-close hygiene rehearsal.
- `references/telemetry-and-closure.md` фиксирует, что recipes, shared risk maps, protected presets и rehearsal используют существующие artifacts/sections and do not add mandatory stage-log fields.
- `references/implementation-pre-review-checklists.md` отделяет protected side-effect preset guidance from checklist evidence unless a risk family is explicitly declared.
- `docs/utility-spec.ru.md` выровнен с pre-close rehearsal, protected side-effect preset и no-runtime-automation boundaries.
- `test/docs-contract.test.ts` получил regression guard для recipe reachability/completeness, read-only boundary, accounting-write exception, security trigger, protected side-effect trigger set/invariants, pre-close no-auto-ack rehearsal, final closure sequencing и negative constraints.

## Что сознательно не менялось

- Runtime code and help surface не изменялись: current `review-artifact` help already supports portable PASS/FAIL templates and `--security-trigger-reason`.
- `review-artifact`, `dossier-step-close`, freshness, provenance, same-thread, audit-order, implementation-scope and security-trigger validations не ослаблялись.
- `.dossier/reviews/*` layout and review artifact schema не redesign-ились.
- Новые stage-log fields, mandatory intermediate review stage и изменения global reviewer skills не добавлялись.
- Protected side-effect guidance оставлена compact preset, без domain-specific policy sprawl.

## Проверки

- `pnpm --filter @kostysh/unified-dossier-engineer format` — PASS.
- `pnpm --filter @kostysh/unified-dossier-engineer lint` — PASS.
- `node --experimental-strip-types --test test/docs-contract.test.ts` — PASS.
- `pnpm --filter @kostysh/unified-dossier-engineer test` — PASS, 92/92. Команда запускалась вне sandbox, потому что CLI tests создают дочерние Node-процессы; sandbox run failed with child-process `EPERM`.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint skills/unified-dossier-engineer` — PASS.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs compile skills/unified-dossier-engineer --out-dir <tmpdir>` — PASS.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check <tmpdir>/unified-dossier-engineer` — PASS.
- Portable absolute-path scan for `skills/unified-dossier-engineer` — PASS, matches отсутствуют.
- `git diff --check -- skills/unified-dossier-engineer` — PASS.

## External Audits

- Plan audit / external agent `Feynman` / `FAIL`.
  - Findings: missing protected side-effect trigger set, missing no-auto-ack wording for pre-close rehearsal, narrow portability verification.
- Plan re-audit / external agent `Dirac` / `PASS`.
  - Findings: none.
- Implementation-specific external audit: none.

## Follow-ups

- none.
