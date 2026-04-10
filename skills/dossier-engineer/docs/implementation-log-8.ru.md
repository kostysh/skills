# Implementation log 8: workflow-stage logging policy

```yaml
package_id: P1
cycle_id: workflow-stage-logging-policy
skill: dossier-engineer
package_type: docs
change_kind:
  - process-contract
  - references
  - docs-tests
normative_sources:
  - docs/issues/2026-04-10-spec-and-planning-log-policy-gap.ru.md
  - docs/refactoring-plan-7.ru.md
  - SKILL.md
  - references/workflow-stage-spec-compact.md
  - references/workflow-stage-plan-slice.md
  - references/workflow-stage-implementation.md
session_id: 019d3d53-b9a0-7811-974f-27688bba0eb7
start_ts: 2026-04-10T14:38:52+02:00
ready_for_review_ts: 2026-04-10T14:45:09+02:00
final_pass_ts: 2026-04-10T14:50:08+02:00
commit_ts: omitted
commit_sha: omitted
review_policy:
  spec: required
  code: skipped
  security: skipped
review_rounds: 2
review_findings_total: 1
process_misses_total: 1
duration_minutes: 11
log_quality:
  start_captured: false
  late_start: true
  commit_recorded: false
  duration_exact: true
```

## Scope

Имплементация `docs/refactoring-plan-7.ru.md`: единая активная политика логирования для `spec-compact`, `plan-slice` и `implementation`.

## Inputs actually used

- `docs/issues/2026-04-10-spec-and-planning-log-policy-gap.ru.md`
- `docs/refactoring-plan-7.ru.md`
- `SKILL.md`
- `references/implementation-logging.md`
- `references/workflow-stage-spec-compact.md`
- `references/workflow-stage-plan-slice.md`
- `references/workflow-stage-implementation.md`
- `test/docs-contract.test.ts`
- `docs/README.md`

## Decisions / reclassifications

- Единая policy создается как `references/workflow-stage-logging.md`.
- `references/implementation-logging.md` удаляется как отдельный активный reference после переноса полезных правил.
- Runtime behavior утилиты не меняется; меняются skill docs, reference docs, docs-contract tests и навигация docs.

## Review events

- 2026-04-10T14:45:09+02:00 `spec/process` review ready; external auditor pending.
- 2026-04-10T14:47:00+02:00 `spec/process` review returned NOT PASS.
  Finding: docs-contract negative assertion did not include the active `workflow-stage-logging.md` text.
- 2026-04-10T14:48:32+02:00 follow-up applied.
  Fix: included `loggingPolicy` in the active-text negative assertion set.
- 2026-04-10T14:50:08+02:00 narrow `spec/process` re-audit returned PASS.

## Process misses

- Лог открыт после первых мутаций, а не до них. Причина: требование локального `docs/AGENTS.md` было повторно учтено после начала основного patch. Это зафиксировано как `late_start: true`.

## Checks

- `pnpm --filter @kostysh/dossier-engineer-cli format:check` — pass.
- `pnpm --filter @kostysh/dossier-engineer-cli lint` — pass.
- `pnpm --filter @kostysh/dossier-engineer-cli test` — pass, 38 tests.
- `git diff --check` — pass.
- After follow-up: `pnpm --filter @kostysh/dossier-engineer-cli format:check` — pass.
- After follow-up: `pnpm --filter @kostysh/dossier-engineer-cli lint` — pass.
- After follow-up: `pnpm --filter @kostysh/dossier-engineer-cli test` — pass, 38 tests.
- After follow-up: `git diff --check` — pass.

## Close-out

- External spec/process audit reached PASS.
- `commit_sha` is omitted inside this log because a commit cannot contain its own hash. The final commit hash is reported in the close-out response after commit.
