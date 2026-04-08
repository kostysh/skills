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

- Commit: `dec5b43` `docs(dossier-engineer): clarify workflow and command surface`
- Total time to close package: same-day cycle on `2026-04-08`; exact clock duration was not captured before the package was committed.

## Package 2 — Runtime alignment

- Start time: 2026-04-08 16:58:00 CEST
- Normative process source: [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)
- Supporting planning source:
  - [refactoring-plan-2.ru.md](refactoring-plan-2.ru.md)
- Scope:
  - structured backlog handoff in `feature-intake`
  - safe `next-step` targeting in multi-dossier repos
  - runtime/spec/test alignment

### Decisions / assumptions beyond the current process model

- The durable handoff is encoded as explicit `feature-intake` options:
  - `--backlog-item-key`
  - `--backlog-delivery-state`
  - repeatable `--backlog-source`
  - repeatable `--backlog-dependency`
  - repeatable `--backlog-blocker`
- `next-step` keeps dossier auto-selection only when exactly one dossier exists; ambiguity starts at `dossiers.length > 1`.
- `feature-intake` is not treated as atomic over `index-refresh`: if dossier creation succeeds but `index-refresh` fails, the command keeps the created dossier, returns the refresh exit code, and reports the partial-success state explicitly.
- `lint-dossiers` allows a freshly intaken `proposed` dossier to omit AC IDs with a warning instead of an error so that `feature-intake -> index-refresh` remains a valid first-run path; later stages still require ACs as hard errors.
- `feature-intake --json` stays machine-readable on partial success by returning structured refresh diagnostics instead of streaming raw text.
- `feature-intake` does not keep compatibility aliases for the removed `--selected-work` flag; it fails with an explicit migration error instead.
- `feature-intake` now forbids nested dossier outputs and symlinked `docs/features` paths so dossier creation cannot escape repo ownership or create hidden dossiers that later flows cannot discover.

### Local acceptance

- `pnpm --dir skills/dossier-engineer run format` — PASS
- `pnpm --dir skills/dossier-engineer run lint` — PASS
- `pnpm --dir skills/dossier-engineer run test` — PASS
- `git diff --check -- skills/dossier-engineer` — PASS

### Reviews

- Spec/process review against [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md) and [refactoring-plan-2.ru.md](refactoring-plan-2.ru.md) — PASS
- Code review — PASS
- Security review — PASS

### Commit

- Commit: `360768d` `refactor(dossier-engineer): harden intake and next-step contracts`
- Total time to close package: about 16 minutes (`2026-04-08 16:58:00 CEST` -> `2026-04-08 17:14:10 CEST`)
