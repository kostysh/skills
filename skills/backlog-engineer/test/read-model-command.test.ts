import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { ATTENTION_COMMAND } from '../src/commands/attention.ts';
import { BacklogError } from '../src/errors/index.ts';
import { GAPS_COMMAND } from '../src/commands/gaps.ts';
import { ITEMS_COMMAND } from '../src/commands/items.ts';
import { PATCH_ITEM_COMMAND } from '../src/commands/patch-item.ts';
import { QUEUE_COMMAND } from '../src/commands/queue.ts';
import { SEARCH_COMMAND } from '../src/commands/search.ts';
import { createRuntime } from '../src/runtime/index.ts';
import {
  AttentionCommandOutputSchema,
  GapsCommandOutputSchema,
  ItemsCommandOutputSchema,
  QueueCommandOutputSchema,
  SearchCommandOutputSchema,
  StateFileSchema,
} from '../src/schemas/index.ts';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(TEST_DIR, 'fixtures');

async function createTempDir(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), 'backlog-engineer-read-model-'));
}

async function copyBacklogFixture(fixtureName: string, targetRoot: string): Promise<void> {
  await cp(path.join(FIXTURES_DIR, 'backlogs', fixtureName), targetRoot, {
    recursive: true,
  });
}

void test('items command returns full cards in requested order', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const runtime = createRuntime();

  try {
    await copyBacklogFixture('refreshable-backlog', backlogRoot);
    const context = await runtime.createContext('items', backlogRoot);
    const output = ItemsCommandOutputSchema.parse(
      await ITEMS_COMMAND.execute(
        {
          item_keys: ['session-ui-timeout-banner', 'auth-core'],
        },
        context,
      ),
    );

    assert.deepEqual(
      output.map((entry) => entry.item.item_key),
      ['session-ui-timeout-banner', 'auth-core'],
    );
    assert.equal(output[0]?.todo.length, 0);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('items command rejects unknown keys with BE_ITEM_NOT_FOUND', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const runtime = createRuntime();

  try {
    await copyBacklogFixture('refreshable-backlog', backlogRoot);
    const context = await runtime.createContext('items', backlogRoot);

    await assert.rejects(
      async () => {
        await ITEMS_COMMAND.execute(
          {
            item_keys: ['missing-item'],
          },
          context,
        );
      },
      (error: unknown) => error instanceof BacklogError && error.code === 'BE_ITEM_NOT_FOUND',
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('items command rebuilds state before read when state.json is missing', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const runtime = createRuntime();

  try {
    await copyBacklogFixture('refreshable-backlog', backlogRoot);
    await rm(path.join(backlogRoot, '.backlog', 'state.json'));
    const context = await runtime.createContext('items', backlogRoot);

    const output = ItemsCommandOutputSchema.parse(
      await ITEMS_COMMAND.execute(
        {
          item_keys: ['auth-core'],
        },
        context,
      ),
    );

    assert.equal(output[0]?.item.item_key, 'auth-core');
    const rebuiltState = StateFileSchema.parse(
      JSON.parse(
        await readFile(path.join(backlogRoot, '.backlog', 'state.json'), 'utf8'),
      ) as unknown,
    );
    assert.equal(rebuiltState.items.length, 4);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('search command returns compact filtered results', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const runtime = createRuntime();

  try {
    await copyBacklogFixture('todo-dedup-backlog', backlogRoot);
    const context = await runtime.createContext('search', backlogRoot);
    const output = SearchCommandOutputSchema.parse(
      await SEARCH_COMMAND.execute(
        {
          needs_attention: true,
        },
        context,
      ),
    );

    assert.deepEqual(
      output.map((entry) => entry.item_key),
      ['auth-session-timeout-audit', 'session-ui-timeout-banner'],
    );
    assert.deepEqual(output[0]?.match_reasons, ['needs_attention=true']);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('search command intersects combined filters and returns matching reasons', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const runtime = createRuntime();

  try {
    await copyBacklogFixture('refreshable-backlog', backlogRoot);
    const context = await runtime.createContext('search', backlogRoot);
    const output = SearchCommandOutputSchema.parse(
      await SEARCH_COMMAND.execute(
        {
          source_ids: [
            '11111111-1111-4111-8111-111111111111',
            '33333333-3333-4333-8333-333333333333',
          ],
          contract_keys: ['auth-session-contract'],
          needs_attention: false,
        },
        context,
      ),
    );

    assert.deepEqual(
      output.map((entry) => entry.item_key),
      ['auth-core', 'auth-session-timeout-enforcement'],
    );
    assert.deepEqual(output[0]?.match_reasons, [
      'source_ids=11111111-1111-4111-8111-111111111111',
      'needs_attention=false',
      'contract_keys=auth-session-contract',
    ]);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('search command supports every documented filter branch', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const runtime = createRuntime();

  try {
    await copyBacklogFixture('refreshable-backlog', backlogRoot);
    const context = await runtime.createContext('search', backlogRoot);

    const cases: Array<{
      name: string;
      input: Parameters<typeof SEARCH_COMMAND.execute>[0];
      expected: string[];
    }> = [
      {
        name: 'source_ids',
        input: {
          source_ids: ['11111111-1111-4111-8111-111111111111'],
        },
        expected: ['auth-core', 'auth-session-timeout-audit', 'auth-session-timeout-enforcement'],
      },
      {
        name: 'delivery_state',
        input: {
          delivery_state: 'defined' as const,
        },
        expected: ['auth-session-timeout-audit', 'session-ui-timeout-banner'],
      },
      {
        name: 'ready_for_next_step',
        input: {
          ready_for_next_step: true,
        },
        expected: ['auth-core', 'auth-session-timeout-enforcement', 'session-ui-timeout-banner'],
      },
      {
        name: 'claim_keys',
        input: {
          claim_keys: ['auth-session-timeout'],
        },
        expected: ['auth-session-timeout-audit', 'auth-session-timeout-enforcement'],
      },
      {
        name: 'contract_keys',
        input: {
          contract_keys: ['auth-session-contract'],
        },
        expected: ['auth-core', 'auth-session-timeout-enforcement'],
      },
      {
        name: 'data_domain_keys',
        input: {
          data_domain_keys: ['user-session'],
        },
        expected: ['auth-core', 'auth-session-timeout-audit', 'auth-session-timeout-enforcement'],
      },
      {
        name: 'quality_attribute_keys',
        input: {
          quality_attribute_keys: ['security-session-timeout'],
        },
        expected: ['auth-session-timeout-audit', 'auth-session-timeout-enforcement'],
      },
      {
        name: 'policy_decision_keys',
        input: {
          policy_decision_keys: ['policy-session-timeout-required'],
        },
        expected: ['auth-session-timeout-enforcement'],
      },
    ];

    for (const testCase of cases) {
      const output = SearchCommandOutputSchema.parse(
        await SEARCH_COMMAND.execute(testCase.input, context),
      );

      assert.deepEqual(
        output.map((entry) => entry.item_key),
        testCase.expected,
        `search command filter branch ${testCase.name}`,
      );
    }
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('search command without filters returns all tasks in deterministic order', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const runtime = createRuntime();

  try {
    await copyBacklogFixture('refreshable-backlog', backlogRoot);
    const context = await runtime.createContext('search', backlogRoot);
    const output = SearchCommandOutputSchema.parse(await SEARCH_COMMAND.execute({}, context));

    assert.deepEqual(
      output.map((entry) => entry.item_key),
      [
        'auth-core',
        'auth-session-timeout-audit',
        'auth-session-timeout-enforcement',
        'session-ui-timeout-banner',
      ],
    );
    assert.deepEqual(
      output.map((entry) => entry.match_reasons),
      [[], [], [], []],
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('gaps command returns only explicit blockers', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const runtime = createRuntime();

  try {
    await copyBacklogFixture('refreshable-backlog', backlogRoot);
    const context = await runtime.createContext('gaps', backlogRoot);
    const output = GapsCommandOutputSchema.parse(await GAPS_COMMAND.execute({}, context));

    assert.deepEqual(output, [
      {
        item_key: 'auth-session-timeout-audit',
        title: 'Emit audit event for timeout enforcement',
        gaps: ['Audit event schema is not yet specified.'],
      },
    ]);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('gaps command scopes results to a single item key', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const runtime = createRuntime();

  try {
    await copyBacklogFixture('refreshable-backlog', backlogRoot);
    const context = await runtime.createContext('gaps', backlogRoot);
    const output = GapsCommandOutputSchema.parse(
      await GAPS_COMMAND.execute(
        {
          item_key: 'auth-session-timeout-audit',
        },
        context,
      ),
    );

    assert.deepEqual(output, [
      {
        item_key: 'auth-session-timeout-audit',
        title: 'Emit audit event for timeout enforcement',
        gaps: ['Audit event schema is not yet specified.'],
      },
    ]);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('queue command returns deterministic ready chains', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const runtime = createRuntime();

  try {
    await copyBacklogFixture('refreshable-backlog', backlogRoot);
    const context = await runtime.createContext('queue', backlogRoot);
    const output = QueueCommandOutputSchema.parse(await QUEUE_COMMAND.execute({}, context));

    assert.deepEqual(output, [
      {
        root_item_key: 'auth-core',
        items: ['auth-core', 'auth-session-timeout-enforcement', 'session-ui-timeout-banner'],
        ordering_rule: ['depth', 'downstream_dependency_count', 'item_key'],
      },
    ]);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('queue command excludes blocked tasks from ready chains', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const runtime = createRuntime();

  try {
    await copyBacklogFixture('todo-dedup-backlog', backlogRoot);
    const context = await runtime.createContext('queue', backlogRoot);
    const output = QueueCommandOutputSchema.parse(await QUEUE_COMMAND.execute({}, context));

    assert.deepEqual(output, [
      {
        root_item_key: 'auth-core',
        items: ['auth-core', 'auth-session-timeout-enforcement'],
        ordering_rule: ['depth', 'downstream_dependency_count', 'item_key'],
      },
    ]);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('queue command reflects the current derived state after a patch mutation', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const runtime = createRuntime();

  try {
    await copyBacklogFixture('refreshable-backlog', backlogRoot);
    const patchPath = path.join(backlogRoot, 'drafts', 'block-enforcement.patch.json');
    await mkdir(path.dirname(patchPath), { recursive: true });
    await writeFile(
      patchPath,
      JSON.stringify(
        {
          metadata: {
            patch_id: '2026-04-06-050-block-enforcement',
            created_at: '2026-04-06T12:00:00.000Z',
            sequence: 50,
            target_item_keys: ['auth-session-timeout-enforcement'],
          },
          operations: [
            {
              item_key: 'auth-session-timeout-enforcement',
              action: 'replace_fields',
              fields: {
                gaps: ['Need backend timeout semantics'],
              },
            },
          ],
        },
        null,
        2,
      ),
      'utf8',
    );

    const patchContext = await runtime.createContext('patch-item', backlogRoot);
    await PATCH_ITEM_COMMAND.execute(
      {
        patch: './drafts/block-enforcement.patch.json',
        dry_run: false,
      },
      patchContext,
    );

    const queueContext = await runtime.createContext('queue', backlogRoot);
    const output = QueueCommandOutputSchema.parse(await QUEUE_COMMAND.execute({}, queueContext));

    assert.deepEqual(output, [
      {
        root_item_key: 'auth-core',
        items: ['auth-core'],
        ordering_rule: ['depth', 'downstream_dependency_count', 'item_key'],
      },
    ]);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('attention command orders items by severity then item_key', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const runtime = createRuntime();

  try {
    await copyBacklogFixture('todo-dedup-backlog', backlogRoot);
    const context = await runtime.createContext('attention', backlogRoot);
    const output = AttentionCommandOutputSchema.parse(await ATTENTION_COMMAND.execute({}, context));

    assert.deepEqual(
      output.map((entry) => entry.item_key),
      ['session-ui-timeout-banner', 'auth-session-timeout-audit'],
    );
    assert.deepEqual(
      output.map((entry) => entry.attention_reason_codes),
      [['dependency_changed'], ['gaps']],
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});
