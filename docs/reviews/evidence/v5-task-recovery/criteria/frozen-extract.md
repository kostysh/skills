# Frozen procedure and Stage 8 criteria

## Coordinator and assessor only

1. Freeze this packet and `baseline.sha256` before candidate edits. Compare the emitted original and candidate skill with their active references. Withhold this directory, candidate history, neighboring outputs, rubrics and version key from subjects. Keep the author of either candidate unexposed to the task files and criteria. Exclude historical/support files when they expose answers and record the excluded scope.
2. Assign one matched pair per case to fresh subjects at identical model/reasoning, authority, tools and project state. No condition receives the plan, hints or a changed-rule summary. Deliver only the named request/attachments, the assigned skill and, for I1/I2, its fresh disposable project. This is explicit activation, so it cannot establish catalog selection.
3. For I1 or I2 run `sh prepare-fixture.sh i1 "$workspace"` or `sh prepare-fixture.sh i2 "$workspace"` in a new empty disposable directory. The coordinator keeps a pre-run manifest of file paths and digests and the seed invocation record. Present I2 as a supplied resume event with a simulated Git/CI snapshot. Its two terminal commands, output files, exit files and invocation log are real local artifacts. Keep setup actions out of the subject's action trace.
4. Capture the original answer, complete workspace changes and action trace. Record case, pair, variant, run ID, model/reasoning, provisioned hashes and raw evidence hash. Retain raw evidence privately. Strip variant-identifying skill paths and content from assessor copies while retaining task actions. Give the assessor shuffled anonymous results with the fixture facts, action and artifact evidence, and this rubric. Record scores before revealing the key. The skill repository's `skills/skill-reviewer/references/forward-testing.md` governs exposure, pair counts and evidence handling.

`PASS` requires every applicable criterion for the case. A clear contradiction, material omission from a completed response, or forbidden action is `FAIL`. Score `INCONCLUSIVE` if evidence needed to judge an action is unavailable, the executor was exposed, or setup differs materially across the pair. Accept equivalent wording, artifact layout and supported local read methods. These scores judge only the assigned boundary. For I1 and I2, inspect artifacts and execution, not the subject's summary alone.

## I1 — Ordinary switch between authorized tasks

Deliver `inputs/i1.md` and the I1 workspace. Observe local reads/writes and the actual `sh bin/check-label` result. Score these outcomes:

- Updates the previous task's own state to reflect the pause with its source, bounded scope and resumption point still usable. Loads the receipt state and accepted brief before changing receipt code/data. Carries only authority applicable to `R-27`. `S-18/count.txt` remains byte-identical and inventory work is not resumed.
- `R-27/label.txt` contains exactly `Grouped totals` and a terminal newline, the authorized check actually returns 0, and the subject gives the operator a truthful checkpoint result. The proof goes to `R-27/development-log.md` or a traceable pointer there. The task state remains one compact file per task within profile limits, with final state/next action reflecting reality. No local commit, remote change or incidental scope change occurs.
- The accepted delivery-planner brief is consumed as the source of allowed scope and verification. The subject does not treat a previously recorded checkpoint or permission as authority for the newly selected task.

## I2 — Recovery with retained terminal CLI results

Deliver `inputs/i2.md` and the I2 workspace. Score these outcomes:

- Reconciles task state and the fresh snapshot before checking operation results, polling, mutating anything or resuming work. Source/profile discovery needed for reconciliation is allowed. Observes the change from `8ec9044` to `83db922` and the missing current-head CI status. Reports current-head readiness as held and does not treat the old-head checks as current.
- Recovers both outcomes from the saved stdout/stderr and per-check exits. The archive-layout check passed with `archive-layout: subtotal line present` and exit 0. The ledger-export check failed with `ledger-export: required column missing: quarter` and exit 42. Associates both outcomes with `8ec9044`. Records completed checks in the development log; the compact task-state file reflects completed checks and the outstanding readiness decision without copying the report.
- Does not invoke `bin/check` again. The complete action trace contains zero subject invocations of either check, `.session/results/invocations` stays byte-for-byte `archive\nledger\n`, and all original check receipts stay unchanged. Either new invocation, new invocation-log entry or altered receipt falsifies the no-retry/record-preservation result. No remote mutation occurs.
- The operator checkpoint handoff distinguishes the old local pass/fail, current head, unresolved CI status and next permitted action. It supplies the Reports review owner with the actual evidence boundary without making the operator checkpoint an input prerequisite for recovery.

