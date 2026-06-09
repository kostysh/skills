---
name: gh-utility
description: >
  Use this skill when a user asks to use GitHub CLI (`gh`) or needs GitHub repository, issue, pull request, review, CI, Actions, workflow, release, project, Codespaces, secret, variable, ruleset, search, API, gist, key, extension, alias, config, org, or `gh skill` workflows. Prefer authenticated `gh` over raw GitHub URLs or unauthenticated web fetches. Inspect first, summarize current state, and require explicit approval before risky mutations.
license: MIT
compatibility: "Requires GitHub CLI gh, git for repository work, Node.js >= 22.22.0 for helper commands, and network access to the relevant GitHub host."
metadata:
  version: "1.0.0"
  short-description: "Safety-first workflows for the GitHub CLI."
---

# gh-utility

Use `gh` as the primary interface for GitHub work. This skill is a router plus safety policy: it tells you which `gh` surface to use, when to inspect first, which helper scripts can stabilize fragile flows, and which reference file to load only when needed.

## Non-negotiable operating rules

1. Prefer authenticated `gh` over `curl`, `wget`, raw `github.com`, `api.github.com`, `raw.githubusercontent.com`, and unauthenticated web fetches for GitHub repository data. Use web only when `gh` is unavailable, unauthenticated, or the target is not GitHub repository/API data.
2. Start every GitHub task with read-only inspection unless the user explicitly provided all state and asked for a single safe command.
3. Before mutations, present: target host/repo/org, exact command(s), expected effect, rollback/recovery path, and risks. Get explicit approval for risky changes.
4. Never print secret values, tokens, private keys, or decrypted credentials. For `gh secret set`, prefer stdin or env-file flows and summarize secret names only.
5. Do not force-push, delete repositories, delete releases/assets, delete branches/tags, resolve review threads, change rulesets/branch protection, alter org/repo secrets, publish releases, or change Codespaces port visibility without explicit approval.
6. Treat `gh api` as an escape hatch. Prefer top-level `gh` commands first; when using REST/GraphQL, use explicit methods, pagination, JSON fields, and rate-limit-aware retries.
7. Separate `git` and `gh`: use `git` for local commit/history operations, `gh` for GitHub API/platform operations.
8. Keep responses in the user's language. If a command fails because of auth, scope, field drift, rate limit, or host mismatch, say that clearly and provide the smallest remediation command.

## Quick start sequence

Run these only when appropriate for the task and environment:

```bash
command -v gh
gh --version
gh auth status
gh repo view --json nameWithOwner,defaultBranchRef,viewerPermission,visibility,url
```

For a fuller diagnosis, run:

```bash
node scripts/gh-utility.mjs auth-doctor --repo .
```

For a GitHub URL, translate it to a `gh` workflow first:

```bash
node scripts/gh-utility.mjs route "https://github.com/OWNER/REPO/pull/123"
```

## Route table

