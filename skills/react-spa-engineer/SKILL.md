---
name: react-spa-engineer
description: >-
  Comprehensive React SPA development expert for building production-ready
  single-page applications. Covers component architecture, state management
  (Zustand, Context), explicit persistence architecture (URL state, runtime UI
  state, Dexie/IndexedDB), data fetching (TanStack Query), forms (React Hook
  Form + Zod), routing (React Router), TypeScript patterns, performance
  optimization, testing (Vitest, RTL, Playwright), and accessibility.


  Use when building React SPAs, implementing features, reviewing code, setting
  up project architecture, or troubleshooting React client-side applications.
  Excludes SSR, RSC, Next.js server-side patterns.
metadata:
  source-version: 0.1.3
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 5cf0de2dfd3e23e393f617519e6b19c08db9a926ab55d042d28e65974afec6c0
---

# react-spa-engineer

## Start here

1. Confirm the task matches react-spa-engineer's applicability criteria.
2. Use the preserved overview guidance as the normative workflow for this skill.
3. Load only the active references that match the current task.
4. Preserve existing project conventions unless the overview explicitly requires a stricter invariant.

## When to use this skill

- Building, implementing, reviewing, or troubleshooting React single-page applications.
- Working on React SPA component architecture, state management, URL/runtime/IndexedDB persistence, TanStack Query data fetching, forms, routing, performance, testing, or accessibility.
- Setting up a production-ready React client-side app with TypeScript.

## When NOT to use this skill

- Server-side rendering, React Server Components, Next.js server patterns, or non-SPA architecture are the primary concern.
- The work is purely reusable component hardening without app-level SPA architecture; use react-components-engineer.
- The work is purely visual design; use frontend-design.

## Overview

Build production-ready React single-page applications with TypeScript, modern state management, and best practices.

**Stack**: React | TypeScript | Vite | TanStack Query | Zustand | React Hook Form + Zod | React Router | Dexie (IndexedDB)

## Skill Interop (Priority)

- Use `typescript-engineer` as the baseline for TypeScript language/toolchain rules (tsconfig, linting, @ts-expect-error policy, unsafe assertions).
- Use this skill for React-specific patterns (hooks typing, JSX, React Router, TanStack Query, RHF, Dexie).
- For UI/UX and visual design work in web apps, also use the `frontend-design` skill.
- If rules conflict, follow `typescript-engineer` for TypeScript/toolchain and this skill for React API usage.

---

## Quick Reference

### Project Setup

```bash
pnpm create vite@latest my-app --template react-ts
cd my-app && pnpm install
pnpm add @tanstack/react-query@latest zustand@latest react-hook-form@latest @hookform/resolvers@latest zod@latest react-router@latest dexie@latest dexie-react-hooks@latest
```

### Strict TypeScript Config

```json
{
  "compilerOptions": {
    "target": "ES2024",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "moduleResolution": "bundler"
  }
}
```

**Tooling baseline**: Use Biome + ESLint together. Biome handles formatting and baseline lint; ESLint handles type-aware rules.

---

## Critical Rules

### Component Architecture

| Rule | Description |
|------|-------------|
| Functional only | Components MUST be functional. Class components MUST NOT be used (except ErrorBoundary) |
| PascalCase files | Component files MUST use PascalCase: `UserProfile.tsx` |
| Interface props | Props MUST be typed with explicit TypeScript interfaces. `type` is allowed only for complex unions/utility-derived props where interfaces are awkward |
| One per file | One component per file SHOULD be default |

Example: see [Component Architecture](references/component-architecture.md).

### State Management Hierarchy

Use state in this order (simplest → complex):

1. **useState** — component-local state
2. **useReducer** — complex local state with actions
3. **Context API** — cross-cutting: auth, theme
4. **Zustand** — global client state

Example: see [State Management](references/state-management.md).

### Persistence Architecture (Mandatory)

Define storage layer and source of truth for each state explicitly:

| Layer | Source of truth | Store only |
|------|------------------|------------|
| URL state | URL (`path` + `search`) | Link-reproducible page state (filters, sort, page, view, search) |
| Runtime UI state | Zustand (in-memory) | Modal flags, temporary selections, control state, transient UI flags |
| Client persistence | Dexie (IndexedDB) | Drafts, wizard progress, local caches, dictionaries |
| Server business state | Server (via TanStack Query) | Primary business data; TanStack Query manages runtime lifecycle/cache |

