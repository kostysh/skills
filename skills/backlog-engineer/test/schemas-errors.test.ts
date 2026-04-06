import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import * as errors from '../src/errors/index.ts';
import * as schemas from '../src/schemas/index.ts';
import type { JsonObject } from '../src/schemas/index.ts';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = path.resolve(TEST_DIR, '..');
const FIXTURES_DIR = path.join(SKILL_DIR, 'test', 'fixtures');

async function readJson(relativePath: string): Promise<unknown> {
  const fullPath = path.join(FIXTURES_DIR, relativePath);
  const content = await readFile(fullPath, 'utf8');
  return JSON.parse(content) as unknown;
}

void test('accepts valid root marker file', async () => {
  const rootMarker = await readJson('backlogs/empty-backlog/.backlog.json');
  const parsed = schemas.RootMarkerFileSchema.safeParse(rootMarker);

  assert.equal(parsed.success, true);
});

void test('rejects root marker file with unknown field', async () => {
  const rootMarker = (await readJson('backlogs/empty-backlog/.backlog.json')) as Record<
    string,
    unknown
  >;
  const parsed = schemas.RootMarkerFileSchema.safeParse({
    ...rootMarker,
    unexpected: true,
  });

  assert.equal(parsed.success, false);
});

void test('rejects non-UTC timestamps', () => {
  const parsed = schemas.IsoUtcTimestampSchema.safeParse('2026-04-03T12:00:00+02:00');
  assert.equal(parsed.success, false);
});

void test('rejects invalid path-shaped values', () => {
  assert.equal(schemas.CliPathInputSchema.safeParse('bad\0path').success, false);
  assert.equal(schemas.NormalizedFsPathSchema.safeParse('./relative/path').success, false);
  assert.equal(schemas.BacklogRelativePosixPathSchema.safeParse('../escape').success, false);
  assert.equal(
    schemas.BacklogRelativePosixPathSchema.safeParse('sources\\\\auth.md').success,
    false,
  );
});

void test('accepts valid packet fixture', async () => {
  const packet = await readJson('authored/packets/auth-module.packet.json');
  const parsed = schemas.PacketFileSchema.safeParse(packet);

  assert.equal(parsed.success, true);
});

void test('rejects packet with unknown top-level field', async () => {
  const packet = (await readJson('authored/packets/auth-module.packet.json')) as Record<
    string,
    unknown
  >;
  const parsed = schemas.PacketFileSchema.safeParse({
    ...packet,
    extra: true,
  });

  assert.equal(parsed.success, false);
});

void test('rejects packet without items', async () => {
  const packet = (await readJson('authored/packets/auth-module.packet.json')) as Record<
    string,
    unknown
  >;
  delete packet.items;
  const parsed = schemas.PacketFileSchema.safeParse(packet);

  assert.equal(parsed.success, false);
});

void test('rejects packet with invalid context entity key shape', async () => {
  const packet = (await readJson('authored/packets/auth-module.packet.json')) as {
    context: {
      claims: Array<Record<string, unknown>>;
    };
  };
  const [firstClaim] = packet.context.claims;
  assert.ok(firstClaim);
  firstClaim.claim_key = '';
  const parsed = schemas.PacketFileSchema.safeParse(packet);

  assert.equal(parsed.success, false);
});

void test('rejects glossary aliases that collapse to duplicates after trim', async () => {
  const packet = (await readJson('authored/packets/auth-module.packet.json')) as {
    context: {
      glossary: Array<{ aliases: string[] }>;
    };
  };
  const [firstEntry] = packet.context.glossary;
  assert.ok(firstEntry);
  firstEntry.aliases = ['Idle timeout', '  Idle timeout  '];
  const parsed = schemas.PacketFileSchema.safeParse(packet);

  assert.equal(parsed.success, false);
});

void test('rejects packet item with derived field', async () => {
  const packet = (await readJson('authored/packets/auth-module.packet.json')) as {
    items: Array<Record<string, unknown>>;
  };
  const [firstItem] = packet.items;
  assert.ok(firstItem);
  firstItem.needs_attention = true;
  const parsed = schemas.PacketFileSchema.safeParse(packet);

  assert.equal(parsed.success, false);
});

void test('rejects patch with empty target_item_keys', async () => {
  const patch = (await readJson('authored/patches/auth-module.patch-item.json')) as {
    metadata: { target_item_keys: string[] };
  };
  patch.metadata.target_item_keys = [];
  const parsed = schemas.PatchFileSchema.safeParse(patch);

  assert.equal(parsed.success, false);
});

