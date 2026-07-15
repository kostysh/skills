# React Component Resilience Patterns

Load only the sections that match a concrete failure path. Installed project versions and matching official React or framework documentation outrank these examples. External links below are optional provenance, not portability dependencies.

## 1. Render and Effect lifecycle

### Apply when

- A component reads or writes an external system.
- Strict Mode, repeated mounts, hidden UI, or interrupted rendering can expose lifecycle assumptions.

### Invariant

- Render stays pure and repeatable.
- An Effect exists only to synchronize with an external system.
- Each setup can run again and every setup has mirrored cleanup using the same target and parameters.
- Correctness does not depend on a one-time mount.

### Reject

- Mutating module globals, DOM, storage, timers, or subscriptions during render.
- Empty dependency arrays used to hide reactive inputs.
- Cleanup that removes a listener from global `window` when setup used another document's window.

### Verify

Exercise setup, dependency change, cleanup, unmount, and remount around the observable external behavior. A test that only asserts an Effect or cleanup function exists is substrate.

Official reference: [React `useEffect`](https://react.dev/reference/react/useEffect).

## 2. SSR and hydration

### Apply when

The component is rendered to HTML and later hydrated. Do not impose SSR requirements on a client-only component unless the accepted architecture requires them.

### Invariant

- Server render does not evaluate browser-only globals such as `window`, `document`, storage, media queries, or observers.
- The first client render produces the same output as the server render.
- Browser synchronization happens through the smallest project-compatible mechanism: an Effect for non-paint-critical external state, `useSyncExternalStore` with a matching server snapshot for an external store, a client-only boundary, or framework-owned server data.
- Hydration mismatches are treated as bugs. `suppressHydrationWarning` is a narrow escape hatch, not a fix.

### App-shell boundary

A synchronous pre-hydration script can be appropriate for genuinely paint-critical state such as theme, but a reusable component must not inject one silently. The app or framework shell must own ordering, CSP nonce or hash, escaping, initial DOM contract, and server/client parity.

### Verify

Render with the project's server renderer, hydrate the same tree, observe recoverable hydration errors, and assert the user-visible initial and settled states. A client-only unit render, static snapshot, or green build does not prove hydration.

Official references: [React `hydrateRoot`](https://react.dev/reference/react-dom/client/hydrateRoot), [`useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore), and [`useEffect`](https://react.dev/reference/react/useEffect).

## 3. Instances, roots, and IDs

### Apply when

The component can appear more than once, remount, or run under multiple React roots.

### Invariant

- Component-owned DOM IDs are unique and stable across server/client rendering.
- Mutable state belongs to the instance unless a shared owner is explicit.
- Multiple roots coordinate distinct `identifierPrefix` values, with matching server and client prefixes when hydrated.

Use `useId` for DOM and accessibility relationships. Do not use it for list keys, business/data identity, cache keys, or async Server Components.

### Verify

Render at least two instances together and exercise their labels, descriptions, controls, styles, listeners, and teardown independently. For multiple roots, verify prefix coordination at the root integration boundary.

Official reference: [React `useId`](https://react.dev/reference/react/useId).

## 4. Opaque children and composition

### Apply when

A reusable component accepts arbitrary `children`, slots, or caller-provided elements.

### Invariant

Treat React elements and children as opaque. Do not assume one valid element unless the public contract explicitly requires and validates it.

Choose the smallest traceable API:

- explicit props for direct configuration;
- named slots or compound components for a known structure;
- render props for caller-controlled rendering;
- Context for data shared through a deep subtree;
- a custom Hook for reusable behavior.

`cloneElement` remains possible for an explicit valid-element contract, but it is not a default data-flow mechanism and must preserve keys, refs, and traceability.

### Verify

Exercise every supported child form and the declared behavior for unsupported input. A test that only finds Context or removes `cloneElement` does not prove the composition contract.

Official references: [React `cloneElement`](https://react.dev/reference/react/cloneElement) and [React `Children`](https://react.dev/reference/react/Children).

## 5. Portals and DOM realms

### Apply when

The component can render or attach browser resources in a portal, iframe, pop-out, or adopted document.

### Invariant

- Derive `document` and `window` from the component's owned DOM node (`ownerDocument` and `defaultView`) or receive an explicit realm/container contract.
- Create elements, observers, styles, selections, and event listeners in that realm.
- Cleanup uses the same realm and resource identity as setup.

Do not claim portal resilience solely because `createPortal` appears in the code: a same-document portal does not exercise cross-document behavior.

### Verify

Mount into the real alternate document/window, exercise the relevant event or resource, and close or unmount it. Assert cleanup and absence of writes to the opener's globals.

## 6. Server Components and server/client data

### Apply when

The installed framework actually implements React Server Components or another explicit server/client component boundary.

### Invariant

- Follow the framework's supported directive, import, serialization, and caching contracts for its installed version.
- Send Client Components only the allowlisted fields needed for their user-visible behavior.
- Keep authorization and sensitive-data selection on the server.
- Treat framework builds and serialization checks as bounded integration evidence, not proof of authorization or absence of every leak.

### React `cache`

`cache` is RSC-only request-scoped memoization. Define and share one memoized function where deduplication is required; remember that calls to different wrappers do not share a cache and errors are cached. Use it for a demonstrated duplicate computation or shared snapshot, not as a generic concurrency or correctness fix. Framework caching and invalidation rules take precedence.

### Experimental taint APIs

Taint APIs are available only in Experimental React RSC environments and must not trigger a production release-channel change. They protect specific object instances or values from direct passage, but derived or cloned values can still leak. Use them only as optional defense-in-depth after server authorization, DTO allowlisting, and isolation, with `security-reviewer` owning the security verdict.

### Verify

Exercise the real framework boundary with allowed and rejected data shapes. Security claims additionally require evidence chosen by the security owner; an experimental taint call, DTO type, mock, or build alone cannot close them.

Official references: [React `cache`](https://react.dev/reference/react/cache), [`'use client'`](https://react.dev/reference/rsc/use-client), and [experimental taint APIs](https://react.dev/reference/react/experimental_taintObjectReference).

## 7. Transitions and Activity

### Transitions

Use `startTransition` or `useTransition` only when the update is non-urgent; do not use Transition updates to control text inputs. `startTransition` marks updates as non-blocking but does not create a browser or React View Transition.

React `<ViewTransition>` is a Canary/Experimental feature. Use it only when the project already runs a supporting channel and the component contains a real `<ViewTransition>` boundary. Verify enter, exit, update, or shared-element behavior that the task actually claims.

### Activity

Use `<Activity>` only when the installed React version exposes it and retained hidden UI is part of the component contract. In hidden mode React hides the subtree, destroys its Effects, processes hidden updates at lower priority, retains state, and recreates Effects when visible. Do not add manual listener toggles that duplicate this lifecycle without an observed gap. Test globally scoped DOM or CSS resources separately rather than assuming Effect cleanup covers them.

### Verify

For transitions, observe the actual interaction and pending or animation behavior. For Activity, hide, update, reveal, and unmount the subtree while asserting state preservation and external cleanup. An imported API or timer-only unit test is insufficient.

Official references: [React `startTransition`](https://react.dev/reference/react/startTransition), [`<ViewTransition>`](https://react.dev/reference/react/ViewTransition), and [`<Activity>`](https://react.dev/reference/react/Activity).

## 8. Memoization and future changes

`useMemo`, `memo`, and `useCallback` are performance optimizations, not semantic persistence. Component correctness must survive re-rendering and permitted cache discard. Store lifecycle state in state or refs only when that state belongs to the component; first remove unnecessary dependencies or calculations rather than adding memoization automatically.

Use profiling or a concrete dependency-identity failure to justify optimization. Verify the measured interaction in the relevant build and environment. Do not claim performance improvement from API presence or an unmeasured micro-test.

Official references: [React `useMemo`](https://react.dev/reference/react/useMemo) and [React `memo`](https://react.dev/reference/react/memo).

## Review output

For each material issue record:

- applicable context and inspected evidence;
- failure path and affected component contract;
- smallest supported correction or owner handoff;
- verification that would falsify the failure;
- status: `verified`, `partial`, or `blocked`;
- residual risk and anti-claims.

Do not report `verified` when the relevant renderer, document, lifecycle, framework, measurement, or security boundary was not exercised.
