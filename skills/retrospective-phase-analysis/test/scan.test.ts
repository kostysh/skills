import assert from 'node:assert/strict';
import { chmod, cp, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { buildScanSummary } from '../src/core/build-scan-summary.ts';
import { redactScanSummaryForPublicArtifact } from '../src/core/shared.ts';
import { buildProblemMatrixMarkdown } from '../src/render/problem-matrix-markdown.ts';
import { buildReportMarkdown } from '../src/render/report-markdown.ts';

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
  assert.deepEqual(summary.scope.candidate_review_artifacts, []);
  assert.deepEqual(summary.scope.candidate_verification_artifacts, []);
  assert.equal(
    summary.scope.review_artifact_candidates.some(
      (entry) =>
        entry.path.endsWith('.dossier/reviews/F-0016-review.md') &&
        entry.evidence_kind === 'referenced_only' &&
        entry.included === false,
    ),
    true,
  );
  assert.equal(
    summary.scope.verification_artifact_candidates.some(
      (entry) =>
        entry.path.endsWith('.dossier/verification/F-0016-verification.md') &&
        entry.evidence_kind === 'referenced_only' &&
        entry.included === false,
    ),
    true,
  );
  assert.equal(summary.session.tools['functions.exec_command'], 2);
  assert.equal(
    summary.skills.referenced.some((skill) => skill.name === 'unified-dossier-engineer'),
    false,
  );
  assert.equal(summary.candidateIncidents.length, 1);
  assert.equal(
    summary.scope.scope_ambiguities.some((entry) =>
      entry.includes('did not confirm any stage-log path'),
    ),
    true,
  );
});

