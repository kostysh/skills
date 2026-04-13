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
  assert.equal(summary.resolved.discoveryMode, 'explicit_session_file');
  assert.equal(summary.stageLogs.count, 2);
  assert.equal(summary.stageLogs.metrics.reviewRoundsTotal, 3);
  assert.equal(summary.stageLogs.metrics.reviewFindingsTotal, 3);
  assert.equal(summary.stageLogs.metrics.processMissesTotal, 1);
  assert.equal(summary.stageLogs.metrics.backlogActualizedCount, 1);
  assert.equal(summary.stageLogs.metrics.lateLogStartCount, 1);
  assert.equal(summary.session.abortedTurns, 1);
  assert.equal(summary.session.longGaps, 1);
  assert.equal(summary.session.sessionId, '019d7490-46d0-7811-b43f-056bb617a7ab');
  assert.equal(summary.scope.project_root, fixturePath('artifacts'));
  assert.deepEqual(summary.scope.mentioned_backlog_items, ['CF-0016']);
  assert.deepEqual(summary.scope.mentioned_features, ['F-0016']);
  assert.equal(
    summary.scope.touched_paths.some((entry) => entry.endsWith('docs/features/F-0016-retro.md')),
    true,
  );
  assert.equal(
    summary.scope.candidate_review_artifacts.some((entry) =>
      entry.endsWith('.dossier/reviews/F-0016-review.md'),
    ),
    true,
  );
  assert.equal(
    summary.scope.candidate_verification_artifacts.some((entry) =>
      entry.endsWith('.dossier/verification/F-0016-verification.md'),
    ),
    true,
  );
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
  assert.equal(summary.resolved.discoveryMode, 'missing');
  assert.equal(summary.session.eventCount, 0);
  assert.equal(summary.session.sampleEventTypes.length, 0);
  assert.equal(summary.dataQuality.logsPresent, true);
  assert.equal(summary.candidateIncidents.length > 0, true);
  assert.equal(summary.scope.scope_confidence, 'low');
});

void test('buildScanSummary records ambiguity when one trace references multiple features', () => {
  const summary = buildScanSummary({
    session: fixturePath('sessions', 'multi-feature-session.jsonl'),
    logsDir: fixturePath('logs'),
    artifactsDir: fixturePath('artifacts'),
    skillsDir: fixturePath('skills'),
  });

  assert.deepEqual(summary.scope.mentioned_backlog_items, ['CF-0016', 'CF-0020']);
  assert.deepEqual(summary.scope.mentioned_features, ['F-0016', 'F-0020']);
  assert.equal(summary.scope.scope_confidence, 'medium');
  assert.equal(
    summary.scope.scope_ambiguities.some((entry) => entry.includes('Multiple feature ids')),
    true,
  );
});

void test('buildScanSummary downgrades data quality when logs are missing', () => {
  const summary = buildScanSummary({
    session: fixturePath('sessions', 'phase-session.jsonl'),
    artifactsDir: fixturePath('artifacts'),
    skillsDir: fixturePath('skills'),
  });

  assert.equal(summary.dataQuality.sessionPresent, true);
  assert.equal(summary.dataQuality.logsPresent, false);
  assert.equal(summary.stageLogs.count, 0);
  assert.equal(summary.scope.mentioned_features.includes('F-0016'), true);
});
