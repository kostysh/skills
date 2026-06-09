# Research basis and design influences

This skill intentionally combines patterns from official documentation, the GitHub CLI command surface, and existing public agent skills around `gh`.

## Format and packaging influences

- Agent skills are packaged as a folder with a required `SKILL.md` and optional `scripts/`, `references/`, and `assets/`.
- `SKILL.md` is a routing and instruction entrypoint; detailed procedures belong in references for progressive disclosure.
- Codex-compatible skills may include `agents/openai.yaml` for Codex-specific guidance.

## `gh` command-surface coverage goal

The skill aims to cover practical workflows around these `gh` families:

- Core: `auth`, `codespace`, `gist`, `issue`, `pr`, `project`, `release`, `repo`, `skill`.
- GitHub Actions: `cache`, `run`, `workflow`.
- Additional: `alias`, `api`, `attestation`, `browse`, `completion`, `config`, `extension`, `gpg-key`, `label`, `ruleset`, `search`, `secret`, `ssh-key`, `status`, `variable`.

The goal is not to duplicate the manual. The goal is to choose safe workflows, approvals, and evidence-gathering commands for common user intents.

## Skill design influences

- OpenAI `gh-address-comments`: review comments and GraphQL review-thread inspection.
- OpenAI `gh-fix-ci`: CI debugging sequence, log inspection, summarize-before-fix, approval before implementation.
- `mastering-github-cli`: broad command-map orientation across search, repo, PR, issue, run, workflow, and API.
- `gh-cli` transport-policy skills: prefer authenticated `gh` and shallow clones over raw URLs and manual contents API decoding.
- GitHub Projects skills: project scope checks, schema export, item export, and human-readable field updates.
- Release skills: avoid unsafe direct release shortcuts, use tags as evidence, prefer PR/signing/CI/draft release flows, edit notes by file.
- PR-loop skills: inspect review threads, mergeability, CI, conflicts, and adjacent code before claiming a PR is ready.
- Setup skills: auth doctor and targeted scope remediation.

## Gap coverage added here

This skill intentionally gives first-class playbooks for areas often missing from narrower `gh` skills:

- Codespaces lifecycle and port safety.
- Secrets, variables, SSH/GPG keys, deploy keys, and redacted secret planning.
- Rulesets, branch protection, repo admin, and security configuration.
- `gh alias`, `gh extension`, `gh config`, and `gh skill` lifecycle.
- Bulk operation safety and dry-run planning.
- A safer generic `gh api` wrapper for REST gaps.

## Maintenance notes

`gh` evolves quickly. Keep the top-level `SKILL.md` stable and update reference files/scripts when command fields or API schemas drift. When a helper script exists only to compensate for CLI/API rough edges, keep it small, documented, and read-only by default.
