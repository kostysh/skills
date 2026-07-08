---
name: react-components-engineer
description: >-
  Build and review bulletproof React components that remain correct across SSR,
  hydration, multiple instances, concurrent rendering, async/opaque children,
  portals/iframes, transitions, Activity visibility, server-client data
  boundaries, and future React runtime changes.

  Use when designing or hardening reusable React components, including
  RSC-oriented code paths.
metadata:
  source-version: 0.1.3
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 677cd24809a176f56ea4d83047e53d06de5e963de9efa027bb149f90e8eb6326
---

# react-components-engineer

## Start here

1. Confirm the task matches react-components-engineer's applicability criteria.
2. Use the preserved overview guidance as the normative workflow for this skill.
3. Load only the active references that match the current task.
4. Preserve existing project conventions unless the overview explicitly requires a stricter invariant.

## When to use this skill

- Creating or refactoring reusable React components/providers.
- Reviewing component robustness for SSR, hydration, RSC, portals, iframes, or pop-out windows.
- Hardening server/client boundaries and preventing accidental sensitive-data leaks.

## When NOT to use this skill

- App-level SPA architecture (routing, data layer, forms): use `react-spa-engineer`.
- TypeScript language/tooling decisions: use `typescript-engineer`.
- Test framework strategy and mocking policy: use `typescript-test-engineer`.
- Primarily visual styling or UI look-and-feel work: use `frontend-design`.

## Overview

Build React components that survive real-world rendering contexts, not just happy-path demos.

## Skill Interop (Priority)

- This skill owns component resilience rules and runtime correctness patterns.
- `typescript-engineer` owns language/toolchain constraints.
- `react-spa-engineer` owns app-level framework integration.
- `typescript-test-engineer` owns broad test methodology.
- If rules conflict, prefer:
  1. `typescript-engineer` for TS/toolchain.
  2. `react-components-engineer` for component hardening semantics.
  3. `react-spa-engineer` for app-level React architecture.

## Non-Negotiables

- Assume hostile runtime conditions: SSR, hydration timing, multi-instance mounts, concurrent rendering, async children, portals, and hidden/offscreen trees.
- Do not rely on global singleton assumptions (`window`, hardcoded DOM ids, one-time mount semantics).
- Treat `children` as opaque values; do not depend on `cloneElement` as the default data-flow mechanism.
- Separate correctness from optimization hints (`useMemo` is not semantic persistence).
- Protect sensitive server-only values before passing data into unknown component trees.

## Bulletproof Checklist

| Axis              | Risk                                             | Required Pattern                                                          |
| ----------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| Server-proof      | Browser APIs crash SSR                           | Move browser reads/writes to effects or client-only execution             |
| Hydration-proof   | FOUC/mismatch after hydration                    | Pre-hydration synchronous script for critical initial DOM state           |
| Instance-proof    | Reused components collide                        | Use `useId()` for stable per-instance IDs                                 |
| Concurrent-proof  | Duplicate server work                            | Wrap request-scoped async loaders in `cache()`                            |
| Composition-proof | `cloneElement` breaks with async/opaque children | Use Context to pass data down                                             |
| Portal-proof      | Wrong `window` in iframe/portal/popout           | Resolve `ownerDocument.defaultView` from component DOM node               |
| Transition-proof  | Current React view transition animation snaps    | Wrap state update in `startTransition()`                                  |
| Activity-proof    | Hidden UI still applies global effects           | Explicitly enable/disable global side effects with cleanup                |
| Leak-proof        | Sensitive data leaks to client                   | Use `experimental_taintUniqueValue` / `experimental_taintObjectReference` |
| Future-proof      | Semantics rely on cache hints                    | Use `useState`/`useRef` when correctness needs persistence                |

## Fast Workflow

1. Identify execution contexts: server/client, hydration timing, window/document scope, instance multiplicity, hidden/offscreen behavior.
2. Evaluate the component against all checklist axes.
3. Apply exact fix patterns from `references/bulletproof-patterns.md`.
4. Validate with scenario tests: SSR render, hydration, multi-instance, portal/iframe, transition, hidden activity, server/client boundary.
5. When introducing expensive integration coverage, align execution contour with project policy (local fast loop, PR required checks, nightly stability).
6. Optimize only after correctness is verified.

## Anti-Patterns to Reject

| Anti-pattern                                          | Why it fails                      | Use instead                                 |
| ----------------------------------------------------- | --------------------------------- | ------------------------------------------- |
| Reading `localStorage` in render on server            | SSR crash                         | Read in effect or pre-hydration script      |
| Hardcoded DOM ids inside reusable components          | Instance collisions               | `useId()`                                   |
| `cloneElement(children, ...)` as default composition  | Fails for Promise/opaque children | Context                                     |
| Assuming global `window` event target                 | Breaks in portals/iframes/popouts | `ownerDocument.defaultView`                 |
| Using `useMemo` for stable semantic values            | Cache may be discarded            | `useState`/`useRef` with explicit lifecycle |
| Trusting downstream components with sensitive objects | Accidental serialization/leak     | Taint sensitive values/objects              |

## Reference Files

- [Bulletproof Patterns](references/bulletproof-patterns.md) - Full guidance for all 10 hardening patterns, code templates, caveats, and review checks.

## Workflow stages

### Workflow stage: Apply react-components-engineer guidance

Apply the preserved react-components-engineer guidance without changing its domain behavior.

1. Match the request to the applicability criteria.
2. Follow the preserved overview sections for the concrete work.
3. Read the smallest relevant active reference before using detailed guidance from it.
4. Run the relevant verification from the overview or report why it could not be run.

Validation:

- The outcome follows the preserved skill guidance and any loaded reference constraints.

## Gotchas

- **high** — Do not hide full application screens inside Storybook as if they were reusable components. Storybook should document reusable components, states, and justified compositions.
- **high** — Do not encode required markers as literal asterisks inside label strings. Form field components should expose a boolean required indicator and own its visual styling.

## Policies

### Reusable component first policy
When a UI control is already reused, belongs to an accepted design-system surface, or the task explicitly asks for reusable UI foundation, add or update the shared component and Storybook states before wiring domain screens.

## Required active references
- [Bulletproof Patterns](references/bulletproof-patterns.md) — Read this when you need Full guidance for all 10 hardening patterns, code templates, caveats, and review checks.

## Portability rules

- Do not reference machine-specific absolute paths or local files outside this skill folder.
- Keep all mandatory react-components-engineer guidance inside this skill folder.
- Use relative links for local references, assets, scripts, tests, and supporting docs.

## Portability checklist before finishing

- Run the skill-source-compiler check command after regeneration.
- Search the skill folder for absolute local paths before finishing.
- Confirm every required reference listed by SKILL.md exists inside this skill folder.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
