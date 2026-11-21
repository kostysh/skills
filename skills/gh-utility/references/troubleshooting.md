# Troubleshooting playbook

Use this file when a `gh` workflow fails, returns unexpected data, or cannot find fields/permissions.

## Fast triage

```bash
command -v gh
gh --version
```

Use the [scoped authentication check](auth-and-scopes.md#first-checks) for the target account.
If the task requires preserving credentials, apply the
[credential-preserving read guidance](auth-and-scopes.md#credential-preserving-reads) before
running repo reads or rate-limit queries.

## Common errors

| Error/symptom | Likely cause | Fix |
|---|---|---|
| `gh: command not found` | GitHub CLI missing from PATH | Install `gh` or use a host-provided environment with `gh`. |
| `You are not logged into any GitHub hosts` | No stored token | Identify the account and host for authorized login. |
| `HTTP 401` | Expired/invalid token | Use scoped status and follow the credential-preserving procedure when applicable. |
| `HTTP 403 Resource not accessible by integration` | Insufficient token permissions, GitHub Actions token too narrow, SSO not authorized | Inspect the selected account and required permissions. Apply authorized changes for the confirmed cause. |
| `GraphQL: Could not resolve to a Repository` | Wrong host, owner/repo typo, private repo inaccessible | Check the target and permissions with a scoped repository read. |
| `Field 'x' doesn't exist on type` | API schema drift or wrong GraphQL object | Reduce query, inspect docs or use top-level command. |
| `Unknown JSON field` | `gh --json` field drift across versions | Rerun command without `--json` or with fields suggested by error. |
| Empty `gh pr checks` | No PR for branch, external CI, or permissions | `gh pr view`, inspect PR URL, use external check URL if present. |
| `gh project` fails | Missing `project` scope or org permissions | Confirm project owner and cause before expanding scope. |
| `gh secret set` fails for org | Missing org admin role/scope/visibility repo mismatch | Confirm org permissions and selected repos. |
| Rate limit exceeded | Broad search/API loop | Narrow query, partition date/repo, wait, or reduce pagination. |

## Debug command construction

Use `--verbose` sparingly because it can include sensitive headers in some contexts. Do not paste tokens into logs.

Capture `GH_DEBUG=api` output only when a task-local redaction tool is already available. Inspect
and redact authorization headers, tokens, cookies, private URLs, and payload data before retaining
or sharing the log. If safe redaction cannot be established, do not persist debug output.

## Check repo context

When a command unexpectedly targets the wrong repository:

```bash
gh repo view --json nameWithOwner,url
echo "$GH_REPO"
echo "$GH_HOST"
```

Prefer explicit `--repo OWNER/REPO` in scripts and examples.
If local remote configuration itself is suspect, hand that inspection to `git-engineer`; do not
change local Git configuration as part of GitHub transport troubleshooting.
When an unexpected API hostname persists, inspect `gh config get api_host --host HOST` if
supported. The experimental override can redirect API traffic while login, Git remotes and
browser URLs still use the canonical host. Requests may still reach that host.

## Check installed extensions

```bash
gh extension list
gh extension upgrade --all   # run only when the root Authorization policy covers all installed extensions
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
