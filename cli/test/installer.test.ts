import assert from 'node:assert/strict';
import { mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import { exists } from '../src/files.ts';
import { Installer } from '../src/installer.ts';
import { destination, safeRelative, sha256 } from '../src/model.ts';
import { release, sandbox, transport } from './helpers.ts';

void test('install, reload, repeat, upgrade, restore and protect local changes across two targets', async (t) => {
  const root = await sandbox();
  t.after(() => rm(root, { recursive: true, force: true }));
  const first = await release(root);
  const home = join(root, 'home');
  const path = join(root, 'project/.agents/skills');
  const installer = new Installer(home, transport(first.catalog, first.out));
  assert.equal(
    (await installer.install(first.catalog, ['example'], path, 'custom')).errors.length,
    0,
  );
  assert.equal(
    await readFile(join(path, 'example/assets/AGENTS.md'), 'utf8'),
    'Working template\n',
  );
  assert.equal(await exists(join(path, 'example/README.md')), false);
  assert.equal(await exists(join(path, 'example/docs')), false);
  assert.equal(
    (await new Installer(home, transport(first.catalog, first.out)).update(first.catalog)).changed
      .length,
    0,
  );
  await installer.install(first.catalog, ['example'], path, 'universal');
  assert.equal((await installer.read()).installations.length, 1);
  const secondPath = join(root, 'other');
  await installer.install(first.catalog, ['example'], secondPath, 'codex');
  const second = await release(root, '1.1.0', first.catalog);
  const newer = new Installer(home, transport(second.catalog, second.out));
  assert.equal((await newer.update(second.catalog)).changed.length, 2);
  assert.equal((await newer.read()).installations[0]?.skills[0]?.version, '1.1.0');
  assert.equal((await newer.update(first.catalog)).errors.length, 2);
  await rm(join(path, 'example'), { recursive: true });
  assert.equal((await newer.update(second.catalog)).changed.length, 1);
  await writeFile(join(path, 'example/references/method.md'), 'mine');
  assert.equal((await newer.update(second.catalog)).errors.length, 1);
  assert.equal(await readFile(join(path, 'example/references/method.md'), 'utf8'), 'mine');
});

void test('network, digest failure and corrupt state preserve installed files; foreign folders are untouched', async (t) => {
  const root = await sandbox();
  t.after(() => rm(root, { recursive: true, force: true }));
  const first = await release(root);
  const next = await release(root, '2.0.0', first.catalog);
  const home = join(root, 'home');
  const path = join(root, 'skills');
  const installer = new Installer(home, transport(first.catalog, first.out));
  await installer.install(first.catalog, ['example'], path, 'custom');
  const original = await readFile(installer.file, 'utf8');
  const failed = new Installer(home, () => Promise.reject(new Error('offline')));
  assert.match((await failed.update(next.catalog)).errors.join(), /offline/);
  const bad = new Installer(home, () => Promise.resolve(Buffer.from('bad')));
  assert.match((await bad.update(next.catalog)).errors.join(), /SHA-256/);
  assert.equal(await readFile(installer.file, 'utf8'), original);
  const foreign = join(root, 'foreign');
  await mkdir(join(foreign, 'example'), { recursive: true });
  await writeFile(join(foreign, 'example/sentinel'), 'keep');
  assert.equal(
    (await installer.install(first.catalog, ['example'], foreign, 'custom')).errors.length,
    1,
  );
  assert.equal(await readFile(join(foreign, 'example/sentinel'), 'utf8'), 'keep');
  await writeFile(installer.file, 'broken');
  await assert.rejects(installer.update(next.catalog), /Invalid configuration/);
  assert.equal(await readFile(installer.file, 'utf8'), 'broken');
});

void test('state-write failure rolls back files and concurrent invocation cannot acquire lock', async (t) => {
  const root = await sandbox();
  t.after(() => rm(root, { recursive: true, force: true }));
  const first = await release(root);
  const next = await release(root, '2.0.0', first.catalog);
  const home = join(root, 'home');
  const path = join(root, 'skills');
  const installer = new Installer(home, transport(first.catalog, first.out));
  await installer.install(first.catalog, ['example'], path, 'custom');
  const original = await readFile(installer.file);
  const failed = new Installer(home, async (url) => {
    const bytes = await transport(next.catalog, next.out)(url);
    await rm(installer.file);
    await mkdir(installer.file); // failure at atomic config rename
    return bytes;
  });
  assert.equal((await failed.update(next.catalog)).errors.length, 1);
  assert.match(await readFile(join(path, 'example/references/method.md'), 'utf8'), /1.0.0/);
  await rm(installer.file, { recursive: true });
  await writeFile(installer.file, original);
  await installer.locked(async () => {
    await assert.rejects(installer.update(next.catalog), /acquire lock/);
  });
});

void test('paths, presets and symlinks fail closed', async (t) => {
  const root = await sandbox();
  t.after(() => rm(root, { recursive: true, force: true }));
  const expected = {
    codex: '.agents/skills',
    'claude-code': '.claude/skills',
    opencode: '.config/opencode/skills',
    pi: '.pi/agent/skills',
  } as const;
  for (const target of Object.keys(expected) as (keyof typeof expected)[])
    assert.equal(destination(target, undefined, root), join(root, expected[target]));
  assert.equal(destination('custom', '.agents/skills', root, root), join(root, '.agents/skills'));
  assert.throws(() => destination('custom'), /--path/);
  for (const path of [
    '../sentinel',
    '/absolute',
    'C:/evil',
    'a\\evil',
    'a/NUL.md',
    'a/../b',
    'a/file.',
  ])
    assert.throws(() => safeRelative(path));
  if (process.platform !== 'win32') {
    const first = await release(root);
    await mkdir(join(root, 'outside'));
    await symlink(join(root, 'outside'), join(root, 'link'));
    await assert.rejects(
      new Installer(join(root, 'home')).install(
        first.catalog,
        ['example'],
        join(root, 'link'),
        'custom',
      ),
      /without symbolic/,
    );
  }
  assert.equal(sha256('a').length, 64);
});

void test('cancellation before replacement preserves both previous files and config', async (t) => {
  const root = await sandbox();
  t.after(() => rm(root, { recursive: true, force: true }));
  const first = await release(root);
  const next = await release(root, '2.0.0', first.catalog);
  const home = join(root, 'home');
  const path = join(root, 'skills');
  const installer = new Installer(home, transport(first.catalog, first.out));
  await installer.install(first.catalog, ['example'], path, 'custom');
  const original = await readFile(installer.file, 'utf8');
  const controller = new AbortController();
  const cancelled = new Installer(
    home,
    async (url) => {
      const bytes = await transport(next.catalog, next.out)(url);
      controller.abort();
      return bytes;
    },
    controller.signal,
  );
  assert.equal((await cancelled.update(next.catalog)).errors.length, 1);
  assert.equal(await readFile(installer.file, 'utf8'), original);
  assert.match(await readFile(join(path, 'example/references/method.md'), 'utf8'), /1.0.0/);
});
