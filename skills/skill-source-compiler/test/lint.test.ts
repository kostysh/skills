import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

import { lintSourceBundle } from '../src/lint.ts';

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const fixtureRoot = join(TEST_DIR, '..');

const noReferenceManifest = `apiVersion: skillforge/v1alpha1
kind: SkillSource

skill:
  name: simple-skill
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

const manifestWithDescription = (description: string): string =>
  noReferenceManifest.replace(
    'description: Simple generated skill without active references.',
    `description: ${description}`,
  );

void test('lintSourceBundle accepts the example source bundle', async () => {
  const result = await lintSourceBundle(fixtureRoot);
  assert.equal(result.ok, true, result.diagnostics.map((entry) => entry.message).join('\n'));
  assert.deepEqual(result.diagnostics, []);
});

void test('lintSourceBundle accepts source bundles without active references', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'skillforge-lint-no-reference-'));

  try {
    await writeFile(join(tempRoot, 'skill.yaml'), noReferenceManifest, 'utf8');

    const result = await lintSourceBundle(tempRoot);
    assert.equal(result.ok, true, result.diagnostics.map((entry) => entry.message).join('\n'));
    assert.deepEqual(result.diagnostics, []);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('lintSourceBundle warns only above 300 Unicode code points', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'skillforge-lint-description-length-'));

  try {
    const exactlyThreeHundred = `${'a'.repeat(299)}😀`;
    await writeFile(
      join(tempRoot, 'skill.yaml'),
      manifestWithDescription(exactlyThreeHundred),
      'utf8',
    );

    const boundaryResult = await lintSourceBundle(tempRoot);
    assert.equal(boundaryResult.ok, true);
    assert.deepEqual(boundaryResult.diagnostics, []);

    const threeHundredAndOne = `${exactlyThreeHundred}b`;
    await writeFile(
      join(tempRoot, 'skill.yaml'),
      manifestWithDescription(threeHundredAndOne),
      'utf8',
    );

    const aboveBoundaryResult = await lintSourceBundle(tempRoot);
    assert.equal(aboveBoundaryResult.ok, true);
    assert.deepEqual(aboveBoundaryResult.diagnostics, [
      {
        code: 'skill-description-too-long',
        level: 'warning',
        message: 'Skill description exceeds the recommended 300-character limit.',
      },
    ]);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('lintSourceBundle counts combining marks separately and accepts descriptions above 1024 code points', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'skillforge-lint-long-description-'));

  try {
    await writeFile(
      join(tempRoot, 'skill.yaml'),
      manifestWithDescription(`${'a'.repeat(299)}e\u0301`),
      'utf8',
    );

    const combiningMarkResult = await lintSourceBundle(tempRoot);
    assert.equal(combiningMarkResult.ok, true);
    assert.ok(
      combiningMarkResult.diagnostics.some(
        (entry) => entry.code === 'skill-description-too-long' && entry.level === 'warning',
      ),
    );

    await writeFile(
      join(tempRoot, 'skill.yaml'),
      manifestWithDescription('a'.repeat(1_025)),
      'utf8',
    );

    const formerlyRejectedResult = await lintSourceBundle(tempRoot);
    assert.equal(formerlyRejectedResult.ok, true);
    assert.ok(
      formerlyRejectedResult.diagnostics.some(
        (entry) => entry.code === 'skill-description-too-long' && entry.level === 'warning',
      ),
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('lintSourceBundle reports duplicate ids', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'skillforge-lint-'));
  await mkdir(join(tempRoot, 'references'), { recursive: true });
  await mkdir(join(tempRoot, 'assets'), { recursive: true });
  await mkdir(join(tempRoot, 'docs/issues'), { recursive: true });
  await mkdir(join(tempRoot, 'fragments'), { recursive: true });
  await mkdir(join(tempRoot, 'scripts'), { recursive: true });
  await mkdir(join(tempRoot, 'test'), { recursive: true });

  const fixtureManifest = await readFile(join(fixtureRoot, 'skill.yaml'), 'utf8');
  const mutated = fixtureManifest.replace('id: ref-conflict-resolution', 'id: ref-source-language');
  await writeFile(join(tempRoot, 'skill.yaml'), mutated, 'utf8');

  const copiedFiles = [
    'package.json',
    'references/source-language.md',
    'references/conflict-resolution.md',
    'references/maintenance.md',
    'references/authoring-guidelines.md',
    'references/output-structure.md',
    'assets/source-template.yaml',
    'docs/issues/design-notes.md',
    'docs/logs/implementation-log-20260710-1.md',
    'docs/logs/implementation-log-20260713-1.md',
    'docs/logs/implementation-log-20260715-1.md',
    'fragments/overview.md',
    'fragments/final-checks.md',
    'scripts/skill-source-compiler.mjs',
  ];
  for (const relativePath of copiedFiles) {
    const content = await readFile(join(fixtureRoot, relativePath), 'utf8');
    await mkdir(join(tempRoot, relativePath.split('/').slice(0, -1).join('/')), {
      recursive: true,
    });
    await writeFile(join(tempRoot, relativePath), content, 'utf8');
  }

  const result = await lintSourceBundle(tempRoot);
  assert.equal(result.ok, false);
  assert.ok(result.diagnostics.some((entry) => entry.code === 'duplicate-id'));
});

void test('lintSourceBundle requires package.json when commands are documented', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'skillforge-lint-missing-package-'));
  await mkdir(join(tempRoot, 'references'), { recursive: true });
  await mkdir(join(tempRoot, 'assets'), { recursive: true });
  await mkdir(join(tempRoot, 'docs/issues'), { recursive: true });
  await mkdir(join(tempRoot, 'fragments'), { recursive: true });
  await mkdir(join(tempRoot, 'scripts'), { recursive: true });
  await mkdir(join(tempRoot, 'test'), { recursive: true });

  const copiedFiles = [
    'skill.yaml',
    'references/source-language.md',
    'references/conflict-resolution.md',
    'references/maintenance.md',
    'references/authoring-guidelines.md',
    'references/output-structure.md',
    'assets/source-template.yaml',
    'docs/issues/design-notes.md',
    'docs/logs/implementation-log-20260710-1.md',
    'docs/logs/implementation-log-20260713-1.md',
    'docs/logs/implementation-log-20260715-1.md',
    'fragments/overview.md',
    'fragments/final-checks.md',
    'scripts/skill-source-compiler.mjs',
  ];
  for (const relativePath of copiedFiles) {
    const content = await readFile(join(fixtureRoot, relativePath), 'utf8');
    await mkdir(join(tempRoot, relativePath.split('/').slice(0, -1).join('/')), {
      recursive: true,
    });
    await writeFile(join(tempRoot, relativePath), content, 'utf8');
  }

  const result = await lintSourceBundle(tempRoot);
  assert.equal(result.ok, false);
  assert.ok(result.diagnostics.some((entry) => entry.code === 'missing-package-manifest'));
});

void test('lintSourceBundle rejects unresolved scaffold markers in active guidance', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'skillforge-lint-template-marker-'));

  try {
    await writeFile(
      join(tempRoot, 'skill.yaml'),
      await readFile(join(fixtureRoot, 'assets/source-template.yaml'), 'utf8'),
      'utf8',
    );

    const result = await lintSourceBundle(tempRoot);
    assert.equal(result.ok, false);
    assert.ok(result.diagnostics.some((entry) => entry.code === 'unresolved-template-marker'));
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('lintSourceBundle rejects non-whitelisted absolute POSIX paths', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'skillforge-lint-posix-path-'));

  try {
    await cp(fixtureRoot, tempRoot, { recursive: true });
    await writeFile(
      join(tempRoot, 'fragments/final-checks.md'),
      '- Follow `/srv/acme/policy.md` before publishing the generated skill.\n',
      'utf8',
    );

    const result = await lintSourceBundle(tempRoot);
    assert.equal(result.ok, false);
    assert.ok(result.diagnostics.some((entry) => entry.code === 'absolute-path-in-source-file'));
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('lintSourceBundle requires one consistent active surface per reference', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'skillforge-lint-reference-surface-'));

  try {
    await cp(fixtureRoot, tempRoot, { recursive: true });
    const manifestPath = join(tempRoot, 'skill.yaml');
    const manifest = await readFile(manifestPath, 'utf8');
    await writeFile(
      manifestPath,
      manifest.replace(
        '      - ref-maintenance\n    optionalReferences:',
        '      - ref-maintenance\n      - ref-authoring-guidelines\n    optionalReferences:',
      ),
      'utf8',
    );

    const result = await lintSourceBundle(tempRoot);
    assert.equal(result.ok, false);
    assert.ok(result.diagnostics.some((entry) => entry.code === 'ambiguous-reference-surface'));
    assert.ok(result.diagnostics.some((entry) => entry.code === 'reference-required-mismatch'));
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});
