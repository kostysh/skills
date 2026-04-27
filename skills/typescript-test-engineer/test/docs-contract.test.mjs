import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const skillDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const readSkillFile = (relativePath) => readFile(path.join(skillDir, relativePath), 'utf8');

const negativeMatrixRows = [
  'duplicate request / repeated command',
  'concurrent request / parallel command',
  'state read failure',
  'state write failure',
  'completion conflict',
  'terminal replay / terminal overwrite attempt',
  'live running replay versus stale recovery',
  'external executor failure',
  'invalid, unknown or stale input',
  'partial evidence/state after failure',
  'retry after partial success',
];

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

test('quick workflow points state-changing changes to the negative matrix and N/A relevance notes', async () => {
  const skill = await readSkillFile('SKILL.md');

  assert.match(skill, /For side-effecting\/state-changing behavior/);
  assert.match(skill, /negative matrix/);
  assert.match(skill, /mark irrelevant rows `N\/A` with a reason/);
  assert.match(skill, /state-changing doubles without contract coverage/);
});

test('testing reference contains the complete state-changing negative matrix', async () => {
  const reference = await readSkillFile('references/testing.md');

  assert.match(reference, /## Side-effecting\/state-changing workflow negative matrix/);
  assert.match(reference, /not limited to database-backed code/);
  assert.match(reference, /Rows that do not apply should be marked `N\/A` with a short reason/);
  assert.match(reference, /Do not turn the matrix into a required test count/);

  for (const row of negativeMatrixRows) {
    assert.match(reference, new RegExp(row.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('anti-patterns require contract suites for production state-changing test doubles', async () => {
  const reference = await readSkillFile('references/testing-anti-patterns.md');

  assert.match(reference, /## Anti-Pattern 5: State-Changing Test Doubles Without Contract Tests/);
  assert.match(reference, /Run the suite against production and the double/);
  assert.match(reference, /It is not testing mock internals/);
  assert.match(reference, /allowed transitions/);
  assert.match(reference, /terminal states/);
  assert.match(reference, /conflict behavior/);
  assert.match(reference, /replay behavior/);
  assert.match(reference, /Simple value builders, static response objects, and pure stubs do not need a contract suite/);
});
