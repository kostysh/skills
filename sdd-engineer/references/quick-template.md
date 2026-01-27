# Quick Template

Use this template for `Q{N}-quick.md`.

---

```markdown
# Quick SDD: {FEATURE_TITLE}

**Ticket**: {TICKET_ID}
**Author**: {agent/human}
**Date**: {YYYY-MM-DD}
**Status**: Draft | Approved | In Progress | Completed
**Relevant Skills**: {skill names or None}

## Requirements

### User Story
**As a** {user}
**I want** {capability}
**So that** {benefit}

### Acceptance Criteria
**AC-1**: {criterion}
- **Given** {precondition}
- **When** {action}
- **Then** {expected outcome}

## Scope
- **In scope**: {what is included}
- **Out of scope**: {what is excluded}

## Specification (Brief)
- **Approach**: {short technical approach}
- **Affected files**: {paths}
- **Risks/Alternatives**: {if any}

## Plan (2-6 steps)
1. {Write tests for ... (fail first if TDD requested)}
2. {Implement ...}
3. {Verify ...}

## Tasks (Optional)
| ID | Task | Status | Verification |
|----|------|--------|--------------|
| T1 | {task} | pending | {check} |

## Validation
- [ ] Tests written per plan (if TDD requested, before implementation)
- [ ] All acceptance criteria verified
- [ ] Test suite passes
- [ ] No spec drift (or approved drift noted)

## Results
- **Tests run**: {commands}
- **Outcome**: PASS / FAIL
- **Notes**: {issues, limitations, follow-ups}

## Approval
- [ ] User approved before implementation
- [ ] User accepted validation results
```

---

## Template Usage Notes

1. **Keep it short** - Quick artifacts should be minimal
2. **Use emojis for status/highlights** - e.g., ✅ Done, ⚠️ Risk
