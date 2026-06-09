# PR CI and review loop

Use this file when the user wants a PR green, failing checks fixed, review feedback addressed, or merge readiness verified.

## Goal

Bring the PR to an actionable state: all fixable CI failures addressed, high/medium review feedback handled, unresolved review threads either resolved with approval or clearly reported, and human gates separated from technical blockers.

## Sequence

1. Identify PR.
2. Inspect mergeability and review state.
3. Fetch review threads/comments.
4. Inspect checks and logs.
5. Build plan and ask before high-risk actions.
6. Apply fixes locally.
7. Verify locally, commit, push with approval if needed.
8. Watch CI, loop on actionable failures.
9. Ask before replying/resolving threads or merging.

## Identify PR

```bash
gh pr view --json number,title,url,headRefName,baseRefName,isDraft,mergeable,mergeStateStatus,reviewDecision
gh repo view --json nameWithOwner -q .nameWithOwner
```

If no PR exists for the current branch, stop and report that. If the user gave a PR URL, use `scripts/gh-utility.mjs route` then `--repo OWNER/REPO --pr N`.

## Review threads

Fetch unresolved threads:

```bash
node scripts/gh-utility.mjs pr-threads --repo OWNER/REPO --pr 123
```

For each thread:

- Read the reviewer comment.
- Read current file contents around the line, not just the diff hunk.
- Identify the enclosing function/class/config block.
- Search for adjacent occurrences when the issue is systemic.
- Classify: fix, investigate, discuss, acknowledge, outdated.
- Do not resolve until the user approves specific thread resolution.

Thread reply/resolve after approval:

```bash
node scripts/gh-utility.mjs pr-threads --reply-thread-id PRRT_xxx --reply-body-file reply.md --confirm-mutation
node scripts/gh-utility.mjs pr-threads --resolve-thread-id PRRT_xxx --confirm-mutation
```

## Checks and logs

Start with:

```bash
gh pr checks 123 --repo OWNER/REPO
node scripts/gh-utility.mjs pr-checks --repo OWNER/REPO --pr 123
```

Manual fallback:

```bash
gh pr checks 123 --repo OWNER/REPO --json name,state,bucket,link,workflow,startedAt,completedAt
gh run view RUN_ID --repo OWNER/REPO --json name,workflowName,status,conclusion,url,event,headBranch,headSha
gh run view RUN_ID --repo OWNER/REPO --log-failed
```

Treat non-GitHub Actions checks as external. Report the URL; do not scrape another provider unless the user gave credentials and asked.

## Failure analysis pattern

For each failure:

1. Identify the failing job and exact assertion/lint/build error.
2. Trace from error to source file.
3. State root cause before editing.
4. Search for related patterns/call sites.
5. Fix root cause, not just the symptom.
6. Run the smallest local validation command.
7. Commit and push only when appropriate.

## Waiting and monitoring

```bash
gh pr checks 123 --repo OWNER/REPO --watch --fail-fast
# or
gh run watch RUN_ID --repo OWNER/REPO --exit-status
```

Do not wait for human approval, draft-readiness, review gates, or informational bots unless the user explicitly asked. Report them as human gates.

## Merge conflicts

```bash
git fetch origin
BASE=$(gh pr view 123 --repo OWNER/REPO --json baseRefName -q .baseRefName)
git rebase origin/$BASE
```

Ask before force-pushing if collaborators may be on the branch. After resolving conflicts, run local checks and use `git push --force-with-lease` only with approval.

## Merge

Before merge:

```bash
gh pr view 123 --repo OWNER/REPO --json mergeable,mergeStateStatus,reviewDecision,isDraft
gh pr checks 123 --repo OWNER/REPO
node scripts/gh-utility.mjs pr-threads --repo OWNER/REPO --pr 123
```

Ask for explicit approval and merge strategy:

```bash
gh pr merge 123 --repo OWNER/REPO --squash --delete-branch
# or --merge / --rebase / --auto when policy allows
```

## Final report

Include:

- PR URL.
- Technical blockers fixed.
- Checks rerun/watched and current result.
- Threads replied/resolved/skipped.
- Commits pushed.
- Remaining human gates.
