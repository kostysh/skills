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

When the project uses closure types (a)–(d), label each finding with one type.
Use **(d)** for an outside-task finding and name its owner. For in-scope
findings, use **(c)** for a non-blocking finding, **(a)** for a blocker whose
correction the same test can prove by failing before the fix and passing after
it through the required operation and transport, or **(b)** for a blocker whose
correction requires judgment in a delta review. For (a), retain domain review
of fixes involving security, money, permissions, or migrations.

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
Review basis: <target and base>; snapshot <ID from named source or identity established by your check>
Scope: <changed-file accounting and explicit exclusions>
Evidence: <what you observed in the changed hunk or scoped content, where you read it, and any further checks and results>
Limits: <untested or unassessed user/API/data/domain paths, or "none identified">
Recommendation: approve | request changes | limited | blocked
```

If the request or file metadata is your only basis for a content claim, open the available patch or compare the versions before reporting it. A checksum identifies bytes. Attribute supplied IDs to their source. Claim a verified match only when the ID calculated from those bytes matches the stated ID.

- `approve` requires accounted scope and evidence sufficient for the stated merge boundary.
- `request changes` requires at least one confirmed blocking finding.
- `limited` means useful review was possible but scope, evidence, or specialized authority is incomplete.
- `blocked` means a reproducible review basis or indispensable authority could not be established.
- Use exactly one recommendation status. Do not use `comment only` as an ambiguous substitute; represent non-blocking observations with `approve` plus findings or limits.

For a stable partial scope, use `limited`, retain confirmed findings, and state which already block merge. In `Limits`, name the changed item you could not inspect. If the task is to review its contents, its `Next` is to obtain that revision in a form the reviewer can inspect. Stop that item's handoff there. Keep a defect and its regression checks with the item they concern.

The intended use of an artifact does not by itself require qualifying it in operation before merge. Require a particular method or downstream test only when the item's own acceptance rule prescribes it or a property under review can only be verified that way. Cite the rule or explain the technical dependency. Other suitable methods remain options.

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
