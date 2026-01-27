# Tasks Protocol

## Purpose

Decompose the implementation plan into atomic, executable tasks. Tasks are the smallest units of work that can be independently executed and verified.

## Prerequisites

You need:
- **Artifact root**: `docs/sdd/` (create if missing)
- **Approved plan**: `docs/sdd/{TICKET_ID}/P{N}-plan.md` or `P{N}-main-plan.md`
- **Specification reference**: `docs/sdd/{TICKET_ID}/S{N}-specification.md`
- **TASK_DIR**: `docs/sdd/{TICKET_ID}/`
- **Next file number**: Check existing T* files
- **Available skills**: Review AGENTS.md or the environment skill list

**STOP** if plan is not approved. Go back to planning phase.

## Outputs

A tasks document (`T{N}-tasks.md`) containing:
- Task overview table
- Detailed task descriptions
- Dependency graph
- Parallelization markers
- Verification criteria per task

## Process

### Phase 1: Plan Analysis

1. **Read plan thoroughly**: Understand all steps and their order
2. **Identify atomic units**: What's the smallest verifiable work unit?
3. **Map dependencies**: Which tasks depend on others?
4. **Find parallelization opportunities**: Which tasks can run simultaneously?
5. **Select skills**:
   - Start from the plan's **Required Skills**
   - Add any additional skills needed for task execution
   - Record the decision in the tasks artifact under **Relevant Skills**

### Phase 2: Task Extraction

For each plan step, create one or more tasks:

```markdown
### T{ID}: {Task Title}

**Status**: pending
**Dependencies**: T{X}, T{Y} (or "none")
**Parallel**: yes/no
**Files**: {specific file paths}
**Estimated effort**: small/medium/large

**Description**:
{What exactly needs to be done}

**Verification**:
{How to confirm task is complete}

**Notes**:
{Implementation hints, gotchas, references}
```

### Phase 3: Task Granularity

Tasks should be:

| Characteristic | Good | Bad |
|---------------|------|-----|
| Scope | Single responsibility | Multiple unrelated changes |
| Duration | 5-30 minutes | Hours or days |
| Verifiability | Clear pass/fail | "Looks good" |
| Independence | Minimal dependencies | Tightly coupled |

**Splitting Rules**:
- If a task touches multiple files for different reasons → split
- If a task has multiple verification criteria → split
- If a task could be done by different people → split

**Combining Rules**:
- If two tasks always happen together → combine
- If splitting creates artificial dependency → combine

### Phase 4: Dependency Mapping

Create explicit dependency graph:

```markdown
## Dependency Graph

T1 (Create interface) ─┬─► T3 (Implement service)
                       │
T2 (Write tests)      ─┴─► T4 (Integration tests)

T5 (Update docs) ◄─────── T3, T4
```

Mark each task:
- **No dependencies**: Can start immediately
- **Blocked by**: List blocking tasks
- **Blocks**: List tasks this blocks

### Phase 5: Parallelization Analysis

Identify tasks that can run simultaneously:

```markdown
## Parallel Execution Groups

**Group 1** (can run in parallel):
- T1: Create user interface
- T2: Create API endpoint
- T3: Write unit tests

**Group 2** (after Group 1):
- T4: Integration testing
- T5: Documentation update
```

Rules for parallelization:
- No shared file modifications
- No dependency relationship
- Independent verification

### Phase 6: Task Table Creation

Create overview table:

```markdown
## Task Overview

| ID | Task | Status | Deps | Parallel | Effort |
|----|------|--------|------|----------|--------|
| T1 | Create interface | pending | - | yes | small |
| T2 | Write unit tests | pending | - | yes | medium |
| T3 | Implement service | pending | T1 | no | medium |
| T4 | Integration tests | pending | T2,T3 | no | small |
| T5 | Update docs | pending | T3 | yes | small |
```

### Phase 7: Verification Criteria

Each task needs clear verification:

**Good verification**:
- "All unit tests pass (`npm test`)"
- "API returns 200 for valid request"
- "TypeScript compiles without errors"
- "Acceptance criteria AC-1.1 is satisfied"

**Bad verification**:
- "Code looks good"
- "Feature works"
- "No errors"

### Phase 8: Review and Approval

Present tasks to user:
1. Walk through task breakdown
2. Explain parallelization strategy
3. Verify nothing is missing
4. **Get explicit approval**

### Phase 9: Write Artifact

Write tasks to `docs/sdd/{TICKET_ID}/T{N}-tasks.md`

Use the [Tasks Template](tasks-template.md).

## Validation Checklist

- [ ] Every plan step has corresponding task(s)
- [ ] Tasks are atomic (single responsibility)
- [ ] Dependencies are explicitly marked
- [ ] Parallel tasks don't conflict
- [ ] Each task has clear verification criteria
- [ ] Task effort estimates are reasonable
- [ ] No circular dependencies exist
- [ ] Test tasks precede implementation tasks (only if TDD is requested)
- [ ] User has approved the task breakdown

## Task States

| State | Meaning |
|-------|---------|
| pending | Not started |
| in_progress | Currently being executed |
| blocked | Waiting on dependency |
| completed | Done and verified |
| failed | Attempted but unsuccessful |

## Anti-Patterns to Avoid

- **Giant tasks**: "Build the feature" → Break down further
- **Micro tasks**: "Add semicolon" → Combine with related work
- **Hidden dependencies**: If T3 needs T2's output, mark it
- **False parallelism**: Don't mark parallel if files overlap
- **Missing tests**: Every code task needs corresponding test task
- **Unclear verification**: "Test manually" → Specific test commands

## Notes

- Tasks may be reordered during execution if dependencies allow
- Mark tasks blocked immediately when dependencies aren't met
- Update task status in real-time during implementation
- If task scope changes significantly, return to planning
