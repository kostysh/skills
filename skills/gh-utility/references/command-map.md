# gh command map

Use this reference when the task spans multiple `gh` command families or when you need a quick remote-read/side-effect split. Commands in the right column require the relevant authorization even when their effect is local rather than remote.

## Global defaults

- Prefer `--repo OWNER/REPO` when not operating from the target checkout.
- Prefer `--json ... --jq ...` for machine-readable inspection.
- Use `GH_PROMPT_DISABLED=1` only in non-interactive scripts; do not disable prompts for user-facing login flows.
- For GitHub Enterprise, include `--hostname HOST` where supported or set `GH_HOST`.
- Check command availability with `gh help <family>` because fields and subcommands drift by version.

## Command families

| Family | Remote read / inspect | Remote mutation or local side effect | Notes |
|---|---|---|---|
| `auth` | `gh auth status` | `login`, `logout`, `refresh`, `switch`, `setup-git` (writes Git credential-helper config) | Never run token-retrieval commands in observable agent/tool contexts. Prefer browser/device login. Verify configuration after `setup-git`. |
| `repo` | `view`, `list`, `license`, `gitignore`, `deploy-key list`, `autolink list` | `clone` (local files), `fork` (creates remote repo; may also change local remotes), `create`, `edit`, `delete`, `archive`, `unarchive`, `rename`, `sync`, `deploy-key add/delete`, `autolink create/delete` | Repo fork/delete/archive/visibility/default branch changes are remote mutations. |
| `issue` | `list`, `view`, `status` | `create`, `edit`, `comment`, `close`, `reopen`, `lock`, `unlock`, `pin`, `unpin`, `transfer`, `develop` | Use `--body-file` for long text. |
| `pr` | `list`, `view`, `status`, `diff`, `checks` | `checkout` (local Git state; defer to `git-engineer`), `create`, `edit`, `comment`, `review`, `ready`, `merge`, `close`, `reopen`, `lock`, `unlock`, `update-branch`, `revert` | Merge, close, force update, and thread resolution require exact authorization. |
| `run` | `list`, `view`, `watch` | `download` (local files), `rerun`, `cancel`, `delete` | Prefer `gh run view --log-failed` for CI debugging. |
| `workflow` | `list`, `view` | `run`, `enable`, `disable` | Dispatching production workflows requires exact authorization and input review. |
| `cache` | `list` | `delete` | Cache delete can affect CI performance; require exact authorization for the selected caches. |
| `release` | `list`, `view`, `verify`, `verify-asset` | `download` (local files), `create`, `edit`, `upload`, `delete`, `delete-asset` | Prefer signed/existing tags, draft releases, `--notes-file`, and verification. |
| `project` | `list`, `view`, `field-list`, `item-list` | `create`, `copy`, `edit`, `delete`, `close`, `link`, `unlink`, `field-create/delete`, `item-*` | Usually needs `project` auth scope. Export before bulk changes. |
| `search` | `repos`, `code`, `issues`, `prs`, `commits` | none | Rate-limited. Partition large searches by date/org/language. |
| `api` | `gh api -X GET ENDPOINT`, `gh api graphql` queries | REST `POST/PATCH/PUT/DELETE`, GraphQL mutations | Always use an explicit method and prefer a top-level `gh` command when available. |
| `ruleset` | `list`, `view`, `check` | most writes via API | Treat as admin/high-risk; export current settings first. |
| `secret` | `list` | `set`, `delete` | Values are never returned. Do not print values. Use stdin/env-file. |
| `variable` | `list`, `get` | `set`, `delete` | Variables are less sensitive than secrets but can affect production workflows. |
| `ssh-key` | `list` | `add`, `delete` | Key add/delete requires identity review. |
| `gpg-key` | `list` | `add`, `delete` | Confirm key owner and fingerprint. |
| `repo deploy-key` | `list` | `add`, `delete` | Deploy keys grant repo access; high-risk. |
| `codespace` | `list`, `view`, `logs`, `ports` | `create`, `delete`, `edit`, `rebuild`, `stop`, `ports visibility`, `cp`, `ssh`, `code`, `jupyter` | Port visibility and file copy can expose data. |
| `gist` | `list`, `view` | `clone` (local files), `create`, `edit`, `rename`, `delete` | Confirm public/private intent before create. |
| `org` | `list` | mostly API | Org settings usually require admin scopes. |
| `label` | `list` | `create`, `edit`, `delete`, `clone` | Labels are low/medium risk; clone/delete in active repos needs review. |
| `alias` | `list` | `set`, `delete`, `import` | Alias can hide dangerous commands; inspect values. |
| `extension` | `list`, `search`, `browse` | `install`, `remove`, `upgrade`, `exec`, `create` | Extensions execute code; inspect source before install/exec. |
| `config` | `list`, `get` | `set`, `clear-cache` | Avoid changing global config unless user asked. |
| `skill` | `search`, `preview`, `update --dry-run` | `install`, `update`, `publish` | Preview and pin skills; they can contain scripts/instructions. |
| `attestation` | `verify`, `trusted-root` | `download` (local files) | Use for release artifact provenance checks. |
| `browse` | opens URLs | browser side effect | Safe but may not work in headless environments. |
| `status` | dashboard summary | none | Good first command for personal GitHub status. |

## High-value `--json` patterns

```bash
gh repo view OWNER/REPO --json nameWithOwner,defaultBranchRef,viewerPermission,visibility,isArchived,url
gh pr view 123 --repo OWNER/REPO --json number,title,url,state,author,headRefName,baseRefName,mergeable,mergeStateStatus,reviewDecision
gh pr checks 123 --repo OWNER/REPO --json name,state,bucket,link,workflow,startedAt,completedAt
gh run list --repo OWNER/REPO --limit 20 --json databaseId,workflowName,status,conclusion,event,createdAt,headBranch,url
gh release view v1.2.3 --repo OWNER/REPO --json tagName,name,isDraft,isPrerelease,publishedAt,url,assets
gh project field-list 1 --owner OWNER --format json
gh ruleset list --repo OWNER/REPO
gh api -X GET repos/OWNER/REPO/rulesets --paginate
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

For REST mutations, use `gh api -X METHOD ENDPOINT` directly only after the exact target and action
are authorized, then verify with a separate native read.
