import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm as rmNode, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { createArtifactsModule } from '../src/artifacts/index.ts';
import { createErrorModule } from '../src/errors/index.ts';
import {
  createNodeFileSystemPort,
  createNodeHashPort,
  createNodePathPort,
} from '../src/runtime/index.ts';
import { createSchemaModule } from '../src/schemas/index.ts';
import type {
  AppliedRegistryFile,
  RootMarkerFile,
  SourceRegistryFile,
  StateFile,
} from '../src/schemas/index.ts';
import { createInMemoryFileSystemPort } from './support/in-memory-fs.ts';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(TEST_DIR, 'fixtures');
const EMPTY_BACKLOG_DIR = path.join(FIXTURES_DIR, 'backlogs', 'empty-backlog');
const AUTHORED_DIR = path.join(FIXTURES_DIR, 'authored');

async function loadJsonFixture<T>(fixturePath: string): Promise<T> {
  return JSON.parse(await readFile(fixturePath, 'utf8')) as T;
}

async function loadTextFixture(fixturePath: string): Promise<string> {
  return readFile(fixturePath, 'utf8');
}

async function createFixtureBundle(): Promise<{
  marker: RootMarkerFile;
  sourceRegistry: SourceRegistryFile;
  appliedRegistry: AppliedRegistryFile;
  state: StateFile;
}> {
  const [marker, sourceRegistry, appliedRegistry, state] = await Promise.all([
    loadJsonFixture<RootMarkerFile>(path.join(EMPTY_BACKLOG_DIR, '.backlog.json')),
    loadJsonFixture<SourceRegistryFile>(path.join(EMPTY_BACKLOG_DIR, '.backlog', 'sources.json')),
    loadJsonFixture<AppliedRegistryFile>(path.join(EMPTY_BACKLOG_DIR, '.backlog', 'applied.json')),
    loadJsonFixture<StateFile>(path.join(EMPTY_BACKLOG_DIR, '.backlog', 'state.json')),
  ]);

  return {
    marker,
    sourceRegistry,
    appliedRegistry,
    state,
  };
}

async function computeTempSiblingPath(targetPath: string, content: string): Promise<string> {
  const seedHash = await createNodeHashPort().sha256Text(`${targetPath}\n${content}`);
  return path.posix.join(
    path.posix.dirname(targetPath),
    `.${path.posix.basename(targetPath)}.tmp-${seedHash.slice(0, 12)}`,
  );
}

function createArtifactsForTest(
  cwd = '/repo' as const,
  options: Parameters<typeof createInMemoryFileSystemPort>[0] = { cwd },
) {
  const fs = createInMemoryFileSystemPort({ cwd, ...options });
  const pathPort = createNodePathPort();
  const hash = createNodeHashPort();
  const schemas = createSchemaModule();
  const errors = createErrorModule();

  return {
    fs,
    hash,
    artifacts: createArtifactsModule({
      fs,
      path: pathPort,
      hash,
      schemas,
      errors,
    }),
    errors,
  };
}

void test('artifacts module creates backlog layout and round-trips initial artifacts', async () => {
  const { fs, artifacts } = createArtifactsForTest();
  const fixture = await createFixtureBundle();
  const root = '/repo/backlog';

  await artifacts.writeInitialArtifacts({
    root,
    marker: fixture.marker,
    agentsContent: '# backlog agents\n',
    sourceRegistry: fixture.sourceRegistry,
    appliedRegistry: fixture.appliedRegistry,
    state: fixture.state,
  });

  assert.equal(await fs.exists('/repo/backlog/.backlog.json'), true);
  assert.equal(await fs.exists('/repo/backlog/AGENTS.md'), true);
  assert.equal(await fs.exists('/repo/backlog/.backlog/sources.json'), true);
  assert.equal(await fs.exists('/repo/backlog/.backlog/applied.json'), true);
  assert.equal(await fs.exists('/repo/backlog/.backlog/state.json'), true);
  assert.equal(await fs.exists('/repo/backlog/packets'), true);
  assert.equal(await fs.exists('/repo/backlog/patches'), true);
  assert.equal(await fs.exists('/repo/backlog/reports'), true);
  assert.equal(await artifacts.stateExists(root), true);

  assert.deepEqual(await artifacts.readRootMarker(root), fixture.marker);
  assert.deepEqual(await artifacts.readSourceRegistry(root), fixture.sourceRegistry);
  assert.deepEqual(await artifacts.readAppliedRegistry(root), fixture.appliedRegistry);
  assert.deepEqual(await artifacts.readState(root), fixture.state);
});

