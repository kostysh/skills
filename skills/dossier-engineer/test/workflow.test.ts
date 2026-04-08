import assert from 'node:assert/strict';
import test from 'node:test';

import { defaultNextStep, normalizeWorkflowStage, statusToNextStep } from '../src/core/workflow.ts';

void test('workflow helpers keep next-step dossier-local', () => {
  assert.equal(statusToNextStep('shaped'), 'plan-slice');
  assert.equal(statusToNextStep('done'), null);
  assert.equal(statusToNextStep('unexpected-status'), null);
  assert.equal(defaultNextStep('planned', 'plan-slice'), 'implementation');
  assert.equal(defaultNextStep('mystery-status', 'custom-step'), null);
  assert.equal(normalizeWorkflowStage('implementation'), 'implementation');
  assert.equal(normalizeWorkflowStage('contract-drift-audit'), null);
  assert.equal(normalizeWorkflowStage('resume-or-discard'), null);
});
