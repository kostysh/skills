## Overview

Ensure all commits follow Conventional Commits and keep history clean, minimal, and reviewable.

## Repository Git policy first

Before branch, worktree, PR, merge, cleanup, or force-push operations, resolve repo policy:

1. Follow explicit operator instructions for the current task.
2. Check `AGENTS.md`, `CONTRIBUTING.md`, `README*`, and process docs linked by the issue, PR, task brief, or operator.
3. Use `gh repo view --json nameWithOwner,defaultBranchRef` for orientation only.
4. If the next step would collapse commits, rewrite shared history, delete a branch, or bypass validation, ask when policy is unknown.

Generic commands are fallbacks. Do not copy project-specific branches, paths, statuses, or CI commands into this portable skill.

## Conventional Commits (required)

Use this format for all commits unless the user explicitly asks otherwise:

```
<type>(<scope>)?: <subject>

<body>

<footer>
```

Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `build`, `ci`, `chore`, `revert`.

Rules:
- Subject is imperative, lower-case, no trailing period.
- Scope is optional but preferred and must follow repo conventions:
  - **Monorepo rule:** when the change targets a specific package area, use the **package name** (folder under `packages/`) as the scope, e.g. `kb-api`, `agent-ui`.
  - If the change is **package-wide** (applies to the whole package), **omit the scope**.
  - If changes span **multiple packages**, use a shared scope like `monorepo` (or follow the repo’s established multi-package scope if defined).
  - If the change is **root-level** (tooling/infra/config shared by all), **omit the scope**.
- Use `BREAKING CHANGE:` footer for breaking changes.

Examples:
- `feat(kb-api): add output validation middleware`
- `fix(agent-ui): remove skip ci from changelog automation`
- `chore: update shared tooling configuration`
- `refactor(kb-api): rename config keys`

Breaking change example:
```
refactor(kb-api): rename config keys

BREAKING CHANGE: renamed config keys require updates in all consumers
```

## Emojis (recommended)
Prefix the subject with an emoji that matches the commit type:
- feat → ✨
- fix → 🐛
- refactor → ♻️
- perf → ⚡
- test → 🧪
- docs → 📝
- build → 🏗️
- ci → 👷
- chore → 🔧
- revert → ⏪

Example: `feat(server): ✨ add output validation middleware`

## Workflow for commits

1. Inspect status: `git status -sb`
2. Stage only the intended files; do not stage generated artifacts (e.g., `node_modules`, build outputs).
3. If changes mix concerns, split into multiple commits.
4. If the work follows SDD task artifacts (`docs/sdd/**/T*-tasks.md`), include matching task status/progress updates in the same task-completion commit (do not defer all status updates to stage end).
5. Run required checks (type-check, lint, format, tests) unless the user explicitly waives them.
6. Write a Conventional Commit message.
7. Confirm status is clean.

## Docs-only commit workflow

Use this flow when the user asks to commit only documentation/artifacts:
1. Identify the target docs paths explicitly (for example `docs/**`).
2. Stage only those files via explicit `git add <path>` commands (avoid `git add .`).
3. Verify staged files with `git diff --cached --name-only` and ensure no non-doc files are included.
4. Use `docs:` Conventional Commit type (scope optional by repo rules).
5. Keep unrelated modified files unstaged for a later commit.

## GitHub CLI (`gh`) workflow

Use `gh` as the default interface for GitHub issues, pull requests, and CI status.

### Setup and repository targeting

1. Confirm auth and host:
   - `gh auth status`
2. Confirm repo context from current directory:
   - `gh repo view --json nameWithOwner,defaultBranchRef`
3. If needed, set default repo for the current local clone:
   - `gh repo set-default <owner>/<repo>`
4. For cross-repo operations, always pass `-R <owner>/<repo>` explicitly.

### Auth mode for agents (GitHub App)

When working as an agent, prefer GitHub App auth over personal account auth.

1. Do not use `gh auth login` with a GitHub App private key.
   - GitHub App auth for `gh` works via temporary installation token in `GH_TOKEN`.
2. Refresh token before GitHub operations:
   - preferred: run your environment helper (for example `gh_app_refresh`) if available.
   - fallback: mint an installation token with your approved method and export it to `GH_TOKEN` (for example `export GH_TOKEN="$(<token-mint-command>)"`).
