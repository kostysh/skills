import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  renderBacklogAgentsTemplate,
  renderPacketTemplate,
  renderPatchTemplate,
} from '../src/templates/index.ts';
import { PatchFileSchema } from '../src/schemas/index.ts';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = path.resolve(TEST_DIR, '..');
const AGENTS_TEMPLATE_PATH = path.join(SKILL_DIR, 'assets', 'backlog-agents.template.md');
const PACKET_TEMPLATE_PATH = path.join(SKILL_DIR, 'assets', 'packet.template.json');
const PATCH_TEMPLATE_PATH = path.join(SKILL_DIR, 'assets', 'patch.template.json');

void test('renderBacklogAgentsTemplate stays identical to the canonical AGENTS asset', async () => {
  const expected = await readFile(AGENTS_TEMPLATE_PATH, 'utf8');

  assert.equal(renderBacklogAgentsTemplate(), expected);
});

void test('renderPacketTemplate stays identical to the canonical packet asset', async () => {
  const expected = await readFile(PACKET_TEMPLATE_PATH, 'utf8');

  assert.equal(renderPacketTemplate(), expected);
});

void test('renderPatchTemplate produces an empty partially prefilled patch draft', async () => {
  const expected = await readFile(PATCH_TEMPLATE_PATH, 'utf8');
  const rendered = renderPatchTemplate({
    targetItemKeys: ['auth-core'],
    kind: 'patch-item',
    patchId: '<patch_id>',
    createdAt: '<iso8601>',
    sequence: 7,
  });

  assert.equal(
    expected,
    '{\n' +
      '  "metadata": {\n' +
      '    "patch_id": "<patch_id>",\n' +
      '    "created_at": "<iso8601>",\n' +
      '    "sequence": "<monotonic_sequence>",\n' +
      '    "target_item_keys": ["<item_key>"]\n' +
      '  },\n' +
      '  "operations": []\n' +
      '}\n',
  );
  assert.deepEqual(JSON.parse(rendered) as unknown, {
    metadata: {
      patch_id: '<patch_id>',
      created_at: '<iso8601>',
      sequence: 7,
      target_item_keys: ['auth-core'],
    },
    operations: [],
  });
  assert.equal(PatchFileSchema.safeParse(JSON.parse(rendered)).success, false);
});
