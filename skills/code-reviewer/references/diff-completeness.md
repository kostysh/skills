# Review Basis and Diff Completeness

Read this file on every review. A complete diff is useful only when it belongs to a reproducible target and remains unchanged through the verdict.

## Review-basis Authority

Resolve target, base, and scope in this order:

1. explicit target, base, range, or scope supplied by the user;
2. unambiguous PR, commit, or change metadata attached to the request;
3. repository-declared review or merge convention;
4. one unambiguous VCS comparison available from the current repository state.

Do not silently choose between multiple plausible bases or targets. Return `blocked` and request the missing authority. When only part of an otherwise valid target can be inspected, return `limited` and name the excluded surface.

## Read-only and Snapshot Rules

- Review is read-only by default.
- For an immutable commit, PR head/base pair, or commit range, record the exact identities.
- For a working tree, record the base, all staged, unstaged, and in-scope untracked files, the changed-file list or diffstat, and an aggregate content hash or equivalent reproducible snapshot identity.
- Capture identity before reviewing and compare it again immediately before reporting.
- For a combined review-and-fix request, complete the review first. The first remediation mutation makes that verdict stale and requires a fresh or bounded delta review.

## Rules

- Do not finalize findings until every changed file is accounted for.
- If CLI diff output truncates, recover coverage by reading changed files directly.
- Do not finalize findings or a recommendation while target authority is unresolved or the snapshot is moving.

## Remediation Re-audit Scope

For a remediation re-audit, record the prior reviewed snapshot, fixed findings, current stable snapshot, and exact remediation delta. Re-run each original failure path and inspect the adjacent regression surface identified by the change's blast radius. Do not re-read or re-audit unchanged full scope that the prior review already verified.

Widen to a fresh review when the claim, source authority, public behavior, or material scope changed, when unrelated changes overlap the evidence boundary, or when the blast radius cannot be bounded. A cosmetic or text-only diff does not close a behavioral finding without evidence against its original failure path.

## Minimum Sequence

1. Resolve target, base, and scope using the authority order above.
2. Record the starting snapshot identity.
3. Read the full diff and list all changed files.
4. For any truncated file, read the file directly until every changed hunk is visible.
5. Keep a reviewed-files list and explicit exclusions.
6. Compare the ending snapshot identity with the starting identity.
7. Before final output, state:
   - target, base, and snapshot identity
   - which files were reviewed
   - which areas were high risk
   - which areas, if any, could not be fully verified

## Pre-Conclusion Audit

Before finalizing:

- every changed file has been seen
- deleted tests or config files were checked, not skipped
- no finding depends on an unseen hunk
- unverifiable areas are called out explicitly
- ending snapshot identity matches the starting identity; otherwise the result is stale and cannot approve
