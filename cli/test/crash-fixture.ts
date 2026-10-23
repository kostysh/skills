// Test-only abrupt exit after replacing files but before committing the config.
import fsp from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { join } from 'node:path';
import { Installer } from '../src/installer.ts';
import type { Catalog } from '../src/model.ts';
import { transport } from './helpers.ts';

const root = process.argv[2];
if (!root) throw new Error('Missing test directory');
const catalog = JSON.parse(
  await fsp.readFile(join(root, 'out-2.0.0/catalog.json'), 'utf8'),
) as Catalog;
const installer = new Installer(join(root, 'home'), transport(catalog, join(root, 'out-2.0.0')));
const rename = fsp.rename;
fsp.rename = async (from, to) => {
  if (to === installer.file) process.exit(99);
  return rename(from, to);
};
syncBuiltinESMExports();
await installer.update(catalog);
