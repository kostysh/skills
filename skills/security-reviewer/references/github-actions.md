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

Flag when both are true:

- `pull_request_target` or another privileged trigger is used
- fork-controlled code or local actions are checked out and executed

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