**Non-negotiables**:
- If state must survive direct link open/reload and be reproducible, URL MUST be source of truth.
- Components, UI hooks, and Zustand stores MUST NOT perform direct HTTP calls for app data.
- Server reads/mutations MUST run through TanStack Query (`useQuery`, `useMutation`, `queryClient`) with `queryFn`/`mutationFn`.
- `queryKey` and Dexie `cacheKey` MUST be generated from centralized key factories with aligned semantics.
- For user/tenant-scoped data, both `queryKey` and `cacheKey` MUST include `tenantId` and `userId` when applicable.

### URL State Authority (Critical)

When a state value is represented in URL search params:
- URL param is the highest-priority source of truth.
- UI controls MUST update URL params, not independent local/global runtime state.
- Runtime state MUST derive from URL changes (including manual address bar edits/navigation).
- Canonicalize URL values (for example locale case normalization) before applying to runtime state.
- If URL param is missing/invalid, resolve a deterministic fallback and write it back to URL.

Avoid sync oscillation:
- Do not implement competing effects that blindly write both `URL -> state` and `state -> URL`.
- Every sync effect MUST have loop guards (`if same value -> return`) and explicit missing/invalid handling.

See [Persistence Architecture](references/persistence-architecture.md) for full rules.

### Data Fetching (TanStack Query)

Example: see [Data Fetching](references/data-fetching.md).

**Non-negotiables**:
- Components/pages MUST NOT call `fetch` directly for server API interactions.
- Zustand stores and UI hooks MUST NOT bypass TanStack Query for server reads/mutations.
- Keep explicit layering:
  - transport client (`http` wrapper, base URL, timeout, credentials),
  - API contract functions,
  - React Query adapters/options at feature layer,
  - UI hooks/components consuming Query.
- All external API requests in SPA flows MUST run via TanStack Query (`useQuery`/`useMutation`/`queryClient`).

**Current API expectations**:
- Object options syntax required: `useQuery({ queryKey, queryFn })`
- Use `gcTime` for inactive cache garbage collection
- Use `isPending` for initial-load pending states
- React to query data changes outside query options when the current API requires it
- Define explicit initial page params for infinite queries when required by the current API

### Cookie-based Auth SPA Baseline

For cookie-session auth SPAs, model auth explicitly:
- Separate states: `loading` (bootstrap), `guest`, `authenticated`, `error`.
- Do not collapse bootstrap network failures into `guest`; show recoverable error UI.
- Implement both:
  - reactive refresh (`401` -> single retry with refresh),
  - proactive refresh (timer-based background refresh for active sessions).
- Use single-flight coordination for refresh to avoid concurrent refresh storms.
- Keep API `baseUrl` in env config and enforce required vars at build/deploy pipeline level.

### Forms & Validation

Example: see [Forms & Validation](references/forms-validation.md).

**Critical Rules**:
- `defaultValues` MUST be set (prevents uncontrolled warnings)
- Server validation MUST NOT be skipped (security)
- Use `field.id` as key in `useFieldArray` (not index)

### Routing (React Router Data APIs)

Example: see [Routing](references/routing.md).

**Decisions**:
- `<Form>` → navigation with URL change
- `useFetcher` → mutations without URL change
- `loader` → data before render
- `useEffect` → client-only, user-interaction dependent
- Default to `Component` in route objects; use `element` only for inline composition/props
- Follow the current React Router package guidance; avoid mixing router packages unless the official docs require it
- For link-reproducible state, `URL search params` are source of truth; UI derives and writes back to URL

### Performance

**Key moves**:
- Eliminate request waterfalls first: start independent work early and await late
- Reduce initial bundle pressure: route-level `React.lazy`, direct imports, intent-based preload for likely next navigation
- Keep interactions responsive: use `startTransition` or `useDeferredValue` for expensive derived renders
- Use virtualization or `content-visibility: auto` for long lists and feed-like UIs
- Prefer Dexie for reload-safe client persistence; keep `localStorage` limited to tiny non-sensitive preferences or bootstrap hints when IndexedDB would be excessive
- Profile before memoization

