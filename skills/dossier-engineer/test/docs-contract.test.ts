import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = path.resolve(TEST_DIR, '..');

const SKILL_PATH = path.join(SKILL_DIR, 'SKILL.md');
const WORKFLOW_PATH = path.join(SKILL_DIR, 'references', 'workflow.md');
const IMPLEMENTATION_AUDIT_POLICY_PATH = path.join(
  SKILL_DIR,
  'references',
  'implementation-audit-policy.md',
);
const WORKFLOW_STAGE_SPEC_COMPACT_PATH = path.join(
  SKILL_DIR,
  'references',
  'workflow-stage-spec-compact.md',
);
const WORKFLOW_STAGE_PLAN_SLICE_PATH = path.join(
  SKILL_DIR,
  'references',
  'workflow-stage-plan-slice.md',
);
const WORKFLOW_STAGE_IMPLEMENTATION_PATH = path.join(
  SKILL_DIR,
  'references',
  'workflow-stage-implementation.md',
);
const WORKFLOW_STAGE_CHANGE_PROPOSAL_PATH = path.join(
  SKILL_DIR,
  'references',
  'workflow-stage-change-proposal.md',
);
const WORKFLOW_STAGE_LOGGING_PATH = path.join(SKILL_DIR, 'references', 'workflow-stage-logging.md');
const SESSION_OPS_LOG_PATH = path.join(SKILL_DIR, 'references', 'session-ops-log.md');
const SPEC_AND_PLAN_RISK_PATTERNS_PATH = path.join(
  SKILL_DIR,
  'references',
  'spec-and-plan-risk-patterns.md',
);
const REPO_AGENTS_TEMPLATE_PATH = path.join(SKILL_DIR, 'references', 'REPO_AGENTS_TEMPLATE.md');
const EXAMPLE_REPO_AGENTS_PATH = path.join(SKILL_DIR, 'assets', 'example-repo', 'AGENTS.md');
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
  const backlogActualization = extractSection(skill, '## Backlog actualization rules');
  const bootstrap = extractSection(workflow, '## Workflow stage: repository bootstrap (`init`)');
  const defaultFlow = extractSection(workflow, '## Default dossier flow');
  const initStage = extractSection(skill, '#### Workflow stage: `init`');
  const specCompactStage = extractSection(skill, '#### Workflow stage: `spec-compact`');
  const planSliceStage = extractSection(skill, '#### Workflow stage: `plan-slice`');
  const implementationStage = extractSection(skill, '#### Workflow stage: `implementation`');
  const dependencyCheckStage = extractSection(skill, '#### Workflow stage: `dependency-check`');
  const changeProposalStage = extractSection(skill, '#### Workflow stage: `change-proposal`');
  const intakeCommand = extractSection(skill, '#### CLI command: `feature-intake`');
  const lintCommand = extractSection(skill, '#### CLI command: `lint-dossiers` (recommended)');
  const nextStepCommand = extractSection(skill, '#### CLI command: `next-step`');
  const workflowStagesIndex = skill.indexOf('### Workflow stages');
  const cliCommandsIndex = skill.indexOf('### CLI commands');

  assertContainsTerms(stageVsCommand, [
    '[Workflow guide](references/workflow.md)',
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
  assertContainsTerms(initStage, [
    '[Workflow guide: repository bootstrap](references/workflow.md#workflow-stage-repository-bootstrap-init)',
    '[Detailed stage steps](references/workflow-stage-init.md)',
  ]);
  assertContainsTerms(specCompactStage, [
    '[Detailed stage steps](references/workflow-stage-spec-compact.md)',
  ]);
  assertContainsTerms(planSliceStage, [
    '[Detailed stage steps](references/workflow-stage-plan-slice.md)',
  ]);
  assertContainsTerms(implementationStage, [
    '[Detailed stage steps](references/workflow-stage-implementation.md)',
  ]);
  assertContainsTerms(dependencyCheckStage, [
    '[Detailed stage steps](references/workflow-stage-dependency-check.md)',
  ]);
  assertContainsTerms(changeProposalStage, [
    '[Detailed stage steps](references/workflow-stage-change-proposal.md)',
    'explicit dossier-side `backlog impact verdict`',
    '`patch existing item`',
    '`source update`',
    '`new backlog item`',
    'If the verdict is not `no-op`, backlog actualization through `backlog-engineer` finished before stage closure.',
  ]);
  assertContainsTerms(intakeCommand, [
    '[Workflow guide: feature-intake](references/workflow.md#cli-command-feature-intake)',
  ]);
  assertContainsTerms(backlogActualization, [
    '[Workflow guide: backlog actualization rule](references/workflow.md#backlog-actualization-rule)',
  ]);
  assertContainsTerms(lintCommand, ['[Lint rules](references/lint-rules.md)']);
  assertContainsTerms(nextStepCommand, [
    '[Workflow guide: next-step](references/workflow.md#cli-command-next-step)',
  ]);
  assertContainsTerms(defaultFlow, [
    '`spec-compact`, `plan-slice`, and `implementation` are workflow stages',
    'Detailed workflow-stage steps:',
    '`init`: [workflow-stage-init.md](workflow-stage-init.md)',
    '`dependency-check`: [workflow-stage-dependency-check.md](workflow-stage-dependency-check.md)',
    '`change-proposal`: [workflow-stage-change-proposal.md](workflow-stage-change-proposal.md)',
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
    'During `change-proposal`, determine one explicit dossier-side `backlog impact verdict` before closure:',
    '`source update`',
    '`new backlog item`',
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

void test('contract-drift-audit stays a support signal rather than the authoritative backlog-impact classifier', async () => {
  const [utilitySpec, utilityArchitecture] = await Promise.all([
    readFile(path.join(SKILL_DIR, 'docs', 'utility-spec.ru.md'), 'utf8'),
    readFile(path.join(SKILL_DIR, 'docs', 'utility-architecture.md'), 'utf8'),
  ]);

  assertContainsTerms(utilitySpec, [
    'supporting signal для `Workflow stage: change-proposal`',
    'не определяет authoritative dossier-side `backlog impact verdict`',
    '`no-op`',
    '`patch existing item`',
    '`source update`',
    '`new backlog item`',
    'authoritative остаётся stage-level verdict',
  ]);
  assertContainsTerms(utilityArchitecture, [
    'authoritative `backlog impact verdict` for `Workflow stage: change-proposal` remains stage-owned process logic',
    'do not move that verdict into dossier-local runtime heuristics',
  ]);
});

void test('implementation stage points to audit and workflow-stage logging refs with explicit spec-first audit semantics', async () => {
  const [skill, workflow, implementationSteps, auditPolicy, loggingPolicy] = await Promise.all([
    readFile(SKILL_PATH, 'utf8'),
    readFile(WORKFLOW_PATH, 'utf8'),
    readFile(WORKFLOW_STAGE_IMPLEMENTATION_PATH, 'utf8'),
    readFile(IMPLEMENTATION_AUDIT_POLICY_PATH, 'utf8'),
    readFile(WORKFLOW_STAGE_LOGGING_PATH, 'utf8'),
  ]);

  const implementation = extractSection(skill, '#### Workflow stage: `implementation`');
  const debtPolicy = extractSection(workflow, '## No-technical-debt policy');

  assertContainsTerms(implementation, [
    '[Implementation audit policy](references/implementation-audit-policy.md)',
    '[Workflow stage logging](references/workflow-stage-logging.md)',
    '[Workflow guide](references/workflow.md#no-technical-debt-policy)',
    '[Detailed stage steps](references/workflow-stage-implementation.md)',
  ]);
  assertContainsTerms(implementationSteps, [
    'Evaluate workflow-stage logging triggers using [workflow-stage-logging.md](workflow-stage-logging.md).',
    'open or update the stage log before the first mutating edit',
    'Apply the [No-technical-debt policy](workflow.md#no-technical-debt-policy)',
    'Run `spec-conformance` review first',
    'Persist only the independent reviewer verdict with `review-artifact`',
    'Close the step with `dossier-step-close` only after the required backlog actualization is done.',
    'If logging was required, update the stage log with review events, debt review result, process misses, backlog actualization result, commit metadata when available, and links to applicable verification, review, and step-close artifacts.',
  ]);
  assertContainsTerms(debtPolicy, [
    'Apply this policy during `Workflow stage: implementation`',
    'Run `node scripts/dossier.mjs debt-audit --changed-only`',
    'Resolve or explicitly record every debt item in a canonical artifact.',
    'This policy is about debt handling only.',
  ]);
  assertContainsTerms(auditPolicy, [
    '## Review brief template',
    'spec-conformance-reviewer',
    'code-reviewer',
    'security-reviewer',
    '## Review orchestration telemetry',
    'update the stage log after every audit reround',
    '`review_retry_count`',
    '`transport_failures_total`',
    '`rerun_reasons`',
    'transport/runtime instability',
    '## Follow-up re-audit classifier',
    'Normative/process/docs contract changes',
  ]);
  assertContainsTerms(loggingPolicy, [
    '## Applies to',
    'Workflow stage: spec-compact',
    'Workflow stage: plan-slice',
    'Workflow stage: implementation',
    '.dossier/logs/<feature>/<stage>-<cycle>.md',
    '## Low-overhead skip path',
    '## Mandatory metadata block',
    'session_id',
    '## Required narrative sections',
    '## Stage-specific sections',
    '## Review event log',
    '## Review orchestration telemetry',
    '## Backlog actualization',
    '## Process misses',
    '## Metrics to capture',
    'review policy',
    'debt review',
    'commit metadata',
    'Feature Dossier',
    'process telemetry',
    'review_requested_ts',
    'first_review_agent_started_ts',
    'review_models',
    'review_retry_count',
    'review_wait_minutes',
    'transport_failures_total',
    'rerun_reasons',
    'operator_review_interventions_total',
    'Spec gap decisions',
    'Implementation freedom decisions',
    'Temporary assumptions',
  ]);
});

void test('active dossier instructions use the unified workflow-stage logging reference', async () => {
  const [skill, specCompactSteps, planSliceSteps, implementationSteps, loggingPolicy] =
    await Promise.all([
      readFile(SKILL_PATH, 'utf8'),
      readFile(WORKFLOW_STAGE_SPEC_COMPACT_PATH, 'utf8'),
      readFile(WORKFLOW_STAGE_PLAN_SLICE_PATH, 'utf8'),
      readFile(WORKFLOW_STAGE_IMPLEMENTATION_PATH, 'utf8'),
      readFile(WORKFLOW_STAGE_LOGGING_PATH, 'utf8'),
    ]);

  const specCompact = extractSection(skill, '#### Workflow stage: `spec-compact`');
  const planSlice = extractSection(skill, '#### Workflow stage: `plan-slice`');
  const implementation = extractSection(skill, '#### Workflow stage: `implementation`');
  const coreArtifacts = extractSection(skill, '## Core artifacts');

  assertContainsTerms(coreArtifacts, [
    '.dossier/logs/<feature>/<stage>-<cycle>.md',
    '.dossier/ops/<session>/<episode>.md',
  ]);
  assertContainsTerms(specCompact, [
    '[Workflow stage logging](references/workflow-stage-logging.md)',
    'If a workflow-stage logging trigger fired, the stage log was opened or updated.',
    'The stage log records inputs, decisions/reclassifications, operator/review cycles, process misses, and backlog actualization outcome.',
    'The stage log does not duplicate AC text or dossier truth.',
  ]);
  assertContainsTerms(planSlice, [
    '[Workflow stage logging](references/workflow-stage-logging.md)',
    'If a workflow-stage logging trigger fired, the stage log was opened or updated.',
    'The stage log records slice boundary decisions, planning assumptions/fallbacks, review cycles, process misses, and backlog actualization outcome.',
    'The stage log does not duplicate slice or task text from the dossier.',
  ]);
  assertContainsTerms(implementation, [
    '[Workflow stage logging](references/workflow-stage-logging.md)',
    'For multi-step or package-based work, the stage log was opened before the first mutating edit and kept current through close-out.',
  ]);
  assertContainsTerms(specCompactSteps, [
    'Evaluate workflow-stage logging triggers using [workflow-stage-logging.md](workflow-stage-logging.md).',
    'If logging is required, open `.dossier/logs/...` before the first substantive spec mutation.',
    'If logging was required, update the stage log with review events, decisions/reclassifications, process misses, and the planned backlog actualization outcome before closure.',
    'If logging was required, update the stage log with the backlog actualization result and links to applicable verification, review, and step-close artifacts.',
  ]);
  assertContainsTerms(planSliceSteps, [
    'Evaluate workflow-stage logging triggers using [workflow-stage-logging.md](workflow-stage-logging.md).',
    'If logging is required, open `.dossier/logs/...` before the first substantive planning mutation.',
    'If logging was required, update the stage log with slice boundary decisions, assumptions/fallbacks, review events, process misses, and the planned backlog actualization outcome before closure.',
    'If logging was required, update the stage log with the backlog actualization result and links to applicable verification, review, and step-close artifacts.',
  ]);
  assertContainsTerms(loggingPolicy, [
    'A stage log is process telemetry.',
    'It does not replace the Feature Dossier.',
    'stage: spec-compact | plan-slice | implementation',
    'log_required_reason',
    'review_requested_ts',
    'rerun_reasons',
    'transport_runtime_instability',
    '`spec-compact`',
    '`plan-slice`',
    '`implementation`',
  ]);

  for (const activeText of [
    skill,
    specCompactSteps,
    planSliceSteps,
    implementationSteps,
    loggingPolicy,
  ]) {
    assert.doesNotMatch(activeText, /references\/implementation-logging\.md/u);
  }
});

void test('skill-wide review sections stay distinct from implementation-specific audit policy', async () => {
  const skill = await readFile(SKILL_PATH, 'utf8');

  const independentReview = extractSection(skill, '## Independent review execution model');
  const reviewChecklistRules = extractSection(skill, '## Review checklist design rules');

  assertContainsTerms(independentReview, [
    'This section defines the skill-wide independence rule.',
    'For `Workflow stage: implementation`, the audit stack, review brief, and classifier-based re-audit rules live in [Implementation audit policy](references/implementation-audit-policy.md).',
  ]);
  assertContainsTerms(reviewChecklistRules, [
    'When a stage has a dedicated audit policy, use it instead of inventing a local audit stack.',
    'For `Workflow stage: implementation`, use [Implementation audit policy](references/implementation-audit-policy.md) for audit order, brief shape, and classifier-based re-audit rules.',
  ]);
});

void test('session-level ops log routing stays distinct from workflow-stage logging', async () => {
  const [skill, workflow, sessionOpsLog] = await Promise.all([
    readFile(SKILL_PATH, 'utf8'),
    readFile(WORKFLOW_PATH, 'utf8'),
    readFile(SESSION_OPS_LOG_PATH, 'utf8'),
  ]);

  const coreArtifacts = extractSection(skill, '## Core artifacts');
  const opsRouting = extractSection(skill, '## Session-level ops log routing');
  const opsWorkflow = extractSection(workflow, '## Session-level ops log');

  assertContainsTerms(coreArtifacts, [
    '.dossier/ops/<session>/<episode>.md',
    'session-level ops telemetry',
  ]);
  assertContainsTerms(opsRouting, [
    '[Session-level ops log](references/session-ops-log.md)',
    'cross-skill episode',
    'Do not open it for ordinary stage-local rerounds',
    'Keep stage-local decisions in the relevant stage log',
  ]);
  assertContainsTerms(opsWorkflow, [
    '[session-ops-log.md](session-ops-log.md)',
    '.dossier/ops/<session>/<episode>.md',
    'outside one clean dossier stage',
    'Update the ops log when skill ownership, touched artifacts, or outcome changes materially.',
  ]);
  assertContainsTerms(sessionOpsLog, [
    '## Applies to',
    '## Purpose',
    '.dossier/ops/<session>/<episode>.md',
    '## When the ops log is required',
    '## When not to open it',
    'episode_kind',
    'skills_involved',
    'linked_stage_logs',
    'linked_review_artifacts',
    'linked_verification_artifacts',
    'linked_backlog_artifacts',
    'Do not use this as a second stage log.',
  ]);
});

void test('spec-compact and plan-slice point to risk patterns and literal risk-killing duties', async () => {
  const [skill, workflow, specCompactSteps, planSliceSteps, riskPatterns] = await Promise.all([
    readFile(SKILL_PATH, 'utf8'),
    readFile(WORKFLOW_PATH, 'utf8'),
    readFile(WORKFLOW_STAGE_SPEC_COMPACT_PATH, 'utf8'),
    readFile(WORKFLOW_STAGE_PLAN_SLICE_PATH, 'utf8'),
    readFile(SPEC_AND_PLAN_RISK_PATTERNS_PATH, 'utf8'),
  ]);

  const specCompact = extractSection(skill, '#### Workflow stage: `spec-compact`');
  const planSlice = extractSection(skill, '#### Workflow stage: `plan-slice`');
  const riskHardening = extractSection(workflow, '## Spec and planning risk hardening');

  assertContainsTerms(specCompact, [
    '[Spec and plan risk patterns](references/spec-and-plan-risk-patterns.md)',
    '[Workflow stage logging](references/workflow-stage-logging.md)',
    '[Detailed stage steps](references/workflow-stage-spec-compact.md)',
  ]);
  assertContainsTerms(planSlice, [
    '[Spec and plan risk patterns](references/spec-and-plan-risk-patterns.md)',
    '[Workflow stage logging](references/workflow-stage-logging.md)',
    '[Detailed stage steps](references/workflow-stage-plan-slice.md)',
  ]);
  assertContainsTerms(specCompactSteps, [
    'make the operator/agent contract explicit',
    'add the relevant safety and boundary semantics',
    '`normative now`, `implementation freedom`, or `temporary assumption`',
  ]);
  assertContainsTerms(planSliceSteps, [
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

void test('repo AGENTS template reinforces current common-command and audit-stack rules', async () => {
  const [template, example] = await Promise.all([
    readFile(REPO_AGENTS_TEMPLATE_PATH, 'utf8'),
    readFile(EXAMPLE_REPO_AGENTS_PATH, 'utf8'),
  ]);

  for (const text of [template, example]) {
    assertContainsTerms(text, [
      'Replace the placeholders with the real formatter, linter, and test commands for this repository.',
      "Use the repository's actual dossier command surface after bootstrap.",
      'If bootstrap created or preserved repo-local `scripts/dossier.mjs`, commands may look like this:',
      '- Format code: `<repo format command>`',
      '- Lint code: `<repo lint command>`',
      '- Run tests: `<repo test command>`',
      'node scripts/dossier.mjs index-refresh',
      'node scripts/dossier.mjs lint-dossiers',
      'node scripts/dossier.mjs debt-audit',
      '`spec-conformance` first;',
      '`code-reviewer` and `security-reviewer` when the changed scope includes code;',
    ]);
  }

  const changeProposalSteps = await readFile(WORKFLOW_STAGE_CHANGE_PROPOSAL_PATH, 'utf8');
  assertContainsTerms(changeProposalSteps, [
    '`debt-audit` (compatibility alias: `marker-audit`)',
    'Select one explicit dossier-side `backlog impact verdict`',
    '`no-op` only when all of the following are true',
    'no backlog-relevant canonical source was created or changed; ordinary dossier wording edits alone do not count, but ADR decisions logged through `adr-log` do',
    'dossier SSoT wording edits alone do not trigger this verdict unless they introduce or change such a source',
    'If the change both updates a canonical source and changes current-work truth, treat `source update` as the primary verdict.',
    'If the verdict is not `no-op`, return to `backlog-engineer` and complete the required backlog actualization before closing the stage.',
  ]);
});
