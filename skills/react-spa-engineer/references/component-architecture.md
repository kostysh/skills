# Component Architecture for React SPA

Use this reference for app-level feature layout and import ownership. Use
`react-components-engineer` when reusable component correctness across portals,
multiple instances, SSR/hydration, or component API boundaries is the primary
task.

Unless a block is explicitly labeled copyable, code and layout blocks in this
reference are conceptual and omit project-specific modules and configuration.

## Feature and layer boundaries

Default greenfield layout for this fixed stack:

```text
src/
  app/              # bootstrap, providers, router, application shell
  shared/
    api/            # HTTP/SSE/WebSocket transport, contracts, typed errors
    ui/             # reusable presentational components
    forms/          # shared RHF fields and error adapters
    state/          # shared runtime-state primitives
    storage/        # Dexie primitives, scoping, TTL and cleanup
  features/
    feature-name/   # route modules, Query adapters, screens and feature UI
```

Existing project conventions win when they preserve the same ownership
boundaries. Do not reorganize a working application merely to match these folder
names.

Allowed dependency direction:

```text
app -> features -> shared
```

Feature-to-feature imports require an explicit public contract or a shared owner;
do not reach into another feature's internals. Enforce material boundaries with
the repository's executable import rules. Source grep can be a smoke signal but
is not architecture enforcement.

`shared/api` owns project transport, credentials, CSRF attachment, response
normalization, and typed transport errors. Feature Query adapters own query
options and invalidation semantics. Screens and UI components do not perform
project network IO.

## Component ownership

- Prefer functional components and hooks for ordinary UI.
- A React render error boundary still requires the supported React boundary
  mechanism; do not confuse it with React Router's function-shaped route
  `ErrorBoundary` property.
- Keep state as local as its consumers allow; lift or introduce Context/Zustand
  only when the state reference justifies it.
- Use composition through children and explicit slots before introducing render
  props, compound components, or configuration-heavy factories.
- Keep component files and exports consistent with the repository. One component
  per file and PascalCase filenames are defaults, not reasons for unrelated
  rewrites.
- Props may use interfaces or type aliases according to the repository and the
  type shape. `typescript-engineer` owns language-level policy.

## Public entrypoints and imports

Local `index.ts` files are acceptable as intentional public entrypoints for a
small component or feature module. Avoid application-wide barrels that hide
dependency direction, create cycles, or measurably pull unrelated modules into a
bundle.

Do not claim that every barrel harms tree shaking. Verify bundle impact from the
production build before making a performance claim, and keep import-boundary
correctness separate from bundle optimization.

## Reusable composite widgets

Do not invent a partially accessible listbox, combobox, tabs, menu, or dialog in
an app-architecture example. Prefer the accepted project primitive. If a new
reusable widget is required, hand its component contract to
`react-components-engineer`; use the Accessibility reference and
`web-ui-reviewer` for the integration and audit boundaries.

## Verification

Match evidence to the claim:

- import-rule execution proves declared dependency boundaries;
- typecheck and component tests prove only their exercised contracts;
- production build output is required for bundle-splitting or tree-shaking
  claims;
- a material integrated flow requires browser evidence from the Testing
  reference.

A directory tree, exported component, route registration, story, or screenshot
is substrate and cannot alone establish a working SPA capability.
