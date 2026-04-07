import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { INIT_COMMAND } from '../src/commands/init.ts';
import { LIST_SOURCES_COMMAND } from '../src/commands/list-sources.ts';
import { REGISTER_SOURCE_COMMAND } from '../src/commands/register-source.ts';
import { TEMPLATE_COMMAND } from '../src/commands/template.ts';
import { BacklogError } from '../src/errors/index.ts';
import { createNoOpRegistry } from '../src/hooks/index.ts';
import { createRuntime } from '../src/runtime/index.ts';
import { StateFileSchema, SourceRegistryFileSchema } from '../src/schemas/index.ts';
import { renderPacketTemplate } from '../src/templates/index.ts';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(TEST_DIR, 'fixtures');

async function createTempDir(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), 'backlog-engineer-sources-'));
}

function createRuntimeForTest(payload: {
  hooks?: ReturnType<typeof createNoOpRegistry>;
  uuidValue?: string;
  uuidValues?: string[];
}) {
  let uuidIndex = 0;
  return createRuntime({
    dependencies: {
      clock: {
        nowIsoUtc() {
          return '2026-04-06T12:00:00.000Z';
        },
      },
      uuid: {
        create() {
          if (payload.uuidValues && payload.uuidValues.length > 0) {
            const nextValue =
              payload.uuidValues[Math.min(uuidIndex, payload.uuidValues.length - 1)];
            if (nextValue) {
              uuidIndex += 1;
              return nextValue;
            }
          }

          return payload.uuidValue ?? '11111111-1111-4111-8111-111111111111';
        },
      },
      ...(payload.hooks ? { hooks: payload.hooks } : {}),
    },
  });
}

async function bootstrapBacklog(
  cwd: string,
  options: Parameters<typeof createRuntimeForTest>[0] = {},
) {
  const runtime = createRuntimeForTest(options);
  const initContext = await runtime.createContext('init', cwd);
  const backlogRoot = path.join(cwd, 'backlog');
  await INIT_COMMAND.execute({ path: './backlog' }, initContext);

  return {
    runtime,
    backlogRoot,
  };
}

