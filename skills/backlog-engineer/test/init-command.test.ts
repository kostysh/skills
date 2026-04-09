import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { INIT_COMMAND } from '../src/commands/init.ts';
import { BacklogError } from '../src/errors/index.ts';
import { createRuntime } from '../src/runtime/index.ts';
import {
  AppliedRegistryFileSchema,
  RootMarkerFileSchema,
  SourceRegistryFileSchema,
  StateFileSchema,
} from '../src/schemas/index.ts';
import { renderBacklogAgentsTemplate } from '../src/templates/render-agents-template.ts';

async function createTempDir(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), 'backlog-engineer-init-'));
}

void test('init command creates the full backlog bootstrap layout through runtime and artifacts', async () => {
  const cwd = await createTempDir();
  const runtime = createRuntime({
    dependencies: {
      clock: {
        nowIsoUtc() {
          return '2026-04-06T12:00:00.000Z';
        },
      },
    },
  });

  try {
    const context = await runtime.createContext('init', cwd);
    const output = await INIT_COMMAND.execute({ path: './backlog' }, context);
    const backlogRoot = path.join(cwd, 'backlog');

    assert.deepEqual(output, {
      path: backlogRoot,
      root_marker_path: path.join(backlogRoot, '.backlog.json'),
      agents_path: path.join(backlogRoot, 'AGENTS.md'),
    });

    assert.deepEqual(
      RootMarkerFileSchema.parse(
        JSON.parse(await readFile(output.root_marker_path, 'utf8')) as unknown,
      ),
      {
        schema_version: 1,
        tool_name: '@kostysh/backlog-engineer-cli',
        created_at: '2026-04-06T12:00:00.000Z',
        layout_version: 1,
      },
    );
    assert.deepEqual(
      SourceRegistryFileSchema.parse(
        JSON.parse(
          await readFile(path.join(backlogRoot, '.backlog', 'sources.json'), 'utf8'),
        ) as unknown,
      ),
      {
        schema_version: 1,
        created_at: '2026-04-06T12:00:00.000Z',
        updated_at: '2026-04-06T12:00:00.000Z',
        sources: [],
      },
    );
    assert.deepEqual(
      AppliedRegistryFileSchema.parse(
        JSON.parse(
          await readFile(path.join(backlogRoot, '.backlog', 'applied.json'), 'utf8'),
        ) as unknown,
      ),
      {
        schema_version: 1,
        created_at: '2026-04-06T12:00:00.000Z',
        updated_at: '2026-04-06T12:00:00.000Z',
        next_apply_index: 1,
        packets: [],
        patches: [],
      },
    );
    assert.deepEqual(
      StateFileSchema.parse(
        JSON.parse(
          await readFile(path.join(backlogRoot, '.backlog', 'state.json'), 'utf8'),
        ) as unknown,
      ),
      {
        schema_version: 1,
        created_at: '2026-04-06T12:00:00.000Z',
        updated_at: '2026-04-06T12:00:00.000Z',
        last_refresh_at: null,
        context: {
          glossary: [],
          key_strategy: {},
          target_system: [],
          as_built: [],
          claims: [],
          contracts: [],
          data_domains: [],
          quality_attributes: [],
          policy_decisions: [],
        },
        items: [],
        todos: [],
      },
    );
    assert.equal(await readFile(output.agents_path, 'utf8'), renderBacklogAgentsTemplate());
    assert.equal(
      await readFile(path.join(backlogRoot, '.gitignore'), 'utf8'),
      '# backlog-engineer managed start\n/.backlog/mutation.lock\n# backlog-engineer managed end\n',
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('init command preserves existing .gitignore and adds managed lock section', async () => {
  const cwd = await createTempDir();
  const runtime = createRuntime({
    dependencies: {
      clock: {
        nowIsoUtc() {
          return '2026-04-06T12:00:00.000Z';
        },
      },
    },
  });
  const backlogRoot = path.join(cwd, 'backlog');

  try {
    await mkdir(backlogRoot, { recursive: true });
    await writeFile(path.join(backlogRoot, '.gitignore'), 'node_modules/\n', 'utf8');

    const context = await runtime.createContext('init', cwd);
    await INIT_COMMAND.execute({ path: './backlog' }, context);

    assert.equal(
      await readFile(path.join(backlogRoot, '.gitignore'), 'utf8'),
      'node_modules/\n# backlog-engineer managed start\n/.backlog/mutation.lock\n# backlog-engineer managed end\n',
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('init command collapses duplicate managed gitignore sections to one canonical block', async () => {
  const cwd = await createTempDir();
  const runtime = createRuntime({
    dependencies: {
      clock: {
        nowIsoUtc() {
          return '2026-04-06T12:00:00.000Z';
        },
      },
    },
  });
  const backlogRoot = path.join(cwd, 'backlog');

  try {
    await mkdir(backlogRoot, { recursive: true });
    await writeFile(
      path.join(backlogRoot, '.gitignore'),
      [
        'node_modules/',
        '# backlog-engineer managed start',
        '/.backlog/mutation.lock',
        '# backlog-engineer managed end',
        'dist/',
        '# backlog-engineer managed start',
        '/.backlog/mutation.lock',
        '# backlog-engineer managed end',
        '',
      ].join('\n'),
      'utf8',
    );

    const context = await runtime.createContext('init', cwd);
    await INIT_COMMAND.execute({ path: './backlog' }, context);

    assert.equal(
      await readFile(path.join(backlogRoot, '.gitignore'), 'utf8'),
      [
        'node_modules/',
        'dist/',
        '# backlog-engineer managed start',
        '/.backlog/mutation.lock',
        '# backlog-engineer managed end',
        '',
      ].join('\n'),
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('init command preserves unmatched managed marker lines as user content', async () => {
  const cwd = await createTempDir();
  const runtime = createRuntime({
    dependencies: {
      clock: {
        nowIsoUtc() {
          return '2026-04-06T12:00:00.000Z';
        },
      },
    },
  });
  const backlogRoot = path.join(cwd, 'backlog');

  try {
    await mkdir(backlogRoot, { recursive: true });
    await writeFile(
      path.join(backlogRoot, '.gitignore'),
      ['node_modules/', '# backlog-engineer managed start', 'dist/', ''].join('\n'),
      'utf8',
    );

    const context = await runtime.createContext('init', cwd);
    await INIT_COMMAND.execute({ path: './backlog' }, context);

    assert.equal(
      await readFile(path.join(backlogRoot, '.gitignore'), 'utf8'),
      [
        'node_modules/',
        '# backlog-engineer managed start',
        'dist/',
        '# backlog-engineer managed start',
        '/.backlog/mutation.lock',
        '# backlog-engineer managed end',
        '',
      ].join('\n'),
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('init command fails when backlog root already exists', async () => {
  const cwd = await createTempDir();
  const runtime = createRuntime();
  const backlogRoot = path.join(cwd, 'backlog');

  try {
    await mkdir(backlogRoot, { recursive: true });
    await writeFile(
      path.join(backlogRoot, '.backlog.json'),
      JSON.stringify({
        schema_version: 1,
        tool_name: '@kostysh/backlog-engineer-cli',
        created_at: '2026-04-06T12:00:00.000Z',
        layout_version: 1,
      }),
      'utf8',
    );

    const context = await runtime.createContext('init', cwd);

    await assert.rejects(
      async () => {
        await INIT_COMMAND.execute({ path: './backlog' }, context);
      },
      (error: unknown) => error instanceof BacklogError && error.code === 'BE_ROOT_ALREADY_EXISTS',
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('init command allows unrelated preexisting files in target directory', async () => {
  const cwd = await createTempDir();
  const runtime = createRuntime();
  const backlogRoot = path.join(cwd, 'backlog');

  try {
    await mkdir(backlogRoot, { recursive: true });
    await writeFile(path.join(backlogRoot, 'notes.md'), '# temp\n', 'utf8');
    await mkdir(path.join(backlogRoot, 'docs'), { recursive: true });
    await writeFile(path.join(backlogRoot, 'docs', 'system.md'), '# architecture\n', 'utf8');

    const context = await runtime.createContext('init', cwd);

    const output = await INIT_COMMAND.execute({ path: './backlog' }, context);

    assert.equal(output.path, backlogRoot);
    assert.equal(await readFile(path.join(backlogRoot, 'notes.md'), 'utf8'), '# temp\n');
    assert.equal(
      await readFile(path.join(backlogRoot, 'docs', 'system.md'), 'utf8'),
      '# architecture\n',
    );
    RootMarkerFileSchema.parse(
      JSON.parse(await readFile(path.join(backlogRoot, '.backlog.json'), 'utf8')) as unknown,
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('init command fails when target directory already contains conflicting managed entries', async () => {
  const cwd = await createTempDir();
  const runtime = createRuntime();
  const backlogRoot = path.join(cwd, 'backlog');

  try {
    await mkdir(path.join(backlogRoot, 'packets'), { recursive: true });
    await writeFile(path.join(backlogRoot, 'notes.md'), '# temp\n', 'utf8');

    const context = await runtime.createContext('init', cwd);

    await assert.rejects(
      async () => {
        await INIT_COMMAND.execute({ path: './backlog' }, context);
      },
      (error: unknown) =>
        error instanceof BacklogError &&
        error.code === 'BE_ROOT_NOT_EMPTY' &&
        Array.isArray(error.details?.conflicting_entries) &&
        error.details.conflicting_entries.includes('packets'),
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
