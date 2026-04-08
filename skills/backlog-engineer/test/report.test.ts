import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { REPORT_COMMAND } from '../src/commands/report.ts';
import { createCoreModule } from '../src/core/index.ts';
import { BacklogError } from '../src/errors/index.ts';
import { createErrorModule } from '../src/errors/index.ts';
import { createNoOpRegistry, type HookRegistry } from '../src/hooks/index.ts';
import {
  buildReportSections,
  createReportsModule,
  renderReportMarkdown,
  renderStateMermaidGraph,
} from '../src/reports/index.ts';
import { createRuntime } from '../src/runtime/index.ts';
import { createSchemaModule } from '../src/schemas/index.ts';
import {
  ReportCommandOutputSchema,
  SourceRegistryFileSchema,
  StateFileSchema,
  type SourceRegistryFile,
  type StateFile,
  type StateItem,
} from '../src/schemas/index.ts';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(TEST_DIR, 'fixtures');

async function createTempDir(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), 'backlog-engineer-report-'));
}

async function copyBacklogFixture(fixtureName: string, targetRoot: string): Promise<void> {
  await cp(path.join(FIXTURES_DIR, 'backlogs', fixtureName), targetRoot, {
    recursive: true,
  });
}

async function loadFixtureBacklog(fixtureName: string): Promise<{
  state: StateFile;
  registry: SourceRegistryFile;
}> {
  const fixtureRoot = path.join(FIXTURES_DIR, 'backlogs', fixtureName, '.backlog');
  const [stateRaw, registryRaw] = await Promise.all([
    readFile(path.join(fixtureRoot, 'state.json'), 'utf8'),
    readFile(path.join(fixtureRoot, 'sources.json'), 'utf8'),
  ]);

  return {
    state: StateFileSchema.parse(JSON.parse(stateRaw) as unknown),
    registry: SourceRegistryFileSchema.parse(JSON.parse(registryRaw) as unknown),
  };
}

function createReportsForTests(hooks: HookRegistry = createNoOpRegistry()) {
  const errors = createErrorModule();
  const schemas = createSchemaModule();
  const core = createCoreModule({
    errors,
    schemas,
    clock: {
      nowIsoUtc: () => '2026-04-06T12:00:00Z',
    },
    uuid: {
      create: () => '11111111-1111-4111-8111-111111111111',
    },
  });

  return createReportsModule({
    items: core.items,
    attention: core.attention,
    queue: core.queue,
    hooks,
  });
}

function createLargeBacklogState(): {
  state: StateFile;
  registry: SourceRegistryFile;
} {
  const sourceA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const sourceB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  const items: StateItem[] = [];
  const allDefinitions: Array<{
    prefix: string;
    count: number;
    sourceId: string;
  }> = [
    { prefix: 'auth-large', count: 40, sourceId: sourceA },
    { prefix: 'billing-large', count: 36, sourceId: sourceB },
  ];

  for (const group of allDefinitions) {
    for (let index = 0; index < group.count; index += 1) {
      const itemKey = `${group.prefix}-${String(index + 1).padStart(2, '0')}`;
      const dependencyKey =
        index === 0 ? undefined : `${group.prefix}-${String(index).padStart(2, '0')}`;
      items.push({
        item_key: itemKey,
        title: `Synthetic item ${index + 1}`,
        type: 'feature',
        delivery_state: 'defined',
        gaps: [],
        depends_on_keys: dependencyKey ? [dependencyKey] : [],
        origin_source_ids: [group.sourceId],
        specification_source_ids: [],
        plan_source_ids: [],
        implementation_source_ids: [],
        test_source_ids: [],
        claim_keys: [],
        contract_keys: [],
        data_domain_keys: [],
        quality_attribute_keys: [],
        policy_decision_keys: [],
        reverse_dependency_keys:
          index === group.count - 1
            ? []
            : [`${group.prefix}-${String(index + 2).padStart(2, '0')}`],
        open_todo_ids: [],
        needs_attention: false,
        attention_reason_codes: [],
        attention_reasons: [],
        ready_for_next_step: true,
      });
    }
  }

  return {
    state: StateFileSchema.parse({
      schema_version: 1,
      created_at: '2026-04-03T12:00:00Z',
      updated_at: '2026-04-03T12:30:00Z',
      last_refresh_at: '2026-04-03T12:20:00Z',
      context: {
        glossary: [],
        key_strategy: {
          module_prefix: 'large',
          item_pattern: '<module>-<capability>-<result>',
        },
        target_system: [],
        as_built: [],
        claims: [],
        contracts: [],
        data_domains: [],
        quality_attributes: [],
        policy_decisions: [],
      },
      items,
      todos: [],
    } satisfies StateFile),
    registry: SourceRegistryFileSchema.parse({
      schema_version: 1,
      created_at: '2026-04-03T12:00:00Z',
      updated_at: '2026-04-03T12:20:00Z',
      sources: [
        {
          source_id: sourceA,
          source_label: 'sources/docs/modules/auth-large.md',
          path: 'sources/docs/modules/auth-large.md',
          kind: 'module',
          authority: 'authoritative',
          hash: '1'.repeat(64),
          registered_at: '2026-04-03T12:05:00Z',
          last_checked_at: '2026-04-03T12:20:00Z',
        },
        {
          source_id: sourceB,
          source_label: 'sources/docs/modules/billing-large.md',
          path: 'sources/docs/modules/billing-large.md',
          kind: 'module',
          authority: 'authoritative',
          hash: '2'.repeat(64),
          registered_at: '2026-04-03T12:05:00Z',
          last_checked_at: '2026-04-03T12:20:00Z',
        },
      ],
    } satisfies SourceRegistryFile),
  };
}