void test('rejects patch with empty patch_id', async () => {
  const patch = (await readJson('authored/patches/auth-module.patch-item.json')) as {
    metadata: { patch_id: string };
  };
  patch.metadata.patch_id = '   ';
  const parsed = schemas.PatchFileSchema.safeParse(patch);

  assert.equal(parsed.success, false);
});

void test('rejects patch with duplicate target_item_keys', async () => {
  const patch = (await readJson('authored/patches/auth-module.patch-item.json')) as {
    metadata: { target_item_keys: string[] };
  };
  patch.metadata.target_item_keys = ['auth-core', 'auth-core'];
  const parsed = schemas.PatchFileSchema.safeParse(patch);

  assert.equal(parsed.success, false);
});

void test('rejects patch with empty operations', async () => {
  const patch = (await readJson('authored/patches/auth-module.patch-item.json')) as {
    operations: unknown[];
  };
  patch.operations = [];
  const parsed = schemas.PatchFileSchema.safeParse(patch);

  assert.equal(parsed.success, false);
});

void test('rejects patch with invalid sequence', async () => {
  const patch = (await readJson('authored/patches/auth-module.patch-item.json')) as {
    metadata: { sequence: number };
  };
  patch.metadata.sequence = 0;
  const parsed = schemas.PatchFileSchema.safeParse(patch);

  assert.equal(parsed.success, false);
});

void test('rejects patch with invalid kind', async () => {
  const patch = (await readJson('authored/patches/auth-module.patch-item.json')) as {
    kind: string;
  };
  patch.kind = 'mutate';
  const parsed = schemas.PatchFileSchema.safeParse(patch);

  assert.equal(parsed.success, false);
});

void test('rejects replace_fields operation with empty fields', async () => {
  const patch = (await readJson('authored/patches/auth-module.patch-item.json')) as {
    operations: Array<{
      action: string;
      fields?: Record<string, unknown>;
    }>;
  };
  const replaceOperation = patch.operations.find(
    (operation) => operation.action === 'replace_fields',
  );
  assert.ok(replaceOperation);
  replaceOperation.fields = {};
  const parsed = schemas.PatchFileSchema.safeParse(patch);

  assert.equal(parsed.success, false);
});

void test('rejects patch operation whose item_key is outside target_item_keys', async () => {
  const patch = (await readJson('authored/patches/auth-module.patch-item.json')) as {
    operations: Array<{ item_key: string }>;
  };
  const [firstOperation] = patch.operations;
  assert.ok(firstOperation);
  firstOperation.item_key = 'other-item';
  const parsed = schemas.PatchFileSchema.safeParse(patch);

  assert.equal(parsed.success, false);
});

void test('rejects patch-item payload with remove_item operation', async () => {
  const patch = await readJson('authored/patches/invalid-remove-in-patch-item.patch.json');
  const parsed = schemas.PatchItemFileSchema.safeParse(patch);

  assert.equal(parsed.success, false);
});

void test('rejects remove-item patch with incomplete target coverage', async () => {
  const patch = await readJson('authored/patches/invalid-remove-item-incomplete.patch.json');
  const parsed = schemas.RemoveItemPatchFileSchema.safeParse(patch);

  assert.equal(parsed.success, false);
});

void test('accepts refresh command input for all supported selectors', () => {
  const cases = [
    { kind: 'all' },
    { kind: 'item', item_key: 'auth-core' },
    { kind: 'source_id', source_id: '11111111-1111-4111-8111-111111111111' },
    { kind: 'source_label', source_label: 'docs/modules/auth.md' },
    { kind: 'source_path', source_path: './docs/modules/auth.md' },
  ] as const;

  for (const value of cases) {
    const parsed = schemas.RefreshCommandInputSchema.safeParse(value);
    assert.equal(parsed.success, true);
  }
});

void test('rejects invalid mixed refresh command input', () => {
  const parsed = schemas.RefreshCommandInputSchema.safeParse({
    kind: 'item',
    item_key: 'auth-core',
    source_id: '11111111-1111-4111-8111-111111111111',
  });

  assert.equal(parsed.success, false);
});

void test('accepts items command input with several keys', () => {
  const parsed = schemas.ItemsCommandInputSchema.safeParse({
    item_keys: ['auth-core', 'auth-session-timeout-enforcement'],
  });

  assert.equal(parsed.success, true);
});

void test('rejects search command input with unknown field', () => {
  const parsed = schemas.SearchCommandInputSchema.safeParse({
    source_id: '11111111-1111-4111-8111-111111111111',
    unexpected: true,
  });

  assert.equal(parsed.success, false);
});

void test('accepts status command input with refresh true', () => {
  const parsed = schemas.StatusCommandInputSchema.safeParse({ refresh: true });

  assert.equal(parsed.success, true);
});

