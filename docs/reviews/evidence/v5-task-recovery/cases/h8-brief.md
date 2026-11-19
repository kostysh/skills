# P-34 — Archive validation

The accepted action is one run of `sh bin/validate-archive`. The next operator must be able to establish the run's outcome and decide whether to take the proposed change to review after a session interruption. The command can finish after the launching session ends. Source `brief.md`, task P-34. Git HEAD identifies this checkout. Put the local task state and any receipts under the ignored `.task/` directory and use `development-log.md` for closed work. The owner sets a 35-line task-state limit. A second run is outside the accepted task.
