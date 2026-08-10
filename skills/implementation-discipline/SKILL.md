---
name: implementation-discipline
description: Use when implementing, refactoring, reviewing code, or authoring,
  revising, and reviewing PRDs, architecture, software specs, and delivery plans
  to keep scope source-authorized, minimize conceptual surface, and require
  proportional evidence.
compatibility: Portable documentation-only skill. Use alongside language,
  framework, and review skills; it does not replace domain-specific engineering
  guidance.
metadata:
  source-version: 0.2.2
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: b1ad209a02c31988455be80006d244f3c53f7004e4eff36aea314b4eb5af4c06
---

# implementation-discipline

## Start here

1. Confirm that the task involves implementation, code review, or non-trivial authoring, revision, or review of a PRD, architecture, software specification, or delivery plan.
2. Classify the task as implementation/remediation, code-review-only, or design/authoring; code-review-only is read-only, and design/authoring never authorizes code or runtime mutations.
3. Before scope, design shape, acceptance, verification depth, or process depth, record the observable outcome or invariant, actor or consumer and claim boundary, source-authorized scope and non-goals, permitted outputs or mutations, simplest direct or existing primitive, and narrowest falsifying check.
4. For non-trivial work, relate the local change to the project purpose only far enough to reject misleading framing or narrow the work; project purpose does not authorize unrequested expansion.
5. Prefer the direct or existing path with the least conceptual surface that satisfies current correctness, security, compatibility, and source requirements.
6. Pass the complexity exception gate before adding a new concept, and repeat the scope-and-simplicity gate after any material delta that adds a boundary, lifecycle, output, or verification contour.
7. Change only the authorized surface, run proportional verification, report evidence and remaining risk, then stop.

## When to use this skill

- Implement or modify code where minimal complexity and explicit verification matter.
- Refactor existing code where speculative flexibility or scope expansion is a risk.
- Review code for unnecessary concepts, unjustified complexity, or weak success evidence.
- Create, revise, or review a non-trivial PRD, architecture design, software specification, or delivery plan where the artifact could invent scope or complexity.

## When NOT to use this skill

- The task is ordinary prose documentation or analysis that does not shape product scope, architecture, implementation behavior, delivery work, or verification.
- The task depends entirely on specialized domain facts and does not require a scope, simplicity, mutation, or evidence decision.
- The task is a trivial authoring correction that cannot change scope, design, handoff, validation, or completion claims.

## Workflow stages

### Workflow stage: Define the outcome and boundaries

Make the requested outcome, source authority, mutation boundary, constraints, and honest completion claim explicit.

1. Classify the task as implementation/remediation, code-review-only, or design/authoring and determine which outputs or mutations are authorized.
2. For code-review-only requests, do not change code; inspect assumptions, complexity, scope, and evidence, route formal findings and output to `code-reviewer`, and stop before implementation unless remediation is explicitly requested.
3. For design/authoring work, change only requested artifacts; do not mutate code or runtime state, and keep product, architecture, specification, and delivery semantics with their owning skills.
4. Define successful completion as observable behavior or a preserved invariant, not as files, scaffolding, configuration, tests, or documentation existing.
5. Record the actor or consumer, claim boundary, source-authorized scope and non-goals, permitted outputs or mutations, simplest direct or existing primitive, and narrowest falsifying check before expanding scope or solution shape.
6. For a reported bug or interactive correction, before material mutation record the actor, exact steps or path, actual visible or observable failure, relevant network or persisted-state observation when applicable, and a falsifier; if this witness is unavailable, report the evidence gap instead of acting on a plausible adjacent hypothesis.
7. Before materially adding a capability, route, domain, workflow, or configuration boundary, name the exact operator decision or owning requirement locator that authorizes it; missing or conflicting authority stops that addition.
8. When switching tasks, start from the new task source and carry only a compact `source / scope / state / next action` handoff; conclusions or scope from the previous task do not authorize the new one.
9. State constraints and assumptions that materially affect the design; stop and ask only when no safe conservative interpretation exists.
10. For feature, runtime, product, agent, or system-capability claims, separate observable behavior from substrate and state important anti-claims; if the acceptance criteria can pass without the claimed behavior, narrow the claim or surface the specification defect before implementation.
11. For non-trivial local work, use project purpose to check whether the request advances the intended flow; use that context to narrow or reject the local task, never to add unrequested work.
12. When implementing an accepted audit or review, read the remediation-matrix section in `references/verification-loop.md` and keep each accepted finding tied to a change, evidence, and status.

