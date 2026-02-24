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

## Owner Input Required (if applicable)
- Missing input: {explicit list, no wildcards}
- Why not derivable: {reason}
- Source candidates: {files/links/systems/owners}
- Question to owner: {single concrete ask}
- Decision options (critical): `A` {tradeoffs} / `B` {tradeoffs}
- Blocking task/step: {id}

## Tasks (Optional)
| ID | Task | Status | Verification |
|----|------|--------|--------------|
| T1 | {task} | ⏳ pending | {check} |

Status legend: `⏳ pending` | `🔄 in_progress` | `⛔ blocked` | `✅ completed` | `❌ failed`

## Progress Log (Optional but recommended when tasks are used)
| Timestamp | Task | Action | Decision/Result | Evidence |
|-----------|------|--------|-----------------|----------|
| {time} | T1 | 🔄 in_progress | Started implementation | `{command}` |
| {time} | T1 | ✅ completed | AC-1 satisfied | `{test result}` |

## ADR References (Optional)
- A1: `docs/sdd/{TICKET_ID}/A1-adr-{slug}.md`

## Validation
- [ ] Tests written per plan (if TDD requested, before implementation)
- [ ] All acceptance criteria verified
- [ ] Test suite passes
- [ ] Coverage checkpoint recorded (if package supports coverage command)
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
2. **Use canonical task emojis** - `⏳`/`🔄`/`⛔`/`✅`/`❌` for status
3. **If you add task status tracking, use canonical schema from `SKILL.md` Implementation Logging Model**
