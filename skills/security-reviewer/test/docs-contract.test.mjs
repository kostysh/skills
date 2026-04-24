import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const skillDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const readSkillFile = (relativePath) => readFile(path.join(skillDir, relativePath), 'utf8');

test('early-use workflow exposes the bounded auth-admission checkpoint', async () => {
  const skill = await readSkillFile('SKILL.md');

  assert.match(skill, /auth-admission early checkpoint/);
  assert.match(skill, /protected route admission/);
  assert.match(skill, /pre-auth resource consumption/);
  assert.match(skill, /replay\/idempotency controls/);
  assert.match(skill, /bounded request-body handling/);
  assert.match(skill, /do not turn it into a generic security planning framework/);
});

test('api auth reference keeps the auth-admission checklist narrow and complete', async () => {
  const reference = await readSkillFile('references/api-auth-input.md');

  assert.match(reference, /## Auth-Admission Early Checklist/);
  assert.match(reference, /route trust boundary/);
  assert.match(reference, /pre-auth versus post-auth resource consumption/);
  assert.match(reference, /quota isolation/);
  assert.match(reference, /replay\/idempotency expectations/);
  assert.match(reference, /bounded body handling/);
  assert.match(reference, /Keep the checklist narrow/);
  assert.match(reference, /route-specific/);
  assert.match(reference, /references\/policy-governance-admission\.md/);
});

test('domain handoff keeps Hono-specific admission facts with HONO engineer', async () => {
  const reference = await readSkillFile('references/domain-handoffs.md');

  assert.match(reference, /route admission-boundary preservation/);
  assert.match(reference, /route-specific body limits/);
  assert.match(
    reference,
    /preserves the touched route's existing public\/user\/admin\/webhook\/service\/operator boundary/,
  );
  assert.match(reference, /non-route policy-governance admission/);
  assert.match(reference, /HIGH-confidence security finding decision/);
});

test('early-use workflow exposes the bounded policy-governance admission checkpoint', async () => {
  const skill = await readSkillFile('SKILL.md');

  assert.match(skill, /policy-governance admission checkpoint/);
  assert.match(skill, /external consultant\/tool invocation/);
  assert.match(skill, /active-scope selection/);
  assert.match(skill, /distinct from route auth-admission/);
  assert.match(skill, /references\/policy-governance-admission\.md/);
  assert.match(skill, /security-relevant operator\/control-plane impact/);
});

test('policy-governance admission reference keeps the checkpoint bounded and reportable', async () => {
  const reference = await readSkillFile('references/policy-governance-admission.md');

  assert.match(reference, /## Trigger Boundary/);
  assert.match(reference, /external consultant\/tool invocation admission/);
  assert.match(reference, /policy profile activation or active-scope selection/);
  assert.match(reference, /governance\/audit persistence used as a precondition/);
  assert.match(reference, /explicit deny\/no-invocation/);
  assert.match(reference, /failed\/conflicting audit persistence/);
  assert.match(reference, /stale allow replay/);
  assert.match(reference, /freshness timestamp/);
  assert.match(reference, /age-gated evidence fails closed/);
  assert.match(reference, /activation race/);
  assert.match(reference, /audit explanation sufficiency/);
  assert.match(reference, /HIGH-confidence findings/);
  assert.match(reference, /operator\/control-plane impact/);
  assert.match(reference, /code-reviewer/);
});

test('policy-governance examples cover external invocation and active-policy activation', async () => {
  const reference = await readSkillFile('references/policy-governance-admission.md');

  assert.match(reference, /### External Invocation Admission Review/);
  assert.match(reference, /After explicit DENY/);
  assert.match(reference, /failed\/conflicting persistence still permits side effects/);
  assert.match(reference, /stale replay reaches an external invocation/);
  assert.match(reference, /### Active-Policy Activation Review/);
  assert.match(reference, /active-policy activation is serialized/);
  assert.match(reference, /simultaneous active security\/governance policies/);
  assert.match(reference, /audit explanation sufficiency for both the refused activation and the admitted active policy/);
});
