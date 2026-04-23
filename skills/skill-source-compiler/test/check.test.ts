import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

import { checkCompiledSkill } from '../src/check.ts';
import { regenerateSourceBundle } from '../src/compiler.ts';

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const fixtureRoot = join(TEST_DIR, '..');

void test('checkCompiledSkill rejects invalid folders', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'skillforge-check-'));
  try {
    await writeFile(join(tempRoot, 'SKILL.md'), '# missing frontmatter\n', 'utf8');

    const result = await checkCompiledSkill(tempRoot);
    assert.equal(result.ok, false);
    assert.ok(result.diagnostics.some((entry) => entry.code === 'missing-frontmatter'));
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('checkCompiledSkill checks source bundles without scanning unrelated dev files', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'skillforge-check-source-'));
  const sourceRoot = join(tempRoot, 'skill-source-compiler');

  try {
    await cp(fixtureRoot, sourceRoot, { recursive: true });
    await regenerateSourceBundle(sourceRoot);
    await mkdir(join(sourceRoot, 'node_modules/.bin'), { recursive: true });
    await writeFile(
      join(sourceRoot, 'node_modules/.bin/tsc'),
      'export NODE_PATH="/home/example/node_modules"\n',
      'utf8',
    );

    const result = await checkCompiledSkill(sourceRoot);
    assert.equal(result.ok, true, result.diagnostics.map((entry) => entry.message).join('\n'));
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('checkCompiledSkill reports source bundle generated output drift', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'skillforge-check-source-drift-'));
  const sourceRoot = join(tempRoot, 'skill-source-compiler');

  try {
    await cp(fixtureRoot, sourceRoot, { recursive: true });
    await regenerateSourceBundle(sourceRoot);
    const originalSkill = await readFile(join(sourceRoot, 'SKILL.md'), 'utf8');
    await writeFile(join(sourceRoot, 'SKILL.md'), `${originalSkill}\n<!-- drift -->\n`, 'utf8');

    const result = await checkCompiledSkill(sourceRoot);
    assert.equal(result.ok, false);
    assert.ok(result.diagnostics.some((entry) => entry.code === 'generated-skill-drift'));
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});
