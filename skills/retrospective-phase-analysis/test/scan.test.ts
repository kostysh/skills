import assert from 'node:assert/strict';
import { chmod, cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { buildScanSummary } from '../src/core/build-scan-summary.ts';
import { redactScanSummaryForPublicArtifact } from '../src/core/shared.ts';
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
