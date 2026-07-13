---
name: gh-utility
description: Use when a task requires the installed GitHub CLI (`gh`) for
  repositories, issues, pull requests, Actions, releases, Projects, Codespaces,
  secrets, variables, rulesets, search, API access, or preview-stage `gh skill`
  commands. Select and run native `gh` commands, keep the target explicit, and
  verify GitHub state after changes. Route local Git history, code review, CI
  remediation, security judgment, and skill authoring to their owning skills.
license: MIT
compatibility: Requires GitHub CLI gh and network access to the relevant GitHub
  host. Command families, flags, and JSON fields that may vary by version must
  be checked against installed help.
metadata:
  source-version: 1.2.0
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: d41804661eb156603c450da6b437c0d573bbe0e6f6b963bd374c2b3c82896894
---

# gh-utility

## Start here

1. Confirm the task concerns GitHub state and can be handled with the installed gh CLI.
2. Resolve the host, repository or organization, resource identifier, and requested outcome.
3. Load only the reference matching the use case, then use native gh commands directly.
4. After a mutation, run a fresh native gh read and report the observed result or failure.

## When to use this skill

- Inspecting or changing GitHub repositories, issues, pull requests, Actions, releases, Projects, Codespaces, rulesets, secrets, variables, keys, search, API resources, or gh skill state.
- Translating a GitHub request or URL into native gh commands.
- Diagnosing gh authentication, host, permissions, API, or rate limits.

## When NOT to use this skill

- Local commits, rebases, worktrees, branch history, or push policy; use git-engineer.
- Code-review judgment or review-feedback remediation; use code-reviewer or gh-address-comments.
- Diagnosing and fixing CI failures; use gh-fix-ci, with gh-utility limited to GitHub inspection.
- Security findings or control judgments; use security-reviewer.
- Skill authoring, compilation, or review; use skill-creator, skill-source-compiler, or skill-reviewer.

## Overview

`gh-utility` is a use-case guide for the installed GitHub CLI. It does not ship or require a
wrapper, proxy, helper CLI, runtime, or alternate transport.

For each task, identify the GitHub host and target resource, choose the narrowest native `gh`
command, run it directly, and inspect its output. Use explicit `--repo`, `--hostname`, or owner
selectors whenever current-directory context could be ambiguous. After a mutation, run a fresh
native read command to verify the resulting GitHub state.

An exact user request authorizes that exact target and action. Ask only when the target, action,
destructive scope, or secret handling is ambiguous. Never infer code-review, CI-remediation,
security, or local-Git decisions that belong to specialized skills.

## Workflow stages

### Workflow stage: Select the native gh command

Choose the smallest installed gh command for the requested GitHub use case.

1. Resolve the host, target, and resource identifier.
2. Check installed gh help when command syntax or JSON fields are uncertain.

Validation:

- The command and target are explicit.

### Workflow stage: Run gh directly

Execute the native gh command without an intermediary transport.

1. Use explicit repository, owner, or hostname selectors when context is ambiguous.
2. Run only the requested and authorized mutation.

Validation:

- The command output or failure is captured without exposing secrets.

### Workflow stage: Verify the result

Confirm the requested GitHub state after a mutation.

1. Run a fresh native gh read for the changed resource.
2. Report the observed result, command failure, or remaining external evidence boundary.

Validation:

- Completion is based on current gh output, not on a shown command or dry-run.

## Interop priority

- **Local Git history, worktrees, commits, rebases, and push policy:** git-engineer. gh-utility covers native GitHub CLI use; git-engineer owns local Git decisions.
- **Review findings and feedback remediation:** code-reviewer or gh-address-comments when available. gh-utility may fetch or post GitHub state but does not decide code findings or fixes.
- **Failing pull-request checks:** gh-fix-ci when available. gh-utility may inspect checks; the specialized skill owns diagnosis and remediation.
- **Security findings and policy judgment:** security-reviewer. gh-utility operates gh and does not issue security verdicts.

## Gotchas

- **high** — gh command families, flags, and JSON fields vary by installed version; check gh help before using uncertain syntax.
- **high** — Use explicit --repo or --hostname when the current checkout or host could select the wrong target.
- **medium** — GitHub may expose only a link for external CI; report that boundary instead of claiming external-provider state.

