import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = path.resolve(TEST_DIR, '..');

const SKILL_PATH = path.join(SKILL_DIR, 'SKILL.md');
const WORKFLOW_PATH = path.join(SKILL_DIR, 'references', 'WORKFLOW.md');
const IMPLEMENTATION_AUDIT_POLICY_PATH = path.join(
  SKILL_DIR,
  'references',
  'implementation-audit-policy.md',
);
const IMPLEMENTATION_LOGGING_PATH = path.join(
  SKILL_DIR,
  'references',
  'implementation-logging.md',
);
const SPEC_AND_PLAN_RISK_PATTERNS_PATH = path.join(
  SKILL_DIR,
  'references',
  'spec-and-plan-risk-patterns.md',
);
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

void test('implementation stage points to audit and logging refs with explicit spec-first audit semantics', async () => {
  const [skill, workflow, auditPolicy, loggingPolicy] = await Promise.all([
    readFile(SKILL_PATH, 'utf8'),
    readFile(WORKFLOW_PATH, 'utf8'),
    readFile(IMPLEMENTATION_AUDIT_POLICY_PATH, 'utf8'),
    readFile(IMPLEMENTATION_LOGGING_PATH, 'utf8'),
  ]);

  const implementation = extractSection(skill, '#### Workflow stage: `implementation`');
  const debtPolicy = extractSection(workflow, '## No-technical-debt policy');

  assertContainsTerms(implementation, [
    '[Implementation audit policy](references/implementation-audit-policy.md)',
    '[Implementation logging](references/implementation-logging.md)',
    'Run `spec-conformance` review first',
    'For multi-step or package-based work, open or update the implementation log before the first mutating edit.',
  ]);
  assertContainsTerms(debtPolicy, [
    '[implementation-logging.md](implementation-logging.md)',
    '[implementation-audit-policy.md](implementation-audit-policy.md)',
    'Run `spec-conformance` review first.',
  ]);
  assertContainsTerms(auditPolicy, [
    '## Review brief template',
    'spec-conformance-reviewer',
    'code-reviewer',
    'security-reviewer',
    '## Follow-up re-audit classifier',
    'Normative/process/docs contract changes',
  ]);
  assertContainsTerms(loggingPolicy, [
    '## Mandatory metadata block',
    'session_id',
    '## Review event log',
    '## Process misses',
    '## Metrics to capture',
    'Spec gap decisions',
    'Implementation freedom decisions',
    'Temporary assumptions',
  ]);
});

void test('spec-compact and plan-slice point to risk patterns and literal risk-killing duties', async () => {
  const [skill, workflow, riskPatterns] = await Promise.all([
    readFile(SKILL_PATH, 'utf8'),
    readFile(WORKFLOW_PATH, 'utf8'),
    readFile(SPEC_AND_PLAN_RISK_PATTERNS_PATH, 'utf8'),
  ]);

  const specCompact = extractSection(skill, '#### Workflow stage: `spec-compact`');
  const planSlice = extractSection(skill, '#### Workflow stage: `plan-slice`');
  const riskHardening = extractSection(workflow, '## Spec and planning risk hardening');

  assertContainsTerms(specCompact, [
    '[Spec and plan risk patterns](references/spec-and-plan-risk-patterns.md)',
    'operator/agent contract explicit',
    'safety and boundary semantics',
    '`normative now`, `implementation freedom`, or `temporary assumption`',
  ]);
  assertContainsTerms(planSlice, [
    '[Spec and plan risk patterns](references/spec-and-plan-risk-patterns.md)',
    'Identify the contract risks that must be killed before close-out.',
    'Plan drift-guard work',
    'add a real usage audit after the main implementation flow',
  ]);
  assertContainsTerms(riskHardening, [
    '[spec-and-plan-risk-patterns.md](spec-and-plan-risk-patterns.md)',
    '`spec-compact` needs explicit operator/agent contract or safety semantics',
    '`plan-slice` must explicitly plan contract-risk cleanup, drift-guard work, or a real usage audit',
  ]);
  assertContainsTerms(riskPatterns, [
    '## During `spec-compact`',
    '## During `plan-slice`',
    'Operator/agent contract',
    'Safety and boundary semantics',
    'Unresolved-decision triage',
    'Contract-risk block',
    'Real usage audit',
    'Corrective backlog categories',
  ]);
});
