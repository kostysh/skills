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

const noReferenceManifest = (name = 'simple-skill'): string => `apiVersion: skillforge/v1alpha1
kind: SkillSource

skill:
  name: ${name}
  source-version: 0.1.0
  recommended-skill-md-max-bytes: 12000
  description: Simple generated skill without active references.

surfaces:
  active:
    requiredReferences: []
    optionalReferences: []
  supportingGlobs: []

sections:
  startHere:
    - Confirm the simple workflow applies.
  whenToUse:
    - Use for simple generated skill checks.
  whenNotToUse:
    - Do not use when references are required.
  workflow:
    - id: stage-simple
      title: Simple stage
      goal: Keep the bundle minimal.
      steps:
        - Run the simple step.
      validation:
        - The generated skill remains valid.
  portability:
    required: true
    rules:
      - Keep this generated skill portable.
    checklist:
      - Confirm no reference files are required.
`;

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

void test('checkCompiledSkill accepts source bundles without active references', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'skillforge-check-no-reference-source-'));
  const sourceRoot = join(tempRoot, 'simple-skill');

  try {
    await mkdir(sourceRoot, { recursive: true });
    await writeFile(join(sourceRoot, 'skill.yaml'), noReferenceManifest(), 'utf8');
    await regenerateSourceBundle(sourceRoot);

    const skill = await readFile(join(sourceRoot, 'SKILL.md'), 'utf8');
    assert.doesNotMatch(skill, /## Required active references/u);
    assert.doesNotMatch(skill, /## Optional references/u);

    const result = await checkCompiledSkill(sourceRoot);
    assert.equal(result.ok, true, result.diagnostics.map((entry) => entry.message).join('\n'));
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('checkCompiledSkill accepts compiled skills without reference links', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'skillforge-check-no-reference-compiled-'));
  const sourceRoot = join(tempRoot, 'simple-skill');

  try {
    await mkdir(sourceRoot, { recursive: true });
    await writeFile(join(sourceRoot, 'skill.yaml'), noReferenceManifest(), 'utf8');
    await regenerateSourceBundle(sourceRoot);
    await rm(join(sourceRoot, 'skill.yaml'));

    const result = await checkCompiledSkill(sourceRoot);
    assert.equal(result.ok, true, result.diagnostics.map((entry) => entry.message).join('\n'));
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('checkCompiledSkill still rejects missing linked references', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'skillforge-check-missing-reference-'));
  const skillRoot = join(tempRoot, 'broken-skill');

  try {
    await mkdir(skillRoot, { recursive: true });
    await writeFile(
      join(skillRoot, 'SKILL.md'),
      `---
name: broken-skill
description: Broken compiled skill.
metadata:
  source-version: 0.1.0
---

# broken-skill

## Start here

1. Start.

## When to use this skill

- Use it.

## When NOT to use this skill

- Do not use it.

## Portability rules

- Keep it portable.

## Supporting and historical surface

- None.

See [Missing](references/missing.md).
`,
      'utf8',
    );

    const result = await checkCompiledSkill(skillRoot);
    assert.equal(result.ok, false);
    assert.ok(result.diagnostics.some((entry) => entry.code === 'missing-linked-reference'));
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
