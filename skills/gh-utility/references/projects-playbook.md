# GitHub Projects playbook

Use this file for GitHub Projects setup, inspection, field updates, draft issues, linking issues/PRs, export, and bulk cleanup.

## Auth and target

Projects commonly require the `project` scope:

```bash
gh auth status
gh auth refresh -s project
```

Always identify:

- owner login/org
- project number
- project ID
- field IDs and option IDs for updates
- item IDs for item edits

## Inspect before edits

```bash
gh project list --owner OWNER --format json
gh project view 1 --owner OWNER --format json
gh project field-list 1 --owner OWNER --format json
gh project item-list 1 --owner OWNER --limit 100 --format json
node scripts/gh-utility.mjs project-snapshot --owner OWNER --project 1 --limit 100 --json
```

Export before bulk changes and keep a local snapshot in the task artifacts.

## Create or link project

```bash
gh project create --owner OWNER --title "Roadmap"
gh project link 1 --owner OWNER --repo OWNER/REPO
```

Create fields only after inspecting existing schema. Preserve team names like `Status`, `Priority`, `Size`, `Target date` unless the user asked to redesign.

```bash
gh project field-create 1 --owner OWNER --name "Priority" --data-type SINGLE_SELECT --single-select-options "P0,P1,P2"
```

## Add work

Draft project item:

```bash
gh project item-create 1 --owner OWNER --title "Draft task" --body "Describe the work"
```

Existing issue or PR:

```bash
gh project item-add 1 --owner OWNER --url https://github.com/OWNER/REPO/issues/123
gh project item-add 1 --owner OWNER --url https://github.com/OWNER/REPO/pull/456
```

Prefer draft items for planning work not tied to a repo. Prefer issues when work is implementation-ready.

## Update item fields

`gh project item-edit` often needs IDs:

```bash
gh project item-edit --id ITEM_ID --project-id PROJECT_ID --field-id FIELD_ID --single-select-option-id OPTION_ID
```

Workflow:

1. `field-list` to find field ID and option IDs.
2. `item-list` to find item ID.
3. Update one field at a time.
4. Re-run `item-list` to verify.

## Bulk updates

Bulk project operations are medium-risk. Default to dry-run tables:

| Item | Current field | Proposed field | Command |
|---|---|---|---|

Then ask for approval. Execute in small batches and stop on first unexpected error.

## Project reporting

Useful reports:

- Items missing status/priority/owner.
- Items linked to closed issues but still active.
- PRs merged but project status not done.
- Draft items older than N days.
- Release milestone/project alignment.

Use `gh project item-list --format json` and summarize. Do not invent workflow states; read field options first.
