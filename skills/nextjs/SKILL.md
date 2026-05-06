---
name: nextjs
description: >-
  Build, review, and debug Next.js applications, especially App Router projects
  using React Server Components, Server Actions, Route Handlers, async request
  APIs, metadata, image/font optimization, bundling, hydration fixes, parallel
  routes, or self-hosting.


  Use for Next.js framework behavior and version-sensitive Next 15/16 patterns.
  Do not use as a generic React SPA or TypeScript skill when Next.js is not the
  main concern.
metadata:
  source-version: 0.1.0
  skillforge-source-manifest: skill.yaml
  skillforge-source-hash: 7e3561e705f12df462b56da2fc632494c072147ae920aa94c3003b09f7f13a55
---

# nextjs

## Start here

1. Confirm the task is about Next.js framework behavior, preferably an App Router project or migration.
2. Inspect local context before changing code: installed `next` version, App Router vs Pages Router, package manager, validation commands, and deployment target.
3. Load only the active reference files that match the current task; do not read every reference by default.
4. Preserve existing project conventions unless they conflict with Next.js behavior, version-specific migration rules, or the explicit request.
5. Run the narrowest meaningful verification such as `next build`, typecheck, lint, tests, or a browser smoke check; report any gap.

## When to use this skill

- Building, changing, reviewing, or troubleshooting Next.js applications.
- Working with App Router file conventions, React Server Components, Server Actions, Route Handlers, async request APIs, metadata, image/font optimization, scripts, bundling, hydration, parallel routes, or self-hosting.
- Migrating or reviewing version-sensitive Next.js 15/16 behavior such as async params/searchParams, async cookies/headers, proxy.ts, or Turbopack defaults.

## When NOT to use this skill

- The project is a generic React SPA without Next.js framework behavior; use react-spa-engineer.
- The task is purely TypeScript language or toolchain work; use typescript-engineer.
- The task is purely reusable React component correctness without Next.js boundaries; use react-components-engineer.
- The task is pure visual design with no Next.js-specific implementation concern; use frontend-design.
- The task is backend Node.js runtime behavior outside Next.js; use node-engineer.

## Overview

Apply this skill when building, changing, reviewing, or debugging Next.js code, especially App Router projects using React Server Components, Server Actions, Route Handlers, metadata, image/font optimization, or self-hosting.

This skill packages the upstream Vercel Next.js guidance into a portable local skill. Treat the guidance as framework-specific defaults, then verify version-sensitive behavior against the project's installed `next` version and local conventions.

## Core Operating Rules

- Inspect the project before changing it: identify `next` version, App Router vs Pages Router usage, TypeScript settings, package manager, existing validation commands, and deployment target.
- Default to App Router and React Server Component semantics when the project uses `app/`.
- Preserve existing project conventions unless they conflict with Next.js behavior, version-specific migration requirements, or the explicit user request.
- Keep server/client boundaries explicit. Add `'use client'` only where client-only hooks, browser APIs, or interactive state actually require it.
- Prefer Server Components for reads, Server Actions for mutations from app UI, and Route Handlers for external HTTP APIs, webhooks, or non-React clients.
- Use existing validation first: `next build`, typecheck, lint, unit tests, Playwright, or the repo's documented check. Report any check that cannot run.

## Reference Navigation

Load the smallest matching reference before applying detailed guidance:

- [file-conventions.md](references/file-conventions.md) - project structure, route segments, special files, route groups, parallel routes, intercepting routes, and v16 `proxy.ts`.
- [app-router-files.md](references/app-router-files.md) - compact App Router file conventions and example signatures.
- [rsc-boundaries.md](references/rsc-boundaries.md) - invalid async Client Components, non-serializable props, and Server Action exceptions.
- [async-patterns.md](references/async-patterns.md) - Next.js 15+ async `params`, `searchParams`, `cookies()`, and `headers()` APIs.
- [runtime-selection.md](references/runtime-selection.md) - Node.js vs Edge runtime selection.
- [directives.md](references/directives.md) - `'use client'`, `'use server'`, and `'use cache'`.
- [functions.md](references/functions.md) - navigation hooks, server functions, generate functions, and request/response helpers.
- [error-handling.md](references/error-handling.md) - `error.tsx`, `global-error.tsx`, `not-found.tsx`, redirects, auth errors, and `unstable_rethrow`.
- [data-patterns.md](references/data-patterns.md) - Server Components, Server Actions, Route Handlers, avoiding waterfalls, and client data fetching.
- [route-handlers.md](references/route-handlers.md) - `route.ts`, supported HTTP methods, `page.tsx` conflicts, and handler environment behavior.
- [metadata.md](references/metadata.md) - static/dynamic metadata, `generateMetadata`, OG images, file metadata, viewports, and sitemaps.
- [image.md](references/image.md) - `next/image`, remote patterns, responsive `sizes`, blur placeholders, priority loading, and static export.
- [font.md](references/font.md) - `next/font`, Google/local fonts, Tailwind integration, subsets, display strategy, and manual font-link mistakes.
- [bundling.md](references/bundling.md) - server-incompatible packages, CSS imports, polyfills, ESM/CJS issues, bundle analysis, and Turbopack migration.
- [scripts.md](references/scripts.md) - `next/script`, inline script IDs, loading strategies, and third-party scripts.
- [hydration-error.md](references/hydration-error.md) - hydration mismatch causes and fixes.
- [suspense-boundaries.md](references/suspense-boundaries.md) - CSR bailout boundaries for `useSearchParams` and `usePathname`.
- [parallel-routes.md](references/parallel-routes.md) - modal patterns with `@slot`, intercepting routes, `default.tsx`, and close behavior.
- [self-hosting.md](references/self-hosting.md) - standalone output, Docker, PM2, multi-instance ISR cache handlers, image optimization, env vars, and health checks.
- [debug-tricks.md](references/debug-tricks.md) - Next.js dev MCP endpoint and `--debug-build-paths`.

