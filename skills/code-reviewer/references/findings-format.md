# Findings Format

Start with one plain-language outcome sentence that says what changed, what remains, and whether the reviewed boundary can proceed. Then use concise, behavior-based findings and formal recommendation terminology.

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
Next: bounded correction or investigation direction
```

## Review Response Shape

1. Plain-language outcome sentence
2. Findings ordered by severity
3. Open questions or assumptions
4. Mandatory compact evidence footer

If no finding is confirmed, write `No findings.`; never use an empty findings section as evidence of clearance.

## Mandatory Evidence Footer

Use this footer for every review, including terse and clean reviews:

```markdown
Review basis: <target and base>; snapshot <immutable ids or working-tree hash>
Scope: <changed-file accounting and explicit exclusions>
Evidence: <checks and behavioral paths actually assessed>
Limits: <untested or unassessed user/API/data/domain paths, or "none identified">
Recommendation: approve | request changes | limited | blocked
```

- `approve` requires accounted scope and evidence sufficient for the stated merge boundary.
- `request changes` requires at least one confirmed blocking finding.
- `limited` means useful review was possible but scope, evidence, or specialized authority is incomplete.
- `blocked` means a reproducible review basis or indispensable authority could not be established.
- Use exactly one recommendation status. Do not use `comment only` as an ambiguous substitute; represent non-blocking observations with `approve` plus findings or limits.

If a follow-up review repeats the same or a materially related blocker after remediation, set `Next` to root-cause investigation of assumptions, the full failure path, adjacent surfaces, and remediation scope before more fixes.

## Good Finding Traits

- names the affected behavior
- explains impact in production terms
- proves the issue from the changed scope
- gives the next correction or investigation direction

## Avoid

- restating code without impact
- style or preference comments disguised as blockers
- giant speculative lists
- repeating the same root issue across many files
