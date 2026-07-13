# PR CI and review-state loop

Use this reference for GitHub-side pull-request state: mergeability, checks, Actions logs, review
threads, monitoring, replies, resolution, and merge transport. `gh-utility` does not decide code
findings or implement CI/review fixes. Route those decisions to `code-reviewer`, `gh-address-comments`,
or `gh-fix-ci` when available.

## Resolve and inspect

```bash
gh repo view --json nameWithOwner -q .nameWithOwner
gh pr view --json number,title,url,headRefName,baseRefName,isDraft,mergeable,mergeStateStatus,reviewDecision
gh pr checks
```

If no PR exists for the branch, stop as `blocked`. Keep three evidence dimensions separate:

1. mergeability and draft state;
2. review decision and unresolved thread state;
3. checks, pending work, and external-provider links.

Do not report merge readiness when any required dimension is missing or incomplete.

## Checks and logs

Use only fields listed by installed `gh pr checks --help`:

```bash
gh pr checks 123 --repo OWNER/REPO --json name,state,bucket,link,workflow,startedAt,completedAt
gh run view RUN_ID --repo OWNER/REPO --json name,workflowName,status,conclusion,url,event,headBranch,headSha
gh run view RUN_ID --repo OWNER/REPO --log-failed
```

The `bucket` field groups check state into pass, fail, pending, skipping, or cancel. Preserve pending
as pending; do not turn it into success. For external CI, report the linked provider and evidence
limit rather than scraping it without separate authority.

For an actionable failure, hand off the PR, failing check, run/log evidence, head SHA, and current
repository state to `gh-fix-ci` or the implementation owner. A GitHub-side inspection is not a fix.

## Review threads

Use `gh api graphql` when thread IDs or resolution state are required because `gh pr view` does not
expose them:

```bash
gh api graphql \
  -f query='query($owner:String!,$repo:String!,$number:Int!){repository(owner:$owner,name:$repo){pullRequest(number:$number){reviewThreads(first:100){nodes{id isResolved path line comments(first:100){nodes{id author{login} body url}}} pageInfo{hasNextPage endCursor}}}}}' \
  -F owner=OWNER -F repo=REPO -F number=123
```

If `pageInfo.hasNextPage` is true, repeat with a cursor before claiming completeness. Hand thread
content and current file context to the owning review/remediation skill.

Use `gh-address-comments` for reply and resolution workflows when available. If raw GraphQL is
required, use `gh api graphql` with variables for the explicitly authorized thread and verify it
with a fresh query.

## Monitoring

```bash
gh pr checks 123 --repo OWNER/REPO --watch --fail-fast
gh run watch RUN_ID --repo OWNER/REPO --exit-status
```

Wait only when the user requested monitoring. Human review gates, draft readiness, and informational
bots are not technical failures; report them separately.

## Merge transport

Before an authorized merge, refresh all three evidence dimensions. Merge strategy is a repository
or operator decision, not something `gh-utility` invents.

```bash
gh pr merge 123 --repo OWNER/REPO --squash
```

Run the command only when the exact PR and strategy are authorized. Verify resulting PR state and
remote branch state afterward. Remote branch deletion is a separate high-risk action that requires
exact authorization; do not add `--delete-branch` implicitly. Local branch deletion, rebases,
commits, force-with-lease, and worktree decisions belong to `git-engineer`.

## Output

Report PR URL and head SHA, mergeability, review state, check state, thread completeness, commands
actually run, authorized GitHub mutations, verification, specialized handoff, and remaining human
or external-provider gates.
