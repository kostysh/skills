# Auth and scope playbook

Use this file for authentication, scopes, host selection, and operations that must preserve stored
credentials.

## First checks

```bash
command -v gh
gh --version
gh auth status --hostname HOST --active --no-refresh
```

Use the target host, including the exact Enterprise hostname for an Enterprise task. Check
installed help for `--no-refresh`. Plain status can refresh the accounts it checks. If the flag is
unavailable, use status without it only when the installed release or credential source is
known to prevent refresh for the selected account. In JSON mode inspect the account's result
because nonfatal authentication failures can have exit code zero.

## Credential-preserving reads

`--no-refresh` applies only to the status command. A later authenticated API call can refresh
expired or near-expiry stored OAuth credentials. When the task must preserve credentials,
continue API reads only with an authorized source that `gh` will not refresh. Reuse confirmation
for the same host, account and environment if already supplied. The scoped status above can
inspect the active credential. Use `--json hosts` to check its state and refreshability when
supported, and filter retained output to the needed fields.

If the only available credential may refresh, finish supported local diagnosis and leave the
dependent API read pending. Run login, refresh, account switches and scope changes only when
their effects are covered by the [Authorization policy](../SKILL.md#authorization).

## Token storage and headless mode

- Browser/device login stores a token in the system credential store when available.
- If no credential store is available, `gh` may fall back to plaintext token storage. The
  scoped status command reports where credentials are stored.
- For automation, use `GH_TOKEN` or `GITHUB_TOKEN` for GitHub.com and GHE.com. Use
  `GH_ENTERPRISE_TOKEN` or `GITHUB_ENTERPRISE_TOKEN` for GitHub Enterprise Server.
  Keep token values out of tool output.
- In GitHub Actions, use `GH_TOKEN: ${{ github.token }}` and grant workflow permissions explicitly.

### Expiring OAuth credentials

Where installed help and the host support them, `gh auth login --expiring` prefers expiring
credentials with automatic refresh. `gh auth refresh --expiring` reauthenticates the active
stored account and requests the same preference. The host and OAuth app determine whether
GitHub issues an expiring token. The `expiring_credentials` setting sets the login preference.
Treat login, scope refresh and config changes as authorized actions on the selected account or
environment. Browser login may copy the one-time device code to the clipboard. Use
`--clipboard=false` when supported if the code must stay off the clipboard.

## Common scopes by task

| Task | Typical OAuth scope |
|---|---|
| Private repo read/write | `repo` |
| Workflow file changes | `workflow` |
| GitHub Projects | `project` |
| Organization/team metadata | `read:org` |
| Organization secrets or settings | `admin:org` plus admin role |
| Gists | `gist` |
| Codespaces | `codespace` if host supports it |
| Packages/containers | Use package-specific scopes and repository permissions |

Fine-grained PATs can be resource-scoped; if `gh` behaves inconsistently across repos, prefer `GH_TOKEN` with a token scoped to the exact repo/org.

## Host/repo resolution

For API reads, apply the [credential-preserving read guidance](#credential-preserving-reads)
if the task requires it.

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
| `HTTP 401` | expired/missing token | Use scoped status. Apply the credential-preserving procedure if changes are excluded. |
| `HTTP 403 Resource not accessible` | missing scope/role or SSO | Check the selected account, role or SSO need. Use authorized remediation for the cause. |
| Project commands fail | missing scope or project permission | Confirm owner and scope before choosing remediation. |
| Workflow edit/dispatch fails | missing token or Actions permissions | Inspect required token permissions and repo Actions settings. |
| Search incomplete/rate-limited | search API limit | Narrow query, partition dates, retry later. |
| Works locally but not in Actions | token permission too narrow | Add `permissions:` block and set `GH_TOKEN`. |

## Safe auth responses

When unauthenticated, identify the needed action and host without collecting the token.
For login or scope expansion covered by the task, use the appropriate targeted command:

```bash
gh auth login --hostname HOST
# or, for project workflows:
gh auth refresh --hostname HOST -s project
```

If a token is already in an environment variable, do not echo it. Check only whether it is set.