void test('report model includes summary, metrics, attention, queue and item catalog', async () => {
  const { state, registry } = await loadFixtureBacklog('multi-branch-backlog');
  const reports = createReportsForTests();

  const model = await reports.buildReportModel({
    state,
    registry,
  });

  assert.equal(model.metrics.totalItems, state.items.length);
  assert.equal(model.metrics.itemsNeedingAttention, 1);
  assert.equal(
    model.metrics.readyForNextStep,
    state.items.filter((item) => item.ready_for_next_step).length,
  );
  assert.equal(model.metrics.openGaps, 1);
  assert.equal(model.metrics.openTodos, 0);
  assert.ok(model.systemSummary.some((line) => line.startsWith('Target system 1: ')));
  assert.ok(model.systemSummary.some((line) => line.startsWith('As built 1: ')));
  assert.deepEqual(
    model.attentionItems.map((entry) => entry.item_key),
    ['auth-session-timeout-audit'],
  );
  assert.deepEqual(
    model.queueChains.map((chain) => chain.root_item_key),
    ['auth-core', 'billing-core'],
  );
  assert.deepEqual(
    model.itemCatalog.map((entry) => entry.item.item_key),
    state.items.map((item) => item.item_key).sort((left, right) => left.localeCompare(right)),
  );
  assert.equal(model.localMermaidGraphs.length, 0);
  assert.match(model.globalMermaidGraph, /^flowchart TD/m);
  assert.equal(reports.renderMermaid(model), model.globalMermaidGraph);
});

void test('report model falls back to generated summary and appends hook summary lines', async () => {
  const { state, registry } = await loadFixtureBacklog('multi-branch-backlog');
  const reports = createReportsForTests({
    ...createNoOpRegistry(),
    buildSystemSummary() {
      return Promise.resolve(['Hook summary line']);
    },
  });

  const model = await reports.buildReportModel({
    state: StateFileSchema.parse({
      ...state,
      context: {
        ...state.context,
        target_system: [],
        as_built: [],
      },
    }),
    registry,
  });

  assert.ok(model.systemSummary.some((line) => line === 'Registered sources: 3'));
  assert.ok(model.systemSummary.some((line) => line.startsWith('Top sources by task coverage: ')));
  assert.ok(model.systemSummary.some((line) => line === 'Hook summary line'));
});

void test('report model builds local graphs for large backlogs', async () => {
  const { state, registry } = createLargeBacklogState();
  const reports = createReportsForTests();

  const model = await reports.buildReportModel({
    state,
    registry,
  });

  assert.equal(model.localMermaidGraphs.length, 2);
  assert.deepEqual(
    model.localMermaidGraphs.map((graph) => graph.title),
    [
      'Local graph — sources/docs/modules/auth-large.md',
      'Local graph — sources/docs/modules/billing-large.md',
    ],
  );
  assert.ok(model.localMermaidGraphs.every((graph) => graph.mermaid.startsWith('flowchart TD\n')));
});

