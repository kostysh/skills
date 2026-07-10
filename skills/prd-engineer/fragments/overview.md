Create PRDs that are problem-first, scope-aware, and testable enough for product, design, engineering, QA, and stakeholders to share the same understanding.

This skill favors concise documents with strong requirements over heavyweight templates. Use it to turn product intent into observable behavior, acceptance criteria, risks, rollout, and learning loops. A PRD does not prove market demand, technical feasibility, or implementation correctness by itself; it makes those claims explicit enough to test.

## Default Output Shape

For a new PRD, include:

- authority and handoff: product-source precedence, current-version approval evidence, `Authority`, intended consumer, `Handoff`, blockers, and owned non-blocking gaps
- executive summary: problem, why now, solution, success metrics, guardrails
- audience and scenarios: users, jobs, primary flow, key edge cases
- scope: in scope, non-goals, anti-claims
- requirements: functional and non-functional requirements, preferably with IDs for handoff
- acceptance criteria: observable checks per story, requirement, or capability
- risks and dependencies: owners, open questions, decisions needed
- rollout and learning: phases, instrumentation, outcome review

For a PRD review, lead with `Authority`; include target handoff and readiness when assessed. Then list blockers, evidence gaps, substrate-only acceptance defects, anti-claims, concrete rewrites, and the next owner.

## Reference Map

Read [PRD template](references/prd-template.md) when creating a formal PRD artifact, expanding a draft, adding architecture handoff, AI/security/rollout modules, or running a detailed quality check.

## Contextual Reference Triggers

Open only the block that matches the task:

- **Formal PRD skeleton, metadata, authority, handoff readiness, or minimal lifecycle:** use [PRD template](references/prd-template.md) sections `Core PRD Skeleton`, `Authority and Handoff`, and `Minimal Lifecycle`.
- **Claims that depend on research, metrics, designs, or decisions:** use [PRD template](references/prd-template.md) section `Evidence and Related Work`.
- **Product metrics, quality guardrails, release phases, or owner attributes:** use [PRD template](references/prd-template.md) sections `Metrics and Quality Guardrails` and `Requirement Quality Checklist`.
- **Architecture handoff, external systems, or data classification:** use [PRD template](references/prd-template.md) section `Architecture Handoff Module`.
- **Handoff to engineering, QA, or later conformance review:** use [PRD template](references/prd-template.md) section `Requirement Quality Checklist` for requirement attributes and traceability.
- **Acceptance criteria review:** use [PRD template](references/prd-template.md) section `Acceptance Criteria Test`.
- **AI, security, privacy, compliance, migration, or compatibility risk:** use [PRD template](references/prd-template.md) section `Optional Modules`.
- **Cross-functional review planning:** use [PRD template](references/prd-template.md) section `Review Routing`.
- **Choosing where the PRD should live:** use [PRD template](references/prd-template.md) section `Document Location`.
- **Reviewing an existing PRD:** use [PRD template](references/prd-template.md) sections `PRD Review Checklist` and `Anti-Pattern Check`.
