## Overview

`gh-utility` is a use-case guide for the installed GitHub CLI. It does not ship or require a
wrapper, proxy, helper CLI, runtime, or alternate transport.

For each task, identify the GitHub host and target resource, choose the narrowest native `gh`
command, run it directly, and inspect its output. Use explicit `--repo`, `--hostname`, or owner
selectors whenever current-directory context could be ambiguous. After a mutation, run a fresh
native read command to verify the resulting GitHub state.

Apply the Authorization policy below to every operation and reference. Never infer code-review, CI-remediation,
security, or local-Git decisions that belong to specialized skills.
