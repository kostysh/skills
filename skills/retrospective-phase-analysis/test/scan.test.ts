import assert from 'node:assert/strict';
import { chmod, cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { buildScanSummary } from '../src/core/build-scan-summary.ts';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(TEST_DIR, 'fixtures');

function fixturePath(...segments: string[]): string {
  return path.join(FIXTURES_DIR, ...segments);
}

void test('buildScanSummary keeps stage-log scope empty when the trace does not mention any changed log', () => {
  const summary = buildScanSummary({
    session: fixturePath('sessions', 'phase-session.jsonl'),
    logsDir: fixturePath('logs'),
    artifactsDir: fixturePath('artifacts'),
    skillsDir: fixturePath('skills'),
  });

  assert.equal(summary.dataQuality.sessionPresent, true);
  assert.equal(summary.dataQuality.logsPresent, true);
  assert.equal(summary.stageLogs.count, 0);
  assert.equal(summary.stageLogs.metrics.reviewRoundsTotal, 0);
  assert.equal(summary.stageLogs.metrics.reviewFindingsTotal, 0);
  assert.equal(summary.stageLogs.metrics.processMissesTotal, 0);
  assert.equal(summary.stageLogs.metrics.backlogActualizedCount, 0);
  assert.equal(summary.stageLogs.metrics.lateLogStartCount, 0);
  assert.equal(summary.session.abortedTurns, 1);
  assert.equal(summary.session.longGaps, 1);
  assert.equal(summary.session.sessionId, '019d7490-46d0-7811-b43f-056bb617a7ab');
  assert.equal(summary.scope.project_root, fixturePath('artifacts'));
  assert.deepEqual(summary.scope.mentioned_backlog_items, ['CF-0016']);
  assert.deepEqual(summary.scope.mentioned_features, ['F-0016']);
  assert.deepEqual(summary.scope.candidate_stage_logs, []);
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
  assert.equal(summary.candidateIncidents.length, 1);
  assert.equal(
    summary.scope.scope_ambiguities.some((entry) =>
      entry.includes('did not confirm any stage-log path'),
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
  assert.equal(summary.stageLogs.count, 0);
  assert.equal(summary.candidateIncidents.length, 0);
  assert.equal(summary.scope.scope_confidence, 'low');
});

void test('buildScanSummary scopes stage logs to the log paths explicitly mentioned in the trace', () => {
  const summary = buildScanSummary({
    session: fixturePath('sessions', 'phase-session-with-log-link.jsonl'),
    logsDir: fixturePath('artifacts', '.dossier', 'logs'),
    artifactsDir: fixturePath('artifacts'),
    skillsDir: fixturePath('skills'),
  });

  assert.equal(summary.stageLogs.count, 1);
  assert.equal(summary.stageLogs.files[0]?.filePath.endsWith('implementation.md'), true);
  assert.deepEqual(summary.scope.candidate_stage_logs, [
    fixturePath('artifacts', '.dossier', 'logs', 'implementation.md'),
  ]);
  assert.equal(summary.stageLogs.metrics.reviewRoundsTotal, 2);
  assert.equal(summary.stageLogs.metrics.reviewFindingsTotal, 3);
  assert.equal(summary.stageLogs.metrics.processMissesTotal, 1);
  assert.equal(summary.stageLogs.metrics.backlogActualizedCount, 0);
  assert.equal(summary.stageLogs.metrics.lateLogStartCount, 1);
  assert.equal(
    summary.candidateIncidents.some((incident) =>
      incident.title.includes('Backlog actualization deferred'),
    ),
    true,
  );
});

void test('buildScanSummary only parses trace-confirmed stage logs instead of reading the whole logs directory', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const projectRoot = path.join(tempDir, 'project');
  const logsDir = path.join(projectRoot, '.dossier', 'logs');
  const sessionPath = path.join(tempDir, 'session.jsonl');
  const strayLogPath = path.join(logsDir, 'stray.md');

  try {
    await mkdir(path.dirname(logsDir), { recursive: true });
    await cp(fixturePath('artifacts', '.dossier', 'logs'), logsDir, { recursive: true });
    await writeFile(
      strayLogPath,
      [
        '```yaml',
        'stage: implementation',
        'skill: retrospective-phase-analysis',
        '```',
        '',
        '# Stray log',
      ].join('\n'),
      'utf8',
    );
    await chmod(strayLogPath, 0o000);

    await writeFile(
      sessionPath,
      [
        JSON.stringify({
          timestamp: '2026-04-10T09:59:00Z',
          type: 'session_meta',
          payload: { id: '019d7490-46d0-7811-b43f-056bb617a7ad', cwd: projectRoot },
        }),
        JSON.stringify({
          timestamp: '2026-04-10T10:05:00Z',
          type: 'tool_call',
          tool: 'functions.apply_patch',
          patch: '*** Begin Patch\n*** Update File: .dossier/logs/implementation.md\n*** End Patch',
        }),
        JSON.stringify({
          time: '2026-04-10T10:06:00Z',
          kind: 'tool_result',
          recipient: 'functions.apply_patch',
          status: 'ok',
        }),
      ].join('\n'),
      'utf8',
    );

    const summary = buildScanSummary({
      session: sessionPath,
      artifactsDir: projectRoot,
      skillsDir: fixturePath('skills'),
    });

    assert.deepEqual(summary.scope.candidate_stage_logs, [
      path.join(projectRoot, '.dossier', 'logs', 'implementation.md'),
    ]);
    assert.equal(summary.stageLogs.count, 1);
    assert.equal(summary.stageLogs.files[0]?.filePath.endsWith('implementation.md'), true);
  } finally {
    await chmod(strayLogPath, 0o644).catch(() => {});
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('buildScanSummary keeps the durable output root tied to the current working directory instead of explicit artifacts-dir', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const projectRoot = path.join(tempDir, 'project');
  const evidenceRoot = path.join(tempDir, 'evidence-root');
  const logsDir = path.join(projectRoot, '.dossier', 'logs');
  const sessionPath = path.join(tempDir, 'session.jsonl');

  try {
    await mkdir(path.dirname(logsDir), { recursive: true });
    await cp(fixturePath('artifacts', '.dossier', 'logs'), logsDir, { recursive: true });
    await mkdir(evidenceRoot, { recursive: true });
    await writeFile(
      sessionPath,
      [
        JSON.stringify({
          timestamp: '2026-04-10T09:59:00Z',
          type: 'session_meta',
          payload: { id: '019d7490-46d0-7811-b43f-056bb617a7b4', cwd: projectRoot },
        }),
        JSON.stringify({
          timestamp: '2026-04-10T10:05:00Z',
          type: 'tool_call',
          tool: 'functions.apply_patch',
          patch: '*** Begin Patch\n*** Update File: .dossier/logs/implementation.md\n*** End Patch',
        }),
      ].join('\n'),
      'utf8',
    );

    const summary = buildScanSummary({
      session: sessionPath,
      logsDir,
      artifactsDir: evidenceRoot,
      skillsDir: fixturePath('skills'),
    });

    assert.equal(summary.recommendedOutput.mode, 'fallback-default');
    assert.equal(summary.recommendedOutput.root, path.resolve('out', 'retro'));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('buildScanSummary does not scope stage logs from read-only or prose-only mentions', () => {
  const summary = buildScanSummary({
    session: fixturePath('sessions', 'phase-session-with-log-read-only.jsonl'),
    logsDir: fixturePath('artifacts', '.dossier', 'logs'),
    artifactsDir: fixturePath('artifacts'),
    skillsDir: fixturePath('skills'),
  });

  assert.deepEqual(summary.scope.candidate_stage_logs, []);
  assert.equal(summary.stageLogs.count, 0);
  assert.equal(
    summary.scope.scope_ambiguities.some((entry) =>
      entry.includes('did not confirm any stage-log path'),
    ),
    true,
  );
});

void test('buildScanSummary does not scope stage logs when a shell write targets another file', () => {
  const summary = buildScanSummary({
    session: fixturePath('sessions', 'phase-session-with-other-write.jsonl'),
    logsDir: fixturePath('artifacts', '.dossier', 'logs'),
    artifactsDir: fixturePath('artifacts'),
    skillsDir: fixturePath('skills'),
  });

  assert.deepEqual(summary.scope.candidate_stage_logs, []);
  assert.equal(summary.stageLogs.count, 0);
});

void test('buildScanSummary does not scope stage logs when apply_patch targets another file', () => {
  const summary = buildScanSummary({
    session: fixturePath('sessions', 'phase-session-with-other-apply-patch.jsonl'),
    logsDir: fixturePath('artifacts', '.dossier', 'logs'),
    artifactsDir: fixturePath('artifacts'),
    skillsDir: fixturePath('skills'),
  });

  assert.deepEqual(summary.scope.candidate_stage_logs, []);
  assert.equal(summary.stageLogs.count, 0);
});

void test('buildScanSummary does not scope stage logs when apply_patch body mentions a stage log but targets another file', () => {
  const summary = buildScanSummary({
    session: fixturePath('sessions', 'phase-session-with-apply-patch-body-mention.jsonl'),
    logsDir: fixturePath('artifacts', '.dossier', 'logs'),
    artifactsDir: fixturePath('artifacts'),
    skillsDir: fixturePath('skills'),
  });

  assert.deepEqual(summary.scope.candidate_stage_logs, []);
  assert.equal(summary.stageLogs.count, 0);
});

void test('buildScanSummary does not scope stage logs when the stage log is only a shell source operand', () => {
  const summary = buildScanSummary({
    session: fixturePath('sessions', 'phase-session-with-stage-log-source-write.jsonl'),
    logsDir: fixturePath('artifacts', '.dossier', 'logs'),
    artifactsDir: fixturePath('artifacts'),
    skillsDir: fixturePath('skills'),
  });

  assert.deepEqual(summary.scope.candidate_stage_logs, []);
  assert.equal(summary.stageLogs.count, 0);
});

void test('buildScanSummary does not scope stage logs when the write attempt fails', () => {
  const summary = buildScanSummary({
    session: fixturePath('sessions', 'phase-session-with-log-write-error.jsonl'),
    logsDir: fixturePath('artifacts', '.dossier', 'logs'),
    artifactsDir: fixturePath('artifacts'),
    skillsDir: fixturePath('skills'),
  });

  assert.deepEqual(summary.scope.candidate_stage_logs, []);
  assert.equal(summary.stageLogs.count, 0);
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
    skillsDir: fixturePath('skills'),
  });

  assert.equal(summary.dataQuality.sessionPresent, true);
  assert.equal(summary.dataQuality.logsPresent, false);
  assert.equal(summary.stageLogs.count, 0);
  assert.equal(summary.scope.mentioned_features.includes('F-0016'), true);
});
