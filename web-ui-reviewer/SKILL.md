---
name: web-ui-reviewer
description: Review web UI code for Web Interface Guidelines compliance (accessibility, UX, typography, forms, content handling, performance). Use when asked to review UI/UX, audit design, check accessibility, or review web interfaces.
---

# Web UI Reviewer

## Scope
Review web UI code (HTML/CSS/JS/React/etc.) against the Web Interface Guidelines.

## When to use
- UI/UX reviews
- Accessibility checks
- Design audits
- "Review my UI" requests

## Workflow
1. Identify files or patterns to review. If none are provided, ask the user.
2. Load `references/web-interface-guidelines.md`.
3. Review the code against all rules in the guidelines.
4. Output findings in the format required by the guidelines.

## Output format
- Use the terse `file:line` format required by the guidelines.
- Keep findings brief and high signal.
- Include a short fix hint when helpful.

Example:
```
src/components/Nav.tsx:42 Icon-only button missing aria-label
src/pages/Login.tsx:88 Input missing autocomplete
```

## Tools
- Use `rg` for file discovery and text search when available. If not, fall back to `git grep` (inside a repo) or `grep`/`find`.
