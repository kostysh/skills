# Findings Format

Use findings-first output. Keep it concise and behavior-based.

## Severity Labels

| Label | Use for |
|---|---|
| `[blocking]` | likely bug, regression, data risk, broken invariant, missing merge-critical test, compatibility or operational hazard |
| `[important]` | meaningful weakness that should be fixed soon but may not block the current merge |
| `[nit]` | minor local cleanup or clarity improvement |
| `[question]` | unresolved assumption or design clarification needed |
| `[praise]` | optional positive feedback when it adds signal |

## Default Structure

```markdown
[blocking] `src/file.ts:42` Short title
Why: concrete runtime impact
Evidence: what in the changed code makes this real
Fix: direction, not a giant rewrite
```

## Review Response Shape

1. Findings ordered by severity
2. Open questions or assumptions
3. Brief merge recommendation or summary only if helpful

## Good Finding Traits

- names the affected behavior
- explains impact in production terms
- proves the issue from the changed scope
- suggests the next fix direction

## Avoid

- restating code without impact
- style or preference comments disguised as blockers
- giant speculative lists
- repeating the same root issue across many files
