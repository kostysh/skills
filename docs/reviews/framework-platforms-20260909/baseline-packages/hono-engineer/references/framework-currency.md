# Framework Currency and Official Sources

Use this reference before a version-sensitive Hono, companion-package, adapter, or runtime decision.

## Latest-oriented decision rule

1. Inspect the project manifest and lockfile for the installed versions of `hono`, relevant `@hono/*` packages, the runtime adapter, and platform tooling such as Wrangler.
2. Check the current stable release and official documentation. Do not infer current APIs from this skill's prose or model memory.
3. Treat latest guidance as the recommendation baseline and installed versions as compatibility constraints. Do not silently upgrade dependencies, compatibility dates, flags, test runners, or deployment tooling.
4. If latest guidance and the installed project surface differ, use behavior supported by the installed version unless the request authorizes an upgrade. Report the delta and the evidence needed to migrate.
5. Stop or provide guidance-only output when the installed version cannot be established and the decision could change runtime behavior.

## Official source map

- Hono current package release: <https://www.npmjs.com/package/hono>
- Hono documentation: <https://hono.dev/docs>
- Hono migration notes: <https://github.com/honojs/hono/blob/main/docs/MIGRATION.md>
- Hono app and error hooks: <https://hono.dev/docs/api/hono>
- Hono Context and `executionCtx`: <https://hono.dev/docs/api/context>
- Hono middleware semantics: <https://hono.dev/docs/guides/middleware>
- Hono JWT and JWK middleware: <https://hono.dev/docs/middleware/builtin/jwt> and <https://hono.dev/docs/middleware/builtin/jwk>
- Hono CSRF middleware: <https://hono.dev/docs/middleware/builtin/csrf>
- Hono validation and RPC: <https://hono.dev/docs/guides/validation> and <https://hono.dev/docs/guides/rpc>
- Hono testing: <https://hono.dev/docs/guides/testing>
- Hono on Cloudflare Workers: <https://hono.dev/docs/getting-started/cloudflare-workers>
- Cloudflare Workers lifecycle and cache APIs: <https://developers.cloudflare.com/workers/runtime-apis/context/> and <https://developers.cloudflare.com/workers/runtime-apis/cache/>
- Cloudflare Workers Vitest integration: <https://developers.cloudflare.com/workers/testing/vitest-integration/>
- Cloudflare migration from `unstable_dev`: <https://developers.cloudflare.com/workers/testing/vitest-integration/migration-guides/migrate-from-unstable-dev/>
- Wrangler configuration, environments, and generated types: <https://developers.cloudflare.com/workers/wrangler/configuration/>, <https://developers.cloudflare.com/workers/wrangler/environments/>, and <https://developers.cloudflare.com/workers/languages/typescript/>
- Cloudflare Node.js compatibility: <https://developers.cloudflare.com/workers/runtime-apis/nodejs/>

Use other official runtime documentation when the project targets Node.js, Bun, Deno, Fastly, or another Hono adapter. External source links are live version authority, not files required for portability.
