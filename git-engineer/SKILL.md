---
name: git-engineer
description: Enforce Conventional Commits and reliable Git hygiene. Use when making commits, crafting commit messages, splitting changes into multiple commits, or deciding between merge/rebase/cherry-pick in any repo.
---

# Git Engineer

## Overview

Ensure all commits follow Conventional Commits and keep history clean, minimal, and reviewable.

## Conventional Commits (required)

Use this format for all commits unless the user explicitly asks otherwise:

```
<type>(<scope>)?: <subject>

<body>

<footer>
```

Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `build`, `ci`, `chore`, `revert`.

Rules:
- Subject is imperative, lower-case, no trailing period.
- Scope is optional but preferred and must follow repo conventions:
  - **Monorepo rule:** use the **package name** (folder under `packages/`) as the scope, e.g. `kb-api`, `agent-ui`.
  - If changes span **multiple packages**, use a shared scope like `monorepo` (or follow the repo’s established multi-package scope if defined).
  - If the change is **root-level** (tooling/infra/config shared by all), **omit the scope**.
- Use `BREAKING CHANGE:` footer for breaking changes.

Examples:
- `feat(kb-api): add output validation middleware`
- `fix(agent-ui): remove skip ci from changelog automation`
- `chore: update shared tooling configuration`
- `refactor(kb-api): rename config keys`

Breaking change example:
```
refactor(kb-api): rename config keys

BREAKING CHANGE: renamed config keys require updates in all consumers
```

## Emojis (recommended)
Prefix the subject with an emoji that matches the commit type:
- feat → ✨
- fix → 🐛
- refactor → ♻️
- perf → ⚡
- test → 🧪
- docs → 📝
- build → 🏗️
- ci → 👷
- chore → 🔧
- revert → ⏪

Example: `feat(server): ✨ add output validation middleware`

## Workflow for commits

1. Inspect status: `git status -sb`
2. Stage only the intended files.
3. If changes mix concerns, split into multiple commits.
4. Write a Conventional Commit message.
5. Confirm status is clean.

## Splitting changes (guidance)
- Group by purpose: feature vs. fix vs. docs vs. infra.
- Keep commits small and reviewable; avoid unrelated changes in one commit.
- If the user requests separate commits, honor the split explicitly.

## Rebase vs merge (when asked)
- Default to rebase for a linear history unless the user asks for merge commits.
- Use merge when preserving branch context is required.

## Commit message selection cheatsheet
- `feat`: new behavior/user-facing capability
- `fix`: bug fix
- `refactor`: code change without behavior change
- `perf`: performance improvement
- `test`: add/change tests
- `docs`: documentation only
- `build`: build system/deps
- `ci`: CI config changes
- `chore`: tooling, formatting, maintenance
- `revert`: revert prior commit

## Exceptions
- If the repo already enforces a different convention, follow that repo’s rules and note the exception.
