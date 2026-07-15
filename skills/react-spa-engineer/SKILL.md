---
name: react-spa-engineer
description: Design, implement, review, and diagnose React SPAs using
  TypeScript, Vite, TanStack Query, Zustand, React Hook Form with Zod, React
  Router, and Dexie. Use for routing, server/runtime state, forms, browser
  storage, performance, testing, or accessibility; exclude SSR, RSC, and Next.js
  architecture.
compatibility: Portable documentation-only engineering skill. It ships no
  application runtime or test harness and requires repository evidence plus the
  installed stack versions to make project-specific decisions.
metadata:
  source-version: 0.1.9
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: b6d8746394c90a57ab120f882d26e3ac97a27c867a986bda7318f322ae06f555
---

# react-spa-engineer

## Start here

1. Classify the request as design/setup, implement, review, or diagnose; review and diagnose are read-only unless remediation is explicitly authorized.
2. Establish the observable SPA outcome, affected user flow, accepted product, API and security contracts, installed stack versions, existing project conventions, and available verification before choosing a change.
3. Apply precedence in this order: operator and repository instructions; accepted product, API and security contracts; manifest, lockfile, configuration and existing code; official documentation matching the installed major version; then examples in this skill. For greenfield work use current stable versions.
4. Stop as blocked when equal-authority sources conflict or a required backend, security, product, or compatibility decision has no owner-supplied answer. Do not invent the missing contract.
5. Load only the optional references triggered by the affected layers, then trace the flow across routing, API transport, TanStack Query, URL or Zustand state, forms, Dexie, and rendered UI as applicable.
6. Define claim-matched evidence before changing anything; files, configuration, generated routes, mocks, screenshots, typecheck, lint, build, or compiler success cannot prove a broader interactive or production capability by themselves.

## When to use this skill

- Designing or setting up an integrated client-side React SPA on the declared stack.
- Implementing or diagnosing a user flow that crosses routing, server state, forms, runtime state, browser persistence, performance, testing, or accessibility.
- Reviewing app-level SPA architecture or feature integration when an evidence-backed client result is required.

## When NOT to use this skill

- SSR, React Server Components, Next.js server patterns, or non-SPA architecture are the primary concern.
- The work is solely reusable component correctness without app-level integration; use react-components-engineer.
- The work is solely visual design, TypeScript language/tooling, test-runner behavior, formal code review, accessibility audit, or security review; route that primary decision to the owning skill.

## Overview

Build and assess integrated client-side React SPA flows on this fixed stack:

`React | TypeScript | Vite | TanStack Query | Zustand | React Hook Form + Zod | React Router | Dexie`

## Cross-layer ownership

| Concern | Owner in this skill's architecture |
| --- | --- |
| Navigation and link-reproducible state | React Router and the URL |
| Project HTTP, SSE, or WebSocket transport | `shared/api` |
| Server reads, mutations, retries, and runtime cache | TanStack Query |
| Component-local and cross-feature runtime UI state | React state, Context, then Zustand when justified |
| Form state and client validation | React Hook Form and Zod |
| Approved reload-safe drafts and local cache | Dexie |
| Business truth and authorization | The server contract, never browser state |

Use loaders to orchestrate or prefill TanStack Query where route timing matters. In
this fixed architecture, do not also use React Router actions or fetchers as a
second owner for project server IO. Keep transport under `shared/api`, and keep
all durable browser data allowlisted, scoped, TTL-bound, and non-authoritative.

## Capability and anti-claims

The skill succeeds when the requested design, implementation, review, or
diagnosis preserves one coherent contract across every affected layer and the
handoff is backed by evidence appropriate to the claimed behavior.

The skill documentation does not itself run an SPA, validate a backend, grant
authorization, prove accessibility, measure production performance, or establish
end-to-end behavior. Compiler checks, types, builds, generated files, mocks,
screenshots, routes, schemas, stores, and cache tables remain bounded evidence;
they cannot close a broader claim without exercising its real boundary.

## Reference example contract

- A **copyable** example states the relevant major version and follows the root
  ownership, error, security, accessibility, and evidence rules.
- A **conceptual** example is explicitly labeled and names the production
  obligations it omits.
- When the project version differs, the installed manifest and lockfile are the
  compatibility constraint; consult the matching official documentation rather
  than silently upgrading or pasting the example.

