import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = path.resolve(TEST_DIR, '..');

function filePath(...segments: string[]): string {
  return path.join(SKILL_DIR, ...segments);
}

function escapeForRegex(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function assertContainsTerms(text: string, terms: readonly string[]): void {
  for (const term of terms) {
    assert.match(text, new RegExp(escapeForRegex(term), 'u'));
  }
}

void test('SKILL.md keeps explicit selection, interop, and runtime-reference sections', async () => {
  const skill = await readFile(filePath('SKILL.md'), 'utf8');

  assertContainsTerms(skill, [
    '## When to use',
    '## When NOT to use',
    '## Interop priority',
    '## Session id resolution order',
    '## Quick start from session id only',
    'trace-driven scoping',
    'current runtime session id',
    'The agent owns `session_id` resolution and canonical trace lookup.',
    'references/PROJECT-ADAPTATION.md',
    'references/CLI.md',
    'references/REPORT-TEMPLATE.md',
    'references/SKILL-AUDIT-TEMPLATE.md',
    'references/LOGGING-IMPROVEMENTS-TEMPLATE.md',
    '.dossier/retro/',
    'out/retro/',
    '<scope-slug>/<run-slug>/',
    'default `<scope-slug>` is `session-<short-session-id>`',
    'The first `scan` that writes a bundle establishes the canonical run directory.',
    'pass `--language <language>` to the first `scan`',
    'follow-up commands with `--run-dir` inherit the report language from `scan-summary.json`',
    'Use `--until-line <n>` or `--until-ts <iso>`',
    'artifact-derived close/completion timestamps',
    'fail closed',
    'Every manual override requires `--artifact-evidence <text>`',
    'Structured metrics come first',
    'Generated Markdown is a scaffold, not the final retrospective.',
  ]);
});

void test('CLI reference documents global help, version, and the four command surfaces', async () => {
  const reference = await readFile(filePath('references', 'CLI.md'), 'utf8');

  assertContainsTerms(reference, [
    'node scripts/retro-cli.mjs --help',
    'node scripts/retro-cli.mjs help report',
    'node scripts/retro-cli.mjs --version',
    '--session <file>',
    '--out-root <dir>',
    '--run-dir <dir>',
    '--language <language>',
    'run_dir',
    'operator_language',
    'report_language',
    'phase_boundary',
    'stage_log_candidates',
    'step_artifact_candidates',
    'artifact_identity',
    'next_action',
    'metric `sources`',
    'reportStatus',
    'Excluded stage-log candidates',
    'mandatory bundle checkpoints',
    '--until-ts <iso>',
    '--artifact-evidence <text>',
    'stage_artifact_link',
    'Unvalidated prose fallback',
    'Structured `review_events`',
    'The first `scan` that writes a bundle establishes the canonical run directory.',
    'scan',
    'report',
    'skill-audit',
    'logging-review',
  ]);
});

void test('evaluation contract keeps maintainer intent explicit alongside executable fixtures', async () => {
  const note = await readFile(filePath('test', 'evaluation-contract.md'), 'utf8');

  assertContainsTerms(note, [
    'minimal quality scenarios',
    'future regression fixtures',
    'session trace is missing',
    'stage log omits review artifacts',
  ]);
});
