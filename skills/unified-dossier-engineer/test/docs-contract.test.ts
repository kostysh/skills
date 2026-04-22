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

void test('generated skill exposes only the canonical unified runtime surface', async () => {
  const skill = await readFile(SKILL_PATH, 'utf8');
  const frontmatter = skill.slice(0, skill.indexOf('\n---', 4));

  assertContainsTerms(frontmatter, [
    'Canonical merged runtime shipped',
    'No split-model migration or compatibility surface',
    'is part of this skill.',
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
  ]);
});

void test('active references enforce the no-legacy contract', async () => {
  const [statusScope, runtimeBoundary] = await Promise.all([
    readFile(STATUS_SCOPE_PATH, 'utf8'),
    readFile(RUNTIME_BOUNDARY_PATH, 'utf8'),
  ]);

  assertContainsTerms(statusScope, [
    'only the canonical unified layout is supported',
    'no split-model migration tooling, rollout-readiness checks, or compatibility launchers are shipped',
  ]);
  assertContainsTerms(runtimeBoundary, [
    'The merged runtime exposes exactly one public utility contract:',
    'dossier-engineer <command> [options]',
  ]);
  assertNotContainsTerms(runtimeBoundary, [
    'migrate-split-artifacts',
    'rollout-readiness',
    'src/compat/',
    'src/migration/',
  ]);
});

void test('source bundle and package manifest expose only the canonical launcher and references', async () => {
  const [skillYaml, packageJson] = await Promise.all([
    readFile(SKILL_YAML_PATH, 'utf8'),
    readFile(PACKAGE_JSON_PATH, 'utf8'),
  ]);

  assertContainsTerms(skillYaml, [
    'scripts/dossier-engineer.mjs',
    'Canonical merged runtime shipped',
    'references/audit-policy.md',
  ]);
  assertNotContainsTerms(skillYaml, [
    'references/migration-and-rollout.md',
    'scripts/dossier.mjs',
    'scripts/backlog-engineer.mjs',
    'legacy-dossier',
    'command-marker-audit',
    'command-migrate-split-artifacts',
    'command-rollout-readiness',
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
    '`review-artifact` records one already obtained audit result for one audit class.',
    '`dossier-step-close` validates the policy-required audit bundle before truthful closure.',
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
    'code-bearing scope also requires `code-reviewer` and `security-reviewer`',
    'helper-managed stage state',
  ]);
  assertContainsTerms(runtimeBoundary, [
    '`review-artifact` persists one already obtained audit result for one audit class',
    '`dossier-step-close` validates the policy-required audit bundle',
    'helper-managed stage state under `.dossier/stages/*`',
  ]);
  assertContainsTerms(telemetryClosure, [
    'helper-managed stage state under `.dossier/stages/*`',
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
    'required audit bundle is `spec-conformance-reviewer`, `code-reviewer`, `security-reviewer`',
    'support files like `.dossier/backlog/.gitignore` or `.dossier/backlog/AGENTS.md` do not invalidate audits by themselves',
    'Canonical backlog truth artifacts under `.dossier/backlog/` such as `state.json`, `sources.json`, `applied.json`, `source-review/*`, `packets/*`, and `patches/*` remain material freshness invalidators',
  ]);
  assertContainsTerms(stageControl, [
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
    'helper-owned closure writes preserve authored narrative sections while updating helper-owned closure fields',
  ]);
});