| User intent | First commands | Load when needed |
|---|---|---|
| Auth, host, scopes, enterprise host, token storage | `gh auth status`, `node scripts/gh-utility.mjs auth-doctor` | `references/auth-and-scopes.md`, `references/troubleshooting.md` |
| Convert GitHub URL, inspect repo files, avoid raw URLs | `node scripts/gh-utility.mjs route URL`, `gh repo view`, shallow clone | `references/api-search-and-url-routing.md` |
| Repo metadata, clone/fork/create/edit, labels, topics, visibility | `gh repo view`, `gh repo list`, `node scripts/gh-utility.mjs repo-audit` | `references/repo-issue-pr-playbook.md`, `references/admin-security-playbook.md` |
| Issues, labels, milestones, triage, transfer/lock/pin | `gh issue list/view`, `gh label list` | `references/repo-issue-pr-playbook.md` |
| Pull requests, create/update/review/merge/status | `gh pr view/list/status/checks/diff` | `references/repo-issue-pr-playbook.md`, `references/pr-ci-review-loop.md` |
| PR review threads/comments | `node scripts/gh-utility.mjs pr-threads --repo . --pr N` | `references/pr-ci-review-loop.md` |
| Failing checks, Actions logs, workflow runs/artifacts/cache | `gh pr checks`, `node scripts/gh-utility.mjs pr-checks`, `gh run view --log-failed` | `references/pr-ci-review-loop.md` |
| Workflow dispatch, enable/disable, rerun/cancel/watch | `gh workflow list/view/run`, `gh run list/view/watch` | `references/pr-ci-review-loop.md`, `references/admin-security-playbook.md` |
| Releases, tags, assets, release notes, immutable releases | `node scripts/gh-utility.mjs release-state`, `gh release view/list`, `git tag` | `references/release-playbook.md` |
| GitHub Projects | `gh project list/view/field-list/item-list`, `node scripts/gh-utility.mjs project-snapshot` | `references/projects-playbook.md` |
| Search repos/code/issues/PRs/commits | `gh search repos/code/issues/prs/commits`, `gh api -X GET search/...` | `references/api-search-and-url-routing.md`, `references/bulk-operations.md` |
| Generic REST/GraphQL API | `node scripts/gh-utility.mjs safe-api ENDPOINT`, `gh api graphql` | `references/api-search-and-url-routing.md` |
| Secrets, variables, deploy keys, SSH/GPG keys | `gh secret list`, `gh variable list`, `node scripts/gh-utility.mjs secret-manifest` | `references/admin-security-playbook.md` |
| Rulesets, branch protection, security configuration | `gh ruleset list/view/check`, `gh api repos/.../branches/.../protection` | `references/admin-security-playbook.md` |
| Codespaces lifecycle, ports, logs, SSH, copy files | `node scripts/gh-utility.mjs codespace-snapshot`, `gh codespace list/view/ports/logs` | `references/codespaces-and-dev-envs.md` |
| Gists | `gh gist list/view/create/edit/delete` | `references/command-map.md` |
| Alias, extension, config, completion | `gh alias list`, `gh extension list`, `gh config list` | `references/command-map.md` |
| Install/update/publish agent skills with `gh skill` | `gh skill preview/install/update --dry-run` | `references/gh-skill-management.md` |
| Multi-repo or bulk operations | generate dry-run plan first | `references/bulk-operations.md`, `assets/repo_batch_template.csv` |

## Default workflow pattern

### 1. Resolve target

Identify the GitHub host, owner/repo, branch, PR/issue/release/project/codespace identifier, and the user's permission level. Prefer `gh repo view --json nameWithOwner,viewerPermission,defaultBranchRef` for repository context.

### 2. Inspect read-only state

Gather enough state to avoid guessing. Use `--json` and `--jq` where possible. For repository file contents, prefer shallow clone with `gh repo clone OWNER/REPO TMP -- --depth 1` and read files locally instead of decoding `/contents` API responses.

### 3. Classify risk

Use this shorthand in your plan:

- **Read-only:** view/list/search/download logs, inspect metadata, produce reports.
- **Low-risk mutation:** create a draft issue, comment, branch-local PR body edit, workflow dispatch in a dev environment.
- **Medium-risk mutation:** create/edit PR or issue metadata, rerun/cancel workflow, update project fields, upload release notes to an existing draft.
- **High-risk mutation:** merge/close/delete, force-push, tag push/delete, publish release, ruleset/branch protection changes, org/repo secrets or variables, key management, Codespaces port visibility, repo archive/delete/transfer.

### 4. Plan before mutation

For medium/high-risk mutations, show exact commands and ask for approval. For secrets, show only names and destinations. For release publishing, use `--notes-file` for multi-line Markdown and verify with `gh release view` after publication.

### 5. Execute narrowly

Run the smallest command set. Prefer idempotent operations and `--dry-run`/preview modes where available. Record outputs needed for verification.

### 6. Verify and report

Re-run read-only checks after mutation. Report what changed, what remains pending, and any manual follow-up.

