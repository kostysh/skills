import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { buildScanSummary } from '../src/core/build-scan-summary.ts';
import { buildLoggingReviewMarkdown } from '../src/render/logging-review-markdown.ts';
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
  assert.doesNotMatch(markdown, /### Skill: backlog-engineer/mu);
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
  assert.match(markdown, /Add machine-readable trace anchors to each stage log/mu);
});
