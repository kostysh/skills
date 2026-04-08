# Implementation Log 1: `dossier-engineer` harmonization

## Package 1 — Textual refactor of the skill contract

- Start time: 2026-04-08 Europe/Rome
- Normative process source: [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)
- Supporting planning sources:
  - [dossier-process-gap-analysis.ru.md](dossier-process-gap-analysis.ru.md)
  - [backlog-process-gap-analysis.ru.md](backlog-process-gap-analysis.ru.md)
  - [refactoring-plan-1.ru.md](refactoring-plan-1.ru.md)
- Scope:
  - rewrite `dossier-engineer` as a backlog-driven downstream skill
  - remove `feature-discovery`
  - remove candidate-backlog surfaces from docs and templates
  - narrow `next-step` to dossier-local workflow only
  - define explicit backlog-status actualization via `backlog-engineer`

### Decisions / assumptions beyond the current process model

- None at package start.

### Local acceptance

- `git diff --check -- skills/dossier-engineer` -> PASS
- grep audit on active skill/reference/example surfaces confirmed:
  - no active `feature-discovery` contract remains;
  - no active `feature-candidates.md` / `FEATURE_CANDIDATES_TEMPLATE.md` surface remains;
  - `next-step` is now described as dossier-local only.

### Review

- Spec/process conformance review against:
  - [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)
  - [dossier-process-gap-analysis.ru.md](dossier-process-gap-analysis.ru.md)
  - [refactoring-plan-1.ru.md](refactoring-plan-1.ru.md)
- Reviewer verdict: PASS
- Scope note: Package 1 only; runtime code intentionally excluded.

### Backlog-side checklist for stage 2

- `backlog-engineer` references should gain explicit dossier handoff examples after dossier runtime semantics are rewritten.
- backlog-side docs should later mirror the dossier-side status actualization checkpoints (`specified`, `planned`, `implemented`).
- backlog-side examples should eventually show selected-work handoff into `feature-intake` instead of any legacy candidate wording.

### Close-out

- Package end time: 2026-04-08T16:04:38+02:00
- Total time to close package: about 10 minutes
- Pending before commit: none
