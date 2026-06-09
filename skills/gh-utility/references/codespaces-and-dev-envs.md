# Codespaces and dev environments

Use this file for `gh codespace` lifecycle, logs, SSH, file copy, ports, and environment troubleshooting.

## Inspect first

```bash
gh codespace list
node scripts/gh-utility.mjs codespace-snapshot --json
gh codespace view --codespace CODESPACE_NAME
gh codespace logs --codespace CODESPACE_NAME
gh codespace ports --codespace CODESPACE_NAME
```

## Common tasks

### Create

```bash
gh codespace create --repo OWNER/REPO --branch BRANCH
```

Confirm machine type, repo, branch, and devcontainer before creating costly resources.

### Stop/delete/rebuild

```bash
gh codespace stop --codespace NAME
gh codespace rebuild --codespace NAME
gh codespace delete --codespace NAME
```

Stop is medium risk; delete/rebuild is high risk because state may be lost. Ask first.

### Logs

```bash
gh codespace logs --codespace NAME
```

Use logs to diagnose devcontainer build failures, package install errors, or port/service startup issues.

### Ports

```bash
gh codespace ports --codespace NAME
gh codespace ports visibility 3000:private --codespace NAME
```

Changing visibility can expose services. Ask before making ports public/org-visible. Verify no secrets/debug dashboards are exposed.

### SSH and copy

```bash
gh codespace ssh --codespace NAME
gh codespace cp localfile NAME:/workspaces/repo/path
gh codespace cp NAME:/workspaces/repo/artifact ./artifact
```

File copy can exfiltrate or inject sensitive data. Confirm paths and redact secrets in logs.

## Troubleshooting

| Symptom | Check |
|---|---|
| Codespace not listed | auth scope/account/host; repo access; `gh auth status` |
| Devcontainer build failed | `gh codespace logs`; inspect `.devcontainer/devcontainer.json` |
| Service inaccessible | `gh codespace ports`; service bind address (`0.0.0.0` vs localhost) |
| SSH fails | `gh auth setup-git`, key setup, codespace state |
| Port public accidentally | set private immediately, review logs/access, rotate exposed secrets if needed |
