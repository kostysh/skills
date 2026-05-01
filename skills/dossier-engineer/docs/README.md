# Dossier-engineer Skill Docs

This directory contains supporting and historical documents for the `dossier-engineer` skill.

The active normative surface is:

- `SKILL.md`;
- `references/*.md` linked from `SKILL.md`;
- `skill.yaml`, `fragments/*`, `src/*`, `test/*`, and `scripts/*` for generated/code-backed skill maintenance.

Historical Russian reference documents are stored in `docs/ru/references/`.

## Implementation logs

- `docs/logs/implementation-log-20260430-1.md` — converted the skill to `skill-source-compiler` source-bundle format, translated references to English, and preserved Russian copies.
- `docs/logs/implementation-log-20260430-2.md` — added the English operator capability reference and connected it to optional references.
- `docs/logs/implementation-log-20260430-3.md` — added the Body Completion Gate and required body-completion reference.
- `docs/logs/implementation-log-20260430-4.md` — added Dossier Language Policy and connected it to body completion.
- `docs/logs/implementation-log-20260430-5.md` — translated example assets to English and updated asset links.
- `docs/logs/implementation-log-20260430-6.md` — added runtime next-action reminders for scaffold body completion.
- `docs/logs/implementation-log-20260501-1.md` — switched runtime linting to include ESLint and fixed ESLint findings.
- `docs/logs/implementation-log-20260502-1.md` — implemented Phase 2 runtime write-lock safety, atomic writes, stale-scope checks, and lock tests.
- `docs/logs/implementation-log-20260502-2.md` — implemented Phase 1 truthful queue, spec/plan body gates, plan-slice concept review, and terminal lifecycle.
- `docs/logs/implementation-log-20260502-3.md` — implemented Phase 3 live-app evidence, integration path semantics, and negative/falsifier acceptance criteria.
- `docs/logs/implementation-log-20260502-4.md` — implemented Phase 4 normalized review freshness, final review bundle gates, and consolidated review guidance.

## Issues

- `docs/issues/issue-20260501-1.md` — Phase 1: честный `queue`, содержательные `Spec Compact`/`Plan Slice` и терминальный handoff. Status: issue revised, independent re-audit `PASS`.
- `docs/issues/issue-20260501-2.md` — Phase 2: single-writer runtime safety для mutating dossier commands. Status: issue revised, independent re-audit `PASS`.
- `docs/issues/issue-20260501-3.md` — Phase 3: integration correctness, live-app evidence и negative falsifiers. Status: issue revised, independent re-audit `PASS`.
- `docs/issues/issue-20260501-4.md` — Phase 4: consolidated review policy без micro-fix noise. Status: issue revised, independent re-audit `PASS`.
- `docs/issues/implementation-plan-20260501-1.md` — implementation plan for `issue-20260501-1`. Status: implementation completed in `docs/logs/implementation-log-20260502-2.md`.
- `docs/issues/implementation-plan-20260501-2.md` — implementation plan for `issue-20260501-2`. Status: implementation completed in `docs/logs/implementation-log-20260502-1.md`.
- `docs/issues/implementation-plan-20260501-3.md` — implementation plan for `issue-20260501-3`. Status: implementation completed in `docs/logs/implementation-log-20260502-3.md`.
- `docs/issues/implementation-plan-20260501-4.md` — implementation plan for `issue-20260501-4`. Status: implementation completed in `docs/logs/implementation-log-20260502-4.md`.
