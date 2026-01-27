# Requirements Template

Use this template when creating requirements documents.

---

```markdown
# Requirements: {FEATURE_TITLE}

**Ticket**: {TICKET_ID}
**Author**: {agent/human}
**Date**: {YYYY-MM-DD}
**Status**: Draft | In Review | Approved
**Relevant Skills**: {skill names or None}

## Overview

{Brief description of what this feature/change is about - 2-3 sentences}

## User Stories

### US-1: {Story Title}

**As a** {user type/role}
**I want** {capability/feature}
**So that** {benefit/value}

#### Acceptance Criteria

**AC-1.1**: {Criterion title}
- **Given** {precondition/context}
- **When** {action/trigger}
- **Then** {expected outcome}

**AC-1.2**: {Criterion title}
- **Given** {precondition/context}
- **When** {action/trigger}
- **Then** {expected outcome}
- **And** {additional outcome}

### US-2: {Story Title}

**As a** {user type/role}
**I want** {capability/feature}
**So that** {benefit/value}

#### Acceptance Criteria

**AC-2.1**: {Criterion title}
- **Given** {precondition/context}
- **When** {action/trigger}
- **Then** {expected outcome}

## Edge Cases

| ID | Scenario | Expected Behavior |
|----|----------|-------------------|
| EC-1 | {Edge case description} | {How system should behave} |
| EC-2 | {Edge case description} | {How system should behave} |

## Error Scenarios

| ID | Error Condition | Expected Behavior |
|----|-----------------|-------------------|
| ERR-1 | {What goes wrong} | {Error message/handling} |
| ERR-2 | {What goes wrong} | {Error message/handling} |

## Non-Functional Requirements

### Performance
- NFR-P1: {Performance requirement with measurable criteria}

### Security
- NFR-S1: {Security requirement}

### Accessibility
- NFR-A1: {Accessibility requirement}

### Scalability
- NFR-SC1: {Scalability requirement}

## Constraints

- {Technical constraint}
- {Business constraint}
- {Regulatory constraint}

## Dependencies

- {External system/service dependency}
- {Other feature dependency}

## Out of Scope

The following are explicitly NOT part of this requirement:
- {Feature/capability not included}
- {Edge case not handled}

## Assumptions

- {Assumption about user behavior}
- {Assumption about system state}
- {Assumption about data}

## Open Questions

- [ ] {Question requiring clarification}
- [ ] {Decision to be made}

## Glossary

| Term | Definition |
|------|------------|
| {Domain term} | {Definition} |

---

**Approval**:
- [ ] Product Owner: {name} - {date}
- [ ] Tech Lead: {name} - {date}
```

---

## Template Usage Notes

1. **Delete unused sections** - Not every requirement needs all sections
2. **Be specific in acceptance criteria** - "Fast" is not a criterion, "< 200ms" is
3. **One story = one capability** - Split complex stories
4. **Edge cases matter** - They're where bugs hide
5. **Out of scope is crucial** - Prevents scope creep
6. **Questions are OK** - Better to ask than assume
7. **Use emojis for status/highlights** - e.g., ✅ Approved, ⚠️ Risk
