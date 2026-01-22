---
name: git-engineer
description: Enforce Conventional Commits, Git hygiene, and worktree-based isolation. Use when making commits, crafting commit messages, splitting changes into multiple commits, deciding between merge/rebase/cherry-pick, or setting up git worktrees in any repo.
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
  - **Monorepo rule:** when the change targets a specific package area, use the **package name** (folder under `packages/`) as the scope, e.g. `kb-api`, `agent-ui`.
  - If the change is **package-wide** (applies to the whole package), **omit the scope**.
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

## Git worktrees (isolation workflow)

Use when starting feature work that needs isolation from the current workspace or before executing implementation plans.

Announce at start: "I'm using the git worktrees workflow to set up an isolated workspace."

### Directory selection process

Follow this priority order:

#### 1) Check existing directories

```bash
# Check in priority order
ls -d .worktrees 2>/dev/null     # Preferred (hidden)
ls -d worktrees 2>/dev/null      # Alternative
```

If found, use that directory. If both exist, `.worktrees` wins.

#### 2) Check AGENTS.md

```bash
grep -i "worktree.*director" AGENTS.md 2>/dev/null
```

If a preference is specified, use it without asking.

#### 3) Ask the user

If no directory exists and no AGENTS.md preference:

```
No worktree directory found. Where should I create worktrees?

1. .worktrees/ (project-local, hidden)
2. ~/.config/superpowers/worktrees/<project-name>/ (global location)

Which would you prefer?
```

### Safety verification

For project-local directories (`.worktrees` or `worktrees`), verify the directory is ignored before creating the worktree:

```bash
# Check if directory is ignored (respects local, global, and system gitignore)
git check-ignore -q .worktrees 2>/dev/null || git check-ignore -q worktrees 2>/dev/null
```

If NOT ignored:
1. Add the appropriate line to `.gitignore`.
2. Commit the change.
3. Proceed with worktree creation.

Why this is critical: prevents accidentally committing worktree contents to the repository.

For global directory (`~/.config/superpowers/worktrees`): no `.gitignore` verification needed.

### Creation steps

1) Detect project name:

```bash
project=$(basename "$(git rev-parse --show-toplevel)")
```

2) Create worktree:

```bash
# Determine full path
case $LOCATION in
  .worktrees|worktrees)
    path="$LOCATION/$BRANCH_NAME"
    ;;
  ~/.config/superpowers/worktrees/*)
    path="~/.config/superpowers/worktrees/$project/$BRANCH_NAME"
    ;;
esac

# Create worktree with new branch
git worktree add "$path" -b "$BRANCH_NAME"
cd "$path"
```

3) Run project setup (auto-detect):

```bash
# Node.js
if [ -f package.json ]; then npm install; fi

# Rust
if [ -f Cargo.toml ]; then cargo build; fi

# Python
if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
if [ -f pyproject.toml ]; then poetry install; fi

# Go
if [ -f go.mod ]; then go mod download; fi
```

4) Verify clean baseline:

```bash
# Examples - use project-appropriate command
npm test
cargo test
pytest
go test ./...
```

If tests fail: report failures, ask whether to proceed or investigate.
If tests pass: report ready.

5) Report location:

```
Worktree ready at <full-path>
Tests passing (<N> tests, 0 failures)
Ready to implement <feature-name>
```

### Quick reference

| Situation | Action |
|-----------|--------|
| `.worktrees/` exists | Use it (verify ignored) |
| `worktrees/` exists | Use it (verify ignored) |
| Both exist | Use `.worktrees/` |
| Neither exists | Check AGENTS.md → Ask user |
| Directory not ignored | Add to .gitignore + commit |
| Tests fail during baseline | Report failures + ask |
| No package.json/Cargo.toml | Skip dependency install |

### Common mistakes

#### Skipping ignore verification
- Problem: Worktree contents get tracked, pollute git status
- Fix: Always use `git check-ignore` before creating project-local worktree

#### Assuming directory location
- Problem: Creates inconsistency, violates project conventions
- Fix: Follow priority: existing > AGENTS.md > ask

#### Proceeding with failing tests
- Problem: Can't distinguish new bugs from pre-existing issues
- Fix: Report failures, get explicit permission to proceed

#### Hardcoding setup commands
- Problem: Breaks on projects using different tools
- Fix: Auto-detect from project files (package.json, etc.)

## Splitting changes (guidance)
- Group by purpose: feature vs. fix vs. docs vs. infra.
- Keep commits small and reviewable; avoid unrelated changes in one commit.
- If changes touch multiple packages, prefer separate commits per affected package rather than one combined commit.
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