## Version-Sensitive Defaults

- Next.js 15+ treats `params`, `searchParams`, `cookies()`, and `headers()` as async. Do not apply older synchronous examples without checking the installed version.
- Next.js 16+ renames Middleware concepts toward `proxy.ts` / `proxy()`. Preserve `middleware.ts` only when the project version or migration state requires it.
- Turbopack is the default bundler in modern Next.js. Treat custom webpack configuration as project-specific and migrate only when the request or failing behavior requires it.
- Debugging features such as the dev MCP endpoint and `--debug-build-paths` are version and environment dependent. Check availability before relying on them.

## Anti-Patterns To Catch

- Adding `'use client'` to a large route tree to fix one hook usage.
- Passing functions, classes, Dates, Maps, Sets, or other non-serializable props from Server Components into Client Components.
- Creating Route Handlers for data that can be read directly in a Server Component.
- Using Server Actions as a general read API when passing server-rendered data or using a Route Handler is clearer.
- Mixing `page.tsx` and `route.ts` GET handlers in the same segment.
- Using native `<img>`, manual font `<link>` tags, or native `<script>` tags where `next/image`, `next/font`, or `next/script` is the framework-supported path.
- Assuming Vercel-managed behavior exists in self-hosted deployments without explicit cache, image, environment, or process setup.

## Workflow stages

### Workflow stage: Establish Next.js context

Ground the work in the project's actual Next.js version, router model, and deployment constraints.

1. Inspect package metadata, config, route tree, and existing commands before choosing a framework pattern.
2. Identify version-sensitive behavior that affects the change.
3. Choose the smallest relevant reference file for the specific area.

Validation:

- The selected approach matches the installed Next.js version or explicitly states a version assumption.
- The work is scoped to real Next.js behavior, not generic React or TypeScript guidance.

### Workflow stage: Apply the framework pattern

Make the requested change using Next.js primitives and boundaries that fit the route, runtime, and data flow.

1. Use the loaded reference guidance and local project conventions together.
2. Keep Server Component, Client Component, Server Action, Route Handler, and runtime boundaries explicit.
3. Prefer the least invasive framework-supported solution that satisfies the observable task.

Validation:

- The result avoids known Next.js anti-patterns for the touched area.
- Any substrate-only work such as config, docs, or wrappers is not described as completed runtime behavior unless verified.

### Workflow stage: Verify Next.js behavior

Prove the framework behavior with the narrowest available project check.

1. Run existing validation that exercises the changed route, build, type surface, or browser behavior.
2. For build/runtime issues, prefer `next build` or the repo's production-equivalent command when feasible.
3. If validation cannot run, perform the next-best static check and report the limitation.

Validation:

- The final report names the checks that passed or the exact verification gap.

## Interop priority

- **TypeScript language, tsconfig, linting, and type-system issues:** typescript-engineer. This skill owns Next.js framework semantics; TypeScript language/toolchain rules belong to typescript-engineer.
- **reusable React component correctness, SSR-safe rendering, portals, and component API hardening:** react-components-engineer. Use this skill for Next.js boundaries and App Router usage, but let react-components-engineer own reusable component behavior.
- **generic client-side React SPA architecture:** react-spa-engineer. Use react-spa-engineer when Next.js server routing, RSC, and framework APIs are not central.
- **visual design, UI hierarchy, and frontend presentation polish:** frontend-design. Use frontend-design for visual direction while this skill owns Next.js implementation constraints.
- **general Node.js runtime behavior outside Next.js:** node-engineer. Use this skill for Next.js runtime selection and deployment-specific framework behavior; use node-engineer for broader Node runtime work.

## Gotchas

