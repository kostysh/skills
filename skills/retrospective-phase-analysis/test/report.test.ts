import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { buildScanSummary } from '../src/core/build-scan-summary.ts';
import type { ScanSummary } from '../src/core/types.ts';
import { buildLoggingReviewMarkdown } from '../src/render/logging-review-markdown.ts';
import { buildProblemMatrixMarkdown } from '../src/render/problem-matrix-markdown.ts';
import { buildReportMarkdown } from '../src/render/report-markdown.ts';
import { buildSkillAuditMarkdown } from '../src/render/skill-audit-markdown.ts';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(TEST_DIR, 'fixtures');

function fixturePath(...segments: string[]): string {
  return path.join(FIXTURES_DIR, ...segments);
}

function buildLinkedFixtureSummary() {
  return buildScanSummary({
    session: fixturePath('sessions', 'phase-session-with-log-link.jsonl'),
    logsDir: fixturePath('artifacts', '.dossier', 'logs'),
    artifactsDir: fixturePath('artifacts'),
    skillsDir: fixturePath('skills'),
  });
}

function buildSkillScopeFixtureSummary() {
  return buildScanSummary({
    session: fixturePath('contracts', 'session-skills-trace.jsonl'),
    skillsDir: fixturePath('skills'),
  });
}

function buildReferencedOnlyStageLogSummary() {
  const projectRoot = fixturePath('rpa-05', 'project');
  return buildScanSummary({
    session: fixturePath('rpa-05', 'session-referenced-only-stage-log.jsonl'),
    logsDir: path.join(projectRoot, '.dossier', 'logs'),
    artifactsDir: projectRoot,
    untilTs: '2026-04-24T09:03:00Z',
  });
}

function buildCompactedRawTraceSummary() {
  const projectRoot = fixturePath('rpa-06', 'project');
  return buildScanSummary({
    session: fixturePath('rpa-06', 'session-compacted-with-raw-trace.jsonl'),
    logsDir: path.join(projectRoot, '.dossier', 'logs'),
    artifactsDir: projectRoot,
    skillsDir: fixturePath('skills'),
  });
}

function markdownSection(markdown: string, heading: string): string {
  const match = markdown.match(new RegExp(`^## ${heading}\\n\\n([\\s\\S]*?)(?=\\n## |\\n$)`, 'mu'));
  return match?.[1] ?? '';
}

