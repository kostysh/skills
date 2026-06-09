# Bulk operations playbook

Use this file when a task touches multiple repositories, issues, PRs, releases, projects, secrets, variables, labels, rulesets, workflows, or organization resources.

Bulk operations are where small `gh` mistakes become large incidents. Default to read-only inventory and a dry-run plan.

## Bulk workflow

1. Define the scope: host, org/user, repo allowlist, archived/fork/private visibility filters, and maximum item count.
2. Inventory read-only state into JSON/CSV.
3. Produce a plan table: target, current state, proposed command, risk, rollback, verification.
4. Ask for approval for every medium/high-risk operation.
5. Execute in small batches.
6. Stop on the first unexpected error unless the user approved continue-on-error.
7. Verify with read-only commands and produce a final report.

## Repository inventory

```bash
gh repo list ORG --limit 200 --json nameWithOwner,visibility,isArchived,isFork,defaultBranchRef,url \
  --jq '.[] | select(.isArchived == false) | [.nameWithOwner,.visibility,.defaultBranchRef.name,.url] | @tsv'
```

For large orgs, partition by topic, language, visibility, or archived state. Do not assume default limits return everything.

## CSV-driven repo loops

Use `assets/repo_batch_template.csv` as the input format:

```csv
repo,action,resource,value,notes
OWNER/REPO,audit,rulesets,,read only
OWNER/REPO,set-variable,ENVIRONMENT,staging,requires approval
```

Read-only loop example:

```bash
while IFS=, read -r repo action resource value notes; do
  [ "$repo" = "repo" ] && continue
  gh repo view "$repo" --json nameWithOwner,visibility,isArchived,viewerPermission
  gh ruleset list --repo "$repo" --json id,name,target,enforcement
  gh variable list --repo "$repo"
done < assets/repo_batch_template.csv
```

Mutation loop pattern:

```bash
# 1. Generate commands only
node scripts/gh-utility.mjs secret-manifest .env --repo OWNER/REPO --emit-commands > plan.sh

# 2. Review plan.sh manually
sed -n '1,200p' plan.sh

# 3. Execute only after approval, preferably one repo at a time
bash plan.sh
```

## Bulk labels

Read labels:

```bash
gh label list --repo OWNER/REPO --limit 200 --json name,color,description
```

Create/update labels only after checking collisions:

```bash
gh label create "priority:P1" --repo OWNER/REPO --color FF0000 --description "High priority"
gh label edit "priority:P1" --repo OWNER/REPO --color FF0000 --description "High priority"
```

Deleting labels can rewrite issue/PR triage state. Treat it as medium risk.

## Bulk issues and PRs

Prefer search for inventory:

```bash
gh search issues 'org:ORG is:issue is:open label:bug updated:<2026-01-01' \
  --limit 100 --json repository,number,title,labels,updatedAt,url

gh search prs 'org:ORG is:pr is:open draft:false review:required' \
  --limit 100 --json repository,number,title,reviewDecision,updatedAt,url
```

For edits, produce a table first:

| repo | number | current labels | proposed labels | risk |
|---|---:|---|---|---|

Then use exact commands such as:

```bash
gh issue edit 123 --repo OWNER/REPO --add-label triaged
gh pr edit 456 --repo OWNER/REPO --add-assignee monalisa
```

## Bulk workflows and runs

Read-only:

```bash
gh workflow list --repo OWNER/REPO
gh run list --repo OWNER/REPO --limit 20 --json databaseId,workflowName,status,conclusion,createdAt,url
```

Rerun/cancel/disable can alter CI capacity and release state. Ask first:

```bash
gh run rerun RUN_ID --repo OWNER/REPO --failed
gh run cancel RUN_ID --repo OWNER/REPO
gh workflow disable WORKFLOW --repo OWNER/REPO
```

## Bulk secrets and variables

Secrets: list names only. Do not export values.

```bash
gh secret list --repo OWNER/REPO
gh variable list --repo OWNER/REPO --json name,value,updatedAt
```

For org secrets, define visibility and selected repos deliberately:

```bash
gh secret list --org ORG
gh secret set NAME --org ORG --visibility selected --repos repo-a,repo-b
```

Bulk secret rotation requires a separate approval artifact with secret names, scopes, app target, selected repositories, rollout order, and rollback/verification plan.

## Failure handling

When a batch command fails:

- Capture repo/resource, command family, exit code, and stderr summary.
- Do not retry mutations blindly.
- Check auth/scope/rate limit first.
- Continue only for independent read-only commands or after explicit continue-on-error approval.

## Final report template

```markdown
## Bulk gh task report
Scope: ORG / allowlist
Mode: dry-run | executed
Targets inspected: N
Targets changed: N
Skipped: N
Failures: N
Approval artifact: path or summary
Verification commands: ...
Remaining manual follow-up: ...
```