void test('report sections and markdown contain all required operator sections', async () => {
  const { state, registry } = await loadFixtureBacklog('multi-branch-backlog');
  const reports = createReportsForTests();
  const model = await reports.buildReportModel({
    state,
    registry,
  });

  const sections = buildReportSections(model);
  const markdown = renderReportMarkdown(sections);

  assert.deepEqual(
    sections.map((section) => section.title),
    [
      'System Summary',
      'Backlog Metrics',
      'Task Graph',
      'Needs Attention',
      'Ready For Next Step',
      'All Items',
    ],
  );
  assert.match(markdown, /^# Backlog Report/m);
  assert.match(markdown, /^## System Summary/m);
  assert.match(markdown, /^## Backlog Metrics/m);
  assert.match(markdown, /^## Task Graph/m);
  assert.match(markdown, /^## Needs Attention/m);
  assert.match(markdown, /^## Ready For Next Step/m);
  assert.match(markdown, /^## All Items/m);
  assert.match(markdown, /^### auth-core — Implement core session validation/m);
});

void test('mermaid renderer is deterministic for the same item graph', async () => {
  const { state } = await loadFixtureBacklog('multi-branch-backlog');

  const first = renderStateMermaidGraph(state.items);
  const second = renderStateMermaidGraph([...state.items].reverse());

  assert.equal(first, second);
  assert.match(first, /auth-core\["auth-core: Implement core session validation"\]/);
  assert.match(first, /auth-core --> auth-session-timeout-enforcement/);
});

void test('report command rejects unsupported --out argv as a usage error', () => {
  assert.throws(
    () => {
      REPORT_COMMAND.parseArgs(['--out', './custom.md']);
    },
    (error: unknown) => error instanceof BacklogError && error.code === 'BE_USAGE_INVALID',
  );
});

void test('report command writes markdown and mermaid files to reports directory', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const runtime = createRuntime({
    dependencies: {
      clock: {
        nowIsoUtc: () => '2026-04-06T12:34:56Z',
      },
    },
  });

  try {
    await copyBacklogFixture('refreshable-backlog', backlogRoot);
    await rm(path.join(backlogRoot, 'reports'), { recursive: true, force: true });
    const context = await runtime.createContext('report', backlogRoot);
    const output = ReportCommandOutputSchema.parse(await REPORT_COMMAND.execute({}, context));

    const { state } = await loadFixtureBacklog('refreshable-backlog');

    assert.deepEqual(output, {
      report_path: path.join(backlogRoot, 'reports', 'backlog-report.md'),
      generated_at: '2026-04-06T12:34:56Z',
      item_count: state.items.length,
    });

    const markdown = await readFile(path.join(backlogRoot, 'reports', 'backlog-report.md'), 'utf8');
    const mermaid = await readFile(path.join(backlogRoot, 'reports', 'backlog-graph.mmd'), 'utf8');

    assert.match(markdown, /^# Backlog Report/m);
    assert.match(markdown, /^## Needs Attention/m);
    assert.match(mermaid, /^flowchart TD/m);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('report command applies buildSystemSummary and decorateReportSections hooks', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const runtime = createRuntime({
    dependencies: {
      clock: {
        nowIsoUtc: () => '2026-04-06T12:35:00Z',
      },
      hooks: {
        ...createNoOpRegistry(),
        buildSystemSummary() {
          return Promise.resolve(['Injected summary']);
        },
        decorateReportSections({ sections }) {
          return Promise.resolve([
            ...sections,
            {
              key: 'custom-section',
              title: 'Custom Section',
              markdown: 'Injected section content',
            },
          ]);
        },
      },
    },
  });

  try {
    await copyBacklogFixture('refreshable-backlog', backlogRoot);
    await rm(path.join(backlogRoot, 'reports'), { recursive: true, force: true });
    const context = await runtime.createContext('report', backlogRoot);
    await REPORT_COMMAND.execute({}, context);

    const markdown = await readFile(path.join(backlogRoot, 'reports', 'backlog-report.md'), 'utf8');

    assert.match(markdown, /^- Injected summary$/m);
    assert.match(markdown, /^## Custom Section$/m);
    assert.match(markdown, /^Injected section content$/m);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

void test('report command surfaces report hook failures', async () => {
  const tempRoot = await createTempDir();
  const backlogRoot = path.join(tempRoot, 'backlog');
  const runtime = createRuntime({
    dependencies: {
      hooks: {
        ...createNoOpRegistry(),
        decorateReportSections() {
          return Promise.reject(new Error('report hook failure'));
        },
      },
    },
  });

  try {
    await copyBacklogFixture('refreshable-backlog', backlogRoot);
    const context = await runtime.createContext('report', backlogRoot);

    await assert.rejects(
      async () => {
        await REPORT_COMMAND.execute({}, context);
      },
      (error: unknown) => error instanceof Error && error.message === 'report hook failure',
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});