void test('artifacts module writes AGENTS.md directly through writeAgentsFile', async () => {
  const { fs, artifacts } = createArtifactsForTest();
  const root = '/repo/backlog';
  await artifacts.createBacklogDirectories(root);

  await artifacts.writeAgentsFile(root, '# backlog agents\n');

  assert.equal(await fs.readText('/repo/backlog/AGENTS.md'), '# backlog agents\n');
});

void test('artifacts module writes canonical packet and patch copies with hash-prefixed filenames', async () => {
  const { fs, hash, artifacts } = createArtifactsForTest();
  const root = '/repo/backlog';
  await artifacts.createBacklogDirectories(root);

  const [packetText, patchText] = await Promise.all([
    loadTextFixture(path.join(AUTHORED_DIR, 'packets', 'auth-module.packet.json')),
    loadTextFixture(path.join(AUTHORED_DIR, 'patches', 'auth-module.patch-item.json')),
  ]);

  const expectedPacketHash = await hash.sha256Text(packetText);
  const expectedPatchHash = await hash.sha256Text(patchText);

  const packetImport = await artifacts.importPacketFile({
    root,
    packetId: '11111111-1111-4111-8111-111111111111',
    sourcePath: '/repo/tmp/auth-module.packet.json',
    canonicalBasename: 'auth-module.packet.json',
    rawContent: packetText,
  });
  const patchImport = await artifacts.importPatchFile({
    root,
    patchId: '2026-04-06-001-auth-module',
    sourcePath: '/repo/tmp/auth-module.patch.json',
    canonicalBasename: 'auth-module.patch-item.json',
    rawContent: patchText,
  });

  assert.equal(
    packetImport.canonicalPath,
    `packets/${expectedPacketHash.slice(0, 12)}--auth-module.packet.json`,
  );
  assert.equal(packetImport.sha256, expectedPacketHash);
  assert.equal(await fs.readText(`/repo/backlog/${packetImport.canonicalPath}`), packetText);

  assert.equal(
    patchImport.canonicalPath,
    `patches/${expectedPatchHash.slice(0, 12)}--auth-module.patch-item.json`,
  );
  assert.equal(patchImport.sha256, expectedPatchHash);
  assert.equal(await fs.readText(`/repo/backlog/${patchImport.canonicalPath}`), patchText);
});

void test('artifacts module reuses an existing canonical import file with identical content', async () => {
  const { fs, artifacts } = createArtifactsForTest();
  const root = '/repo/backlog';
  await artifacts.createBacklogDirectories(root);

  const packetText = await loadTextFixture(
    path.join(AUTHORED_DIR, 'packets', 'auth-module.packet.json'),
  );
  const firstImport = await artifacts.importPacketFile({
    root,
    packetId: '11111111-1111-4111-8111-111111111111',
    sourcePath: '/repo/tmp/auth-module.packet.json',
    canonicalBasename: 'auth-module.packet.json',
    rawContent: packetText,
  });
  const firstStat = await fs.stat(`/repo/backlog/${firstImport.canonicalPath}`);

  const secondImport = await artifacts.importPacketFile({
    root,
    packetId: '22222222-2222-4222-8222-222222222222',
    sourcePath: '/repo/tmp/again-auth-module.packet.json',
    canonicalBasename: 'auth-module.packet.json',
    rawContent: packetText,
  });
  const secondStat = await fs.stat(`/repo/backlog/${secondImport.canonicalPath}`);

  assert.equal(secondImport.canonicalPath, firstImport.canonicalPath);
  assert.equal(secondStat.mtimeMs, firstStat.mtimeMs);
});

