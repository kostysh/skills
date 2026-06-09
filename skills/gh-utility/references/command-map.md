# gh command map

Use this reference when the task spans multiple `gh` command families or when you need a quick read-only/mutating command split.

## Global defaults

- Prefer `--repo OWNER/REPO` when not operating from the target checkout.
- Prefer `--json ... --jq ...` for machine-readable inspection.
- Use `GH_PROMPT_DISABLED=1` only in non-interactive scripts; do not disable prompts for user-facing login flows.
- For GitHub Enterprise, include `--hostname HOST` where supported or set `GH_HOST`.
- Check command availability with `gh help <family>` because fields and subcommands drift by version.

## Command families

| Family | Read-only / inspect | Mutating / risky | Notes |
|---|---|---|---|
| `auth` | `gh auth status`, `gh auth token` (avoid printing), `gh auth setup-git` | `gh auth login/logout/refresh/switch` | Never paste tokens in chat. Prefer browser/device login. |
| `repo` | `view`, `list`, `clone`, `fork --clone=false`, `license`, `gitignore`, `deploy-key list`, `autolink list` | `create`, `edit`, `delete`, `archive`, `unarchive`, `rename`, `sync`, `deploy-key add/delete`, `autolink create/delete` | Repo delete/archive/visibility/default branch changes are high-risk. |
| `issue` | `list`, `view`, `status` | `create`, `edit`, `comment`, `close`, `reopen`, `lock`, `unlock`, `pin`, `unpin`, `transfer`, `develop` | Use `--body-file` for long text. |
| `pr` | `list`, `view`, `status`, `diff`, `checks`, `checkout` | `create`, `edit`, `comment`, `review`, `ready`, `merge`, `close`, `reopen`, `lock`, `unlock`, `update-branch`, `revert` | Merge, close, force update, and review-thread resolution need approval. |
| `run` | `list`, `view`, `watch`, `download` | `rerun`, `cancel`, `delete` | Prefer `gh run view --log-failed` for CI debugging. |
| `workflow` | `list`, `view` | `run`, `enable`, `disable` | Dispatching production workflows needs confirmation and input review. |
| `cache` | `list` | `delete` | Cache delete can affect CI performance; ask before bulk delete. |
| `release` | `list`, `view`, `download`, `verify`, `verify-asset` | `create`, `edit`, `upload`, `delete`, `delete-asset` | Prefer signed/existing tags, draft releases, `--notes-file`, and verification. |
| `project` | `list`, `view`, `field-list`, `item-list` | `create`, `copy`, `edit`, `delete`, `close`, `link`, `unlink`, `field-create/delete`, `item-*` | Usually needs `project` auth scope. Export before bulk changes. |
| `search` | `repos`, `code`, `issues`, `prs`, `commits` | none | Rate-limited. Partition large searches by date/org/language. |
| `api` | `gh api -X GET ENDPOINT`, `gh api graphql` queries | REST `POST/PATCH/PUT/DELETE`, GraphQL mutations | Always use explicit method. Prefer helper `scripts/gh-utility.mjs safe-api`. |
| `ruleset` | `list`, `view`, `check` | most writes via API | Treat as admin/high-risk; export current settings first. |
| `secret` | `list` | `set`, `delete` | Values are never returned. Do not print values. Use stdin/env-file. |
| `variable` | `list`, `get` | `set`, `delete` | Variables are less sensitive than secrets but can affect production workflows. |
| `ssh-key` | `list` | `add`, `delete` | Key add/delete requires identity review. |
| `gpg-key` | `list` | `add`, `delete` | Confirm key owner and fingerprint. |
| `repo deploy-key` | `list` | `add`, `delete` | Deploy keys grant repo access; high-risk. |
| `codespace` | `list`, `view`, `logs`, `ports` | `create`, `delete`, `edit`, `rebuild`, `stop`, `ports visibility`, `cp`, `ssh`, `code`, `jupyter` | Port visibility and file copy can expose data. |
| `gist` | `list`, `view`, `clone` | `create`, `edit`, `rename`, `delete` | Confirm public/private intent before create. |
| `org` | `list` | mostly API | Org settings usually require admin scopes. |
| `label` | `list` | `create`, `edit`, `delete`, `clone` | Labels are low/medium risk; clone/delete in active repos needs review. |
| `alias` | `list` | `set`, `delete`, `import` | Alias can hide dangerous commands; inspect values. |
| `extension` | `list`, `search`, `browse` | `install`, `remove`, `upgrade`, `exec`, `create` | Extensions execute code; inspect source before install/exec. |
| `config` | `list`, `get` | `set`, `clear-cache` | Avoid changing global config unless user asked. |
| `skill` | `search`, `preview`, `update --dry-run` | `install`, `update`, `publish` | Preview and pin skills; they can contain scripts/instructions. |
| `attestation` | `verify`, `download`, `trusted-root` | none typical | Use for release artifact provenance checks. |
| `browse` | opens URLs | browser side effect | Safe but may not work in headless environments. |
| `status` | dashboard summary | none | Good first command for personal GitHub status. |

## High-value `--json` patterns

```bash
gh repo view OWNER/REPO --json nameWithOwner,defaultBranchRef,viewerPermission,visibility,isArchived,url
gh pr view 123 --repo OWNER/REPO --json number,title,url,state,author,headRefName,baseRefName,mergeable,mergeStateStatus,reviewDecision,reviewThreads
gh pr checks 123 --repo OWNER/REPO --json name,state,bucket,link,workflow,startedAt,completedAt
gh run list --repo OWNER/REPO --limit 20 --json databaseId,workflowName,status,conclusion,event,createdAt,headBranch,url
gh release view v1.2.3 --repo OWNER/REPO --json tagName,name,isDraft,isPrerelease,publishedAt,url,assets
gh project field-list 1 --owner OWNER --format json
gh ruleset list --repo OWNER/REPO --json id,name,target,enforcement,source
gh search prs "repo:OWNER/REPO is:open review:required" --json number,title,url,author,updatedAt
```

## When no top-level command exists

Use `gh api` with explicit method:

```bash
# REST read with query params
gh api -X GET repos/OWNER/REPO/actions/runs -f per_page=20 -f status=failure

# GraphQL read
gh api graphql -f query='query($owner:String!,$repo:String!){ repository(owner:$owner,name:$repo){ id nameWithOwner } }' -F owner=OWNER -F repo=REPO
```

For mutations, route through `scripts/gh-utility.mjs safe-api --confirm-mutation` only after the user approves the exact command.
