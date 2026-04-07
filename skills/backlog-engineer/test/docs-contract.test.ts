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
const IMPLEMENTATION_PLAN_PATH = path.join(SKILL_DIR, 'docs', 'implementation-plan.ru.md');

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
