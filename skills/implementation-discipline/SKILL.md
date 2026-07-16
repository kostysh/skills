---
name: implementation-discipline
description: Use when writing, modifying, refactoring, or reviewing code to
  deliver the requested observable behavior with the least new conceptual
  surface, surgical changes, explicit assumptions, and proportional
  verification.
compatibility: Portable documentation-only skill. Use alongside language,
  framework, and review skills; it does not replace domain-specific engineering
  guidance.
metadata:
  source-version: 0.2.0
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: c994a4bed0629a9c1f4b26277859ef5cfb8241543e89ee34477ad62a84d8f0da
---

# implementation-discipline

## Start here

1. Confirm that the task involves writing, changing, refactoring, or reviewing code.
2. Classify the task as implementation/remediation or review-only, and confirm whether code changes are authorized.
3. Define the requested observable behavior and the correctness, security, compatibility, and scope constraints it must preserve.
4. For non-trivial work, relate the local change to the project purpose only far enough to reject misleading framing or narrow the work; project purpose does not authorize unrequested expansion.
5. Prefer a direct local change that fits the existing system and introduces the least new conceptual surface.
6. If the design adds an abstraction, dependency, layer, configuration, state, background process, or extension point, pass the complexity exception gate before implementing.
7. Implement surgically, run proportional verification, report evidence and remaining risk, then stop.

## When to use this skill

- Implement or modify code where minimal complexity and explicit verification matter.
- Refactor existing code where speculative flexibility or scope expansion is a risk.
- Review code for unnecessary concepts, unjustified complexity, or weak success evidence.

## When NOT to use this skill

- The task is purely non-code documentation or analysis.
- The task depends entirely on domain rules owned by another skill and no code is being written, changed, refactored, or reviewed.
- The requested work is exploratory architecture or product design rather than implementation discipline.

## Workflow stages

### Workflow stage: Define the outcome and boundaries

Make the requested behavior, mutation authority, constraints, and honest completion claim explicit.

1. Classify the task as implementation/remediation or review-only and determine whether code changes are authorized.
2. For review-only requests, do not change code; inspect assumptions, complexity, scope, and evidence, route formal findings and output to `code-reviewer`, and stop before implementation unless remediation is explicitly requested.
3. Define successful completion as observable behavior or a preserved invariant, not as files, scaffolding, configuration, tests, or documentation existing.
4. State constraints and assumptions that materially affect the design; stop and ask only when no safe conservative interpretation exists.
5. For feature, runtime, product, agent, or system-capability claims, separate observable behavior from substrate and state important anti-claims; if the acceptance criteria can pass without the claimed behavior, narrow the claim or surface the specification defect before implementation.
6. For non-trivial local work, use project purpose to check whether the request advances the intended flow; use that context to narrow or reject the local task, never to add unrequested work.
7. When implementing an accepted audit or review, read the remediation-matrix section in `references/verification-loop.md` and keep each accepted finding tied to a change, evidence, and status.

Validation:

- The requested behavior, protected constraints, task mode, and mutation authority are explicit.
- Review-only work remains read-only.
- Capability work cannot be declared complete through substrate-only acceptance.
- Project-purpose reasoning has not expanded scope.

### Workflow stage: Choose the simplest sufficient design

Deliver the current requirement with the least new conceptual surface that remains correct and maintainable in the existing system.

1. Prefer no change when the need is speculative; otherwise prefer a direct local change or an existing language, runtime, platform, or project primitive that keeps the total design smaller.
2. Judge simplicity by concepts introduced and behavior that must be understood, not by line count or by whether code is reused.
3. Use an installed dependency only when it reduces total complexity for this task; installed is not automatically simpler than direct code.
4. Reject flexibility, configurability, indirection, or defensive branches for hypothetical future requirements.
5. Before adding an abstraction, dependency, layer, provider, factory, interface, wrapper, configuration surface, persistent state, background process, or extension point, name the current requirement or protected boundary it serves and why a direct or existing option is insufficient.
6. If that concrete justification does not exist, choose the simpler design. Do not require an alternatives essay for an ordinary direct change.

Validation:

- The design satisfies the requested behavior and protected constraints.
- Every new concept is necessary for a current requirement or real boundary such as security, compatibility, transactionality, a public contract, or established repeated use.
- Hypothetical future flexibility is not treated as a requirement.

### Workflow stage: Implement surgically

Keep the diff local, traceable, and consistent with the existing system.

1. Change only the code needed for the requested outcome.
2. Match existing local style and structure unless the task explicitly requires a broader refactor.
3. Remove only dead code or imports made obsolete by the change.
4. Do not rewrite surrounding architecture merely because another design looks cleaner in isolation.

Validation:

- Each changed hunk traces directly to the requested outcome or a protected constraint.
- Unrelated cleanup, aesthetic redesign, and speculative refactoring are absent.

### Workflow stage: Verify, report, and stop

Prove the behavior proportionally and finish without adding post-success scope.

1. Run the narrowest meaningful check that would fail if the requested behavior or preserved invariant regressed.
2. Prefer existing local test, lint, typecheck, build, or smoke commands when they are the narrowest meaningful proof.
3. Use stronger project or domain verification for security, privacy, money, data loss, auth, accessibility, release, migration, or production-wiring boundaries.
4. If a bug was fixed, cover or directly demonstrate the prior failure; when repeated independent signals indicate a defect class, also check adjacent observable cases.
5. If the intended verification cannot run, use the next-best check and state the evidence gap.
6. Report the completed outcome, checks run, checks not run, and remaining risk.
7. Once the simplest sufficient solution is implemented and verified, stop; do not add speculative cleanup, extensibility, or future-proofing.

Validation:

- Evidence matches the strength of the completion claim.
- Any unverified risk or intentionally deferred current requirement is explicit.
- No work was added after the requested behavior was proven.

## Interop priority

- **language, framework, and platform specifics:** The relevant domain skill. This skill governs behavioral discipline and complexity, not APIs or platform rules.
- **formal review workflow, severity, and evidence format:** code-reviewer. This skill contributes the simplicity and evidence lenses, while code-reviewer owns the read-only review process and findings output; remediation starts only with explicit change authority.

## Gotchas

- **high** — Do not hide a material assumption or blocking ambiguity inside the implementation.
- **high** — Do not add concepts for reuse, cleanliness, flexibility, or future-proofing unless a current requirement or protected boundary makes them necessary.
- **high** — Do not assume an installed dependency or existing abstraction is simpler when using it enlarges the behavior or concepts that must be understood.
- **high** — Do not optimize for the fewest lines when that hides behavior, weakens correctness, or increases conceptual coupling.
- **high** — Do not use project-purpose reasoning to authorize features, refactors, or cleanup outside the request.
- **high** — Do not treat mocks, metadata, schemas, wrappers, logs, tests, or documentation as delivered runtime capability without observable behavior and matching evidence.
- **high** — Do not change code during review-only work; enter implementation only after explicit remediation authority.
- **high** — Do not broaden the diff with unrelated cleanup or aesthetic refactoring.
- **medium** — If the intended outcome cannot be verified, report the exact gap instead of implying confidence.

## Policies

### Simplicity-first policy
Deliver the requested observable behavior with the least new conceptual surface. Prefer a direct local change that fits the existing system; correctness, security, compatibility, and verification remain mandatory.

### Complexity exception policy
Complexity bears the burden of proof. Add an abstraction, dependency, layer, configuration, state, process, or extension point only for a named current requirement or protected boundary and only when a direct or existing option is insufficient.

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
