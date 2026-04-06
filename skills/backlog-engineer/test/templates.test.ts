import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { renderBacklogAgentsTemplate } from '../src/templates/render-agents-template.ts';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = path.resolve(TEST_DIR, '..');
const AGENTS_TEMPLATE_PATH = path.join(SKILL_DIR, 'assets', 'backlog-agents.template.md');

void test('renderBacklogAgentsTemplate stays identical to the canonical AGENTS asset', async () => {
  const expected = await readFile(AGENTS_TEMPLATE_PATH, 'utf8');

  assert.equal(renderBacklogAgentsTemplate(), expected);
});
