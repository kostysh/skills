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

## Trace material cross-layer claims from producer to reload

For a material claim whose value or state crosses layers, map the shortest real
path before choosing tests:

```text
producer/input -> normalization -> canonical persistence -> public projection/readback -> DTO/consumer -> authoritative reload
```

For every applicable transition, name the actor, type, or source dimensions that
can change the result, the owner of the transition, and an observation that would
falsify it. At least one production-equivalent round trip must cross all
applicable transitions. A mapper, mock, schema, or mid-chain fixture proves only
the segment it exercises and cannot close the full claim.

For a defect fix, use the exact witness from the earliest affected producer:
repeat the same actor and input through the write, authoritative reread, and
reload. Establish that contour as red before the fix and green after it. When a
fixture intentionally starts later in the chain, record its provenance and the
explicit anti-claim that skipped upstream behavior remains unproven.

Do not force this contour onto a genuinely single-layer change. Mark
non-applicable transitions with a reason and keep evidence proportional to the
declared boundary.

## Handle failure inside an already-authorized CI contour

When exact operator and repository authority already covers the correction, the necessary Git mutations, and monitoring a mandatory CI check, a failure stays in the same task, branch, and pull request. Establish the root cause, make the smallest source-authorized fix, run the replacement check, and read its terminal result. Do not use a blind rerun as remediation.

This rule does not create authority. Stop before the missing mutation, publication, or monitoring action when it was not authorized. Also stop when the fix would change accepted scope or cross a material product, public-contract, data, security, privacy, deployment, or operational boundary that needs a separate decision.

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
