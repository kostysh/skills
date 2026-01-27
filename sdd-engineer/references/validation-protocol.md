# Validation Protocol

## Purpose

Verify that the implementation satisfies all requirements. This phase ensures nothing was missed, no drift occurred, and the work is ready for delivery.

## Prerequisites

You need:
- **Artifact root**: `docs/sdd/` (create if missing)
- **Completed implementation**: All tasks marked complete
- **Requirements**: `docs/sdd/{TICKET_ID}/R{N}-requirements.md`
- **Specification**: `docs/sdd/{TICKET_ID}/S{N}-specification.md`
- **Plan summary**: `docs/sdd/{TICKET_ID}/P{N}-plan.summary.md`
- **Tasks**: `docs/sdd/{TICKET_ID}/T{N}-tasks.md`
- **Available skills**: Review AGENTS.md or the environment skill list

**STOP** if implementation is not complete. Return to implementation phase.

## Outputs

- Validation report (`V{N}-validation.md`)
- Final handover document (`H{N}-handover.md`)
- Updated task/plan statuses if issues found

## Process

### Phase 1: Requirements Traceability

Create a requirements coverage matrix:

```markdown
## Requirements Coverage

| Requirement | Implementation | Test | Status |
|-------------|---------------|------|--------|
| US-1 | AuthService.login() | auth.test.ts:15 | PASS |
| AC-1.1 | validateCredentials() | auth.test.ts:23 | PASS |
| AC-1.2 | error handling | auth.test.ts:45 | PASS |
| NFR-1 | response < 200ms | perf.test.ts:10 | PASS |
```

For each requirement:
1. Identify implementing code
2. Identify verifying test(s)
3. Confirm test passes
4. Mark status
5. Confirm which skills are relevant for validation (testing, security, performance) and record them in the validation report

### Phase 2: Acceptance Criteria Verification

For each acceptance criterion, verify Given/When/Then:

```markdown
### AC-1.1: User can log in with valid credentials

**Given** a registered user with valid credentials
- Verified: Test creates user in setup ✓

**When** they submit the login form
- Verified: Test calls AuthService.login() ✓

**Then** they are redirected to the dashboard
- Verified: Test asserts redirect response ✓

**Status**: PASS
```

### Phase 3: Test Suite Analysis

Run and analyze test results:

```markdown
## Test Results

**Total tests**: 47
**Passed**: 47
**Failed**: 0
**Skipped**: 0
**Coverage**: 87%

### New tests added
- auth.test.ts: 12 tests
- validation.test.ts: 5 tests

### Modified tests
- user.test.ts: Updated fixtures
```

Verify:
- [ ] All new code has tests
- [ ] No tests were deleted without reason
- [ ] Coverage meets project standards
- [ ] No flaky tests introduced

### Phase 4: Specification Drift Detection

Compare implementation against specification:

```markdown
## Drift Analysis

| Spec Item | Implementation | Drift? | Notes |
|-----------|---------------|--------|-------|
| Use JWT tokens | JWT implemented | No | - |
| 15min expiry | 30min expiry | YES | User requested change |
| SHA256 hashing | bcrypt | YES | Better security |
```

For each drift:
1. Document the deviation
2. Explain why it occurred
3. Assess if it's acceptable
4. Get user approval if significant

### Phase 5: Security Review

Verify security considerations from specification:

```markdown
## Security Checklist

- [ ] Input validation on all user inputs
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Secrets not hardcoded
- [ ] Sensitive data not logged
- [ ] Authentication/authorization correct
- [ ] Error messages don't leak info
```

### Phase 6: Performance Verification

If NFRs specified performance requirements:

```markdown
## Performance Results

| Metric | Requirement | Actual | Status |
|--------|-------------|--------|--------|
| Response time | < 200ms | 45ms | PASS |
| Memory usage | < 512MB | 128MB | PASS |
| Concurrent users | 100 | 150 tested | PASS |
```

### Phase 7: Edge Case Verification

Verify edge cases from requirements:

```markdown
## Edge Cases

| Edge Case | Test | Status |
|-----------|------|--------|
| Empty input | validation.test.ts:30 | PASS |
| Max length | validation.test.ts:35 | PASS |
| Special chars | validation.test.ts:40 | PASS |
| Concurrent access | concurrency.test.ts:10 | PASS |
```

### Phase 8: Write Validation Report

Create `docs/sdd/{TICKET_ID}/V{N}-validation.md`:

```markdown
# Validation Report

**Date**: {date}
**Validator**: {agent/human}
**Artifacts validated**:
- Requirements: R1-requirements.md
- Specification: S1-specification.md
- Plan: P1-plan.md
- Tasks: T1-tasks.md

## Summary

| Category | Pass | Fail | Notes |
|----------|------|------|-------|
| Requirements | 8 | 0 | All covered |
| Acceptance criteria | 12 | 0 | All verified |
| Tests | 47 | 0 | 87% coverage |
| Security | 8 | 0 | All checked |
| Performance | 3 | 0 | Within limits |

## Overall Status: PASS

## Issues Found
{None / List of issues}

## Recommendations
{Any suggestions for future work}
```

### Phase 9: Write Final Handover

Create `docs/sdd/{TICKET_ID}/H{N}-handover.md`:

```markdown
# Handover Document

**Feature**: {Feature name}
**Ticket**: {TICKET_ID}
**Date**: {date}

## Summary
{One paragraph describing what was built}

## Files Changed
{List all modified/created files}

## How to Test
{Steps to manually verify the feature}

## Configuration
{Any new config options or environment variables}

## Known Limitations
{Any known issues or limitations}

## Future Considerations
{Suggestions for future improvements}
```

## Validation Checklist

- [ ] All requirements have traceability to code and tests
- [ ] All acceptance criteria verified
- [ ] Test suite passes completely
- [ ] No unintended specification drift
- [ ] Security checklist complete
- [ ] Performance requirements met
- [ ] Edge cases covered
- [ ] Validation report written
- [ ] Handover document written
- [ ] User has reviewed and approved

## Handling Validation Failures

When validation fails:

1. **Test failure**: Return to implementation, fix code
2. **Missing requirement**: Return to implementation, add missing piece
3. **Spec drift**: Document, assess impact, get approval or fix
4. **Security issue**: STOP, fix immediately, re-validate
5. **Performance miss**: Profile, optimize, re-validate

## Anti-Patterns to Avoid

- **Rubber-stamp validation**: Actually verify, don't assume
- **Skipping edge cases**: They're where bugs hide
- **Ignoring drift**: Small drifts compound into big problems
- **Security theater**: Real checks, not checkbox ticking
- **Incomplete traceability**: Every requirement needs proof

## Notes

- Validation is not optional, even for "simple" changes
- Failed validation is not failure—it's catching issues early
- Document everything for future reference
- User approval is required to complete this phase
