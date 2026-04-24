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
