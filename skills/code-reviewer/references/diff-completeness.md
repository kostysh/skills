# Review Basis and Diff Completeness

Read this file on every review. A complete diff is useful only when it belongs to a reproducible target and remains unchanged through the verdict.

## Review-basis Authority

Resolve target, base, and scope in this order:

1. explicit target, base, range, or scope supplied by the user;
2. unambiguous PR, commit, or change metadata attached to the request;
3. repository-declared review or merge convention;
4. one unambiguous VCS comparison available from the current repository state.

Do not silently choose between multiple plausible bases or targets. Return `blocked` and request the missing authority. When only part of an otherwise valid target can be inspected, return `limited` and name the excluded surface.

An explicit snippet or repository scope can be reviewed without a comparison base. Record the supplied text or file-set identity and mark the base not applicable; do not force a diff or general merge review onto complexity-only work.

## Read-only and Snapshot Rules

- Review is read-only by default.
- For an immutable commit, PR head/base pair, or commit range, record the exact identities.
- For a working tree, record the base, all staged, unstaged, and in-scope untracked files, the changed-file list or diffstat, and an aggregate content hash or equivalent reproducible snapshot identity.
- Capture identity before reviewing and compare it again immediately before reporting.
- For a combined review-and-fix request, complete the review first. The first remediation mutation makes that verdict stale and requires a fresh or bounded delta review.

## Rules

- Account for every in-scope file as inspected or explicitly unavailable before reporting; these are different evidence states.
- If CLI diff output truncates, recover coverage by reading changed files directly.
- Do not approve an unresolved or moving target. Preserve findings tied to any independently stable, assessable part and explain which requested conclusion remains blocked or limited.

## Remediation Re-audit Scope

For a remediation re-audit, record the prior reviewed snapshot, fixed findings, current stable snapshot, and exact remediation delta. Re-run each original failure path and inspect the adjacent regression surface identified by the change's blast radius. Do not re-read or re-audit unchanged full scope that the prior review already verified.

An accepted behavioral correction stays within re-audit when it changes only the agreed failure path and bounded adjacent contracts. Widen only when the delta leaves that accepted boundary, changes dependent contracts outside it, introduces unrelated behavior affecting the conclusion, or has an unbounded blast radius. Name the extra surface and obtain missing scope authority before reviewing it. A cosmetic or text-only diff does not close a behavioral finding without evidence against its original failure path.

## Minimum Sequence

1. Resolve target, base, and scope using the authority order above.
2. Record the starting snapshot identity.
3. Read the available diff and list all changed files; for a non-diff scope use the explicitly supplied file set or snippet.
4. Recover truncated files directly when available; record any remaining unseen content as a coverage limit instead of implying it was checked.
5. Keep a reviewed-files list and explicit exclusions.
6. Compare the ending snapshot identity with the starting identity.
7. Before final output, state:
   - target, base, and snapshot identity
   - which files were reviewed
   - which areas were high risk
   - which areas, if any, could not be fully verified

## Pre-Conclusion Audit

Before finalizing:

- every changed file is accounted for; any unread file is an explicit coverage limit
- deleted tests or config files were inspected when available, and unavailable content is not claimed as checked
- no finding depends on an unseen hunk
- unverifiable areas are called out explicitly
- ending snapshot identity matches the starting identity; otherwise the result is stale and cannot approve

A stable partial review may finish with confirmed findings and `limited`. State any known merge blocker explicitly; a coverage limit does not clear it. Clean approval requires sufficient coverage and evidence for the full declared merge boundary.
