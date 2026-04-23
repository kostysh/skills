import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const skillDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const readSkillFile = (relativePath) => readFile(path.join(skillDir, relativePath), 'utf8');

test('quick workflow requires replay and rate-limit tests to prove the named risk', async () => {
  const skill = await readSkillFile('SKILL.md');

  assert.match(skill, /For replay\/rate-limit regression tests/);
  assert.match(skill, /name the targeted risk or failure mode/);
  assert.match(skill, /exercised scenario or assertions prove that exact risk/);
  assert.match(skill, /a prose label alone is not coverage/);
});

test('testing reference rejects near-miss replay and rate-limit coverage', async () => {
  const reference = await readSkillFile('references/testing.md');

  assert.match(reference, /## Replay and rate-limit regression tests/);
  assert.match(reference, /replay, idempotency, quota, or rate-limit fixes/);
  assert.match(reference, /name the targeted risk or failure mode/);
  assert.match(reference, /do not count a test name, comment, or nearby behavior as coverage/);
  assert.match(reference, /quota-isolation test/);
  assert.match(reference, /renaming a generic 429 test/);
});