void test('register-source stores a new source, calls afterSourceRegistered once, and stays idempotent by path', async () => {
  const cwd = await createTempDir();
  const hooks = createNoOpRegistry();
  const afterSourceRegisteredCalls: string[] = [];
  hooks.afterSourceRegistered = ({ source }) => {
    afterSourceRegisteredCalls.push(source.source_id);
    return Promise.resolve();
  };
  const runtime = createRuntimeForTest({
    hooks,
    uuidValue: '11111111-1111-4111-8111-111111111111',
  });

  try {
    const initContext = await runtime.createContext('init', cwd);
    await INIT_COMMAND.execute({ path: './backlog' }, initContext);
    const backlogRoot = path.join(cwd, 'backlog');
    const docsDir = path.join(backlogRoot, 'sources', 'docs', 'modules');
    const sourcePath = path.join(docsDir, 'auth.md');
    await mkdir(docsDir, { recursive: true });
    await writeFile(sourcePath, '# auth v1\n', 'utf8');

    const registerContext = await runtime.createContext('register-source', backlogRoot);
    const first = await REGISTER_SOURCE_COMMAND.execute(
      {
        path: './sources/docs/modules/auth.md',
        kind: 'module',
        authority: 'authoritative',
        note: 'Auth module architecture',
      },
      registerContext,
    );

    await writeFile(sourcePath, '# auth v2\n', 'utf8');

    const second = await REGISTER_SOURCE_COMMAND.execute(
      {
        path: './sources/docs/modules/auth.md',
        kind: 'module',
        authority: 'authoritative',
        note: 'Auth module architecture',
      },
      registerContext,
    );

    assert.equal(first.source_id, '11111111-1111-4111-8111-111111111111');
    assert.equal(first.source_label, 'sources/docs/modules/auth.md');
    assert.equal(first.path, 'sources/docs/modules/auth.md');
    assert.equal(second.source_id, first.source_id);
    assert.equal(second.hash, first.hash);
    assert.deepEqual(afterSourceRegisteredCalls, ['11111111-1111-4111-8111-111111111111']);

    const registry = JSON.parse(
      await readFile(path.join(backlogRoot, '.backlog', 'sources.json'), 'utf8'),
    ) as unknown;
    assert.equal(SourceRegistryFileSchema.parse(registry).sources.length, 1);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('register-source accepts source paths outside backlog root and persists them relative to the root', async () => {
  const cwd = await createTempDir();
  const runtime = createRuntimeForTest({});

  try {
    const initContext = await runtime.createContext('init', cwd);
    await INIT_COMMAND.execute({ path: './backlog' }, initContext);
    const outsideDir = path.join(cwd, 'outside');
    await mkdir(outsideDir, { recursive: true });
    await writeFile(path.join(outsideDir, 'auth.md'), '# auth\n', 'utf8');

    const registerContext = await runtime.createContext(
      'register-source',
      path.join(cwd, 'backlog'),
    );

    const output = await REGISTER_SOURCE_COMMAND.execute(
      {
        path: '../outside/auth.md',
        kind: 'module',
        authority: 'authoritative',
      },
      registerContext,
    );

    assert.equal(output.path, '../outside/auth.md');
    assert.equal(output.source_label, '../outside/auth.md');
    const registry = SourceRegistryFileSchema.parse(
      JSON.parse(
        await readFile(path.join(cwd, 'backlog', '.backlog', 'sources.json'), 'utf8'),
      ) as unknown,
    );
    assert.equal(registry.sources[0]?.path, '../outside/auth.md');
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('register-source fails with BE_SOURCE_FILE_MISSING when the target file does not exist', async () => {
  const cwd = await createTempDir();
  const runtime = createRuntimeForTest({});

  try {
    const initContext = await runtime.createContext('init', cwd);
    await INIT_COMMAND.execute({ path: './backlog' }, initContext);
    const backlogRoot = path.join(cwd, 'backlog');
    const registerContext = await runtime.createContext('register-source', backlogRoot);

    await assert.rejects(
      async () => {
        await REGISTER_SOURCE_COMMAND.execute(
          {
            path: './sources/docs/modules/missing.md',
            kind: 'module',
            authority: 'authoritative',
          },
          registerContext,
        );
      },
      (error: unknown) => error instanceof BacklogError && error.code === 'BE_SOURCE_FILE_MISSING',
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('register-source validates source kind before attempting file access', async () => {
  const cwd = await createTempDir();
  const runtime = createRuntimeForTest({});

  try {
    const initContext = await runtime.createContext('init', cwd);
    await INIT_COMMAND.execute({ path: './backlog' }, initContext);
    const backlogRoot = path.join(cwd, 'backlog');
    const registerContext = await runtime.createContext('register-source', backlogRoot);

    await assert.rejects(
      async () => {
        await REGISTER_SOURCE_COMMAND.execute(
          {
            path: './sources/docs/modules/missing.md',
            kind: 'unknown-kind',
            authority: 'authoritative',
          },
          registerContext,
        );
      },
      (error: unknown) => error instanceof BacklogError && error.code === 'BE_SOURCE_KIND_INVALID',
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('register-source validates source authority before attempting file access', async () => {
  const cwd = await createTempDir();
  const runtime = createRuntimeForTest({});

  try {
    const initContext = await runtime.createContext('init', cwd);
    await INIT_COMMAND.execute({ path: './backlog' }, initContext);
    const backlogRoot = path.join(cwd, 'backlog');
    const registerContext = await runtime.createContext('register-source', backlogRoot);

    await assert.rejects(
      async () => {
        await REGISTER_SOURCE_COMMAND.execute(
          {
            path: './sources/docs/modules/missing.md',
            kind: 'module',
            authority: 'unknown-authority',
          },
          registerContext,
        );
      },
      (error: unknown) =>
        error instanceof BacklogError && error.code === 'BE_SOURCE_AUTHORITY_INVALID',
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('register-source rejects non-regular source files with BE_SOURCE_READ_FAILED', async () => {
  const cwd = await createTempDir();
  const runtime = createRuntimeForTest({});

  try {
    const initContext = await runtime.createContext('init', cwd);
    await INIT_COMMAND.execute({ path: './backlog' }, initContext);
    const backlogRoot = path.join(cwd, 'backlog');
    const docsDir = path.join(backlogRoot, 'sources', 'docs', 'modules');
    await mkdir(path.join(docsDir, 'auth-dir'), { recursive: true });

    const registerContext = await runtime.createContext('register-source', backlogRoot);

    await assert.rejects(
      async () => {
        await REGISTER_SOURCE_COMMAND.execute(
          {
            path: './sources/docs/modules/auth-dir',
            kind: 'module',
            authority: 'authoritative',
          },
          registerContext,
        );
      },
      (error: unknown) => error instanceof BacklogError && error.code === 'BE_SOURCE_READ_FAILED',
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('register-source rejects symbolic-link source files with BE_SOURCE_READ_FAILED', async () => {
  const cwd = await createTempDir();
  const runtime = createRuntimeForTest({});

  try {
    const initContext = await runtime.createContext('init', cwd);
    await INIT_COMMAND.execute({ path: './backlog' }, initContext);
    const backlogRoot = path.join(cwd, 'backlog');
    const docsDir = path.join(backlogRoot, 'sources', 'docs', 'modules');
    await mkdir(docsDir, { recursive: true });
    const realPath = path.join(docsDir, 'auth-real.md');
    const linkedPath = path.join(docsDir, 'auth-link.md');
    await writeFile(realPath, '# auth\n', 'utf8');
    await symlink(realPath, linkedPath, 'file');

    const registerContext = await runtime.createContext('register-source', backlogRoot);

    await assert.rejects(
      async () => {
        await REGISTER_SOURCE_COMMAND.execute(
          {
            path: './sources/docs/modules/auth-link.md',
            kind: 'module',
            authority: 'authoritative',
          },
          registerContext,
        );
      },
      (error: unknown) => error instanceof BacklogError && error.code === 'BE_SOURCE_READ_FAILED',
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('register-source rejects oversized source files with BE_SOURCE_READ_FAILED', async () => {
  const cwd = await createTempDir();
  const runtime = createRuntimeForTest({});

  try {
    const initContext = await runtime.createContext('init', cwd);
    await INIT_COMMAND.execute({ path: './backlog' }, initContext);
    const backlogRoot = path.join(cwd, 'backlog');
    const docsDir = path.join(backlogRoot, 'sources', 'docs', 'modules');
    await mkdir(docsDir, { recursive: true });
    await writeFile(path.join(docsDir, 'too-large.md'), 'a'.repeat(10 * 1024 * 1024 + 1), 'utf8');

    const registerContext = await runtime.createContext('register-source', backlogRoot);

    await assert.rejects(
      async () => {
        await REGISTER_SOURCE_COMMAND.execute(
          {
            path: './sources/docs/modules/too-large.md',
            kind: 'module',
            authority: 'authoritative',
          },
          registerContext,
        );
      },
      (error: unknown) => error instanceof BacklogError && error.code === 'BE_SOURCE_READ_FAILED',
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('list-sources returns deterministic ordering and supports item and path filters', async () => {
  const cwd = await createTempDir();
  const runtime = createRuntimeForTest({
    uuidValues: ['22222222-2222-4222-8222-222222222222'],
  });
  const backlogRoot = path.join(cwd, 'backlog');

  try {
    await cp(path.join(FIXTURES_DIR, 'backlogs', 'single-branch-backlog'), backlogRoot, {
      recursive: true,
    });
    const docsDir = path.join(backlogRoot, 'sources', 'docs', 'modules');
    await mkdir(docsDir, { recursive: true });
    await writeFile(path.join(docsDir, 'session-ui.md'), '# session\n', 'utf8');
    const registerContext = await runtime.createContext('register-source', backlogRoot);

    const sessionSource = await REGISTER_SOURCE_COMMAND.execute(
      {
        path: './sources/docs/modules/session-ui.md',
        kind: 'module',
        authority: 'authoritative',
      },
      registerContext,
    );

    const listContext = await runtime.createContext('list-sources', backlogRoot);

    const allSources = await LIST_SOURCES_COMMAND.execute({}, listContext);
    const itemSources = await LIST_SOURCES_COMMAND.execute({ item_key: 'auth-core' }, listContext);
    const pathSources = await LIST_SOURCES_COMMAND.execute(
      { path: './sources/docs/modules/session-ui.md' },
      listContext,
    );

    assert.deepEqual(
      allSources.map((source) => source.source_label),
      ['sources/docs/modules/auth.md', 'sources/docs/modules/session-ui.md'],
    );
    assert.deepEqual(
      itemSources.map((source) => source.source_id),
      ['11111111-1111-4111-8111-111111111111'],
    );
    assert.deepEqual(
      pathSources.map((source) => source.source_id),
      [sessionSource.source_id],
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('template packet writes the canonical empty packet skeleton', async () => {
  const cwd = await createTempDir();
  const { runtime } = await bootstrapBacklog(cwd);

  try {
    const templateContext = await runtime.createContext('template', path.join(cwd, 'backlog'));
    const output = await TEMPLATE_COMMAND.execute(
      {
        mode: 'packet',
        out: './drafts/',
      },
      templateContext,
    );

    assert.equal(output.mode, 'packet');
    assert.equal(output.output_path, path.join(cwd, 'backlog', 'drafts', 'packet.template.json'));
    assert.equal(await readFile(output.output_path, 'utf8'), renderPacketTemplate());
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('template packet writes to an explicit file target path', async () => {
  const cwd = await createTempDir();
  const { runtime } = await bootstrapBacklog(cwd);

  try {
    const backlogRoot = path.join(cwd, 'backlog');
    const templateContext = await runtime.createContext('template', backlogRoot);
    const output = await TEMPLATE_COMMAND.execute(
      {
        mode: 'packet',
        out: './drafts/custom-packet.json',
      },
      templateContext,
    );

    assert.equal(output.mode, 'packet');
    assert.equal(output.output_path, path.join(backlogRoot, 'drafts', 'custom-packet.json'));
    assert.equal(await readFile(output.output_path, 'utf8'), renderPacketTemplate());
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('template patch validates item keys and uses max(sequence) + 1 for the generated draft', async () => {
  const cwd = await createTempDir();
  const runtime = createRuntimeForTest({
    uuidValues: ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222'],
  });
  const backlogRoot = path.join(cwd, 'backlog');

  try {
    await cp(path.join(FIXTURES_DIR, 'backlogs', 'single-branch-backlog'), backlogRoot, {
      recursive: true,
    });
    const templateContext = await runtime.createContext('template', backlogRoot);

    const output = await TEMPLATE_COMMAND.execute(
      {
        mode: 'patch',
        out: './drafts/',
        item_keys: ['auth-core'],
      },
      templateContext,
    );

    assert.equal(output.mode, 'patch');
    assert.equal(output.output_path, path.join(backlogRoot, 'drafts', '002-patch.template.json'));
    const draft = JSON.parse(await readFile(output.output_path, 'utf8')) as {
      metadata: {
        patch_id: string;
        created_at: string;
        sequence: number;
        target_item_keys: string[];
      };
      operations: unknown[];
    };
    assert.equal(draft.metadata.created_at, '2026-04-06T12:00:00.000Z');
    assert.equal(draft.metadata.sequence, 2);
    assert.deepEqual(draft.metadata.target_item_keys, ['auth-core']);
    assert.match(draft.metadata.patch_id, /^2026-04-06-002-patch-template-[a-f0-9]{8}$/);
    assert.deepEqual(draft.operations, []);

    const secondOutput = await TEMPLATE_COMMAND.execute(
      {
        mode: 'patch',
        out: './drafts/',
        item_keys: ['auth-core'],
      },
      templateContext,
    );
    assert.notEqual(secondOutput.output_path, output.output_path);
    assert.match(secondOutput.output_path, /drafts\/002-[a-f0-9]{8}-patch\.template\.json$/);
    const secondDraft = JSON.parse(await readFile(secondOutput.output_path, 'utf8')) as {
      metadata: { patch_id: string };
    };
    assert.notEqual(secondDraft.metadata.patch_id, draft.metadata.patch_id);

    await assert.rejects(
      async () => {
        await TEMPLATE_COMMAND.execute(
          {
            mode: 'patch',
            out: './drafts/',
            item_keys: ['missing-item'],
          },
          templateContext,
        );
      },
      (error: unknown) => error instanceof BacklogError && error.code === 'BE_ITEM_NOT_FOUND',
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('template patch writes to an explicit file target path', async () => {
  const cwd = await createTempDir();
  const runtime = createRuntimeForTest({
    uuidValues: ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222'],
  });
  const backlogRoot = path.join(cwd, 'backlog');

  try {
    await cp(path.join(FIXTURES_DIR, 'backlogs', 'single-branch-backlog'), backlogRoot, {
      recursive: true,
    });
    const templateContext = await runtime.createContext('template', backlogRoot);

    const output = await TEMPLATE_COMMAND.execute(
      {
        mode: 'patch',
        out: './drafts/custom-patch.json',
        item_keys: ['auth-core'],
      },
      templateContext,
    );

    assert.equal(output.mode, 'patch');
    assert.equal(output.output_path, path.join(backlogRoot, 'drafts', 'custom-patch.json'));
    const draft = JSON.parse(await readFile(output.output_path, 'utf8')) as {
      metadata: {
        patch_id: string;
        created_at: string;
        sequence: number;
        target_item_keys: string[];
      };
      operations: unknown[];
    };
    assert.equal(draft.metadata.created_at, '2026-04-06T12:00:00.000Z');
    assert.equal(draft.metadata.sequence, 2);
    assert.deepEqual(draft.metadata.target_item_keys, ['auth-core']);
    assert.match(draft.metadata.patch_id, /^2026-04-06-002-patch-template-[a-f0-9]{8}$/);
    assert.deepEqual(draft.operations, []);

    await TEMPLATE_COMMAND.execute(
      {
        mode: 'patch',
        out: './drafts/custom-patch.json',
        item_keys: ['auth-core'],
      },
      templateContext,
    );
    const overwrittenDraft = JSON.parse(await readFile(output.output_path, 'utf8')) as {
      metadata: { patch_id: string };
    };
    assert.notEqual(overwrittenDraft.metadata.patch_id, draft.metadata.patch_id);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('list-sources with --item-key rebuilds missing state.json before filtering', async () => {
  const cwd = await createTempDir();
  const runtime = createRuntimeForTest({});
  const backlogRoot = path.join(cwd, 'backlog');

  try {
    await cp(path.join(FIXTURES_DIR, 'backlogs', 'single-branch-backlog'), backlogRoot, {
      recursive: true,
    });
    await rm(path.join(backlogRoot, '.backlog', 'state.json'));

    const context = await runtime.createContext('list-sources', backlogRoot);
    const output = await LIST_SOURCES_COMMAND.execute({ item_key: 'auth-core' }, context);

    assert.deepEqual(
      output.map((source) => source.source_label),
      ['sources/docs/modules/auth.md'],
    );
    StateFileSchema.parse(
      JSON.parse(
        await readFile(path.join(backlogRoot, '.backlog', 'state.json'), 'utf8'),
      ) as unknown,
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('list-sources with --item-key fails when rebuild detects missing source registry entries', async () => {
  const cwd = await createTempDir();
  const runtime = createRuntimeForTest({});
  const backlogRoot = path.join(cwd, 'backlog');

  try {
    await cp(path.join(FIXTURES_DIR, 'backlogs', 'single-branch-backlog'), backlogRoot, {
      recursive: true,
    });
    const sourcesPath = path.join(backlogRoot, '.backlog', 'sources.json');
    const registry = JSON.parse(await readFile(sourcesPath, 'utf8')) as {
      schema_version: number;
      created_at: string;
      updated_at: string;
      sources: unknown[];
    };
    registry.sources = [];
    await writeFile(sourcesPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
    await rm(path.join(backlogRoot, '.backlog', 'state.json'));

    const context = await runtime.createContext('list-sources', backlogRoot);
    await assert.rejects(
      async () => {
        await LIST_SOURCES_COMMAND.execute({ item_key: 'auth-core' }, context);
      },
      (error: unknown) =>
        error instanceof BacklogError && error.code === 'BE_INTERNAL_STATE_CORRUPT',
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('template patch rebuilds missing state.json before validating item keys', async () => {
  const cwd = await createTempDir();
  const runtime = createRuntimeForTest({
    uuidValues: ['11111111-1111-4111-8111-111111111111'],
  });
  const backlogRoot = path.join(cwd, 'backlog');

  try {
    await cp(path.join(FIXTURES_DIR, 'backlogs', 'single-branch-backlog'), backlogRoot, {
      recursive: true,
    });
    await rm(path.join(backlogRoot, '.backlog', 'state.json'));

    const context = await runtime.createContext('template', backlogRoot);
    const output = await TEMPLATE_COMMAND.execute(
      {
        mode: 'patch',
        out: './drafts/',
        item_keys: ['auth-core'],
      },
      context,
    );

    assert.equal(output.mode, 'patch');
    assert.equal(output.output_path, path.join(backlogRoot, 'drafts', '002-patch.template.json'));
    const draft = JSON.parse(await readFile(output.output_path, 'utf8')) as {
      metadata: { sequence: number; target_item_keys: string[] };
    };
    assert.equal(draft.metadata.sequence, 2);
    assert.deepEqual(draft.metadata.target_item_keys, ['auth-core']);
    StateFileSchema.parse(
      JSON.parse(
        await readFile(path.join(backlogRoot, '.backlog', 'state.json'), 'utf8'),
      ) as unknown,
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('template patch rejects applied registry with duplicate patch sequence', async () => {
  const cwd = await createTempDir();
  const runtime = createRuntimeForTest({});
  const backlogRoot = path.join(cwd, 'backlog');

  try {
    await cp(path.join(FIXTURES_DIR, 'backlogs', 'single-branch-backlog'), backlogRoot, {
      recursive: true,
    });
    const appliedPath = path.join(backlogRoot, '.backlog', 'applied.json');
    const applied = JSON.parse(await readFile(appliedPath, 'utf8')) as {
      schema_version: number;
      created_at: string;
      updated_at: string;
      next_apply_index: number;
      packets: unknown[];
      patches: Array<{
        patch_id: string;
        apply_index: number;
        canonical_path: string;
        content_hash: string;
        sequence: number;
        applied_at: string;
        kind: string;
        target_item_keys: string[];
      }>;
    };
    applied.patches.push({
      patch_id: '2026-04-03-002-auth-progress',
      apply_index: 3,
      canonical_path: 'patches/222c4f042c00--auth-module.patch-item.json',
      content_hash: '2'.repeat(64),
      sequence: 1,
      applied_at: '2026-04-03T12:25:00Z',
      kind: 'patch-item',
      target_item_keys: ['auth-core'],
    });
    await writeFile(appliedPath, `${JSON.stringify(applied, null, 2)}\n`, 'utf8');

    const context = await runtime.createContext('template', backlogRoot);
    await assert.rejects(
      async () => {
        await TEMPLATE_COMMAND.execute(
          {
            mode: 'patch',
            out: './drafts/',
            item_keys: ['auth-core'],
          },
          context,
        );
      },
      (error: unknown) =>
        error instanceof BacklogError && error.code === 'BE_PATCH_SEQUENCE_CONFLICT',
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('template packet rejects explicit directory output when the target already exists as a file', async () => {
  const cwd = await createTempDir();
  const { runtime } = await bootstrapBacklog(cwd);

  try {
    const backlogRoot = path.join(cwd, 'backlog');
    await mkdir(path.join(backlogRoot, 'drafts'), { recursive: true });
    await writeFile(path.join(backlogRoot, 'drafts', 'occupied'), 'existing\n', 'utf8');
    const context = await runtime.createContext('template', backlogRoot);

    await assert.rejects(
      async () => {
        await TEMPLATE_COMMAND.execute(
          {
            mode: 'packet',
            out: './drafts/occupied/',
          },
          context,
        );
      },
      (error: unknown) =>
        error instanceof BacklogError && error.code === 'BE_TEMPLATE_OUTPUT_INVALID',
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