## Workflow stages

### Workflow stage: Establish the SPA basis

Make the mode, authority, user-visible claim, stack compatibility, side effects, and proof boundary explicit.

1. Inspect applicable repository instructions, accepted contracts, package manifest and lockfile, relevant app entrypoints and layer seams, installed versions, current behavior, and available verification.
2. Record mode, in-scope flow, allowed mutations, source precedence, unresolved inputs, and the observable outcome or review/diagnosis question.
3. For review or diagnosis, remain read-only; for design/setup or implementation, modify only the authorized scope and do not install dependencies, format broadly, or rewrite unrelated files without separate authority.

Validation:

- The next action does not depend on invented product, backend, security, version, or architecture facts.
- The requested claim has a named consumer and falsifiable completion evidence.

### Workflow stage: Trace and act on the end-to-end flow

Preserve one coherent contract across every affected client layer.

1. Map each value and side effect to its owner: React Router for navigation and URL state; shared/api for project transport; TanStack Query for server reads and mutations; local React or Zustand for runtime UI state; React Hook Form and Zod for forms; Dexie for approved durable client data.
2. Load the smallest matching references and route TypeScript, reusable component, design, testing, accessibility-review, formal-review, browser-execution, and security decisions to their owning skills while retaining SPA integration ownership.
3. Design, implement, review, or diagnose the smallest project-compatible change; keep React Router actions and fetchers outside project server IO in this skill's architecture even though React Router supports them.
4. Preserve backend authorization as a server responsibility; client route admission, cache keys, and hidden UI are not authorization controls.

Validation:

- No affected state, network request, mutation, persistent record, or user-visible transition has competing owners.
- Examples and changes conform to the installed major versions and accepted project contracts.

### Workflow stage: Verify and hand off the SPA result

Match the completion claim to observed evidence and leave the next consumer an actionable result.

1. Run the narrowest relevant checks and the stronger domain or browser boundary required by the claim; report unavailable checks as evidence limits.
2. Classify the result as completed, partial, or blocked. Completed requires the claim-matched evidence; implementation without that evidence is partial.
3. Report mode, observable outcome, changed or inspected surface, verification evidence, status, blockers or residual risks, anti-claims, and next owner.

Validation:

- Type, lint, build, mock, route, screenshot, and generated-file evidence is not presented as proof of unexercised interactive, persistence, performance, auth, security, or production behavior.
- The handoff does not require the consumer to invent a missing contract or reinterpret the result status.

## Interop priority

- **TypeScript language, compiler, tsconfig, module resolution, Biome and ESLint ownership:** typescript-engineer. react-spa-engineer owns React SPA integration; typescript-engineer owns language and toolchain correctness using repository and installed-version evidence.
- **TypeScript test strategy, Vitest or Playwright runner behavior, fixtures, mocks, determinism, and CI test contours:** typescript-test-engineer. react-spa-engineer defines the SPA behavior and evidence boundary; typescript-test-engineer owns test design and runner correctness.
- **reusable React component correctness across rendering contexts, portals, multiple instances, and component API boundaries:** react-components-engineer. react-components-engineer owns reusable component hardening; react-spa-engineer owns integration into routes, data, forms, state, and persistence.
- **visual hierarchy, interaction design, styling, responsive composition, and design-system presentation:** frontend-design. frontend-design owns visual decisions; react-spa-engineer preserves the SPA behavior and stack integration.
- **formal UX and accessibility review:** web-ui-reviewer. web-ui-reviewer owns the audit verdict; react-spa-engineer implements or integrates accepted client corrections.
- **formal code-review findings, severity, merge guidance, and review output:** code-reviewer. code-reviewer owns the formal verdict; react-spa-engineer supplies React SPA domain analysis and implements authorized remediation.
- **auth, CSRF, sensitive browser persistence, exploitability, and security verdicts:** security-reviewer. security-reviewer owns exploitability and security findings; react-spa-engineer owns only the client integration of accepted API and security contracts.
- **real browser navigation, interaction, screenshots, traces, and walkthrough execution:** Playwright or the available browser-automation skill. Browser tooling supplies execution evidence; react-spa-engineer defines which SPA scenario and boundary the evidence must cover.

## Gotchas

