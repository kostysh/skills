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

## Package 2 — Utility/runtime refactor

- Start time: 2026-04-08T16:08:00+02:00
- Normative process source: [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)
- Supporting planning sources:
  - [dossier-process-gap-analysis.ru.md](dossier-process-gap-analysis.ru.md)
  - [backlog-process-gap-analysis.ru.md](backlog-process-gap-analysis.ru.md)
  - [refactoring-plan-1.ru.md](refactoring-plan-1.ru.md)
- Scope:
  - remove candidate backlog and `feature-discovery` from the CLI contract
  - make `next-step` dossier-local only
  - align runtime help, utility spec, architecture doc, and tests

### Decisions / assumptions beyond the current process model

- `next-step` remains a dossier command. When no active dossier is available, it should not emulate backlog selection; it should return a dossier-local blocker that tells the operator to return to `backlog-engineer`.

### Local acceptance

- `pnpm --dir skills/dossier-engineer run format` -> PASS
- `pnpm --dir skills/dossier-engineer run lint` -> PASS
- `pnpm --dir skills/dossier-engineer run test` -> PASS
- `git diff --check -- skills/dossier-engineer` -> PASS

### Review

- Spec/process conformance review against:
  - [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)
  - [dossier-process-gap-analysis.ru.md](dossier-process-gap-analysis.ru.md)
  - [refactoring-plan-1.ru.md](refactoring-plan-1.ru.md)
  - [../SKILL.md](../SKILL.md)
  - [../references/WORKFLOW.md](../references/WORKFLOW.md)
- Initial verdict: non-compliant
  - gap: no active `feature-intake` runtime/spec/test surface
  - gap: `utility-architecture.md` overstated `src/core/workflow.ts` intake role
- Follow-up:
  - added `feature-intake` runtime command
  - updated utility spec with active `feature-intake` contract
  - narrowed `next-step` to dossier-local blocker fallback when no dossier exists
  - added CLI coverage for `feature-intake` happy path and output-boundary rejection
- Final spec/process verdict: PASS
- Code review: initial finding on `--output` escaping `docs/features`; fixed and re-reviewed to PASS
- Security review: initial finding on `--output` path escape; fixed and re-reviewed to PASS

### Close-out

- Package end time: 2026-04-08T16:24:23+02:00
- Total time to close package: about 16 minutes
- Commit target: `refactor(dossier-engineer): align runtime with backlog-driven workflow`
