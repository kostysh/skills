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
