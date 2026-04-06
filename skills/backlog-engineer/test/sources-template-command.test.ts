import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { INIT_COMMAND } from '../src/commands/init.ts';
import { LIST_SOURCES_COMMAND } from '../src/commands/list-sources.ts';
import { REGISTER_SOURCE_COMMAND } from '../src/commands/register-source.ts';
import { TEMPLATE_COMMAND } from '../src/commands/template.ts';
import { BacklogError } from '../src/errors/index.ts';
import { createNoOpRegistry } from '../src/hooks/index.ts';
import { createRuntime } from '../src/runtime/index.ts';
import {
  AppliedRegistryFileSchema,
  SourceRegistryFileSchema,
  StateFileSchema,
  type StateFile,
} from '../src/schemas/index.ts';
import { renderPacketTemplate } from '../src/templates/index.ts';

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

async function bootstrapBacklog(cwd: string) {
  const runtime = createRuntimeForTest({});
  const initContext = await runtime.createContext('init', cwd);
  const backlogRoot = path.join(cwd, 'backlog');
  await INIT_COMMAND.execute({ path: './backlog' }, initContext);

  return {
    runtime,
    backlogRoot,
  };
}

function createStateItem(payload: {
  itemKey: string;
  sourceIds: string[];
}): StateFile['items'][number] {
  return {
    item_key: payload.itemKey,
    title: 'Auth item',
    type: 'module-task',
    delivery_state: 'defined',
    gaps: [],
    depends_on_keys: [],
    origin_source_ids: payload.sourceIds,
    specification_source_ids: [],
    plan_source_ids: [],
    implementation_source_ids: [],
    test_source_ids: [],
    claim_keys: [],
    contract_keys: [],
    data_domain_keys: [],
    quality_attribute_keys: [],
    policy_decision_keys: [],
    reverse_dependency_keys: [],
    open_todo_ids: [],
    needs_attention: false,
    attention_reason_codes: [],
    attention_reasons: [],
    ready_for_next_step: true,
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

void test('register-source rejects source paths outside backlog root before creating a source record', async () => {
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

    await assert.rejects(
      async () => {
        await REGISTER_SOURCE_COMMAND.execute(
          {
            path: '../outside/auth.md',
            kind: 'module',
            authority: 'authoritative',
          },
          registerContext,
        );
      },
      (error: unknown) => error instanceof BacklogError && error.code === 'BE_SCHEMA_INVALID',
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

void test('list-sources returns deterministic ordering and supports item and path filters', async () => {
  const cwd = await createTempDir();
  const runtime = createRuntimeForTest({
    uuidValues: ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222'],
  });

  try {
    const initContext = await runtime.createContext('init', cwd);
    await INIT_COMMAND.execute({ path: './backlog' }, initContext);
    const backlogRoot = path.join(cwd, 'backlog');
    const docsDir = path.join(backlogRoot, 'sources', 'docs', 'modules');
    await mkdir(docsDir, { recursive: true });
    await writeFile(path.join(docsDir, 'session-ui.md'), '# session\n', 'utf8');
    await writeFile(path.join(docsDir, 'auth.md'), '# auth\n', 'utf8');
    const registerContext = await runtime.createContext('register-source', backlogRoot);

    const sessionSource = await REGISTER_SOURCE_COMMAND.execute(
      {
        path: './sources/docs/modules/session-ui.md',
        kind: 'module',
        authority: 'authoritative',
      },
      registerContext,
    );
    const authSource = await REGISTER_SOURCE_COMMAND.execute(
      {
        path: './sources/docs/modules/auth.md',
        kind: 'module',
        authority: 'authoritative',
      },
      registerContext,
    );

    const listContext = await runtime.createContext('list-sources', backlogRoot);
    const state = StateFileSchema.parse(
      JSON.parse(
        await readFile(path.join(backlogRoot, '.backlog', 'state.json'), 'utf8'),
      ) as unknown,
    );
    await listContext.artifacts.writeState(backlogRoot, {
      ...state,
      items: [
        createStateItem({
          itemKey: 'auth-core',
          sourceIds: [authSource.source_id],
        }),
      ],
    });

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
      [authSource.source_id],
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

void test('template patch validates item keys and uses max(sequence) + 1 for the generated draft', async () => {
  const cwd = await createTempDir();
  const { runtime, backlogRoot } = await bootstrapBacklog(cwd);

  try {
    const templateContext = await runtime.createContext('template', backlogRoot);
    const state = StateFileSchema.parse(
      JSON.parse(
        await readFile(path.join(backlogRoot, '.backlog', 'state.json'), 'utf8'),
      ) as unknown,
    );
    await templateContext.artifacts.writeState(backlogRoot, {
      ...state,
      items: [createStateItem({ itemKey: 'auth-core', sourceIds: [] })],
    });

    const appliedRegistry = AppliedRegistryFileSchema.parse(
      JSON.parse(
        await readFile(path.join(backlogRoot, '.backlog', 'applied.json'), 'utf8'),
      ) as unknown,
    );
    await templateContext.artifacts.writeAppliedRegistry(backlogRoot, {
      ...appliedRegistry,
      updated_at: '2026-04-06T12:00:00.000Z',
      patches: [
        {
          patch_id: '2026-04-05-003-auth-progress',
          apply_index: 1,
          canonical_path: 'patches/123456789abc--auth-progress.patch.json',
          content_hash: 'a'.repeat(64),
          sequence: 3,
          applied_at: '2026-04-05T09:00:00.000Z',
          kind: 'patch-item',
          target_item_keys: ['auth-core'],
        },
      ],
    });

    const output = await TEMPLATE_COMMAND.execute(
      {
        mode: 'patch',
        out: './drafts/',
        item_keys: ['auth-core'],
      },
      templateContext,
    );

    assert.equal(output.mode, 'patch');
    assert.equal(output.output_path, path.join(backlogRoot, 'drafts', '004-patch.template.json'));
    assert.deepEqual(JSON.parse(await readFile(output.output_path, 'utf8')) as unknown, {
      metadata: {
        patch_id: '2026-04-06-004-patch-template',
        created_at: '2026-04-06T12:00:00.000Z',
        sequence: 4,
        target_item_keys: ['auth-core'],
      },
      operations: [],
    });

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
