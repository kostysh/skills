# Artifact Validation Checklists

## Requirements Validation Checklist

Before approving a requirements document, verify:

### User Stories
- [ ] Each story has a clear actor ("As a...")
- [ ] Each story has a specific capability ("I want...")
- [ ] Each story has a benefit ("So that...")
- [ ] Stories are independent (can be implemented separately)
- [ ] Stories are negotiable (room for discussion on implementation)
- [ ] Stories are valuable (deliver user/business value)
- [ ] Stories are estimable (can roughly estimate effort)
- [ ] Stories are small (implementable in a sprint)
- [ ] Stories are testable (clear pass/fail criteria)

### Acceptance Criteria
- [ ] Every user story has at least one acceptance criterion
- [ ] All criteria use Given/When/Then format
- [ ] Criteria are specific (no vague terms like "fast" or "easy")
- [ ] Criteria are measurable (can objectively verify)
- [ ] Criteria cover happy path
- [ ] Criteria cover error scenarios
- [ ] Criteria cover edge cases

### Completeness
- [ ] Edge cases are documented
- [ ] Error scenarios have expected behaviors
- [ ] Non-functional requirements are specified
- [ ] Constraints are listed
- [ ] Dependencies are identified
- [ ] Out of scope is explicitly defined
- [ ] Assumptions are stated
- [ ] Open questions are tracked

### Quality
- [ ] No implementation details in requirements
- [ ] Domain language is used consistently
- [ ] Examples are provided where helpful
- [ ] No duplicate requirements
- [ ] No conflicting requirements

---

## Specification Validation Checklist

Before approving a technical specification, verify:

### Requirements Coverage
- [ ] Every user story is addressed
- [ ] Every acceptance criterion has a solution
- [ ] Coverage matrix is complete
- [ ] No requirements are missing from spec

### Technical Design
- [ ] Problem statement is clear
- [ ] Solution approach is described
- [ ] All affected components identified
- [ ] File paths are accurate
- [ ] Data models are defined
- [ ] API contracts are specified
- [ ] Error handling is documented

### Quality Attributes
- [ ] Security considerations addressed
- [ ] Performance implications noted
- [ ] Scalability considered (if relevant)
- [ ] Accessibility considered (if user-facing)

### Alternatives
- [ ] Multiple approaches were considered
- [ ] Trade-offs are explained
- [ ] Decision rationale is documented

### Alignment
- [ ] Spec follows project constitution
- [ ] Spec uses existing codebase patterns
- [ ] No unnecessary backward compatibility hacks
- [ ] No premature optimization

### Practical
- [ ] No line numbers referenced (they change)
- [ ] Functions/classes referenced by name
- [ ] No detailed code in spec
- [ ] Spec is implementable as written

---

## Plan Validation Checklist

Before approving an implementation plan, verify:

### Structure
- [ ] Plan has clear context section
- [ ] Prerequisites are listed
- [ ] Required skills are identified
- [ ] Steps are numbered and ordered
- [ ] Dependencies between steps are clear
- [ ] Each step has verification criteria
- [ ] Handover step is included
- [ ] Standard footer is present

### Step Quality
- [ ] Each step is atomic (one thing)
- [ ] Each step is verifiable
- [ ] Steps are appropriately sized (15-45 min)
- [ ] Test steps come before implementation steps
- [ ] No gaps between steps

### Completeness
- [ ] All spec items are covered
- [ ] Test strategy is included
- [ ] Error handling is addressed
- [ ] Security measures are included

### For Multiple Plans
- [ ] Main plan exists
- [ ] Execution strategy is clear (parallel/sequential)
- [ ] Dependencies between plans are documented
- [ ] Each specialized plan is self-contained
- [ ] Coordination notes are provided

### Practical
- [ ] References functions, not line numbers
- [ ] File paths are accurate
- [ ] External tools usage is explicit
- [ ] Rollback considerations noted

---

## Tasks Validation Checklist

Before approving task breakdown, verify:

### Task Definition
- [ ] Each task has clear description
- [ ] Each task has specific files listed
- [ ] Each task has verification criteria
- [ ] Each task has effort estimate
- [ ] Dependencies are explicit
- [ ] Parallel/sequential marked correctly

### Task Quality
- [ ] Tasks are atomic (single responsibility)
- [ ] Tasks are independently verifiable
- [ ] Tasks are appropriately sized
- [ ] No circular dependencies
- [ ] Test tasks exist for code tasks

### Organization
- [ ] Task overview table is complete
- [ ] Dependency graph is accurate
- [ ] Parallel groups are identified
- [ ] No file conflicts in parallel tasks

### Traceability
- [ ] Tasks trace back to plan steps
- [ ] All plan steps have corresponding tasks
- [ ] No orphan tasks (not from plan)

---

## Implementation Validation Checklist

During and after implementation, verify:

### Testing
- [ ] Tests exist for new behavior
- [ ] Tests verify behavior, not implementation
- [ ] If TDD was requested: tests failed first (RED) and pass after implementation (GREEN)

### Code Quality
- [ ] Follows project coding standards
- [ ] No lint errors
- [ ] Types are properly defined
- [ ] Error handling is complete
- [ ] No hardcoded values
- [ ] No dead code
- [ ] Comments explain why, not what

### Security
- [ ] Input validation on all external inputs
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] No hardcoded secrets
- [ ] Proper authentication/authorization
- [ ] Error messages don't leak information

### Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] No test regressions
- [ ] Coverage meets standards

### Documentation
- [ ] Code is self-documenting
- [ ] Complex logic is commented
- [ ] API documentation updated (if applicable)

---

## Validation Report Checklist

Before approving validation report, verify:

### Coverage
- [ ] All requirements are traced
- [ ] All acceptance criteria verified
- [ ] Edge cases are tested
- [ ] Error scenarios are handled

### Testing
- [ ] All tests pass
- [ ] No test regressions
- [ ] Coverage meets standards
- [ ] Performance tests pass (if applicable)

### Security
- [ ] Security checklist completed
- [ ] No vulnerabilities found
- [ ] Security review performed

### Drift
- [ ] Drift analysis performed
- [ ] All drift documented
- [ ] Drift justified or fixed
- [ ] Significant drift approved

### Handover
- [ ] Summary document complete
- [ ] All files listed
- [ ] Known limitations documented
- [ ] Future recommendations included

---

## Quick Validation Reference

### Requirements Quick Check
1. WHAT not HOW?
2. Measurable criteria?
3. Edge cases covered?
4. Out of scope defined?

### Specification Quick Check
1. All requirements addressed?
2. Security considered?
3. Alternatives evaluated?
4. Follows constitution?

### Plan Quick Check
1. Test-first order?
2. Verification for each step?
3. Handover step present?
4. Dependencies clear?

### Tasks Quick Check
1. Atomic tasks?
2. No file conflicts in parallel?
3. Clear verification?
4. Tests before code?

### Implementation Quick Check
1. Tests first?
2. No security issues?
3. Follows patterns?
4. Error handling complete?
