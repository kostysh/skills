import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { buildCommandHelpOutput, buildGlobalHelpOutput } from '../src/cli/command-registry.ts';
import { REPORT_COMMAND } from '../src/commands/report.ts';
import { buildScanSummary } from '../src/core/build-scan-summary.ts';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(TEST_DIR, 'fixtures');
const CONTRACTS_DIR = path.join(FIXTURES_DIR, 'contracts');

function fixturePath(...segments: string[]): string {
  return path.join(FIXTURES_DIR, ...segments);
}

async function readContract(name: string): Promise<string> {
  return readFile(path.join(CONTRACTS_DIR, name), 'utf8');
}

function normalizeScanSummary(summary: unknown): unknown {
  return JSON.parse(
    JSON.stringify(summary)
      .replaceAll(FIXTURES_DIR, '/abs/fixtures')
      .replaceAll(process.cwd(), '/abs/cwd')
      .replace(/"generatedAt":"[^"]+"/u, '"generatedAt":"<generated>"'),
  ) as unknown;
}

void test('help output snapshots stay stable for the public CLI surface', async () => {
  const globalHelp = buildGlobalHelpOutput('0.1.0');
  const reportHelp = buildCommandHelpOutput(REPORT_COMMAND);

  assert.equal(globalHelp, await readContract('help-output-golden.txt'));
  assert.equal(reportHelp, await readContract('report-help-golden.txt'));
});

void test('scan summary snapshot stays stable for the maintainer fixture contract', async () => {
  const summary = buildScanSummary({
    session: fixturePath('sessions', 'phase-session.jsonl'),
    logsDir: fixturePath('logs'),
    artifactsDir: fixturePath('artifacts'),
    skillsDir: fixturePath('skills'),
  });

  const normalized = normalizeScanSummary(summary);
  const expected = JSON.parse(await readContract('scan-summary-golden.json')) as unknown;

  assert.deepEqual(normalized, expected);
});
