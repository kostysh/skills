# GitHub Actions Security Review

Use this file for `.github/workflows/*.yml`, `action.yml`, local actions, release automation, and CI scripts.

## Threat Model

Default attacker:

- can open a pull request from a fork
- can control PR title, branch name, changed files, and some comment content
- cannot push to protected branches
- cannot manually trigger privileged workflows

## High-Signal Attack Classes

### Pwn Request

Flag only when all are true:

- `pull_request_target` or another privileged trigger is used
- fork-controlled code, artifacts, dependencies, configuration, or local actions can actually be fetched into an executable path
- a later step executes or interprets that untrusted material with secrets, write permissions, privileged caches, internal runner access, or another meaningful privilege

Do not stop at the YAML shape. Verify the exact checkout/action version and configuration, built-in protections, explicit unsafe opt-outs, alternate `git fetch` or artifact download paths, workspace path, and whether subsequent tools such as package installation, build, tests, local actions, or config loading execute the material. A protection that prevents the untrusted ref from being fetched breaks reachability; checking out data without executing or interpreting it is not the complete exploit.

### Expression Injection

Flag when attacker-controlled `${{ }}` values are interpolated inside `run:` scripts in externally triggerable workflows.

### Comment-Triggered Execution

Flag when `issue_comment` or slash-command workflows execute commands without strong actor authorization.

### Credential Escalation

Flag when untrusted code can access:

- broad `GITHUB_TOKEN` permissions
- PATs or deploy keys
- cloud credentials
- package publishing credentials

### Supply Chain

Flag:

- unpinned third-party actions
- mutable tag references on sensitive paths
- unsafe cache or artifact reuse across trust boundaries

### AI or Config Poisoning

Flag workflows that execute PR-controlled instructions or scripts from files such as:

- `AGENTS.md`
- `CLAUDE.md`
- `.cursorrules`
- `Makefile`
- local shell scripts

when those files are loaded in a privileged workflow context.

## Detection Hints

- search for privileged triggers such as `pull_request_target`, `workflow_run`, `issue_comment`, and manual dispatch flows that can reach secret-bearing jobs
- inspect built-in checkout protections and unsafe opt-outs, but also look for `git fetch`, `gh pr checkout`, archive/artifact download, or custom actions that bypass checkout-specific protection
- inspect `permissions:`, `secrets:`, OIDC setup, publish credentials, and environment protection rules
- search for `actions/checkout`, local actions, or repo scripts executed after fork-controlled content is fetched
- inspect `run:` blocks for attacker-controlled `${{ }}` interpolation, comment bodies, PR titles, branch names, or filenames
- inspect `uses:` entries for unpinned third-party actions and mutable tag references
- if a workflow gates publish, deploy, rollback, or release promotion on stored admission decisions, evidence refs, idempotency keys, or caller-selected release/runtime/deployment refs, also use `references/policy-governance-admission.md`

## What to Verify Before Reporting

- whether the trigger is actually reachable by forks or other untrusted actors
- whether the exact action/runtime configuration permits the untrusted ref or artifact to reach the workspace despite built-in protections
- whether any later command executes, imports, installs, sources, renders, or otherwise interprets that untrusted material
- whether branch protection, environment approval, or actor allowlists already block the exploit path
- whether a suspicious expression is only used in metadata fields such as `if:` or `with:` rather than in a shell execution context
- whether release refs are bound to immutable runtime artifacts and protected deployment identities when that binding decides publish, deploy, or rollback authority

## Safe Patterns

Usually safe:

- `pull_request` with default read-only fork context
- numeric-only expressions in `run:`
- `${{ }}` in `if:` or `with:` rather than inside shell code
- full commit SHA pinning for third-party actions
- minimal permissions and no secret access on untrusted triggers

## Evidence Standard

For every reported issue, show:

1. attacker entry point
2. payload or controllable value
3. execution mechanism
4. credential or write impact
5. concrete remediation
