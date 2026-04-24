# Лог имплементации `ISS-07`

Issue: `../issues/issue-20260424-4.md`

Plan: `../issues/implementation-plan-20260424-4.md`

Status: implemented

## Scope

Реализован generic implementation pre-review checklist evidence mechanism для явно declared risk families. Изменение относится к dossier workflow readiness: checklist evidence записывается до external review handoff и не заменяет audit policy.

## Что изменено

- Добавлен active reference `references/implementation-pre-review-checklists.md` и подключен в `skill.yaml` / generated `SKILL.md`.
- `implementation` stage-controller получил repeatable `--risk-family <id>` и `--pre-review-check <dsl>`.
- Helper-managed stage state и mirrored stage-log frontmatter получили `pre_review_risk_families`, `pre_review_checklists`, `pre_review_checklist_status`, `pre_review_checklist_blockers`.
- `implementation --ready-for-close` fail-closed при declared risk family и `missing` / `blocked` checklist evidence.
- Built-in `policy-admission-governance` требует восемь stable checklist ids из плана.
- Custom risk families принимаются без domain-specific runtime code: требуется хотя бы один `pass` или `not_applicable` entry и отсутствие `blocked`.
- Regression tests покрывают missing, complete, blocked, no-risk, custom-family, malformed DSL, unsupported-stage flags и то, что checklist evidence не удовлетворяет external audit bundle.

## Что сознательно не менялось

- `implementation-discipline` не изменялся.
- Risk families не infer-ятся из keywords, filenames, source code, prose, diff heuristics, chat summaries или review findings.
- `review-artifact` и `dossier-step-close` не считают checklist evidence audit artifact.
- Required audit classes, freshness, same-thread rejection, immutable review artifacts и close-out bundle semantics не ослаблялись.
- Rich custom-family checklist semantics оставлены project-level docs/tests, не core runtime.

## Проверки

- `pnpm --filter @kostysh/unified-dossier-engineer format` — PASS.
- `pnpm --filter @kostysh/unified-dossier-engineer typecheck` — PASS.
- `pnpm --filter @kostysh/unified-dossier-engineer lint` — PASS.
- `pnpm --filter @kostysh/unified-dossier-engineer test` — PASS, 86/86. Команда запускалась вне sandbox, потому что CLI tests создают дочерние Node-процессы.
- `node --experimental-strip-types test/docs-contract.test.ts` — PASS.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint skills/unified-dossier-engineer` — PASS.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs compile skills/unified-dossier-engineer --out-dir <tmpdir>` — PASS.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check <tmpdir>/unified-dossier-engineer` — PASS.
- Portable absolute-path scan for the skill folder — PASS, matches отсутствуют.
- `git diff --check -- skills/unified-dossier-engineer` — PASS.

## Audits

- Pre-commit implementation audit / Codex local review / `PASS`.
  - Scope: implementation-plan requirements, runtime parsing/write ordering, readiness fail-closed behavior, docs/runtime/test parity.
  - Findings: none.

## Follow-ups

- none.
