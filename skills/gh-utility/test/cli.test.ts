import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { parseSecretEnv, redact, routeGitHubInput, validateSkillFolder } from '../src/cli.ts';

void describe('routeGitHubInput', () => {
  void it('routes pull request URLs to gh pr view', () => {
    const route = routeGitHubInput('https://github.com/openai/codex/pull/123');

    assert.equal(route.kind, 'pull-request');
    assert.deepEqual(route.commands, ['gh pr view 123 --repo openai/codex']);
  });

  void it('routes raw GitHub URLs without recommending raw fetch', () => {
    const route = routeGitHubInput('https://raw.githubusercontent.com/openai/codex/main/README.md');

    assert.equal(route.kind, 'raw-file');
    assert.match(String((route.commands as string[])[0]), /gh repo clone openai\/codex/);
    assert.match(String((route.notes as string[])[0]), /shallow clone/);
  });
});

void describe('secret manifests', () => {
  void it('parses dotenv files without exposing values', () => {
    const items = parseSecretEnv('TOKEN=super-secret\nEMPTY=""\n# ignored\nBAD LINE');

    assert.deepEqual(items, [
      { line: 1, name: 'TOKEN', valueLength: 12, empty: false },
      { line: 2, name: 'EMPTY', valueLength: 0, empty: true },
      { line: 4, error: 'not_key_value', rawPreview: 'BAD LINE' },
    ]);
    assert.equal(JSON.stringify(items).includes('super-secret'), false);
  });

  void it('redacts common token shapes', () => {
    assert.equal(
      redact('Authorization: bearer ghp_abcdefghijklmnopqrstuvwxyz'),
      'Authorization: bearer <redacted>',
    );
    assert.equal(redact('password=hunter2'), 'password=<redacted>');
  });
});

void describe('validateSkillFolder', () => {
  void it('validates a minimal skill folder and warns on missing local links', () => {
    const dir = mkdtempSync(join(tmpdir(), 'gh-utility-skill-'));
    try {
      writeFileSync(
        join(dir, 'SKILL.md'),
        `---
name: sample-skill
description: Sample skill.
---

# Sample

See [missing](references/missing.md).
`,
      );

      const result = validateSkillFolder(dir);

      assert.equal(result.ok, true);
      assert.equal(result.name, 'sample-skill');
      assert.deepEqual(result.errors, []);
      assert.deepEqual(result.warnings, [
        'Linked local path does not exist: references/missing.md',
      ]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
