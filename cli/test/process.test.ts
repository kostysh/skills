import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { Installer } from '../src/installer.ts';
import { release, sandbox } from './helpers.ts';

const binary = fileURLToPath(new URL('../dist/cli.mjs', import.meta.url));

void test('built CLI validates arguments before any I/O and implements public help/version', async (t) => {
  const root = await sandbox();
  t.after(() => rm(root, { recursive: true, force: true }));
  const env = { ...process.env, HOME: root, USERPROFILE: root };
  for (const args of [['--help'], ['--version']]) {
    const result = spawnSync(process.execPath, [binary, ...args], {
      cwd: root,
      env,
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, '');
    if (args[0] === '--help') {
      assert.match(result.stdout, /install and update skills/);
      assert.match(result.stdout, /interactive menu/);
      assert.doesNotMatch(result.stdout, /[А-Яа-яЁё]/);
    }
  }
  for (const args of [
    [],
    ['install'],
    ['install', 'example', '--target', 'custom'],
    ['update', '--path', root],
    ['--unknown'],
    ['install', 'example', '--target', 'codex', '--unknown'],
  ]) {
    const result = spawnSync(process.execPath, [binary, ...args], {
      cwd: root,
      env,
      encoding: 'utf8',
    });
    assert.equal(result.status, 2, result.stderr);
    assert.equal(result.stdout, '');
    assert.doesNotMatch(result.stderr, /Checking the skills catalog/);
    assert.doesNotMatch(result.stderr, /[А-Яа-яЁё]/);
  }
});

void test('built CLI updates active skills and warns about retired skills', async (t) => {
  const root = await sandbox();
  t.after(() => rm(root, { recursive: true, force: true }));
  const oldPencil = join(root, 'source-1.0.0', 'pencil-dev');
  await mkdir(oldPencil, { recursive: true });
  await writeFile(
    join(oldPencil, 'SKILL.md'),
    '---\nname: pencil-dev\ndescription: Edit Pencil files\nmetadata:\n  source-version: 0.2.2\n---\n# Pencil\n',
  );
  const first = await release(root);
  const next = await release(root, '1.1.0', first.catalog);
  const fixture = join(root, 'fixture.json');
  await writeFile(fixture, JSON.stringify({ catalog: first.catalog, out: first.out }));
  const env = { ...process.env, HOME: root, USERPROFILE: root, KSKILLS_TEST_FIXTURE: fixture };
  const preload = new URL('./http-fixture.ts', import.meta.url).href;
  const run = (args: string[]) =>
    spawnSync(process.execPath, ['--import', preload, binary, ...args], {
      cwd: root,
      env,
      encoding: 'utf8',
    });
  const installed = run([
    'install',
    'pencil-dev',
    'example',
    '--target',
    'custom',
    '--path',
    '.agents/skills',
  ]);
  assert.equal(installed.status, 0, installed.stderr);
  assert.match(installed.stdout, /Installed pencil-dev@0.2.2/);
  assert.match(installed.stdout, /Installed example@1.0.0/);
  assert.match(installed.stderr, /Checking the skills catalog/);
  assert.match(installed.stderr, /Installation path:/);
  const installer = new Installer(root);
  const destination = join(root, '.agents/skills');
  const initialInstall = (await installer.read()).installations[0];
  assert.ok(initialInstall);
  assert.equal(initialInstall.path, destination);
  const pencilRecord = initialInstall.skills.find((skill) => skill.name === 'pencil-dev');
  assert.ok(pencilRecord);
  const unchanged = run(['update']);
  assert.equal(unchanged.status, 0, unchanged.stderr);
  assert.equal(unchanged.stdout, 'All up to date\n');

  const pencilFile = join(destination, 'pencil-dev', 'SKILL.md');
  const localPencil = `${await readFile(pencilFile, 'utf8')}\nLocal notes.\n`;
  await writeFile(pencilFile, localPencil);
  await writeFile(fixture, JSON.stringify({ catalog: next.catalog, out: next.out }));
  const pencilWarning = /^Warning: pencil-dev is missing from the current catalog\./m;
  const upgraded = run(['update']);
  assert.equal(upgraded.status, 0, upgraded.stderr);
  assert.match(upgraded.stdout, /example@1.1.0/);
  assert.match(upgraded.stderr, pencilWarning);
  assert.doesNotMatch(upgraded.stdout, /pencil-dev/);
  assert.equal(await readFile(pencilFile, 'utf8'), localPencil);
  const updatedInstall = (await installer.read()).installations[0];
  assert.deepEqual(
    updatedInstall?.skills.find((skill) => skill.name === 'pencil-dev'),
    pencilRecord,
  );
  const updatedConfig = await readFile(installer.file, 'utf8');

  const warningOnly = run(['update']);
  assert.equal(warningOnly.status, 0, warningOnly.stderr);
  assert.match(warningOnly.stderr, pencilWarning);
  assert.equal(warningOnly.stdout, '');

  const activeFile = join(destination, 'example', 'SKILL.md');
  await writeFile(activeFile, 'my changes');
  const conflict = run(['update']);
  assert.equal(conflict.status, 1);
  assert.match(conflict.stderr, pencilWarning);
  assert.match(
    conflict.stderr,
    /Conflict: directory is not managed by this CLI or has local changes/,
  );
  assert.doesNotMatch(conflict.stdout, /up to date/);
  assert.equal(await readFile(activeFile, 'utf8'), 'my changes');
  assert.equal(await readFile(pencilFile, 'utf8'), localPencil);
  assert.equal(await readFile(installer.file, 'utf8'), updatedConfig);
});