See [Performance](references/performance.md) for the prioritized rulepack and examples.

### IndexedDB Persistence (Dexie)

For structured data, offline-first, and >5MB persistence use Dexie + IndexedDB.

**Critical Rules**:
- Use `Table<RowType, KeyType>` for type safety
- Never modify existing version — add new version for schema changes
- Export singleton `db` instance
- Use `useLiveQuery` for reactive UI updates
- Persist cache entries with metadata: `cacheKey`, `tenantId`/`userId`, `loadedAt`, payload
- Keep strict tenant/user isolation in keys and indexes
- Invalidate Dexie caches and TanStack Query caches together after related mutations
- On user/tenant switch or logout, clear scoped Dexie data + reset runtime state (`Zustand`, `queryClient`)

See [IndexedDB Persistence](references/indexeddb-persistence.md) for full patterns.

### Testing

**Rules of thumb**:
- `getByRole` first; `getByTestId` last
- Always use `userEvent.setup()` before render
- For async UI, use `findBy*` and `waitFor`
- For modal/dialog components with animation (for example shadcn `Dialog`), avoid brittle assertions on immediate unmount after close/submit; prefer stable assertions on state transitions (loading indicator removed, success/error content visible, trigger state restored).

**Interactive flow completion gate**:
- If a task implements or changes a material user-visible flow (for example auth, onboarding, checkout, profile editing, protected navigation, destructive confirmation, or a multi-step wizard), do not report delivered interactive SPA capability until the affected scenario has successful Playwright e2e coverage and has been exercised through real browser automation.
- Use the project's browser automation tool when one is specified (for example `agent-browser`); otherwise use Playwright/browser-driven manual walkthrough evidence.
- For minor interaction-only changes where e2e coverage would be disproportionate, state the narrower claim and verify with component/unit tests plus browser walkthrough evidence.
- Unit/component tests, route existence, screenshots, mocked happy-path render states, or static fixtures are not enough to claim end-to-end interactive SPA capability.
- Handoffs for interactive flow work must list the user scenarios tested, the e2e command/result or explicit narrowed-scope reason it was not run, and the browser walkthrough result.

**Parallel integration isolation rules**:
- Keep a deterministic local profile (for example single-worker integration) and a separate CI profile when parallelism is tuned.
- Isolate IndexedDB state per test run where feasible; always clear tables in `afterEach`.
- Always clear `localStorage`/`sessionStorage` in teardown.
- When using global mocks/stubs (`fetch`, `ResizeObserver`, etc.), restore/unstub them after each test.
- Add nightly shuffled/repeated integration checks before increasing CI workers again.

See [Testing](references/testing.md) for full setup and examples.

### Accessibility

**Checklist**:
- Provide accessible names (`aria-label`, `aria-labelledby`)
- Mark errors with `aria-invalid` + `role="alert"`
- Support keyboard navigation and focus management
- Prefer skeletons to spinners

See [Accessibility](references/accessibility.md) for patterns and examples.

---

## Anti-Patterns

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| `useQuery(['key'], fn)` | v4 syntax removed in v5 | `useQuery({ queryKey: ['key'], queryFn: fn })` |
| `create<T>(...)` in Zustand | Breaks TypeScript inference | `create<T>()(...)` with double parentheses |
| `onSuccess` in useQuery | Removed in v5 | Use `useEffect` to react to data |
| Index as key in arrays | Causes re-render bugs | Use stable `id` or `field.id` |
| No `defaultValues` in forms | Uncontrolled/controlled warnings | Always set `defaultValues` |
| Barrel imports | Bloats bundle | Import components directly |
| Manual memoization | Often unnecessary, adds complexity | Profile first; memoize only when proven |
| Class components | Legacy pattern | Use functional components |
| Modifying Dexie version | Breaks existing databases | Add new version instead |
| Multiple db instances | Conflicts, memory waste | Export singleton |
| useEffect for DB queries | Manual subscription needed | Use `useLiveQuery` |
| Keeping shareable page state only in Zustand | Lost on reload/direct link open | Store in URL search params and sync UI |
| UI control updates URL-backed state directly (without URL write) | URL and runtime diverge; back/forward/manual URL edits break behavior | Write URL param first; derive runtime state from URL |
| Bidirectional URL/state effects without equality guards | Oscillation/flicker loops, unstable UI | Add strict same-value guards and clear authority direction |
| Direct HTTP in components/stores/hooks | Bypasses server-state lifecycle and cache | Use TanStack Query (`queryFn`/`mutationFn`) |
| Query/cache keys without tenant/user context | Cross-user/tenant data leakage | Include `tenantId` and `userId` (when applicable) |
| Ad-hoc key composition | Inconsistent cache hits and invalidation | Use centralized key factories + canonicalized params |
| No cache cleanup on context switch | Stale data from previous account/tenant | Clear Dexie scope + reset Query cache + reset runtime UI state |

