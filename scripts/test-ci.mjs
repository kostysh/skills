#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const rootDir = process.cwd();
const skillsDir = path.join(rootDir, 'skills');

function hasTestScript(packageJsonPath) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return typeof packageJson?.scripts?.test === 'string' && packageJson.scripts.test.length > 0;
}

function findWorkspacePackagesWithTests() {
  if (!fs.existsSync(skillsDir)) {
    return [];
  }

  return fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(skillsDir, entry.name, 'package.json'))
    .filter((packageJsonPath) => fs.existsSync(packageJsonPath) && hasTestScript(packageJsonPath));
}

const packagesWithTests = findWorkspacePackagesWithTests();

if (packagesWithTests.length === 0) {
  console.log('No workspace test scripts found. Skipping test run.');
  process.exit(0);
}

const result = spawnSync(
  'pnpm',
  ['-r', '--filter', './skills/*', '--if-present', 'test'],
  {
    cwd: rootDir,
    stdio: 'inherit',
  },
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
