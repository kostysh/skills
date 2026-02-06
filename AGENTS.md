# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a collection of custom Claude Code skills - reusable instruction sets that give Claude specialized capabilities for different development domains.

## Skill Structure

Each skill follows this structure:

```
skill-name/
├── SKILL.md              # Main skill definition (required)
├── references/           # Detailed reference docs (optional)
│   └── topic.md
├── assets/               # Config templates, scripts (optional)
└── scripts/              # Utility scripts (optional)
```

### SKILL.md Format

Every SKILL.md must have YAML frontmatter:

```yaml
---
name: skill-name
description: |
  Clear description of when to use this skill.
  Multi-line descriptions use pipe syntax.
allowed-tools: Bash(tool-pattern:*)  # Optional: tool permissions
---
```

After frontmatter, include the skill instructions in Markdown.

## Skill Categories

| Category | Skills | Purpose |
|----------|--------|---------|
| Git | `git-engineer` | Conventional Commits, worktrees, commit hygiene |
| TypeScript | `typescript-engineer`, `typescript-test-engineer` | Language patterns, testing |
| Frontend | `react-spa-engineer`, `frontend-design`, `antd-engineer`, `antd-components` | React SPAs, creative design, Ant Design |
| Backend | `hono-engineer`, `supabase-engineer` | Hono framework, Supabase integration |
| Tools | `agent-browser`, `web-ui-reviewer` | Browser automation, UI code review |

## Skill Interop Convention

Skills can reference each other for layered capabilities:
- `react-spa-engineer` uses `typescript-engineer` as baseline for TypeScript rules
- `typescript-engineer` defers testing patterns to `typescript-test-engineer`
- Framework skills handle framework APIs; language skills handle language rules

When conflict exists: language/toolchain skill wins for language matters, framework skill wins for framework APIs.

## Writing Skills

When creating or modifying skills:
- Keep SKILL.md focused on quick-reference rules and decision guidance
- Move detailed documentation to `references/` files
- Link to references with relative paths: `[Topic](references/topic.md)`
- Avoid duplication across skills: if guidance already lives in another skill, reference that skill by name instead of copying
- Cross-skill references must use the skill name only (no relative file links to other skills)
- Use tables for quick lookup (anti-patterns, command grids, decision matrices)
- Include explicit "When to use" and "When NOT to use" sections
- Define interop priority when the skill works alongside others

## Portable Skills (Required)

All skills in this `custom` folder must be created and maintained as **PORTABLE** skills.

Portable means:
- A skill remains fully functional when the entire `custom` directory is copied to another machine.
- The skill does not depend on machine-specific absolute paths.
- The skill does not require external local files outside its own folder to understand core behavior.
- Core practices, rules, and examples live inside the skill itself (`SKILL.md` and its local `references/`, `scripts/`, `assets/`).

Required rules:
- Do not reference absolute local paths like `/code/projects/...`, `/home/...`, `C:\\...`.
- Do not rely on repo-specific docs outside the skill folder as mandatory prerequisites.
- Use only relative paths inside the same skill directory when linking local files.
- If external docs are mentioned, treat them as optional context, never as required dependency.
- Keep instructions environment-agnostic; document assumptions explicitly when unavoidable.

Portability check before finishing changes:
- Search the skill folder for absolute paths and remove them.
- Confirm all required references exist inside the same skill folder.
- Ensure copied skill remains understandable and usable in isolation.
