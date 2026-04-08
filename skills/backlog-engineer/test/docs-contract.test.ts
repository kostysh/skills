import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { renderManagedGitignoreContent } from '../src/artifacts/gitignore-store.ts';
import { ERROR_CODES } from '../src/errors/error-codes.ts';
import { PacketCommandOutputSchema, QueueCommandOutputSchema } from '../src/schemas/index.ts';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = path.resolve(TEST_DIR, '..');

const SKILL_PATH = path.join(SKILL_DIR, 'SKILL.md');
const COMMAND_REFERENCE_PATH = path.join(SKILL_DIR, 'references', 'command-reference.md');
const DOCUMENT_TO_PACKET_WORKFLOW_PATH = path.join(
  SKILL_DIR,
  'references',
  'document-to-packet-workflow.md',
);
const FIRST_BACKLOG_WALKTHROUGH_PATH = path.join(
  SKILL_DIR,
  'references',
  'first-backlog-walkthrough.md',
);
const OPERATOR_WORKFLOWS_PATH = path.join(SKILL_DIR, 'references', 'operator-workflows.md');
const PROCESS_CLI_PATH = path.join(SKILL_DIR, 'docs', 'process-cli.ru.md');
const UTILITY_SPEC_PATH = path.join(SKILL_DIR, 'docs', 'utility-spec.ru.md');
const IMPLEMENTATION_PLAN_PATH = path.join(SKILL_DIR, 'docs', 'refactoring-plan-1.ru.md');

function extractSection(text: string, heading: string): string {
  const headingIndex = text.indexOf(heading);
  assert.notEqual(headingIndex, -1, `Missing section heading: ${heading}`);

  const sectionStart = headingIndex + heading.length;
  const nextHeadingMatch = /\n#{2,6}\s+/gu.exec(text.slice(sectionStart));
  const sectionEnd =
    nextHeadingMatch === null ? text.length : sectionStart + nextHeadingMatch.index;

  return text.slice(sectionStart, sectionEnd);
}

function assertContainsTerms(text: string, terms: readonly string[]): void {
  for (const term of terms) {
    assert.match(text, new RegExp(escapeForRegex(term), 'u'));
  }
}

