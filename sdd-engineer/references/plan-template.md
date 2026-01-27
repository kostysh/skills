# Plan Template

Use this template when creating implementation plans.

---

## Single Plan Template

```markdown
# Implementation Plan: {FEATURE_TITLE}

**Ticket**: {TICKET_ID}
**Author**: {agent/human}
**Date**: {YYYY-MM-DD}
**Status**: Draft | Approved | In Progress | Completed

**Specification Reference**: `docs/sdd/{TICKET_ID}/S{N}-specification.md`
**Allowed Tools**: {tools required by selected skills or None}

## Prerequisites

**Required Skills**: {skill1}, {skill2}
**Allowed Tools**: {tools required by selected skills or None}

**Environment Setup**:
- {Dependency to install}
- {Service to run}

**Pre-conditions**:
- [ ] Tests passing before changes
- [ ] Clean working directory
- [ ] Required access/permissions

## Context

### Current State
{How the relevant code works now}

### Target State
{How it will work after implementation}

### Key Files
| File | Purpose |
|------|---------|
| `src/path/file.ts` | {What this file does} |

## Implementation Steps

### Step 1: {Title - Write Tests for X}

Write tests for {component/feature}. If TDD is requested, write failing tests first.

**Files**:
- `tests/path/file.test.ts`

**Tests to write**:
- Test case 1: {description}
- Test case 2: {description}

**Verification**:
- Tests exist and fail with "not implemented" or similar
- Run: `npm test -- --grep "{pattern}"`

---

### Step 2: {Title - Implement X}

Implement {component/feature} to make tests pass.

**Files**:
- `src/path/file.ts`

**Implementation notes**:
- {Important consideration}
- {Pattern to follow}

**Verification**:
- All new tests pass
- No existing tests broken
- Run: `npm test`

---

### Step 3: {Title - Integration}

Integrate {component} with {other component}.

**Files**:
- `src/path/file.ts`
- `src/other/file.ts`

**Integration points**:
- {Where/how components connect}

**Verification**:
- Integration test passes
- Manual verification of flow

---

### Step N: Write Handover Document

Write a handover document containing:
1. List of all files created/modified
2. Summary of changes made
3. Any issues encountered
4. Notes for future reference

Write to `docs/sdd/{TICKET_ID}/P{N}-plan.summary.md`

---

**Important**: Do not trust this plan blindly. Verify your understanding of the codebase before applying changes.

**External Tools**: Allowed only if required by selected skills or explicitly listed in this plan. Otherwise avoid web search, documentation fetching, and external APIs.
```

---

## Main Plan Template (for multiple plans)

```markdown
# Main Plan: {FEATURE_TITLE}

**Ticket**: {TICKET_ID}
**Author**: {agent/human}
**Date**: {YYYY-MM-DD}
**Status**: Draft | Approved | In Progress | Completed

**Specification Reference**: `docs/sdd/{TICKET_ID}/S{N}-specification.md`

## Overview

This main plan coordinates the implementation of {feature} as specified in the referenced specification.

## Execution Strategy

**Execution Mode**: Parallel | Sequential | Mixed

**Dependency Graph**:
```mermaid
flowchart LR
  P2[P{N+1}-plan-api.md] --> P4[P{N+3}-plan-integration.md]
  P3[P{N+2}-plan-ui.md] --> P4
```

**Execution Order**:
1. P{N+1} and P{N+2} can run in parallel
2. P{N+3} must wait for P{N+1} and P{N+2}

## Plan Assignments

### Plan 1: API Implementation
**File**: `P{N+1}-plan-api.md`
**Skills**: {api-related-skills}
**Assigned to**: {agent-name} (if applicable)
**Description**: Implements backend API endpoints for {feature}

### Plan 2: UI Implementation
**File**: `P{N+2}-plan-ui.md`
**Skills**: {ui-related-skills}
**Assigned to**: {agent-name} (if applicable)
**Description**: Implements frontend components for {feature}

### Plan 3: Integration
**File**: `P{N+3}-plan-integration.md`
**Skills**: {integration-skills}
**Dependencies**: P{N+1}, P{N+2}
**Description**: Integrates API and UI, adds E2E tests

## Coordination Notes

- {Note about shared resources}
- {Note about communication between plans}
- {Note about conflict resolution}

## Main Handover Document

After all specialized plans complete, write a main handover document:

1. Reference each specialized plan's handover file
2. For each referenced handover:
   - State "Completed" if the plan was executed successfully
   - Detail any issues encountered
3. Overall status summary

Write to `docs/sdd/{TICKET_ID}/P{N}-main-plan.summary.md`

---

**Important**: Do not trust this plan blindly. Verify your understanding of the codebase and all specialized plans before coordinating their execution.

**External Tools**: Allowed only if required by selected skills or explicitly listed in these plans. Otherwise avoid web search, documentation fetching, and external APIs.
```

---

## Template Usage Notes

1. **Test steps precede implementation steps only when TDD is requested** - Otherwise follow the defined test strategy
2. **Each step has verification** - How do you know it's done?
3. **Reference functions, not lines** - Line numbers change
4. **Handover step is mandatory** - Always ends with summary
5. **Footer is mandatory** - Reminds agent to verify and not use external tools
6. **Split if >10 steps** - Use main plan + specialized plans
7. **Use emojis for status/highlights** - e.g., ✅ Approved, ⚠️ Risk
