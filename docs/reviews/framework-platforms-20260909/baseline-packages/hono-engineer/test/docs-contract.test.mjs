import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const skillDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const readSkillFile = (relativePath) => readFile(path.join(skillDir, relativePath), 'utf8');
const readOptionalSkillFile = async (relativePath) => {
  try {
    return await readSkillFile(relativePath);
  } catch (error) {
    if (error?.code === 'ENOENT') return '';
    throw error;
  }
};

test('root contract requires authoritative inputs, current compatibility, and bounded output', async () => {
  const skill = await readSkillFile('SKILL.md');

  assert.match(skill, /authoritative behavior/);
  assert.match(skill, /installed Hono and runtime\/tooling versions/);
  assert.match(skill, /available test contours/);
  assert.match(skill, /explicitly blocked or guidance-only/);
  assert.match(skill, /delivered or proposed HTTP\/runtime behavior/);
  assert.match(skill, /blocked or unverified work/);
});

test('latest-oriented currency guidance is optional, reachable, and active/package surfaces do not pin Hono', async () => {
  const [skill, currency, uiMetadata, packageJson, sourceManifest, overviewSource] =
    await Promise.all([
      readSkillFile('SKILL.md'),
      readSkillFile('references/framework-currency.md'),
      readSkillFile('agents/openai.yaml'),
      readSkillFile('package.json'),
      readOptionalSkillFile('skill.yaml'),
      readOptionalSkillFile('fragments/overview.md'),
    ]);

  assert.match(skill, /latest official stable Hono guidance/);
  assert.match(skill, /installed project version as a compatibility constraint/);
  assert.match(skill, /## Optional references/);
  assert.match(skill, /\[Framework Currency\]\(references\/framework-currency\.md\)/);
  assert.doesNotMatch(skill, /## Required active references/);
  assert.match(currency, /Do not silently upgrade dependencies/);
  assert.match(currency, /https:\/\/hono\.dev\/docs/);
  const referenceNames = await readdir(path.join(skillDir, 'references'));
  const active = [
    skill,
    uiMetadata,
    packageJson,
    sourceManifest,
    overviewSource,
    ...(await Promise.all(referenceNames.map((name) => readSkillFile(`references/${name}`)))),
  ].join('\n');
  assert.doesNotMatch(active, /\bHono(?:@|\s+v?)[~^]?\d+\.\d+\.\d+\b/i);
  assert.doesNotMatch(active, /["']hono["']\s*:\s*["'][~^]?\d+\.\d+\.\d+/i);
});

test('optional references inherit root precedence and cannot create foreign policy', async () => {
  const skill = await readSkillFile('SKILL.md');

  assert.match(skill, /optional references as conditional integration guidance/i);
  assert.match(
    skill,
    /cannot establish a new architecture, security, data, error, logging, or operational policy/i,
  );
  assert.match(skill, /accepted project contract or the owning skill/i);
  assert.match(skill, /use an explicitly named owner-supplied placeholder or stop for authority/i);
  assert.match(skill, /success or failure status, headers, media type, body, schema stack/i);
  assert.match(skill, /an assumption or greenfield label does not grant authority/i);
  assert.match(
    skill,
    /show only the source-supplied composition primitives; do not add illustrative route methods, mounts, exports, or handlers/i,
  );
  assert.doesNotMatch(skill, /then this skill's greenfield defaults/);
});

test('Workers guidance uses current Hono execution context and bounded delivery claims', async () => {
  const [skill, workers, pipelines] = await Promise.all([
    readSkillFile('SKILL.md'),
    readSkillFile('references/workers-platform.md'),
    readSkillFile('references/pipelines.md'),
  ]);
  const active = `${skill}\n${workers}\n${pipelines}`;

  assert.match(active, /c\.executionCtx\.waitUntil\(promise\)/);
  assert.match(active, /not durable delivery/i);
  assert.match(workers, /at most 30 seconds after the response or disconnect/);
  assert.match(workers, /unsettled Promises are canceled/);
  assert.match(active, /Do not use `void` merely to silence a floating Promise/);
  assert.doesNotMatch(active, /(?:^|[^.])\bctx\.waitUntil\(/m);
  assert.doesNotMatch(active, /wrangler unstable_dev/);
});

test('scoped Context variables do not rely on unsafe global augmentation', async () => {
  const typing = await readSkillFile('references/typing.md');

  assert.match(
    typing,
    /Use `ContextVariableMap` only when the setter middleware is guaranteed to run app-wide before every consumer/,
  );
  assert.match(typing, /including routes where the setter did not run/);
  assert.match(typing, /hide `undefined` at runtime/);
  assert.match(typing, /createMiddleware<ProjectScopedEnv>/);
  assert.match(typing, /owner-supplied whole-boundary placeholders/);
  assert.match(typing, /does not choose a new app, router, mount, path, or handler layout/);
  assert.doesNotMatch(typing, /^\s*(?:const app = new Hono|app\.(?:use|get|post|route)\()/m);
});

test('middleware hooks are separate from the canonical chain', async () => {
  const [skill, pipelines] = await Promise.all([
    readSkillFile('SKILL.md'),
    readSkillFile('references/pipelines.md'),
  ]);

  assert.match(
    skill,
    /register `app\.onError\(\)` and `notFound\(\)` as hooks, not middleware positions/,
  );
  assert.match(pipelines, /not positions in the middleware chain/);
  assert.doesNotMatch(pipelines, /^\d+\. error handling \(app\.onError\)/m);
});

test('response runtime validation is not conflated with contract tests or static typing', async () => {
  const [skill, validation] = await Promise.all([
    readSkillFile('SKILL.md'),
    readSkillFile('references/validation-openapi.md'),
  ]);

  assert.match(skill, /Contract tests validate only exercised responses/);
  assert.match(validation, /Runtime response validation/);
  assert.match(validation, /Contract-test coverage/);
  assert.match(validation, /Static typing only/);
  assert.match(validation, /Do not say "all responses are validated"/);
  assert.doesNotMatch(validation, /Contract tests.*runtime guarantees/i);
});

test('request validation documents missing Content-Type semantics and explicit rejection', async () => {
  const validation = await readSkillFile('references/validation-openapi.md');

  assert.match(validation, /missing or incompatible `Content-Type`/);
  assert.match(validation, /validator callback receives `\{\}`/);
  assert.match(validation, /Explicitly reject that value/);
  assert.match(validation, /do not rely on an automatic parse failure/);
  assert.match(validation, /do not infer `400`, `415`, text, or a JSON envelope/);
  assert.match(validation, /projectValidationFailure\(c\)/);
  assert.match(
    validation,
    /defines no route, schema library, status, media type, or response body/,
  );
  assert.doesNotMatch(validation, /return c\.text\('Invalid', 400\)/);
});

test('contract publication preserves OpenAPI, Hono RPC, and internal route choices', async () => {
  const [skill, validation, contracts] = await Promise.all([
    readSkillFile('SKILL.md'),
    readSkillFile('references/validation-openapi.md'),
    readSkillFile('references/contracts-types.md'),
  ]);

  assert.match(skill, /use OpenAPI when an external or project contract requires it/);
  assert.match(skill, /use Hono RPC\/type exports when that is the project boundary/);
  assert.match(validation, /Do not require Zod, OpenAPI, and Hono RPC simultaneously/);
  assert.match(contracts, /export the type of a chained route\/app result/);
  assert.doesNotMatch(skill, /New API routes must have Zod\/OpenAPI request and response schemas/);
});

test('RPC guidance covers global responses and strict TypeScript compatibility', async () => {
  const contracts = await readSkillFile('references/contracts-types.md');

  assert.match(contracts, /require `strict: true`/);
  assert.match(
    contracts,
    /does not automatically infer responses produced by global `app\.onError\(\)` handlers or global middleware/,
  );
  assert.match(contracts, /`ApplyGlobalResponse`/);
  assert.match(contracts, /import type \{ ApplyGlobalResponse \} from 'hono\/client'/);
  assert.match(contracts, /Record<\s*ProjectGlobalStatus,\s*\{ json: ProjectGlobalBody \}/);
  assert.match(contracts, /status-keyed response map/);
  assert.doesNotMatch(contracts, /from 'hono\/types'/);
  assert.match(contracts, /static RPC typing does not prove runtime conformance/);
});

test('Hono csrf middleware and application token reissue remain distinct', async () => {
  const [skill, auth] = await Promise.all([
    readSkillFile('SKILL.md'),
    readSkillFile('references/auth.md'),
  ]);

  assert.match(
    skill,
    /built-in `csrf\(\)` allows a request when either its Origin check or Fetch Metadata check passes/,
  );
  assert.match(auth, /allows the request when either validation passes/);
  assert.match(skill, /not a synchronizer-token or double-submit implementation/);
  assert.match(auth, /application behavior, not a feature supplied by Hono's built-in `csrf\(\)`/);
  assert.match(auth, /Obtain the accepted cookie, origin, old-token, rotation, response/);
  assert.match(auth, /Do not derive those decisions from Hono's built-in middleware/);
  assert.match(auth, /without weakening the normal protected API guard/);
});

test('JWT and JWK examples constrain algorithms without blanket kid guidance', async () => {
  const auth = await readSkillFile('references/auth.md');

  assert.match(auth, /const projectJwtMiddleware = jwt\(\{/);
  assert.match(auth, /\.\.\.ownerSuppliedHonoJwtOptions/);
  assert.match(auth, /alg: acceptedJwtAlgorithm/);
  assert.match(auth, /\.\.\.ownerSuppliedHonoJwkOptions/);
  assert.match(auth, /alg: acceptedJwkAlgorithms/);
  assert.match(auth, /issuer\/audience\/time-claim verification, credential transport/);
  assert.match(auth, /Symmetric `jwt\(\)` does not require `kid`/);
  assert.match(auth, /current `jwk\(\)` requires a `kid` header/);
  assert.doesNotMatch(auth, /HS256|RS256/);
  assert.doesNotMatch(auth, /JWT.*must include.*`kid`/i);
  assert.doesNotMatch(auth, /\bapp\.(?:use|get|post|route)\(/);
  assert.match(auth, /Do not export it or create a new module\/public boundary/);
  assert.doesNotMatch(auth, /^export const project(?:Jwt|Jwk)Middleware/m);
});

test('cross-domain defaults remain project-owned or explicitly illustrative', async () => {
  const [architecture, errors, observability, perf, pipelines, rateLimit, security, supabase] =
    await Promise.all([
      readSkillFile('references/architecture.md'),
      readSkillFile('references/errors-logs.md'),
      readSkillFile('references/observability.md'),
      readSkillFile('references/perf-security.md'),
      readSkillFile('references/pipelines.md'),
      readSkillFile('references/rate-limiting.md'),
      readSkillFile('references/security.md'),
      readSkillFile('references/supabase.md'),
    ]);

  assert.match(architecture, /does not require `routes\/services\/domain\/infra` layering/);
  assert.match(errors, /Preserve the project error contract/);
  assert.match(observability, /Preserve the accepted logging schema and transport/);
  assert.match(perf, /Hono does not require these mechanisms/);
  assert.match(pipelines, /Hono ordering consequences after a concern is selected/);
  assert.match(pipelines, /Do not synthesize a complete pipeline from this table/);
  assert.match(rateLimit, /Preserve the project-owned quota model/);
  assert.match(security, /`security-reviewer` or the project security\/platform owner decides/);
  assert.match(supabase, /Use `supabase-engineer` to establish/);

  const active = [
    architecture,
    errors,
    observability,
    perf,
    pipelines,
    rateLimit,
    security,
    supabase,
  ].join('\n');
  assert.doesNotMatch(active, /Always return `application\/problem\+json`/);
  assert.doesNotMatch(active, /Structured JSON logs only/);
  assert.doesNotMatch(active, /`secureHeaders` always on/);
  assert.doesNotMatch(active, /Return 429 with Problem Details/);
  assert.doesNotMatch(
    active,
    /maxRequestBodySize: 1024|30_000|OpenAPIHono|swaggerUI|src\/contracts\/v1|Unexpected error/,
  );
});

test('active examples contain framework facts or owner placeholders, not project defaults', async () => {
  const [validation, contracts, perf, pipelines, wrangler] = await Promise.all([
    readSkillFile('references/validation-openapi.md'),
    readSkillFile('references/contracts-types.md'),
    readSkillFile('references/perf-security.md'),
    readSkillFile('references/pipelines.md'),
    readSkillFile('references/wrangler.md'),
  ]);
  const active = [validation, contracts, perf, pipelines, wrangler].join('\n');

  for (const pattern of [
    /@hono\/zod-openapi/,
    /@hono\/swagger-ui/,
    /outputValidator/,
    /status = 200/,
    /src\/contracts\/v1/,
    /maxRequestBodySize: 1024/,
    /30_000/,
    /Prefer `wrangler\.jsonc`/,
    /limits\.cpu_ms/,
    /Enable structured `observability`/,
  ]) {
    assert.doesNotMatch(active, pattern);
  }
  assert.match(contracts, /owner-supplied aliases/);
  assert.match(wrangler, /project observability owner selects/);
  assert.match(validation, /placeholder must cover the complete unresolved boundary/i);
  assert.match(validation, /do not show `c\.json\(\)`, `c\.text\(\)`, `c\.body\(\)`/);
  assert.match(validation, /delegate the whole boundary to an opaque owner-supplied handler/);
  assert.match(validation, /Do not show even opaque handler\/router wiring/);
  assert.match(validation, /choosing `app\.route\(\)`, a mount path, or chained route layout/);
  assert.match(validation, /only after the accepted contract has selected the `json` request part/);
});

test('Workers environment, compatibility, and Cache API caveats are explicit', async () => {
  const [wrangler, caching] = await Promise.all([
    readSkillFile('references/wrangler.md'),
    readSkillFile('references/caching.md'),
  ]);

  assert.match(wrangler, /Bindings, variables, and secrets are non-inheritable/);
  assert.match(wrangler, /import-only stubs whose methods fail at runtime/);
  assert.match(wrangler, /verify the exact calls in a Workers runtime test/);
  assert.match(caching, /responses with `Set-Cookie` are not cached/);
  assert.match(caching, /either delete `Set-Cookie` or set `Cache-Control: private=Set-Cookie`/);
});

test('interop routes specialized decisions to producible owners', async () => {
  const skill = await readSkillFile('SKILL.md');

  for (const owner of [
    'implementation-discipline',
    'typescript-engineer',
    'typescript-test-engineer',
    'node-engineer',
    'security-reviewer',
    'supabase-engineer',
    'architecture-engineer',
  ]) {
    assert.match(skill, new RegExp(owner));
  }
  assert.match(skill, /does not issue a security audit verdict/);
  assert.match(
    skill,
    /Supabase correctness and direct data-path evidence belong to supabase-engineer/,
  );
});

test('structural tests and schema presence cannot close production readiness', async () => {
  const [skill, packageJson] = await Promise.all([
    readSkillFile('SKILL.md'),
    readSkillFile('package.json'),
  ]);

  assert.match(skill, /docs-contract test exists/);
  assert.match(skill, /not described as production-runtime proof/);
  assert.match(skill, /does not ship a Hono runtime/);
  assert.match(packageJson, /Docs-contract tests for the HONO engineer skill/);
});

test('prior auth-admission and protected-lifecycle guardrails remain reachable', async () => {
  const [skill, auth, rateLimiting] = await Promise.all([
    readSkillFile('SKILL.md'),
    readSkillFile('references/auth.md'),
    readSkillFile('references/rate-limiting.md'),
  ]);

  assert.match(skill, /apply that owner-supplied limit before parsing/);
  assert.match(skill, /preserve accepted quota isolation/);
  assert.match(skill, /contract's revalidation\/invalidation/);
  assert.match(auth, /owner or tenant gate semantics/);
  assert.match(rateLimiting, /invalid credentials, unknown tokens, or unauthenticated probes/);
});