void test('artifacts module accepts a source file that is already the canonical import file', async () => {
  const { fs, hash, artifacts } = createArtifactsForTest();
  const root = '/repo/backlog';
  await artifacts.createBacklogDirectories(root);

  const packetText = await loadTextFixture(
    path.join(AUTHORED_DIR, 'packets', 'auth-module.packet.json'),
  );
  const packetHash = await hash.sha256Text(packetText);
  const canonicalPath = `/repo/backlog/packets/${packetHash.slice(0, 12)}--auth-module.packet.json`;

  await fs.writeText(canonicalPath, packetText);
  const beforeStat = await fs.stat(canonicalPath);

  const imported = await artifacts.importPacketFile({
    root,
    packetId: '33333333-3333-4333-8333-333333333333',
    sourcePath: canonicalPath,
    canonicalBasename: 'auth-module.packet.json',
    rawContent: packetText,
  });
  const afterStat = await fs.stat(canonicalPath);

  assert.equal(
    imported.canonicalPath,
    `packets/${packetHash.slice(0, 12)}--auth-module.packet.json`,
  );
  assert.equal(afterStat.mtimeMs, beforeStat.mtimeMs);
});

void test('artifacts module writes report files to the standard reports directory', async () => {
  const { fs, artifacts } = createArtifactsForTest();
  const root = '/repo/backlog';
  await artifacts.createBacklogDirectories(root);

  const result = await artifacts.writeReportFiles({
    root,
    markdown: '# backlog report\n',
    mermaid: 'graph TD\n',
  });

  assert.deepEqual(result, {
    reportPath: 'reports/backlog-report.md',
    graphPath: 'reports/backlog-graph.mmd',
  });
  assert.equal(await fs.readText('/repo/backlog/reports/backlog-report.md'), '# backlog report\n');
  assert.equal(await fs.readText('/repo/backlog/reports/backlog-graph.mmd'), 'graph TD\n');
});

void test('artifacts module resolves template output for directory and file targets', async () => {
  const { fs, artifacts } = createArtifactsForTest();

  await fs.mkdir('/repo/out', { recursive: true });
  const directoryOutput = await artifacts.writeTemplateOutput({
    cwd: '/repo',
    out: './out',
    defaultBasename: 'packet.template.json',
    content: '{"mode":"packet"}\n',
  });
  const fileOutput = await artifacts.writeTemplateOutput({
    cwd: '/repo',
    out: './custom/template.json',
    defaultBasename: 'ignored.json',
    content: '{"mode":"patch"}\n',
  });

  assert.equal(directoryOutput, '/repo/out/packet.template.json');
  assert.equal(fileOutput, '/repo/custom/template.json');
  assert.equal(await fs.readText(directoryOutput), '{"mode":"packet"}\n');
  assert.equal(await fs.readText(fileOutput), '{"mode":"patch"}\n');
});

void test('artifacts module deletes the whole backlog root recursively', async () => {
  const { fs, artifacts } = createArtifactsForTest();
  const fixture = await createFixtureBundle();
  const root = '/repo/backlog';

  await artifacts.writeInitialArtifacts({
    root,
    marker: fixture.marker,
    agentsContent: '# backlog agents\n',
    sourceRegistry: fixture.sourceRegistry,
    appliedRegistry: fixture.appliedRegistry,
    state: fixture.state,
  });

  await artifacts.deleteBacklog(root);

  assert.equal(await fs.exists(root), false);
});

void test('artifacts module rejects deleteBacklog when root contains unrelated files', async () => {
  const { fs, artifacts, errors } = createArtifactsForTest();
  const fixture = await createFixtureBundle();
  const root = '/repo/backlog';

  await artifacts.writeInitialArtifacts({
    root,
    marker: fixture.marker,
    agentsContent: '# backlog agents\n',
    sourceRegistry: fixture.sourceRegistry,
    appliedRegistry: fixture.appliedRegistry,
    state: fixture.state,
  });
  await fs.writeText('/repo/backlog/README.txt', 'keep me\n');

  await assert.rejects(
    () => artifacts.deleteBacklog(root),
    (error: unknown) => {
      assert.equal(errors.isBacklogError(error), true);
      if (!errors.isBacklogError(error)) {
        return false;
      }
      assert.equal(error.code, 'BE_INTERNAL_STATE_CORRUPT');
      return true;
    },
  );

  assert.equal(await fs.exists(root), true);
  assert.equal(await fs.exists('/repo/backlog/README.txt'), true);
  assert.equal(await fs.exists('/repo/backlog/.backlog.json'), true);
  assert.equal(await fs.exists('/repo/backlog/.backlog'), true);
  assert.equal(await fs.exists('/repo/backlog/AGENTS.md'), true);
  assert.equal(await fs.exists('/repo/backlog/packets'), true);
  assert.equal(await fs.exists('/repo/backlog/patches'), true);
  assert.equal(await fs.exists('/repo/backlog/reports'), true);
});

