import assert from 'node:assert/strict';
import test from 'node:test';

import { extractFrontmatter, parseFrontmatter } from '../src/lib/frontmatter.ts';

void test('extractFrontmatter returns raw frontmatter and markdown body', () => {
  const extracted = extractFrontmatter(`---
id: F-0001
title: Sample
---

## Scope

Body
`);

  assert.deepEqual(extracted, {
    raw: 'id: F-0001\ntitle: Sample',
    body: '\n## Scope\n\nBody\n',
  });
});

void test('parseFrontmatter parses inline collections and nested objects', () => {
  const frontmatter = parseFrontmatter(`---
id: F-0001
owners: ["@team", "@qa"]
flags: { rollout: true, retries: 3 }
meta:
  area: api
  enabled: true
---
`);

  assert.deepEqual(frontmatter, {
    id: 'F-0001',
    owners: ['@team', '@qa'],
    flags: { rollout: true, retries: 3 },
    meta: {
      area: 'api',
      enabled: true,
    },
  });
});

void test('parseFrontmatter returns null when markdown has no frontmatter block', () => {
  assert.equal(parseFrontmatter('## Scope\n\nNo frontmatter here.\n'), null);
});
