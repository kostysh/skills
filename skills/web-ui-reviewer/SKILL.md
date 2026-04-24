---
name: web-ui-reviewer
description: Review web UI code for Web Interface Guidelines compliance
  (accessibility, UX, typography, forms, content handling, performance). Use
  when asked to review UI/UX, audit design, check accessibility, or review web
  interfaces.
metadata:
  source-version: 0.1.0
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: e1b34d00ac32b4b7cd4961cda68feab54997e230d5a679791d72555b32381253
---

# web-ui-reviewer

## Start here

1. Confirm the task matches web-ui-reviewer's applicability criteria.
2. Use the preserved overview guidance as the normative workflow for this skill.
3. Load only the active references that match the current task.
4. Preserve existing project conventions unless the overview explicitly requires a stricter invariant.

## When to use this skill

- UI/UX reviews
- Accessibility checks
- Design audits
- "Review my UI" requests

## When NOT to use this skill

- The task is not a web UI, UX, accessibility, design, typography, form, content handling, or frontend performance review.
- The task is implementation work rather than review; use the relevant frontend or framework skill.
- The task is a security-first audit; use security-reviewer.

## Overview

## Scope
Review web UI code (HTML/CSS/JS/React/etc.) against the Web Interface Guidelines.

## Workflow
1. Identify files or patterns to review. If none are provided, ask the user.
2. If browsing/retrieval is available, fetch the latest Web Interface Guidelines from the canonical source and use them as a freshness overlay:
   `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`
3. Load `references/web-interface-guidelines.md` as the portable baseline and fallback.
4. Review the code against the complete rule set. Flag real interface issues, not product preferences.
5. Group findings by file. If a reviewed file is clean, emit `✓ pass`.
6. If the review scope is partial, state which files or patterns were reviewed.

## Output format
- Group findings by file using the terse `file:line - finding` format required by the guidelines.
- Keep findings brief, high signal, and actionable.
- Include a short fix hint when helpful.
- Avoid long explanations unless the fix is non-obvious.

Example:
```

## src/components/Nav.tsx

src/components/Nav.tsx:42 - icon-only button missing aria-label

## src/pages/Login.tsx

src/pages/Login.tsx:88 - input missing autocomplete

## src/components/Card.tsx

✓ pass
```

## Tools
- Use `rg` for file discovery and text search when available. If not, fall back to `git grep` (inside a repo) or `grep`/`find`.

## Workflow stages

### Workflow stage: Apply web-ui-reviewer guidance

Apply the preserved web-ui-reviewer guidance without changing its domain behavior.

1. Match the request to the applicability criteria.
2. Follow the preserved overview sections for the concrete work.
3. Read the smallest relevant active reference before using detailed guidance from it.
4. Run the relevant verification from the overview or report why it could not be run.

Validation:

- The outcome follows the preserved skill guidance and any loaded reference constraints.

## Required active references
- [Web Interface Guidelines](references/web-interface-guidelines.md) — Read this when you need the portable Web Interface Guidelines baseline and fallback.

## Portability rules

- Do not reference machine-specific absolute paths or local files outside this skill folder.
- Keep all mandatory web-ui-reviewer guidance inside this skill folder.
- Use relative links for local references, assets, scripts, tests, and supporting docs.

## Portability checklist before finishing

- Run the skill-source-compiler check command after regeneration.
- Search the skill folder for absolute local paths before finishing.
- Confirm every required reference listed by SKILL.md exists inside this skill folder.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
