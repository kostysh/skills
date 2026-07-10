# Verification loop

Use this reference before implementing multi-step changes or when deciding how to prove a change worked.

## Define the target in verifiable terms

Translate vague goals into checks you can actually perform.

Examples:

- "Fix the bug" -> identify a reproduction or a failing test, then make it pass.
- "Add validation" -> define which invalid inputs must now be rejected and how that will be checked.
- "Refactor safely" -> identify the invariants that must still pass before and after the change.

## Keep the plan short and testable

For non-trivial work, use a short loop:

1. change something concrete;
2. run the narrowest meaningful verification;
3. only continue if the verification result is understood.

Good plan shape:

1. update X -> verify with Y
2. update Z -> verify with Q

Bad plan shape:

1. refactor everything
2. make it work

For low-risk non-trivial logic such as a branch, loop, parser, or formatting rule, the smallest useful check is enough when it would fail on the behavior regression. This can be a targeted unit test, smoke command, or local self-check that matches repository conventions.

Do not downshift high-risk paths to a minimal self-check. Security, privacy, money, data-loss, auth, accessibility, release, and production-wiring changes need the stronger project or domain verification that proves the real boundary.

## Report evidence, not vibes

In the final report:

- say which checks ran;
- say which checks passed;
- say what was not checked;
- say whether any residual risk remains.

If verification could not be run, treat that as a real limitation, not as a minor footnote.

## Audit remediation matrix

When implementing from an accepted audit or review report, track each accepted finding or recommendation as:

```text
finding/recommendation -> concrete change -> test/evidence -> status
```

Allowed statuses:

- `implemented` — change exists but has not yet been proven by the agreed evidence.
- `verified` — change exists and the named evidence passed.
- `blocked-by-compatibility` — implementation would break a required compatibility constraint.
- `deferred-by-trigger` — recommendation applies only when a specified trigger occurs; name the current shortcut ceiling, the trigger, and the evidence needed when the trigger is hit.
- `not-applicable` — the finding does not apply to the current system, with reason.

## Match the remediation claim to status

Treat the matrix as traceability, not as proof of closure.

- Claim that all applicable findings are fixed and verified only when every applicable finding is `verified`.
- Report `not-applicable` entries separately as justified exclusions; do not describe them as fixes.
- If any entry is `blocked-by-compatibility`, describe the overall remediation as blocked and incomplete and name the compatibility boundary.
- Otherwise, if any entry is `deferred-by-trigger`, describe the overall remediation as partial and deferred and name the revisit trigger.
- Otherwise, if any entry is `implemented`, describe the result as implemented but not verified.

Do not treat tooling, wrappers, metadata, config, migrations, tests, docs, or other substrate as runtime capability without observable behavior and acceptance evidence.
