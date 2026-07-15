Build React components that preserve their declared behavior in the rendering contexts the project actually uses.

## Capability and anti-claims

This skill succeeds when it identifies a concrete component-level failure path, selects a project-compatible React pattern, and reports a result whose status is supported by evidence from the relevant renderer or browser boundary.

The instructions do not create runtime capability, choose a framework contract, grant authorization, prove accessibility or performance, or establish security by themselves. A hook, API import, wrapper, Storybook story, mock, typecheck, build, or generated file is bounded evidence and cannot close a broader behavior claim.

## Context decision matrix

| Context | Apply when | Required invariant | Claim-matched evidence |
| --- | --- | --- | --- |
| Every render | Always | Render is pure; state ownership is explicit; Effects synchronize only with external systems and have symmetric cleanup | Re-render and lifecycle scenario covering the external behavior |
| SSR and hydration | The component is server-rendered and hydrated | Server render does not touch browser-only APIs; initial client output matches server output | Server render plus hydration with mismatch/recoverable-error observation |
| Multiple instances or roots | Reuse, repeated mounts, or multiple roots are possible | No hardcoded shared DOM IDs or mutable singleton state; root prefixes are coordinated by the root owner | Two instances or roots exercised together |
| Opaque composition | The public API accepts arbitrary `children` or slots | Do not infer child shape without an explicit element contract; data flow remains traceable | Supported child forms and invalid-contract behavior exercised |
| Portal, iframe, or pop-out | DOM or events may live in another document | Browser resources derive from the owned DOM node or an explicit realm contract | Scenario in the actual target document/window |
| Visibility lifecycle | Activity or retained hidden UI is used | State and external side effects follow the installed API's visible/hidden lifecycle | Hide, update, reveal, and cleanup behavior exercised |
| Server/client boundary | RSC or another server/client component boundary is real | Client props follow the framework serialization contract; sensitive fields are allowlisted on the server | Framework integration/build plus boundary behavior; security owner evidence for security claims |
| Transition or optimization | The feature exists and a measured interaction or duplicate-work path is in scope | Optimization APIs never carry semantic correctness; version and release-channel gates are satisfied | Observed transition or measurement matching the claim |

Exclude contexts that project evidence makes impossible. Do not add substrate to satisfy an inapplicable row.

## Version-sensitive API gates

| API | Gate | Boundary |
| --- | --- | --- |
| `useId` | Installed React supports it and a component-owned DOM relationship needs an ID | Not for list keys, data identity, cache keys, or async Server Components; multiple roots require owner-coordinated `identifierPrefix` |
| `cache` | React Server Components are actually used | Request-scoped memoization and shared snapshots only; it is not a concurrency-correctness primitive and framework caching policy still wins |
| `startTransition` | A non-urgent state update is appropriate | It does not create a View Transition and must not control text inputs; pending UI requires the matching transition API |
| `<Activity>` | The installed stable React version exposes it and the component uses retained hidden UI | Hidden mode destroys Effects and later recreates them while preserving state; verify any globally scoped DOM or CSS behavior separately |
| `<ViewTransition>` | The project already uses a React channel that exposes it | Canary/Experimental feature; requires a real `<ViewTransition>` boundary and transition-driven update, never a release-channel upgrade by default |
| Experimental taint APIs | The project already uses a compatible Experimental RSC environment | Optional defense-in-depth after authorization, DTO allowlisting, and isolation; never security closure |
| `useMemo`, `memo`, `useCallback` | Profiling or a concrete dependency-identity need justifies them | Performance hints only; correctness must survive cache discard or re-render |

For detailed patterns and caveats, load [React Component Resilience Patterns](references/bulletproof-patterns.md) only for the applicable contexts.
