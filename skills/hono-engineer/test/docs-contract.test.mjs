import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const skillDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const readSkillFile = (relativePath) => readFile(path.join(skillDir, relativePath), 'utf8');

test('endpoint workflow exposes the auth-admission route checkpoint early', async () => {
  const skill = await readSkillFile('SKILL.md');

  assert.match(skill, /For auth-admission work/);
  assert.match(skill, /bound body reads before parsing/);
  assert.match(skill, /pre-auth and post-auth quota isolation/);
  assert.match(skill, /state replay behavior/);
  assert.match(skill, /preserve the touched route's admission boundary or owner-gate semantics/);
});

test('supporting references keep route-admission guidance bounded', async () => {
  const [auth, rateLimiting, perfSecurity] = await Promise.all([
    readSkillFile('references/auth.md'),
    readSkillFile('references/rate-limiting.md'),
    readSkillFile('references/perf-security.md'),
  ]);

  assert.match(
    auth,
    /preserve the touched route's current public, user, admin, webhook, service, or operator admission boundary/,
  );
  assert.match(auth, /owner or tenant gate semantics/);
  assert.match(rateLimiting, /quota isolation explicit/);
  assert.match(rateLimiting, /invalid credentials, unknown tokens, or unauthenticated probes/);
  assert.match(perfSecurity, /high-risk auth-admission routes/);
  assert.match(perfSecurity, /bounded body reads before untrusted `json\(\)`/);
});

test('cookie-session CSRF reissue and pending sessions are explicit contracts', async () => {
  const [skill, auth] = await Promise.all([readSkillFile('SKILL.md'), readSkillFile('references/auth.md')]);

  assert.match(skill, /CSRF reissue endpoints/);
  assert.match(skill, /valid httpOnly session cookie/);
  assert.match(skill, /no old CSRF token requirement/);
  assert.match(auth, /CSRF Reissue Endpoint Contract/);
  assert.match(auth, /rotate or replace the session-bound CSRF hash atomically/);
  assert.match(auth, /return only the new CSRF token/);
  assert.match(auth, /Pending\/onboarding sessions/);
  assert.match(auth, /Do not weaken the normal protected API guard/);
});

test('new route and client telemetry contracts are documented', async () => {
  const [skill, validation, observability] = await Promise.all([
    readSkillFile('SKILL.md'),
    readSkillFile('references/validation-openapi.md'),
    readSkillFile('references/observability.md'),
  ]);

  assert.match(skill, /New API routes must have Zod\/OpenAPI request and response schemas/);
  assert.match(validation, /New route contract checklist/);
  assert.match(validation, /route security metadata/);
  assert.match(validation, /pending\/onboarding/);
  assert.match(validation, /tests for valid input, invalid input, authorization\/admission failure, and response shape/);
  assert.match(observability, /project-owned API route/);
  assert.match(observability, /Do not add third-party RUM\/session replay as the default path/);
  assert.match(observability, /OTPs, CSRF tokens, bearer tokens, and raw identity payloads/);
});
