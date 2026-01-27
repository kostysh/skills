# Implementation Protocol

## Purpose

Execute tasks using the testing strategy defined in the plan while maintaining traceability to requirements. Use TDD only when explicitly requested. This phase produces working, tested code that satisfies the specification.

## Prerequisites

You need:
- **Artifact root**: `docs/sdd/` (create if missing)
- **Approved tasks**: `docs/sdd/{TICKET_ID}/T{N}-tasks.md`
- **Plan reference**: `docs/sdd/{TICKET_ID}/P{N}-plan.md`
- **Specification reference**: `docs/sdd/{TICKET_ID}/S{N}-specification.md`
- **Requirements reference**: `docs/sdd/{TICKET_ID}/R{N}-requirements.md`
- **Constitution**: `docs/sdd/constitution.md`
- **Relevant skills**: As listed in plan prerequisites
- **Available skills**: Review AGENTS.md or the environment skill list

**STOP** if tasks are not approved. Go back to tasks phase.

## Outputs

- Working code changes
- Tests (as defined in the plan)
- Updated task statuses
- Implementation notes
- Handover summary

## Process

### Phase 1: Preparation

1. **Load context**:
   - Read all SDD artifacts (requirements, spec, plan, tasks)
   - Load required skills
   - Understand project constitution
   - Confirm which skills will be used during implementation and note them in the progress log or summary

2. **Verify environment**:
   - Dependencies installed
   - Tests passing before changes
   - Clean working directory

3. **Plan execution order**:
   - Review task dependencies
   - Identify starting tasks (no dependencies)
   - Note parallel opportunities

### Phase 2: Task Execution Loop

For each task, follow the plan's testing strategy. If TDD is requested, use the RED/GREEN/VERIFY cycle:

#### Step 1: RED - Write Failing Test

```markdown
1. Identify acceptance criteria this task addresses
2. Write test(s) that verify the criteria
3. Run test - confirm it FAILS
4. If test passes, either:
   - Feature already exists (verify)
   - Test is wrong (fix test)
```

**Test should fail for the right reason** - missing implementation, not syntax error.

#### Step 2: GREEN - Implement Minimal Code

```markdown
1. Write minimal code to make test pass
2. Run test - confirm it PASSES
3. If test still fails:
   - Debug implementation
   - Do NOT modify test to make it pass
4. Refactor if needed (tests still pass)
```

**Minimal means**: No extra features, no premature optimization, no "while I'm here" changes.

#### Step 3: VERIFY - Confirm Acceptance Criteria

```markdown
1. Run full test suite
2. Manually verify if needed
3. Check against acceptance criteria
4. Update task status to 'completed'
5. Document any issues or deviations
```

If TDD is not requested, use this lighter loop:

```markdown
1. Write or update tests as defined in the plan
2. Implement the change
3. Run relevant tests and verify acceptance criteria
4. Update task status and notes
```

### Phase 3: Progress Tracking

Maintain real-time status:

```markdown
## Implementation Progress

| Task | Status | Notes |
|------|--------|-------|
| T1 | completed | Tests: 3 passing |
| T2 | in_progress | Writing tests... |
| T3 | blocked | Waiting on T1 |
| T4 | pending | - |
```

### Phase 4: Handling Issues

When problems arise:

**Test won't pass**:
1. Verify test is correct against requirements
2. Debug implementation
3. If spec issue → document and discuss with user
4. Do NOT skip or weaken the test

**Unexpected complexity**:
1. Document the issue
2. If minor → proceed and note
3. If major → STOP and return to planning

**Spec drift detected**:
1. Current code differs from spec assumption
2. Document the drift
3. Assess impact on plan
4. Discuss with user if significant

**Blocked task**:
1. Mark task as 'blocked'
2. Document blocking reason
3. Work on parallel tasks if available
4. Escalate if all tasks blocked

### Phase 5: Code Quality

During implementation, ensure:

- [ ] Code follows project conventions (check constitution)
- [ ] No security vulnerabilities introduced
- [ ] Error handling is complete
- [ ] No hardcoded values that should be configurable
- [ ] Comments only where logic isn't self-evident
- [ ] No dead code or commented-out code
- [ ] Imports are organized
- [ ] Types are properly defined (if applicable)

### Phase 6: Handover Summary

After completing all tasks, write implementation summary:

```markdown
# Implementation Summary

**Tasks completed**: T1, T2, T3, T4
**Tasks skipped**: None
**Tasks failed**: None

## Files Modified
- src/services/auth.ts - New authentication service
- src/middleware/validate.ts - Request validation
- tests/auth.test.ts - Unit tests

## Changes Summary
{Brief description of what was implemented}

## Issues Encountered
{Any problems and how they were resolved}

## Notes for Future
{Anything important for maintenance}
```

Write to `docs/sdd/{TICKET_ID}/P{N}-plan.summary.md`

## Validation Checklist

- [ ] All tasks completed or explicitly failed/skipped
- [ ] Tests written and run per plan (if TDD requested, RED/GREEN/VERIFY followed)
- [ ] All tests passing
- [ ] No regressions (existing tests still pass)
- [ ] Code follows constitution guidelines
- [ ] Security considerations addressed
- [ ] Handover summary written
- [ ] Implementation matches specification

## Testing Discipline (TDD optional)

Use the testing strategy defined in the plan and follow `typescript-test-engineer` for organization, runner choice, and mocking guidance.

If TDD is explicitly requested, use RED/GREEN/VERIFY and keep cycles small.

**Never acceptable**:
- Skipping tests for new behavior
- Ignoring the testing strategy in the plan

## Anti-Patterns to Avoid

- **Skipping tests**: No tests for new behavior or missing verification
- **Test-after (when TDD requested)**: Writing tests only after implementation
- **Test-to-pass**: Write test that verifies behavior, not implementation
- **Scope creep**: Only implement what's in the task
- **Silent failures**: Log and handle all errors
- **Copy-paste security**: Review security implications
- **Magic numbers**: Use named constants
- **Monolithic commits**: Commit per task when possible

## Notes

- If implementation reveals spec issues, document and discuss
- Keep commits focused and atomic
- Update task status immediately when completed
- Don't batch status updates at the end
- Take breaks between complex tasks
