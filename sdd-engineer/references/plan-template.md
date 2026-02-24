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

**Owner Input Required** (if any step depends on owner-only data/decisions):
- Missing input: {explicit field/value list}
- Why not derivable: {reason}
- Source candidates: {files/links/systems/owners}
- Question to owner: {single concrete ask}
- Decision options (critical): `A` {tradeoffs} / `B` {tradeoffs}
- Blocking steps/tasks: {Step/T* ids}

## Decision Logging

- **ADR Trigger Conditions**: {what architecture-level decision types require ADR}
- **ADR Non-Trigger Examples**: {routine local changes that must not create ADR}
- **ADR ID Rule**: Use `A{N}` from filename prefix; do not create separate `ADR-001` numbering
- **ADR Path Convention**: `docs/sdd/{TICKET_ID}/A{N}-adr-{slug}.md`
- **Task Log Contract**: If ADR is created/updated, record `A{N}` in `T*` Progress Log `Decision/Result`

## Definition of Done

- Implementation tasks are complete only when all quality gates pass.
- Mandatory gates for each touched package:
  - `type-check`
  - `test:*` (unit/integration/e2e as applicable)
- Coverage checkpoint command (`test:coverage` or equivalent) when package supports it:
  - at least once before final stage closure,
  - plus intermediate checkpoints for long/multi-wave stages.
- If split test kinds exist, list all: `test:unit`, `test:integration`, `test:e2e`.
- Include formatting/lint gates explicitly:
  - server-style packages: `lint:fix`
  - server test changes: `lint:test:fix`
  - client-style packages: `format`
- Tests must be honest and effective (behavior/contract validation, no artificial pass conditions).

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

**Gate Validation**:
- [ ] `{package_cmd} type-check`
- [ ] `{package_cmd} test:*`
- [ ] `{package_cmd} lint:fix` or `{package_cmd} format` (as applicable)
- [ ] `{package_cmd} test:coverage` (coverage checkpoint tasks and final-stage closure when available)

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

**Gate Validation**:
- [ ] `{package_cmd} type-check`
- [ ] `{package_cmd} test:*`
- [ ] `{package_cmd} lint:fix` or `{package_cmd} format` (as applicable)
- [ ] `{package_cmd} test:coverage` (coverage checkpoint tasks and final-stage closure when available)

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

**Gate Validation**:
- [ ] `{package_cmd} type-check`
- [ ] `{package_cmd} test:*`
- [ ] `{package_cmd} lint:fix` or `{package_cmd} format` (as applicable)
- [ ] `{package_cmd} test:coverage` (coverage checkpoint tasks and final-stage closure when available)

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
3. **Each code step has Gate Validation commands** - Include `type-check`, `test:*`, lint/format, and coverage checkpoints when available
4. **Reference functions, not lines** - Line numbers change
5. **Handover step is mandatory** - Always ends with summary
6. **Footer is mandatory** - Reminds agent to verify and not use external tools
7. **Split if >10 steps** - Use main plan + specialized plans
8. **Do not mark tests as optional** - No wording like "if test runner exists"
9. **Owner requests must be concrete** - No wildcard asks; include source candidates and explicit A/B tradeoffs for critical decisions