void test('buildScanSummary derives skill audit scope from Available skills and operational trace', () => {
  const summary = buildScanSummary({
    session: fixturePath('contracts', 'session-skills-trace.jsonl'),
    skillsDir: fixturePath('skills'),
  });

  assert.deepEqual(
    summary.skills.available.map((skill) => skill.name),
    [
      'git-engineer',
      'hono-engineer',
      'retrospective-phase-analysis',
      'typescript-engineer',
      'unified-dossier-engineer',
    ],
  );
  assert.deepEqual(
    summary.skills.referenced.map((skill) => skill.name),
    ['hono-engineer', 'retrospective-phase-analysis'],
  );
  assert.equal(summary.skills.unreferenced_count, 3);
  assert.equal(summary.dataQuality.skillCatalogPresent, true);

  const hono = summary.skills.referenced.find((skill) => skill.name === 'hono-engineer');
  assert.ok(hono);
  assert.deepEqual(hono.aliases, ['HONO engineer', 'hono-engineer']);
  assert.equal(
    hono.evidence.some(
      (entry) =>
        entry.matched_alias === 'HONO engineer' && entry.field === 'event_msg.payload.message',
    ),
    true,
  );
  assert.equal(
    hono.evidence.some(
      (entry) =>
        entry.matched_alias === 'hono-engineer' &&
        entry.field === 'event_msg.payload.parsed_cmd[0].path',
    ),
    true,
  );

  assert.equal(
    summary.skills.referenced.some((skill) => skill.name === 'git-engineer'),
    false,
  );
  assert.equal(
    summary.skills.referenced.some((skill) => skill.name === 'typescript-engineer'),
    false,
  );

  const publicSummary = redactScanSummaryForPublicArtifact(summary);
  const serialized = JSON.stringify(publicSummary.skills);
  assert.doesNotMatch(serialized, /\/synthetic-runtime\//u);
  assert.match(serialized, /<skills-root>\/hono-engineer\/SKILL\.md/u);
});

void test('buildScanSummary enriches only referenced skills from skills-dir', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const skillsDir = path.join(tempDir, 'skills');
  const sessionPath = path.join(tempDir, 'session.jsonl');

  try {
    await mkdir(path.join(skillsDir, 'hono-engineer'), { recursive: true });
    await mkdir(path.join(skillsDir, 'unused-skill', 'SKILL.md'), { recursive: true });
    await writeFile(
      path.join(skillsDir, 'hono-engineer', 'SKILL.md'),
      [
        '---',
        'name: hono-engineer',
        'description: Local Hono guidance.',
        '---',
        '',
        '# Hono Engineer',
      ].join('\n'),
      'utf8',
    );
    await writeFile(
      sessionPath,
      [
        JSON.stringify({
          timestamp: '2026-04-15T10:00:00Z',
          type: 'response_item',
          payload: {
            type: 'message',
            role: 'developer',
            content: [
              {
                type: 'input_text',
                text: [
                  '### Available skills',
                  '- HONO engineer: Build and maintain Hono services. (file: /synthetic-runtime/codex/skills/custom/skills/hono-engineer/SKILL.md)',
                  '- unused-skill: Deliberately unreadable local skill. (file: /synthetic-runtime/codex/skills/custom/skills/unused-skill/SKILL.md)',
                ].join('\n'),
              },
            ],
          },
        }),
        JSON.stringify({
          timestamp: '2026-04-15T10:01:00Z',
          type: 'event_msg',
          payload: {
            type: 'user_message',
            message: 'Please inspect HONO engineer guidance for this phase.',
          },
        }),
      ].join('\n'),
      'utf8',
    );

    const summary = buildScanSummary({ session: sessionPath, skillsDir });
    assert.equal(summary.skills.referenced.length, 1);
    assert.equal(
      summary.skills.referenced[0]?.skillFile,
      path.join(skillsDir, 'hono-engineer', 'SKILL.md'),
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('buildScanSummary does not fan out through skills-dir when Available skills catalog is missing', () => {
  const summary = buildScanSummary({
    session: fixturePath('sessions', 'phase-session.jsonl'),
    logsDir: fixturePath('logs'),
    artifactsDir: fixturePath('artifacts'),
    skillsDir: fixturePath('skills'),
  });

  assert.equal(summary.dataQuality.skillCatalogPresent, false);
  assert.deepEqual(summary.skills.available, []);
  assert.deepEqual(summary.skills.referenced, []);
  assert.equal(summary.skills.unreferenced_count, 0);
});

void test('buildScanSummary ignores Available skills blocks in operational messages', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const sessionPath = path.join(tempDir, 'session.jsonl');

  try {
    await writeFile(
      sessionPath,
      [
        JSON.stringify({
          timestamp: '2026-04-15T10:00:00Z',
          type: 'session_meta',
          payload: { id: '019d9000-0000-7000-8000-000000000002', cwd: tempDir },
        }),
        JSON.stringify({
          timestamp: '2026-04-15T10:01:00Z',
          type: 'event_msg',
          payload: {
            type: 'user_message',
            message: [
              'Here is copied context, not injected runtime policy:',
              '### Available skills',
              '- git-engineer: Enforce Conventional Commits. (file: /synthetic-runtime/codex/skills/custom/skills/git-engineer/SKILL.md)',
              'Please inspect git-engineer.',
            ].join('\n'),
          },
        }),
      ].join('\n'),
      'utf8',
    );

    const summary = buildScanSummary({ session: sessionPath });
    assert.equal(summary.dataQuality.skillCatalogPresent, false);
    assert.deepEqual(summary.skills.available, []);
    assert.deepEqual(summary.skills.referenced, []);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
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

void test('buildScanSummary treats compacted events as agent context when raw trace is available', () => {
  const projectRoot = fixturePath('rpa-06', 'project');
  const summary = buildScanSummary({
    session: fixturePath('rpa-06', 'session-compacted-with-raw-trace.jsonl'),
    logsDir: path.join(projectRoot, '.dossier', 'logs'),
    artifactsDir: projectRoot,
    skillsDir: fixturePath('skills'),
  });

  assert.equal(summary.dataQuality.sessionPresent, true);
  assert.equal(summary.dataQuality.sessionParseErrors, 0);
  assert.equal(summary.dataQuality.logsPresent, true);
  assert.equal(summary.stageLogs.count, 1);
  assert.equal(summary.session.compactedEvents, 1);
  assert.equal(summary.session.sampleEventTypes.includes('compacted'), true);
  assert.equal(
    summary.reportStatus.reasons.some((reason) => /compacted|compaction/iu.test(reason)),
    false,
  );
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
  assert.equal(summary.scope.stage_log_candidates[0]?.evidence_kind, 'trace_patch_target');
  assert.equal(summary.scope.stage_log_candidates[0]?.inclusion_source, 'auto_included');
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
          timestamp: '2026-04-10T09:58:00Z',
          type: 'response_item',
          payload: {
            type: 'message',
            role: 'developer',
            content: [
              {
                type: 'input_text',
                text: [
                  '### Available skills',
                  '- retrospective-phase-analysis: Perform retrospective analysis. (file: /synthetic-runtime/codex/skills/custom/skills/retrospective-phase-analysis/SKILL.md)',
                ].join('\n'),
              },
            ],
          },
        }),
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
          timestamp: '2026-04-10T09:58:00Z',
          type: 'response_item',
          payload: {
            type: 'message',
            role: 'developer',
            content: [
              {
                type: 'input_text',
                text: [
                  '### Available skills',
                  '- retrospective-phase-analysis: Perform retrospective analysis. (file: /synthetic-runtime/codex/skills/custom/skills/retrospective-phase-analysis/SKILL.md)',
                ].join('\n'),
              },
            ],
          },
        }),
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

void test('buildScanSummary keeps read-only successful tool output paths out of analyzed stage logs', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const projectRoot = path.join(tempDir, 'project');
  const logsDir = path.join(projectRoot, '.dossier', 'logs');
  const sessionPath = path.join(tempDir, 'session.jsonl');

  try {
    await mkdir(path.dirname(logsDir), { recursive: true });
    await cp(fixturePath('artifacts', '.dossier', 'logs'), logsDir, { recursive: true });

    await writeFile(
      sessionPath,
      [
        JSON.stringify({
          timestamp: '2026-04-10T09:58:00Z',
          type: 'response_item',
          payload: {
            type: 'message',
            role: 'developer',
            content: [
              {
                type: 'input_text',
                text: [
                  '### Available skills',
                  '- retrospective-phase-analysis: Perform retrospective analysis. (file: /synthetic-runtime/codex/skills/custom/skills/retrospective-phase-analysis/SKILL.md)',
                ].join('\n'),
              },
            ],
          },
        }),
        JSON.stringify({
          timestamp: '2026-04-10T09:59:00Z',
          type: 'session_meta',
          payload: { id: '019d7490-46d0-7811-b43f-056bb617a7b8', cwd: projectRoot },
        }),
        JSON.stringify({
          timestamp: '2026-04-10T10:05:00Z',
          type: 'tool_call',
          tool: 'functions.exec_command',
          command: "sed -n '1,200p' .dossier/logs/implementation.md",
        }),
        JSON.stringify({
          time: '2026-04-10T10:06:00Z',
          kind: 'tool_result',
          recipient: 'functions.exec_command',
          status: 'ok',
          notes: 'Read .dossier/logs/implementation.md for context.',
        }),
      ].join('\n'),
      'utf8',
    );

    const summary = buildScanSummary({
      session: sessionPath,
      artifactsDir: projectRoot,
    });

    assert.deepEqual(summary.scope.candidate_stage_logs, []);
    assert.equal(summary.stageLogs.count, 0);
    assert.equal(summary.scope.stage_log_candidates[0]?.evidence_kind, 'tool_output_path');
    assert.equal(summary.scope.stage_log_candidates[0]?.included, false);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('buildScanSummary blocks finalization when same-session stage-log candidates are referenced only', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const projectRoot = path.join(tempDir, 'project');
  const logsDir = path.join(projectRoot, '.dossier', 'logs');
  const stageLogPath = path.join(logsDir, 'implementation.md');

  try {
    await mkdir(logsDir, { recursive: true });
    await cp(fixturePath('rpa-05', 'stage-log-referenced-only.md'), stageLogPath);
    await cp(fixturePath('rpa-05', 'project', 'docs'), path.join(projectRoot, 'docs'), {
      recursive: true,
    });

    const summary = buildScanSummary({
      session: fixturePath('rpa-05', 'session-referenced-only-stage-log.jsonl'),
      logsDir,
      artifactsDir: projectRoot,
      untilTs: '2026-04-24T09:03:00Z',
    });

    assert.equal(summary.stageLogs.count, 0);
    assert.deepEqual(summary.scope.candidate_stage_logs, []);
    assert.equal(summary.scope.stage_log_candidates.length, 1);
    assert.equal(summary.scope.stage_log_candidates[0]?.path, stageLogPath);
    assert.equal(summary.scope.stage_log_candidates[0]?.evidence_kind, 'referenced_only');
    assert.equal(summary.scope.stage_log_candidates[0]?.included, false);
    assert.match(summary.scope.stage_log_candidates[0]?.reason ?? '', /event:3/u);
    assert.match(
      summary.scope.stage_log_candidates[0]?.next_action ?? '',
      /Validate same-session/u,
    );
    assert.equal(summary.reportStatus.status, 'draft_requires_agent_validation');
    assert.equal(
      summary.reportStatus.reasons.some(
        (reason) =>
          reason.includes('Excluded stage-log candidate(s) require validation') &&
          reason.includes('implementation.md'),
      ),
      true,
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('buildScanSummary discovers stage logs through bounded stage state log_path', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const projectRoot = path.join(tempDir, 'project');
  const logsDir = path.join(projectRoot, '.dossier', 'logs');
  const stateDir = path.join(projectRoot, '.dossier', 'stages', 'F-0070');
  const sessionPath = path.join(tempDir, 'session.jsonl');

  try {
    await mkdir(logsDir, { recursive: true });
    await mkdir(stateDir, { recursive: true });
    await writeFile(
      path.join(logsDir, 'implementation.md'),
      ['---', 'stage: implementation', 'primary_feature_id: F-0070', '---', '# Log'].join('\n'),
      'utf8',
    );
    await writeFile(
      path.join(stateDir, 'implementation.json'),
      JSON.stringify({
        stage: 'implementation',
        primary_feature_id: 'F-0070',
        log_path: '.dossier/logs/implementation.md',
      }),
      'utf8',
    );
    await writeFile(
      sessionPath,
      [
        JSON.stringify({
          timestamp: '2026-04-26T09:00:00Z',
          type: 'session_meta',
          payload: { id: '019d9000-0000-7000-8000-000000000070', cwd: projectRoot },
        }),
        JSON.stringify({
          timestamp: '2026-04-26T09:01:00Z',
          type: 'tool_call',
          tool: 'functions.apply_patch',
          patch:
            '*** Begin Patch\n*** Update File: .dossier/stages/F-0070/implementation.json\n*** End Patch',
        }),
        JSON.stringify({
          timestamp: '2026-04-26T09:02:00Z',
          type: 'tool_result',
          recipient: 'functions.apply_patch',
          status: 'ok',
        }),
      ].join('\n'),
      'utf8',
    );

    const summary = buildScanSummary({ session: sessionPath, artifactsDir: projectRoot });
    assert.equal(summary.stageLogs.count, 1);
    assert.equal(summary.scope.stage_log_candidates[0]?.evidence_kind, 'stage_state_log_path');
    assert.equal(summary.discovery.provenance[0]?.evidence_kind, 'stage_state_log_path');
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('buildScanSummary includes producer-output log_path while keeping read-only prose excluded', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const projectRoot = path.join(tempDir, 'project');
  const logsDir = path.join(projectRoot, '.dossier', 'logs');
  const sessionPath = path.join(tempDir, 'session.jsonl');

  try {
    await mkdir(logsDir, { recursive: true });
    await writeFile(
      path.join(logsDir, 'implementation.md'),
      ['---', 'stage: implementation', 'primary_feature_id: F-0071', '---', '# Log'].join('\n'),
      'utf8',
    );
    await writeFile(
      sessionPath,
      [
        JSON.stringify({
          timestamp: '2026-04-26T09:00:00Z',
          type: 'session_meta',
          payload: { id: '019d9000-0000-7000-8000-000000000071', cwd: projectRoot },
        }),
        JSON.stringify({
          timestamp: '2026-04-26T09:01:00Z',
          type: 'tool_result',
          recipient: 'dossier-engineer',
          status: 'ok',
          payload: { log_path: '.dossier/logs/implementation.md' },
        }),
      ].join('\n'),
      'utf8',
    );

    const summary = buildScanSummary({ session: sessionPath, artifactsDir: projectRoot });
    assert.equal(summary.stageLogs.count, 1);
    assert.equal(summary.scope.stage_log_candidates[0]?.evidence_kind, 'producer_output_path');
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('buildScanSummary ignores copied skill catalogs while keeping active skill-use evidence', () => {
  const summary = buildScanSummary({
    session: fixturePath('rpa-05', 'session-skill-catalog-noise.jsonl'),
  });

  assert.deepEqual(
    summary.skills.available.map((skill) => skill.name),
    ['git-engineer', 'hono-engineer', 'retrospective-phase-analysis', 'typescript-engineer'],
  );
  assert.deepEqual(
    summary.skills.referenced.map((skill) => skill.name),
    ['hono-engineer', 'retrospective-phase-analysis'],
  );
  assert.equal(
    summary.skills.referenced.some((skill) => skill.name === 'git-engineer'),
    false,
  );
  assert.equal(
    summary.skills.referenced.some((skill) => skill.name === 'typescript-engineer'),
    false,
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

void test('buildScanSummary preserves direct review artifact linkage from large apply_patch payloads', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const projectRoot = path.join(tempDir, 'project');
  const sessionPath = path.join(tempDir, 'session.jsonl');
  const reviewPath = path.join(projectRoot, '.dossier', 'reviews', 'F-0016-review.md');
  const patchBody = [
    `*** Update File: ${reviewPath}`,
    '@@',
    ...Array.from({ length: 60 }, (_, index) => `+line ${index + 1}`),
  ].join('\n');

  try {
    await writeFile(
      sessionPath,
      [
        JSON.stringify({
          timestamp: '2026-04-10T09:59:00Z',
          type: 'session_meta',
          payload: { id: '019d7490-46d0-7811-b43f-056bb617a7b0', cwd: projectRoot },
        }),
        JSON.stringify({
          timestamp: '2026-04-10T10:05:00Z',
          type: 'tool_call',
          tool: 'functions.apply_patch',
          patch: patchBody,
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

    assert.deepEqual(summary.scope.referenced_artifacts, [reviewPath]);
    assert.deepEqual(summary.scope.candidate_review_artifacts, [reviewPath]);
    assert.deepEqual(summary.scope.mentioned_features, ['F-0016']);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('buildScanSummary does not treat git add of a stage log as direct change evidence', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const projectRoot = path.join(tempDir, 'project');
  const logsDir = path.join(projectRoot, '.dossier', 'logs');
  const sessionPath = path.join(tempDir, 'session.jsonl');

  try {
    await mkdir(path.dirname(logsDir), { recursive: true });
    await cp(fixturePath('artifacts', '.dossier', 'logs'), logsDir, { recursive: true });

    await writeFile(
      sessionPath,
      [
        JSON.stringify({
          timestamp: '2026-04-10T09:59:00Z',
          type: 'session_meta',
          payload: { id: '019d7490-46d0-7811-b43f-056bb617a7b1', cwd: projectRoot },
        }),
        JSON.stringify({
          timestamp: '2026-04-10T10:05:00Z',
          type: 'tool_call',
          tool: 'functions.exec_command',
          command:
            'git add .dossier/logs/implementation.md docs/features/F-0016-retro.md && git diff --cached --name-only',
        }),
        JSON.stringify({
          time: '2026-04-10T10:06:00Z',
          kind: 'tool_result',
          recipient: 'functions.exec_command',
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

    assert.deepEqual(summary.scope.candidate_stage_logs, []);
    assert.equal(summary.stageLogs.count, 0);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('buildScanSummary reads command-bearing exec_command_end payloads as direct stage-log change evidence when the command writes the log', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const projectRoot = path.join(tempDir, 'project');
  const logsDir = path.join(projectRoot, '.dossier', 'logs');
  const sessionPath = path.join(tempDir, 'session.jsonl');

  try {
    await mkdir(path.dirname(logsDir), { recursive: true });
    await cp(fixturePath('artifacts', '.dossier', 'logs'), logsDir, { recursive: true });

    await writeFile(
      sessionPath,
      [
        JSON.stringify({
          timestamp: '2026-04-10T09:59:00Z',
          type: 'session_meta',
          payload: { id: '019d7490-46d0-7811-b43f-056bb617a7b1', cwd: projectRoot },
        }),
        JSON.stringify({
          timestamp: '2026-04-10T10:05:00Z',
          type: 'event_msg',
          payload: {
            type: 'exec_command_end',
            command: [
              '/bin/bash',
              '-lc',
              "printf 'entry\\n' >> .dossier/logs/implementation.md && git add .dossier/logs/implementation.md",
            ],
            exit_code: 0,
            status: 'completed',
          },
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
    assert.equal(summary.scope.stage_log_candidates[0]?.evidence_kind, 'trace_shell_write');
    assert.equal(summary.stageLogs.count, 1);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
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

void test('buildScanSummary keeps canonical backlog and feature ids strict when the trace contains malformed tokens and noisy listings', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const projectRoot = path.join(tempDir, 'project');
  const logsDir = path.join(projectRoot, '.dossier', 'logs');
  const sessionPath = path.join(tempDir, 'session.jsonl');

  try {
    await mkdir(path.dirname(logsDir), { recursive: true });
    await cp(fixturePath('artifacts', '.dossier', 'logs'), logsDir, { recursive: true });

    await writeFile(
      sessionPath,
      [
        JSON.stringify({
          timestamp: '2026-04-10T09:59:00Z',
          type: 'session_meta',
          payload: { id: '019d7490-46d0-7811-b43f-056bb617a7ae', cwd: projectRoot },
        }),
        JSON.stringify({
          ts: '2026-04-10T10:00:00Z',
          type: 'assistant',
          content:
            'Investigate CF-0016 and F-0016, but ignore CF-012.delivery_state, CF-018-backed, CF-XXX, CF-0, F-1, and F-0017-backed.',
        }),
        JSON.stringify({
          timestamp: '2026-04-10T10:05:00Z',
          type: 'tool_call',
          tool: 'functions.exec_command',
          command:
            "sed -n '1,200p' docs/features/F-0016-retro.md && sed -n '1,200p' src/retro/collector.ts",
        }),
        JSON.stringify({
          time: '2026-04-10T10:06:00Z',
          kind: 'tool_result',
          recipient: 'functions.exec_command',
          status: 'ok',
          stdout:
            'docs/features/F-0001-alpha.md\\ndocs/features/F-0002-beta.md\\ndocs/features/F-0017-gamma.md',
        }),
      ].join('\n'),
      'utf8',
    );

    const summary = buildScanSummary({
      session: sessionPath,
      artifactsDir: projectRoot,
      skillsDir: fixturePath('skills'),
    });

    assert.deepEqual(summary.scope.mentioned_backlog_items, ['CF-0016']);
    assert.deepEqual(summary.scope.mentioned_features, ['F-0016']);
    assert.equal(
      summary.scope.touched_paths.some((entry) => entry.endsWith('docs/features/F-0016-retro.md')),
      true,
    );
    assert.equal(
      summary.scope.mentioned_features.some((entry) => entry === 'F-0001' || entry === 'F-0017'),
      false,
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
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

void test('buildScanSummary does not auto-link review or verification artifacts from feature ids alone', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const projectRoot = path.join(tempDir, 'project');
  const logsDir = path.join(projectRoot, '.dossier', 'logs');
  const reviewsDir = path.join(projectRoot, '.dossier', 'reviews');
  const verificationDir = path.join(projectRoot, '.dossier', 'verification');
  const sessionPath = path.join(tempDir, 'session.jsonl');

  try {
    await mkdir(path.dirname(logsDir), { recursive: true });
    await cp(fixturePath('artifacts', '.dossier', 'logs'), logsDir, { recursive: true });
    await mkdir(reviewsDir, { recursive: true });
    await mkdir(verificationDir, { recursive: true });
    await writeFile(path.join(reviewsDir, 'F-0016-review.md'), '# review\n', 'utf8');
    await writeFile(
      path.join(verificationDir, 'F-0016-verification.md'),
      '# verification\n',
      'utf8',
    );

    await writeFile(
      sessionPath,
      [
        JSON.stringify({
          timestamp: '2026-04-10T09:59:00Z',
          type: 'session_meta',
          payload: { id: '019d7490-46d0-7811-b43f-056bb617a7af', cwd: projectRoot },
        }),
        JSON.stringify({
          ts: '2026-04-10T10:00:00Z',
          type: 'assistant',
          content: 'Investigate CF-0016 and F-0016 via docs/features/F-0016-retro.md.',
        }),
        JSON.stringify({
          timestamp: '2026-04-10T10:05:00Z',
          type: 'tool_call',
          tool: 'functions.exec_command',
          command: "sed -n '1,200p' docs/features/F-0016-retro.md",
        }),
      ].join('\n'),
      'utf8',
    );

    const summary = buildScanSummary({
      session: sessionPath,
      artifactsDir: projectRoot,
      skillsDir: fixturePath('skills'),
    });

    assert.deepEqual(summary.scope.candidate_review_artifacts, []);
    assert.deepEqual(summary.scope.candidate_verification_artifacts, []);
    assert.equal(
      summary.scope.scope_ambiguities.some((entry) =>
        entry.includes('did not directly confirm any review artifacts'),
      ),
      true,
    );
    assert.equal(
      summary.scope.scope_ambiguities.some((entry) =>
        entry.includes('did not directly confirm any verification artifacts'),
      ),
      true,
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('buildScanSummary auto-includes review and verification artifacts from stage artifact links', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const projectRoot = path.join(tempDir, 'project');
  const sessionPath = path.join(tempDir, 'session.jsonl');
  const reviewPath = path.join(projectRoot, '.dossier', 'reviews', 'F-0016-review.md');
  const verificationPath = path.join(
    projectRoot,
    '.dossier',
    'verification',
    'F-0016-verification.md',
  );

  try {
    await cp(fixturePath('artifacts'), projectRoot, { recursive: true });
    await writeFile(
      sessionPath,
      [
        JSON.stringify({
          timestamp: '2026-04-10T09:59:00Z',
          type: 'session_meta',
          payload: { id: '019d7490-46d0-7811-b43f-056bb617a7bc', cwd: projectRoot },
        }),
        JSON.stringify({
          ts: '2026-04-10T10:00:00Z',
          type: 'assistant',
          content: 'Implementation phase for CF-0016 and F-0016.',
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

    assert.deepEqual(summary.scope.candidate_review_artifacts, [reviewPath]);
    assert.deepEqual(summary.scope.candidate_verification_artifacts, [verificationPath]);
    assert.equal(summary.scope.review_artifact_candidates[0]?.evidence_kind, 'stage_artifact_link');
    assert.equal(
      summary.scope.verification_artifact_candidates[0]?.evidence_kind,
      'stage_artifact_link',
    );
    assert.equal(summary.scope.artifact_identity.primary_feature_id, 'F-0016');
    assert.equal(
      summary.scope.scope_ambiguities.some((entry) =>
        entry.includes('did not directly confirm any review artifacts'),
      ),
      false,
    );
    assert.equal(
      summary.scope.scope_ambiguities.some((entry) =>
        entry.includes('did not directly confirm any verification artifacts'),
      ),
      false,
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('buildScanSummary rejects mismatched bounded stage state before artifact-link enrichment', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const projectRoot = path.join(tempDir, 'project');
  const logsDir = path.join(projectRoot, '.dossier', 'logs');
  const stateDir = path.join(projectRoot, '.dossier', 'stages', 'F-0016');
  const reviewsDir = path.join(projectRoot, '.dossier', 'reviews');
  const sessionPath = path.join(tempDir, 'session.jsonl');
  const wrongReviewPath = path.join(reviewsDir, 'F-0099-review.md');

  try {
    await mkdir(logsDir, { recursive: true });
    await mkdir(stateDir, { recursive: true });
    await mkdir(reviewsDir, { recursive: true });
    await writeFile(
      path.join(logsDir, 'implementation.md'),
      [
        '```yaml',
        'stage: implementation',
        'feature_id: F-0016',
        'process_misses_total: 0',
        '```',
        '',
        '# Implementation log',
      ].join('\n'),
      'utf8',
    );
    await writeFile(
      path.join(stateDir, 'implementation.json'),
      JSON.stringify({
        stage: 'implementation',
        primary_feature_id: 'F-0099',
        review_artifacts: ['.dossier/reviews/F-0099-review.md'],
      }),
      'utf8',
    );
    await writeFile(wrongReviewPath, '# Review for F-0099\n', 'utf8');
    await writeFile(
      sessionPath,
      [
        JSON.stringify({
          timestamp: '2026-04-10T09:59:00Z',
          type: 'session_meta',
          payload: { id: '019d7490-46d0-7811-b43f-056bb617a7c2', cwd: projectRoot },
        }),
        JSON.stringify({
          ts: '2026-04-10T10:00:00Z',
          type: 'assistant',
          content: 'Implementation phase for CF-0016 and F-0016.',
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

    const summary = buildScanSummary({ session: sessionPath, artifactsDir: projectRoot });

    assert.equal(summary.scope.artifact_identity.primary_feature_id, 'F-0016');
    assert.deepEqual(summary.scope.candidate_review_artifacts, []);
    assert.equal(
      summary.scope.scope_ambiguities.some((entry) =>
        entry.includes('Rejected mismatched stage state artifact'),
      ),
      true,
    );
    assert.equal(JSON.stringify(summary).includes('F-0099-review.md'), false);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('buildScanSummary rejects symlinked stage state instead of merging external JSON', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const projectRoot = path.join(tempDir, 'project');
  const logsDir = path.join(projectRoot, '.dossier', 'logs');
  const stateDir = path.join(projectRoot, '.dossier', 'stages', 'F-0016');
  const sessionPath = path.join(tempDir, 'session.jsonl');
  const externalJsonPath = path.join(tempDir, 'external-secret.json');

  try {
    await mkdir(logsDir, { recursive: true });
    await mkdir(stateDir, { recursive: true });
    await writeFile(
      path.join(logsDir, 'implementation.md'),
      [
        '```yaml',
        'stage: implementation',
        'feature_id: F-0016',
        'process_misses_total: 0',
        '```',
        '',
        '# Implementation log',
      ].join('\n'),
      'utf8',
    );
    await writeFile(
      externalJsonPath,
      JSON.stringify({
        primary_feature_id: 'F-0099',
        secret_token: 'SHOULD_NOT_APPEAR',
      }),
      'utf8',
    );
    await symlink(externalJsonPath, path.join(stateDir, 'implementation.json'));
    await writeFile(
      sessionPath,
      [
        JSON.stringify({
          timestamp: '2026-04-10T09:59:00Z',
          type: 'session_meta',
          payload: { id: '019d7490-46d0-7811-b43f-056bb617a7c3', cwd: projectRoot },
        }),
        JSON.stringify({
          ts: '2026-04-10T10:00:00Z',
          type: 'assistant',
          content: 'Implementation phase for CF-0016 and F-0016.',
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

    const summary = buildScanSummary({ session: sessionPath, artifactsDir: projectRoot });
    const serialized = JSON.stringify(summary);

    assert.equal(summary.scope.artifact_identity.primary_feature_id, 'F-0016');
    assert.equal(serialized.includes('SHOULD_NOT_APPEAR'), false);
    assert.equal(serialized.includes('secret_token'), false);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('buildScanSummary keeps symlinked linked artifacts as unsafe non-included candidates', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const projectRoot = path.join(tempDir, 'project');
  const logsDir = path.join(projectRoot, '.dossier', 'logs');
  const reviewsDir = path.join(projectRoot, '.dossier', 'reviews');
  const sessionPath = path.join(tempDir, 'session.jsonl');
  const externalReviewPath = path.join(tempDir, 'external-review.md');
  const linkedReviewPath = path.join(reviewsDir, 'F-0016-review.md');

  try {
    await mkdir(logsDir, { recursive: true });
    await mkdir(reviewsDir, { recursive: true });
    await writeFile(
      path.join(logsDir, 'implementation.md'),
      [
        '```yaml',
        'stage: implementation',
        'feature_id: F-0016',
        'review_artifact: .dossier/reviews/F-0016-review.md',
        'process_misses_total: 0',
        '```',
        '',
        '# Implementation log',
      ].join('\n'),
      'utf8',
    );
    await writeFile(externalReviewPath, '# Review for F-0016 outside project\n', 'utf8');
    await symlink(externalReviewPath, linkedReviewPath);
    await writeFile(
      sessionPath,
      [
        JSON.stringify({
          timestamp: '2026-04-10T09:59:00Z',
          type: 'session_meta',
          payload: { id: '019d7490-46d0-7811-b43f-056bb617a7c4', cwd: projectRoot },
        }),
        JSON.stringify({
          ts: '2026-04-10T10:00:00Z',
          type: 'assistant',
          content: 'Implementation phase for CF-0016 and F-0016.',
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

    const summary = buildScanSummary({ session: sessionPath, artifactsDir: projectRoot });

    assert.deepEqual(summary.scope.candidate_review_artifacts, []);
    assert.equal(summary.scope.review_artifact_candidates[0]?.path, linkedReviewPath);
    assert.equal(summary.scope.review_artifact_candidates[0]?.included, false);
    assert.match(summary.scope.review_artifact_candidates[0]?.reason ?? '', /missing or unsafe/u);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('buildScanSummary narrows noisy trace ids through structured artifact identity', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const projectRoot = path.join(tempDir, 'project');
  const sessionPath = path.join(tempDir, 'session.jsonl');

  try {
    await cp(fixturePath('artifacts'), projectRoot, { recursive: true });
    await writeFile(
      sessionPath,
      [
        JSON.stringify({
          timestamp: '2026-04-10T09:59:00Z',
          type: 'session_meta',
          payload: { id: '019d7490-46d0-7811-b43f-056bb617a7bd', cwd: projectRoot },
        }),
        JSON.stringify({
          ts: '2026-04-10T10:00:00Z',
          type: 'assistant',
          content:
            'Implementation phase for CF-0016 and F-0016; compare unrelated notes for CF-0099 and F-0099 without widening scope.',
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

    assert.deepEqual(summary.scope.mentioned_features, ['F-0016']);
    assert.equal(summary.scope.artifact_identity.primary_feature_id, 'F-0016');
    assert.equal(
      summary.scope.scope_ambiguities.some((entry) => entry.includes('Multiple feature ids')),
      false,
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('buildScanSummary derives a same-session boundary from structured stage completion timestamps', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const projectRoot = path.join(tempDir, 'project');
  const logsDir = path.join(projectRoot, '.dossier', 'logs');
  const sessionPath = path.join(tempDir, 'session.jsonl');

  try {
    await mkdir(logsDir, { recursive: true });
    await writeFile(
      path.join(logsDir, 'implementation.md'),
      [
        '```yaml',
        'stage: implementation',
        'feature_id: F-0016',
        'skill: retrospective-phase-analysis',
        'completed_at: 2026-04-10T10:06:00Z',
        'process_misses_total: 0',
        '```',
        '',
        '# Implementation log',
      ].join('\n'),
      'utf8',
    );
    await writeFile(
      sessionPath,
      [
        JSON.stringify({
          timestamp: '2026-04-10T09:59:00Z',
          type: 'session_meta',
          payload: { id: '019d7490-46d0-7811-b43f-056bb617a7be', cwd: projectRoot },
        }),
        JSON.stringify({
          ts: '2026-04-10T10:00:00Z',
          type: 'assistant',
          content: 'Implementation phase for CF-0016 and F-0016.',
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
        JSON.stringify({
          ts: '2026-04-10T10:20:00Z',
          type: 'assistant',
          content: 'Now run retrospective extraction for F-0099.',
        }),
        JSON.stringify({
          timestamp: '2026-04-10T10:21:00Z',
          type: 'tool_call',
          tool: 'functions.apply_patch',
          patch:
            '*** Begin Patch\n*** Update File: .dossier/retro/session-019d/retrospective-report.md\n*** End Patch',
        }),
      ].join('\n'),
      'utf8',
    );

    const summary = buildScanSummary({
      session: sessionPath,
      artifactsDir: projectRoot,
    });

    assert.equal(summary.phase_boundary.mode, 'artifact_derived');
    assert.equal(summary.phase_boundary.excluded_events_count, 2);
    assert.deepEqual(summary.scope.mentioned_features, ['F-0016']);
    assert.deepEqual(summary.scope.candidate_stage_logs, [
      path.join(projectRoot, '.dossier', 'logs', 'implementation.md'),
    ]);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('buildScanSummary fails closed on ambiguous same-session follow-up without strong boundary evidence', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const projectRoot = path.join(tempDir, 'project');
  const logsDir = path.join(projectRoot, '.dossier', 'logs');
  const reviewsDir = path.join(projectRoot, '.dossier', 'reviews');
  const sessionPath = path.join(tempDir, 'session.jsonl');
  const reviewPath = path.join(reviewsDir, 'F-0016-review.md');

  try {
    await mkdir(logsDir, { recursive: true });
    await mkdir(reviewsDir, { recursive: true });
    await writeFile(
      path.join(logsDir, 'implementation.md'),
      [
        '```yaml',
        'stage: implementation',
        'feature_id: F-0016',
        'skill: retrospective-phase-analysis',
        'process_misses_total: 0',
        '```',
        '',
        '# Implementation log',
      ].join('\n'),
      'utf8',
    );
    await writeFile(reviewPath, '# Review for F-0016\n', 'utf8');
    await writeFile(
      sessionPath,
      [
        JSON.stringify({
          timestamp: '2026-04-10T09:59:00Z',
          type: 'session_meta',
          payload: { id: '019d7490-46d0-7811-b43f-056bb617a7bf', cwd: projectRoot },
        }),
        JSON.stringify({
          ts: '2026-04-10T10:00:00Z',
          type: 'assistant',
          content: 'Implementation phase for CF-0016 and F-0016.',
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
        JSON.stringify({
          ts: '2026-04-10T10:20:00Z',
          type: 'assistant',
          content: 'Now run retrospective extraction for F-0099.',
        }),
      ].join('\n'),
      'utf8',
    );

    assert.throws(
      () =>
        buildScanSummary({
          session: sessionPath,
          artifactsDir: projectRoot,
          reviewArtifacts: [reviewPath],
          artifactEvidence: 'Operator supplied review artifact, not a phase boundary.',
        }),
      /Ambiguous same-session phase boundary/u,
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('buildScanSummary fails closed when later same-session work mentions a different feature without another stage log', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const projectRoot = path.join(tempDir, 'project');
  const logsDir = path.join(projectRoot, '.dossier', 'logs');
  const sessionPath = path.join(tempDir, 'session.jsonl');

  try {
    await mkdir(logsDir, { recursive: true });
    await writeFile(
      path.join(logsDir, 'implementation.md'),
      [
        '```yaml',
        'stage: implementation',
        'feature_id: F-0016',
        'process_misses_total: 0',
        '```',
        '',
        '# F-0016 implementation log',
      ].join('\n'),
      'utf8',
    );
    await writeFile(
      sessionPath,
      [
        JSON.stringify({
          timestamp: '2026-04-10T09:59:00Z',
          type: 'session_meta',
          payload: { id: '019d7490-46d0-7811-b43f-056bb617a7c7', cwd: projectRoot },
        }),
        JSON.stringify({
          ts: '2026-04-10T10:00:00Z',
          type: 'assistant',
          content: 'Implementation phase for CF-0016 and F-0016.',
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
        JSON.stringify({
          ts: '2026-04-10T10:20:00Z',
          type: 'assistant',
          content: 'Start ordinary implementation work for CF-0099 and F-0099.',
        }),
      ].join('\n'),
      'utf8',
    );

    assert.throws(
      () => buildScanSummary({ session: sessionPath, artifactsDir: projectRoot }),
      /Ambiguous same-session phase boundary/u,
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('buildScanSummary fails closed when one session trace-confirms stage logs for multiple feature scopes', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const projectRoot = path.join(tempDir, 'project');
  const logsDir = path.join(projectRoot, '.dossier', 'logs');
  const sessionPath = path.join(tempDir, 'session.jsonl');

  try {
    await mkdir(logsDir, { recursive: true });
    await writeFile(
      path.join(logsDir, 'implementation-F-0016.md'),
      [
        '```yaml',
        'stage: implementation',
        'feature_id: F-0016',
        'process_misses_total: 0',
        '```',
        '',
        '# F-0016 implementation log',
      ].join('\n'),
      'utf8',
    );
    await writeFile(
      path.join(logsDir, 'implementation-F-0099.md'),
      [
        '```yaml',
        'stage: implementation',
        'feature_id: F-0099',
        'process_misses_total: 0',
        '```',
        '',
        '# F-0099 implementation log',
      ].join('\n'),
      'utf8',
    );
    await writeFile(
      sessionPath,
      [
        JSON.stringify({
          timestamp: '2026-04-10T09:59:00Z',
          type: 'session_meta',
          payload: { id: '019d7490-46d0-7811-b43f-056bb617a7c5', cwd: projectRoot },
        }),
        JSON.stringify({
          ts: '2026-04-10T10:00:00Z',
          type: 'assistant',
          content: 'Implementation phase for CF-0016 and F-0016.',
        }),
        JSON.stringify({
          timestamp: '2026-04-10T10:05:00Z',
          type: 'tool_call',
          tool: 'functions.apply_patch',
          patch:
            '*** Begin Patch\n*** Update File: .dossier/logs/implementation-F-0016.md\n*** End Patch',
        }),
        JSON.stringify({
          time: '2026-04-10T10:06:00Z',
          kind: 'tool_result',
          recipient: 'functions.apply_patch',
          status: 'ok',
        }),
        JSON.stringify({
          ts: '2026-04-10T10:20:00Z',
          type: 'assistant',
          content: 'Implementation phase for CF-0099 and F-0099.',
        }),
        JSON.stringify({
          timestamp: '2026-04-10T10:25:00Z',
          type: 'tool_call',
          tool: 'functions.apply_patch',
          patch:
            '*** Begin Patch\n*** Update File: .dossier/logs/implementation-F-0099.md\n*** End Patch',
        }),
        JSON.stringify({
          time: '2026-04-10T10:26:00Z',
          kind: 'tool_result',
          recipient: 'functions.apply_patch',
          status: 'ok',
        }),
      ].join('\n'),
      'utf8',
    );

    assert.throws(
      () => buildScanSummary({ session: sessionPath, artifactsDir: projectRoot }),
      /Ambiguous same-session phase boundary/u,
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('buildScanSummary prefers structured process-miss metrics over prose fallback', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const projectRoot = path.join(tempDir, 'project');
  const logsDir = path.join(projectRoot, '.dossier', 'logs');
  const sessionPath = path.join(tempDir, 'session.jsonl');

  try {
    await mkdir(logsDir, { recursive: true });
    await writeFile(
      path.join(logsDir, 'implementation.md'),
      [
        '```yaml',
        'stage: implementation',
        'feature_id: F-0016',
        'skills_used:',
        '  - retrospective-phase-analysis',
        'process_misses:',
        '  - structured miss only',
        '```',
        '',
        '## Process misses',
        '- prose miss one',
        '- prose miss two',
      ].join('\n'),
      'utf8',
    );
    await writeFile(
      sessionPath,
      [
        JSON.stringify({
          timestamp: '2026-04-10T09:59:00Z',
          type: 'session_meta',
          payload: { id: '019d7490-46d0-7811-b43f-056bb617a7c0', cwd: projectRoot },
        }),
        JSON.stringify({
          ts: '2026-04-10T10:00:00Z',
          type: 'assistant',
          content: 'Implementation phase for CF-0016 and F-0016.',
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

    const summary = buildScanSummary({ session: sessionPath, artifactsDir: projectRoot });
    const processMissIncident = summary.candidateIncidents.find((incident) =>
      incident.title.includes('Process misses'),
    );

    assert.equal(summary.stageLogs.metrics.processMissesTotal, 1);
    assert.equal(summary.stageLogs.metrics.sources.process_misses.quality, 'structured');
    assert.equal(summary.stageLogs.metrics.skillsReferenced['retrospective-phase-analysis'], 1);
    assert.equal(
      processMissIncident?.reason,
      'Structured process_misses field indicates process misses.',
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('buildScanSummary does not double-count prose review fallback when structured review findings exist', () => {
  const summary = buildScanSummary({
    session: fixturePath('sessions', 'phase-session-with-log-link.jsonl'),
    logsDir: fixturePath('artifacts', '.dossier', 'logs'),
    artifactsDir: fixturePath('artifacts'),
    skillsDir: fixturePath('skills'),
  });

  const reviewIncidents = summary.candidateIncidents.filter(
    (incident) =>
      incident.title.includes('Review findings') ||
      incident.title.includes('Non-pass review cycle'),
  );

  assert.deepEqual(
    reviewIncidents.map((incident) => incident.title),
    ['Review findings in implementation.md'],
  );
  assert.equal(summary.stageLogs.metrics.sources.candidate_incidents.quality, 'structured');
});

void test('buildScanSummary infers structured non-pass review incidents before a final PASS artifact', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const projectRoot = path.join(tempDir, 'project');
  const logsDir = path.join(projectRoot, '.dossier', 'logs');
  const stateDir = path.join(projectRoot, '.dossier', 'stages', 'F-0051');
  const reviewsDir = path.join(projectRoot, '.dossier', 'reviews');

  try {
    await mkdir(logsDir, { recursive: true });
    await mkdir(stateDir, { recursive: true });
    await mkdir(reviewsDir, { recursive: true });
    await cp(
      fixturePath('rpa-05', 'stage-log-structured-review.md'),
      path.join(logsDir, 'implementation.md'),
    );
    await cp(
      fixturePath('rpa-05', 'structured-stage-state.json'),
      path.join(stateDir, 'implementation.json'),
    );
    await cp(
      fixturePath('rpa-05', 'final-pass-review.md'),
      path.join(reviewsDir, 'F-0051-review.md'),
    );

    const summary = buildScanSummary({
      session: fixturePath('rpa-05', 'session-structured-review-fail.jsonl'),
      artifactsDir: projectRoot,
    });

    const reviewIncidents = summary.candidateIncidents.filter(
      (incident) =>
        incident.title.includes('Review findings') ||
        incident.title.includes('Non-pass review cycle'),
    );

    assert.equal(summary.stageLogs.count, 1);
    assert.deepEqual(
      reviewIncidents.map((incident) => incident.title),
      ['Non-pass review cycle in implementation.md'],
    );
    assert.match(reviewIncidents[0]?.reason ?? '', /Structured review_events/u);
    assert.equal(summary.stageLogs.metrics.reviewFindingsTotal, 0);
    assert.equal(summary.stageLogs.metrics.sources.candidate_incidents.quality, 'incomplete');
    assert.equal(summary.reviewSignals.length, 1);
    assert.equal(summary.reviewSignals[0]?.matching_artifact, false);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('buildScanSummary consumes active UDE RPA producer fields as structured evidence', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const projectRoot = path.join(tempDir, 'project');
  const logsDir = path.join(projectRoot, '.dossier', 'logs');
  const stateDir = path.join(projectRoot, '.dossier', 'stages', 'F-0072');
  const reviewsDir = path.join(projectRoot, '.dossier', 'reviews', 'F-0072');
  const sessionPath = path.join(tempDir, 'session.jsonl');
  const failArtifact = path.join(
    reviewsDir,
    'implementation--code-reviewer--r01--fail--abcdef1.json',
  );

  try {
    await mkdir(logsDir, { recursive: true });
    await mkdir(stateDir, { recursive: true });
    await mkdir(reviewsDir, { recursive: true });
    await writeFile(
      path.join(logsDir, 'implementation.md'),
      [
        '---',
        'stage: implementation',
        'primary_feature_id: F-0072',
        'primary_backlog_item_key: CF-0072',
        '---',
        '# Log',
      ].join('\n'),
      'utf8',
    );
    await writeFile(failArtifact, JSON.stringify({ verdict: 'FAIL' }), 'utf8');
    await writeFile(
      path.join(stateDir, 'implementation.json'),
      JSON.stringify({
        stage: 'implementation',
        primary_feature_id: 'F-0072',
        primary_backlog_item_key: 'CF-0072',
        rpa_source_identity: {
          schema_version: '1',
          feature_id: 'F-0072',
          stage: 'implementation',
        },
        rpa_source_quality: {
          schema_version: '1',
          review_history_quality: 'complete',
          selected_bundle_quality: 'complete',
          missing_fail_artifact_count: 0,
          trace_only_fail_count: 0,
        },
        non_pass_review_events: [
          {
            audit_class: 'code-reviewer',
            verdict: 'FAIL',
            review_round_id: 'r01',
            artifact_path:
              '.dossier/reviews/F-0072/implementation--code-reviewer--r01--fail--abcdef1.json',
            event_commit: 'abcdef1',
            must_fix_count: 2,
            evidence_count: 3,
          },
        ],
      }),
      'utf8',
    );
    await writeFile(
      sessionPath,
      [
        JSON.stringify({
          timestamp: '2026-04-26T09:00:00Z',
          type: 'session_meta',
          payload: { id: '019d9000-0000-7000-8000-000000000072', cwd: projectRoot },
        }),
        JSON.stringify({
          timestamp: '2026-04-26T09:01:00Z',
          type: 'tool_call',
          tool: 'functions.apply_patch',
          patch: '*** Begin Patch\n*** Update File: .dossier/logs/implementation.md\n*** End Patch',
        }),
        JSON.stringify({
          timestamp: '2026-04-26T09:02:00Z',
          type: 'tool_result',
          recipient: 'functions.apply_patch',
          status: 'ok',
        }),
      ].join('\n'),
      'utf8',
    );

    const summary = buildScanSummary({ session: sessionPath, artifactsDir: projectRoot });
    assert.equal(summary.reviewSignals.length, 1);
    assert.equal(summary.reviewSignals[0]?.source, 'ude');
    assert.equal(summary.reviewSignals[0]?.source_quality, 'structured');
    assert.equal(summary.reviewSignals[0]?.classification, 'active_unmatched');
    assert.equal(summary.reviewSignals[0]?.matching_artifact, true);
    assert.equal(summary.reviewSignals[0]?.must_fix_count, 2);
    assert.equal(summary.stageLogs.metrics.reviewFindingsTotal, 2);
    assert.equal(summary.stageLogs.metrics.sources.candidate_incidents.quality, 'structured');
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('buildScanSummary keeps duplicate trace review FAIL as historical context when complete UDE evidence covers it', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const projectRoot = path.join(tempDir, 'project');
  const logsDir = path.join(projectRoot, '.dossier', 'logs');
  const stateDir = path.join(projectRoot, '.dossier', 'stages', 'F-0073');
  const reviewsDir = path.join(projectRoot, '.dossier', 'reviews', 'F-0073');
  const sessionPath = path.join(tempDir, 'session.jsonl');
  const failArtifact = path.join(
    reviewsDir,
    'implementation--code-reviewer--r01--fail--abcdef1.json',
  );

  try {
    await mkdir(logsDir, { recursive: true });
    await mkdir(stateDir, { recursive: true });
    await mkdir(reviewsDir, { recursive: true });
    await writeFile(
      path.join(logsDir, 'implementation.md'),
      [
        '---',
        'stage: implementation',
        'primary_feature_id: F-0073',
        'primary_backlog_item_key: CF-0073',
        '---',
        '# Log',
      ].join('\n'),
      'utf8',
    );
    await writeFile(failArtifact, JSON.stringify({ verdict: 'FAIL' }), 'utf8');
    await writeFile(
      path.join(stateDir, 'implementation.json'),
      JSON.stringify({
        stage: 'implementation',
        primary_feature_id: 'F-0073',
        primary_backlog_item_key: 'CF-0073',
        rpa_source_identity: {
          schema_version: '1',
          feature_id: 'F-0073',
          backlog_item_key: 'CF-0073',
          stage: 'implementation',
        },
        rpa_source_quality: {
          schema_version: '1',
          review_history_quality: 'complete',
          selected_bundle_quality: 'complete',
          missing_fail_artifact_count: 0,
          trace_only_fail_count: 0,
        },
        non_pass_review_events: [
          {
            audit_class: 'code-reviewer',
            verdict: 'FAIL',
            review_round_id: 'r01',
            timestamp: '2026-04-26T09:10:00Z',
            artifact_path:
              '.dossier/reviews/F-0073/implementation--code-reviewer--r01--fail--abcdef1.json',
            event_commit: 'abcdef1',
            must_fix_count: 2,
            evidence_count: 3,
          },
        ],
      }),
      'utf8',
    );
    await writeFile(
      sessionPath,
      [
        JSON.stringify({
          timestamp: '2026-04-26T09:00:00Z',
          type: 'session_meta',
          payload: { id: '019d9000-0000-7000-8000-000000000073', cwd: projectRoot },
        }),
        JSON.stringify({
          timestamp: '2026-04-26T09:01:00Z',
          type: 'tool_call',
          tool: 'functions.apply_patch',
          patch: '*** Begin Patch\n*** Update File: .dossier/logs/implementation.md\n*** End Patch',
        }),
        JSON.stringify({
          timestamp: '2026-04-26T09:02:00Z',
          type: 'tool_result',
          recipient: 'functions.apply_patch',
          status: 'ok',
        }),
        JSON.stringify({
          timestamp: '2026-04-26T09:05:00Z',
          type: 'assistant',
          content:
            'External code-reviewer audit returned FAIL for F-0073 CF-0073 implementation round r01 at commit abcdef1 with 2 must-fix findings.',
        }),
      ].join('\n'),
      'utf8',
    );

    const summary = buildScanSummary({ session: sessionPath, artifactsDir: projectRoot });
    const traceSignal = summary.reviewSignals.find((signal) => signal.source === 'trace');
    const matrix = buildProblemMatrixMarkdown(summary);

    assert.equal(summary.reviewSignals.length, 2);
    assert.equal(traceSignal?.classification, 'historical');
    assert.equal(summary.stageLogs.metrics.reviewFindingsTotal, 2);
    assert.equal(summary.stageLogs.metrics.sources.candidate_incidents.quality, 'structured');
    assert.equal(
      summary.candidateIncidents.some((incident) =>
        incident.title.includes('Trace-derived non-pass review signal'),
      ),
      false,
    );
    assert.equal(
      summary.reportStatus.reasons.some((reason) =>
        reason.includes('Non-PASS review signals without matching immutable artifacts'),
      ),
      false,
    );
    assert.doesNotMatch(matrix, /PM-REVIEW-HISTORY/u);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('buildScanSummary keeps mismatched trace review FAIL active even when complete UDE evidence exists', async () => {
  const cases = [
    {
      name: 'later timestamp',
      timestamp: '2026-04-26T09:15:00Z',
      content:
        'External code-reviewer audit returned FAIL for F-0074 CF-0074 implementation round r01 at commit abcdef1 with 2 must-fix findings.',
    },
    {
      name: 'different audit class',
      timestamp: '2026-04-26T09:05:00Z',
      content:
        'External security-reviewer audit returned FAIL for F-0074 CF-0074 implementation round r01 at commit abcdef1 with 2 must-fix findings.',
    },
    {
      name: 'different round',
      timestamp: '2026-04-26T09:05:00Z',
      content:
        'External code-reviewer audit returned FAIL for F-0074 CF-0074 implementation round r02 at commit abcdef1 with 2 must-fix findings.',
    },
    {
      name: 'different commit',
      timestamp: '2026-04-26T09:05:00Z',
      content:
        'External code-reviewer audit returned FAIL for F-0074 CF-0074 implementation round r01 at commit 1234567 with 2 must-fix findings.',
    },
    {
      name: 'ambiguous scope',
      timestamp: '2026-04-26T09:05:00Z',
      content:
        'External code-reviewer audit returned FAIL for F-0074 F-9999 CF-0074 implementation round r01 at commit abcdef1 with 2 must-fix findings.',
    },
    {
      name: 'missing count',
      timestamp: '2026-04-26T09:05:00Z',
      content:
        'External code-reviewer audit returned FAIL for F-0074 CF-0074 implementation round r01 at commit abcdef1.',
    },
  ];

  for (const entry of cases) {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
    const projectRoot = path.join(tempDir, 'project');
    const logsDir = path.join(projectRoot, '.dossier', 'logs');
    const stateDir = path.join(projectRoot, '.dossier', 'stages', 'F-0074');
    const reviewsDir = path.join(projectRoot, '.dossier', 'reviews', 'F-0074');
    const sessionPath = path.join(tempDir, 'session.jsonl');
    const failArtifact = path.join(
      reviewsDir,
      'implementation--code-reviewer--r01--fail--abcdef1.json',
    );

    try {
      await mkdir(logsDir, { recursive: true });
      await mkdir(stateDir, { recursive: true });
      await mkdir(reviewsDir, { recursive: true });
      await writeFile(
        path.join(logsDir, 'implementation.md'),
        [
          '---',
          'stage: implementation',
          'primary_feature_id: F-0074',
          'primary_backlog_item_key: CF-0074',
          '---',
          '# Log',
        ].join('\n'),
        'utf8',
      );
      await writeFile(failArtifact, JSON.stringify({ verdict: 'FAIL' }), 'utf8');
      await writeFile(
        path.join(stateDir, 'implementation.json'),
        JSON.stringify({
          stage: 'implementation',
          primary_feature_id: 'F-0074',
          primary_backlog_item_key: 'CF-0074',
          rpa_source_identity: {
            schema_version: '1',
            feature_id: 'F-0074',
            backlog_item_key: 'CF-0074',
            stage: 'implementation',
          },
          rpa_source_quality: {
            schema_version: '1',
            review_history_quality: 'complete',
            selected_bundle_quality: 'complete',
            missing_fail_artifact_count: 0,
            trace_only_fail_count: 0,
          },
          non_pass_review_events: [
            {
              audit_class: 'code-reviewer',
              verdict: 'FAIL',
              review_round_id: 'r01',
              timestamp: '2026-04-26T09:10:00Z',
              artifact_path:
                '.dossier/reviews/F-0074/implementation--code-reviewer--r01--fail--abcdef1.json',
              event_commit: 'abcdef1',
              must_fix_count: 2,
              evidence_count: 3,
            },
          ],
        }),
        'utf8',
      );
      await writeFile(
        sessionPath,
        [
          JSON.stringify({
            timestamp: '2026-04-26T09:00:00Z',
            type: 'session_meta',
            payload: { id: '019d9000-0000-7000-8000-000000000074', cwd: projectRoot },
          }),
          JSON.stringify({
            timestamp: '2026-04-26T09:01:00Z',
            type: 'tool_call',
            tool: 'functions.apply_patch',
            patch:
              '*** Begin Patch\n*** Update File: .dossier/logs/implementation.md\n*** End Patch',
          }),
          JSON.stringify({
            timestamp: '2026-04-26T09:02:00Z',
            type: 'tool_result',
            recipient: 'functions.apply_patch',
            status: 'ok',
          }),
          JSON.stringify({
            timestamp: entry.timestamp,
            type: 'assistant',
            content: entry.content,
          }),
        ].join('\n'),
        'utf8',
      );

      const summary = buildScanSummary({
        session: sessionPath,
        artifactsDir: projectRoot,
        untilTs: '2026-04-26T09:20:00Z',
      });
      const traceSignal = summary.reviewSignals.find((signal) => signal.source === 'trace');

      assert.equal(traceSignal?.classification, 'active_unmatched', entry.name);
      assert.equal(
        summary.stageLogs.metrics.reviewFindingsTotal,
        entry.name === 'missing count' ? 3 : 4,
        entry.name,
      );
      assert.equal(summary.stageLogs.metrics.sources.candidate_incidents.quality, 'incomplete');
      assert.equal(
        summary.candidateIncidents.some((incident) =>
          incident.title.includes('Trace-derived non-pass review signal'),
        ),
        true,
        entry.name,
      );
      assert.equal(
        summary.reportStatus.reasons.some((reason) =>
          reason.includes('Non-PASS review signals without matching immutable artifacts'),
        ),
        true,
        entry.name,
      );
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  }
});

void test('buildScanSummary marks operational trace-derived review FAIL as incomplete evidence', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const projectRoot = path.join(tempDir, 'project');
  const sessionPath = path.join(tempDir, 'session.jsonl');

  try {
    await mkdir(projectRoot, { recursive: true });
    await writeFile(
      sessionPath,
      [
        JSON.stringify({
          timestamp: '2026-04-28T09:00:00Z',
          type: 'session_meta',
          payload: { id: '019f0000-0000-7000-8000-000000000077', cwd: projectRoot },
        }),
        JSON.stringify({
          timestamp: '2026-04-28T09:01:00Z',
          type: 'user',
          content:
            '## Proposed Resolution\nExtract trace-derived FAIL notifications from review metrics fixtures.',
        }),
        JSON.stringify({
          timestamp: '2026-04-28T09:02:00Z',
          type: 'assistant',
          content:
            '## Proposed Resolution\nA copied issue says trace-derived FAIL notifications should be lower quality review evidence.',
        }),
        JSON.stringify({
          timestamp: '2026-04-28T09:30:00Z',
          type: 'assistant',
          content:
            'External code-reviewer audit returned FAIL for round r1: one must-fix remains before final pass.',
        }),
      ].join('\n'),
      'utf8',
    );

    const summary = buildScanSummary({ session: sessionPath, artifactsDir: projectRoot });

    assert.equal(summary.reviewSignals.length, 1);
    assert.equal(summary.reviewSignals[0]?.source, 'trace');
    assert.equal(summary.reviewSignals[0]?.source_quality, 'trace_derived');
    assert.equal(summary.reviewSignals[0]?.classification, 'active_unmatched');
    assert.equal(summary.reviewSignals[0]?.audit_class, 'code-reviewer');
    assert.equal(summary.reviewSignals[0]?.matching_artifact, false);
    assert.equal(summary.reviewSignals[0]?.must_fix_count, 1);
    assert.equal(summary.stageLogs.metrics.reviewFindingsTotal, 1);
    assert.equal(summary.stageLogs.metrics.sources.candidate_incidents.quality, 'incomplete');
    assert.equal(
      summary.candidateIncidents.some((incident) =>
        incident.title.includes('Trace-derived non-pass review signal'),
      ),
      true,
    );
    assert.equal(
      summary.reportStatus.reasons.some((reason) =>
        reason.includes('Non-PASS review signals without matching immutable artifacts'),
      ),
      true,
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('buildScanSummary marks prose review incident fallback as validation-required', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const projectRoot = path.join(tempDir, 'project');
  const logsDir = path.join(projectRoot, '.dossier', 'logs');
  const sessionPath = path.join(tempDir, 'session.jsonl');

  try {
    await mkdir(logsDir, { recursive: true });
    await writeFile(
      path.join(logsDir, 'implementation.md'),
      [
        '```yaml',
        'stage: implementation',
        'feature_id: F-0016',
        'process_misses_total: 0',
        '```',
        '',
        '## Review events',
        '- 2026-04-10T11:00:00Z FAIL review found one issue',
      ].join('\n'),
      'utf8',
    );
    await writeFile(
      sessionPath,
      [
        JSON.stringify({
          timestamp: '2026-04-10T09:59:00Z',
          type: 'session_meta',
          payload: { id: '019d7490-46d0-7811-b43f-056bb617a7c6', cwd: projectRoot },
        }),
        JSON.stringify({
          ts: '2026-04-10T10:00:00Z',
          type: 'assistant',
          content: 'Implementation phase for CF-0016 and F-0016.',
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

    const summary = buildScanSummary({ session: sessionPath, artifactsDir: projectRoot });

    assert.equal(
      summary.candidateIncidents.some((incident) =>
        incident.title.includes('Non-pass review cycle'),
      ),
      true,
    );
    assert.equal(summary.stageLogs.metrics.sources.candidate_incidents.quality, 'incomplete');
    assert.equal(summary.reportStatus.status, 'draft_requires_agent_validation');
    assert.equal(
      summary.reportStatus.reasons.some((entry) => entry.includes('incomplete metrics')),
      true,
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('buildScanSummary marks prose fallback metrics as validation-required', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const projectRoot = path.join(tempDir, 'project');
  const logsDir = path.join(projectRoot, '.dossier', 'logs');
  const sessionPath = path.join(tempDir, 'session.jsonl');

  try {
    await mkdir(logsDir, { recursive: true });
    await writeFile(
      path.join(logsDir, 'implementation.md'),
      [
        '```yaml',
        'stage: implementation',
        'feature_id: F-0016',
        'skill: retrospective-phase-analysis',
        '```',
        '',
        '## Process misses',
        '- prose-only miss',
      ].join('\n'),
      'utf8',
    );
    await writeFile(
      sessionPath,
      [
        JSON.stringify({
          timestamp: '2026-04-10T09:59:00Z',
          type: 'session_meta',
          payload: { id: '019d7490-46d0-7811-b43f-056bb617a7c1', cwd: projectRoot },
        }),
        JSON.stringify({
          ts: '2026-04-10T10:00:00Z',
          type: 'assistant',
          content: 'Implementation phase for CF-0016 and F-0016.',
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

    const summary = buildScanSummary({ session: sessionPath, artifactsDir: projectRoot });

    assert.equal(summary.stageLogs.metrics.sources.process_misses.quality, 'prose_derived');
    assert.equal(summary.reportStatus.status, 'draft_requires_agent_validation');
    assert.equal(
      summary.reportStatus.reasons.some((entry) => entry.includes('incomplete metrics')),
      true,
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('buildScanSummary applies an active-session timestamp boundary before scope extraction', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const projectRoot = path.join(tempDir, 'project');
  const logsDir = path.join(projectRoot, '.dossier', 'logs');
  const sessionPath = path.join(tempDir, 'session.jsonl');

  try {
    await mkdir(path.dirname(logsDir), { recursive: true });
    await cp(fixturePath('artifacts', '.dossier', 'logs'), logsDir, { recursive: true });
    await writeFile(
      path.join(logsDir, 'retrospective.md'),
      ['```yaml', 'stage: retrospective', 'skill: retrospective-phase-analysis', '```'].join('\n'),
      'utf8',
    );

    await writeFile(
      sessionPath,
      [
        JSON.stringify({
          timestamp: '2026-04-10T09:59:00Z',
          type: 'session_meta',
          payload: { id: '019d7490-46d0-7811-b43f-056bb617a7b5', cwd: projectRoot },
        }),
        JSON.stringify({
          ts: '2026-04-10T10:00:00Z',
          type: 'assistant',
          content: 'Implementation phase for CF-0016 and F-0016',
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
        JSON.stringify({
          ts: '2026-04-10T10:20:00Z',
          type: 'assistant',
          content: 'Now run retrospective extraction for F-0099.',
        }),
        JSON.stringify({
          timestamp: '2026-04-10T10:21:00Z',
          type: 'tool_call',
          tool: 'functions.apply_patch',
          patch: '*** Begin Patch\n*** Update File: .dossier/logs/retrospective.md\n*** End Patch',
        }),
        JSON.stringify({
          time: '2026-04-10T10:22:00Z',
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
      untilTs: '2026-04-10T10:06:00Z',
    });

    assert.equal(summary.phase_boundary.mode, 'until_ts');
    assert.equal(summary.phase_boundary.excluded_events_count, 3);
    assert.equal(summary.session.eventCount, 4);
    assert.deepEqual(summary.scope.mentioned_features, ['F-0016']);
    assert.deepEqual(summary.scope.candidate_stage_logs, [
      path.join(projectRoot, '.dossier', 'logs', 'implementation.md'),
    ]);
    assert.equal(summary.stageLogs.count, 1);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('buildScanSummary applies an active-session line boundary deterministically', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const projectRoot = path.join(tempDir, 'project');
  const logsDir = path.join(projectRoot, '.dossier', 'logs');
  const sessionPath = path.join(tempDir, 'session.jsonl');

  try {
    await mkdir(path.dirname(logsDir), { recursive: true });
    await cp(fixturePath('artifacts', '.dossier', 'logs'), logsDir, { recursive: true });

    await writeFile(
      sessionPath,
      [
        JSON.stringify({
          timestamp: '2026-04-10T09:59:00Z',
          type: 'session_meta',
          payload: { id: '019d7490-46d0-7811-b43f-056bb617a7b6', cwd: projectRoot },
        }),
        JSON.stringify({
          ts: '2026-04-10T10:00:00Z',
          type: 'assistant',
          content: 'Implementation phase for CF-0016 and F-0016',
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
        JSON.stringify({
          ts: '2026-04-10T10:20:00Z',
          type: 'assistant',
          content: 'Retrospective-only follow-up for F-0099.',
        }),
      ].join('\n'),
      'utf8',
    );

    const summary = buildScanSummary({
      session: sessionPath,
      artifactsDir: projectRoot,
      untilLine: 4,
    });

    assert.equal(summary.phase_boundary.mode, 'until_line');
    assert.equal(summary.phase_boundary.excluded_events_count, 1);
    assert.equal(summary.session.eventCount, 4);
    assert.deepEqual(summary.scope.mentioned_features, ['F-0016']);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('buildScanSummary requires evidence for manual artifact overrides', () => {
  assert.throws(
    () =>
      buildScanSummary({
        session: fixturePath('sessions', 'phase-session.jsonl'),
        artifactsDir: fixturePath('artifacts'),
        stageLogs: [fixturePath('artifacts', '.dossier', 'logs', 'implementation.md')],
      }),
    /Manual artifact overrides require artifactEvidence/u,
  );
  assert.throws(
    () =>
      buildScanSummary({
        session: fixturePath('sessions', 'phase-session.jsonl'),
        artifactsDir: fixturePath('artifacts'),
        reviewArtifacts: [fixturePath('artifacts', '.dossier', 'reviews', 'F-0016-review.md')],
      }),
    /Manual artifact overrides require artifactEvidence/u,
  );
  assert.throws(
    () =>
      buildScanSummary({
        session: fixturePath('sessions', 'phase-session.jsonl'),
        artifactsDir: fixturePath('artifacts'),
        verificationArtifacts: [
          fixturePath('artifacts', '.dossier', 'verification', 'F-0016-verification.md'),
        ],
      }),
    /Manual artifact overrides require artifactEvidence/u,
  );
});

void test('buildScanSummary marks manual stage, review, and verification artifacts per kind', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const projectRoot = path.join(tempDir, 'project');
  const logsDir = path.join(projectRoot, '.dossier', 'logs');
  const reviewsDir = path.join(projectRoot, '.dossier', 'reviews');
  const verificationDir = path.join(projectRoot, '.dossier', 'verification');
  const sessionPath = path.join(tempDir, 'session.jsonl');
  const reviewPath = path.join(reviewsDir, 'F-0016-review.md');
  const verificationPath = path.join(verificationDir, 'F-0016-verification.md');

  try {
    await mkdir(path.dirname(logsDir), { recursive: true });
    await cp(fixturePath('artifacts', '.dossier', 'logs'), logsDir, { recursive: true });
    await mkdir(reviewsDir, { recursive: true });
    await mkdir(verificationDir, { recursive: true });
    await writeFile(reviewPath, '# review\n', 'utf8');
    await writeFile(verificationPath, '# verification\n', 'utf8');
    await writeFile(
      sessionPath,
      [
        JSON.stringify({
          timestamp: '2026-04-10T09:59:00Z',
          type: 'session_meta',
          payload: { id: '019d7490-46d0-7811-b43f-056bb617a7b7', cwd: projectRoot },
        }),
        JSON.stringify({
          ts: '2026-04-10T10:00:00Z',
          type: 'assistant',
          content: 'Implementation phase for CF-0016 and F-0016',
        }),
      ].join('\n'),
      'utf8',
    );

    const summary = buildScanSummary({
      session: sessionPath,
      artifactsDir: projectRoot,
      stageLogs: [path.join(logsDir, 'implementation.md')],
      reviewArtifacts: [reviewPath],
      verificationArtifacts: [verificationPath],
      artifactEvidence: 'Operator supplied closure artifact list.',
    });

    assert.equal(summary.stageLogs.count, 1);
    assert.equal(summary.scope.stage_log_candidates[0]?.inclusion_source, 'manual_included');
    assert.equal(summary.scope.review_artifact_candidates[0]?.inclusion_source, 'manual_included');
    assert.equal(
      summary.scope.verification_artifact_candidates[0]?.inclusion_source,
      'manual_included',
    );
    assert.deepEqual(summary.scope.candidate_review_artifacts, [reviewPath]);
    assert.deepEqual(summary.scope.candidate_verification_artifacts, [verificationPath]);
    assert.equal(summary.reportStatus.status, 'draft_requires_agent_validation');
    assert.equal(
      summary.reportStatus.reasons.some((entry) => entry.includes('Manual artifact overrides')),
      true,
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('buildScanSummary parses manual stage logs when no logs directory is discoverable', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const projectRoot = path.join(tempDir, 'project');
  const manualLogPath = path.join(tempDir, 'manual-stage-log.md');
  const sessionPath = path.join(tempDir, 'session.jsonl');

  try {
    await mkdir(projectRoot, { recursive: true });
    await writeFile(
      manualLogPath,
      [
        '```yaml',
        'stage: implementation',
        'skill: retrospective-phase-analysis',
        'review_rounds_total: 1',
        'review_findings_total: 2',
        '```',
        '',
        '# Manual stage log',
      ].join('\n'),
      'utf8',
    );
    await writeFile(
      sessionPath,
      [
        JSON.stringify({
          timestamp: '2026-04-10T09:59:00Z',
          type: 'session_meta',
          payload: { id: '019d7490-46d0-7811-b43f-056bb617a7b9', cwd: projectRoot },
        }),
        JSON.stringify({
          ts: '2026-04-10T10:00:00Z',
          type: 'assistant',
          content: 'Implementation phase for CF-0016 and F-0016',
        }),
      ].join('\n'),
      'utf8',
    );

    const summary = buildScanSummary({
      session: sessionPath,
      stageLogs: [manualLogPath],
      artifactEvidence: 'Operator supplied external stage log path.',
    });

    assert.equal(summary.dataQuality.logsPresent, true);
    assert.equal(summary.stageLogs.count, 1);
    assert.equal(summary.stageLogs.metrics.reviewRoundsTotal, 1);
    assert.equal(summary.stageLogs.metrics.reviewFindingsTotal, 2);
    assert.equal(summary.scope.stage_log_candidates[0]?.inclusion_source, 'manual_included');
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('buildScanSummary parses manual stage logs outside a discoverable logs directory', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const projectRoot = path.join(tempDir, 'project');
  const logsDir = path.join(projectRoot, '.dossier', 'logs');
  const manualLogPath = path.join(tempDir, 'external-stage-log.md');
  const sessionPath = path.join(tempDir, 'session.jsonl');

  try {
    await mkdir(path.dirname(logsDir), { recursive: true });
    await cp(fixturePath('artifacts', '.dossier', 'logs'), logsDir, { recursive: true });
    await writeFile(
      manualLogPath,
      [
        '```yaml',
        'stage: review',
        'skill: retrospective-phase-analysis',
        'review_rounds_total: 2',
        'review_findings_total: 3',
        '```',
        '',
        '# External stage log',
      ].join('\n'),
      'utf8',
    );
    await writeFile(
      sessionPath,
      [
        JSON.stringify({
          timestamp: '2026-04-10T09:59:00Z',
          type: 'session_meta',
          payload: { id: '019d7490-46d0-7811-b43f-056bb617a7ba', cwd: projectRoot },
        }),
        JSON.stringify({
          ts: '2026-04-10T10:00:00Z',
          type: 'assistant',
          content: 'Implementation phase for CF-0016 and F-0016',
        }),
      ].join('\n'),
      'utf8',
    );

    const summary = buildScanSummary({
      session: sessionPath,
      stageLogs: [manualLogPath],
      artifactEvidence: 'Operator supplied external stage log path.',
    });

    assert.equal(summary.resolved.logsDir, logsDir);
    assert.equal(summary.stageLogs.count, 1);
    assert.equal(summary.stageLogs.files[0]?.filePath, manualLogPath);
    assert.equal(summary.stageLogs.metrics.reviewRoundsTotal, 2);
    assert.equal(summary.stageLogs.metrics.reviewFindingsTotal, 3);
    assert.equal(summary.scope.stage_log_candidates[0]?.inclusion_source, 'manual_included');
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

void test('buildScanSummary marks clean evidence as ready for agent finalization', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'retrospective-phase-analysis-'));
  const projectRoot = path.join(tempDir, 'project');
  const logsDir = path.join(projectRoot, '.dossier', 'logs');
  const sessionPath = path.join(tempDir, 'session.jsonl');

  try {
    await mkdir(logsDir, { recursive: true });
    await writeFile(
      path.join(logsDir, 'implementation.md'),
      [
        '```yaml',
        'stage: implementation',
        'skill: retrospective-phase-analysis',
        'review_rounds_total: 0',
        'review_findings_total: 0',
        'process_misses_total: 0',
        'backlog_actualized: true',
        '```',
        '',
        '# Clean implementation log',
      ].join('\n'),
      'utf8',
    );
    await writeFile(
      sessionPath,
      [
        JSON.stringify({
          timestamp: '2026-04-10T09:58:00Z',
          type: 'response_item',
          payload: {
            type: 'message',
            role: 'developer',
            content: [
              {
                type: 'input_text',
                text: [
                  '### Available skills',
                  '- retrospective-phase-analysis: Perform retrospective analysis. (file: /synthetic-runtime/codex/skills/custom/skills/retrospective-phase-analysis/SKILL.md)',
                ].join('\n'),
              },
            ],
          },
        }),
        JSON.stringify({
          timestamp: '2026-04-10T09:59:00Z',
          type: 'session_meta',
          payload: { id: '019d7490-46d0-7811-b43f-056bb617a7bb', cwd: projectRoot },
        }),
        JSON.stringify({
          ts: '2026-04-10T10:00:00Z',
          type: 'assistant',
          content: 'Implementation phase for CF-0016',
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
    const markdown = buildReportMarkdown(summary, { phase: 'implementation' });

    assert.equal(summary.reportStatus.status, 'ready_for_agent_finalization');
    assert.deepEqual(summary.reportStatus.reasons, []);
    assert.match(markdown, /Status: ready for agent finalization/u);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
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
