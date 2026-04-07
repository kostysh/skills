import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  buildCommandHelpOutput,
  buildGlobalHelpOutput,
  findCommand,
} from '../src/cli/command-registry.ts';
import { DELETE_BACKLOG_COMMAND } from '../src/commands/delete-backlog.ts';
import { INIT_COMMAND } from '../src/commands/init.ts';
import { LIST_SOURCES_COMMAND } from '../src/commands/list-sources.ts';
import { PACKET_COMMAND } from '../src/commands/packet.ts';
import { REGISTER_SOURCE_COMMAND } from '../src/commands/register-source.ts';
import { REPORT_COMMAND } from '../src/commands/report.ts';
import { TEMPLATE_COMMAND } from '../src/commands/template.ts';
import { createRuntime } from '../src/runtime/index.ts';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(TEST_DIR, 'fixtures', 'contracts');

async function readJsonFixture<T>(name: string): Promise<T> {
  return JSON.parse(await readFile(path.join(FIXTURES_DIR, name), 'utf8')) as T;
}

async function createTempDir(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), 'backlog-engineer-cli-contract-'));
}

function createSnapshotRuntime() {
  const uuidValues = [
    '11111111-1111-4111-8111-111111111111',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  ];
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
          const nextValue = uuidValues[Math.min(uuidIndex, uuidValues.length - 1)];
          uuidIndex += 1;
          return nextValue ?? 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
        },
      },
    },
  });
}

function requireCommand(name: string) {
  const command = findCommand(name);
  assert.ok(command, `Missing command definition: ${name}`);
  return command;
}

function normalizeSnapshotValue(payload: {
  value: unknown;
  backlogRoot: string;
  sourcePath: string;
}): unknown {
  return JSON.parse(
    JSON.stringify(payload.value)
      .replaceAll(payload.backlogRoot, '/abs/backlog')
      .replaceAll(payload.sourcePath, '/abs/docs/auth-v1.md'),
  ) as unknown;
}

void test('help output snapshot stays stable for the minimal command set', async () => {
  const expected = await readJsonFixture<Record<string, unknown>>('help-output-golden.json');
  const actual = {
    global: buildGlobalHelpOutput('0.1.0'),
    'register-source': buildCommandHelpOutput(requireCommand('register-source'), '0.1.0'),
    template: buildCommandHelpOutput(requireCommand('template'), '0.1.0'),
    packet: buildCommandHelpOutput(requireCommand('packet'), '0.1.0'),
    status: buildCommandHelpOutput(requireCommand('status'), '0.1.0'),
    report: buildCommandHelpOutput(requireCommand('report'), '0.1.0'),
    queue: buildCommandHelpOutput(requireCommand('queue'), '0.1.0'),
    gaps: buildCommandHelpOutput(requireCommand('gaps'), '0.1.0'),
    attention: buildCommandHelpOutput(requireCommand('attention'), '0.1.0'),
  };

  assert.deepEqual(actual, expected);
});

void test('machine-facing output snapshot stays stable for absolute-path command contracts', async () => {
  const expected = await readJsonFixture<Record<string, unknown>>('machine-output-golden.json');
  const cwd = await createTempDir();
  const runtime = createSnapshotRuntime();

  try {
    const initContext = await runtime.createContext('init', cwd);
    const initOutput = await INIT_COMMAND.execute({ path: './backlog' }, initContext);
    const backlogRoot = path.join(cwd, 'backlog');

    const docsDir = path.join(cwd, 'docs');
    await mkdir(docsDir, { recursive: true });
    const sourcePath = path.join(docsDir, 'auth-v1.md');
    await writeFile(sourcePath, '# auth v1\n', 'utf8');

    const registerContext = await runtime.createContext('register-source', backlogRoot);
    const registerSourceOutput = await REGISTER_SOURCE_COMMAND.execute(
      {
        path: '../docs/auth-v1.md',
        kind: 'architecture',
        authority: 'authoritative',
      },
      registerContext,
    );

    const listContext = await runtime.createContext('list-sources', backlogRoot);
    const listSourcesOutput = await LIST_SOURCES_COMMAND.execute({}, listContext);

    const templateContext = await runtime.createContext('template', backlogRoot);
    const templateOutput = await TEMPLATE_COMMAND.execute(
      {
        mode: 'packet',
        out: './packet.template.json',
      },
      templateContext,
    );

    const packetPath = path.join(backlogRoot, 'auth.packet.json');
    await writeFile(
      packetPath,
      JSON.stringify(
        {
          context: {
            glossary: [],
            key_strategy: {
              module_prefix: 'auth',
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
          items: [
            {
              item_key: 'auth-core',
              title: 'Implement core auth',
              type: 'feature',
              delivery_state: 'defined',
              gaps: [],
              depends_on_keys: [],
              origin_source_ids: ['11111111-1111-4111-8111-111111111111'],
              specification_source_ids: [],
              plan_source_ids: [],
              implementation_source_ids: [],
              test_source_ids: [],
              claim_keys: [],
              contract_keys: [],
              data_domain_keys: [],
              quality_attribute_keys: [],
              policy_decision_keys: [],
            },
          ],
        },
        null,
        2,
      ) + '\n',
      'utf8',
    );

    const packetContext = await runtime.createContext('packet', backlogRoot);
    const packetOutput = await PACKET_COMMAND.execute(
      {
        path: './auth.packet.json',
        dry_run: false,
      },
      packetContext,
    );

    const reportContext = await runtime.createContext('report', backlogRoot);
    const reportOutput = await REPORT_COMMAND.execute({}, reportContext);

    await rm(packetPath, { force: true });
    await rm(templateOutput.output_path, { force: true });

    const deleteContext = await runtime.createContext('delete-backlog', backlogRoot);
    const deleteBacklogOutput = await DELETE_BACKLOG_COMMAND.execute(
      {
        confirm: true,
      },
      deleteContext,
    );

    const actual = normalizeSnapshotValue({
      value: {
        init: initOutput,
        registerSource: registerSourceOutput,
        listSources: listSourcesOutput,
        template: templateOutput,
        packet: packetOutput,
        report: reportOutput,
        deleteBacklog: deleteBacklogOutput,
      },
      backlogRoot,
      sourcePath,
    });

    assert.deepEqual(actual, expected);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
