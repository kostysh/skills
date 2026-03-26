# Specification Protocol

## Purpose

Translate approved requirements into a technical design. This phase answers "How?" while ensuring all requirements will be satisfied.

## Prerequisites

You need:
- **Artifact root**: `docs/sdd/` (create if missing)
- **Approved requirements**: `docs/sdd/{TICKET_ID}/R{N}-requirements.md`
- **TASK_DIR**: `docs/sdd/{TICKET_ID}/`
- **Constitution**: `docs/sdd/constitution.md` for project principles
- **Next file number**: Check existing S* files
- **Available skills**: Review AGENTS.md or the environment skill list

**STOP** if requirements are not approved. Go back to requirements phase.

## Outputs

A technical specification (`S{N}-specification.md`) containing:
- Problem statement derived from requirements
- Proposed solution with rationale
- Affected components and files
- Data models and interfaces
- Error handling strategy
- Security considerations
- Performance implications
- Alternatives considered

## Process

### Phase 1: Requirements Analysis

1. **Read requirements thoroughly**: Understand every user story and acceptance criterion
2. **Map requirements to system**: Identify which parts of the codebase will change
3. **Identify gaps**: Note any technical questions the requirements don't answer
4. **List constraints**: From requirements + constitution + technical reality
5. **Select skills**:
   - Scan available skills
   - Decide which skills can help specification (language, framework, testing, security)
   - Record the decision in the specification artifact under **Relevant Skills**

### Phase 2: Codebase Investigation

1. **Find affected components**:
   - Search for related functionality
   - Trace data flow paths
   - Identify integration points

2. **Understand current implementation**:
   - Read relevant source files
   - Note existing patterns
   - Identify reusable code

3. **Assess impact**:
   - What needs to change?
   - What can be reused?
   - What must be created new?

### Phase 3: Solution Design

1. **Design approach**:
   - How will each requirement be satisfied?
   - What components need modification?
   - What new components are needed?

2. **Define interfaces**:
   - API contracts
   - Function signatures
   - Data schemas

3. **Plan data flow**:
   - Input → Processing → Output
   - State management
   - Persistence strategy

### Phase 4: Alternatives Analysis

For significant decisions, document alternatives:

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| Option A | ... | ... | Selected/Rejected |
| Option B | ... | ... | Selected/Rejected |

Explain why the chosen approach is best for this context.

### Phase 5: Risk Assessment

Document:
- **Security considerations**: Authentication, authorization, data protection
- **Performance implications**: Expected load, bottlenecks, optimization needs
- **Error scenarios**: What can fail and how to handle it
- **Migration concerns**: Data migration, backward compatibility

### Phase 6: Discussion with User

Present the specification:
1. Explain the proposed solution
2. Walk through major design decisions
3. Discuss trade-offs and alternatives
4. Address concerns and questions
5. **Get explicit approval before proceeding**

### Phase 7: Write Artifact

Write specification to `docs/sdd/{TICKET_ID}/S{N}-specification.md`

Use the [Specification Template](specification-template.md).

## Validation Checklist

Before completing this phase, verify:

- [ ] All requirements have corresponding technical solutions
- [ ] Affected components are identified with file paths
- [ ] Data models and interfaces are defined
- [ ] Error handling strategy is documented
- [ ] Security implications are addressed
- [ ] Performance considerations are noted
- [ ] Alternatives were considered for major decisions
- [ ] No backward compatibility hacks unless explicitly required
- [ ] Solution aligns with project constitution
- [ ] User has approved the specification

## Mapping Requirements to Specification

Create explicit traceability:

```markdown
## Requirements Coverage

| Requirement | Solution |
|-------------|----------|
| US-1: User login | OAuth2 flow in AuthService |
| AC-1.1: Valid credentials | Token validation in middleware |
| AC-1.2: Invalid credentials | 401 response with error message |
```

## Anti-Patterns to Avoid

- **Premature optimization**: Design for current needs, not hypothetical scale
- **Over-engineering**: Simplest solution that meets requirements
- **Ignoring existing patterns**: Follow established codebase conventions
- **Missing error paths**: Every operation can fail—plan for it
- **Security afterthought**: Consider security from the start
- **Unvalidated assumptions**: If unsure, ask the user

## Notes

- Specification is a living document until implementation begins
- If requirements change, update spec and get re-approval
- Don't include detailed code—reference files and functions by name
- Line numbers are forbidden (they change)—use function names
