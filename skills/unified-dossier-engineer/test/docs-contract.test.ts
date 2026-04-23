import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = path.resolve(TEST_DIR, '..');

const SKILL_PATH = path.join(SKILL_DIR, 'SKILL.md');
const SKILL_YAML_PATH = path.join(SKILL_DIR, 'skill.yaml');
const PACKAGE_JSON_PATH = path.join(SKILL_DIR, 'package.json');
const STATUS_SCOPE_PATH = path.join(SKILL_DIR, 'references', 'status-and-scope.md');
const AUDIT_POLICY_PATH = path.join(SKILL_DIR, 'references', 'audit-policy.md');
const RUNTIME_BOUNDARY_PATH = path.join(SKILL_DIR, 'references', 'runtime-and-command-boundary.md');
const DELIVERY_WORKFLOW_PATH = path.join(SKILL_DIR, 'references', 'delivery-workflow-layer.md');
const TELEMETRY_CLOSURE_PATH = path.join(SKILL_DIR, 'references', 'telemetry-and-closure.md');
const STAGE_CONTROL_PATH = path.join(SKILL_DIR, 'references', 'commandized-stage-control.md');
const UTILITY_SPEC_PATH = path.join(SKILL_DIR, 'docs', 'utility-spec.ru.md');
const UNIFIED_ARCHITECTURE_PATH = path.join(SKILL_DIR, 'references', 'unified-architecture.md');
const UNIFIED_ARTIFACT_TOPOLOGY_PATH = path.join(
  SKILL_DIR,
  'references',
  'unified-artifact-topology.md',
);
const BACKLOG_TRUTH_LAYER_PATH = path.join(SKILL_DIR, 'references', 'backlog-truth-layer.md');
const SOURCE_REVIEW_CONTRACT_PATH = path.join(SKILL_DIR, 'references', 'source-review-contract.md');

const ACTIVE_REFERENCE_PATHS = [
  STATUS_SCOPE_PATH,
  UNIFIED_ARCHITECTURE_PATH,
  UNIFIED_ARTIFACT_TOPOLOGY_PATH,
  BACKLOG_TRUTH_LAYER_PATH,
  SOURCE_REVIEW_CONTRACT_PATH,
  DELIVERY_WORKFLOW_PATH,
  AUDIT_POLICY_PATH,
  TELEMETRY_CLOSURE_PATH,
  STAGE_CONTROL_PATH,
  RUNTIME_BOUNDARY_PATH,
] as const;

