import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = path.resolve(TEST_DIR, '..');

const SKILL_PATH = path.join(SKILL_DIR, 'SKILL.md');
const WORKFLOW_PATH = path.join(SKILL_DIR, 'references', 'WORKFLOW.md');
const PROCESS_MODEL_PATH = path.join(SKILL_DIR, 'docs', 'cross-skill-process-model.ru.md');
const BACKLOG_GAP_ANALYSIS_PATH = path.join(
  SKILL_DIR,
  'docs',
  'backlog-process-gap-analysis.ru.md',
);

function extractSection(text: string, heading: string): string {
  const headingIndex = text.indexOf(heading);
  assert.notEqual(headingIndex, -1, `Missing section heading: ${heading}`);

  const sectionStart = headingIndex + heading.length;
  const nextHeadingMatch = /\n#{2,6}\s+/u.exec(text.slice(sectionStart));
  const sectionEnd =
    nextHeadingMatch === null ? text.length : sectionStart + nextHeadingMatch.index;

  return text.slice(sectionStart, sectionEnd);
}

function escapeForRegex(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function assertContainsTerms(text: string, terms: readonly string[]): void {
  for (const term of terms) {
    assert.match(text, new RegExp(escapeForRegex(term), 'u'));
  }
}

void test('dossier docs keep workflow-stage vs shipped-command boundaries explicit', async () => {
  const [skill, workflow] = await Promise.all([
    readFile(SKILL_PATH, 'utf8'),
    readFile(WORKFLOW_PATH, 'utf8'),
  ]);

  const stageVsCommand = extractSection(skill, '## Workflow stages and shipped CLI commands');
  const bootstrap = extractSection(workflow, '## Workflow stage: repository bootstrap (`init`)');
  const defaultFlow = extractSection(workflow, '## Default dossier flow');
  const workflowStagesIndex = skill.indexOf('### Workflow stages');
  const cliCommandsIndex = skill.indexOf('### CLI commands');

  assertContainsTerms(stageVsCommand, [
    'workflow-only unless it appears in the shipped CLI command list',
    'Do not write or infer examples such as `node scripts/dossier.mjs spec-compact`',
    'Shipped CLI commands in the current runtime',
  ]);
  assert.notEqual(workflowStagesIndex, -1, 'Missing grouped workflow stages heading');
  assert.notEqual(cliCommandsIndex, -1, 'Missing grouped CLI commands heading');
  assert.ok(
    workflowStagesIndex < cliCommandsIndex,
    'Workflow stages must be grouped before CLI commands',
  );
  assertContainsTerms(skill, [
    '#### Workflow stage: `init`',
    '#### Workflow stage: `spec-compact`',
    '#### Workflow stage: `plan-slice`',
    '#### Workflow stage: `implementation`',
    '#### Workflow stage: `change-proposal`',
  ]);
  assertContainsTerms(skill, [
    '#### CLI command: `help`',
    '#### CLI command: `feature-intake`',
    '#### CLI command: `dependency-graph`',
    '#### CLI command: `dossier-verify`',
    '#### CLI command: `next-step`',
  ]);
  assertContainsTerms(bootstrap, [
    'This is a workflow stage, not a shipped `dossier.mjs` subcommand.',
    'only when bootstrap explicitly provisions them',
  ]);
  assertContainsTerms(defaultFlow, [
    '`spec-compact`, `plan-slice`, and `implementation` are workflow stages',
  ]);
});

void test('dossier docs keep backlog actualization and handoff boundaries literal', async () => {
  const [skill, workflow, processModel] = await Promise.all([
    readFile(SKILL_PATH, 'utf8'),
    readFile(WORKFLOW_PATH, 'utf8'),
    readFile(PROCESS_MODEL_PATH, 'utf8'),
  ]);

  const actualization = extractSection(skill, '## Backlog actualization rules');
  const closure = extractSection(skill, '## Step closure contract');
  const intake = extractSection(skill, '#### CLI command: `feature-intake`');
  const workflowActualization = extractSection(workflow, '## Backlog actualization rule');

  assertContainsTerms(actualization, [
    'backlog actualization is part of the stage closure contract',
    'do not treat the stage as complete until backlog actualization',
    '`refresh` alone is not backlog actualization',
  ]);
  assertContainsTerms(closure, [
    'If the step changed backlog truth, actualize backlog state through `backlog-engineer` before step closure.',
    'Only after `process_complete: true` and required backlog actualization may the agent say the step is complete.',
  ]);
  assertContainsTerms(intake, [
    'human-facing continuity and traceability only',
    '`next-step` do not parse dossier prose',
  ]);
  assertContainsTerms(workflowActualization, [
    'backlog actualization is part of stage closure',
    'use `patch-item` when dossier work made lifecycle, blocker, dependency, or context facts explicit',
    '`refresh` alone does not actualize `delivery_state`',
  ]);
  assertContainsTerms(processModel, [
    'backlog actualization входит в closure contract этой стадии',
    'stage closure не считается завершённым',
    'Пройти workflow stage `spec-compact`',
    'Пройти workflow stage `plan-slice`',
    'Пройти workflow stage `implementation`',
  ]);
});

void test('historical backlog gap analysis is marked non-normative after stage 2', async () => {
  const gapAnalysis = await readFile(BACKLOG_GAP_ANALYSIS_PATH, 'utf8');

  assertContainsTerms(gapAnalysis, [
    'historical gap-analysis',
    'gaps уже закрыты',
    'текущий нормативный источник',
    'Новые harmonization gaps должны фиксироваться уже в новом документе',
  ]);
});
