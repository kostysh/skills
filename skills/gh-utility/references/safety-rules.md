# Safety rules for gh operations

Use this file whenever a task may mutate GitHub state, touch secrets/keys, publish releases, change branch protection/rulesets, or run bulk operations.

## Inspect-before-mutate contract

1. Resolve the target: host, owner, repo/org/user, resource ID, branch/tag, project number, environment, app (`actions|agents|codespaces|dependabot`).
2. Inspect current state with read-only commands.
3. Summarize state and classify risk.
4. Present exact commands and expected effect.
5. Ask for explicit approval for medium/high-risk operations.
6. Execute only the approved commands.
7. Verify with read-only commands.
8. Report what changed and any incomplete follow-up.

## Risk tiers

### Read-only

Examples: `gh repo view`, `gh pr view`, `gh pr checks`, `gh run view --log-failed`, `gh release view`, `gh project item-list`, `gh secret list`, `gh ruleset list`, `gh codespace list`.

No approval needed beyond ordinary tool execution, unless the output may expose sensitive metadata. Redact tokens and secret values.

### Low-risk mutation

Examples: draft issue creation in a dev repo, non-sensitive label creation, PR body draft update, adding a non-production project draft item.

Approval can be implicit if the user explicitly asked for that exact action and the target is unambiguous. Still show a concise summary afterward.

### Medium-risk mutation

Examples: issue/PR metadata changes, workflow rerun/cancel, project field update, PR review comment reply, release draft body edit, label deletion in an active repo.

Show exact command(s) and ask for approval unless the user supplied exact command and target.

### High-risk mutation

Always require explicit approval:

- Repository delete/archive/transfer/rename/visibility/default branch changes.
- Branch protection or ruleset changes.
- Secret, variable, deploy key, SSH key, or GPG key add/delete/set.
- Release publish/delete, asset delete/upload, tag push/delete, immutable release operations.
- PR merge/close, branch deletion, `git push --force*`.
- Resolving PR review threads.
- Codespace delete/rebuild/port visibility/file copy involving sensitive paths.
- Extension install/upgrade/exec, alias import, skill install/update/publish.
- Any `gh api` REST mutation or GraphQL mutation not already covered by a user-approved action.

## Secret handling

- Never print token/secret values. Do not include them in Markdown, logs, command echoes, or JSON artifacts.
- Prefer `gh secret set NAME` interactive prompt, stdin, or `gh secret set -f .env` after reviewing names.
- In plans, show only: secret name, target, app, environment/org/repo/user, visibility, selected repos, and whether the value is empty/unknown.
- For variables, values may be visible; still avoid printing production credentials accidentally stored as variables.
- Do not use shell history-leaking forms such as `gh secret set NAME --body "actual-secret"`.

## API safety

- Use `gh api -X GET` for reads with `-f` fields.
- Use `scripts/gh-utility.mjs safe-api --dry-run` to show the exact command.
- Require `--confirm-mutation` for `POST/PATCH/PUT/DELETE` or GraphQL mutations.
- Paginate read-only list endpoints when completeness matters.
- For GraphQL mutations, use variables (`-F`) rather than string interpolation where possible.

## Release safety

- Treat tags as source-of-truth. Inspect `git tag`, `git show TAG`, and `gh release view TAG`.
- Do not let `gh release create` create a lightweight tag implicitly unless the user explicitly approved that release strategy.
- Prefer: version bump PR → merge → signed tag on default branch → push tag → CI publishes release → `gh release view` verification.
- When directly creating a release is appropriate, prefer draft first, attach assets, then publish.
- Use `--notes-file` for release notes. Avoid multiline `--notes` shell quoting.

## Bulk safety

- Bulk operations default to dry-run plans.
- Partition by repo/org and show a table: repo, current state, proposed command, risk.
- Execute in small batches, verify after each batch, and stop on first unexpected error unless the user approved continue-on-error.
- Never bulk-delete secrets, variables, releases, tags, branches, rulesets, or repos without a repo-by-repo approval artifact.