function escapeForRegex(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

void test('SKILL.md keeps critical first-run and queue semantics visible through semantic anchors', async () => {
  const skill = await readFile(SKILL_PATH, 'utf8');
  const preflight = extractSection(skill, '## Preflight before first backlog');
  const mutationSerialization = extractSection(skill, '## Mutation serialization');
  const readModelRules = extractSection(skill, '## Read-model rules');

  assertContainsTerms(preflight, ['design-only', 'partially implemented', 'operator is unsure']);
  assertContainsTerms(mutationSerialization, [
    'register-source',
    'packet',
    'patch-item',
    'remove-item',
    'refresh',
    'delete-backlog',
    'sequentially',
    'parallel',
  ]);
  assertContainsTerms(readModelRules, [
    '`queue`',
    'ordered chains',
    'ready_for_next_step',
    'not expected to be equal',
  ]);

  const queueSchemaResult = QueueCommandOutputSchema.safeParse([
    {
      root_item_key: 'auth-core',
      items: ['auth-core', 'auth-session-timeout-enforcement'],
      ordering_rule: ['depth', 'downstream_dependency_count', 'item_key'],
    },
  ]);
  assert.equal(queueSchemaResult.success, true);
});

void test('packet output docs stay aligned with packet command schema invariants', async () => {
  const skill = await readFile(SKILL_PATH, 'utf8');
  const packetSection = extractSection(skill, '### `packet`');

  assertContainsTerms(packetSection, [
    'authored draft',
    'immutable canonical import copy',
    'current backlog truth',
  ]);

  const dryRunResult = PacketCommandOutputSchema.safeParse({
    dry_run: true,
    authored_packet_path: '/abs/backlog/drafts/auth.packet.json',
    counts: {
      added: 1,
      removed: 0,
      todo_created: 0,
      todo_updated: 0,
    },
    added: ['auth-core'],
    removed: [],
    todo_created: [],
    todo_updated: [],
    next_commands: [],
  });
  assert.equal(dryRunResult.success, true);

  const realApplyResult = PacketCommandOutputSchema.safeParse({
    dry_run: false,
    authored_packet_path: '/abs/backlog/drafts/auth.packet.json',
    canonical_packet_path: '/abs/backlog/packets/abcd1234--auth.packet.json',
    canonical_packet_purpose: 'immutable_import_copy',
    counts: {
      added: 1,
      removed: 0,
      todo_created: 0,
      todo_updated: 0,
    },
    added: ['auth-core'],
    removed: [],
    todo_created: [],
    todo_updated: [],
    next_commands: [],
  });
  assert.equal(realApplyResult.success, true);
});

void test('command reference lock and packet output notes stay aligned with exported runtime invariants', async () => {
  const reference = await readFile(COMMAND_REFERENCE_PATH, 'utf8');

  assertContainsTerms(reference, [
    '/.backlog/mutation.lock',
    'BE_MUTATION_LOCKED',
    'machine-facing filesystem paths in command output are absolute',
    'authored_packet_path',
    'canonical_packet_path',
    'immutable_import_copy',
    'source registry stores `path` as a normalized POSIX path relative to backlog root',
  ]);

  assert.equal(ERROR_CODES.includes('BE_MUTATION_LOCKED'), true);
  assert.match(renderManagedGitignoreContent(''), /\/\.backlog\/mutation\.lock/u);
});

void test('implementation plan keeps the doc-sync checklist explicit', async () => {
  const plan = await readFile(IMPLEMENTATION_PLAN_PATH, 'utf8');

  assertContainsTerms(plan, [
    'doc-sync checklist',
    '`SKILL.md`',
    'релевантные `references/*`',
    'runtime-backed invariants',
  ]);
});

void test('first backlog docs enforce a blocking source-set gate before packet authoring', async () => {
  const [skill, workflow, walkthrough, operatorWorkflows] = await Promise.all([
    readFile(SKILL_PATH, 'utf8'),
    readFile(DOCUMENT_TO_PACKET_WORKFLOW_PATH, 'utf8'),
    readFile(FIRST_BACKLOG_WALKTHROUGH_PATH, 'utf8'),
    readFile(OPERATOR_WORKFLOWS_PATH, 'utf8'),
  ]);

  const skillGate = extractSection(skill, '## Source-set gate before first packet');

  assertContainsTerms(skillGate, [
    'full source set',
    'anchor source',
    'only from X',
    'mandatory backlog inputs',
    'Planning backlog documents',
    'must not substitute extraction',
    'concept, architecture, and ADR sources',
    'do not author the first packet until the source-set gate is closed',
  ]);

  assertContainsTerms(workflow, [
    '### 2. Close the source-set gate',
    'anchor source',
    'exclusive source',
    'minimum source set',
    'Self-expanding source graph rule',
    'must not substitute extraction',
  ]);

  assertContainsTerms(walkthrough, [
    '## Step 2. Close the source-set gate',
    'anchor source',
    'the full source set',
    'do not author the first packet until the source-set gate is closed',
    'Then repeat `register-source` for the rest of the source set, one source at a time.',
  ]);

  assertContainsTerms(operatorWorkflows, [
    'source-set gate',
    'register-source` for all relevant sources',
    'anchor source',
    'mandatory inputs',
    'do not substitute extraction',
  ]);
});

void test('normative backlog docs keep cross-skill handoff and actualization literal', async () => {
  const [processCli, utilitySpec] = await Promise.all([
    readFile(PROCESS_CLI_PATH, 'utf8'),
    readFile(UTILITY_SPEC_PATH, 'utf8'),
  ]);

  assertContainsTerms(processCli, [
    'Кросс-скил handoff и return path',
    'текущий `delivery_state`',
    '`dossier-engineer` ведёт локальный lifecycle',
    '`attention` при этом',
    'dossier-local `next-step` отвечает только на вопрос',
    'supporting evidence для backlog sync, но не заменяют architecture / ADR как canonical upstream truth',
    'shaping / specification с достаточным evidence -> backlog `delivery_state = specified`',
    'planning с достаточным evidence -> backlog `delivery_state = planned`',
    'implementation + closure с достаточным evidence -> backlog `delivery_state = implemented`',
    'Если dossier-side работа выявила новый blocker или unresolved dependency',
    '`queue` отвечает за выбор backlog work; dossier-local `next-step` не заменяет этот backlog-level выбор.',
    '`attention` остаётся backlog-side read model и не переносится в dossier handoff как durable field.',
  ]);

  assertContainsTerms(utilitySpec, [
    'Cross-skill interop invariants',
    '`attention` остаётся backlog-side read model',
    'Минимальный durable backlog -> dossier handoff',
    'supporting evidence для backlog sync, но не заменяют architecture / ADR как canonical upstream truth',
    'dossier shaping / specification с достаточным evidence -> backlog `delivery_state = specified`',
    'dossier planning с достаточным evidence -> backlog `delivery_state = planned`',
    'dossier implementation + closure с достаточным evidence -> backlog `delivery_state = implemented`',
    'dossier-discovered blockers, dependencies, context facts, или cross-cutting decisions -> patch backlog state before dossier workflow continues',
    'use scoped `refresh` after dossier work when updated source documents may have changed backlog-derived state',
    'use `status` before dossier intake',
    'use `items` to inspect selected backlog work before dossier intake or after backlog actualization',
    'use `gaps` before dossier intake when explicit backlog-side blockers must be visible',
    '`queue` chooses which backlog work moves next',
    '`attention` remains a backlog-side read model',
    'dossier `planned` не равен backlog `planned`',
    'dossier `done` не равен backlog `implemented`',
    'dossier-local `next-step` отвечает только на вопрос',
  ]);
});