void test('artifacts module maps missing root marker to BE_ROOT_NOT_FOUND', async () => {
  const { artifacts, errors } = createArtifactsForTest();

  await assert.rejects(
    () => artifacts.readRootMarker('/repo/missing'),
    (error: unknown) => {
      assert.equal(errors.isBacklogError(error), true);
      if (!errors.isBacklogError(error)) {
        return false;
      }
      assert.equal(error.code, 'BE_ROOT_NOT_FOUND');
      return true;
    },
  );
});

void test('writeInitialArtifacts leaves no discoverable backlog root when a later bootstrap write fails', async () => {
  const fixture = await createFixtureBundle();
  const stateContent = `${JSON.stringify(fixture.state, null, 2)}\n`;
  const statePath = '/repo/backlog/.backlog/state.json';
  const { fs, artifacts, errors } = createArtifactsForTest('/repo', {
    faults: [
      {
        op: 'rename',
        path: statePath,
        code: 'EACCES',
        once: true,
      },
    ],
  });

  await assert.rejects(
    () =>
      artifacts.writeInitialArtifacts({
        root: '/repo/backlog',
        marker: fixture.marker,
        agentsContent: '# backlog agents\n',
        sourceRegistry: fixture.sourceRegistry,
        appliedRegistry: fixture.appliedRegistry,
        state: fixture.state,
      }),
    (error: unknown) => {
      assert.equal(errors.isBacklogError(error), true);
      return true;
    },
  );

  assert.equal(await fs.exists('/repo/backlog/.backlog.json'), false);
  assert.equal(await fs.exists(statePath), false);
  assert.equal(await fs.exists(await computeTempSiblingPath(statePath, stateContent)), false);
});

void test('writeTextAtomically preserves backlog errors when temp cleanup also fails', async () => {
  const reportPath = '/repo/backlog/reports/backlog-report.md';
  const reportContent = '# backlog report\n';
  const tempPath = await computeTempSiblingPath(reportPath, reportContent);
  const { artifacts, errors } = createArtifactsForTest('/repo', {
    faults: [
      {
        op: 'rename',
        path: reportPath,
        code: 'EACCES',
        once: true,
      },
      {
        op: 'rm',
        path: tempPath,
        code: 'EACCES',
        once: true,
      },
    ],
  });

  await assert.rejects(
    () =>
      artifacts.writeReportFiles({
        root: '/repo/backlog',
        markdown: reportContent,
        mermaid: 'graph TD\n',
      }),
    (error: unknown) => {
      assert.equal(errors.isBacklogError(error), true);
      if (!errors.isBacklogError(error)) {
        return false;
      }
      assert.equal(error.code, 'BE_REPORT_WRITE_FAILED');
      return true;
    },
  );
});

void test('artifacts module rejects managed directory writes through symlinked layout paths', async (t) => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'backlog-engineer-artifacts-'));
  t.after(async () => {
    await rmNode(tempRoot, { recursive: true, force: true });
  });

  const backlogRoot = path.join(tempRoot, 'backlog');
  const escapedPacketsDir = path.join(tempRoot, 'escaped-packets');
  await mkdir(backlogRoot, { recursive: true });
  await mkdir(escapedPacketsDir, { recursive: true });
  await writeFile(path.join(backlogRoot, '.backlog.json'), '{"backlog_id":"x"}\n', 'utf8');
  await symlink(escapedPacketsDir, path.join(backlogRoot, 'packets'), 'dir');

  const errors = createErrorModule();
  const artifacts = createArtifactsModule({
    fs: createNodeFileSystemPort(),
    path: createNodePathPort(),
    hash: createNodeHashPort(),
    schemas: createSchemaModule(),
    errors,
  });

  await assert.rejects(
    () => artifacts.createBacklogDirectories(backlogRoot),
    (error: unknown) => {
      assert.equal(errors.isBacklogError(error), true);
      if (!errors.isBacklogError(error)) {
        return false;
      }
      assert.equal(error.code, 'BE_INTERNAL_STATE_CORRUPT');
      return true;
    },
  );
});

