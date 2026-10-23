import { lstat, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import * as tar from 'tar';
import { parse } from 'yaml';
import { z } from 'zod';
import { fingerprint, regularFiles } from './files.ts';
import type { Catalog, Skill } from './model.ts';
import {
  catalogSchema,
  nameSchema,
  repository,
  safeRelative,
  sha256,
  versionSchema,
} from './model.ts';

const frontmatterSchema = z.object({
  name: nameSchema,
  description: z.string().min(1),
  metadata: z.object({ 'source-version': versionSchema }),
});
const developmentName = /^(?:README|AGENTS|CHANGELOG|CONTRIBUTING|AGENTS\.override)(?:\..*)?$/i;
function shippable(file: string): boolean {
  const parts = file.split('/');
  if (parts.some((part) => ['docs', 'node_modules', '.git'].includes(part))) return false;
  return parts[0] === 'assets' || !developmentName.test(parts.at(-1) ?? '');
}
// Resource declarations use Markdown links, literal code spans and shell commands.
// Only an explicit example prefix scopes out a prose code span. Shell commands
// are checked even in examples; non-shell source examples are not instructions.
const illustrative = /^\s*(?:for example\b|a concrete rule like\b|например\b)/i;
function* literalResources(text: string): Generator<string> {
  for (const match of text.matchAll(
    /(?:^|[\s="'`(])((?:(?:\.\.?\/)+)?(?:references|assets|scripts|agents)\/[^\s"'`;|&()]+)/g,
  )) {
    const path = match[1];
    if (path && !/[<>*$?{}]/.test(path) && !path.endsWith('/')) yield path;
  }
}
async function checkLinks(root: string, files: string[]): Promise<void> {
  const included = new Set(files);
  for (const file of files.filter(
    (f) => f === 'SKILL.md' || (f.startsWith('references/') && f.endsWith('.md')),
  )) {
    const fullText = await readFile(join(root, file), 'utf8');
    const fences = /(`{3,}|~{3,})([^\n]*)\n([\s\S]*?)\1/g;
    const prose = fullText.replace(fences, '');
    const resources = new Set<string>();
    for (const match of prose.matchAll(/\]\(<?([^\s)>]+)>?(?:\s+"[^"]*")?\)/g)) {
      const link = match[1];
      if (!link || /^(?:[a-z]+:|#|\/)/i.test(link)) continue;
      const target = decodeURIComponent(link.split('#')[0] ?? '');
      if (!target) continue;
      const rel = relative(root, resolve(dirname(join(root, file)), target))
        .split(sep)
        .join('/');
      if (rel.split('/').includes('docs')) continue;
      safeRelative(rel);
      if (!included.has(rel) && !files.some((f) => f.startsWith(`${rel}/`)))
        throw new Error(`${file}: missing runtime link ${target}`);
    }
    for (const match of prose.matchAll(/`([^`]+)`/g)) {
      const clause =
        prose
          .slice(0, match.index)
          .split(/[\n;]|\.\s/)
          .at(-1) ?? '';
      if (illustrative.test(clause)) continue;
      for (const resource of literalResources(match[1] ?? '')) resources.add(resource);
    }
    for (const match of fullText.matchAll(fences)) {
      const language = match[2]?.trim().toLowerCase() ?? '';
      if (!/^(?:sh|bash|shell|console|zsh|powershell|ps1|cmd|text)?$/.test(language)) continue;
      for (const line of (match[3] ?? '').split('\n')) {
        if (line.trimStart().startsWith('#')) continue;
        for (const resource of literalResources(line)) resources.add(resource);
      }
    }
    for (const resource of resources) {
      // Bare and ./ paths are skill-root relative; ../ paths are document-relative,
      // as with Markdown links in a reference. Normalize before membership checks.
      const base = resource.startsWith('../') ? dirname(join(root, file)) : root;
      const normalized = relative(root, resolve(base, resource)).split(sep).join('/');
      safeRelative(normalized);
      if (!included.has(normalized) && !files.some((f) => f.startsWith(`${normalized}/`)))
        throw new Error(`${file}: missing resource ${resource}`);
    }
  }
}
export async function packSkills(
  root: string,
  output: string,
  release: string,
  previous?: Catalog,
): Promise<Catalog> {
  if (!/^skills-[a-zA-Z0-9._-]+$/.test(release))
    throw new Error('Release tag must start with skills-.');
  await mkdir(output, { recursive: true });
  if ((await readdir(output)).length) throw new Error('Release directory must be empty.');
  const skills: Skill[] = [];
  const history = new Map((previous?.versions ?? []).map((s) => [`${s.name}@${s.version}`, s]));
  for (const skill of previous?.skills ?? []) history.set(`${skill.name}@${skill.version}`, skill);
  for (const name of (await readdir(root)).sort()) {
    const folder = join(root, name);
    if (!(await lstat(folder)).isDirectory()) continue;
    const text = await readFile(join(folder, 'SKILL.md'), 'utf8');
    const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
    if (!match?.[1]) throw new Error(`${name}: missing frontmatter.`);
    const meta = frontmatterSchema.parse(parse(match[1]));
    if (meta.name !== name) throw new Error(`${name}: name does not match SKILL.md.`);
    const files = ['SKILL.md'];
    for (const dir of ['references', 'assets', 'scripts', 'agents']) {
      const entry = join(folder, dir);
      try {
        await lstat(entry);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue;
        throw error;
      }
      files.push(...(await regularFiles(folder, dir)));
    }
    const selected = files.filter(shippable).sort();
    selected.forEach(safeRelative);
    await checkLinks(folder, selected);
    const contentHash = await fingerprint(folder, selected);
    const key = `${name}@${meta.metadata['source-version']}`;
    if (history.has(key) && history.get(key)?.contentHash !== contentHash)
      throw new Error(`${key}: contents changed without a version bump.`);
    const archiveName = `${name}-${meta.metadata['source-version']}.tgz`;
    await tar.c(
      {
        cwd: folder,
        file: join(output, archiveName),
        gzip: true,
        portable: true,
        noMtime: true,
        noDirRecurse: true,
      },
      selected,
    );
    const skill = {
      name,
      description: meta.description,
      version: meta.metadata['source-version'],
      contentHash,
      url: `https://github.com/${repository}/releases/download/${release}/${archiveName}`,
      sha256: sha256(await readFile(join(output, archiveName))),
    };
    skills.push(skill);
    history.set(key, { name, version: skill.version, contentHash });
  }
  if (!skills.length) throw new Error('No skills found.');
  const catalog = catalogSchema.parse({
    schemaVersion: 1,
    release,
    skills,
    versions: [...history.values()].map(({ name, version, contentHash }) => ({
      name,
      version,
      contentHash,
    })),
  });
  await writeFile(join(output, 'catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`, {
    flag: 'wx',
  });
  return catalog;
}
