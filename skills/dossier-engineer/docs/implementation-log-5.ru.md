# Implementation Log 5: cross-skill UX corrective pass

## Scope

- workflow stage vs shipped CLI command wording
- dossier stage closure vs backlog actualization sequencing
- bootstrap wording consistency
- historical backlog gap-analysis de-staling
- source-set escalation wording
- review fallback wording
- docs-guard coverage for the corrected contract

## Start

- Date: `2026-04-08`
- Time: `Europe/Rome`
- Start marker: after external cross-skill UX audit findings were accepted and Variant A was chosen for dossier-stage closure vs backlog actualization ordering

## Normative source

- [cross-skill-process-model.ru.md](cross-skill-process-model.ru.md)

## Supporting planning sources

- [refactoring-plan-4.ru.md](refactoring-plan-4.ru.md)

## Decisions / assumptions beyond the model

- None. The pass only literalizes already accepted process decisions.

## Local acceptance

- `git diff --check -- skills/dossier-engineer skills/backlog-engineer` -> PASS
- `pnpm --dir skills/dossier-engineer run format:check` -> PASS
- `pnpm --dir skills/dossier-engineer run lint` -> PASS
- `pnpm --dir skills/dossier-engineer run test` -> PASS
- `pnpm --dir skills/backlog-engineer run format:check` -> PASS
- `pnpm --dir skills/backlog-engineer run lint` -> PASS
- `pnpm --dir skills/backlog-engineer run test` -> PASS

## External review

- Narrow operator UX audit on the changed doc/process scope -> three findings
- Follow-up fixes:
  - aligned implementation-stage closure order so backlog actualization happens before `dossier-step-close`
  - labeled dossier stage names as workflow stages in backlog-facing flows and in the cross-skill process model
  - made the historical backlog gap-analysis fully non-normative and removed stale live-remediation wording
- Narrow operator UX re-audit on the scoped delta -> PASS
- Narrow agent UX audit on the changed doc/process scope -> three overlapping findings
- Follow-up fixes reused the same scoped delta above; no new model decisions were needed
- Narrow agent UX re-audit on the scoped delta -> PASS

## Close status

- Package status: ready to commit
- Total close time: exact duration unavailable because the log file was created after the corrective pass had already started