void test('artifacts module rejects backlog roots that pass through a symlinked ancestor', async (t) => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'backlog-engineer-root-symlink-'));
  t.after(async () => {
    await rmNode(tempRoot, { recursive: true, force: true });
  });

  const realParent = path.join(tempRoot, 'real-parent');
  const visibleLink = path.join(tempRoot, 'visible-link');
  await mkdir(realParent, { recursive: true });
  await symlink(realParent, visibleLink, 'dir');

  const errors = createErrorModule();
  const artifacts = createArtifactsModule({
    fs: createNodeFileSystemPort(),
    path: createNodePathPort(),
    hash: createNodeHashPort(),
    schemas: createSchemaModule(),
    errors,
  });

  await assert.rejects(
    () => artifacts.createBacklogDirectories(path.join(visibleLink, 'backlog')),
    (error: unknown) => {
      assert.equal(errors.isBacklogError(error), true);
      if (!errors.isBacklogError(error)) {
        return false;
      }
      assert.equal(error.code, 'BE_INTERNAL_STATE_CORRUPT');
      return true;
    },
  );
});

void test('artifacts module rejects template output into a symlinked directory target', async (t) => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'backlog-engineer-template-symlink-'));
  t.after(async () => {
    await rmNode(tempRoot, { recursive: true, force: true });
  });

  const realOut = path.join(tempRoot, 'real-out');
  const linkedOut = path.join(tempRoot, 'linked-out');
  await mkdir(realOut, { recursive: true });
  await symlink(realOut, linkedOut, 'dir');

  const errors = createErrorModule();
  const artifacts = createArtifactsModule({
    fs: createNodeFileSystemPort(),
    path: createNodePathPort(),
    hash: createNodeHashPort(),
    schemas: createSchemaModule(),
    errors,
  });

  await assert.rejects(
    () =>
      artifacts.writeTemplateOutput({
        cwd: tempRoot,
        out: './linked-out',
        defaultBasename: 'packet.template.json',
        content: '{"mode":"packet"}\n',
      }),
    (error: unknown) => {
      assert.equal(errors.isBacklogError(error), true);
      if (!errors.isBacklogError(error)) {
        return false;
      }
      assert.equal(error.code, 'BE_TEMPLATE_OUTPUT_INVALID');
      return true;
    },
  );
});

void test('artifacts module rejects symlinked canonical import targets even when content matches', async (t) => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'backlog-engineer-canonical-symlink-'));
  t.after(async () => {
    await rmNode(tempRoot, { recursive: true, force: true });
  });

  const backlogRoot = path.join(tempRoot, 'backlog');
  const escapedFile = path.join(tempRoot, 'escaped.packet.json');
  const packetText = await loadTextFixture(
    path.join(AUTHORED_DIR, 'packets', 'auth-module.packet.json'),
  );
  const packetHash = await createNodeHashPort().sha256Text(packetText);
  const canonicalName = `${packetHash.slice(0, 12)}--auth-module.packet.json`;

  await mkdir(path.join(backlogRoot, 'packets'), { recursive: true });
  await writeFile(path.join(backlogRoot, '.backlog.json'), '{"backlog_id":"x"}\n', 'utf8');
  await writeFile(escapedFile, packetText, 'utf8');
  await symlink(escapedFile, path.join(backlogRoot, 'packets', canonicalName), 'file');

  const errors = createErrorModule();
  const artifacts = createArtifactsModule({
    fs: createNodeFileSystemPort(),
    path: createNodePathPort(),
    hash: createNodeHashPort(),
    schemas: createSchemaModule(),
    errors,
  });

  await assert.rejects(
    () =>
      artifacts.importPacketFile({
        root: backlogRoot,
        packetId: '11111111-1111-4111-8111-111111111111',
        sourcePath: path.join(tempRoot, 'auth-module.packet.json'),
        canonicalBasename: 'auth-module.packet.json',
        rawContent: packetText,
      }),
    (error: unknown) => {
      assert.equal(errors.isBacklogError(error), true);
      if (!errors.isBacklogError(error)) {
        return false;
      }
      assert.equal(error.code, 'BE_CANONICAL_WRITE_FAILED');
      return true;
    },
  );
});
