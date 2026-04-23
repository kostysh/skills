import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const skillDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const readSkillFile = (relativePath) => readFile(path.join(skillDir, relativePath), 'utf8');

test('early-use workflow exposes the bounded auth-admission checkpoint', async () => {
  const skill = await readSkillFile('SKILL.md');

  assert.match(skill, /auth-admission early checkpoint/);
  assert.match(skill, /protected route admission/);
  assert.match(skill, /pre-auth resource consumption/);
  assert.match(skill, /replay\/idempotency controls/);
  assert.match(skill, /bounded request-body handling/);
  assert.match(skill, /do not turn it into a generic security planning framework/);
});

test('api auth reference keeps the auth-admission checklist narrow and complete', async () => {
  const reference = await readSkillFile('references/api-auth-input.md');

  assert.match(reference, /## Auth-Admission Early Checklist/);
  assert.match(reference, /route trust boundary/);
  assert.match(reference, /pre-auth versus post-auth resource consumption/);
  assert.match(reference, /quota isolation/);
  assert.match(reference, /replay\/idempotency expectations/);
  assert.match(reference, /bounded body handling/);
  assert.match(reference, /Keep the checklist narrow/);
});

test('domain handoff keeps Hono-specific admission facts with HONO engineer', async () => {
  const reference = await readSkillFile('references/domain-handoffs.md');

  assert.match(reference, /route admission-boundary preservation/);
  assert.match(reference, /route-specific body limits/);
  assert.match(
    reference,
    /preserves the touched route's existing public\/user\/admin\/webhook\/service\/operator boundary/,
  );
});
