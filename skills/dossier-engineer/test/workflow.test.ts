import assert from 'node:assert/strict';
import test from 'node:test';

import type { DossierRecord } from '../src/lib/dossier-utils.ts';
import { defaultNextStep, selectActiveDossier, statusToNextStep } from '../src/core/workflow.ts';

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

void test('workflow helpers keep next-step dossier-local', () => {
  assert.equal(statusToNextStep('shaped'), 'plan-slice');
  assert.equal(statusToNextStep('done'), 'none');
  assert.equal(statusToNextStep('unexpected-status'), null);
  assert.equal(defaultNextStep('planned', 'plan-slice'), 'implementation');
  assert.equal(defaultNextStep('mystery-status', 'custom-step'), 'next-step');

  const selected = selectActiveDossier([
    makeDossier('F-0003', 'shaped'),
    makeDossier('F-0002', 'in_progress'),
    makeDossier('F-0001', 'planned'),
  ]);

  assert.equal(selected?.frontmatter.id, 'F-0002');
});
