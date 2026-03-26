#!/usr/bin/env node
/**
 * index-refresh.mjs
 *
 * Canonical single-writer refresh for docs/ssot/index.md.
 * Runs sync-index first, then lint-dossiers with --update-index.
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const passThrough = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    passThrough.push(arg);
    if (arg.startsWith('--')) {
      const value = args[index + 1];
      if (value && !value.startsWith('--')) {
        passThrough.push(value);
        index += 1;
      }
    }
  }
  return { passThrough };
};

const runScript = (scriptName, args) => {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const result = spawnSync(process.execPath, [path.join(scriptDir, scriptName), ...args], {
    stdio: 'inherit',
  });
  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status);
  }
  if (result.error) throw result.error;
};

const main = async () => {
  const { passThrough } = parseArgs();
  runScript('sync-index.mjs', passThrough);
  runScript('lint-dossiers.mjs', [...passThrough, '--update-index']);
};

main().catch((error) => {
  console.error('[index-refresh] FATAL:', error?.stack ?? String(error));
  process.exit(1);
});
