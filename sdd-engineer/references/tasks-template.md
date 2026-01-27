# Tasks Template

Use this template when creating task breakdowns.

---

```markdown
# Tasks: {FEATURE_TITLE}

**Ticket**: {TICKET_ID}
**Author**: {agent/human}
**Date**: {YYYY-MM-DD}
**Status**: Draft | Approved | In Progress | Completed

**Plan Reference**: `docs/sdd/{TICKET_ID}/P{N}-plan.md`
**Relevant Skills**: {skill names or None}

## Task Overview

| ID | Task | Status | Dependencies | Parallel | Effort |
|----|------|--------|--------------|----------|--------|
| T1 | {Short description} | pending | - | yes | small |
| T2 | {Short description} | pending | - | yes | medium |
| T3 | {Short description} | pending | T1 | no | medium |
| T4 | {Short description} | pending | T2, T3 | no | small |
| T5 | {Short description} | pending | T4 | yes | small |

**Legend**:
- **Status**: pending | in_progress | blocked | completed | failed
- **Effort**: small (< 15min) | medium (15-30min) | large (30-60min)

## Dependency Graph

```mermaid
flowchart LR
  T1 --> T3 --> T4 --> T5
  T2 --> T3
```

## Parallel Execution Groups

**Group 1** (can start immediately):
- T1, T2

**Group 2** (after Group 1):
- T3 (needs T1)

**Group 3** (after Group 2):
- T4 (needs T2, T3)

**Group 4** (after Group 3):
- T5 (needs T4)

## Task Details

---

### T1: {Task Title}

**Status**: pending
**Dependencies**: none
**Parallel**: yes
**Effort**: small

**Description**:
{Detailed description of what needs to be done}

**Files**:
- `src/path/file.ts` - {what to do}

**Verification**:
- [ ] {Specific check 1}
- [ ] {Specific check 2}

**Notes**:
- {Implementation hint}
- {Gotcha to watch for}

---

### T2: {Task Title}

**Status**: pending
**Dependencies**: none
**Parallel**: yes
**Effort**: medium

**Description**:
{Detailed description of what needs to be done}

**Files**:
- `tests/path/file.test.ts` - {what to do}

**Verification**:
- [ ] {Specific check}

**Notes**:
- {Implementation hint}

---

### T3: {Task Title}

**Status**: pending
**Dependencies**: T1
**Parallel**: no
**Effort**: medium

**Description**:
{Detailed description}

**Files**:
- `src/path/file.ts`

**Verification**:
- [ ] {Specific check}

**Blocked By**: T1 must complete first because {reason}

---

### T4: {Task Title}

**Status**: pending
**Dependencies**: T2, T3
**Parallel**: no
**Effort**: small

**Description**:
{Detailed description}

**Files**:
- `src/path/file.ts`
- `tests/path/file.test.ts`

**Verification**:
- [ ] All tests pass
- [ ] {Additional check}

---

### T5: {Task Title}

**Status**: pending
**Dependencies**: T4
**Parallel**: yes (with other independent work)
**Effort**: small

**Description**:
{Detailed description}

**Files**:
- `docs/path/file.md`

**Verification**:
- [ ] Documentation updated
- [ ] Links valid

---

## Progress Log

| Timestamp | Task | Action | Notes |
|-----------|------|--------|-------|
| {time} | T1 | started | - |
| {time} | T1 | completed | All checks pass |
| {time} | T2 | started | - |
| {time} | T3 | blocked | Waiting on T1 |

## Issues Encountered

| Task | Issue | Resolution |
|------|-------|------------|
| T2 | {Problem} | {How it was resolved} |
```

---

## Template Usage Notes

1. **Every task has verification** - Checkboxes for completion criteria
2. **Dependencies explicit** - List what must complete first
3. **Parallel = no file overlap** - Tasks can't both modify same file
4. **Effort estimates help planning** - But don't treat as commitments
5. **Progress log is optional** - Use for complex/long-running work
6. **Issues section captures learnings** - Helps future work
7. **Use emojis for status/highlights** - e.g., ✅ Done, ⚠️ Blocked
