# Requirements Protocol

## Purpose

Capture business requirements in a structured format **before** any technical design. This phase answers "What?" and "Why?" without addressing "How?"

## Prerequisites

You need:
- **Artifact root**: `docs/sdd/` (create if missing)
- **TASK_DIR**: `docs/sdd/{TICKET_ID}/` - Ask user for ticket ID if unknown
- **Constitution**: Read `docs/sdd/constitution.md` if it exists
- **Next file number**: Check existing R* files in TASK_DIR
- **Available skills**: Review AGENTS.md or the environment skill list

State these values before starting.

## Outputs

A requirements document (`R{N}-requirements.md`) containing:
- User stories with clear actors and motivations
- Acceptance criteria in Given/When/Then format
- Edge cases and error scenarios
- Non-functional requirements
- Explicit out-of-scope items
- Open questions for clarification

## Process

### Phase 1: Context Gathering

1. **Understand the request**: Ask clarifying questions about:
   - Who are the users/actors?
   - What problem are we solving?
   - Why is this important now?
   - What does success look like?

2. **Ensure artifact root**:
   - Check if `docs/sdd/` exists
   - Create it if missing

3. **Select skills**:
   - Scan available skills
   - Decide which skills can help requirements discovery (domain, compliance, UX, etc.)
   - Record the decision in the requirements artifact under **Relevant Skills**

4. **Investigate the codebase**:
   - Find related existing functionality
   - Identify affected components
   - Note existing patterns and conventions

5. **Check constitution**: Ensure requirements align with project principles

### Phase 2: User Story Development

Draft user stories using this format:

```markdown
### US-{N}: {Story Title}

**As a** {user type/role}
**I want** {capability/feature}
**So that** {benefit/value}
```

Guidelines:
- Focus on user value, not implementation
- One story = one atomic capability
- Use domain language, not technical terms
- Keep stories independent when possible

### Phase 3: Acceptance Criteria Definition

For each user story, define acceptance criteria using Given/When/Then:

```markdown
#### Acceptance Criteria

**AC-{N}.1**: {Criterion title}
- **Given** {precondition/context}
- **When** {action/trigger}
- **Then** {expected outcome}
- **And** {additional outcome if needed}
```

Guidelines:
- Be specific and measurable ("response time < 200ms" not "fast response")
- Cover happy path AND error scenarios
- Each criterion should be independently testable
- Avoid implementation details

### Phase 4: Edge Cases and Constraints

Document:
- **Edge cases**: Boundary conditions, unusual inputs, concurrent scenarios
- **Error scenarios**: What can go wrong and expected behavior
- **Non-functional requirements**: Performance, security, accessibility, scalability
- **Constraints**: Technical limitations, compliance requirements, dependencies

### Phase 5: Scope Definition

Explicitly document:
- **In scope**: What this requirement covers
- **Out of scope**: What it explicitly does NOT cover
- **Assumptions**: What we're assuming to be true
- **Dependencies**: External factors this depends on

### Phase 6: Review and Refinement

1. Present requirements to user
2. Walk through each user story and acceptance criteria
3. Validate edge cases are complete
4. Confirm scope boundaries
5. Resolve open questions
6. **Get explicit approval before proceeding**

### Phase 7: Write Artifact

Write the requirements document to `docs/sdd/{TICKET_ID}/R{N}-requirements.md`

Use the [Requirements Template](requirements-template.md).

## Validation Checklist

Before completing this phase, verify:

- [ ] All user stories have clear actors, capabilities, and benefits
- [ ] Every user story has at least one acceptance criterion
- [ ] All acceptance criteria use Given/When/Then format
- [ ] Criteria are specific and measurable (no vague terms)
- [ ] Edge cases are documented
- [ ] Error scenarios have expected behaviors
- [ ] Non-functional requirements are specified
- [ ] Out of scope is explicitly defined
- [ ] No implementation details in requirements
- [ ] User has approved the requirements

## Anti-Patterns to Avoid

- **Vague criteria**: "System should be fast" → "Response time < 200ms"
- **Implementation leakage**: "Use Redis for caching" → "Cache frequently accessed data"
- **Missing actors**: "The feature works" → "As a customer, I can..."
- **Assumed requirements**: Always ask, never assume
- **Compound stories**: Split into atomic, independent stories

## Notes

- Requirements may evolve during later phases—that's OK
- Document changes and get re-approval if significant
- Keep requirements focused on WHAT, not HOW
- This document becomes the validation baseline
