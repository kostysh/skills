# GitHub Projects playbook

Use this file for GitHub Projects setup, inspection, field updates, draft issues, linking issues/PRs, export, and bulk cleanup.

## Auth and target

Use the selected host and project owner. Diagnose permission failures with the
[scoped authentication check](auth-and-scopes.md#first-checks). A missing `project` OAuth scope
may need an authorized scope change on that account. For tasks that require unchanged
credentials, apply the [credential-preserving read guidance](auth-and-scopes.md#credential-preserving-reads)
to project reads.

Identify only the inputs required by the actual installed command:

- List projects: owner login/org.
- Create a project: owner and requested title; no future project or item IDs.
- View, link, or list fields/items: owner and existing project number, plus the repository for linking.
- Edit a field of a linked issue or PR: project owner and number, issue or PR URL, field, and requested value. If using the ID form, supply the applicable project, item, field, and value IDs. Draft items use their command-specific inputs.

Discover existing IDs through native reads. Missing inputs stop only the dependent operation;
continue supported inspection without inventing future IDs.

## Inspect before edits

```bash
gh project list --owner OWNER --format json
gh project view 1 --owner OWNER --format json
gh project field-list 1 --owner OWNER --format json
gh project item-list 1 --owner OWNER --limit 100 --format json
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

With name-based addressing in installed help, use the project owner and number and the linked
issue or PR URL. The repository owner in that URL can differ from the project owner.

```bash
gh project item-edit 1 --owner OWNER --url https://github.com/OWNER/REPO/issues/123 --field Status --value "In Progress"
```

Pass the explicit option name for a single-select field. Use the ID form for draft items without
a URL, older CLI versions, or stable IDs in automation.

```bash
gh project item-edit --id ITEM_ID --project-id PROJECT_ID --field-id FIELD_ID --single-select-option-id OPTION_ID
```

Workflow:

1. Use `field-list` to check the field and value. Resolve IDs with `field-list` and `item-list`
   when using the ID form.
2. Update one field at a time for a linked issue or PR.
3. Re-run `item-list` for the same owner and project and match the issue/PR URL or item ID.
   In text output, `--field Status` adds the field column when supported. Confirm the current
   value and account for output limits before concluding the item is missing.

## Bulk updates

Bulk project operations are medium-risk. Default to dry-run tables:

| Item | Current field | Proposed field | Command |
|---|---|---|---|

Apply the root [Authorization policy](../SKILL.md#authorization) to the listed updates. Use small batches and stop on the first unexpected error.

## Project reporting

Useful reports:

- Items missing status/priority/owner.
- Items linked to closed issues but still active.
- PRs merged but project status not done.
- Draft items older than N days.
- Release milestone/project alignment.

Use `gh project item-list --format json` and summarize. Do not invent workflow states; read field options first.
