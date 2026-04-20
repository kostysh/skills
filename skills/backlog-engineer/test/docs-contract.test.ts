import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { renderManagedGitignoreContent } from '../src/artifacts/gitignore-store.ts';
import { ERROR_CODES } from '../src/errors/error-codes.ts';
import {
  PacketCommandOutputSchema,
  PatchItemCommandOutputSchema,
  QueueCommandOutputSchema,
  RemoveItemCommandOutputSchema,
  StatusCommandOutputSchema,
} from '../src/schemas/index.ts';

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
const PACKET_AND_PATCH_PATH = path.join(SKILL_DIR, 'references', 'packet-and-patch.md');
const DATA_MODEL_PATH = path.join(SKILL_DIR, 'references', 'data-model.md');
const EXAMPLES_AND_TEMPLATES_PATH = path.join(SKILL_DIR, 'references', 'examples-and-templates.md');
const PROCESS_CLI_PATH = path.join(SKILL_DIR, 'docs', 'process-cli.ru.md');
const UTILITY_SPEC_PATH = path.join(SKILL_DIR, 'docs', 'utility-spec.ru.md');
const IMPLEMENTATION_PLAN_PATH = path.join(SKILL_DIR, 'docs', 'refactoring-plan-9.ru.md');

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

void test('patch and status output docs stay aligned with replay artifact integrity invariants', async () => {
  const [skill, reference, utilitySpec] = await Promise.all([
    readFile(SKILL_PATH, 'utf8'),
    readFile(COMMAND_REFERENCE_PATH, 'utf8'),
    readFile(UTILITY_SPEC_PATH, 'utf8'),
  ]);

  assertContainsTerms(skill, [
    'canonical_patch_path',
    'immutable_replay_artifact',
    'artifact_integrity.applied_canonical_paths_exist',
    'missing canonical artifacts block clean dossier stage closure',
  ]);
  assertContainsTerms(reference, [
    'canonical_patch_path',
    'canonical_patch_purpose = "immutable_replay_artifact"',
    'BE_CANONICAL_ARTIFACT_MISSING',
    'artifact_integrity.missing_canonical_paths',
  ]);
  assertContainsTerms(utilitySpec, [
    'BE_CANONICAL_ARTIFACT_MISSING',
    'applied registry ссылается на отсутствующий canonical packet/patch artifact',
    'referenced by applied registry, source registry, packet registry, dependency graph или item metadata',
  ]);

  const dryRunPatch = PatchItemCommandOutputSchema.safeParse({
    dry_run: true,
    authored_patch_path: '/abs/backlog/drafts/auth.patch.json',
    counts: {
      updated: 1,
      todo_created: 0,
      todo_updated: 0,
      todo_removed: 0,
    },
    updated: ['auth-core'],
    todo_created: [],
    todo_updated: [],
    todo_removed: [],
    next_commands: [],
  });
  assert.equal(dryRunPatch.success, true);

  const realRemove = RemoveItemCommandOutputSchema.safeParse({
    dry_run: false,
    authored_patch_path: '/abs/backlog/drafts/remove-auth.patch.json',
    canonical_patch_path: '/abs/backlog/patches/abcd1234--remove-auth.patch.json',
    canonical_patch_purpose: 'immutable_replay_artifact',
    counts: {
      removed: 1,
      todo_created: 0,
      todo_updated: 0,
      todo_removed: 1,
    },
    removed: ['legacy-auth-ui'],
    todo_created: [],
    todo_updated: [],
    todo_removed: ['legacy-auth-ui'],
    next_commands: [],
  });
  assert.equal(realRemove.success, true);

  const status = StatusCommandOutputSchema.safeParse({
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
    artifact_integrity: {
      applied_canonical_paths_exist: true,
      missing_canonical_paths: [],
    },
  });
  assert.equal(status.success, true);
  assert.equal(ERROR_CODES.includes('BE_CANONICAL_ARTIFACT_MISSING'), true);
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
    'canonical_patch_path',
    'immutable_replay_artifact',
    'source registry stores `path` as a normalized POSIX path relative to backlog root',
  ]);

  assert.equal(ERROR_CODES.includes('BE_MUTATION_LOCKED'), true);
  assert.match(renderManagedGitignoreContent(''), /\/\.backlog\/mutation\.lock/u);
});

