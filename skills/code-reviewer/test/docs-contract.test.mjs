import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readSkillFile = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('bundled review template preserves the outcome-first output contract', async () => {
  const [manifest, skill, template] = await Promise.all([
    readSkillFile('skill.yaml'),
    readSkillFile('SKILL.md'),
    readSkillFile('assets/pr-review-template.md'),
  ]);

  assert.match(manifest, /source-version: 0\.4\.5/);
  assert.match(manifest, /source: assets\/pr-review-template\.md/);
  assert.match(skill, /Begin with one plain-language outcome sentence, then findings by severity/);
  assert.match(skill, /`assets\/pr-review-template\.md`/);
  assert.match(template, /^<Plain-language outcome sentence:/);
  assert.ok(template.indexOf('Plain-language outcome sentence') < template.indexOf('## Findings'));
  assert.doesNotMatch(template, /^# Review Template/);
});
