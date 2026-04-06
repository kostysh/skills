import assert from 'node:assert/strict';
import test from 'node:test';

import { createErrorModule } from '../src/errors/index.ts';
import { createNodeHashPort, createNodePathPort } from '../src/runtime/index.ts';
import { createSchemaModule } from '../src/schemas/index.ts';
import { createSourcesModule } from '../src/sources/index.ts';
import { createInMemoryFileSystemPort } from './support/in-memory-fs.ts';

function createSourcesForTest() {
  const fs = createInMemoryFileSystemPort({ cwd: '/repo' });
  const errors = createErrorModule();
  const schemas = createSchemaModule();

  return {
    fs,
    errors,
    sources: createSourcesModule({
      fs,
      path: createNodePathPort(),
      hash: createNodeHashPort(),
      clock: {
        nowIsoUtc() {
          return '2026-04-06T12:00:00.000Z';
        },
      },
      schemas,
      errors,
    }),
  };
}

void test('sources module normalizes CLI source paths relative to backlog root with POSIX separators', async () => {
  const { sources } = createSourcesForTest();

  const normalized = await sources.resolveCliSourcePath({
    backlogRoot: '/repo/backlog',
    inputPath: '/repo/backlog/sources/docs/modules/auth.md',
  });

  assert.deepEqual(normalized, {
    absolute_path: '/repo/backlog/sources/docs/modules/auth.md',
    relative_path: 'sources/docs/modules/auth.md',
    source_label: 'sources/docs/modules/auth.md',
  });
});

void test('sources module rejects normalized paths that escape backlog root', async () => {
  const { sources, errors } = createSourcesForTest();

  await assert.rejects(
    async () => {
      await sources.resolveCliSourcePath({
        backlogRoot: '/repo/backlog',
        inputPath: '/repo/outside/auth.md',
      });
    },
    (error: unknown) => errors.isBacklogError(error) && error.code === 'BE_SCHEMA_INVALID',
  );
});

void test('sources module hashes files and builds validated source records', async () => {
  const { fs, sources } = createSourcesForTest();
  await fs.writeText('/repo/backlog/sources/docs/modules/auth.md', '# auth\n');

  const sourceHash = await sources.hashSourceFile('/repo/backlog/sources/docs/modules/auth.md');
  const record = sources.buildSourceRecord({
    sourceId: '11111111-1111-4111-8111-111111111111',
    relativePath: 'sources/docs/modules/auth.md',
    kind: 'module',
    authority: 'authoritative',
    note: 'Auth module architecture',
    registeredAt: '2026-04-06T12:00:00.000Z',
    lastCheckedAt: '2026-04-06T12:00:00.000Z',
    sourceHash,
  });

  assert.deepEqual(record, {
    source_id: '11111111-1111-4111-8111-111111111111',
    source_label: 'sources/docs/modules/auth.md',
    path: 'sources/docs/modules/auth.md',
    kind: 'module',
    authority: 'authoritative',
    note: 'Auth module architecture',
    hash: sourceHash,
    registered_at: '2026-04-06T12:00:00.000Z',
    last_checked_at: '2026-04-06T12:00:00.000Z',
  });
});

void test('sources module registers new sources and returns existing source for the same path', async () => {
  const { fs, sources } = createSourcesForTest();
  await fs.writeText('/repo/backlog/sources/docs/modules/b.md', '# b\n');
  await fs.writeText('/repo/backlog/sources/docs/modules/a.md', '# a\n');

  const sourceA = sources.buildSourceRecord({
    sourceId: '11111111-1111-4111-8111-111111111111',
    relativePath: 'sources/docs/modules/b.md',
    kind: 'module',
    authority: 'authoritative',
    registeredAt: '2026-04-06T12:00:00.000Z',
    lastCheckedAt: '2026-04-06T12:00:00.000Z',
    sourceHash: await sources.hashSourceFile('/repo/backlog/sources/docs/modules/b.md'),
  });
  const sourceB = sources.buildSourceRecord({
    sourceId: '22222222-2222-4222-8222-222222222222',
    relativePath: 'sources/docs/modules/a.md',
    kind: 'module',
    authority: 'authoritative',
    registeredAt: '2026-04-06T12:01:00.000Z',
    lastCheckedAt: '2026-04-06T12:01:00.000Z',
    sourceHash: await sources.hashSourceFile('/repo/backlog/sources/docs/modules/a.md'),
  });

  const first = sources.registerSource({
    registry: {
      schema_version: 1,
      created_at: '2026-04-06T12:00:00.000Z',
      updated_at: '2026-04-06T12:00:00.000Z',
      sources: [],
    },
    source: sourceA,
  });
  const second = sources.registerSource({
    registry: first.registry,
    source: sourceB,
  });
  const duplicate = sources.registerSource({
    registry: second.registry,
    source: {
      ...sourceA,
      source_id: '33333333-3333-4333-8333-333333333333',
      hash: 'f'.repeat(64),
    },
  });

  assert.equal(first.created, true);
  assert.equal(second.created, true);
  assert.equal(duplicate.created, false);
  assert.deepEqual(
    second.registry.sources.map((source) => source.source_label),
    ['sources/docs/modules/a.md', 'sources/docs/modules/b.md'],
  );
  assert.equal(duplicate.registry.sources.length, 2);
  assert.equal(duplicate.source.source_id, sourceA.source_id);
  assert.equal(duplicate.source.hash, sourceA.hash);
});
