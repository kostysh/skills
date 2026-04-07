import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { DELETE_BACKLOG_COMMAND } from '../src/commands/delete-backlog.ts';
import { BacklogError } from '../src/errors/index.ts';
import { createRuntime } from '../src/runtime/index.ts';
import { DeleteBacklogCommandOutputSchema } from '../src/schemas/index.ts';

async function createTempDir(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), 'backlog-engineer-delete-command-'));
}

async function initializeBacklogRoot(cwd: string, backlogRoot: string): Promise<void> {
  const runtime = createRuntime({
    dependencies: {
      clock: {
        nowIsoUtc() {
          return '2026-04-06T12:00:00.000Z';
        },
      },
    },
  });
  const initContext = await runtime.createContext('init', cwd);
  await initContext.artifacts.initializeBacklogRoot({
    root: backlogRoot,
    createdAt: initContext.host.nowIsoUtc(),
    agentsContent: initContext.templates.renderBacklogAgentsTemplate(),
  });
}

void test('delete-backlog command removes managed artifacts and prunes an empty backlog root', async () => {
  const cwd = await createTempDir();
  const backlogRoot = path.join(cwd, 'backlog');
  const runtime = createRuntime();

  try {
    await initializeBacklogRoot(cwd, backlogRoot);
    const context = await runtime.createContext('delete-backlog', backlogRoot);

    const output = await DELETE_BACKLOG_COMMAND.execute({ confirm: true }, context);

    assert.deepEqual(DeleteBacklogCommandOutputSchema.parse(output), {
      deleted_path: '.',
      deleted: true,
    });
    assert.equal(context.backlogRoot, backlogRoot);
    await assert.rejects(() => access(backlogRoot));
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('delete-backlog command rejects a backlog root with foreign entries without deleting managed artifacts', async () => {
  const cwd = await createTempDir();
  const backlogRoot = path.join(cwd, 'backlog');
  const runtime = createRuntime();

  try {
    await initializeBacklogRoot(cwd, backlogRoot);
    await writeFile(path.join(backlogRoot, 'README.txt'), 'keep me\n', 'utf8');
    const context = await runtime.createContext('delete-backlog', backlogRoot);

    await assert.rejects(
      async () => {
        await DELETE_BACKLOG_COMMAND.execute({ confirm: true }, context);
      },
      (error: unknown) =>
        error instanceof BacklogError && error.code === 'BE_INTERNAL_STATE_CORRUPT',
    );

    const stat = await context.artifacts.readRootMarker(backlogRoot);
    assert.equal(stat.tool_name, '@kostysh/backlog-engineer-cli');
    assert.equal(await readFile(path.join(backlogRoot, 'README.txt'), 'utf8'), 'keep me\n');
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('delete-backlog command preserves user gitignore content and removes only the managed section', async () => {
  const cwd = await createTempDir();
  const backlogRoot = path.join(cwd, 'backlog');
  const runtime = createRuntime();

  try {
    await initializeBacklogRoot(cwd, backlogRoot);
    await writeFile(
      path.join(backlogRoot, '.gitignore'),
      [
        'node_modules/',
        '# backlog-engineer managed start',
        '/.backlog/mutation.lock',
        '# backlog-engineer managed end',
        '',
      ].join('\n'),
      'utf8',
    );
    const context = await runtime.createContext('delete-backlog', backlogRoot);

    const output = await DELETE_BACKLOG_COMMAND.execute({ confirm: true }, context);

    assert.deepEqual(DeleteBacklogCommandOutputSchema.parse(output), {
      deleted_path: '.',
      deleted: true,
    });
    assert.equal(await readFile(path.join(backlogRoot, '.gitignore'), 'utf8'), 'node_modules/\n');
    await assert.rejects(() => readFile(path.join(backlogRoot, '.backlog.json'), 'utf8'));
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('delete-backlog command prevalidates managed files before removing the root marker', async () => {
  const cwd = await createTempDir();
  const backlogRoot = path.join(cwd, 'backlog');
  const runtime = createRuntime();

  try {
    await initializeBacklogRoot(cwd, backlogRoot);
    await rm(path.join(backlogRoot, '.gitignore'), { force: true });
    await writeFile(path.join(cwd, 'foreign-gitignore'), 'keep\n', 'utf8');
    await symlink(
      path.join(cwd, 'foreign-gitignore'),
      path.join(backlogRoot, '.gitignore'),
      'file',
    );
    const context = await runtime.createContext('delete-backlog', backlogRoot);

    await assert.rejects(
      async () => {
        await DELETE_BACKLOG_COMMAND.execute({ confirm: true }, context);
      },
      (error: unknown) =>
        error instanceof BacklogError && error.code === 'BE_INTERNAL_STATE_CORRUPT',
    );

    assert.equal(
      await readFile(path.join(backlogRoot, '.backlog.json'), 'utf8').then(Boolean),
      true,
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('delete-backlog command restores cwd on failure when launched from inside backlog root', async () => {
  const cwd = await createTempDir();
  const backlogRoot = path.join(cwd, 'backlog');
  const runtime = createRuntime();
  const originalCwd = process.cwd();

  try {
    await initializeBacklogRoot(cwd, backlogRoot);
    await writeFile(path.join(backlogRoot, 'README.txt'), 'keep me\n', 'utf8');
    process.chdir(backlogRoot);
    const context = await runtime.createContext('delete-backlog', process.cwd());

    await assert.rejects(
      async () => {
        await DELETE_BACKLOG_COMMAND.execute({ confirm: true }, context);
      },
      (error: unknown) =>
        error instanceof BacklogError && error.code === 'BE_INTERNAL_STATE_CORRUPT',
    );

    assert.equal(process.cwd(), backlogRoot);
  } finally {
    process.chdir(originalCwd);
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('delete-backlog command rejects backlog roots not owned by this tool', async () => {
  const cwd = await createTempDir();
  const backlogRoot = path.join(cwd, 'backlog');
  const runtime = createRuntime();

  try {
    await initializeBacklogRoot(cwd, backlogRoot);
    await writeFile(
      path.join(backlogRoot, '.backlog.json'),
      JSON.stringify(
        {
          schema_version: 1,
          tool_name: '@other/tool',
          created_at: '2026-04-06T12:00:00.000Z',
          layout_version: 1,
        },
        null,
        2,
      ),
      'utf8',
    );
    const context = await runtime.createContext('delete-backlog', backlogRoot);

    await assert.rejects(
      async () => {
        await DELETE_BACKLOG_COMMAND.execute({ confirm: true }, context);
      },
      (error: unknown) => error instanceof BacklogError && error.code === 'BE_ROOT_NOT_FOUND',
    );

    assert.equal(
      await readFile(path.join(backlogRoot, '.backlog.json'), 'utf8').then(Boolean),
      true,
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
