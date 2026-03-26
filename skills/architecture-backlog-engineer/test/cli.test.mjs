import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = path.resolve(TEST_DIR, '..');
const CLI_PATH = path.join(SKILL_DIR, 'scripts', 'architecture-backlog.mjs');

function runCli(args) {
  const result = spawnSync('node', [CLI_PATH, ...args], {
    cwd: SKILL_DIR,
    encoding: 'utf8',
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}

function createTempRunDir(t, name) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `${name}-`));
  t.after(() => {
    fs.rmSync(tempDir, { force: true, recursive: true });
  });
  return tempDir;
}

test('global help exposes unified commands and compatibility aliases', () => {
  const result = runCli(['--help']);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /init <run-dir>/);
  assert.match(result.stdout, /validate <run-dir>/);
  assert.match(result.stdout, /render <run-dir>/);
  assert.match(result.stdout, /init-discovery-run/);
  assert.equal(result.stderr, '');
});

test('legacy init alias still initializes a run and validate passes', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-init');

  const initResult = runCli(['init-discovery-run', runDir]);
  assert.equal(initResult.status, 0);
  assert.match(initResult.stdout, new RegExp(`Initialized discovery run at ${runDir}`));

  const validationResult = runCli(['validate', runDir]);
  assert.equal(validationResult.status, 0);
  assert.match(validationResult.stdout, /Validation status: pass/);

  const manifest = JSON.parse(fs.readFileSync(path.join(runDir, 'manifest.json'), 'utf8'));
  assert.equal(manifest.phase_state, 'validated');
});

test('render writes the disposable markdown projections', (t) => {
  const runDir = createTempRunDir(t, 'architecture-backlog-render');

  assert.equal(runCli(['init', runDir]).status, 0);
  assert.equal(runCli(['validate', runDir]).status, 0);

  const renderResult = runCli(['render', runDir]);
  assert.equal(renderResult.status, 0);
  assert.match(renderResult.stdout, /Rendered views into/);

  for (const fileName of ['feature-candidates.md', 'roadmap.md', 'gaps-and-validation.md']) {
    const filePath = path.join(runDir, 'views', fileName);
    assert.equal(fs.existsSync(filePath), true, `${fileName} should exist`);
  }

  const manifest = JSON.parse(fs.readFileSync(path.join(runDir, 'manifest.json'), 'utf8'));
  assert.equal(manifest.phase_state, 'rendered');
});

test('missing run-dir is reported as a usage error', () => {
  const result = runCli(['validate']);

  assert.equal(result.status, 2);
  assert.match(result.stderr, /validate requires exactly one <run-dir> argument/);
  assert.match(result.stderr, /Usage:/);
});
