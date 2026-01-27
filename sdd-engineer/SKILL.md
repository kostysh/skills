---
name: sdd-engineer
description: |
  Spec-Driven Development workflow for AI agents with requirements capture, technical specification, planning, task decomposition, tested implementation, and validation artifacts.
  Use for multi-step software changes that need traceability, approvals, or rigorous testing; use /sdd-quick for small, low-risk changes.
---

# SDD-Engineer Guide

## When to use

- Use for new features, architectural changes, multi-file refactors, or cross-team work
- Use when the user asks for SDD, specs, acceptance criteria, or explicit approval gates
- Use when traceability from requirements to tests is required

## When NOT to use

- Do not use for pure Q&A, doc summaries, or exploratory spikes with no deliverable
- Do not use for trivial one-line edits unless the user requests formal artifacts
- Do not use when the user explicitly declines approvals or written artifacts

## Workflow selection

| Scenario | Workflow | Why |
|----------|----------|-----|
| New feature, high risk, many files | Full SDD | Strong traceability and checkpoints |
| Medium change, 2-5 files | Full SDD | Avoid spec drift |
| Bug fix, 1-2 files, clear scope | /sdd-quick | Lighter artifact, still traceable |
| Pure investigation | No SDD | No implementation to validate |

## Core workflow (full)

1. Capture requirements (/sdd-req)
2. Write specification (/sdd-spec)
3. Plan implementation (/sdd-plan)
4. Decompose tasks (/sdd-tasks)
5. Implement with tests-first (/sdd-impl)
6. Validate and hand over (/sdd-validate)

## Commands

| Command | Purpose | Protocol |
|---------|---------|----------|
| `/sdd` | Overview and guardrails | This file |
| `/sdd-req` | Capture requirements | [requirements-protocol.md](references/requirements-protocol.md) |
| `/sdd-spec` | Write technical specification | [specification-protocol.md](references/specification-protocol.md) |
| `/sdd-plan` | Create implementation plan | [planning-protocol.md](references/planning-protocol.md) |
| `/sdd-tasks` | Decompose into tasks | [tasks-protocol.md](references/tasks-protocol.md) |
| `/sdd-impl` | Execute implementation | [implementation-protocol.md](references/implementation-protocol.md) |
| `/sdd-validate` | Validate against requirements | [validation-protocol.md](references/validation-protocol.md) |
| `/sdd-quick` | Compact workflow for small tasks | [quick-protocol.md](references/quick-protocol.md) |

## Artifacts and naming

All SDD artifacts live in `docs/sdd/`.

```
docs/sdd/
├── constitution.md
└── {TICKET_ID}/
    ├── R1-requirements.md
    ├── S1-specification.md
    ├── P1-plan.md
    ├── T1-tasks.md
    ├── V1-validation.md
    ├── H1-handover.md
    └── Q1-quick.md
```

| Prefix | Phase | Example |
|--------|-------|---------|
| R | Requirements | R1-requirements.md |
| S | Specification | S1-specification.md |
| P | Plan | P1-plan.md, P2-plan-api.md |
| T | Tasks | T1-tasks.md |
| V | Validation | V1-validation.md |
| H | Handover | H1-handover.md |
| Q | Quick | Q1-quick.md |

## Approval gates

| Transition | Approval required |
|------------|-------------------|
| Requirements -> Specification | Yes |
| Specification -> Planning | Yes |
| Planning -> Tasks | Yes |
| Tasks -> Implementation | Yes |
| Implementation -> Validation | Yes |
| Quick workflow -> Implementation | Yes |

## Skill selection (required)

At the start of every SDD phase (including /sdd-quick):
- Scan the available skills list (AGENTS.md or the environment skill list)
- Decide which skills can help this phase (domain, language, framework, testing, tooling)
- Record the decision in the phase artifact (use "Relevant Skills" or "Required Skills")
- If none apply, explicitly write "None"

## Core invariants

- Treat specs as the source of truth; code serves the spec
- Keep explicit traceability from requirements to tests
- Use TDD (RED/GREEN/VERIFY) only when explicitly requested; otherwise follow the plan's testing strategy and typescript-test-engineer guidance
- Record drift and get approval before proceeding

## Constitution

Ensure `docs/sdd/constitution.md` exists before starting. Use the [Constitution Template](references/constitution-template.md).

## Interop priority

- This skill governs process, artifacts, and approval gates
- Language and framework skills govern code conventions and API usage (e.g., typescript-engineer, react-spa-engineer)
- Testing organization and tooling defer to typescript-test-engineer when applicable

## Key resources

### Templates
- [Requirements Template](references/requirements-template.md)
- [Specification Template](references/specification-template.md)
- [Plan Template](references/plan-template.md)
- [Tasks Template](references/tasks-template.md)
- [Handover Template](references/handover-template.md)
- [Quick Template](references/quick-template.md)

### Guidance
- [Best Practices](references/best-practices.md)
- [Anti-Patterns](references/anti-patterns.md)
- [Artifact Validation](references/artifact-validation.md)
- [Testing Integration](references/testing-integration.md)

### Examples and diagrams
- [Workflow Example](references/workflow-example.md)
- [Diagrams (Mermaid)](references/diagrams.md)
