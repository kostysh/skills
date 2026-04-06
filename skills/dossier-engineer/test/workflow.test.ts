import assert from 'node:assert/strict';
import test from 'node:test';

import type { DossierRecord } from '../src/lib/dossier-utils.ts';
import {
  defaultNextStep,
  parseCandidates,
  selectActiveDossier,
  statusToNextStep,
} from '../src/core/workflow.ts';

function makeDossier(id: string, status: string): DossierRecord {
  return {
    absPath: `/tmp/${id}.md`,
    relPath: `docs/features/${id}.md`,
    markdown: '',
    frontmatter: { id, status },
    coverageGate: 'deferred',
    acIds: [],
    coverageIds: [],
  };
}

void test('parseCandidates reads feature candidate table rows', () => {
  const candidates = parseCandidates(`| ID | Title | Area | Status | Depends on | Why now | Dossier |
| --- | --- | --- | --- | --- | --- | --- |
| CF-0001 | Queue retry handling | worker | proposed | F-0009 | unblock retries | docs/features/F-0001.md |
`);

  assert.deepEqual(candidates, [
    {
      id: 'CF-0001',
      title: 'Queue retry handling',
      area: 'worker',
      status: 'proposed',
      dependsOn: 'F-0009',
      why: 'unblock retries',
      dossier: 'docs/features/F-0001.md',
    },
  ]);
});

void test('workflow helpers prefer active implementation work and preserve compact defaults', () => {
  assert.equal(statusToNextStep('shaped'), 'plan-slice');
  assert.equal(defaultNextStep('planned', 'plan-slice'), 'implementation');

  const selected = selectActiveDossier([
    makeDossier('F-0003', 'shaped'),
    makeDossier('F-0002', 'in_progress'),
    makeDossier('F-0001', 'planned'),
  ]);

  assert.equal(selected?.frontmatter.id, 'F-0002');
});
