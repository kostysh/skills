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
const RUNTIME_BOUNDARY_PATH = path.join(SKILL_DIR, 'references', 'runtime-and-command-boundary.md');
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