3. Verify active identity:
   - `gh auth status`
   - expected active account is App bot (`app/<slug>` or `<slug>[bot]`) with `(GH_TOKEN)`.
4. Token lifetime is short (about 1 hour). Refresh on 401/403 or before long GH sessions.
5. Never print raw tokens to logs.

### Non-interactive defaults (agent-safe)

- Prefer explicit flags over prompts.
- Prefer `--body-file <file>` for long content.
- Prefer machine-readable output for scripts:
  - `--json ... --jq ...`
- Do not print or log tokens; use `gh auth status` to validate auth.

### Issues: read, triage, and ownership

Read queue:
- `gh issue list --state open --limit 100`
- `gh issue list --state open --label bug --limit 100`
- `gh issue list --state all --search "is:issue sort:updated-desc" --limit 100`
- `gh issue list --state open --json number,title,labels,assignees,updatedAt,url --jq '.[] | {n:.number,t:.title,u:.url}'`

Inspect issue details:
- `gh issue view <number> --comments`
- `gh issue view <number> --json number,title,body,labels,assignees,state,url`

Take issue into work:
- if assignee is supported for current identity: `gh issue edit <number> --add-assignee "@me" --add-label "in-progress"`
- if App/bot identity is not assignable: `gh issue edit <number> --add-label "in-progress"`
- `gh issue comment <number> --body "Taken into work."`
- Optional linked branch: `gh issue develop <number> --checkout --name <branch-name>`

Update triage metadata:
- `gh issue edit <number> --add-label "bug" --remove-label "needs-triage"`
- `gh issue edit <number> --title "<new title>"`

Close/reopen:
- `gh issue close <number> --reason completed --comment "Fixed in #<pr-number>"`
- `gh issue reopen <number> --comment "Reopening: regression reproduced."`

### Pull requests: create, review, merge

Read PR queue:
- `gh pr status`
- `gh pr list --state open --limit 100`
- `gh pr view <number> --comments --reviews`

Check out and inspect locally:
- `gh pr checkout <number>`
- `gh pr diff <number>`

Create PR (non-interactive):
- `gh pr create --base <base> --head <branch> --title "<title>" --body-file <file>`
- Draft PR when not ready: add `--draft`
- Autofill from commits when appropriate: `gh pr create --fill`
- Link issue auto-close in PR body: include `Fixes #<issue-number>` or `Closes #<issue-number>`

Update PR metadata:
- `gh pr edit <number> --add-label "ready-for-review" --remove-label "wip"`
- `gh pr edit <number> --add-reviewer <login1>,<login2>`

Review PR:
- `gh pr review <number> --approve --body "LGTM"`
- `gh pr review <number> --request-changes --body "Please address inline comments."`
- `gh pr review <number> --comment --body "Left several suggestions."`

Checks and merge:
- `gh pr checks <number> --watch --fail-fast`
- Choose the merge method from operator or repo policy before running merge commands:
  - If policy requires linear history with preserved commits, use platform rebase merge such as `gh pr merge <number> --rebase`, or rebase and fast-forward when direct branch integration is allowed.
  - If policy explicitly allows squash, use `gh pr merge <number> --squash`.
  - If policy requires merge commits, use `gh pr merge <number> --merge`.
  - If policy is unknown, do not squash or delete the branch without asking.
- If policy requires waiting for checks/queue, add `--auto` to the selected merge command, for example `gh pr merge <number> --auto --rebase`.
- To prevent merging stale head, add `--match-head-commit <sha>` when available.
- Do not couple branch deletion to merge when policy requires post-merge evidence first.

Branch cleanup gate:
- Treat remote branch cleanup as a separate step from merge unless repo policy explicitly allows deletion at merge time.
- If policy requires CI/CD or post-merge validation on the target branch, wait for that evidence before `git push origin --delete <branch>` or any merge command using `--delete-branch`.
- If no post-merge evidence gate exists and cleanup is allowed, delete only the merged task branch.

### Branch discipline for multi-PR work

1. One issue = one branch = one PR.
2. Resolve the base branch from repo policy; do not assume the GitHub default branch is the working base.
3. Create the new work branch from the refreshed policy base branch:
   - `git checkout <base-branch> && git pull --ff-only`
   - `git checkout -b fix/<issue-number>-<short-topic>`
4. Before edits, verify branch explicitly:
   - `git branch --show-current`
