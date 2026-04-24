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
