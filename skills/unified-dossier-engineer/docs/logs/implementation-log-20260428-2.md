# Лог имплементации `issue-20260428-2`

Issue: `../issues/issue-20260428-2.md`

Plan: `../issues/implementation-plan-20260428-2.md`

Status: implemented

## Scope

Реализовано усиление closure, audit history, post-close hygiene, policy/admission readiness и UDE producer fields для retrospective analysis. Работа затрагивает только `unified-dossier-engineer`: runtime source, generated launcher, active references/source bundle, utility spec, tests, generated `SKILL.md` и compile report.

## Что изменено

- `review-artifact` теперь fail-closed для `FAIL` без `--must-fix` или без `--evidence`; immutable FAIL/PASS attempts сохраняются в review history, а stage state/log получают bounded counts и ссылки.
- `dossier-step-close` усилил selected bundle validation: latest immutable PASS attempts, policy order, artifact-level `event_commit` freshness, selected verification matching, selected closure summary, RPA producer fields и `non_pass_review_events[]`.
- `plan-slice` получил explicit policy/admission classification flags, bounded taxonomy, negative-matrix DSL и readiness gate; `implementation --ready-for-close` rechecks linked plan-slice evidence.
- `post-close-hygiene` v2 разделяет global refresh artifact и per-feature hygiene artifacts, записывает affected feature ids, pre/post status summaries, schema version, global/per-feature lock discipline и partial run accounting.
- Active references, `docs/utility-spec.ru.md`, `skill.yaml`, generated `SKILL.md`, `docs/compile-report.md`, runtime help и docs-contract tests синхронизированы с новым runtime contract.

## Что сознательно не менялось

- Не менялись reviewer skills и `retrospective-phase-analysis`; UDE только производит durable fields для их будущего consumption.
- Не выполнялся synthetic backfill старых prose-only FAIL rounds как reviewer-owned artifacts.
- Runtime не пытается доказывать launch-mode independence сверх observable durable provenance.
- Semantic sufficiency policy/admission matrix остается задачей external review, а runtime валидирует только explicit input shape и coverage.

## Проверки

- `pnpm --filter @kostysh/unified-dossier-engineer format` - PASS.
- `pnpm --filter @kostysh/unified-dossier-engineer typecheck` - PASS.
- `pnpm --filter @kostysh/unified-dossier-engineer lint` - PASS.
- `pnpm --filter @kostysh/unified-dossier-engineer test` - PASS, `105/105` tests. Запускался вне sandbox, потому что `cli.test.ts` использует child `spawnSync(node, ...)`.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint skills/unified-dossier-engineer` - PASS.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs compile skills/unified-dossier-engineer --out-dir <tmpdir>` - PASS.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check <tmpdir>/unified-dossier-engineer` - PASS.
- `git diff --check -- skills/unified-dossier-engineer` - PASS.
- Portability scan for absolute local path dependencies in changed UDE files - PASS, no introduced machine-local paths.

## External Audits

- Instruction-quality audit - first pass FAIL: duplicate/generic policy-admission DSL, undefined linked `plan-slice` identity/freshness rules, stale future/not-shipped utility spec wording.
- Instruction-quality re-audit - second pass FAIL: shipped CLI help still used generic `risk=<id>` wording and utility spec still had stale future command matrix wording.
- Instruction-quality final micro-audit - PASS: stale strings absent from active UDE surfaces and shipped CLI help is clean.
- Final diff audit after runtime/docs parity fixes - PASS: post-close hygiene `fail` result contract, RPA invalid evidence handling, shipped CLI/test parity, and portability had no blocking findings.

## Follow-ups

- `none`.
