# Troubleshooting playbook

Use this file when a `gh` workflow fails, returns unexpected data, or cannot find fields/permissions.

## Fast triage

```bash
command -v gh
gh --version
gh auth status
gh repo view --json nameWithOwner,url,viewerPermission,defaultBranchRef
gh api rate_limit
```

## Common errors

| Error/symptom | Likely cause | Fix |
|---|---|---|
| `gh: command not found` | GitHub CLI missing from PATH | Install `gh` or use a host-provided environment with `gh`. |
| `You are not logged into any GitHub hosts` | No stored token | `gh auth login`. |
| `HTTP 401` | Expired/invalid token | `gh auth status`, then refresh or login. |
| `HTTP 403 Resource not accessible by integration` | Insufficient token permissions, GitHub Actions token too narrow, SSO not authorized | Refresh scopes or set workflow `permissions:`; authorize SSO. |
| `GraphQL: Could not resolve to a Repository` | Wrong host, owner/repo typo, private repo inaccessible | `gh repo view OWNER/REPO`; confirm host and permission. |
| `Field 'x' doesn't exist on type` | API schema drift or wrong GraphQL object | Reduce query, inspect docs or use top-level command. |
| `Unknown JSON field` | `gh --json` field drift across versions | Rerun command without `--json` or with fields suggested by error. |
| Empty `gh pr checks` | No PR for branch, external CI, or permissions | `gh pr view`, inspect PR URL, use external check URL if present. |
| `gh project` fails | Missing `project` scope or org permissions | `gh auth refresh -s project`; confirm project owner. |
| `gh secret set` fails for org | Missing org admin role/scope/visibility repo mismatch | Confirm org permissions and selected repos. |
| Rate limit exceeded | Broad search/API loop | Narrow query, partition date/repo, wait, or reduce pagination. |

## Debug command construction

Use `--verbose` sparingly because it can include sensitive headers in some contexts. Do not paste tokens into logs.

Safer pattern:

```bash
set -o pipefail
GH_DEBUG=api gh api -X GET repos/OWNER/REPO --jq '.full_name' 2>gh-debug.redacted.log
python - <<'PY'
from pathlib import Path
p = Path('gh-debug.redacted.log')
s = p.read_text(errors='replace')
for marker in ['authorization:', 'Authorization:', 'token ']:
    s = s.replace(marker, '[REDACTED] ')
p.write_text(s)
PY
```

## Check repo context

When a command unexpectedly targets the wrong repository:

```bash
git remote -v
gh repo view --json nameWithOwner,url
echo "$GH_REPO"
echo "$GH_HOST"
```

Prefer explicit `--repo OWNER/REPO` in scripts and examples.

## Check installed extensions

```bash
gh extension list
gh extension upgrade --all   # ask before running in managed environments
```

Extensions can change command behavior or add subcommands. Treat install/upgrade as high risk in locked-down environments.

## Recover from partial mutation

1. Stop and report exact command, resource, and error.
2. Re-inspect current state.
3. Determine whether the operation is idempotent.
4. Present a recovery plan, not another blind mutation.
5. Verify after recovery.

Examples:

- Label created but wrong color: `gh label edit NAME --color ...` after approval.
- PR body overwritten: restore from local file, git history, or previous comment if available.
- Draft release body malformed: fix with `gh release edit TAG --notes-file corrected.md` after approval.
- Secret value uncertain: rotate by setting a new value; never attempt to read the existing value.

## When to fall back from `gh`

Prefer `gh`, but fallback may be appropriate when:

- GitHub CLI is unavailable and cannot be installed in the environment.
- The target is documentation outside GitHub repository/API data.
- A third-party CI provider hosts logs outside GitHub Actions.
- A GitHub Enterprise instance blocks a command family but allows web UI/API through another approved channel.

Explain the fallback and its limitations.
