# Quick Workflow Protocol

## Purpose

Execute small, low-risk changes with a compact SDD artifact while preserving traceability.

## Prerequisites

You need:
- **Artifact root**: `docs/sdd/` (create if missing)
- **TASK_DIR**: `docs/sdd/{TICKET_ID}/`
- **Constitution**: `docs/sdd/constitution.md` if it exists
- **Next file number**: Check existing Q* files
- **Available skills**: Review AGENTS.md or the environment skill list

## Outputs

A single quick artifact: `Q{N}-quick.md` containing requirements, spec, plan, tasks, and validation.

## Process

### Phase 1: Capture the Minimum Viable Spec

1. Check if `docs/sdd/` exists; create it if missing
2. Ask 2-5 clarifying questions if needed
3. Write one or more user stories
4. Add Given/When/Then acceptance criteria
5. Note out-of-scope and constraints
6. Scan available skills, decide which apply, and record under **Relevant Skills**
7. If owner-only input is required, add a compact `Owner Input Required` block:
   - Missing input (explicit list, no wildcards)
   - Why not derivable
   - Source candidates (files/links/systems/owners)
   - Owner question (single concrete ask)
   - `A/B` options with tradeoffs for critical decisions

### Phase 2: Define the Technical Approach

1. Describe the simplest solution that satisfies criteria
2. List affected files and components
3. Call out risks and alternatives (briefly)

### Phase 3: Plan and Tasks

1. List 2-6 ordered steps
2. Include at least one explicit test step
3. Add a verification checklist
4. Add explicit status tracking using canonical task states:
   - `⏳ pending`, `🔄 in_progress`, `⛔ blocked`, `✅ completed`, `❌ failed`

### Phase 4: Approval Gate

Present the quick artifact and get **explicit approval** before coding.

### Phase 5: Implement and Validate

1. If TDD is requested, follow RED/GREEN/VERIFY
2. Update status and notes in the quick artifact
3. Record test results and coverage notes
4. If package supports coverage command(s), run and record final coverage checkpoint before closure

### Phase 6: Close Out

1. Mark overall status (PASS/FAIL)
2. Note any drift and get approval if needed

## Template

Use the [Quick Template](quick-template.md).

## Validation Checklist

- [ ] Acceptance criteria written in Given/When/Then
- [ ] Solution approach is clear and minimal
- [ ] Steps include explicit test work (before code only when TDD is requested)
- [ ] User approval recorded
- [ ] Tests run and results logged
- [ ] Coverage checkpoint recorded when package supports coverage command(s)
- [ ] Drift, if any, documented and approved