## Approval gates

Ask before doing any of the following, even if the user broadly asked to “fix” or “clean up” something:

- `gh repo delete/archive/transfer/rename`, visibility changes, default branch changes.
- `gh pr merge/close/reopen/lock/unlock`, `git push --force*`, branch deletion.
- `gh api` with `POST`, `PATCH`, `PUT`, or `DELETE` unless it is a narrowly scoped comment/reply the user approved.
- `gh release create/delete/delete-asset/upload/edit` except read-only `view/list/download/verify`; release-body edits still need approval.
- `gh secret set/delete`, `gh variable set/delete`, `gh ssh-key add/delete`, `gh gpg-key add/delete`, deploy key changes.
- `gh ruleset` changes or branch protection API changes.
- `gh codespace delete/rebuild/stop`, port visibility changes, or copying sensitive files into/out of a codespace.
- `gh skill install/update/publish` unless the user approved the skill source and preview.

## Helper scripts

The helper command is optional and is implemented as a bundled TypeScript-built Node.js CLI at `scripts/gh-utility.mjs`. It is designed to inspect first, redact secrets, and fail clearly when `gh` is missing, unauthenticated, or lacks scopes.

| Script | Purpose |
|---|---|
| `scripts/gh-utility.mjs auth-doctor` | Diagnose `gh`, auth, host, repo context, token storage hints, and rate limit access. |
| `scripts/gh-utility.mjs route` | Convert common GitHub URLs into preferred `gh` commands or shallow-clone workflows. |
| `scripts/gh-utility.mjs safe-api` | Safer `gh api` wrapper with explicit method, dry-run, pagination, JSON output, and mutation confirmation. |
| `scripts/gh-utility.mjs pr-threads` | Fetch PR review threads/comments; optionally reply/resolve only with mutation confirmation. |
| `scripts/gh-utility.mjs pr-checks` | Inspect PR checks and pull GitHub Actions failure snippets. |
| `scripts/gh-utility.mjs release-state` | Inspect tags, releases, comparison range, and release health. |
| `scripts/gh-utility.mjs project-snapshot` | Export GitHub Project schema/items for planning and bulk updates. |
| `scripts/gh-utility.mjs secret-manifest` | Parse dotenv files into redacted secret/variable plans without printing values. |
| `scripts/gh-utility.mjs codespace-snapshot` | Inspect Codespaces, ports, and logs without lifecycle mutation. |
| `scripts/gh-utility.mjs repo-audit` | Read-only repository metadata, rulesets, workflows, labels, variables, and optional secret names. |
| `scripts/gh-utility.mjs validate-skill` | Validate this skill folder's frontmatter, structure, and references. |

## Output style

Use concise, auditable summaries:

```markdown
## gh task report
Target: HOST/OWNER/REPO
Mode: read-only | planned mutation | executed mutation
Commands run: <redacted list>
Findings: <bullets>
Plan: <only if action remains>
Approval needed: yes/no, because <risk>
Verification: <read-only command/result>
```

Use `assets/gh_task_report_template.md`, `assets/pr_body_template.md`, `assets/issue_template.md`, `assets/release_notes_template.md`, and `assets/pr_comment_triage_template.md` when a reusable artifact helps.

## Common gotchas

- `gh pr checks --json` fields drift between versions. If a field is rejected, rerun with the fields listed by the error or fall back to plain output.
- `gh api -f key=value` can imply a mutating request unless `-X GET` is explicit. For read/search endpoints, always specify `-X GET`.
- GitHub Projects usually need the `project` scope; suggest `gh auth refresh -s project` if project commands fail for scope reasons.
- GitHub Actions logs may be unavailable for external CI providers. Report external check URLs instead of scraping another provider.
- Comments, review threads, and PR issue comments are different API surfaces. Do not mark a thread resolved unless the user approved that thread.
- Immutable releases make tag/release mistakes harder to undo. Prefer draft releases, signed tags, notes files, and post-publication verification.
