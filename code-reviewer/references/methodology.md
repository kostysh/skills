# Code Review Methodology

Use this file when the review scope is broad, the diff is large, or you need a disciplined pass order.

## Input Gathering

Before writing findings:

1. Identify the review target:
   - current branch
   - explicit file list
   - commit range
   - PR diff
2. Read the full diff.
3. List the changed files.
4. Flag high-risk files early:
   - migrations
   - auth or permission code
   - runtime config
   - background work
   - CI workflows
   - tests removed or weakened

If any diff output is truncated, read the touched files directly until every changed hunk is seen.

## Four Review Passes

### Pass 1: Correctness

Ask:

- Can this produce the wrong value or wrong side effect?
- Does the control flow still hold under empty, null, duplicate, reordered, or partial input?
- Is the new invariant actually enforced?
- Does async work race, retry incorrectly, or ignore cancellation?

### Pass 2: Design

Ask:

- Does the change fit the repo's architecture?
- Is complexity justified by the problem size?
- Are responsibilities clearer or more entangled?
- Did the change quietly widen a public contract?

### Pass 3: Tests and Operability

Ask:

- What behavior changed, and where is it tested?
- Are edge cases and failure paths covered?
- Are logs, metrics, retries, and rollout concerns handled?
- Would a rollback or emergency fix be obvious?

### Pass 4: Performance and Compatibility

Ask:

- Did the change add new work on hot paths?
- Can user-controlled input grow time, memory, or query count?
- Are there runtime, browser, schema, or API compatibility hazards?
- Does caching still stay coherent after writes?

## Evidence Standard

Do not report a finding until you can explain:

- the exact code path
- why the issue is real in the changed scope
- why nearby guards or tests do not already cover it
- what outcome can break in production

If you cannot support one of those points, downgrade it to a question or assumption.

## Completeness Audit

Before finalizing, quickly check:

- every changed file was reviewed
- every high-risk file class received at least one explicit pass
- deleted or rewritten tests were inspected, not just counted
- findings are ordered by severity, not by file order
- no finding is just a style preference in disguise

## Large Diff Handling

For very large diffs:

- identify the highest-risk slices first
- say explicitly where confidence is reduced
- prefer "review reliability is limited because X" over fake completeness

Large size is not itself a bug, but it is a reviewability risk worth mentioning when it affects confidence.
