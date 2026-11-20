import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { extract } from './archive.ts';
import { regularFiles } from './files.ts';
import { catalogSchema, repository } from './model.ts';
import { verifyPayload } from './pack.ts';

const [directory, release, ...extra] = process.argv.slice(2);
if (!directory || !release || extra.length) {
  throw new Error('verify:skills-release <archive-directory> <release-tag>');
}

const catalog = catalogSchema.parse(
  JSON.parse(await readFile(join(directory, 'catalog.json'), 'utf8')),
);
assert.equal(catalog.release, release, 'Unexpected release tag');
const source = (await readdir(resolve('../skills'), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map(({ name }) => name)
  .sort();
assert.ok(source.length > 0, 'Missing source skill inventory');
assert.deepEqual(catalog.skills.map(({ name }) => name).sort(), source, 'Missing or extra skills');

const filename = (name: string, version: string) => `${name}-${version}.tgz`;
const archives = catalog.skills.map(({ name, version }) => filename(name, version));
assert.deepEqual(
  (await readdir(directory)).sort(),
  ['catalog.json', ...archives].sort(),
  'Missing or extra assets',
);

const installed = await mkdtemp(join(tmpdir(), 'released-skills-'));
try {
  for (const skill of catalog.skills) {
    const archive = filename(skill.name, skill.version);
    assert.equal(
      skill.url,
      `https://github.com/${repository}/releases/download/${release}/${archive}`,
    );
    const target = join(installed, skill.name);
    await mkdir(target);
    await extract(await readFile(join(directory, archive)), target, skill);
    const meta = await verifyPayload(target, skill.name, await regularFiles(target));
    assert.equal(meta.metadata['source-version'], skill.version, `Incorrect ${skill.name} version`);
    assert.equal(meta.description, skill.description, `Incorrect ${skill.name} description`);
  }
  const compiler = join(installed, 'skill-source-compiler', 'scripts', 'skill-source-compiler.mjs');
  const help = spawnSync(process.execPath, [compiler, '--help'], {
    cwd: installed,
    encoding: 'utf8',
    timeout: 10_000,
  });
  assert.ifError(help.error);
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /skill-source-compiler/u);
  console.log(`Installed and verified ${catalog.skills.length} release archives.`);
} finally {
  await rm(installed, { recursive: true, force: true });
}
