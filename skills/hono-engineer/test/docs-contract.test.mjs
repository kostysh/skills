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
