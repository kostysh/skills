# SDD Best Practices

## Specification Quality

### Be Precise and Measurable

**Good**:
- "API response time < 200ms at p95"
- "Support 1000 concurrent users"
- "Password minimum 8 characters, 1 uppercase, 1 number"

**Bad**:
- "System should be fast"
- "Handle many users"
- "Password should be strong"

### Use Domain Language

Write specifications in the language of the business domain, not technical jargon.

**Good**:
- "Customer can add items to shopping cart"
- "Order is confirmed when payment succeeds"

**Bad**:
- "User calls POST /api/cart endpoint"
- "Order record updated when Stripe webhook received"

### Include Concrete Examples

Examples clarify ambiguous requirements better than lengthy descriptions.

```markdown
**Example**: Valid email formats
- user@example.com ✓
- user.name@example.com ✓
- user@sub.example.com ✓
- user@example ✗ (no TLD)
- @example.com ✗ (no local part)
```

### Avoid Implementation Details in Requirements

Requirements describe WHAT, not HOW.

**Good**: "System caches frequently accessed data to improve performance"
**Bad**: "System uses Redis with 15-minute TTL for user profile caching"

## Testing Strategy (TDD optional)

### Tests are required

Define the testing approach in the plan and ensure coverage for new behavior.
For test organization, runners, and mocking guidance, use the `typescript-test-engineer` skill.

### If TDD is explicitly requested

Use the RED/GREEN/VERIFY cycle:

1. **RED**: Write a failing test
   - Test should fail for the RIGHT reason (missing implementation)
   - Not a syntax error or wrong assertion

2. **GREEN**: Write minimal code to pass
   - Resist adding extra features
   - Just make the test pass

3. **VERIFY**: Confirm behavior meets requirements
   - Run full test suite
   - Check against acceptance criteria

### Test Behavior, Not Implementation

**Good** (tests behavior):
```javascript
test('login with valid credentials returns user', () => {
  const result = login('user@test.com', 'password');
  expect(result.user).toBeDefined();
  expect(result.token).toBeDefined();
});
```

**Bad** (tests implementation):
```javascript
test('login calls validatePassword then generateToken', () => {
  // Brittle - breaks if implementation changes
  expect(validatePassword).toHaveBeenCalled();
  expect(generateToken).toHaveBeenCalled();
});
```

### One Assertion Per Test (When Possible)

Makes failures easier to diagnose.

```javascript
// Good: Separate tests
test('validates email format', () => { ... });
test('validates password length', () => { ... });
test('validates password complexity', () => { ... });

// Bad: Multiple assertions
test('validates input', () => {
  // If this fails, which validation broke?
});
```

## Incremental Refinement

### Start Rough, Refine Iteratively

Don't aim for perfect specifications on the first draft.

1. **First pass**: Capture main user stories
2. **Second pass**: Add acceptance criteria
3. **Third pass**: Cover edge cases
4. **Fourth pass**: Add non-functional requirements

### Get Feedback Early and Often

- Share drafts before they're "ready"
- Ask specific questions, not "is this OK?"
- Validate understanding before building

### Split Large Requirements

If a requirement takes more than a few days to implement, split it.

**Signs a requirement is too large**:
- More than 5 user stories
- Touches more than 3 major components
- Cannot be demonstrated incrementally

## Artifact Directory

### Ensure the Artifact Root Exists

Always use `docs/sdd/` as the root for SDD artifacts. At the start of work:
- Check if `docs/sdd/` exists
- If missing, create it before writing any artifacts
- Keep all artifacts under `docs/sdd/{TICKET_ID}/`

### Use Emojis for Status and Highlights (Optional)

Where it improves scanning, add emojis to mark status or emphasize key notes in artifacts.

Examples:
- Status: `✅ Approved`, `🟡 In Review`, `🔴 Blocked`
- Highlights: `⚠️ Risk`, `💡 Note`, `✅ Done`

## Context Management

### Keep SKILL.md Under 500 Lines

Agent skills load entirely into context. Large files waste tokens.

### Use Progressive Disclosure

```
SKILL.md            → Overview and navigation (loaded always)
references/*.md     → Protocols, templates, and guidance (loaded on demand)
```

### Reference, Don't Duplicate

**Good**: "See [requirements template](requirements-template.md)"
**Bad**: Copying entire template into protocol document

## Human-in-the-Loop

### Validate at Phase Transitions

Never proceed without explicit approval:
- Requirements → Specification: "Are these requirements complete?"
- Specification → Planning: "Is this technical approach acceptable?"
- Planning → Tasks: "Is this plan actionable?"
- Tasks → Implementation: "Ready to start implementation?"

### Document Decisions

When the user makes a choice, document it:
- What was decided
- Why (if explained)
- What alternatives were considered

### Ask, Don't Assume

When uncertain:

**Good**: "Should deleted users be soft-deleted (marked inactive) or hard-deleted (removed from database)?"

**Bad**: Assuming soft-delete because it's "best practice"

## Traceability

### Link Everything

Every artifact should reference its predecessors:
- Specification links to Requirements
- Plan links to Specification
- Tasks link to Plan
- Tests link to Acceptance Criteria

### Use Consistent Identifiers

```markdown
US-1, US-2, US-3       (User Stories)
AC-1.1, AC-1.2         (Acceptance Criteria)
T1, T2, T3             (Tasks)
```

### Create Coverage Matrices

Show how requirements map to implementation:

| Requirement | Component | Test | Status |
|-------------|-----------|------|--------|
| US-1 | AuthService | auth.test.ts | ✓ |

## Handling Complexity

### Split Complex Work

When work is complex:
- Multiple plans for different domains
- Parallel execution where independent
- Clear handoff points between plans

### Define Clear Boundaries

Each plan should:
- Have clear inputs and outputs
- Be independently executable
- Have minimal dependencies on other plans

### Use Orchestration for Multi-Agent Work

Main plan coordinates:
- Execution order
- Dependencies
- Resource sharing
- Conflict resolution

## Continuous Improvement

### Retrospect on Each Feature

After completion, ask:
- What worked well in the SDD process?
- What was friction?
- What would we do differently?

### Update Constitution as Needed

When patterns emerge:
- Good patterns → Add to constitution
- Bad patterns → Add to anti-patterns
- Recurring issues → Add to checklist

### Share Learnings

Document lessons for future reference:
- In handover documents
- In project wiki
- In team discussions
