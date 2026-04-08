import assert from 'node:assert/strict';
import test from 'node:test';

import {
  collectExecutableSectionLines,
  extractAcStatementLines,
  getSectionText,
  hasExecutableSectionChange,
  parseTopLevelSections,
} from '../src/core/markdown.ts';

void test('parseTopLevelSections and getSectionText return heading bodies', () => {
  const markdown = `Intro

## Scope

Implement the flow.

## Verification surface / initial verification plan

- AC-F0001-01: integration
`;

  const sections = parseTopLevelSections(markdown);
  assert.equal(sections.get('Scope'), 'Implement the flow.');
  assert.equal(getSectionText(markdown, /verification|test plan/i), '- AC-F0001-01: integration');
});

void test('collectExecutableSectionLines keeps only executable sections', () => {
  const lines = collectExecutableSectionLines(`## Notes

- Ignore this note.

## Requirements & Acceptance Criteria

- AC-F0001-01 Request succeeds.

## Rollout / activation note

- Enable the flag after migration.
`);

  assert.deepEqual(lines, [
    '- AC-F0001-01 Request succeeds.',
    '- Enable the flag after migration.',
  ]);
});

void test('extractAcStatementLines normalizes AC ids to two digits', () => {
  const statements = extractAcStatementLines(`- AC-F0001-1 Validate payload.
- AC-F0001-02 Return success.`);

  assert.deepEqual(statements, [
    { acId: 'AC-F0001-01', line: '- AC-F0001-1 Validate payload.' },
    { acId: 'AC-F0001-02', line: '- AC-F0001-02 Return success.' },
  ]);
});

void test('hasExecutableSectionChange ignores notes but detects design changes', () => {
  const beforeSections = parseTopLevelSections(`## Notes

Before note.

## Design (compact)

Old design.
`);
  const afterSections = parseTopLevelSections(`## Notes

Updated note.

## Design (compact)

New design.
`);

  assert.deepEqual(hasExecutableSectionChange(beforeSections, afterSections), ['Design (compact)']);
});
