import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

import { checkCompiledSkill } from '../src/check.ts';
import { compileSourceBundle, regenerateSourceBundle } from '../src/compiler.ts';
import { containsAbsolutePath } from '../src/text.ts';

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
    assert.doesNotMatch(skill, /## Supporting and historical surface/u);

    const result = await checkCompiledSkill(sourceRoot);
    assert.equal(result.ok, true, result.diagnostics.map((entry) => entry.message).join('\n'));
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('regenerateSourceBundle preserves overview fragments that start with a level-two heading', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'skillforge-check-overview-heading-'));
  const sourceRoot = join(tempRoot, 'heading-overview-skill');

  try {
    await mkdir(join(sourceRoot, 'fragments'), { recursive: true });
    await writeFile(
      join(sourceRoot, 'skill.yaml'),
      `${noReferenceManifest('heading-overview-skill')}
fragments:
  overview: fragments/overview.md
`,
      'utf8',
    );
    await writeFile(
      join(sourceRoot, 'fragments/overview.md'),
      '## Scope\n\nCustom scoped content.\n',
      'utf8',
    );

    await regenerateSourceBundle(sourceRoot);

    const skill = await readFile(join(sourceRoot, 'SKILL.md'), 'utf8');
    assert.match(skill, /## Scope\n\nCustom scoped content\./u);
    assert.doesNotMatch(skill, /## Overview\n\n## Scope/u);
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

void test('checkCompiledSkill rejects source bundles with missing compiler-owned output', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'skillforge-check-missing-generated-'));
  const sourceRoot = join(tempRoot, 'skill-source-compiler');

  try {
    await cp(fixtureRoot, sourceRoot, { recursive: true });
    await rm(join(sourceRoot, 'SKILL.md'));
    await rm(join(sourceRoot, 'docs/compile-report.md'));

    const result = await checkCompiledSkill(sourceRoot);
    assert.equal(result.ok, false);
    assert.ok(result.diagnostics.some((entry) => entry.code === 'missing-generated-skill'));
    assert.ok(result.diagnostics.some((entry) => entry.code === 'missing-compile-report'));
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('checkCompiledSkill rejects missing documented package files', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'skillforge-check-missing-package-file-'));

  try {
    const result = await compileSourceBundle(fixtureRoot, { outDir: tempRoot });
    await rm(join(result.outputDir, 'scripts/skill-source-compiler.mjs'));
    await rm(join(result.outputDir, 'assets/source-template.yaml'));

    const check = await checkCompiledSkill(result.outputDir);
    assert.equal(check.ok, false);
    assert.ok(
      check.diagnostics.filter((entry) => entry.code === 'missing-documented-package-file')
        .length >= 2,
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('checkCompiledSkill requires compile reports for compiler-tagged packages', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'skillforge-check-missing-report-'));

  try {
    const result = await compileSourceBundle(fixtureRoot, { outDir: tempRoot });
    await rm(join(result.outputDir, 'docs/compile-report.md'));

    const check = await checkCompiledSkill(result.outputDir);
    assert.equal(check.ok, false);
    assert.ok(check.diagnostics.some((entry) => entry.code === 'missing-compile-report'));
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('checkCompiledSkill rejects non-whitelisted absolute POSIX paths', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'skillforge-check-posix-path-'));

  try {
    const result = await compileSourceBundle(fixtureRoot, { outDir: tempRoot });
    const skillPath = join(result.outputDir, 'SKILL.md');
    await writeFile(
      skillPath,
      `${await readFile(skillPath, 'utf8')}\nRead /data/company/policy.md.\n`,
      'utf8',
    );

    const check = await checkCompiledSkill(result.outputDir);
    assert.equal(check.ok, false);
    assert.ok(check.diagnostics.some((entry) => entry.code === 'absolute-path-in-skill'));
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('containsAbsolutePath detects portable-path violations without flagging URLs', () => {
  assert.equal(containsAbsolutePath('/usr/local/example/policy.md'), true);
  assert.equal(containsAbsolutePath('/private/company/policy.md'), true);
  assert.equal(containsAbsolutePath('/data/company/policy.md'), true);
  assert.equal(containsAbsolutePath('/app/company/policy.md'), true);
  assert.equal(containsAbsolutePath('Read `/private/company/policy.md`.'), true);
  assert.equal(containsAbsolutePath('Follow `/srv/acme/policy.md` before publishing.'), true);
  assert.equal(containsAbsolutePath('Consult `/data/team/rules.yaml` before writing.'), true);
  assert.equal(containsAbsolutePath('Follow `/srv/api/policy.md` before publishing.'), true);
  assert.equal(containsAbsolutePath('Consult `/data/auth/rules.yaml` before writing.'), true);
  assert.equal(containsAbsolutePath('Obey `/private/org/policy.md` for the API route.'), true);
  assert.equal(containsAbsolutePath('Use C:/Users/example/policy.md.'), true);
  assert.equal(containsAbsolutePath(String.raw`Use \\server\share\policy.md.`), true);
  assert.equal(containsAbsolutePath('See https://example.com/docs/path.'), false);
  assert.equal(containsAbsolutePath('slug: /auth/overview'), false);
  assert.equal(containsAbsolutePath('The API defines POST /coupon/validate.'), false);
  assert.equal(containsAbsolutePath('Visit `/photos/123` to open the route.'), false);
  assert.equal(containsAbsolutePath('Append filters to `/rest/v1` query strings.'), false);
  assert.equal(
    containsAbsolutePath('```dockerfile\nCOPY --from=builder /app/public ./public\n```'),
    false,
  );
  assert.equal(containsAbsolutePath('Run scripts/check.mjs from the skill root.'), false);
});
