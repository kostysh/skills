# ADR Template

Use this template for short architecture decisions: `A{N}-adr-{slug}.md`.

---

```markdown
# A{N}: {Decision Title}

**Ticket**: {TICKET_ID}
**Date**: {YYYY-MM-DD}
**Status**: proposed | accepted | superseded
**Related Tasks**: T1, T2
**Related Artifacts**: S1-specification.md, P1-plan.md, T1-tasks.md

## Context
{What constraint/problem forced a decision}

## Decision
{Chosen option in 2-6 lines}

## Consequences
- Positive: {benefit}
- Negative: {cost/tradeoff}
- Follow-up: {what must be done next}

## Evidence
- {command output summary}
- {benchmark/test result}
- {reference to affected files}

## Alternatives Considered
- Option A: {summary + why rejected}
- Option B: {summary + why rejected}

## Links
- {PR/commit/issue link or local artifact path}
```

---

## Usage Notes

1. Keep ADRs short. If it exceeds one screen, move details to spec and link from ADR.
2. Create ADR only for architecture-level choices, not routine coding decisions.
3. ADR id is `A{N}` from filename prefix; do not introduce separate `ADR-001` numbering.
4. Reference `A{N}` from `T*` Progress Log `Decision/Result` field.
5. Create ADR for changes that affect contracts/architecture (data model strategy, API/integration contract, auth/security model, cross-cutting reliability/performance).
6. Do not create ADR for local refactors, formatting/naming edits, test-only maintenance, or trivial bug fixes without contract impact.
7. If an ADR changes assumptions, update `S*`/`P*`/`T*` in the same change.
