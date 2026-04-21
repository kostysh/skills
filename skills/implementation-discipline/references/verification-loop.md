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

## Report evidence, not vibes

In the final report:

- say which checks ran;
- say which checks passed;
- say what was not checked;
- say whether any residual risk remains.

If verification could not be run, treat that as a real limitation, not as a minor footnote.
