---
name: react-spa-engineer
description: |
  Comprehensive React SPA development expert for building production-ready single-page applications. Covers component architecture, state management (Zustand, Context), data fetching (TanStack Query v5), forms (React Hook Form + Zod), routing (React Router v7), TypeScript patterns, performance optimization, client-side persistence (IndexedDB/Dexie), testing (Vitest, RTL, Playwright), and accessibility.

  Use when building React SPAs, implementing features, reviewing code, setting up project architecture, or troubleshooting React client-side applications. Excludes SSR, RSC, Next.js server-side patterns.
license: MIT
metadata:
  author: synthesized
  version: "1.0.0"
  sources: "vercel-react-best-practices, tanstack-query-skill, zustand-state-management, react-hook-form-zod, react-workflow, react-router-v7, mastering-typescript"
---

# React SPA Engineer

Build production-ready React single-page applications with TypeScript, modern state management, and best practices.

**Stack**: React 18-19 | TypeScript 5+ | Vite | TanStack Query v5 | Zustand | React Hook Form + Zod | React Router v7 | Dexie (IndexedDB)

## Skill Interop (Priority)

- Use `typescript-engineer` as the baseline for TypeScript language/toolchain rules (tsconfig, linting, @ts-expect-error policy, unsafe assertions).
- Use this skill for React-specific patterns (hooks typing, JSX, React Router, TanStack Query, RHF, Dexie).
- If rules conflict, follow `typescript-engineer` for TypeScript/toolchain and this skill for React API usage.
- If the user needs algorithmic visuals or generative art assets for the UI, use the `algorithmic-art` skill.

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

### Data Fetching (TanStack Query v5)

Example: see [Data Fetching](references/data-fetching.md).

**v5 Breaking Changes**:
- Object syntax required: `useQuery({ queryKey, queryFn })`
- `cacheTime` → `gcTime`
- `isLoading` → `isPending` for initial load
- `onSuccess/onError` removed from queries (use `useEffect`)
- `initialPageParam` required for infinite queries

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

See [IndexedDB Persistence](references/indexeddb-persistence.md) for full patterns.

### Testing

**Rules of thumb**:
- `getByRole` first; `getByTestId` last
- Always use `userEvent.setup()` before render
- For async UI, use `findBy*` and `waitFor`

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

---

## Reference Files

Detailed patterns and examples:

- [Component Architecture](references/component-architecture.md) — Functional components, composition patterns
- [State Management](references/state-management.md) — Zustand, Context API, persistence guidance
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
