import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { catalogSchema } from './model.ts';
import { latestCatalog, NoReleaseError } from './network.ts';
import { packSkills } from './pack.ts';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  strict: true,
  options: {
    root: { type: 'string' },
    out: { type: 'string' },
    release: { type: 'string' },
    previous: { type: 'string' },
    'previous-latest': { type: 'boolean' },
  },
});
if (
  positionals.length ||
  !values.out ||
  !values.release ||
  (values.previous && values['previous-latest'])
)
  throw new Error(
    'pack:skills --out <directory> --release skills-<version> [--root <skills>] [--previous <catalog.json> | --previous-latest]',
  );
const previous = values.previous
  ? catalogSchema.parse(JSON.parse(await readFile(values.previous, 'utf8')))
  : values['previous-latest']
    ? await latestCatalog().catch((error: unknown) => {
        if (error instanceof NoReleaseError) return undefined;
        throw error;
      })
    : undefined;
const catalog = await packSkills(
  resolve(values.root ?? '../skills'),
  resolve(values.out),
  values.release,
  previous,
);
console.log(`Skills packed: ${catalog.skills.length}; output: ${resolve(values.out)}`);
