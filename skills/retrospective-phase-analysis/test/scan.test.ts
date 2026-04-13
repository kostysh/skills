import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { buildScanSummary } from '../src/core/build-scan-summary.ts';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(TEST_DIR, 'fixtures');

function fixturePath(...segments: string[]): string {
  return path.join(FIXTURES_DIR, ...segments);
}

void test('buildScanSummary captures incidents, metrics, and skill catalog entries', () => {
  const summary = buildScanSummary({
    session: fixturePath('sessions', 'phase-session.jsonl'),
    logsDir: fixturePath('logs'),
    artifactsDir: fixturePath('artifacts'),
    skillsDir: fixturePath('skills'),
  });

  assert.equal(summary.dataQuality.sessionPresent, true);
  assert.equal(summary.dataQuality.logsPresent, true);
  assert.equal(summary.stageLogs.count, 2);
  assert.equal(summary.stageLogs.metrics.reviewRoundsTotal, 3);
  assert.equal(summary.stageLogs.metrics.reviewFindingsTotal, 3);
  assert.equal(summary.stageLogs.metrics.processMissesTotal, 1);
  assert.equal(summary.stageLogs.metrics.backlogActualizedCount, 1);
  assert.equal(summary.stageLogs.metrics.lateLogStartCount, 1);
  assert.equal(summary.session.abortedTurns, 1);
  assert.equal(summary.session.longGaps, 1);
  assert.equal(summary.session.tools['functions.exec_command'], 2);
  assert.equal(
    summary.skills.some((skill) => skill.name === 'dossier-engineer'),
    true,
  );
  assert.equal(
    summary.candidateIncidents.some((incident) =>
      incident.title.includes('Backlog actualization deferred'),
    ),
    true,
  );
});

void test('buildScanSummary downgrades data quality when the session trace is missing', () => {
  const summary = buildScanSummary({
    logsDir: fixturePath('logs'),
    artifactsDir: fixturePath('artifacts'),
    skillsDir: fixturePath('skills'),
  });

  assert.equal(summary.dataQuality.sessionPresent, false);
  assert.equal(summary.session.eventCount, 0);
  assert.equal(summary.session.sampleEventTypes.length, 0);
  assert.equal(summary.dataQuality.logsPresent, true);
  assert.equal(summary.candidateIncidents.length > 0, true);
});