---

## Reference Files

Detailed patterns and examples:

- [Component Architecture](references/component-architecture.md) — Functional components, composition patterns
- [State Management](references/state-management.md) — Zustand, Context API, persistence guidance
- [Persistence Architecture](references/persistence-architecture.md) — URL/Zustand/Dexie/Query contracts, invalidation, context switches
- [Data Fetching](references/data-fetching.md) — TanStack Query patterns, caching, mutations
- [Forms & Validation](references/forms-validation.md) — React Hook Form, Zod schemas
- [Routing](references/routing.md) — React Router data APIs, loaders, protected routes
- [TypeScript Patterns](references/typescript-patterns.md) — Type-safe React development
- [Performance](references/performance.md) — Code splitting, optimization techniques
- [IndexedDB Persistence](references/indexeddb-persistence.md) — Dexie, useLiveQuery, offline-first
- [Testing](references/testing.md) — Vitest, React Testing Library, Playwright
- [Accessibility](references/accessibility.md) — ARIA, keyboard navigation, focus management

---

## Tool Grid

| Task | Tool | Command |
|------|------|---------|
| Build | Vite | `pnpm build` |
| Dev | Vite | `pnpm dev` |
| Lint | Biome | `biome check .` |
| Lint (ESLint) | ESLint | `eslint .` |
| Format | Biome | `biome format --write .` |
| Test | Vitest | `vitest` |
| E2E | Playwright | `playwright test` |
| Types | TypeScript | `tsc --noEmit` |

---

**Note**: This skill is for client-side React SPA development only. For SSR, RSC, or Next.js patterns, use dedicated framework skills.

## Workflow stages

### Workflow stage: Apply react-spa-engineer guidance

Apply the preserved react-spa-engineer guidance without changing its domain behavior.

1. Match the request to the applicability criteria.
2. Follow the preserved overview sections for the concrete work.
3. Read the smallest relevant active reference before using detailed guidance from it.
4. Run the relevant verification from the overview or report why it could not be run.

Validation:

- The outcome follows the preserved skill guidance and any loaded reference constraints.

## Required active references
- [Accessibility](references/accessibility.md) — Read this when you need patterns and examples.
- [Component Architecture](references/component-architecture.md) — Read this when you need Functional components, composition patterns.
- [Data Fetching](references/data-fetching.md) — Read this when you need TanStack Query patterns, caching, mutations.
- [Forms & Validation](references/forms-validation.md) — Read this when you need React Hook Form, Zod schemas.
- [IndexedDB Persistence](references/indexeddb-persistence.md) — Read this when you need full patterns.
- [Performance](references/performance.md) — Read this when you need the prioritized rulepack and examples.
- [Persistence Architecture](references/persistence-architecture.md) — Read this when you need full rules.
- [Routing](references/routing.md) — Read this when you need React Router data APIs, loaders, protected routes.
- [State Management](references/state-management.md) — Read this when you need Zustand, Context API, persistence guidance.
- [Testing](references/testing.md) — Read this when you need full setup and examples.
- [TypeScript Patterns](references/typescript-patterns.md) — Read this when you need Type-safe React development.

## Portability rules

- Do not reference machine-specific absolute paths or local files outside this skill folder.
- Keep all mandatory react-spa-engineer guidance inside this skill folder.
- Use relative links for local references, assets, scripts, tests, and supporting docs.

## Portability checklist before finishing

- Run the skill-source-compiler check command after regeneration.
- Search the skill folder for absolute local paths before finishing.
- Confirm every required reference listed by SKILL.md exists inside this skill folder.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
