# Repository, issue, and pull request playbook

Use this file for common repo, issue, label, milestone, and PR lifecycle tasks.

## Repository inspection

```bash
gh repo view OWNER/REPO --json nameWithOwner,description,visibility,isArchived,isFork,defaultBranchRef,viewerPermission,licenseInfo,repositoryTopics,url
gh label list --repo OWNER/REPO --limit 100 --json name,color,description
gh ruleset list --repo OWNER/REPO
gh api -X GET repos/OWNER/REPO/rulesets --paginate
gh workflow list --repo OWNER/REPO --all --json id,name,state,path
gh variable list --repo OWNER/REPO --json name,updatedAt
```

Before creating a repo, inspect owner permissions and naming collisions:

```bash
gh repo view OWNER/NEW_REPO --json nameWithOwner,url
gh repo create OWNER/NEW_REPO --private --description "..." --disable-wiki
```

Proceed to creation only when the read distinguishes an authoritative not-found result from auth,
host, rate-limit, or permission failure. Do not mask the inspection exit code with `|| true`.

After repo creation, recommend immediate baseline: default branch, branch protection/ruleset, CODEOWNERS, PR template, labels, security settings, Actions permissions, Dependabot/Renovate, and README/license.

## Issues

### Inspect

```bash
gh issue list --repo OWNER/REPO --state open --limit 50 --json number,title,author,labels,assignees,milestone,updatedAt,url
gh issue view 123 --repo OWNER/REPO --comments --json number,title,body,author,labels,assignees,milestone,state,url,comments
```

### Create/edit

Use an issue body file for multi-line content:

```bash
gh issue create --repo OWNER/REPO --title "Title" --body-file issue.md --label bug --assignee @me
gh issue edit 123 --repo OWNER/REPO --add-label priority:P1 --add-assignee monalisa
gh issue comment 123 --repo OWNER/REPO --body-file comment.md
```

Closing/transferring/locking/pinning issues changes collaboration state; ask first unless the user explicitly requested the exact action.

## Pull requests

### Inspect current branch PR

```bash
gh pr view --json number,title,url,state,author,headRefName,baseRefName,mergeable,mergeStateStatus,reviewDecision,isDraft
gh pr checks
gh pr diff --name-only
```

### Create PR

Require the local Git owner to provide the pushed head/base refs and source-diff evidence. Then use
generated body content and create only the authorized GitHub PR:

```bash
gh pr create --base BASE --head HEAD --title "..." --body-file pr_body.md --draft
```

Local branch preparation, commits, rebases, worktrees, and push policy belong to `git-engineer`.

Use draft PR if tests are not complete or the user wants early review. Do not mark ready without user intent.

### Update PR

```bash
gh pr edit 123 --repo OWNER/REPO --title "..." --body-file pr_body.md --add-label ready-for-review
gh pr comment 123 --repo OWNER/REPO --body-file comment.md
gh pr review 123 --repo OWNER/REPO --comment --body-file review.md
```

### Merge readiness

Check three independent dimensions:

1. Mergeability: `mergeable`, `mergeStateStatus`, conflicts.
2. Review state: `reviewDecision`, unresolved review threads.
3. CI state: `gh pr checks`, failed/pending/human-gated checks.

```bash
gh pr view 123 --repo OWNER/REPO --json mergeable,mergeStateStatus,reviewDecision,isDraft
gh pr checks 123 --repo OWNER/REPO
```

Do not merge if unresolved required comments or failing checks remain unless the user explicitly accepts the risk.

## Review comments and replies

There are three comment surfaces:

- Issue/PR conversation comments: `gh issue comment` or REST `/issues/{number}/comments`.
- PR review submissions: `gh pr review` or REST `/pulls/{number}/reviews`.
- Inline review threads: GraphQL `reviewThreads` and `resolveReviewThread`.

For inline threads, use `gh api graphql` to fetch thread IDs and resolution state, or route the
workflow to `gh-address-comments`. Reply before resolving when resolution is approved.

## Local branch updates

Route rebase, force-with-lease, commit, worktree, and local branch-history decisions to
`git-engineer`. After the owning workflow updates and pushes the branch, `gh-utility` may refresh
PR/check state and monitor GitHub-side verification.

## Labels

```bash
gh label list --repo OWNER/REPO --limit 100
gh label create bug --repo OWNER/REPO --color d73a4a --description "Something is broken"
gh label edit old --repo OWNER/REPO --name new --color 0e8a16
gh label delete unused --repo OWNER/REPO
```

Deleting/renaming labels affects existing issues and automation; inspect usage first with search:

```bash
gh search issues "repo:OWNER/REPO label:old" --json number,title,url,state
```
