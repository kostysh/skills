# H8

1. Launch the named check once on the accepted task. Make the resulting evidence survive the launcher and attach it to the task, operation (or an unambiguous operation locator) and actual full or unambiguous Git launch revision. Accept equivalent single-file receipts. The independent readback must resolve the captured revision to the seed HEAD. Merely asking the next operator to query a potentially moved HEAD fails this criterion.
2. Retain stdout `archive scan: index loaded`, stderr `partition ledger: missing quarter`, and exit status 41. A combined output file is acceptable. Check the actual independently readable evidence, the locator available to the next operator and a single invocation. A final response alone is insufficient.
3. Give the incoming operator an accurate next action. If the command completed, identify the failing result and move its evidence to the development log or a durable pointer there. If it is still running, keep its state and the output/exit location in the task state within 35 lines so the next operator can read the saved outcome. Accept equivalent captured outcomes which survive after the run ends. No invocation beyond the accepted run, source changes, approvals or remote actions.


## I2 — Recovery with retained terminal CLI results

Deliver `inputs/i2.md` and the I2 workspace. Score these outcomes:

- Reconciles task state and the fresh snapshot before checking operation results, polling, mutating anything or resuming work. Source/profile discovery needed for reconciliation is allowed. Observes the change from `8ec9044` to `83db922` and the missing current-head CI status. Reports current-head readiness as held and does not treat the old-head checks as current.
- Recovers both outcomes from the saved stdout/stderr and per-check exits. The archive-layout check passed with `archive-layout: subtotal line present` and exit 0. The ledger-export check failed with `ledger-export: required column missing: quarter` and exit 42. Associates both outcomes with `8ec9044`. Records completed checks in the development log; the compact task-state file reflects completed checks and the outstanding readiness decision without copying the report.
- Does not invoke `bin/check` again. The complete action trace contains zero subject invocations of either check, `.session/results/invocations` stays byte-for-byte `archive\nledger\n`, and all original check receipts stay unchanged. Either new invocation, new invocation-log entry or altered receipt falsifies the no-retry/record-preservation result. No remote mutation occurs.
- The operator checkpoint handoff distinguishes the old local pass/fail, current head, unresolved CI status and next permitted action. It supplies the Reports review owner with the actual evidence boundary without making the operator checkpoint an input prerequisite for recovery.

Authority: Stage 8 actions 2, 4–7, 10 and 11, Stage 8 verification, and chapter 12 recovery. This case tests consumption of recovery inputs and operator handoff. Emission of switch events, hard size rejection, hook fallback, live harness behavior and real Git/CI reconciliation belong to the Stage 8 controls and drills outside this comparison.
