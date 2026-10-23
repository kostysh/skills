import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import pkg from '../package.json' with { type: 'json' };
import { release, sandbox } from './helpers.ts';

const cleanEnv = Object.fromEntries(
  Object.entries(process.env).filter(
    ([key]) => !/^npm_config_/i.test(key) || key.toLowerCase() === 'npm_config_cache',
  ),
);
const root = await sandbox();
const cli = fileURLToPath(new URL('..', import.meta.url));
function command(name: string, args: string[], cwd: string, env = cleanEnv): string {
  const result = spawnSync(name, args, {
    cwd,
    env,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  assert.equal(result.status, 0, `${name}: ${result.stderr || result.error?.message}`);
  return result.stdout;
}
try {
  const output: unknown = JSON.parse(
    command('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', root], cli),
  );
  const { z } = await import('zod');
  const packed = z
    .array(z.object({ filename: z.string(), files: z.array(z.object({ path: z.string() })) }))
    .parse(output)[0];
  assert.ok(packed);
  for (const file of packed.files)
    assert.ok(
      ['package.json', 'README.md', 'LICENSE', 'dist/cli.mjs', 'dist/cli.mjs.map'].includes(
        file.path,
      ),
      file.path,
    );
  const project = join(root, 'consumer');
  await mkdir(project);
  command(
    'npm',
    ['install', '--ignore-scripts', '--no-audit', '--no-fund', resolve(root, packed.filename)],
    project,
  );
  const env = { ...cleanEnv, HOME: project, USERPROFILE: project };
  assert.equal(
    command('npx', ['--no', '--offline', '@kostysh/skills', '--version'], project, env).trim(),
    pkg.version,
  );
  command('npx', ['--no', '--offline', '@kostysh/skills', '--help'], project, env);
  const fixture = await release(root);
  const file = join(root, 'http.json');
  await writeFile(file, JSON.stringify({ catalog: fixture.catalog, out: fixture.out }));
  const preload = pathToFileURL(fileURLToPath(new URL('./http-fixture.ts', import.meta.url))).href;
  const isolatedEnv = { ...env, NODE_OPTIONS: `--import=${preload}`, KSKILLS_TEST_FIXTURE: file };
  const bin = join(project, 'node_modules/@kostysh/skills/dist/cli.mjs');
  assert.match(
    command(
      process.execPath,
      [bin, 'install', 'example', '--target', 'custom', '--path', '.agents/skills'],
      project,
      isolatedEnv,
    ),
    /Installed/,
  );
  assert.equal(
    command(process.execPath, [bin, 'update'], project, isolatedEnv),
    'All up to date\n',
  );
  const invalid = spawnSync(process.execPath, [bin, '--unknown'], {
    cwd: project,
    env,
    encoding: 'utf8',
  });
  assert.equal(invalid.status, 2);
  // pnpx is the alias for pnpm dlx; execute the packed package with the same runner.
  assert.equal(
    command('pnpm', ['dlx', resolve(root, packed.filename), '--version'], project, env).trim(),
    pkg.version,
  );
  console.log(
    'Verified tarball contents, clean installation, npx, pnpx/dlx, install/update and failure paths. HTTP uses a release-shaped fixture; this check does not verify an npm publication.',
  );
} finally {
  await rm(root, { recursive: true, force: true });
}
