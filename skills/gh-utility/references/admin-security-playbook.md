# Admin and security playbook

Use this file for rulesets, branch protection, repository settings, secrets, variables, deploy keys, SSH/GPG keys, security scans, and org-level operations.

## General admin rule

Admin/security changes are high-risk. Always inspect current state, present a dry-run plan, and get approval.

## Rulesets and branch protection

Read-only:

```bash
gh ruleset list --repo OWNER/REPO --json id,name,target,enforcement,source
gh ruleset view RULESET_ID --repo OWNER/REPO --json id,name,target,enforcement,conditions,rules,bypassActors
gh ruleset check main --repo OWNER/REPO
gh api -X GET repos/OWNER/REPO/branches/main/protection
```

Branch protection writes often require REST API. Export current protection before changes:

```bash
gh api -X GET repos/OWNER/REPO/branches/main/protection > branch-protection.before.json
```

When planning changes, state whether admins are enforced, required status checks, required reviews, required conversation resolution, signed commits, linear history, allowed merge methods, and bypass actors.

## Repository settings

Inspect:

```bash
gh repo view OWNER/REPO --json visibility,isArchived,viewerPermission,defaultBranchRef,deleteBranchOnMerge,mergeCommitAllowed,squashMergeAllowed,rebaseMergeAllowed
gh api -X GET repos/OWNER/REPO --jq '{allow_auto_merge,delete_branch_on_merge,allow_squash_merge,allow_merge_commit,allow_rebase_merge,allow_update_branch}'
```

Changing visibility, default branch, archive/delete, merge methods, or auto-merge policy needs approval.

## Secrets

Read names only:

```bash
gh secret list --repo OWNER/REPO
gh secret list --org ORG
gh secret list --env production --repo OWNER/REPO
```

Plan from dotenv without printing values:

```bash
node scripts/gh-utility.mjs secret-manifest .env --kind secret --repo OWNER/REPO
node scripts/gh-utility.mjs secret-manifest .env --kind secret --repo OWNER/REPO --emit-commands
```

Set secrets safely:

```bash
# Interactive prompt
gh secret set MY_SECRET --repo OWNER/REPO

# From environment variable without printing value
printf '%s' "$MY_SECRET_VALUE" | gh secret set MY_SECRET --repo OWNER/REPO

# From dotenv file after reviewing names
gh secret set -f .env --repo OWNER/REPO
```

Use `--app actions|agents|codespaces|dependabot` explicitly when not the default. For org/user secrets, define `--visibility` and `--repos`/`--no-repos-selected` deliberately.

## Variables

```bash
gh variable list --repo OWNER/REPO
gh variable get NAME --repo OWNER/REPO
gh variable set NAME --repo OWNER/REPO --body "value"
gh variable delete NAME --repo OWNER/REPO
```

Variables can affect production deployments even when not secret. Treat set/delete as medium risk.

## Deploy keys, SSH keys, and GPG keys

```bash
gh repo deploy-key list --repo OWNER/REPO
gh ssh-key list
gh gpg-key list
```

Before adding keys, verify owner, fingerprint, permissions, expiration/rotation plan, and whether read-write access is needed. Do not paste private keys. `gh ssh-key add` and `gh gpg-key add` take public keys only.

## GitHub Actions security checks

```bash
gh workflow list --repo OWNER/REPO --all
gh run list --repo OWNER/REPO --limit 20
gh api -X GET repos/OWNER/REPO/actions/permissions
gh api -X GET repos/OWNER/REPO/code-scanning/default-setup
gh api -X GET repos/OWNER/REPO/dependabot/alerts -f per_page=10
```

For workflow file edits, inspect `permissions:` blocks, pinned action versions, OIDC permissions, secret usage, and `pull_request_target` risks.

## Organization operations

Org-level reads:

```bash
gh org list
gh repo list ORG --limit 100 --json nameWithOwner,visibility,isArchived,updatedAt
gh api -X GET orgs/ORG
```

Org-level writes are high-risk and may need `admin:org`. Prepare a repo-by-repo or setting-by-setting plan.
