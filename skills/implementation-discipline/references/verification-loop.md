# Verification loop

Read this reference before implementing multi-step changes or when deciding how to prove that a change worked.

## Define proof before expanding the solution

Translate the requested behavior or preserved invariant into the narrowest check that would fail if the implementation were wrong.

Examples:

- “Fix the bug” → reproduce the failure or make a focused regression test fail, then make it pass.
- “Add validation” → name the rejected inputs and verify the observable rejection behavior.
- “Refactor safely” → identify and run the checks that protect unchanged behavior.

Do not add extra abstractions merely to create a test seam when the behavior can be checked directly with existing project conventions. If the proposed verification contour is larger than the source-authorized change, revisit the claim and design before adding a runner, harness, instrumentation, background process, or production seam. Mark an edge unproven when necessary instead of manufacturing runtime scope for test convenience.

## Use proportional evidence

For a multi-step change, keep the loop short:

1. make one concrete change;
2. run the narrowest meaningful verification;
3. continue only when the result is understood.

A focused unit test, smoke command, or local self-check is sufficient for low-risk logic when it would fail on the relevant regression. Security, privacy, money, data loss, auth, accessibility, release, migration, and production-wiring paths require stronger project or domain evidence at the real boundary.

If the intended check cannot run, use the next-best static or behavioral check and report exactly what remains unproven. Tests, mocks, schemas, wrappers, logs, and documentation prove only their own boundary; they do not prove a broader runtime capability.

## Accepted-audit remediation matrix

Use this section only when implementing accepted findings or recommendations from an audit or review. Track each item as:

```text
finding/recommendation -> concrete change -> test/evidence -> status
```

Allowed statuses:

- `implemented` — the change exists but the agreed evidence has not passed.
- `verified` — the change exists and the named evidence passed.
- `blocked-by-compatibility` — implementation would violate a required compatibility boundary.
- `deferred-by-trigger` — the item applies only when a concrete trigger occurs; name the current ceiling, trigger, and evidence required then.
- `not-applicable` — the item does not apply, with a reason.

Match the overall claim to unresolved status in this order:

1. any `blocked-by-compatibility` → blocked and incomplete;
2. otherwise any `deferred-by-trigger` → partial and deferred;
3. otherwise any `implemented` → implemented but unverified;
4. all applicable items `verified` → fixed and verified.

Report `not-applicable` items separately as justified exclusions, not as fixes. Do not treat a populated matrix as closure evidence by itself.
