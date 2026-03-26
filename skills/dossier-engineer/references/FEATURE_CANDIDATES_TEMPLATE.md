# Feature candidates backlog (`docs/backlog/feature-candidates.md`)

> Purpose: a simple candidate backlog derived from architecture.  
> Status: **non-SSoT** planning artifact.  
> Rule: do **not** put acceptance criteria text here.  
> Rule: `docs/ssot/index.md` lists only real dossiers, not `CF-*` candidates.

## Candidates

| CF ID | Title | Area | Status | Depends on | Why this is a feature | Dossier |
|---|---|---|---|---|---|---|
| CF-001 | Password reset | auth | intaken | — | User-facing account recovery workflow spanning API, email, and persistence | `../features/F-0001-password-reset.md` |

Status values:
- `candidate` — discovered from architecture, not yet selected
- `confirmed` — approved to be turned into a dossier
- `intaken` — dossier created
- `discarded` — intentionally not pursued

Rule:
- Keep statuses current: `candidate -> confirmed -> intaken`, or `discarded` if not pursued.

## Open questions

- None yet.
