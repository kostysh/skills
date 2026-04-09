# Implementation Log 7: `change-proposal` cross-skill hardening

## Package P1 — dossier-side classifier and stage contract

```yaml
package_id: P1
cycle_id: change-proposal-hardening-1
skill: dossier-engineer
package_type: docs
change_kind:
  - process-contract
  - references
  - docs-tests
normative_sources:
  - docs/change-proposal-cross-skill-use-cases.ru.md
  - docs/cross-skill-process-model.ru.md
  - SKILL.md
  - references/workflow.md
  - references/workflow-stage-change-proposal.md
  - ../../backlog-engineer/SKILL.md
  - ../../backlog-engineer/references/operator-workflows.md
  - docs/refactoring-plan-6.ru.md
start_ts: 2026-04-09T19:37:12+02:00
ready_for_review_ts: 2026-04-09T19:40:20+02:00
final_pass_ts: 2026-04-09T19:45:58+02:00
session_id: 019d3d53-b9a0-7811-974f-27688bba0eb7
review_policy:
  spec: required
  code: skipped
  security: skipped
review_rounds: 3
review_findings_total: 2
out_of_spec_decisions_total: 0
duration_minutes: 9
log_quality:
  start_captured: true
  commit_recorded: false
  duration_exact: false
```

## Scope

- add explicit dossier-side `backlog impact verdict` to `Workflow stage: change-proposal`
- define literal verdict criteria and precedence for mixed source+work cases
- tie non-`no-op` verdicts to backlog actualization before stage closure
- sync compact workflow guidance and docs-contract guards

## Decisions / assumptions beyond the current model

### Spec gap decisions

- None yet.

### Implementation freedom decisions

- None yet.

### Temporary assumptions

- Package 2 may remain docs/spec-only if existing `contract-drift-audit` cannot provide a safe support hint without inventing new semantics.

## Review events

- 2026-04-09T19:40:20+02:00 `spec` requested
- 2026-04-09T19:43:09+02:00 `spec` non-compliant
  - `no-op` criteria treated any canonical-source change too broadly and risked unnecessary backlog actualization for ordinary dossier wording edits
- 2026-04-09T19:43:54+02:00 follow-up applied
- 2026-04-09T19:44:54+02:00 `spec` non-compliant
  - dossier-local ADR changes still left a loophole between wording edits and backlog-relevant source updates
- 2026-04-09T19:45:20+02:00 follow-up applied
- 2026-04-09T19:45:58+02:00 `spec` pass

## Process misses

- none at package start

## Local acceptance

- `git diff --check -- skills/dossier-engineer/SKILL.md skills/dossier-engineer/references/workflow-stage-change-proposal.md skills/dossier-engineer/references/workflow.md skills/dossier-engineer/test/docs-contract.test.ts skills/dossier-engineer/docs/implementation-log-7.ru.md` -> PASS
- `node --experimental-strip-types --test skills/dossier-engineer/test/docs-contract.test.ts` -> PASS

## Close-out

- Package status: review-pass, not yet committed

## Package P2 — runtime boundary docs for `contract-drift-audit`

```yaml
package_id: P2
cycle_id: change-proposal-hardening-1
skill: dossier-engineer
package_type: docs
change_kind:
  - utility-spec
  - utility-architecture
  - docs-tests
normative_sources:
  - docs/change-proposal-cross-skill-use-cases.ru.md
  - docs/cross-skill-process-model.ru.md
  - docs/refactoring-plan-6.ru.md
  - docs/utility-spec.ru.md
  - docs/utility-architecture.md
start_ts: 2026-04-09T19:46:06+02:00
ready_for_review_ts: 2026-04-09T19:47:07+02:00
final_pass_ts: 2026-04-09T19:47:21+02:00
session_id: 019d3d53-b9a0-7811-974f-27688bba0eb7
review_policy:
  spec: required
  code: skipped
  security: skipped
review_rounds: 1
review_findings_total: 0
out_of_spec_decisions_total: 0
duration_minutes: 1
log_quality:
  start_captured: true
  commit_recorded: false
  duration_exact: false
```

## Scope

- define `contract-drift-audit` as a support signal rather than the authoritative `backlog impact verdict`
- keep package 2 docs/spec-only instead of inventing new runtime semantics
- sync utility docs with docs-contract coverage

## Decisions / assumptions beyond the current model

### Spec gap decisions

- None yet.

### Implementation freedom decisions

- Existing `contract-drift-audit` signals are insufficiently precise for authoritative backlog branching, so package 2 stays docs/spec-only.

### Temporary assumptions

- A future cycle may add a runtime hint only if it can remain clearly secondary to the stage-level verdict.

## Review events

- 2026-04-09T19:47:07+02:00 `spec` requested
- 2026-04-09T19:47:21+02:00 `spec` pass
- 2026-04-09T19:47:39+02:00 `ux-agent` pass
- 2026-04-09T19:47:52+02:00 `ux-operator` pass

## Process misses

- local docs-contract guard initially asserted an English phrase against a Russian spec section; fixed before external review

## Local acceptance

- `git diff --check -- skills/dossier-engineer/docs/utility-spec.ru.md skills/dossier-engineer/docs/utility-architecture.md skills/dossier-engineer/test/docs-contract.test.ts` -> PASS
- `node --experimental-strip-types --test skills/dossier-engineer/test/docs-contract.test.ts` -> PASS

## Close-out

- Package status: review-pass, not yet committed