- **high** — A route, component, schema, store, cache table, mock, screenshot, build, or green test can be useful substrate without proving the claimed end-to-end user flow.
- **high** — Do not split project server reads or mutations between React Router actions/fetchers and TanStack Query; this skill assigns project server IO to TanStack Query and uses React Router for navigation, URL state, and loader-driven Query orchestration.
- **high** — Client route admission, hidden controls, tenant-scoped keys, and cleared caches improve UX or isolation but never replace server authorization.
- **high** — Do not apply a latest-version snippet to an existing project until its installed major version and migration authority are known.
- **medium** — Treat an example as copyable only when it states its version and satisfies the root ownership, error, security, accessibility, and evidence invariants; otherwise label it conceptual and name omitted obligations.

## Policies

### Fixed stack contract
Preserve React, TypeScript, Vite, TanStack Query, Zustand, React Hook Form with Zod, React Router, and Dexie. Do not introduce a competing framework or state, form, routing, query, or persistence library without an explicit operator decision.

### Example integrity
Copyable examples must match the stated major version and all active root invariants. Conceptual examples must be labeled and list the production obligations they omit.

### Evidence ladder
Typecheck, lint, and build prove only their technical contours; local UI behavior needs component tests and browser inspection; material flows need successful Playwright scenarios and browser automation; persistence needs reload, migration, TTL and context-switch evidence; performance needs production profiling; auth and security need the real backend boundary and the owning reviewer.

### Output contract
Report mode, observable outcome, changed or inspected surface, verification evidence, completed, partial or blocked status, blockers or residual risks, anti-claims, and the next owner.

## Optional references
- [Accessibility](references/accessibility.md) — Read this when implementing or assessing semantics, keyboard interaction, focus management, live announcements, dialogs, or custom composite widgets.
- [Component Architecture](references/component-architecture.md) — Read this when SPA feature layout, import boundaries, component ownership, composition, or public module entrypoints are in scope.
- [Data Fetching](references/data-fetching.md) — Read this when TanStack Query status, query keys, server reads, mutations, invalidation, retries, API transport, or recovery behavior is in scope.
- [Forms & Validation](references/forms-validation.md) — Read this when React Hook Form, Zod, editable payloads, field arrays, client validation, or server field-error mapping is in scope.
- [IndexedDB Persistence](references/indexeddb-persistence.md) — Read this when Dexie schema versions, migrations, durable records, realtime persistence, cache TTL, or user and tenant cleanup is in scope.
- [Performance](references/performance.md) — Read this only when production build output, profiling, request waterfalls, bundle splitting, interaction latency, rendering cost, or measured list performance is in scope.
- [Persistence Architecture](references/persistence-architecture.md) — Read this when one flow crosses URL state, Zustand, TanStack Query, and Dexie or needs an explicit source-of-truth and invalidation map.
- [Routing](references/routing.md) — Read this when React Router route objects, navigation, URL state, loaders, route admission, or error boundaries are in scope.
- [State Management](references/state-management.md) — Read this when choosing between local React state, Context, Zustand, URL state, TanStack Query, and Dexie for a concrete value.
- [Testing](references/testing.md) — Read this when defining Vitest, Testing Library, Playwright, browser walkthrough, integration, or end-to-end evidence for an SPA claim.
- [TypeScript Patterns](references/typescript-patterns.md) — Read this when React-specific TypeScript props, hooks, events, generics, refs, or runtime-schema typing is in scope; use typescript-engineer for language and toolchain ownership.

## Portability rules

- Do not reference machine-specific absolute paths or require files outside this skill folder to understand the portable contract.
- Treat repository layout, commands, installed versions, API contracts, and acceptance gates as discovered project context rather than portable constants.
- Keep mandatory workflow and evidence rules in SKILL.md; keep conditional stack detail in reachable local references.
- Keep docs and implementation logs non-normative even when they are copied for maintenance traceability.

## Portability checklist before finishing

- Run skill-source-compiler lint, regenerate, and check after source changes.
- Compile to an isolated output directory and confirm references, UI metadata, and supporting evidence remain reachable.
- Search active instructions and declared assets for absolute local dependencies.
- Confirm the copied skill remains useful without repository history, prior sessions, or the application it was designed against.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
- Supporting glob: `docs/logs/*`
