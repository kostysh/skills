import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { exists, fingerprint } from '../src/files.ts';
import { Installer } from '../src/installer.ts';
import { release, sandbox, transport } from './helpers.ts';

void test('README recovery restores the recorded copy after an actual interrupted config commit', async (t) => {
  const root = await sandbox();
  t.after(() => rm(root, { recursive: true, force: true }));
  const first = await release(root);
  const next = await release(root, '2.0.0', first.catalog);
  const target = join(root, 'skills');
  const installed = join(target, 'example');
  const installer = new Installer(join(root, 'home'), transport(first.catalog, first.out));
  assert.deepEqual(
    (await installer.install(first.catalog, ['example'], target, 'custom')).errors,
    [],
  );
  const crashed = spawnSync(
    process.execPath,
    [fileURLToPath(new URL('./crash-fixture.ts', import.meta.url)), root],
    { encoding: 'utf8' },
  );
  assert.equal(crashed.status, 99, crashed.stderr);
  const recorded = (await installer.read()).installations[0]?.skills[0];
  assert.ok(recorded);
  assert.equal(recorded.version, '1.0.0');
  assert.notEqual(await fingerprint(installed), recorded.contentHash);
  assert.equal(await exists(join(installer.state, 'setup.lock')), true);
  const works = (await readdir(target)).filter((name) => name.startsWith('.kskills-'));
  assert.equal(works.length, 1);
  const work = join(target, works[0] ?? 'missing');
  // Keep a separate recovery backup before following the documented moves.
  await cp(installer.state, join(root, 'backup/state'), { recursive: true });
  await cp(target, join(root, 'backup/skills'), { recursive: true });
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
  const snippet = /```js\n([\s\S]*?)\n```/.exec(readme)?.[1];
  assert.ok(snippet);
  const script = join(root, 'recovery-hash.mjs');
  await writeFile(script, snippet);
  const hash = (path: string) => {
    const result = spawnSync(process.execPath, [script, path], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  assert.equal(hash(join(work, 'old')), recorded.contentHash);
  assert.notEqual(hash(installed), recorded.contentHash);
  const quarantine = join(root, 'quarantine-example');
  await rename(installed, quarantine);
  await rename(join(work, 'old'), installed);
  assert.equal(hash(installed), recorded.contentHash);
  await rm(join(installer.state, 'setup.lock'));
  const updater = new Installer(join(root, 'home'), transport(next.catalog, next.out));
  assert.deepEqual((await updater.update(next.catalog)).errors, []);
  assert.equal((await updater.read()).installations[0]?.skills[0]?.version, '2.0.0');
  assert.equal(await fingerprint(installed), next.catalog.skills[0]?.contentHash);
  assert.equal(await fingerprint(quarantine), next.catalog.skills[0]?.contentHash);
});