void test('current implementation plan keeps the doc-sync checklist explicit', async () => {
  const plan = await readFile(IMPLEMENTATION_PLAN_PATH, 'utf8');

  assertContainsTerms(plan, [
    'docs-contract tests',
    '`SKILL.md`',
    '`references/operator-workflows.md`',
    'targeted runtime tests',
    'active dossier contract',
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
    'stop and ask the operator to confirm the canonical source set',
  ]);

  assertContainsTerms(workflow, [
    '### 2. Close the source-set gate',
    'anchor source',
    'exclusive source',
    'minimum source set',
    'Self-expanding source graph rule',
    'must not substitute extraction',
    'stop and ask the operator to confirm the canonical source set',
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

  const [skill, operatorWorkflows, commandReference] = await Promise.all([
    readFile(SKILL_PATH, 'utf8'),
    readFile(OPERATOR_WORKFLOWS_PATH, 'utf8'),
    readFile(COMMAND_REFERENCE_PATH, 'utf8'),
  ]);

  const actualizationSection = extractSection(skill, '## Backlog actualization after dossier work');

  assertContainsTerms(actualizationSection, [
    'two truthful closure branches',
    '`refresh + patch`',
    '`template patch`',
    '`patch-item --dry-run`',
    'confirm scoped truth with `items`',
    'confirm canonical artifact integrity with `status`',
    'use `status` as the required artifact-integrity confirmation surface',
    'use `status --refresh` only when a wider global integrity sweep is explicitly needed',
    'backlog actualization is part of that stage closure contract',
    'do not treat the dossier stage as complete until required backlog actualization is finished',
    'use `patch-item` for `delivery_state` changes',
    'use scoped `refresh` only when updated source documents may have changed source-derived backlog state',
    '`refresh` alone does not actualize `delivery_state`',
    'dossier-side `backlog impact verdict`',
    '`no-op` means no backlog mutation',
    '`patch existing item` means:',
    'resolve the already known impacted items',
    '`source update` means:',
    'if the canonical source is new, `register-source` first',
    '`update-source-path`',
    '`remove-source`',
    '`template packet` -> `packet`',
    'stale refresh-managed review todo are cleared only through scoped `refresh`',
    '`new backlog item` means keep existing item history honest',
    'an already `implemented` item stays `implemented`',
    'partial sync is not an allowed closure outcome',
  ]);

  assertContainsTerms(operatorWorkflows, [
    'workflow stages, not to shipped backlog or dossier CLI subcommands',
    'workflow stage `spec-compact`',
    'workflow stage `plan-slice`',
    'before `dossier-step-close`',
    'before that stage is treated as complete',
    '`patch-item --dry-run`',
    '`items` -> `status`',
    '`refresh` alone does not actualize `delivery_state`',
    'part of stage closure',
    'Update backlog after dossier `change-proposal`',
    'read the dossier-side `backlog impact verdict`',
    'confirm clean state through `items` and `status`',
    '`update-source-path`',
    '`remove-source`',
    'primary branch = `source update`',
    'partial sync is not an allowed closure outcome',
    'an already `implemented` item does not silently downgrade',
  ]);

  assertContainsTerms(commandReference, [
    '`template patch` is the required default starting point',
    '`search` with shipped structural filters',
    'confirm scoped truth with `items` whenever item-card truth changed',
    'reserve `status --refresh` for cases where a fresh global integrity sweep is explicitly needed',
    'lifecycle `refresh + patch` is a literal two-phase branch',
    'stale refresh-managed review todo are cleared through scoped `refresh`',
    '`patch-item`-driven actualization belongs to the closure contract',
    '`refresh` alone does not actualize `delivery_state`',
    'creates a new ADR or other canonical source',
    'use `packet` only for the `new backlog item` branch',
    '`patch existing item` and the dependent-item update step after `source update`',
    'do not stop at partial sync after `refresh`',
    'confirm scoped truth with `items` whenever item-card truth changed',
    'confirm artifact integrity with `status` before treating the dossier stage as cleanly closed',
    'use `status --refresh` only when a wider global integrity sweep is explicitly needed',
  ]);

  assertContainsTerms(utilitySpec, [
    '`backlog impact verdict`',
    '`no-op` -> backlog mutation отсутствует',
    '`source update` -> if the canonical source is new, register it first',
    'новый ADR, созданный во время `change-proposal`, всегда считается backlog-relevant source update',
    'already `implemented` item stays `implemented`',
    'partial sync',
  ]);
});

void test('active authoring docs keep deterministic dossier-side actualization and clean confirmation explicit', async () => {
  const [packetAndPatch, dataModel, examples] = await Promise.all([
    readFile(PACKET_AND_PATCH_PATH, 'utf8'),
    readFile(DATA_MODEL_PATH, 'utf8'),
    readFile(EXAMPLES_AND_TEMPLATES_PATH, 'utf8'),
  ]);

  assertContainsTerms(packetAndPatch, [
    'for dossier-side actualization, start from `template patch` by default',
    'truly new backlog work',
    '`template packet` -> `packet`',
    '`patch-item --dry-run` is the required pre-apply step',
  ]);

  assertContainsTerms(dataModel, [
    'resolve them before patch authoring whenever scope is already knowable',
    'truly separate delta',
    '`template packet` -> `packet`',
    'Refresh-managed review todo',
  ]);

  assertContainsTerms(examples, [
    'Canonical lifecycle `patch-item` branch',
    'Canonical lifecycle `refresh + patch` branch',
    'search --claim-keys "auth-session-timeout"',
    'confirm scoped truth with `items`',
    'confirm artifact integrity with `status`',
    'use `status --refresh` only when a wider global integrity sweep is explicitly needed',
    'Source moved during `change-proposal`',
    '`update-source-path`',
    'Source deleted during `change-proposal`',
    '`remove-source`',
    'New delta item during `change-proposal`',
    '`template packet` -> `packet`',
    'Stale refresh-managed review todo after evidence changed',
    'Do not close refresh-managed review todo through `patch-item remove_todo`',
  ]);

  assert.doesNotMatch(examples, /search --text/u);
});