void test('report markdown includes core retrospective sections and inferred signals', () => {
  const markdown = buildReportMarkdown(buildLinkedFixtureSummary(), {
    phase: 'implementation',
    title: 'Retrospective: implementation',
  });

  assert.match(markdown, /^# Retrospective: implementation/mu);
  assert.match(markdown, /Status: draft, requires agent validation/u);
  assert.match(markdown, /^## Evidence manifest$/mu);
  assert.match(markdown, /^## Candidate incidents$/mu);
  assert.match(markdown, /Backlog actualization deferred/mu);
  assert.match(markdown, /Distinct tools observed: 3/mu);
});

void test('skill audit markdown keeps manual review prompts explicit', () => {
  const markdown = buildSkillAuditMarkdown(buildSkillScopeFixtureSummary());

  assert.match(markdown, /^# Skill audit draft$/mu);
  assert.match(markdown, /Status: draft, requires agent validation/u);
  assert.match(markdown, /### Skill: hono-engineer/mu);
  assert.match(markdown, /### Skill: retrospective-phase-analysis/mu);
  assert.doesNotMatch(markdown, /### Skill: unified-dossier-engineer/mu);
  assert.match(markdown, /Referenced skills in operational trace: 2/mu);
  assert.match(markdown, /line 3, event_msg\.payload\.message, matched `HONO engineer`/mu);
  assert.match(markdown, /Were mandatory review steps explicit\?/mu);
  assert.match(markdown, /Cross-skill patterns to investigate/mu);
});

void test('skill audit markdown renders an empty scaffold when no Available skills catalog exists', () => {
  const markdown = buildSkillAuditMarkdown(buildLinkedFixtureSummary());

  assert.match(markdown, /Available skills in injected catalog: 0/mu);
  assert.match(markdown, /Referenced skills in operational trace: 0/mu);
  assert.match(
    markdown,
    /The operational trace did not reference any skills from the injected `Available skills` catalog/u,
  );
  assert.doesNotMatch(markdown, /### Skill:/mu);
});

void test('logging review markdown highlights missing artifact links and automation ideas', () => {
  const markdown = buildLoggingReviewMarkdown(buildLinkedFixtureSummary());

  assert.match(markdown, /^# Logging review draft$/mu);
  assert.match(markdown, /Status: draft, requires agent validation/u);
  assert.match(markdown, /Missing review artifacts: 0/mu);
  assert.match(markdown, /Missing verification artifacts: 0/mu);
  assert.match(markdown, /^## Recommendation discipline$/mu);
  assert.match(markdown, /canonical review artifacts, workflow sequencing, or prompt recipes/mu);
  assert.match(markdown, /Add machine-readable trace anchors to each stage log/mu);
});

void test('report markdown separates compaction from data-quality limits', () => {
  const markdown = buildReportMarkdown(buildCompactedRawTraceSummary(), {
    phase: 'implementation',
    title: 'Retrospective: RPA-06 implementation',
  });

  const dataQuality = markdownSection(markdown, 'Data-quality limits');
  const agentContext = markdownSection(markdown, 'Agent-context factors');

  assert.match(markdown, /^## Data-quality limits$/mu);
  assert.match(markdown, /^## Agent-context factors$/mu);
  assert.match(markdown, /^## Validation metadata$/mu);
  assert.match(dataQuality, /Session trace available: true/mu);
  assert.match(dataQuality, /Session parse errors: 0/mu);
  assert.doesNotMatch(dataQuality, /compaction|compacted/iu);
  assert.match(agentContext, /Compaction events observed: 1/mu);
});

void test('markdown renderers mark zero included logs with excluded candidates as incomplete', () => {
  const summary = buildReferencedOnlyStageLogSummary();
  const report = buildReportMarkdown(summary, {
    phase: 'implementation',
    title: 'Retrospective: implementation',
  });
  const loggingReview = buildLoggingReviewMarkdown(summary);

  assert.match(
    report,
    /Candidate incidents: incomplete until excluded stage-log candidates are validated \(0 inferred automatically\)/u,
  );
  assert.match(
    report,
    /No candidate incidents were inferred automatically because no stage logs were analyzed; excluded stage-log candidates require validation first\./u,
  );
  assert.match(report, /implementation\.md/u);
  assert.match(loggingReview, /Log-derived metrics: incomplete/u);
  assert.match(
    loggingReview,
    /Excluded stage-log candidates require validation: .*implementation\.md/u,
  );
});

void test('problem matrix markdown includes required columns and validation metadata', () => {
  const markdown = buildProblemMatrixMarkdown(buildReferencedOnlyStageLogSummary());

  assert.match(markdown, /^# Problem matrix by skill$/mu);
  assert.match(
    markdown,
    /\| ID \| Проблема \| Скил, содержащий проблему \| Предложение по решению проблемы \|/u,
  );
  assert.match(markdown, /agent_validated: false/u);
});

void test('markdown renderers tolerate legacy scan summaries without metric source fields', () => {
  const legacySummary = structuredClone(buildLinkedFixtureSummary());
  const metrics = legacySummary.stageLogs.metrics as Partial<ScanSummary['stageLogs']['metrics']>;
  delete metrics.sources;

  assert.doesNotThrow(() =>
    buildReportMarkdown(legacySummary, {
      phase: 'implementation',
      title: 'Retrospective: implementation',
    }),
  );
  assert.doesNotThrow(() => buildLoggingReviewMarkdown(legacySummary));
  assert.match(
    buildReportMarkdown(legacySummary, { phase: 'implementation' }),
    /legacy scan summary/u,
  );
  assert.match(buildLoggingReviewMarkdown(legacySummary), /legacy scan summary/u);
});
