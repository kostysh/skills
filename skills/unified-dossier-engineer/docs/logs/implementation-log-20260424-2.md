# Лог имплементации `ISS-05`

Issue: `../issues/issue-20260424-2.md`

Plan: `../issues/implementation-plan-20260424-2.md`

Status: implemented

## Scope

Реализован explicit post-close backlog hygiene checkpoint для `implementation` closure. Изменение относится к branch-complete/readiness evidence после успешного закрытия implementation step и не превращает `dossier-step-close` в refresh gate.

## Что изменено

- `dossier-step-close --step implementation` после successful process-complete closure записывает `post_close_backlog_hygiene_required: true` и `post_close_backlog_hygiene_status: missing`, очищая прежние post-close evidence fields без запуска `refresh`.
- Добавлен CLI helper `post-close-hygiene`, который явно запускает `refresh`, затем собирает `status`, `attention` и `queue`, пишет `.dossier/verification/<feature>/implementation-post-close-backlog-hygiene.json` и обновляет helper-managed implementation stage state/frontmatter.
- Добавлен shared evaluator post-close hygiene для состояний `not_required`, `missing`, `stale`, `blocked` и `clean`, включая stale detection по `process_complete_ts`, backlog `state.updated_at` и `last_refresh_at`.
- `status`, `queue` и `next-step --dossier` показывают missing/stale/blocked post-close hygiene signals без изменения queue ranking.
- Active references, `docs/utility-spec.ru.md`, `skill.yaml`, generated `SKILL.md`, runtime help surface и tests синхронизированы с новым helper command и readiness contract.
- Regression tests покрывают missing без refresh, clean evidence, stale evidence, blocked source-review path без auto-ack, legacy `not_required` compatibility, queue warnings, help/runtime/docs parity.

## Что сознательно не менялось

- `dossier-step-close` не запускает `refresh` и не блокируется на post-close hygiene, если closure bundle otherwise valid.
- `post-close-hygiene` не вызывает `ack-source-review`, не применяет backlog patches/packets, не обновляет source paths и не удаляет sources.
- Queue ranking не redesign-ился; добавлены только warning/readiness signals.
- Historical implementation closures без new required flag не invalidated и остаются `not_required`.
- Scope не расширялся на non-implementation stages или полный branch-finish command.

## Проверки

- `pnpm --filter @kostysh/unified-dossier-engineer format` — PASS.
- `pnpm --filter @kostysh/unified-dossier-engineer typecheck` — PASS.
- `pnpm --filter @kostysh/unified-dossier-engineer lint` — PASS.
- `pnpm --filter @kostysh/unified-dossier-engineer build` — PASS.
- `pnpm --filter @kostysh/unified-dossier-engineer test` — PASS, 91/91. Команда запускалась вне sandbox, потому что CLI tests создают дочерние Node-процессы.
- `node --experimental-strip-types --trace-uncaught test/docs-contract.test.ts` — PASS.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs lint skills/unified-dossier-engineer` — PASS.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs compile skills/unified-dossier-engineer --out-dir <tmpdir>` — PASS.
- `node skills/skill-source-compiler/scripts/skill-source-compiler.mjs check <tmpdir>/unified-dossier-engineer` — PASS.
- Portable absolute-path scan for the skill folder — PASS, matches отсутствуют.
- `git diff --check -- skills/unified-dossier-engineer` — PASS.

## Audits

- Pre-commit implementation audit / Codex local spec-conformance + merge-risk review / `PASS`.
  - Scope: `ISS-05` plan requirements, command help/runtime/test/docs parity, post-close state transitions, explicit source-review semantics, stale/missing/blocked readiness surfaces, portability.
  - Findings: none.

## Follow-ups

- none.
