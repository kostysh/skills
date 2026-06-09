# Auth and scope playbook

Use this file when `gh` is missing, unauthenticated, pointed at the wrong host, or lacking scopes.

## First checks

```bash
command -v gh
gh --version
gh auth status
node scripts/gh-utility.mjs auth-doctor --repo .
```

For GitHub Enterprise:

```bash
gh auth status --hostname enterprise.internal
gh auth login --hostname enterprise.internal
```

## Token storage and headless mode

- Browser/device login stores a token in the system credential store when available.
- If no credential store is available, `gh` may fall back to plaintext token storage; `gh auth status` reports where credentials are stored.
- For automation, set `GH_TOKEN` or `GITHUB_TOKEN` in the environment. Do not print token values.
- In GitHub Actions, use `GH_TOKEN: ${{ github.token }}` and grant workflow permissions explicitly.

## Common scopes by task

| Task | Typical scope/remediation |
|---|---|
| Private repo read/write | `gh auth refresh -s repo` |
| Workflow files, workflow dispatch, Actions permissions | `gh auth refresh -s workflow` |
| GitHub Projects | `gh auth refresh -s project` |
| Organization/team metadata | `gh auth refresh -s read:org` |
| Organization secrets or settings | `gh auth refresh -s admin:org` plus admin role |
| Gists | `gh auth refresh -s gist` |
| Codespaces | `gh auth refresh -s codespace` if host supports it |
| Packages/containers | Use package-specific scopes and repository permissions |

Fine-grained PATs can be resource-scoped; if `gh` behaves inconsistently across repos, prefer `GH_TOKEN` with a token scoped to the exact repo/org.

## Host/repo resolution

```bash
gh repo view --json nameWithOwner,url,viewerPermission,defaultBranchRef
GH_REPO=OWNER/REPO gh pr list
GH_HOST=enterprise.internal gh repo view OWNER/REPO
```

Use `--repo OWNER/REPO` in scripts and cross-repo operations. Do not rely on the current directory when the user named a different repo.

## Troubleshooting auth failures

| Symptom | Likely cause | Next step |
|---|---|---|
| `gh: command not found` | CLI not installed | Install GitHub CLI or fall back to web only if appropriate. |
| `HTTP 401` | expired/missing token | `gh auth status`, then `gh auth login` or refresh token. |
| `HTTP 403 Resource not accessible` | missing scope/role or SSO | Refresh scope, authorize SSO, or ask repo/org admin. |
| Project commands fail | missing `project` scope | `gh auth refresh -s project`. |
| Workflow edit/dispatch fails | missing `workflow` scope or workflow permissions | `gh auth refresh -s workflow`; inspect repo Actions settings. |
| Search incomplete/rate-limited | search API limit | Narrow query, partition dates, retry later. |
| Works locally but not in Actions | token permission too narrow | Add `permissions:` block and set `GH_TOKEN`. |

## Safe auth responses

When unauthenticated, do not attempt to collect a token from the user. Say exactly what to run locally:

```bash
gh auth login
# or, for project workflows:
gh auth refresh -s project
```

If a token is already in an environment variable, do not echo it. Check only whether it is set.
