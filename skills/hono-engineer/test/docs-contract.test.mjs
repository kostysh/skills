import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const skillDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const readSkillFile = (relativePath) => readFile(path.join(skillDir, relativePath), 'utf8');

test('root contract requires authoritative inputs, current compatibility, and bounded output', async () => {
  const skill = await readSkillFile('SKILL.md');

  assert.match(skill, /authoritative behavior/);
  assert.match(skill, /installed Hono and runtime\/tooling versions/);
  assert.match(skill, /available test contours/);
  assert.match(skill, /explicitly blocked or guidance-only/);
  assert.match(skill, /delivered or proposed HTTP\/runtime behavior/);
  assert.match(skill, /blocked or unverified work/);
});

test('latest-oriented currency guidance is optional, reachable, and does not pin Hono', async () => {
  const [skill, currency] = await Promise.all([
    readSkillFile('SKILL.md'),
    readSkillFile('references/framework-currency.md'),
  ]);

  assert.match(skill, /latest official stable Hono guidance/);
  assert.match(skill, /installed project version as a compatibility constraint/);
  assert.match(skill, /## Optional references/);
  assert.match(skill, /\[Framework Currency\]\(references\/framework-currency\.md\)/);
  assert.doesNotMatch(skill, /## Required active references/);
  assert.match(currency, /Do not silently upgrade dependencies/);
  assert.match(currency, /https:\/\/hono\.dev\/docs/);
  assert.doesNotMatch(currency, /Hono 4\.12\.28/);
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
  assert.match(active, /Do not use `void` merely to silence a floating Promise/);
  assert.doesNotMatch(active, /(?:^|[^.])\bctx\.waitUntil\(/m);
  assert.doesNotMatch(active, /wrangler unstable_dev/);
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
  assert.match(pipelines, /They are not positions in the middleware chain/);
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

test('Hono csrf middleware and application token reissue remain distinct', async () => {
  const [skill, auth] = await Promise.all([
    readSkillFile('SKILL.md'),
    readSkillFile('references/auth.md'),
  ]);

  assert.match(skill, /built-in `csrf\(\)` checks Origin and Fetch Metadata/);
  assert.match(skill, /not a synchronizer-token or double-submit implementation/);
  assert.match(auth, /application behavior, not a feature supplied by Hono's built-in `csrf\(\)`/);
  assert.match(auth, /do not require the old CSRF token/);
  assert.match(auth, /Do not weaken the normal protected API guard/);
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

  assert.match(skill, /bound body reads before parsing/);
  assert.match(skill, /pre-auth and post-auth quotas isolated/);
  assert.match(skill, /revalidation or an accepted invalidation mechanism/);
  assert.match(auth, /owner or tenant gate semantics/);
  assert.match(rateLimiting, /invalid credentials, unknown tokens, or unauthenticated probes/);
});