Validation:

- The requested behavior, protected constraints, task mode, and mutation authority are explicit.
- A bug or interactive correction has its exact pre-mutation witness, or material mutation remains blocked by an explicit evidence gap.
- Every material boundary addition has an exact authority locator, and every task switch has a bounded handoff from the new source.
- Code-review-only work remains read-only, and design/authoring does not mutate code or runtime state.
- Capability work cannot be declared complete through substrate-only acceptance.
- Project-purpose reasoning has not expanded scope.

### Workflow stage: Choose the simplest sufficient design

Deliver the current requirement with the least new conceptual surface that remains correct and maintainable in the existing system.

1. Prefer no change when the need is speculative; otherwise prefer a direct local change or an existing language, runtime, platform, or project primitive that keeps the total design smaller.
2. Judge simplicity by concepts introduced and behavior that must be understood, not by line count or by whether code is reused.
3. Use an installed dependency only when it reduces total complexity for this task; installed is not automatically simpler than direct code.
4. Reject flexibility, configurability, indirection, or defensive branches for hypothetical future requirements.
5. Treat artifacts created or materially revised in the same session as outputs, not higher-authority sources that can authorize their own expansion.
6. Record adjacent defects as findings, blockers, or follow-ups unless a current source explicitly places their remediation in scope.
7. Missing evidence does not authorize a broader defensive design; choose the narrowest source-supported option or block the decision that depends on the missing fact.
8. Before adding an abstraction, dependency, layer, provider, registry, queue, retry mechanism, factory, interface, wrapper, configuration surface, persistent state, background process, harness, runner, instrumentation, or extension point, name the current source requirement or protected boundary it serves and why a direct or existing option is insufficient.
9. If that concrete justification does not exist, choose the simpler design. Do not require an alternatives essay for an ordinary direct change.

Validation:

- The design satisfies the requested behavior and protected constraints.
- Every new concept is necessary for a current requirement or real boundary such as security, compatibility, transactionality, a public contract, or established repeated use.
- Hypothetical future flexibility is not treated as a requirement.
- Uncertainty has not been converted into unrequested boundaries, lifecycle, operations, or verification scope.

### Workflow stage: Change surgically

Keep the authorized code or artifact delta local, traceable, and consistent with its existing system.

1. Change only the code or authoring surface needed for the requested outcome.
2. Match existing local style and structure unless the task explicitly requires a broader refactor.
3. In code work, remove only dead code or imports made obsolete by the change.
4. Do not rewrite surrounding architecture merely because another design looks cleaner in isolation.

Validation:

- Each changed hunk traces directly to the requested outcome or a protected constraint.
- Unrelated cleanup, aesthetic redesign, and speculative refactoring are absent.

### Workflow stage: Verify, report, and stop

Prove the behavior proportionally and finish without adding post-success scope.

1. Run the narrowest meaningful check that would fail if the requested behavior or preserved invariant regressed.
2. Prefer existing local test, lint, typecheck, build, or smoke commands when they are the narrowest meaningful proof.
3. If proving the claim requires verification infrastructure or a production seam larger than the authorized change, revisit the claim boundary and design before adding it; do not add runtime instrumentation only for test convenience.
4. Use stronger project or domain verification for security, privacy, money, data loss, auth, accessibility, release, migration, or production-wiring boundaries.
5. If a bug was fixed, repeat the same recorded actor and steps or path and re-check the relevant observable, network, or persisted-state boundary; when repeated independent signals indicate a defect class, also check adjacent observable cases.
6. If the intended verification cannot run, use the next-best check and state the evidence gap.
7. Report the completed outcome, checks run, checks not run, and remaining risk.
8. Once the simplest sufficient solution is implemented and verified, stop; do not add speculative cleanup, extensibility, or future-proofing.

Validation:

- Evidence matches the strength of the completion claim.
- Any unverified risk or intentionally deferred current requirement is explicit.
- No work was added after the requested behavior was proven.

## Interop priority

