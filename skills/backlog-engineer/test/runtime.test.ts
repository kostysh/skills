import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { BacklogError, type ErrorModule } from '../src/errors/index.ts';
import { createNoOpRegistry } from '../src/hooks/index.ts';
import { RootMarkerFileSchema, StateFileSchema } from '../src/schemas/index.ts';
import {
  createNodeRuntimeDependencies,
  createRuntime,
  findBacklogRoot,
} from '../src/runtime/index.ts';

async function createTempDir(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), 'backlog-engineer-runtime-'));
}

async function writeRootMarker(root: string): Promise<void> {
  const marker = RootMarkerFileSchema.parse({
    schema_version: 1,
    tool_name: '@kostysh/backlog-engineer-cli',
    created_at: '2026-04-06T12:00:00Z',
    layout_version: 1,
  });

  await writeFile(path.join(root, '.backlog.json'), JSON.stringify(marker, null, 2), 'utf8');
}

function createMinimalState() {
  return StateFileSchema.parse({
    schema_version: 1,
    created_at: '2026-04-06T12:00:00Z',
    updated_at: '2026-04-06T12:00:00Z',
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
  });
}

void test('findBacklogRoot returns the nearest backlog root from a nested directory', async () => {
  const root = await createTempDir();
  const nested = path.join(root, 'nested', 'child');

  await mkdir(nested, { recursive: true });
  await writeRootMarker(root);

  try {
    const dependencies = createNodeRuntimeDependencies();
    const backlogRoot = await findBacklogRoot(dependencies.fs, dependencies.path, nested);

    assert.equal(backlogRoot, root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

void test('findBacklogRoot ignores non-file .backlog.json entries', async () => {
  const root = await createTempDir();
  const nested = path.join(root, 'nested');

  await mkdir(path.join(root, '.backlog.json'), { recursive: true });
  await mkdir(nested, { recursive: true });

  try {
    const dependencies = createNodeRuntimeDependencies();
    const backlogRoot = await findBacklogRoot(dependencies.fs, dependencies.path, nested);

    assert.equal(backlogRoot, undefined);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

void test('findBacklogRoot ignores symlinked .backlog.json markers', async () => {
  const root = await createTempDir();
  const nested = path.join(root, 'nested');
  const realMarker = path.join(root, 'real-marker.json');

  await writeFile(realMarker, '{}', 'utf8');
  await symlink(realMarker, path.join(root, '.backlog.json'), 'file');
  await mkdir(nested, { recursive: true });

  try {
    const dependencies = createNodeRuntimeDependencies();
    const backlogRoot = await findBacklogRoot(dependencies.fs, dependencies.path, nested);

    assert.equal(backlogRoot, undefined);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

void test('createContext allows init without existing backlog root', async () => {
  const root = await createTempDir();
  const runtime = createRuntime();

  try {
    const context = await runtime.createContext('init', root);

    assert.equal(context.backlogRoot, undefined);
    assert.equal(context.host.resolveCliPath('./backlog'), path.resolve(root, 'backlog'));
    assert.match(context.host.nowIsoUtc(), /^\d{4}-\d{2}-\d{2}T/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

void test('createContext rejects non-init commands outside backlog root', async () => {
  const root = await createTempDir();
  const runtime = createRuntime();

  try {
    await assert.rejects(
      () => runtime.createContext('status', root),
      (error: unknown) => error instanceof BacklogError && error.code === 'BE_ROOT_NOT_FOUND',
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

void test('createNoOpRegistry provides safe async no-op hooks', async () => {
  const hooks = createNoOpRegistry();
  const sections = [{ key: 'summary', title: 'Summary', markdown: 'ok' }];

  await hooks.beforeCommand?.({ command: 'status', input: {} });
  await hooks.afterCommand?.({ command: 'status', output: {} });
  await hooks.afterSourceRegistered?.({
    source: {
      source_id: '00000000-0000-4000-8000-000000000001',
      source_label: 'docs/architecture.md',
      path: 'docs/architecture.md',
      kind: 'architecture',
      authority: 'authoritative',
      hash: 'a'.repeat(64),
      registered_at: '2026-04-06T12:00:00Z',
      last_checked_at: '2026-04-06T12:00:00Z',
    },
    backlogRoot: '/tmp/example',
  });

  const systemSummary = await hooks.buildSystemSummary?.({
    context: createMinimalState().context,
    items: [],
  });
  const decorated = await hooks.decorateReportSections?.({ sections });

  assert.deepEqual(systemSummary, []);
  assert.deepEqual(decorated, sections);
});

void test('runtime wires hooks and state coordinator through command context', async () => {
  const root = await createTempDir();
  const nested = path.join(root, 'nested');
  await mkdir(nested, { recursive: true });
  await writeRootMarker(root);

  const state = createMinimalState();
  const calls = {
    ensureQueryState: 0,
    ensureMutationState: 0,
    rebuildState: 0,
  };
  const hooks = createNoOpRegistry();

  const runtime = createRuntime({
    dependencies: {
      hooks,
    },
    stateCoordinator: {
      ensureQueryState() {
        calls.ensureQueryState += 1;
        return Promise.resolve({
          state,
          rebuilt: false,
        });
      },
      ensureMutationState() {
        calls.ensureMutationState += 1;
        return Promise.resolve(state);
      },
      rebuildState() {
        calls.rebuildState += 1;
        return Promise.resolve(state);
      },
    },
  });

  try {
    const context = await runtime.createContext('status', nested);

    assert.equal(context.backlogRoot, root);
    assert.equal(context.hooks, hooks);
    assert.equal(context.host.resolveCliPath('./child'), path.join(nested, 'child'));
    assert.deepEqual(await context.ensureQueryState(), { state, rebuilt: false });
    assert.deepEqual(await context.ensureMutationState(), state);
    assert.deepEqual(await runtime.rebuildState(root), state);
    assert.deepEqual(calls, {
      ensureQueryState: 1,
      ensureMutationState: 1,
      rebuildState: 1,
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

void test('runtime uses injected ErrorModule for root, unavailable-module, and default coordinator failures', async () => {
  const root = await createTempDir();
  const outsideRoot = await createTempDir();
  const nested = path.join(root, 'nested');
  await mkdir(nested, { recursive: true });
  await writeRootMarker(root);

  const createdCodes: string[] = [];
  const errorModule = {
    create(code, message, options) {
      createdCodes.push(code);

      return new BacklogError({
        code,
        ...(message ? { message } : {}),
        ...(options?.details ? { details: options.details } : {}),
        ...(options?.hint ? { hint: options.hint } : {}),
        ...(options?.cause ? { cause: options.cause } : {}),
      });
    },
    isBacklogError(value: unknown): value is BacklogError {
      return value instanceof BacklogError;
    },
    toPayload(error: unknown) {
      return (error as BacklogError).toPayload();
    },
    toExitCode(error: unknown) {
      return (error as BacklogError).exitCode;
    },
  } satisfies ErrorModule;

  const runtime = createRuntime({
    modules: {
      errors: errorModule,
    },
  });

  try {
    const initContext = await runtime.createContext('init', outsideRoot);
    await assert.rejects(
      () => initContext.ensureQueryState(),
      (error: unknown) => error instanceof BacklogError && error.code === 'BE_ROOT_NOT_FOUND',
    );

    const context = await runtime.createContext('status', nested);
    await assert.rejects(
      () => context.ensureQueryState(),
      (error: unknown) =>
        error instanceof BacklogError && error.code === 'BE_INTERNAL_STATE_CORRUPT',
    );

    await assert.rejects(
      () => context.artifacts.readState(root),
      (error: unknown) =>
        error instanceof BacklogError && error.code === 'BE_INTERNAL_STATE_CORRUPT',
    );

    assert.deepEqual(createdCodes, [
      'BE_ROOT_NOT_FOUND',
      'BE_INTERNAL_STATE_CORRUPT',
      'BE_INTERNAL_STATE_CORRUPT',
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outsideRoot, { recursive: true, force: true });
  }
});
