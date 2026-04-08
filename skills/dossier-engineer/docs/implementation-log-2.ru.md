# Implementation Log 2: `dossier-engineer` UX corrective pass

## Package 1 — Docs/process contract

- Start time: 2026-04-08 Europe/Rome
- Normative process source: [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)
- Supporting planning source:
  - [refactoring-plan-2.ru.md](refactoring-plan-2.ru.md)
- Scope:
  - workflow-stage vs CLI-command separation
  - explicit backlog handoff contract
  - step-local backlog actualization wording
  - `sync-index` vs `index-refresh` discipline
  - `next-step` docs hardening

### Decisions / assumptions beyond the current process model

- None at package start.

### Local acceptance

- `git diff --check -- skills/dossier-engineer` — PASS

### Decisions / assumptions added during implementation

- `utility-spec.ru.md` stays in Package 2 because it must describe the shipped runtime contract, not the docs-only target wording ahead of runtime alignment.

### Reviews

- Spec/process review against [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md) and [refactoring-plan-2.ru.md](refactoring-plan-2.ru.md) — PASS

### Commit

- Commit: pending
- Total time to close package: pending until commit
