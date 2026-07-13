# Performance for React SPA

Use this reference only for a measured performance question or an explicit
performance budget. A production build, profile, or user-centric measurement is
required before claiming improvement.

Unless a block is explicitly labeled copyable, code blocks in this reference
are conceptual and omit project instrumentation, error, and loading contracts.

## Triage order

1. Establish the slow user interaction, route, device/network assumptions, and
   accepted metric or observable symptom.
2. Remove request waterfalls and unnecessary work.
3. Reduce initial route and asset cost.
4. Protect interaction latency and avoid blocking urgent updates.
5. Skip off-screen rendering when measurement justifies it.
6. Add manual memoization only after checking project React Compiler policy and
   profile evidence.

Prefer CSS and browser primitives over JavaScript layout, scroll, resize, or
observer wrappers when they meet the accepted compatibility and interaction
contract.

## Request waterfalls

Start independent work before awaiting it:

```ts
const usersPromise = api.users.list({ signal });
const statsPromise = api.stats.get({ signal });

const [users, stats] = await Promise.all([usersPromise, statsPromise]);
```

Use `Promise.all` only when failure should reject the combined operation. Use
`Promise.allSettled` only when the product contract defines partial rendering;
do not silently replace failed business data with empty arrays.

TanStack Query hooks execute concurrently when they render together, but nested
or conditional rendering can still create waterfalls. Verify the actual network
timeline.

## Route and component splitting

Declare lazy imports at module scope or use the installed React Router lazy route
API. Split at boundaries whose production chunk cost and navigation frequency
justify it.

```tsx
const ReportsRoute = lazy(() => import('./ReportsRoute'));
```

A dynamic import is not evidence of a useful split. Inspect production build
output and ensure the module is not also pulled into the initial graph by a
static import or broad public entrypoint.

Preload only a high-likelihood next route or resource and verify that the preload
does not compete with the current critical path.

## React Compiler and manual memoization

Current React Compiler deployments can memoize components, values, and functions
automatically. Inspect whether the project enables the compiler and which mode it
uses before adding or removing `memo`, `useMemo`, or `useCallback`.

Official guidance: <https://react.dev/reference/react/useMemo>

Manual memoization is justified when profile evidence and stable dependencies
show it avoids meaningful repeated work, or when a library/hook contract requires
a stable identity. `useCallback` is not limited to props of memoized children;
it may also satisfy a measured dependency or subscription contract.

Do not use memoization as a semantic guarantee. If correctness depends on a
cached value never being discarded, use state, a ref, or a different ownership
model.

## Interaction latency

Use `startTransition` for non-urgent state updates that may be interrupted, and
`useDeferredValue` when expensive rendering can lag behind urgent input. Do not
wrap the input's own controlled update in a transition.

```tsx
const [query, setQuery] = useState('');
const deferredQuery = useDeferredValue(query);
const results = filterItems(items, deferredQuery);
```

Only keep this machinery when production profiling or a reproducible interaction
shows a benefit.

## Long content

Choose among normal rendering, pagination, CSS `content-visibility`, and
virtualization from measured DOM/layout/paint cost and interaction requirements,
not a universal row-count threshold.

Virtualization must preserve:

- keyboard navigation and focus when items mount/unmount;
- accessible position/count semantics when needed;
- stable item identity and scroll restoration;
- variable-height measurement and resize behavior;
- testing and find-in-page expectations accepted by the product.

## Imports and public entrypoints

Local feature/component entrypoints are allowed when they define a deliberate
public API and do not violate import boundaries. Avoid broad application barrels
that create cycles, hide dependency direction, or measurably enlarge initial
chunks.

Do not claim that a barrel automatically defeats tree shaking. Use the production
module graph or bundle report.

## Browser persistence and listeners

- Keep large or structured reload-safe data in Dexie under its allowlist, TTL,
  and scoping rules.
- Limit `localStorage` to approved tiny preferences or bootstrap hints and guard
  read/write failures.
- Share global event listeners where multiple instances otherwise duplicate the
  same subscription; clean them up deterministically.
- Use passive scroll/touch listeners only when the handler never calls
  `preventDefault()`.

## Images and layout stability

Provide intrinsic dimensions or aspect ratio, responsive sources when available,
appropriate eager/lazy priority, and meaningful alt text. Verify the chosen image
pipeline and network behavior in the production build instead of copying a
generic markup recipe.

## Evidence

Record the scenario, build mode, device/network conditions, metric or profile,
before/after result, and trade-offs. Development timings and React Strict Mode
render counts are not production evidence.

A new lazy import, `memo`, virtualization library, resource hint, bundle config,
or profiler screenshot is substrate until the target interaction or budget is
measurably improved without breaking correctness or accessibility.
