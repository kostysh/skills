---
name: react-spa-engineer
description: |
  Comprehensive React SPA development expert for building production-ready single-page applications. Covers component architecture, state management (Zustand, Context), explicit persistence architecture (URL state, runtime UI state, Dexie/IndexedDB), data fetching (TanStack Query v5), forms (React Hook Form + Zod), routing (React Router v7), TypeScript patterns, performance optimization, testing (Vitest, RTL, Playwright), and accessibility.

  Use when building React SPAs, implementing features, reviewing code, setting up project architecture, or troubleshooting React client-side applications. Excludes SSR, RSC, Next.js server-side patterns.
---

# React SPA Engineer

Build production-ready React single-page applications with TypeScript, modern state management, and best practices.

**Stack**: React 18-19 | TypeScript 5+ | Vite | TanStack Query v5 | Zustand | React Hook Form + Zod | React Router v7 | Dexie (IndexedDB)

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
pnpm add @tanstack/react-query zustand react-hook-form @hookform/resolvers zod react-router dexie dexie-react-hooks
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

### Data Fetching (TanStack Query v5)

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

**v5 Breaking Changes**:
- Object syntax required: `useQuery({ queryKey, queryFn })`
- `cacheTime` → `gcTime`
- `isLoading` → `isPending` for initial load
- `onSuccess/onError` removed from queries (use `useEffect`)
- `initialPageParam` required for infinite queries

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

### Routing (React Router v7 Data Mode)

Example: see [Routing](references/routing.md).

**Decisions**:
- `<Form>` → navigation with URL change
- `useFetcher` → mutations without URL change
- `loader` → data before render
- `useEffect` → client-only, user-interaction dependent
- Default to `Component` in route objects; use `element` only for inline composition/props
- Use `react-router` for v7; `react-router-dom` is compatibility re-export
- For link-reproducible state, `URL search params` are source of truth; UI derives and writes back to URL

### Performance

**Key moves**:
- Code split with `React.lazy` + `<Suspense>`
- Avoid barrel imports; import directly
- Use `startTransition` for non-urgent updates
- Parallelize independent calls with `Promise.all`
- Profile before memoization

See [Performance](references/performance.md) for patterns and examples.

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
- For modal/dialog components with animation (for example Ant Design `Modal`), avoid brittle assertions on immediate unmount after close/submit; prefer stable assertions on state transitions (loading indicator removed, success/error content visible, trigger state restored).

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
- [Data Fetching](references/data-fetching.md) — TanStack Query v5 patterns, caching, mutations
- [Forms & Validation](references/forms-validation.md) — React Hook Form, Zod schemas
- [Routing](references/routing.md) — React Router v7, loaders, protected routes
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