void test('rejects invalid delete-backlog command input', () => {
  const parsed = schemas.DeleteBacklogCommandInputSchema.safeParse({ confirm: 'yes' });

  assert.equal(parsed.success, false);
});

void test('rejects remove-item patch with non-remove_item operation', async () => {
  const patch = (await readJson('authored/patches/remove-legacy-auth-ui.patch.json')) as {
    operations: Array<Record<string, unknown>>;
  };
  const [firstOperation] = patch.operations;
  assert.ok(firstOperation);
  firstOperation.action = 'remove_todo';
  const parsed = schemas.RemoveItemPatchFileSchema.safeParse(patch);

  assert.equal(parsed.success, false);
});

void test('rejects exact output objects with unknown fields', () => {
  const parsed = schemas.StatusCommandOutputSchema.safeParse({
    total_items: 1,
    last_refresh_at: null,
    defined_count: 1,
    specified_count: 0,
    planned_count: 0,
    implemented_count: 0,
    gaps_count: 0,
    needs_attention_count: 0,
    ready_for_next_step_count: 1,
    open_todo_count: 0,
    unexpected: true,
  });

  assert.equal(parsed.success, false);
});

void test('accepts valid source record and rejects invalid hash', async () => {
  const registry = (await readJson('backlogs/single-branch-backlog/.backlog/sources.json')) as {
    sources: unknown[];
  };
  const validParsed = schemas.SourceRecordSchema.safeParse(registry.sources[0]);
  assert.equal(validParsed.success, true);

  const invalidParsed = schemas.SourceRecordSchema.safeParse({
    ...(registry.sources[0] as Record<string, unknown>),
    hash: 'bad-hash',
  });
  assert.equal(invalidParsed.success, false);
});

void test('accepts valid state file and rejects state item without derived fields', async () => {
  const state = (await readJson('backlogs/single-branch-backlog/.backlog/state.json')) as {
    items: Array<Record<string, unknown>>;
  };
  const validParsed = schemas.StateFileSchema.safeParse(state);
  assert.equal(validParsed.success, true);

  const invalidStateItem = { ...state.items[0] };
  delete invalidStateItem.needs_attention;
  const invalidParsed = schemas.StateItemSchema.safeParse(invalidStateItem);
  assert.equal(invalidParsed.success, false);
});

void test('accepts valid error payload and maps error codes to exit codes', () => {
  const payload = {
    error: {
      code: 'BE_ROOT_NOT_FOUND',
      message: 'Backlog root was not found.',
    },
  };

  const parsed = schemas.ErrorPayloadSchema.safeParse(payload);
  assert.equal(parsed.success, true);

  const error = errors.createBacklogError({ code: 'BE_ROOT_NOT_FOUND' });
  assert.equal(error.exitCode, 5);
  assert.deepEqual(error.toPayload(), payload);

  const usageError = errors.createBacklogError({ code: 'BE_SOURCE_KIND_INVALID' });
  assert.equal(usageError.exitCode, 2);
});

void test('sanitizes error details to a JSON-safe payload', () => {
  const circular: { self?: unknown } = {};
  circular.self = circular;
  const unsafeDetails = {
    circular,
    date: new Date('2026-04-06T00:00:00.000Z'),
    nan: Number.NaN,
    fn: () => 'hidden',
  } as unknown as JsonObject;

  const error = errors.createBacklogError({
    code: 'BE_INTERNAL_STATE_CORRUPT',
    details: unsafeDetails,
  });

  const payload = error.toPayload();
  const parsed = schemas.ErrorPayloadSchema.safeParse(payload);

  assert.equal(parsed.success, true);
  assert.ok(payload.error.details);
  const circularValue = payload.error.details.circular;
  assert.ok(circularValue && typeof circularValue === 'object' && !Array.isArray(circularValue));
  assert.equal(circularValue.self, '[Circular]');
  assert.equal(payload.error.details.date, '2026-04-06T00:00:00.000Z');
  assert.equal(payload.error.details.nan, 'NaN');
  assert.equal(payload.error.details.fn, "() => 'hidden'");
});

void test('normalizes zod errors into schema-invalid backlog errors', () => {
  const result = schemas.PacketFileSchema.safeParse({});
  assert.equal(result.success, false);

  const error = errors.fromZodError(result.error);
  assert.equal(error.code, 'BE_SCHEMA_INVALID');
  assert.equal(error.exitCode, 3);
  assert.ok(Array.isArray(error.toPayload().error.details?.issues));
});

void test('does not classify generic SyntaxError as invalid JSON', () => {
  const error = errors.normalizeError(new SyntaxError('Unexpected token elsewhere'));

  assert.equal(error.code, 'BE_INTERNAL_STATE_CORRUPT');
  assert.notEqual(error.code, 'BE_INVALID_JSON');
});
