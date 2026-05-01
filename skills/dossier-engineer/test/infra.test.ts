import assert from 'node:assert/strict';
import { mkdtemp, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { acquireDossierWriteLock } from '../src/infra.ts';

const tempProject = async () => mkdtemp(path.join(os.tmpdir(), 'dossier-engineer-infra-'));

void test('write lock acquisition cleans up when holder metadata write fails', async () => {
  const root = await tempProject();

  await assert.rejects(
    acquireDossierWriteLock(root, 'dossier-engineer source add', new Date('2026-05-02T00:00:00Z'), {
      writeMetadata: () => Promise.reject(new Error('simulated metadata write failure')),
    }),
    /simulated metadata write failure/,
  );

  await assert.rejects(stat(path.join(root, '.dossier-runtime', 'write.lock')));
});
