# Interop

Use this reference when `frontend-design` is active alongside other skills.

## `react-spa-engineer`

`frontend-design` owns:

- visual direction
- hierarchy
- composition
- motion direction
- typography
- copy compression

`react-spa-engineer` owns:

- SPA architecture
- routing
- state management
- data fetching
- forms
- testing
- accessibility implementation patterns

Rule: visual ambition must not violate the architectural or accessibility constraints established by `react-spa-engineer`.

## `react-components-engineer`

Use `frontend-design` to define how a component should look and feel. Use `react-components-engineer` to ensure the component remains correct across SSR, portals, concurrency, hydration, and edge rendering cases.

Rule: when there is tension between appearance and component correctness, preserve correctness and adjust the design.

## `shadcn`

Use `frontend-design` for the page-level art direction and composition. Use `shadcn` for registry-aware component selection, patterns, and implementation details.

Rule: avoid turning shadcn-based work into arbitrary custom UI when the existing component language is already strong.
