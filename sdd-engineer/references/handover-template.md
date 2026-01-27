# Handover Template

Use this template for handover and summary documents.

---

## Plan Summary Template (P{N}-plan.summary.md)

```markdown
# Plan Summary: {FEATURE_TITLE}

**Ticket**: {TICKET_ID}
**Plan**: `P{N}-plan.md`
**Completed**: {YYYY-MM-DD}

## Summary

{One paragraph describing what was implemented}

## Files Changed

### Created
- `src/path/newfile.ts` - {Purpose}

### Modified
- `src/path/existing.ts` - {What changed}

### Deleted
- `src/path/oldfile.ts` - {Why removed}

## Changes by Category

### Features
- {Feature 1 implemented}
- {Feature 2 implemented}

### Tests
- Added {N} unit tests in `tests/path/`
- Added {N} integration tests

### Configuration
- Added `NEW_ENV_VAR` environment variable

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| {Problem} | {How it was fixed} |

## Deviations from Plan

| Planned | Actual | Reason |
|---------|--------|--------|
| {Original plan item} | {What was done instead} | {Why} |

## Notes for Future

- {Important consideration for maintenance}
- {Known limitation}
- {Suggested improvement}
```

---

## Validation Report Template (V{N}-validation.md)

```markdown
# Validation Report: {FEATURE_TITLE}

**Ticket**: {TICKET_ID}
**Validated**: {YYYY-MM-DD}
**Validator**: {agent/human}
**Relevant Skills**: {skill names or None}

## Artifacts Validated

- Requirements: `R{N}-requirements.md`
- Specification: `S{N}-specification.md`
- Plan: `P{N}-plan.md`
- Tasks: `T{N}-tasks.md`

## Requirements Coverage

| Requirement | Implementation | Test | Status |
|-------------|----------------|------|--------|
| US-1 | {file:function} | {test file} | PASS |
| AC-1.1 | {file:function} | {test file} | PASS |

## Test Results

**Run Date**: {YYYY-MM-DD HH:MM}
**Total**: {N} | **Passed**: {N} | **Failed**: {N} | **Skipped**: {N}
**Coverage**: {N}%

### New Tests
- {test file}: {N} tests

## Security Checklist

- [x] Input validation complete
- [x] No hardcoded secrets
- [x] Authentication required where needed
- [x] Authorization checks in place
- [x] Error messages don't leak info

## Performance Verification

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Response time | < 200ms | {N}ms | PASS |

## Drift Analysis

| Spec Item | Implementation | Drift | Approved |
|-----------|----------------|-------|----------|
| {item} | {actual} | Yes/No | Yes/No |

## Overall Status

**PASS** / **FAIL**

## Issues Found

{None / List of issues}

## Recommendations

- {Suggestion for future work}
```

---

## Final Handover Template (H{N}-handover.md)

```markdown
# Handover: {FEATURE_TITLE}

**Ticket**: {TICKET_ID}
**Completed**: {YYYY-MM-DD}
**Author**: {agent/human}

## Executive Summary

{2-3 sentences describing what was built and why it matters}

## What Was Built

{Paragraph describing the feature/change from user perspective}

## Technical Changes

### Architecture
{High-level description of technical approach}

### Components
| Component | Change | Files |
|-----------|--------|-------|
| {name} | {created/modified} | {paths} |

## How to Use

### For Users
{How end users interact with the feature}

### For Developers
{How to extend or modify this feature}

## Configuration

| Variable | Purpose | Default |
|----------|---------|---------|
| `ENV_VAR` | {purpose} | {value} |

## Testing

### How to Run Tests
```bash
{command to run tests}
```

### Manual Testing Steps
1. {Step 1}
2. {Step 2}
3. {Expected result}

## Known Limitations

- {Limitation 1}
- {Limitation 2}

## Future Improvements

- {Improvement 1}
- {Improvement 2}

## Related Documentation

- Requirements: `docs/sdd/{TICKET_ID}/R{N}-requirements.md`
- Specification: `docs/sdd/{TICKET_ID}/S{N}-specification.md`
- Validation: `docs/sdd/{TICKET_ID}/V{N}-validation.md`

## Acknowledgments

- {Person/team who helped}

---

**Sign-off**:
- [ ] Code Review: {name}
- [ ] QA: {name}
- [ ] Product: {name}
```

---

## Template Usage Notes

1. **Plan summaries are technical** - Focus on what was done
2. **Validation reports are evidence** - Prove requirements are met
3. **Final handover is comprehensive** - Everything needed to understand the feature
4. **Keep it concise** - Details are in the code
5. **Link to artifacts** - Don't duplicate, reference
6. **Honest about limitations** - Future you will thank you
7. **Use emojis for status/highlights** - e.g., ✅ Pass, ⚠️ Risk
