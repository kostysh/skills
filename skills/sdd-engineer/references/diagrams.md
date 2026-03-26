# SDD Diagrams (Mermaid)

Use these diagrams for quick visual orientation. Prefer text checklists for execution.

## Core Workflow

```mermaid
flowchart TD
  A[Request] --> B[Requirements /sdd-req]
  B -->|Approval| C[Specification /sdd-spec]
  C -->|Approval| D[Planning /sdd-plan]
  D -->|Approval| E[Tasks /sdd-tasks]
  E -->|Approval| F[Implementation /sdd-impl]
  F --> G[Validation /sdd-validate]
  G --> H[Handover]
```

## RED / GREEN / VERIFY (Optional TDD)

Use only when TDD is explicitly requested.

```mermaid
flowchart LR
  AC[Acceptance Criteria] --> RED[RED: write failing test]
  RED --> GREEN[GREEN: implement to pass]
  GREEN --> VERIFY[VERIFY: confirm criteria]
  VERIFY -->|Pass| DONE[Done]
  VERIFY -->|Fail| RED
```

## Artifact Traceability

```mermaid
flowchart TD
  R[R-requirements.md] --> S[S-specification.md]
  S --> P[P-plan.md]
  P --> T[T-tasks.md]
  T --> I[Implementation]
  I --> V[V-validation.md]
  V --> H[H-handover.md]
```
