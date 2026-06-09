# Repository, issue, and pull request playbook

Use this file for common repo, issue, label, milestone, and PR lifecycle tasks.

## Repository inspection

```bash
gh repo view OWNER/REPO --json nameWithOwner,description,visibility,isArchived,isFork,defaultBranchRef,viewerPermission,licenseInfo,repositoryTopics,url
gh label list --repo OWNER/REPO --limit 100 --json name,color,description
gh ruleset list --repo OWNER/REPO --json id,name,target,enforcement,source
node scripts/gh-utility.mjs repo-audit --repo OWNER/REPO --include-workflows --include-rulesets --include-variables
```

Before creating a repo, inspect owner permissions and naming collisions:

```bash
gh repo view OWNER/NEW_REPO || true
gh repo create OWNER/NEW_REPO --private --description "..." --disable-wiki --disable-issues=false
```

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
gh pr diff --stat
```

### Create PR

Prefer generated body from a template and local diff evidence:

```bash
git status --short
git log --oneline origin/BASE..HEAD
gh pr create --base BASE --head HEAD --title "..." --body-file pr_body.md --draft
```

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
node scripts/gh-utility.mjs pr-threads --repo OWNER/REPO --pr 123
```

Do not merge if unresolved required comments or failing checks remain unless the user explicitly accepts the risk.

## Review comments and replies

There are three comment surfaces:

- Issue/PR conversation comments: `gh issue comment` or REST `/issues/{number}/comments`.
- PR review submissions: `gh pr review` or REST `/pulls/{number}/reviews`.
- Inline review threads: GraphQL `reviewThreads` and `resolveReviewThread`.

For inline comments, use `scripts/gh-utility.mjs pr-threads` to fetch thread IDs and line context. Reply before resolving when resolution is approved.

## Force-push and branch updates

- Ask before `git push --force` or `--force-with-lease` when a PR branch may have collaborators.
- Prefer `--force-with-lease` over `--force`.
- After rebase, re-run tests and `gh pr checks --watch --fail-fast` if appropriate.

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
