# Implementation Log 5: `change-proposal` backlog-side harmonization

## Package P1 — verdict-driven backlog branches in skill and references

```yaml
package_id: P1
cycle_id: change-proposal-hardening-2
skill: backlog-engineer
package_type: docs
change_kind:
  - process-contract
  - references
  - docs-tests
normative_sources:
  - ../../dossier-engineer/docs/change-proposal-cross-skill-use-cases.ru.md
  - ../../dossier-engineer/docs/cross-skill-process-model.ru.md
  - SKILL.md
  - references/operator-workflows.md
  - references/command-reference.md
  - docs/refactoring-plan-6.ru.md
start_ts: 2026-04-09T19:57:23+02:00
ready_for_review_ts: 2026-04-09T20:01:35+02:00
final_pass_ts: 2026-04-09T20:04:09+02:00
session_id: 019d3d53-b9a0-7811-974f-27688bba0eb7
review_policy:
  spec: required
  code: skipped
  security: skipped
review_rounds: 2
review_findings_total: 2
out_of_spec_decisions_total: 0
duration_minutes: 7
log_quality:
  start_captured: true
  commit_recorded: false
  duration_exact: false
```

## Scope

- make dossier-side `backlog impact verdict` a literal backlog-side branch selector
- document `no-op`, `patch existing item`, `source update`, and `new backlog item` in skill and references
- add shared-source and implemented-history guards
- sync docs-contract coverage

## Decisions / assumptions beyond the current model

### Spec gap decisions

- None yet.

### Implementation freedom decisions

- Keep this cycle docs/spec-only; do not invent new backlog runtime outputs for `change-proposal`.

### Temporary assumptions

- Operator-visible mutation confirmation remains command-driven rather than a new unified `change-proposal` runtime summary.

## Review events

- 2026-04-09T20:01:35+02:00 `spec` requested
- 2026-04-09T20:02:05+02:00 `spec` pass
- 2026-04-09T20:02:18+02:00 `ux-operator` findings
  - `source update` branch start was still not predictable enough from the operator handoff
  - implemented-item delta rule still left an escape hatch in `SKILL.md`
- 2026-04-09T20:02:34+02:00 `ux-agent` findings
  - implemented-item delta rule still left hidden inference
  - operator-facing `source update` wording was still slightly compressed
- 2026-04-09T20:03:18+02:00 follow-up applied
- 2026-04-09T20:03:36+02:00 narrow `spec` requested
- 2026-04-09T20:03:49+02:00 narrow `spec` pass
- 2026-04-09T20:04:00+02:00 narrow `ux-agent` pass
- 2026-04-09T20:04:05+02:00 narrow `ux-operator` pass

## Process misses

- none at package start

## Local acceptance

- `git diff --check -- skills/backlog-engineer` -> PASS
- `node --experimental-strip-types --test skills/backlog-engineer/test/docs-contract.test.ts` -> PASS

## Close-out

- Package status: review-pass, not yet committed

## Package P2 — utility-spec guards for mature and shared-source changes

```yaml
package_id: P2
cycle_id: change-proposal-hardening-2
skill: backlog-engineer
package_type: docs
change_kind:
  - utility-spec
  - docs-tests
normative_sources:
  - ../../dossier-engineer/docs/change-proposal-cross-skill-use-cases.ru.md
  - ../../dossier-engineer/docs/cross-skill-process-model.ru.md
  - docs/refactoring-plan-6.ru.md
  - docs/utility-spec.ru.md
start_ts: 2026-04-09T19:57:23+02:00
ready_for_review_ts: 2026-04-09T20:01:35+02:00
final_pass_ts: 2026-04-09T20:04:09+02:00
session_id: 019d3d53-b9a0-7811-974f-27688bba0eb7
review_policy:
  spec: required
  code: skipped
  security: skipped
review_rounds: 2
review_findings_total: 2
out_of_spec_decisions_total: 0
duration_minutes: 7
log_quality:
  start_captured: true
  commit_recorded: false
  duration_exact: false
```

## Scope

- fix backlog-side invariants for ADR/source updates, delta over implemented work, and shared-source partial-sync prohibition
- keep runtime boundary literal in utility-spec rather than inventing new command semantics

## Decisions / assumptions beyond the current model

### Spec gap decisions

- None yet.

### Implementation freedom decisions

- None yet.

### Temporary assumptions

- Package 2 will stay docs/spec-only unless Package 1 exposes an unavoidable runtime contradiction.

## Review events

- 2026-04-09T20:01:35+02:00 `spec` requested
- 2026-04-09T20:02:05+02:00 `spec` pass
- 2026-04-09T20:02:18+02:00 `ux-operator` findings
  - utility-spec still needed the same `source update` first-action split and stronger implemented-item delta wording
- 2026-04-09T20:02:34+02:00 `ux-agent` findings
  - utility-spec/test wording still lagged the follow-up contract
- 2026-04-09T20:03:18+02:00 follow-up applied
- 2026-04-09T20:03:36+02:00 narrow `spec` requested
- 2026-04-09T20:03:49+02:00 narrow `spec` pass
- 2026-04-09T20:04:00+02:00 narrow `ux-agent` pass
- 2026-04-09T20:04:05+02:00 narrow `ux-operator` pass

## Process misses

- none observed after package start

## Local acceptance

- `git diff --check -- skills/backlog-engineer` -> PASS
- `node --experimental-strip-types --test skills/backlog-engineer/test/docs-contract.test.ts` -> PASS

## Close-out

- Package status: review-pass, not yet committed