- **product intent, users, scope, non-goals, success metrics, and product acceptance:** prd-engineer. prd-engineer owns product semantics; implementation-discipline supplies source-authority, simplicity, self-expansion, and evidence constraints.
- **architecture boundaries, ASRs, pattern decisions, trade-offs, and ADRs:** architecture-engineer. architecture-engineer owns architecture semantics; implementation-discipline supplies source-authority, simplicity, self-expansion, and evidence constraints.
- **implementation behavior, edge cases, falsifiers, and verification maps:** spec-engineer. spec-engineer owns specification semantics; implementation-discipline supplies source-authority, simplicity, self-expansion, and evidence constraints.
- **slices, tasks, dependencies, sequencing, and delivery handoff:** delivery-planner. delivery-planner owns delivery semantics; implementation-discipline supplies source-authority, simplicity, self-expansion, and evidence constraints.
- **language, framework, and platform specifics:** The relevant domain skill. This skill governs behavioral discipline and complexity, not APIs or platform rules.
- **formal review workflow, severity, and evidence format:** code-reviewer. This skill contributes the simplicity and evidence lenses, while code-reviewer owns the read-only review process and findings output; remediation starts only with explicit change authority.

## Gotchas

- **high** — Do not hide a material assumption or blocking ambiguity inside the implementation.
- **high** — Do not add concepts for reuse, cleanliness, flexibility, or future-proofing unless a current requirement or protected boundary makes them necessary.
- **high** — Do not assume an installed dependency or existing abstraction is simpler when using it enlarges the behavior or concepts that must be understood.
- **high** — Do not optimize for the fewest lines when that hides behavior, weakens correctness, or increases conceptual coupling.
- **high** — Do not use project purpose, risk, completeness, evidence, audits, or same-session artifacts to authorize features, boundaries, process, or cleanup outside current sources.
- **high** — Do not treat mocks, metadata, schemas, wrappers, logs, tests, or documentation as delivered runtime capability without observable behavior and matching evidence.
- **high** — Do not change code during review-only work; enter implementation only after explicit remediation authority.
- **high** — Do not broaden the diff with unrelated cleanup or aesthetic refactoring.
- **medium** — If the intended outcome cannot be verified, report the exact gap instead of implying confidence.

## Policies

### Simplicity-first policy
Deliver the requested observable behavior with the least new conceptual surface. Prefer a direct local change that fits the existing system; correctness, security, compatibility, and verification remain mandatory.

### Complexity exception policy
Complexity bears the burden of proof. Add an abstraction, dependency, layer, configuration, state, process, harness, instrumentation, or extension point only for a named current source requirement or protected boundary and only when a direct or existing option is insufficient.

### Source-authority policy
Risk, completeness, evidence, audit findings, adjacent defects, and artifacts created in the same session do not expand authorized scope; route missing authority instead of manufacturing it.

### Project-purpose fit policy
Project purpose may show that a local task is misleading, insufficient, or unnecessary and may therefore narrow or reject it. It never grants authority to expand the requested scope.

### Surgical-diff policy
Every changed hunk should trace to the requested outcome or a protected constraint; unrelated cleanup belongs in another change set.

### Evidence-over-intuition policy
Completion requires checks proportionate to the claim or an explicit evidence gap.

### Operator-not-QA policy
Operator feedback is not the primary verification mechanism. Produce current agent-side evidence for UI, API, data, security, or delivery-flow behavior before asking for approval.

### Intentional deferral policy
An ordinary minimal solution is complete when it satisfies all current requirements and verification. Name a ceiling and revisit trigger only when a known current requirement is intentionally deferred or when an accepted remediation item is trigger-dependent.

### Capability reality policy
A feature is complete only when it creates or preserves the claimed observable behavior. Label infrastructure and other substrate honestly, and state what remains unavailable.

### Review-only boundary policy
Review, assessment, and diagnosis do not authorize code changes. Use `code-reviewer` for formal review output and begin remediation only after explicit change authority.

### Reporting contract
Report the completed outcome, verification evidence, and unverified risk. For accepted-audit remediation, preserve the stricter matrix and closure contract in `references/verification-loop.md`; when another active skill defines a stricter format, follow it without weakening these evidence boundaries.

## Optional references
- [Core principles](references/core-principles.md) — Read this when choosing between materially different designs or when the complexity exception gate applies.
- [Verification loop](references/verification-loop.md) — Read this before implementing multi-step changes or deciding how to verify success.

## Portability rules

- Do not reference machine-specific paths or external repository state.
- Keep all required implementation-discipline guidance inside this skill folder.
- Treat examples as behavioral patterns, not as framework-specific rules.

## Portability checklist before finishing

- Confirm the generated SKILL links both active references.
- Confirm no absolute paths appear in the emitted skill.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
- Supporting glob: `docs/logs/*`