function assertContainsTerms(text: string, terms: readonly string[]): void {
  for (const term of terms) {
    assert.match(text, new RegExp(term.replaceAll(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
  }
}

function assertNotContainsTerms(text: string, terms: readonly string[]): void {
  for (const term of terms) {
    assert.doesNotMatch(text, new RegExp(term.replaceAll(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
  }
}

function assertContainsInOrder(text: string, fragments: readonly string[]): void {
  let cursor = 0;
  for (const fragment of fragments) {
    const index = text.indexOf(fragment, cursor);
    assert.notEqual(index, -1, `Expected ordered fragment not found: ${fragment}`);
    cursor = index + fragment.length;
  }
}

void test('generated skill exposes only the canonical runtime surface', async () => {
  const skill = await readFile(SKILL_PATH, 'utf8');
  const frontmatter = skill.slice(0, skill.indexOf('\n---', 4));

  assertContainsTerms(frontmatter, [
    'Canonical runtime shipped',
    'Only the canonical `.dossier` +',
    '`docs/ssot` layout',
    'the `dossier-engineer` launcher are part of this skill.',
  ]);
  assertContainsTerms(skill, [
    '### CLI command: `feature-intake`',
    '### CLI command: `spec-compact`',
    '### CLI command: `change-proposal`',
    '### CLI command: `ack-source-review`',
  ]);
  assertNotContainsTerms(skill, [
    '### CLI command: `marker-audit`',
    '### CLI command: `migrate-split-artifacts`',
    '### CLI command: `rollout-readiness`',
    'split-skill retirement',
    'merged skill',
    'merged runtime',
    'unified runtime',
    'split `backlog-engineer`',
    'split `dossier-engineer`',
    'Final checks',
    'source-bundle-governance',
    'skill-source-compiler',
    'generated instruction surface',
    'generated `SKILL.md`',
    'source bundle',
    'generated skill bundle',
    'maintainer-facing utility specification',
  ]);
});

void test('active references enforce the no-legacy contract', async () => {
  const [statusScope, runtimeBoundary, ...otherActiveRefs] = await Promise.all([
    readFile(STATUS_SCOPE_PATH, 'utf8'),
    readFile(RUNTIME_BOUNDARY_PATH, 'utf8'),
    ...ACTIVE_REFERENCE_PATHS.filter(
      (referencePath) =>
        referencePath !== STATUS_SCOPE_PATH && referencePath !== RUNTIME_BOUNDARY_PATH,
    ).map((referencePath) => readFile(referencePath, 'utf8')),
  ]);
  const activeReferenceCorpus = [statusScope, runtimeBoundary, ...otherActiveRefs].join('\n\n');

  assertContainsTerms(statusScope, [
    'only the canonical `.dossier` + `docs/ssot` layout is supported',
    'only the `dossier-engineer` launcher is shipped',
  ]);
  assertContainsTerms(runtimeBoundary, [
    'The runtime exposes exactly one public utility contract:',
    'dossier-engineer <command> [options]',
  ]);
  assertNotContainsTerms(runtimeBoundary, [
    'migrate-split-artifacts',
    'rollout-readiness',
    'src/compat/',
    'src/migration/',
    'merged runtime',
    'unified runtime',
    'split roots',
    'split launchers',
  ]);
  assertNotContainsTerms(activeReferenceCorpus, [
    'merged skill',
    'merged runtime',
    'merged architecture',
    'merged target',
    'merged workflow',
    'first-wave merged commands',
    'merged wrappers',
    'merged artifact model',
    'merged telemetry commands',
    'split `backlog-engineer`',
    'split `dossier-engineer`',
    'source bundle',
    'generated skill bundle',
    'maintainer-facing utility specification',
  ]);
});

void test('source bundle and package manifest expose only the canonical launcher and references', async () => {
  const [skillYaml, packageJson] = await Promise.all([
    readFile(SKILL_YAML_PATH, 'utf8'),
    readFile(PACKAGE_JSON_PATH, 'utf8'),
  ]);

  assertContainsTerms(skillYaml, [
    'scripts/dossier-engineer.mjs',
    'Canonical runtime shipped',
    'references/audit-policy.md',
  ]);
  assertNotContainsTerms(skillYaml, [
    'references/migration-and-rollout.md',
    'references/source-bundle-governance.md',
    'scripts/dossier.mjs',
    'scripts/backlog-engineer.mjs',
    'legacy-dossier',
    'command-marker-audit',
    'command-migrate-split-artifacts',
    'command-rollout-readiness',
    'merged skill',
    'merged runtime',
    'unified runtime',
    'split `backlog-engineer`',
    'split `dossier-engineer`',
    'policy-active-surface',
    'gotcha-root-size',
    'finalChecks:',
  ]);
  assertContainsTerms(packageJson, ['"dossier-engineer": "scripts/dossier-engineer.mjs"']);
  assertNotContainsTerms(packageJson, ['"dossier":', '"backlog-engineer":']);
});

void test('active audit policy is canonical, stage-wide, and helper-safe', async () => {
  const [
    skill,
    auditPolicy,
    deliveryWorkflow,
    runtimeBoundary,
    telemetryClosure,
    stageControl,
    utilitySpec,
  ] = await Promise.all([
    readFile(SKILL_PATH, 'utf8'),
    readFile(AUDIT_POLICY_PATH, 'utf8'),
    readFile(DELIVERY_WORKFLOW_PATH, 'utf8'),
    readFile(RUNTIME_BOUNDARY_PATH, 'utf8'),
    readFile(TELEMETRY_CLOSURE_PATH, 'utf8'),
    readFile(STAGE_CONTROL_PATH, 'utf8'),
    readFile(UTILITY_SPEC_PATH, 'utf8'),
  ]);

  assertContainsTerms(skill, [
    'Every mutating dossier stage requires external review before truthful closure.',
    'without forked/full-history authoring context',
    '`fork_context: false`',
    'discard it and rerun it correctly',
    '`review-artifact` records one already obtained audit result for one audit class.',
    '`dossier-step-close` validates the policy-required audit bundle before truthful closure.',
    'do not prove reviewer launch-mode independence',
  ]);
  assertContainsTerms(auditPolicy, [
    'feature-intake',
    'spec-compact',
    'plan-slice',
    'implementation',
    'change-proposal',
    'spec-conformance-reviewer',
    'code-reviewer',
    'security-reviewer',
    'self-review never satisfies a required audit',
    'review-artifact` persists one already obtained audit result for one audit class',
    '`dossier-step-close` must block truthful closure',
    'missing, stale, invalidated, or not external',
    'helper-managed implementation stage state',
    'reviewer thread provenance from the current runtime when available',
    'process-trust policy',
    "must not inherit the authoring agent's full working context or full conversation history",
    '`fork_context: false`',
    'reviewer delegation with forked context or full-history inheritance does not satisfy external independent audit requirements',
    'invalidate that audit and rerun it with a valid external execution mode',
    'must not claim to prove launch-mode independence beyond the observable provenance',
    'backlog support files like `.dossier/backlog/.gitignore` or `.dossier/backlog/AGENTS.md` do not invalidate audits by themselves',
    'Canonical backlog truth artifacts under `.dossier/backlog/` such as `state.json`, `sources.json`, `applied.json`, `source-review/*`, `packets/*`, and `patches/*` remain material',
  ]);
  assertContainsInOrder(auditPolicy, [
    '1. `spec-conformance-reviewer`',
    '2. `code-reviewer`',
    '3. `security-reviewer`',
  ]);
  assertContainsTerms(deliveryWorkflow, [
    'Every mutating dossier stage requires external review before truthful closure',
    'self-review is not a valid substitute',
    'forked context or full-history inheritance is not a valid substitute',
    'invalid review launch method is discovered',
    'cannot be accepted as a quiet PASS',
    'code-bearing scope also requires `code-reviewer` and `security-reviewer`',
    'helper-managed stage state',
  ]);
  assertContainsTerms(runtimeBoundary, [
    '`review-artifact` persists one already obtained audit result for one audit class',
    '`dossier-step-close` validates the policy-required audit bundle',
    'helper-managed stage state under `.dossier/stages/*`',
    'must not claim to prove launch-mode facts such as `fork_context`, full-history inheritance, prompt mutability, or model tier',
  ]);
  assertContainsTerms(telemetryClosure, [
    'helper-managed stage state under `.dossier/stages/*`',
    'observable workflow evidence',
    'must not be presented as proof of launch-mode independence',
    'whether recorded review evidence is limited to observable provenance rather than proof of reviewer launch-mode independence',
    'required_audit_classes',
    'executed_audit_classes',
    'required_external_review_pending',
    'implementation_review_scope',
    'required_security_review',
  ]);
  assertContainsTerms(utilitySpec, [
    'Every mutating dossier stage must truthfully close only after the audit bundle required by active audit policy is satisfied',
    'Implementation review scope remains explicit mechanical input',
    'helper-managed implementation stage state',
    'reviewer thread provenance stamped by the current runtime when available',
    'process-trust contract',
    'no forked/full-history inheritance',
    'Reviewer delegation with forked context or full-history inheritance does not satisfy `external independent audit`',
    'must not claim automatic proof of launch-mode independence beyond the recorded provenance signals available to the runtime',
    'required audit bundle is `spec-conformance-reviewer`, `code-reviewer`, `security-reviewer`',
    'support files like `.dossier/backlog/.gitignore` or `.dossier/backlog/AGENTS.md` do not invalidate audits by themselves',
    'Canonical backlog truth artifacts under `.dossier/backlog/` such as `state.json`, `sources.json`, `applied.json`, `source-review/*`, `packets/*`, and `patches/*` remain material freshness invalidators',
  ]);
  assertContainsTerms(stageControl, [
    'non-forked/no-full-history external review',
    'does not prove the reviewer launch mode',
    'helper-owned close-out must enforce the required external audit bundle defined in [Audit policy](audit-policy.md).',
  ]);
});

void test('active log contract keeps operator-facing narrative minimum aligned across refs and utility spec', async () => {
  const [telemetryClosure, stageControl, utilitySpec] = await Promise.all([
    readFile(TELEMETRY_CLOSURE_PATH, 'utf8'),
    readFile(STAGE_CONTROL_PATH, 'utf8'),
    readFile(UTILITY_SPEC_PATH, 'utf8'),
  ]);

  assertContainsTerms(telemetryClosure, [
    'operator-facing evidence for process-improvement decisions',
    'frontmatter plus a mechanical transition list is not sufficient for a non-trivial stage',
    'Spec gap decisions',
    'Implementation freedom decisions',
    'Temporary assumptions',
    'helper-owned closure updates must preserve authored narrative sections',
  ]);
  assertContainsTerms(stageControl, [
    'required section scaffold must stay present',
    'stage-controller reruns and helper-owned closure updates must preserve authored narrative sections',
    'helper-owned closure writes must not erase authored narrative sections from the stage log',
  ]);
  assertContainsTerms(utilitySpec, [
    'stage-log bootstrap/update must materialize and preserve the canonical narrative scaffold required by the active log contract',
    'helper-owned closure writes preserve authored narrative sections without translation or normalization while updating helper-owned closure fields',
  ]);
});

void test('active log contract preserves operator-language narrative without runtime translation promises', async () => {
  const [telemetryClosure, stageControl, runtimeBoundary, utilitySpec] = await Promise.all([
    readFile(TELEMETRY_CLOSURE_PATH, 'utf8'),
    readFile(STAGE_CONTROL_PATH, 'utf8'),
    readFile(RUNTIME_BOUNDARY_PATH, 'utf8'),
    readFile(UTILITY_SPEC_PATH, 'utf8'),
  ]);

  assertContainsTerms(telemetryClosure, [
    'operator language',
    'Agent-authored narrative content in dossier logs follows the operator language by default.',
    'explicit operator language preference',
    'multilingual or ambiguous sessions',
    'current operator request',
    'Generated scaffold headings',
    'Machine-readable fields stay schema-shaped and are not localized.',
    'Commands, paths, identifiers, JSON keys',
    'YAML frontmatter keys',
    'tool names, skill names, and direct quotes',
    'Historical logs are not rewritten only for language normalization.',
  ]);
  assertContainsTerms(stageControl, [
    'mechanical scaffold generation does not determine the language of authored narrative',
    'without translation or normalization',
  ]);
  assertContainsTerms(runtimeBoundary, [
    'do not imply runtime support for automatic operator-language detection, translation, or localization',
  ]);
  assertContainsTerms(utilitySpec, [
    'generated scaffold headings may remain stable labels',
    'authored narrative body is agent-owned and follows the active operator-language policy',
    'helper-owned updates preserve authored content without translation or normalization',
    'no automatic language detection or translation is part of the shipped runtime',
  ]);
});

void test('plan-slice contract preserves goal-oriented implementation handoff without runtime semantic automation', async () => {
  const [deliveryWorkflow, stageControl, telemetryClosure, runtimeBoundary, utilitySpec] =
    await Promise.all([
      readFile(DELIVERY_WORKFLOW_PATH, 'utf8'),
      readFile(STAGE_CONTROL_PATH, 'utf8'),
      readFile(TELEMETRY_CLOSURE_PATH, 'utf8'),
      readFile(RUNTIME_BOUNDARY_PATH, 'utf8'),
      readFile(UTILITY_SPEC_PATH, 'utf8'),
    ]);

  assertContainsTerms(deliveryWorkflow, [
    'explicit execution target',
    'concrete outcome the implementation agent must reach',
    'completion recognition',
    'acceptance criteria, Definition of Done, or verification obligations',
    'explicit non-goals or boundaries',
    'If a future implementation agent would need to rediscover the goal',
    'the stage must remain open or blocked',
  ]);
  assertContainsTerms(stageControl, [
    'the plan has an explicit execution target, completion recognition, and implementation boundaries',
    'The stage controller does not author or validate that semantic content.',
    'do not treat a mechanical `ready_for_close` transition as a substitute for agent-owned `plan-slice` execution-target clarity',
  ]);
  assertContainsTerms(telemetryClosure, [
    'target clarification, goal reclassification, or ambiguity resolution',
    'If the implementation objective remains ambiguous',
  ]);
  assertContainsTerms(runtimeBoundary, [
    'do not imply that stage-controller commands author or validate semantic `plan-slice` execution-target content',
  ]);
  assertContainsTerms(utilitySpec, [
    'stage-controller commands do not author or validate semantic `plan-slice` content',
    'explicit execution target, completion recognition, and implementation boundaries',
    'no command may treat a mechanical `plan-slice --ready-for-close` transition as automatic proof',
  ]);
});
