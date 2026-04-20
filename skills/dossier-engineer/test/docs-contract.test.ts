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
const DOSSIER_TEMPLATE_PATH = path.join(SKILL_DIR, 'references', 'DOSSIER_TEMPLATE.md');
const FEATURE_INTAKE_LOGGING_PATH = path.join(SKILL_DIR, 'references', 'feature-intake-logging.md');
const LIFECYCLE_TELEMETRY_PATH = path.join(
  SKILL_DIR,
  'references',
  'lifecycle-telemetry.md',
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
  const [skill, workflow, intakeLogging] = await Promise.all([
    readFile(SKILL_PATH, 'utf8'),
    readFile(WORKFLOW_PATH, 'utf8'),
    readFile(FEATURE_INTAKE_LOGGING_PATH, 'utf8'),
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
    '#### CLI command: `lifecycle-refresh`',
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
    'define `allowed_stop_points` before implementation starts',
  ]);
  assertContainsTerms(implementationStage, [
    '[Detailed stage steps](references/workflow-stage-implementation.md)',
    'The implementation did not claim final completion after a partial green increment',
    'backlog artifact integrity was confirmed clean',
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
    '[Feature intake logging](references/feature-intake-logging.md)',
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
  assertContainsTerms(intakeLogging, [
    '## Applies to',
    'CLI command: feature-intake',
    'It does not apply to workflow stages such as `spec-compact`, `plan-slice`, or `implementation`.',
  ]);
});

void test('dossier docs keep backlog actualization and handoff boundaries literal', async () => {
  const [skill, workflow, processModel, intakeLogging] = await Promise.all([
    readFile(SKILL_PATH, 'utf8'),
    readFile(WORKFLOW_PATH, 'utf8'),
    readFile(PROCESS_MODEL_PATH, 'utf8'),
    readFile(FEATURE_INTAKE_LOGGING_PATH, 'utf8'),
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
    'Only after `process_complete: true`, refreshed lifecycle telemetry, and required backlog actualization may the agent say the step is complete.',
    'If the intake log is missing or stale, `process_complete` is not truthful.',
  ]);
  assertContainsTerms(intake, [
    'human-facing continuity and traceability only',
    '`next-step` do not parse dossier prose',
    'Operator rerounds, `index-refresh` reruns, and backlog actualization follow-ups stay in the same intake-log cycle',
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
  assertContainsTerms(intakeLogging, [
    '`feature-intake` is not truthfully complete until all are true:',
    'required backlog actualization is settled',
    'whether intake surfaced blockers, dependencies, or missing context',
  ]);
});

void test('dossier docs keep canonical backlog access fail-closed and downstream-only', async () => {
  const [skill, workflow, processModel, template, example] = await Promise.all([
    readFile(SKILL_PATH, 'utf8'),
    readFile(WORKFLOW_PATH, 'utf8'),
    readFile(PROCESS_MODEL_PATH, 'utf8'),
    readFile(REPO_AGENTS_TEMPLATE_PATH, 'utf8'),
    readFile(EXAMPLE_REPO_AGENTS_PATH, 'utf8'),
  ]);

  const canonicalAccess = extractSection(skill, '## Canonical backlog access');
  const workflowRole = extractSection(workflow, '## Role in the cross-skill process');
  const backlogQuestion = extractSection(processModel, '### Вопрос 1. Что делать дальше по проекту?');
  const nextStepModel = extractSection(processModel, '## Как понимать `next-step` в новой модели');

  assertContainsTerms(canonicalAccess, [
    'Current backlog truth must be read only through canonical `backlog-engineer` read commands.',
    'use `queue` to answer "what can be taken next";',
    'if fields beyond chain structure are needed after `queue`, call `items --item-keys ...`;',
    'if the operator explicitly wants a file on disk, `report` remains a valid backlog-side file-output path.',
    'do not answer backlog status, queue, attention, blocker, or readiness questions by reading `.backlog/*`, packet files, patch files, or drafts;',
    'those artifacts are raw utility state, not operator-facing source of truth.',
    'raw artifact inspection is still acceptable when debugging the backlog utility itself or when the operator explicitly asks for raw backlog artifacts.',
    'if canonical command output is insufficient, say so explicitly instead of compensating with repo file inspection or raw backlog artifact parsing.',
  ]);
  assertContainsTerms(workflowRole, [
    'Canonical backlog access:',
    'read current backlog truth only through canonical `backlog-engineer` commands;',
    'use `queue` for "what can be taken next";',
    'if full task cards or fields beyond chain structure are needed after `queue`, call `items --item-keys ...`;',
    'do not substitute `.backlog/*`, packet files, patch files, or drafts for canonical command output;',
    'this prohibition is about operator-facing backlog-truth answers, not backlog-utility debugging or explicit raw-artifact inspection requested by the operator;',
    'if canonical output is insufficient, surface that limitation instead of parsing raw backlog artifacts.',
  ]);
  assertContainsTerms(backlogQuestion, [
    'если после `queue` нужны full task cards или поля beyond chain structure, используется `items --item-keys ...`;',
    '`.backlog/*`, packet/patch files и drafts не являются operator-facing source of truth;',
    'это ограничение относится к operator-facing backlog-truth answers, а не к debugging backlog utility или случаю, когда оператор прямо просит raw artifacts;',
    'если canonical output недостаточен, это нужно явно сказать, а не читать raw utility artifacts.',
  ]);
  assertContainsTerms(nextStepModel, [
    '`dossier-engineer next-step` читает только structured dossier state и durable artifacts; CLI никогда не интерпретирует prose из dossier body.',
    '`backlog-engineer` determines whether work can move;',
    '`dossier-engineer next-step` determines how the selected work should move locally.',
  ]);

  for (const text of [template, example]) {
    assertContainsTerms(text, [
      'Read current backlog truth only through canonical `backlog-engineer` commands.',
      'Utility-owned internal backlog files are not an operator-facing source of truth.',
      'Use `queue -> items --item-keys ...` when full task cards are needed after `queue`.',
    ]);
  }
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
  const [skill, workflow, implementationSteps, auditPolicy, loggingPolicy, lifecycleTelemetry] = await Promise.all([
    readFile(SKILL_PATH, 'utf8'),
    readFile(WORKFLOW_PATH, 'utf8'),
    readFile(WORKFLOW_STAGE_IMPLEMENTATION_PATH, 'utf8'),
    readFile(IMPLEMENTATION_AUDIT_POLICY_PATH, 'utf8'),
    readFile(WORKFLOW_STAGE_LOGGING_PATH, 'utf8'),
    readFile(LIFECYCLE_TELEMETRY_PATH, 'utf8'),
  ]);

  const implementation = extractSection(skill, '#### Workflow stage: `implementation`');
  const debtPolicy = extractSection(workflow, '## No-technical-debt policy');

  assertContainsTerms(implementation, [
    '[Implementation audit policy](references/implementation-audit-policy.md)',
    '[Workflow stage logging](references/workflow-stage-logging.md)',
    '[Lifecycle telemetry](references/lifecycle-telemetry.md)',
    '[Workflow guide](references/workflow.md#no-technical-debt-policy)',
    '[Detailed stage steps](references/workflow-stage-implementation.md)',
    'Every blocking external audit launch declared model, reasoning effort, required skill, scope, and allowed-model verdict before spawning.',
    'No blocking audit verdict from a weak/mini model was accepted as review evidence.',
  ]);
  assertContainsTerms(implementationSteps, [
    'Open or update the stage log according to [workflow-stage-logging.md](workflow-stage-logging.md) before the first mutating edit.',
    'Before treating the first green increment as closure',
    'Apply the [No-technical-debt policy](workflow.md#no-technical-debt-policy)',
    'run the `Audit launch gate` from [Implementation audit policy](implementation-audit-policy.md) for `early-security-checkpoint`; do not spawn if the gate fails.',
    'run `spec-conformance` review first',
    'Run the `Audit launch gate` from [Implementation audit policy](implementation-audit-policy.md) for `spec-conformance`; do not spawn if the gate fails.',
    'run the `Audit launch gate` before each nested `code` and `security` review; do not spawn if either gate fails.',
    'Run the `Audit launch gate` for `independent-review`; do not spawn if the gate fails.',
    'Apply operational launch guardrails from [Implementation audit policy](implementation-audit-policy.md) after each launch passes the model gate.',
    'run the early security seam checkpoint',
    'request it as a standalone line before continuing',
    'Please authorize spawning the required external audit/review agents for this phase.',
    'Establish the intended final tree before closure',
    'Use this closure sequence: intended final tree -> verification -> external audits -> review / verification / step-close artifacts -> lifecycle-refresh -> commit -> trace-only metadata backfill when needed.',
    'Persist only the independent reviewer verdict with `review-artifact`',
    'Close the step with `dossier-step-close` only after the required backlog actualization and artifact-integrity confirmation are done.',
    'Update the stage log with slice status, completion decision, review events, debt review result, process misses, backlog actualization and artifact-integrity result, freshness fields, commit metadata when available, and links to applicable verification, review, and step-close artifacts.',
    'Run `node scripts/dossier.mjs lifecycle-refresh --feature-id F-XXXX --feature-cycle-id fcNN`',
    'A final implementation close-out is allowed only when one of these conditions is true:',
  ]);
  assertContainsTerms(debtPolicy, [
    'Apply this policy during `Workflow stage: implementation`',
    'Run `node scripts/dossier.mjs debt-audit --changed-only`',
    'Resolve or explicitly record every debt item in a canonical artifact.',
    'This policy is about debt handling only.',
  ]);
  assertContainsTerms(auditPolicy, [
    '## Audit launch gate',
    'Complete an `Audit launch gate` before every `spawn_agent` call for a blocking audit.',
    '`early-security-checkpoint`',
    'any other named blocking audit',
    'audit_class',
    'required_skill',
    'reasoning_effort',
    'blocking: true | false',
    'allowed_by_policy: true | false',
    'disallowed_reason',
    'missing `model` blocks launch',
    'missing `reasoning_effort` blocks blocking audit launch',
    'weak/mini model class blocks blocking audit launch',
    'model disallowed by repo/operator policy blocks launch',
    'runtime inability to choose `model` or `reasoning_effort` explicitly blocks the step unless the operator explicitly approves degraded mode',
    '`allowed_by_policy: true` is required before `spawn_agent` for blocking audits',
    'if `allowed_by_policy: true`, `disallowed_reason` must be empty',
    'if `allowed_by_policy: false`, spawning is blocked and `disallowed_reason` must state why',
    'weak/mini models cannot produce blocking audit verdicts',
    'invalidated attempts are telemetry/process-miss evidence only',
    'invalidated attempts must not be summarized as PASS/FAIL evidence',
    'helper output cannot satisfy blocking audit requirements',
    '## Review brief template',
    'spec-conformance-reviewer',
    'code-reviewer',
    'security-reviewer',
    '## Early security seam checkpoint',
    'public route exposure or reserved route behavior',
    'auth/admission gate',
    'trusted ingress or internal bypass',
    'secret material, redaction, or export controls',
    'does not replace the final security audit',
    'Out-of-spec stop rule',
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
    '## Required frontmatter',
    'feature_cycle_id',
    'trace_runtime',
    'trace_locator_kind',
    'session_id',
    'process_complete_ts',
    'step_close_ts',
    'review_events',
    'verification_events',
    'backlog_events',
    'operator_interventions',
    'process_miss_events',
    '## Required narrative sections',
    'Event arrays are the primary metric source.',
    'attempts with `invalidated: true` do not count as review evidence',
    'attempts with `allowed_by_policy: false` do not count as review evidence',
    'heavy-runtime misuse as an explicit `process_miss_events[]` entry',
    'Feature Dossier',
    'lifecycle telemetry for one stage closure target',
    'Spec gap decisions',
    'Implementation freedom decisions',
    'Temporary assumptions',
    'Inside `Decisions / reclassifications`, always keep these subheadings:',
    'If a section or subheading has nothing notable, write `none`.',
    '`node scripts/dossier.mjs lifecycle-refresh` may read these stage logs',
  ]);
  assertContainsTerms(lifecycleTelemetry, [
    '## Applies to',
    '`CLI command: lifecycle-refresh`',
    'feature_cycle_id',
    'cycle_id',
    'session_id',
    'trace_runtime',
    'trace_locator_kind',
    '## Core metrics v1',
    '.dossier/metrics/<feature-id>/<feature_cycle_id>.json',
    '.dossier/retro/session-index.jsonl',
    'The shipped helper is:',
    '`node scripts/dossier.mjs lifecycle-refresh --feature-id F-XXXX [--feature-cycle-id fcNN]`',
  ]);
});

void test('active dossier instructions use the unified workflow-stage logging reference', async () => {
  const [
    skill,
    specCompactSteps,
    planSliceSteps,
    implementationSteps,
    loggingPolicy,
    intakeLogging,
    lifecycleTelemetry,
  ] = await Promise.all([
    readFile(SKILL_PATH, 'utf8'),
    readFile(WORKFLOW_STAGE_SPEC_COMPACT_PATH, 'utf8'),
    readFile(WORKFLOW_STAGE_PLAN_SLICE_PATH, 'utf8'),
    readFile(WORKFLOW_STAGE_IMPLEMENTATION_PATH, 'utf8'),
    readFile(WORKFLOW_STAGE_LOGGING_PATH, 'utf8'),
    readFile(FEATURE_INTAKE_LOGGING_PATH, 'utf8'),
    readFile(LIFECYCLE_TELEMETRY_PATH, 'utf8'),
  ]);

  const specCompact = extractSection(skill, '#### Workflow stage: `spec-compact`');
  const planSlice = extractSection(skill, '#### Workflow stage: `plan-slice`');
  const implementation = extractSection(skill, '#### Workflow stage: `implementation`');
  const coreArtifacts = extractSection(skill, '## Core artifacts');

  assertContainsTerms(coreArtifacts, [
    '.dossier/logs/<feature-id>/feature-intake-<cycle-id>.md',
    '.dossier/logs/<feature>/<stage>-<cycle>.md',
    '.dossier/metrics/<feature-id>/<feature_cycle_id>.json',
    '.dossier/retro/session-index.jsonl',
    '.dossier/ops/<session>/<episode>.md',
  ]);
  assertContainsTerms(specCompact, [
    '[Workflow stage logging](references/workflow-stage-logging.md)',
    '[Lifecycle telemetry](references/lifecycle-telemetry.md)',
    'The stage log was opened or updated before the first substantive mutation and stayed current through closure.',
    'The stage log records inputs, decisions/reclassifications, operator/review cycles, process misses, and backlog actualization outcome.',
    'The stage log does not duplicate AC text or dossier truth.',
  ]);
  assertContainsTerms(planSlice, [
    '[Workflow stage logging](references/workflow-stage-logging.md)',
    '[Lifecycle telemetry](references/lifecycle-telemetry.md)',
    'The stage log was opened or updated before the first substantive planning mutation and stayed current through closure.',
    'The stage log records slice boundary decisions, planning assumptions/fallbacks, review cycles, process misses, and backlog actualization outcome.',
    'The stage log does not duplicate slice or task text from the dossier.',
  ]);
  assertContainsTerms(implementation, [
    '[Workflow stage logging](references/workflow-stage-logging.md)',
    '[Lifecycle telemetry](references/lifecycle-telemetry.md)',
    'For multi-step or package-based work, the stage log was opened before the first mutating edit and kept current through close-out.',
  ]);
  assertContainsTerms(specCompactSteps, [
    'Open or update the stage log according to [workflow-stage-logging.md](workflow-stage-logging.md) before the first substantive spec mutation.',
    'Update the stage log with review events, decisions/reclassifications, process misses, and the planned backlog actualization outcome before closure.',
    'Update the stage log with the backlog actualization result and links to applicable verification, review, and step-close artifacts.',
  ]);
  assertContainsTerms(planSliceSteps, [
    'Open or update the stage log according to [workflow-stage-logging.md](workflow-stage-logging.md) before the first substantive planning mutation.',
    'Update the stage log with slice boundary decisions, assumptions/fallbacks, review events, process misses, and the planned backlog actualization outcome before closure.',
    'Update the stage log with the backlog actualization result and links to applicable verification, review, and step-close artifacts.',
  ]);
  assertContainsTerms(loggingPolicy, [
    'A stage log is lifecycle telemetry for one stage closure target.',
    'It does not replace the Feature Dossier.',
    'stage: spec-compact | plan-slice | implementation',
    'feature_cycle_id',
    'trace_runtime',
    'trace_locator_kind',
    '`spec-compact`',
    '`plan-slice`',
    '`implementation`',
    'It does not apply to `CLI command: feature-intake`',
    '[feature-intake-logging.md](feature-intake-logging.md)',
    '[lifecycle-telemetry.md](lifecycle-telemetry.md)',
    'Inside `Decisions / reclassifications`, always keep these subheadings:',
    'If a section or subheading has nothing notable, write `none`.',
    'Event arrays are the primary metric source.',
    'process_miss_events',
    'operator_interventions',
  ]);
  assertContainsTerms(intakeLogging, [
    '.dossier/logs/<feature-id>/feature-intake-<cycle-id>.md',
    'Ordinary intake stays in the intake log only.',
    'keep the intake log as the primary record of the `feature-intake` command flow',
    'feature_cycle_id',
    'YAML frontmatter fenced by `---`',
  ]);
  assertContainsTerms(lifecycleTelemetry, [
    '.dossier/metrics/<feature-id>/<feature_cycle_id>.json',
    '.dossier/retro/session-index.jsonl',
  ]);

  for (const activeText of [
    skill,
    specCompactSteps,
    planSliceSteps,
    implementationSteps,
    loggingPolicy,
    intakeLogging,
  ]) {
    assert.doesNotMatch(activeText, /references\/implementation-logging\.md/u);
  }
});

void test('feature-intake logging stays explicit, command-level, and distinct from stage logging', async () => {
  const [skill, workflow, intakeLogging, lifecycleTelemetry] = await Promise.all([
    readFile(SKILL_PATH, 'utf8'),
    readFile(WORKFLOW_PATH, 'utf8'),
    readFile(FEATURE_INTAKE_LOGGING_PATH, 'utf8'),
    readFile(LIFECYCLE_TELEMETRY_PATH, 'utf8'),
  ]);

  const intake = extractSection(skill, '#### CLI command: `feature-intake`');
  const closure = extractSection(skill, '## Step closure contract');
  const coreArtifacts = extractSection(skill, '## Core artifacts');
  const workflowIntake = extractSection(workflow, '## CLI command: `feature-intake`');

  assertContainsTerms(coreArtifacts, [
    '.dossier/logs/<feature-id>/feature-intake-<cycle-id>.md',
    '.dossier/logs/<feature>/<stage>-<cycle>.md',
  ]);
  assertContainsTerms(intake, [
    '[Feature intake logging](references/feature-intake-logging.md)',
    '[Lifecycle telemetry](references/lifecycle-telemetry.md)',
    'Open `.dossier/logs/<feature-id>/feature-intake-<cycle-id>.md` according to [Feature intake logging](references/feature-intake-logging.md) before creating `docs/features/F-XXXX-<slug>.md`.',
    'If the intake log started late or intake telemetry became stale, record that in `process_miss_events[]` and bring the log current immediately.',
    'Backfill the intake log with truthful close-out fields before claiming command closure.',
    'Refresh lifecycle telemetry with `node scripts/dossier.mjs lifecycle-refresh --feature-id F-XXXX --feature-cycle-id fcNN`',
    'If a normal intake turns into a cross-skill migration, repair, or backlog-recovery episode',
  ]);
  assertContainsTerms(closure, [
    'For `feature-intake`, process telemetry is command-level and lives in the intake log',
    'If the intake log is missing or stale, `process_complete` is not truthful.',
  ]);
  assertContainsTerms(workflowIntake, [
    '[feature-intake-logging.md](feature-intake-logging.md)',
    '[lifecycle-telemetry.md](lifecycle-telemetry.md)',
    'The intake log is always part of truthful command closure',
    'Use the next free `cNN` and keep the filename suffix equal to `cycle_id`',
    'open a companion session-level ops log for the cross-skill boundary',
  ]);
  assertContainsTerms(intakeLogging, [
    '## Closure blocking rule',
    '## Interaction with session-level ops log',
    'one intake log equals one literal intake closure target.',
    '`<feature-id>` must match the dossier feature id `F-XXXX`;',
    '`<cycle-id>` must use the canonical format `cNN`',
    'the filename suffix must match the `cycle_id` value inside the frontmatter exactly;',
    'Every intake log must start with YAML frontmatter fenced by `---`.',
    'feature_cycle_id',
    'command: feature-intake',
    'trace_runtime: codex',
    'trace_locator_kind: session_id',
    'Close-out fields to add before truthful intake completion:',
    '`cycle_id` stays stable while the literal intake closure target is unchanged;',
    'Ordinary intake stays in the intake log only.',
    'Absence of an intake log is no longer the valid low-overhead path.',
    '`feature-intake` is not truthfully complete until all are true:',
    'backlog_actualized: true | false',
    'The intake log should normally use:',
    '`backlog_events[]`',
    '`operator_interventions[]`',
    '`process_miss_events[]`',
  ]);
  assertContainsTerms(lifecycleTelemetry, [
    'The shipped helper is:',
    '`node scripts/dossier.mjs lifecycle-refresh --feature-id F-XXXX [--feature-cycle-id fcNN]`',
  ]);

  assert.ok(
    intake.indexOf(
      'Open `.dossier/logs/<feature-id>/feature-intake-<cycle-id>.md` according to [Feature intake logging](references/feature-intake-logging.md) before creating `docs/features/F-XXXX-<slug>.md`.',
    ) < intake.indexOf('Create `docs/features/F-XXXX-<slug>.md` from the dossier template.'),
    'feature-intake must open telemetry before dossier creation',
  );
});

void test('skill-wide review sections stay distinct from implementation-specific audit policy', async () => {
  const [skill, implementationAuditPolicy] = await Promise.all([
    readFile(SKILL_PATH, 'utf8'),
    readFile(IMPLEMENTATION_AUDIT_POLICY_PATH, 'utf8'),
  ]);

  const independentReview = extractSection(skill, '## Independent review execution model');
  const reviewChecklistRules = extractSection(skill, '## Review checklist design rules');
  const spawnedAgentsOnly = extractSection(implementationAuditPolicy, '## Spawned agents only');

  assertContainsTerms(independentReview, [
    'This section defines the skill-wide independence rule.',
    'For `Workflow stage: implementation`, the audit stack, review brief, and classifier-based re-audit rules live in [Implementation audit policy](references/implementation-audit-policy.md).',
    'Before spawning a required independent review, declare model, reasoning effort, required skill, scope, and allowed-model verdict when the runtime supports those fields.',
    'For implementation blocking audits, use the `Audit launch gate` and record `model`, `reasoning_effort`, and `allowed_by_policy` before spawning.',
    'Unmet model policy blocks the step unless operator explicitly approves degraded review mode.',
    'Degraded review mode remains explicit and cannot be silently treated as normal independent review.',
    'A weak/mini model verdict cannot satisfy a required independent review or any blocking audit requirement.',
    'Treat any weak/mini verdict as invalidated process telemetry, not review evidence.',
    'request it as a standalone line before continuing',
    'Please authorize spawning the required external audit/review agents for this phase.',
    'Launch audit/review agents with `fork_context: false` by default.',
    'State that the reviewer is read-only: no file edits, no `git add`, and no commits.',
    'If a read-only reviewer edits files or changes `HEAD`, invalidate that review',
  ]);
  assertContainsTerms(reviewChecklistRules, [
    'When a stage has a dedicated audit policy, use it instead of inventing a local audit stack.',
    'For `Workflow stage: implementation`, use [Implementation audit policy](references/implementation-audit-policy.md) for audit order, brief shape, and classifier-based re-audit rules.',
  ]);
  assertContainsTerms(spawnedAgentsOnly, [
    'complete the `Audit launch gate` before spawning',
    'request it as a standalone line, then stop and wait',
    'Please authorize spawning the required external audit/review agents for this phase.',
  ]);
  const operationalLaunchGuardrails = extractSection(
    implementationAuditPolicy,
    '## Operational launch guardrails',
  );
  assertContainsTerms(operationalLaunchGuardrails, [
    'launch with `fork_context: false` by default',
    'make the brief read-only',
    'capture the pre-review repo state with `git status --short` and `git rev-parse HEAD`',
    'if a read-only reviewer changed files or `HEAD`, treat the audit as invalid',
    'record `fork_context`, read-only expectation, mutation-check result, and invalidation details',
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
    'classify adversarial semantics before planning',
    'High-risk adversarial semantics were classified as `specified` with required proof fields or explicit `N/A` with rationale',
    'Sequential replay and concurrent replay were separated when concurrency is possible.',
    'Shutdown/startup/order semantics distinguish closed admission from already-started in-flight operation handling when relevant.',
    'Unresolved adversarial cases are blocking `Open question` entries with `needed_by: before_planned`',
  ]);
  assertContainsTerms(planSlice, [
    '[Spec and plan risk patterns](references/spec-and-plan-risk-patterns.md)',
    '[Workflow stage logging](references/workflow-stage-logging.md)',
    '[Detailed stage steps](references/workflow-stage-plan-slice.md)',
    'map each one to a named proof obligation or explicit `N/A rationale` before implementation',
    'Generic verification labels such as `idempotency tests`, `shutdown tests`, or `integration tests` are insufficient unless paired with concrete proof details.',
    'Every high-risk edge case has a named proof obligation or explicit `N/A rationale`.',
    'The implementation adversarial checklist was translated into spec-level semantics or explicit `N/A` entries before implementation.',
  ]);
  assertContainsTerms(specCompactSteps, [
    'make the operator/agent contract explicit',
    'add the relevant safety and boundary semantics',
    'stateful / side-effecting / boundary features',
    'Adversarial semantics',
    '`specified` or explicit `N/A`',
    'participating operation(s)',
    'race window or ordering boundary',
    'durable invariant',
    'externally observable result/error',
    'required proof type',
    'N/A rationale',
    'blocking `Open question` entries with `needed_by: before_planned`',
    'sequential replay distinct from concurrent replay',
    'closed admission distinct from already-started in-flight operation',
    '`normative now`, `implementation freedom`, or `temporary assumption`',
  ]);
  assertContainsTerms(planSliceSteps, [
    'Identify the contract risks that must be killed before close-out.',
    'risk-to-proof mapping',
    'Risk / edge case',
    'Spec source',
    'Required proof',
    'Slice',
    'Verification artifact',
    'N/A rationale',
    'operation pair or participating operation(s)',
    'race window or ordering boundary',
    'expected observable result/error',
    'durable invariant',
    'proof specificity smell pass',
    'idempotency tests',
    'shutdown tests',
    'sequential replay distinct from concurrent replay',
    'closed admission distinct from already-started in-flight operation',
    'Find missing adversarial proof obligations in this spec and slicing plan.',
    'does not replace the risk-to-proof matrix',
    'weak/mini models',
    'Plan drift-guard work',
    'add a real usage audit after the main implementation flow',
    'define `allowed_stop_points` explicitly before implementation starts',
  ]);
  assertContainsTerms(riskHardening, [
    '[spec-and-plan-risk-patterns.md](spec-and-plan-risk-patterns.md)',
    '`spec-compact` needs explicit operator/agent contract or safety semantics',
    '`spec-compact` must classify adversarial semantics',
    '`plan-slice` must map high-risk adversarial semantics into risk-to-proof obligations before implementation',
    '`plan-slice` must explicitly plan contract-risk cleanup, drift-guard work, or a real usage audit',
  ]);
  assertContainsTerms(riskPatterns, [
    'Adversarial proof obligations',
    'side effects, durable state, lifecycle transitions, idempotency, retries, shutdown/startup',
    'sequential replay',
    'concurrent replay',
    'closed admission',
    'already-started in-flight operation',
    'Risk / edge case',
    'Required proof',
    'N/A rationale',
    'proof specificity smell pass',
    '## During `spec-compact`',
    '## During `plan-slice`',
    'Operator/agent contract',
    'Safety and boundary semantics',
    'Adversarial semantics',
    'Unresolved-decision triage',
    'Contract-risk block',
    'Risk-to-proof mapping',
    'Real usage audit',
    'Corrective backlog categories',
  ]);
});

void test('heavy-runtime discipline stays trigger-based, laddered, and narrow in logging', async () => {
  const [
    skill,
    workflow,
    specCompactSteps,
    planSliceSteps,
    implementationSteps,
    loggingPolicy,
    template,
  ] = await Promise.all([
    readFile(SKILL_PATH, 'utf8'),
    readFile(WORKFLOW_PATH, 'utf8'),
    readFile(WORKFLOW_STAGE_SPEC_COMPACT_PATH, 'utf8'),
    readFile(WORKFLOW_STAGE_PLAN_SLICE_PATH, 'utf8'),
    readFile(WORKFLOW_STAGE_IMPLEMENTATION_PATH, 'utf8'),
    readFile(WORKFLOW_STAGE_LOGGING_PATH, 'utf8'),
    readFile(DOSSIER_TEMPLATE_PATH, 'utf8'),
  ]);

  const heavyRuntime = extractSection(skill, '## Heavy-runtime / expensive-runtime discipline');
  const specCompact = extractSection(skill, '#### Workflow stage: `spec-compact`');
  const planSlice = extractSection(skill, '#### Workflow stage: `plan-slice`');
  const implementation = extractSection(skill, '#### Workflow stage: `implementation`');
  const workflowHeavyRuntime = extractSection(workflow, '## Heavy-runtime discipline');

  assertContainsTerms(heavyRuntime, [
    'This branch is trigger-based, not universal-by-default.',
    'expensive model or runtime startup;',
    'large cache or download bootstrap;',
    'warm/cold path divergence that materially changes proof strategy.',
    '`runtime envelope` = a compact runtime-assumption contract',
    '`targeted runtime probe` = the narrowest adequate runtime check',
    '`final smoke gate` = an expensive real-path verification',
    'If the trigger does not fire, ordinary verification guidance remains sufficient.',
    'Repo overlays may tighten this trigger or require stronger proof discipline than the default skill.',
    'CLI may persist structured fields, validate required sections, or compute deterministic fields',
    'CLI does not infer that a feature is heavy-runtime from prose',
    'Retrospective should be able to distinguish legitimate final verification cost from method failure caused by missing runtime envelope or missing verification ladder.',
  ]);
  assertContainsTerms(workflowHeavyRuntime, [
    'Heavy-runtime / expensive-runtime discipline is trigger-based rather than universal.',
    '`spec-compact` owns the compact `runtime envelope`',
    '`plan-slice` owns the cheap-first verification ladder;',
    '`implementation` owns the distinction between `targeted runtime probes` and the `final smoke gate`.',
    'repeated heavy smoke, repeated cold-start reruns, repeated cache-download reruns, or repeated multi-runtime bootstrap loops are a process smell',
    'repo overlays may tighten the trigger or require stronger proof discipline than the default skill floor;',
    'CLI remains mechanical',
  ]);
  assertContainsTerms(specCompact, [
    'If the heavy-runtime trigger fires, record a compact runtime envelope instead of leaving runtime assumptions implicit until implementation.',
    'If the heavy-runtime trigger fired, the dossier records a compact runtime envelope with runtime instance shape, warm/cold assumptions, cache/download policy, timeout budget, retry posture, allowed resource / pressure class, and operator-visible constraints or risks when relevant.',
    'The heavy-runtime runtime envelope stays compact and decision-oriented; it supplements adversarial semantics and failure-mode obligations instead of replacing them.',
  ]);
  assertContainsTerms(planSlice, [
    'If the heavy-runtime trigger fired, the verification plan must be a ladder rather than one broad `smoke` or `runtime test` label.',
    'If the heavy-runtime trigger fired, the verification plan is a cheap-first ladder: lightweight local checks, targeted runtime probes, integration checks when relevant, and a final smoke gate.',
    'If the heavy-runtime trigger fired, broad labels such as `smoke`, `runtime test`, or `end-to-end verification` are not used without adjacent text that says what remains for the final smoke and what gets killed earlier by cheaper probes.',
    'If the expensive smoke path is the only honest observable seam, the plan says so explicitly and explains why cheaper probes would not prove the behavior.',
  ]);
  assertContainsTerms(implementation, [
    'Verification was added alongside code: AC-linked tests plus targeted runtime probes, integration checks, and final smoke/startup/container checks when relevant.',
    'If the heavy-runtime trigger fired, heavy smoke was not used as the default debug loop; repeated expensive reruns had a named proof purpose or an explicit exception.',
    'If the heavy-runtime trigger fired, the runtime envelope and verification ladder actually guided implementation instead of being deferred to close-out notes.',
  ]);
  assertContainsTerms(specCompactSteps, [
    'activate the heavy-runtime branch and add a compact runtime envelope before planning is treated as shaped enough.',
    'expected runtime instance shape;',
    'warm/cold assumptions;',
    'cache/download policy;',
    'timeout budget;',
    'retry budget or retry posture;',
    'allowed resource / pressure class;',
    'does not become a low-level deployment runbook',
    'never replaces adversarial semantics, edge cases, or failure-mode obligations.',
  ]);
  assertContainsTerms(planSliceSteps, [
    'express the verification plan as a ladder rather than one broad verification label.',
    'lightweight local checks;',
    'targeted runtime probes;',
    'integration checks when relevant;',
    'final smoke gate.',
    'Each meaningful runtime hypothesis should map to the cheapest adequate proof',
    'Treat broad labels such as `smoke`, `runtime test`, or `end-to-end verification` as insufficient',
    'If the expensive smoke path is the only honest observable seam, state that explicitly',
  ]);
  assertContainsTerms(implementationSteps, [
    'treat heavy smoke as a final gate or allowed-stop-point / closure-target confirmation, not as the default working loop for ordinary debugging.',
    'localize the hypothesis;',
    'choose the narrowest adequate probe or cheaper verification step;',
    'rerun expensive smoke only when the remaining uncertainty actually lives on that path.',
    'the smoke path is the only honest observable seam;',
    'a repo overlay explicitly requires smoke-first discipline;',
    'the operator explicitly chooses the expensive rerun as a conscious trade-off.',
    'Repeated heavy smoke, cold-start, cache-download, or multi-runtime bootstrap reruns should be treated as a retrospective process smell',
    'Heavy-runtime misuse is itself an implementation-specific process miss.',
  ]);
  assertContainsTerms(loggingPolicy, [
    'whether the heavy-runtime trigger fired and where the runtime envelope lives;',
    'whether a heavy-runtime verification ladder was defined;',
    'whether the only-observable-seam exception was invoked;',
    'heavy-runtime misuse as an explicit `process_miss_events[]` entry when it occurred.',
    'repeated heavy smoke / repeated cold-start / repeated cache-download reruns are a process smell',
  ]);
  assertContainsTerms(template, [
    'When the heavy-runtime trigger fires, record a compact runtime envelope here:',
    'expected runtime instance shape;',
    'warm/cold assumptions;',
    'cache/download policy;',
    'timeout budget;',
    'retry budget or retry posture;',
    'allowed resource / pressure class;',
    'It is not a low-level deployment runbook',
    'When the heavy-runtime trigger fires, express verification as a ladder instead of one broad label:',
    'Broad labels such as `smoke`, `runtime test`, or `end-to-end verification` are insufficient',
    'If the expensive smoke path is the only honest observable seam, state that explicitly',
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
      'Read current backlog truth only through canonical `backlog-engineer` commands.',
      'Utility-owned internal backlog files are not an operator-facing source of truth.',
      'Use `queue -> items --item-keys ...` when full task cards are needed after `queue`.',
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