- **high** — Next.js APIs are version-sensitive; verify installed `next` before applying async params/searchParams, async cookies/headers, proxy.ts, Turbopack, or debug-MCP guidance.
- **high** — Do not add 'use client' at a broad route/layout level to fix a narrow hook or browser API need; isolate the smallest Client Component.
- **high** — Server-to-client props must be serializable except for documented Server Action cases.
- **high** — A route segment cannot expose a GET Route Handler and a page for the same path without a real conflict; separate UI routes from API routes.
- **medium** — Self-hosting is not equivalent to Vercel hosting unless cache handlers, image optimization, runtime env behavior, and process management are explicitly configured.
- **medium** — Prefer next/image, next/font, and next/script over native tags when the framework component addresses the use case.

## Policies

### App Router first policy
Prefer App Router and React Server Component semantics when the project uses `app/`; do not import Pages Router assumptions unless the project still uses `pages/`.

### Version-aware policy
Treat Next.js version-specific guidance as conditional until the installed `next` version or migration target is known.

### Boundary integrity policy
Keep server/client/runtime/data boundaries explicit and local; broad boundary changes require a concrete behavioral reason.

### Evidence policy
Completion requires a concrete check such as build, typecheck, lint, test, or browser verification, or an explicit report of why no meaningful check could run.

### Active normative surface
`SKILL.md` and the referenced files listed in this source bundle are the active default instruction surface; docs/* remains supporting unless explicitly promoted.

## Required active references
- [App Router Files](references/app-router-files.md) — Read this when you need compact App Router file conventions and example route signatures.
- [Async Patterns](references/async-patterns.md) — Read this when handling Next.js 15+ async params, searchParams, cookies(), or headers().
- [Bundling](references/bundling.md) — Read this when debugging server-incompatible packages, CSS imports, ESM/CJS issues, bundle analysis, or Turbopack migration.
- [Data Patterns](references/data-patterns.md) — Read this when choosing between Server Components, Server Actions, Route Handlers, or client data fetching.
- [Debug Tricks](references/debug-tricks.md) — Read this when using Next.js development MCP debugging or debug build paths.
- [Directives](references/directives.md) — Read this when applying 'use client', 'use server', or 'use cache'.
- [Error Handling](references/error-handling.md) — Read this when implementing Next.js error boundaries, redirects, not-found behavior, or auth errors.
- [File Conventions](references/file-conventions.md) — Read this when working with project structure, special files, route segments, route groups, parallel routes, intercepting routes, or proxy/middleware files.
- [Font Optimization](references/font.md) — Read this when configuring next/font, Google fonts, local fonts, Tailwind font variables, subsets, or display behavior.
- [Functions](references/functions.md) — Read this when using navigation hooks, server functions, generate functions, or Next request/response helpers.
- [Hydration Errors](references/hydration-error.md) — Read this when diagnosing hydration mismatch errors.
- [Image Optimization](references/image.md) — Read this when using next/image, remote image patterns, responsive sizes, blur placeholders, priority loading, or static export.
- [Metadata](references/metadata.md) — Read this when implementing metadata, generateMetadata, viewport, OG images, sitemaps, or file-based metadata.
- [Parallel and Intercepting Routes](references/parallel-routes.md) — Read this when implementing modal routes, @slot folders, intercepting routes, default.tsx fallbacks, or close behavior.
- [Route Handlers](references/route-handlers.md) — Read this when implementing route.ts handlers, supported methods, dynamic handlers, request helpers, or page.tsx conflicts.
- [RSC Boundaries](references/rsc-boundaries.md) — Read this when checking React Server Component boundaries, async Client Components, serializable props, or Server Action exceptions.
- [Runtime Selection](references/runtime-selection.md) — Read this when choosing Node.js or Edge runtime for Next.js code.
- [Scripts](references/scripts.md) — Read this when adding next/script, inline scripts, loading strategies, or third-party scripts.
- [Self Hosting](references/self-hosting.md) — Read this when deploying Next.js outside Vercel, using standalone output, Docker, PM2, custom cache handlers, or runtime env config.
- [Suspense Boundaries](references/suspense-boundaries.md) — Read this when useSearchParams, usePathname, or client-only hooks cause CSR bailouts that need Suspense boundaries.

## Portability rules

- Do not reference machine-specific absolute paths or local files outside this skill folder.
- Keep all mandatory Next.js guidance inside this skill folder.
- Use relative links for local references, assets, scripts, tests, and supporting docs.
- Treat external Next.js documentation links as optional verification context, not required local dependencies.

## Portability checklist before finishing

- Run the skill-source-compiler lint and check commands after regeneration.
- Search the skill folder for absolute local paths before finishing.
- Confirm every required reference listed by SKILL.md exists inside this skill folder.
- Confirm generated links point to local `references/*` files or clearly optional external docs.

## Supporting and historical surface

- `docs/*` and `docs/issues/*` are non-normative unless explicitly promoted by this file.
- Supporting glob: `docs/*`
- Supporting glob: `docs/logs/*`
