# Planning Protocol

## Purpose

Create an actionable implementation plan that an agent (or human) can execute. The plan translates the specification into ordered, concrete steps.

## Prerequisites

You need:
- **Artifact root**: `docs/sdd/` (create if missing)
- **Approved specification**: `docs/sdd/{TICKET_ID}/S{N}-specification.md`
- **Requirements reference**: `docs/sdd/{TICKET_ID}/R{N}-requirements.md`
- **TASK_DIR**: `docs/sdd/{TICKET_ID}/`
- **Constitution**: `docs/sdd/constitution.md`
- **Next file number**: Check existing P* files
- **Available skills**: Review AGENTS.md or the environment skill list

**STOP** if specification is not approved. Go back to specification phase.

## Outputs

Implementation plan(s):
- **Single plan**: `P{N}-plan.md` for cohesive work
- **Multiple plans**: `P{N}-main-plan.md` + `P{N+1}-plan-{scope}.md` for complex work

## Process

### Phase 1: Specification Analysis

1. **Read specification completely**: Understand all components and decisions
2. **Verify against requirements**: Ensure spec covers all requirements
3. **Identify work units**: Break spec into logical implementation chunks
4. **Note dependencies**: What must happen before what?
5. **Select skills**:
   - Scan available skills
   - Decide which skills are required for implementation
   - Record them in the plan under **Required Skills**

### Phase 2: Plan Structure Decision

Evaluate whether to use single or multiple plans:

**Single Plan** when:
- Work is cohesive (one logical unit)
- Estimated steps ≤ 10
- Single technology/domain area
- No natural parallelization

**Multiple Plans** when:
- Distinct logical units (API, UI, database)
- Steps > 10 for single plan
- Different technology stacks
- Work can be parallelized
- Different skills/expertise needed

### Phase 3: Plan Design

For each plan, design:

1. **Context section**:
   - Current state of relevant code
   - Target state after implementation
   - Key files and functions involved

2. **Prerequisites**:
   - Skills to load
   - Tools required (explicitly list allowed external tools if needed)
   - Environment setup

3. **Implementation steps**:
   - Numbered, ordered steps
   - Each step is atomic and verifiable
   - Include file paths
   - Reference functions by name (not line numbers)

4. **Test strategy**:
   - What tests to write
   - When to write them (before implementation if TDD is requested)
   - How to verify success

### Phase 4: Step Definition

Each step should include:

```markdown
### Step {N}: {Clear Title}

{What to do and why}

**Files**: {paths to affected files}
**Tests**: {test approach for this step}
**Verification**: {how to confirm step is complete}
```

Guidelines:
- Steps should be 15-45 minutes of work each
- Each step produces a verifiable result
- Include test writing as explicit steps
- Consider rollback at each step

### Phase 5: Handover Step

Every plan MUST end with a handover step:

```markdown
### Step {N}: Write Handover Document

Write a handover document containing:
1. List of all files created/modified
2. Summary of changes made
3. Any issues encountered
4. Notes for future reference

Write to `docs/sdd/{TICKET_ID}/P{N}-plan.summary.md`
```

### Phase 6: Plan Footer

Add to every plan:

```markdown
---

**Important**: Do not trust this plan blindly. Verify your understanding of the codebase before applying changes.

**External Tools**: Allowed only if required by selected skills or explicitly listed in this plan. Otherwise avoid web search, documentation fetching, and external APIs.
```

### Phase 7: Multiple Plan Coordination (if applicable)

For multiple plans, create a main plan that:

1. **References specification**: Link to spec file
2. **Defines execution strategy**:
   - Parallel vs sequential execution
   - Dependencies between plans
3. **Lists all plans** with:
   - Skills required
   - Brief description
   - Assigned agent (if applicable)
4. **Coordination notes**: How plans interact

### Phase 8: Review

Self-review each plan:
- Is every spec item addressed?
- Are steps in correct order?
- Are dependencies clear?
- Can each step be verified?
- Is test strategy included?
- Is handover step present?

Present to user and **get explicit approval**.

### Phase 9: Write Artifacts

Write plan(s) to `docs/sdd/{TICKET_ID}/`:
- Single: `P{N}-plan.md`
- Multiple: `P{N}-main-plan.md`, `P{N+1}-plan-api.md`, etc.

Use the [Plan Template](plan-template.md).

## Validation Checklist

- [ ] All specification items have corresponding steps
- [ ] Steps are in logical order
- [ ] Dependencies are clearly marked
- [ ] Each step has verification criteria
- [ ] Test strategy is included (TDD only if requested)
- [ ] Handover step is present
- [ ] Required skills are listed
- [ ] No external tool usage without explicit permission
- [ ] Plan footer is included
- [ ] User has approved the plan

## Step Sizing Guidelines

| Step Size | When to Use |
|-----------|-------------|
| Too small | "Add import statement" - combine with related work |
| Good | "Create user authentication middleware with tests" |
| Too large | "Implement entire API" - break into smaller steps |

Aim for steps that are:
- Independently verifiable
- Complete in 15-45 minutes
- Focused on one concern

## Anti-Patterns to Avoid

- **Monolithic steps**: "Implement the feature" → Break down
- **Missing tests**: Every feature step needs corresponding test step
- **Vague verification**: "Check it works" → Specific success criteria
- **Hidden dependencies**: Make all prerequisites explicit
- **Ignoring existing code**: Plan to reuse, not rewrite
- **No rollback consideration**: What if a step fails?

## Notes

- Plans may need adjustment during implementation—that's OK
- If major changes needed, return to specification phase
- Keep plans focused on WHAT to do, not detailed HOW
- Reference code by function/class names, never line numbers