## Policies

### Native gh first
Use installed gh commands directly. This skill ships no helper today; a future helper may only aggregate native gh reads or run a simple explicit sequence of native gh calls, never proxy transport, authorization, redaction, mutation policy, or semantic verdicts.

### Authorization
An exact unambiguous request authorizes that action and target; ask only when action, target, destructive scope, or secret handling remains ambiguous.

### Secret confidentiality
Never print, log, echo, or persist secret and token values; use native gh secret and variable input mechanisms.

### Evidence
Report command output and fresh post-action reads honestly; help, dry-run, or validation output does not prove a GitHub mutation occurred.

## Optional references
- [Safety rules](references/safety-rules.md) — Read before a destructive mutation, secret or key operation, release publication, admin change, or bulk operation.
- [Auth and scopes](references/auth-and-scopes.md) — Read when gh is missing, unauthenticated, on the wrong host, or lacks permission.
- [API, search, and URL routing](references/api-search-and-url-routing.md) — Read for GitHub URLs, cross-repository search, gh api, GraphQL, pagination, or rate limits.
- [Repository, issue, and pull request use cases](references/repo-issue-pr-playbook.md) — Read for repository metadata, issues, labels, milestones, or pull requests.
- [PR, CI, and review inspection](references/pr-ci-review-loop.md) — Read for GitHub-side PR checks, review state, threads, merge, or monitoring.
- [Admin and security use cases](references/admin-security-playbook.md) — Read for rulesets, branch protection, settings, secrets, variables, keys, or organization administration.
- [Bulk operations](references/bulk-operations.md) — Read when one request affects multiple repositories or independent GitHub resources.
- [GitHub Projects](references/projects-playbook.md) — Read for GitHub Projects schema, items, fields, exports, or updates.
- [Releases](references/release-playbook.md) — Read for release inspection, drafts, publication, assets, attestations, or recovery.
- [Codespaces](references/codespaces-and-dev-envs.md) — Read for Codespaces lifecycle, ports, logs, SSH, file copy, cost, or data-loss decisions.
- [gh command map](references/command-map.md) — Read when the task spans several gh command families or command availability is unclear.
- [gh skill management](references/gh-skill-management.md) — Read for preview, install, list, update, search, or publish in the preview-stage gh skill family.
- [Troubleshooting](references/troubleshooting.md) — Read after a gh command fails, returns incomplete data, or targets the wrong host or repository.

## Bundled assets

- `assets/gh_task_report_template.md` — GitHub task report template.
- `assets/issue_template.md` — Issue body template.
- `assets/pr_body_template.md` — Pull request body template.
- `assets/pr_comment_triage_template.md` — Pull request comment triage template.
- `assets/project_fields_template.yaml` — GitHub Project field plan template.
- `assets/release_notes_template.md` — Release notes template.
- `assets/repo_batch_template.csv` — Repository batch inventory template.
- `assets/workflow_dispatch_inputs.json` — Workflow-dispatch input review template.

## Portability rules

- Keep mandatory guidance, references, assets, license, and UI metadata inside this skill folder.
- Use only relative local links and explicit GitHub host or repository selectors.
- Do not depend on Node.js, package metadata, proxy CLIs, or files outside the skill folder.
- If a future script is justified, keep it to transparent aggregation or a simple sequence of native gh calls with no independent policy or transport semantics.

## Portability checklist before finishing

- Run skill-source-compiler lint, regenerate, and check after source edits.
- Compile to an isolated directory and confirm that no source, tests, package metadata, or scripts are emitted.
- Search active and declared files for machine-specific absolute filesystem dependencies.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
- Supporting glob: `docs/logs/*`

## Final checks

Before reporting completion:

- confirm that the command belongs to the installed `gh` version
- name the host, repository or organization, and resource identifier
- distinguish commands shown from commands actually run
- after a mutation, include the fresh native `gh` read used to verify the result
- report command failures or incomplete external-provider evidence without guessing
- never print tokens, secret values, or sensitive command payloads
