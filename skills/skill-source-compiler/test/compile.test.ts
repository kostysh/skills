import { fileURLToPath } from 'node:url';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';
import packageJson from '../package.json' with { type: 'json' };

import { checkCompiledSkill } from '../src/check.ts';
import {
  compileAllSourceBundles,
  compileSourceBundle,
  regenerateSourceBundle,
} from '../src/compiler.ts';

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const fixtureRoot = join(TEST_DIR, '..');
const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');

void test('compileSourceBundle generates a valid skill bundle', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'skillforge-compile-'));
  const result = await compileSourceBundle(fixtureRoot, { outDir: tempRoot });

  const skillMarkdown = await readFile(join(result.outputDir, 'SKILL.md'), 'utf8');
  assert.match(skillMarkdown, /## Start here/u);
  assert.match(skillMarkdown, /## Runnable commands/u);
  assert.match(skillMarkdown, /metadata:\n(?:.+\n)*\s+source-version: 0\.2\.8/u);
  assert.match(skillMarkdown, /references\/source-language\.md/u);
  assert.match(skillMarkdown, /references\/maintenance\.md/u);
  assert.match(skillMarkdown, /references\/authoring-guidelines\.md/u);
  assert.match(skillMarkdown, /look for it under <skill-root>\/scripts/u);
  assert.match(skillMarkdown, /scripts\/skill-source-compiler\.mjs/u);
  assert.doesNotMatch(skillMarkdown, /\*\*Tests:\*\*/u);
  assert.doesNotMatch(skillMarkdown, /test\/cli\.test\.ts/u);
  assert.doesNotMatch(skillMarkdown, /author: skillforge-kit/u);
  assert.doesNotMatch(skillMarkdown, /channel: self-hosted/u);

  const copiedRuntime = await readFile(
    join(result.outputDir, 'scripts/skill-source-compiler.mjs'),
    'utf8',
  );
  assert.match(copiedRuntime, /runCli/u);
  assert.match(copiedRuntime, /compile-all/u);

  const compileReport = await readFile(join(result.outputDir, 'docs/compile-report.md'), 'utf8');
  assert.match(compileReport, /## Versions/u);
  assert.match(compileReport, /Skill source version: `0\.2\.8`/u);
  assert.match(
    compileReport,
    new RegExp(`CLI package version: \`${escapeRegExp(packageJson.version)}\``, 'u'),
  );
  assert.match(compileReport, /`references\/authoring-guidelines\.md`/u);
  assert.match(compileReport, /`references\/maintenance\.md`/u);
  assert.match(compileReport, /`package\.json`/u);

  const check = await checkCompiledSkill(result.outputDir);
  assert.equal(check.ok, true, check.diagnostics.map((entry) => entry.message).join('\n'));
});

void test('compileSourceBundle warns when generated SKILL.md exceeds the recommended size', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'skillforge-compile-size-'));
  const sourceRoot = join(tempRoot, 'source');

  try {
    await cp(fixtureRoot, sourceRoot, { recursive: true });

    const manifestPath = join(sourceRoot, 'skill.yaml');
    const manifest = await readFile(manifestPath, 'utf8');
    await writeFile(
      manifestPath,
      manifest.replace(
        'recommended-skill-md-max-bytes: 20000',
        'recommended-skill-md-max-bytes: 128',
      ),
      'utf8',
    );

    const result = await compileSourceBundle(sourceRoot, { outDir: join(tempRoot, 'out') });
    assert.ok(
      result.warnings.some((entry) => entry.includes('above the recommended maximum 128 bytes')),
      result.warnings.join('\n'),
    );
    assert.ok(
      result.warnings.some((entry) => entry.includes('Move detailed guidance into references/*')),
      result.warnings.join('\n'),
    );

    const compileReport = await readFile(join(result.outputDir, 'docs/compile-report.md'), 'utf8');
    assert.match(compileReport, /recommended maximum 128 bytes/u);
    assert.match(compileReport, /Move detailed guidance into references\/\*/u);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('compileSourceBundle rejects output overlap before deleting the source bundle', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'skillforge-compile-overlap-'));
  const sourceRoot = join(tempRoot, 'skill-source-compiler');

  try {
    await cp(fixtureRoot, sourceRoot, { recursive: true });
    await assert.rejects(
      compileSourceBundle(sourceRoot, { outDir: tempRoot }),
      /Output directory .* overlaps source bundle/u,
    );

    assert.match(
      await readFile(join(sourceRoot, 'skill.yaml'), 'utf8'),
      /name: skill-source-compiler/u,
    );
    assert.match(
      await readFile(join(sourceRoot, 'references/source-language.md'), 'utf8'),
      /# Source language/u,
    );
    assert.match(
      await readFile(join(sourceRoot, 'src/compiler.ts'), 'utf8'),
      /compileSourceBundle/u,
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('compileSourceBundle rejects descendant output overlap', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'skillforge-compile-descendant-'));
  const sourceRoot = join(tempRoot, 'skill-source-compiler');

  try {
    await cp(fixtureRoot, sourceRoot, { recursive: true });
    await assert.rejects(
      compileSourceBundle(sourceRoot, { outDir: join(sourceRoot, 'out') }),
      /Output directory .* overlaps source bundle/u,
    );

    assert.match(
      await readFile(join(sourceRoot, 'skill.yaml'), 'utf8'),
      /name: skill-source-compiler/u,
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('compileSourceBundle preserves an existing output target by default', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'skillforge-compile-existing-target-'));
  const outDir = join(tempRoot, 'out');
  const targetDir = join(outDir, 'skill-source-compiler');
  const sentinelPath = join(targetDir, 'operator-notes.txt');

  try {
    await mkdir(targetDir, { recursive: true });
    await writeFile(sentinelPath, 'do not delete\n', 'utf8');

    await assert.rejects(
      compileSourceBundle(fixtureRoot, { outDir }),
      /Output directory already exists/u,
    );
    assert.equal(await readFile(sentinelPath, 'utf8'), 'do not delete\n');
    await assert.rejects(readFile(join(targetDir, 'SKILL.md'), 'utf8'));
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('compileAllSourceBundles preflights overlap before writing any child output', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'skillforge-compile-all-overlap-'));
  const sourcesRoot = join(tempRoot, 'sources');
  const bundleRoot = join(sourcesRoot, 'skill-source-compiler');

  try {
    await mkdir(sourcesRoot, { recursive: true });
    await cp(fixtureRoot, bundleRoot, { recursive: true });
    await assert.rejects(
      compileAllSourceBundles(sourcesRoot, { outDir: sourcesRoot }),
      /Output directory .* overlaps source bundle/u,
    );

    assert.match(
      await readFile(join(bundleRoot, 'skill.yaml'), 'utf8'),
      /name: skill-source-compiler/u,
    );
    assert.match(
      await readFile(join(bundleRoot, 'references/source-language.md'), 'utf8'),
      /# Source language/u,
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('regenerateSourceBundle refreshes generated files without copying source-owned files', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'skillforge-regenerate-'));
  const sourceRoot = join(tempRoot, 'skill-source-compiler');

  try {
    await cp(fixtureRoot, sourceRoot, { recursive: true });
    const referencePath = join(sourceRoot, 'references/source-language.md');
    const originalReference = await readFile(referencePath, 'utf8');
    await writeFile(join(sourceRoot, 'SKILL.md'), '---\nname: stale\n---\n# stale\n', 'utf8');
    await writeFile(join(sourceRoot, 'docs/compile-report.md'), '# stale\n', 'utf8');

    const result = await regenerateSourceBundle(sourceRoot);

    assert.equal(result.outputDir, sourceRoot);
    assert.match(await readFile(join(sourceRoot, 'SKILL.md'), 'utf8'), /# skill-source-compiler/u);
    assert.match(
      await readFile(join(sourceRoot, 'docs/compile-report.md'), 'utf8'),
      /# Compile report/u,
    );
    assert.equal(await readFile(referencePath, 'utf8'), originalReference);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('regenerateSourceBundle rejects non-same-path in-place copy targets', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'skillforge-regenerate-unsafe-target-'));
  const sourceRoot = join(tempRoot, 'skill-source-compiler');

  try {
    await cp(fixtureRoot, sourceRoot, { recursive: true });
    const manifestPath = join(sourceRoot, 'skill.yaml');
    const manifest = await readFile(manifestPath, 'utf8');
    await writeFile(
      manifestPath,
      manifest.replace(
        'target: assets/source-template.yaml',
        'target: assets/generated-source-template.yaml',
      ),
      'utf8',
    );
    await writeFile(join(sourceRoot, 'SKILL.md'), '---\nname: stale\n---\n# stale\n', 'utf8');

    await assert.rejects(
      regenerateSourceBundle(sourceRoot),
      /In-place regeneration cannot copy assets\/source-template.yaml to assets\/generated-source-template.yaml/u,
    );
    assert.match(await readFile(join(sourceRoot, 'SKILL.md'), 'utf8'), /# stale/u);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('compileAllSourceBundles skips direct child directories without skill.yaml', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'skillforge-compile-all-mixed-'));
  const sourcesRoot = join(tempRoot, 'sources');

  try {
    await cp(fixtureRoot, join(sourcesRoot, 'generated-skill'), { recursive: true });
    await mkdir(join(sourcesRoot, 'plain-skill'), { recursive: true });
    await writeFile(join(sourcesRoot, 'plain-skill', 'SKILL.md'), '# Plain skill\n', 'utf8');

    const results = await compileAllSourceBundles(sourcesRoot, {
      outDir: join(tempRoot, 'out'),
    });
    assert.equal(results.length, 1);
    assert.equal(results[0]?.outputDir, join(tempRoot, 'out', 'skill-source-compiler'));
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('compileAllSourceBundles rejects duplicate output targets before writing', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'skillforge-compile-all-collision-'));
  const sourcesRoot = join(tempRoot, 'sources');
  const outDir = join(tempRoot, 'out');

  try {
    await cp(fixtureRoot, join(sourcesRoot, 'first'), { recursive: true });
    await cp(fixtureRoot, join(sourcesRoot, 'second'), { recursive: true });

    await assert.rejects(
      compileAllSourceBundles(sourcesRoot, { outDir }),
      /Multiple source bundles resolve to the same output directory/u,
    );
    await assert.rejects(readFile(join(outDir, 'skill-source-compiler', 'SKILL.md'), 'utf8'));
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('compileAllSourceBundles preflights existing targets before writing any bundle', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'skillforge-compile-all-existing-target-'));
  const sourcesRoot = join(tempRoot, 'sources');
  const outDir = join(tempRoot, 'out');
  const secondSource = join(sourcesRoot, 'second');
  const existingTarget = join(outDir, 'second-compiler');
  const sentinelPath = join(existingTarget, 'operator-notes.txt');

  try {
    await cp(fixtureRoot, join(sourcesRoot, 'first'), { recursive: true });
    await cp(fixtureRoot, secondSource, { recursive: true });
    const secondManifestPath = join(secondSource, 'skill.yaml');
    const secondManifest = await readFile(secondManifestPath, 'utf8');
    await writeFile(
      secondManifestPath,
      secondManifest.replace('name: skill-source-compiler', 'name: second-compiler'),
      'utf8',
    );
    await mkdir(existingTarget, { recursive: true });
    await writeFile(sentinelPath, 'do not delete\n', 'utf8');

    await assert.rejects(
      compileAllSourceBundles(sourcesRoot, { outDir }),
      /Output directory already exists/u,
    );
    assert.equal(await readFile(sentinelPath, 'utf8'), 'do not delete\n');
    await assert.rejects(readFile(join(outDir, 'skill-source-compiler', 'SKILL.md'), 'utf8'));
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('compileSourceBundle rejects portable-path violations before writing output', async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), 'skillforge-compile-portability-'));
  const sourceRoot = join(tempRoot, 'source');
  const outDir = join(tempRoot, 'out');

  try {
    await cp(fixtureRoot, sourceRoot, { recursive: true });
    await writeFile(
      join(sourceRoot, 'fragments/final-checks.md'),
      '- Read /private/company/policy.md.\n',
      'utf8',
    );

    await assert.rejects(compileSourceBundle(sourceRoot, { outDir }), /absolute filesystem path/u);
    await assert.rejects(readFile(join(outDir, 'skill-source-compiler', 'SKILL.md'), 'utf8'));
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});