5. When switching to existing PR, use:
   - `gh pr checkout <number>`
6. Do not mix changes for different PRs in one branch.
7. After PR creation/update, return local workspace to the repo's policy base branch:
   - `git checkout <base-branch> && git pull --ff-only`
   - keep feature branch checked out only while implementing/review-fix for that PR.

### Rebase and force-push safety

- Rebase only when it matches operator or repo policy, or when the user asks for a linear local history.
- After rebasing a published task branch, push only that owned task branch with `git push --force-with-lease origin <branch>`.
- Never use `git push --force` for agent work.
- Never force-push protected, release, base, or other mainline branches.
- If branch ownership, upstream tracking, or remote head is unclear, stop and inspect before pushing.

### GitHub Actions / CI diagnostics

- List runs: `gh run list --limit 20`
- Filter branch/status: `gh run list --branch <branch> --status failure --limit 20`
- View run summary: `gh run view <run-id>`
- Watch run until completion: `gh run watch <run-id> --exit-status`
- Re-run failed jobs when appropriate: `gh run rerun <run-id> --failed`

Notes:
- `gh pr checks` is the preferred PR-centric signal.
- Use `gh run *` when you need workflow-level details, logs, or reruns.

### Labels and metadata hygiene

- List labels: `gh label list`
- Create/update labels when repository workflow needs standardized triage:
  - `gh label create "<name>" --color <hex> --description "<text>"`
  - `gh label edit "<name>" --color <hex> --description "<text>"`
- Keep issue/PR labels aligned with workflow states (`needs-triage`, `in-progress`, `review`, `blocked`, `done`).

### Suggested issue-to-PR flow

1. `gh issue view <id> --comments`
2. `gh issue edit <id> --add-label "in-progress"` (and add assignee if supported)
3. Resolve repo policy, then create/switch to a dedicated branch from updated `<base-branch>`.
4. `gh pr create --base <base> --head <branch> --title "<cc-title>" --body-file <file>`
5. `gh issue comment <id> --body "PR opened: <url>"`
6. `gh pr checks <pr> --watch --fail-fast`
7. Merge using the repo-approved method: rebase/fast-forward when commits must be preserved, squash only when allowed, merge commit when required.
8. Wait for any required CI/CD or post-merge validation evidence before remote branch cleanup.
9. `gh issue close <id> --reason completed --comment "Completed in #<pr>"`
10. Return to baseline locally: `git checkout <base-branch> && git pull --ff-only`

### Manual references

- `https://cli.github.com/manual`
- `https://cli.github.com/manual/gh_issue`
- `https://cli.github.com/manual/gh_pr`
- `https://cli.github.com/manual/gh_run`

## Git worktrees (isolation workflow)

Use when starting feature work that needs isolation from the current workspace or before executing implementation plans.

Announce at start: "I'm using the git worktrees workflow to set up an isolated workspace."

Before choosing a worktree root, creating a worktree, or moving an existing worktree, read [Worktree operations](references/worktrees.md). That reference owns directory precedence, ignore preparation, creation checks, move preservation, stop rules, and the review handoff.

The portable default is `<repository-root>/.worktrees/<task-slug>`. An explicit operator location wins. A closer repository policy may select another repository-local root, but an outside-repository path in repository documentation or an existing shared directory is only a proposed exception and requires explicit operator confirmation.

## Splitting changes (guidance)
- Group by purpose: feature vs. fix vs. docs vs. infra.
- Keep commits small and reviewable; avoid unrelated changes in one commit.
- If changes touch multiple packages, prefer separate commits per affected package rather than one combined commit.
- If the user requests separate commits, honor the split explicitly.

## Rebase vs merge (when asked)
- Follow repo policy first.
- Use rebase or fast-forward merge for linear history when commits must be preserved.
- Use squash only when operator or repo policy permits collapsing commits.
- Use merge commits when preserving branch topology is required.

## Commit message selection cheatsheet
- `feat`: new behavior/user-facing capability
- `fix`: bug fix
- `refactor`: code change without behavior change
- `perf`: performance improvement
- `test`: add/change tests
- `docs`: documentation only
- `build`: build system/deps
- `ci`: CI config changes
- `chore`: tooling, formatting, maintenance
- `revert`: revert prior commit

## Exceptions
- If the repo already enforces a different convention, follow that repo’s rules and note the exception.
