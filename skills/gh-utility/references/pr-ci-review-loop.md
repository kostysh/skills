# PR CI and review-state loop

Use this reference for GitHub-side pull-request state: mergeability, checks, Actions logs, review
threads, monitoring, replies, resolution, and merge transport. `gh-utility` does not decide code
findings or implement CI/review fixes. Route those decisions to `code-reviewer`, `gh-address-comments`,
or `gh-fix-ci` when available.

## Resolve and inspect

```bash
gh repo view --json nameWithOwner -q .nameWithOwner
gh pr view --json number,title,url,headRefName,headRefOid,baseRefName,isDraft,mergeable,mergeStateStatus,reviewDecision
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

Wait only when the user requested monitoring. Select the check scope for the request. In watch
mode, use `--fail-fast` only if the first failure is enough to finish the task.

Keep one deadline when the task gives a time limit. Count connection, reconnects, fallback and
state reads against that limit. Reserve time for a final read and use the latest available
snapshot if the deadline prevents it. For a bounded wait, apply an external deadline to each
watch or repeat separate bounded reads. Pass only the remaining budget for that step to the
shell or tool. The native watches below have no deadline flag.

```bash
gh pr checks 123 --repo OWNER/REPO --watch
gh run watch RUN_ID --repo OWNER/REPO --exit-status
```

PR watch follows the checks GitHub has reported. It can exit with no pending checks before an
expected check appears. Read the checks separately with `gh pr checks --json name,bucket` for
structured results. Inspect the buckets for status.

To report completion for all checks, confirm the expected set for the same PR head SHA and
observe a terminal state for each. If the head changes, re-evaluate the set for the requested
head. An expected check missing from the response keeps the result incomplete. Continue bounded
reads if watch exits early. If the expected set is unknown, report the outcome of the observed
checks and say that the full set is unverified.

Human review gates, draft readiness, and informational bots are not technical failures. Report
them separately.

### PR events (preview)

Use installed `gh event` for an event-driven wait on a GitHub.com PR when the account has
[Event Streams access](https://docs.github.com/en/integrations/how-tos/using-github-event-streams).
Check installed help. If the command, host, or preview access is unavailable, use
`gh pr checks --watch` for PR checks, `gh run watch` for a known Actions run, or bounded
`gh pr view` reads for review or PR state. Use the same deadline rules for fallback.

The subscription ID and list commands use the current GitHub host. Set `GH_HOST=github.com`
for those calls to select Event Streams without changing stored configuration. Replace
`DURATION` with the time available for listening after reserving time for the final read.

```bash
GH_HOST=github.com gh event subscription view SUBSCRIPTION_ID --json id,resourceUrl,eventTypes,expiresAt
GH_HOST=github.com gh event listen --subscription SUBSCRIPTION_ID --timeout DURATION
gh event listen --resource https://github.com/OWNER/REPO/pull/123 \
  --event com.github.pull_request.check_suite.status.changed.v1 --timeout DURATION
```

Use the existing subscription ID when its PR and event types match. With `--resource`,
`listen` can create an account subscription and recreate it after expiry. Apply the
[Authorization policy](../SKILL.md#authorization) to that effect. Separate creation with
`gh event subscription create` uses the same `--resource` and `--event` flags and prints the ID.
Use `GH_HOST=github.com gh event subscription list` to inspect existing subscriptions.
Subscriptions expire after 24 hours and count toward an account limit. Run
`GH_HOST=github.com gh event subscription delete ID` only for an authorized removal and verify
it with a fresh read.

Choose the event for the requested change. `com.github.pull_request.review.submitted.v1` signals
a submitted review. `com.github.pull_request.state.changed.v1` includes merge, close, reopen,
draft and ready transitions. Installed help also lists head change and conflict events.

The listener prints one CloudEvent JSON object per line. It exits after one event by default.
Use `--count N` or `--follow` for multiple events and bound the wait to the task. An event can
carry `data.api_url` for a more specific read. A check-suite event covers only one suite.

Wait for stderr to show the stream is attached, then read the current PR or checks for the
requested head SHA. Events before attachment or during reconnect are missed. Read current state
again on every reconnect and relevant event. Apply the monitoring criteria above to the new
snapshot. If the result is still incomplete after a one-event run, attach again within the remaining time.
Exit code 8 from the listener means the timeout elapsed. Apply the deadline to the final read
and report the latest available state.

## Merge transport

Before an authorized merge, refresh all three evidence dimensions. Merge strategy is a repository
or operator decision, not something `gh-utility` invents.

For a PR tied to an issue with separate acceptance, also apply the
[Issue closing references](repo-issue-pr-playbook.md#issue-closing-references)
check on the current PR before merge. Do not treat prose that delays closure
as a change to GitHub's actual closing references.

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
