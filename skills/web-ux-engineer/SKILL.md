---
name: web-ux-engineer
description: Design, implement, and audit user flows in web apps and SPAs. Use
  for interaction choices, forms, feedback, navigation context, and recovery.
  Deliver verified changes or evidence-backed UX findings; route visual
  direction, UI-rule audits, and framework mechanics to their owners.
metadata:
  source-version: 0.1.0
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 35380f5c9edc8b15b774cabcfbc41192b873473b9517cdc130dd6c5751e51a45
---

# web-ux-engineer

## Start here

1. Deliver an authorized flow improvement or a bounded UX audit that a product owner or implementer can act on. Select implement or audit from the request; audit is read-only, including code and working data.
2. Start with a task or bounded scenario and available requirements, code, live UI, or images. Derive actor, starting context, and intended outcome from these inputs; do not demand a complete brief before useful work.
3. Inspect applicable project rules and existing patterns. A missing business rule, permission, API guarantee, or storage decision blocks only the dependent choice; ask its owner and continue supported work.

## When to use this skill

- Choose or improve how users complete a web task, understand its status, recover, and resume work.
- Implement an authorized interaction change, or audit a scenario for evidence-backed UX problems.

## When NOT to use this skill

- Pure visual direction, interface-rule or accessibility audit, or framework integration with settled UX; use the relevant owner below.
- Product requirements discovery, user research execution, or formal accessibility certification is the requested result; this skill supplies only bounded interaction analysis.

## Workflow stages

### Workflow stage: Define the task

Anchor decisions in the user's intended result.

1. Identify the actor's goal, entry point, constraints, and observable completion. Separate accepted requirements from current behavior and assumptions; resolve conflicting authority before the dependent decision.
2. Keep scope proportional. A label correction needs its local context and check, not a journey map or redesign.

### Workflow stage: Trace actions and decisions

Find where the scenario loses clarity or continuity.

1. Follow what users see, decide, enter, and receive. Inspect terminology, information hierarchy, forms, feedback, navigation context, cancel, and recovery with realistic data.
2. For applicable SPA transitions, trace loading, empty, error, confirmed success, unknown operation outcome, interruption, and return. Preserve useful input and list context; distinguish closing a surface from cancelling an operation.
3. A timeout can leave the result unknown. Do not assert failure, safe retry, rollback, or successful saving without the API contract and corresponding evidence.

### Workflow stage: Choose the interaction

Resolve meaningful alternatives with task-specific reasons.

1. Compare plausible alternatives only when the choice matters. Consider a page for substantial or addressable work, a dialog for a bounded decision needing nearby context, or inline editing for a small local change; weigh context, complexity, interruption, and recovery.
2. Choose ordinary layout, labels, and feedback within authority. Reuse existing components and conventions; leave business rules and backend guarantees to their owners.
3. Do not prescribe autosave, offline support, drafts, new storage, fewer columns, or fewer steps by default. Preserve useful density and deliberate confirmations.

### Workflow stage: Implement or report findings

Produce the requested change or an actionable audit.

1. In implement mode, make the smallest coherent change across affected states and transitions. Carry focus, keyboard use, responsive behavior, cancel, and recovery through the implementation.
2. In audit mode, leave the target unchanged. For each finding give location and conditions, evidence, user consequence, proposed change, and a check that could demonstrate resolution. Prioritize by task impact; separate observed facts, inferences, and hypotheses. Do not assign an overall UX score.

### Workflow stage: Verify and hand off

Match the reported outcome to observed evidence.

1. Use available project checks and browser tools to exercise the changed path, relevant failure/recovery paths, input retention, keyboard/focus, and representative narrow layout. Preserve mandatory project checks; avoid unrelated suites.
2. Code supports code-level findings; images support visible states; browser walkthroughs support exercised interactions. Only suitable user research supports audience usability claims. None alone proves backend persistence, conversion improvement, or full WCAG conformance.
3. Report the result, changed or reviewed scope, evidence, remaining limits, and next action. Missing tools limit the affected conclusion, not all supported analysis.

## Interop priority

- **visual strategy, composition, styling, and motion:** frontend-design. Supply the chosen interaction; consume its visual expression while retaining scenario continuity.
- **review of UI implementation, accessibility, rendered states, and interface rules:** web-ui-reviewer. Supply scenario findings; consume technical UI findings without claiming certification or independent approval.
- **React SPA routing, data, forms, state, and integration correctness:** react-spa-engineer. Supply expected interaction and recovery; consume implementation constraints and runtime evidence.

## Policies

### Result status
Audit: findings means a supported defect exists; no-material-findings requires sufficient evidence for the bounded claim; limited means useful analysis with missing evidence or authority; blocked means no defensible audit is possible. Implementation: completed requires verification of the claimed result; partial means useful work with unresolved verification or scope; blocked means a necessary input or authority prevents progress.

### Ownership and independence
Honor an explicitly selected skill's supported scope. For mixed work choose one lead by requested result and consult neighbors only for specific questions; do not cycle handoffs or require all skills. An unavailable neighbor limits specialized conclusions, not the local method. Self-checks are not independent audits; this skill grants no delegation permission.

## Portability rules

- This self-contained method ships no runtime. Discover project paths, commands, tools, and contracts from the task environment.
- Verify material technical norms or version-sensitive behavior against primary documentation when needed; name unavailable authority and bound the conclusion.

## Portability checklist before finishing

- Keep observed behavior, assumptions, and unavailable evidence distinguishable in the handoff.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/**`
