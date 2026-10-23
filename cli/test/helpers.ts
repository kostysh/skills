import { mkdir, mkdtemp, readFile, realpath, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Catalog } from '../src/model.ts';
import { packSkills } from '../src/pack.ts';
export async function sandbox(): Promise<string> {
  return mkdtemp(join(await realpath(tmpdir()), 'kskills-test-'));
}
export async function release(
  root: string,
  version = '1.0.0',
  previous?: Catalog,
): Promise<{ catalog: Catalog; out: string }> {
  const source = join(root, `source-${version}`);
  const folder = join(source, 'example');
  await mkdir(join(folder, 'references'), { recursive: true });
  await mkdir(join(folder, 'assets'), { recursive: true });
  await mkdir(join(folder, 'docs'), { recursive: true });
  await writeFile(
    join(folder, 'SKILL.md'),
    `---\nname: example\ndescription: Example skill\nmetadata:\n  source-version: ${version}\n---\n# Example\n[method](references/method.md)\n\`assets/AGENTS.md\`\n`,
  );
  await writeFile(
    join(folder, 'references/method.md'),
    `Method ${version}\n[template](../assets/AGENTS.md)\n`,
  );
  await writeFile(join(folder, 'assets/AGENTS.md'), 'Working template\n');
  for (const file of ['docs/log.md', 'README.md', 'AGENTS.md', 'skill.yaml'])
    await writeFile(join(folder, file), 'not shipped\n');
  const out = join(root, `out-${version}`);
  return { catalog: await packSkills(source, out, `skills-${version}`, previous), out };
}
export function transport(catalog: Catalog, out: string): (url: string) => Promise<Buffer> {
  return async (url) => {
    const skill = catalog.skills.find((s) => s.url === url);
    if (!skill) throw new Error(`Unexpected URL ${url}`);
    return readFile(join(out, `${skill.name}-${skill.version}.tgz`));
  };
}
