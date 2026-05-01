import { createHash, randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

import YAML from 'yaml';

import {
  ARTIFACT_DIRS,
  DOSSIER_DIR,
  type Artifact,
  type ArtifactType,
  SCHEMA_VERSION,
} from './domain.ts';
import { RootNotFoundError } from './errors.ts';

export const defaultContext = (cwd: string) => ({
  cwd,
  now: () => new Date(),
  randomHex: (bytes: number) => randomBytes(bytes).toString('hex'),
});

export interface DossierWriteLockMetadata {
  readonly pid: number;
  readonly command: string;
  readonly acquired_at: string;
}

export interface DossierWriteLockConflict {
  readonly lockPath: string;
  readonly holder: DossierWriteLockMetadata | null;
  readonly ageSeconds: number | null;
}

export class DossierWriteLockConflictError extends Error {
  public readonly conflict: DossierWriteLockConflict;

  public constructor(conflict: DossierWriteLockConflict) {
    super(`Dossier write lock is held: ${conflict.lockPath}`);
    this.name = 'DossierWriteLockConflictError';
    this.conflict = conflict;
  }
}

export interface DossierWriteLockOptions {
  readonly writeMetadata?: (lockPath: string, metadata: DossierWriteLockMetadata) => Promise<void>;
}

export const toPosix = (value: string): string => value.split(path.sep).join('/');

export const relativeToRoot = (root: string, absolutePath: string): string =>
  toPosix(path.relative(root, absolutePath));

export const isUrlLike = (value: string): boolean => /^[a-z][a-z0-9+.-]*:\/\//i.test(value);

export const dossierPath = (root: string, ...parts: string[]): string =>
  path.join(root, DOSSIER_DIR, ...parts);

export const runtimeDirPath = (root: string): string => path.join(root, '.dossier-runtime');

export const dossierWriteLockPath = (root: string): string =>
  path.join(runtimeDirPath(root), 'write.lock');

export const ensureRuntimeDirectoryIgnored = async (root: string): Promise<boolean> => {
  const gitignorePath = path.join(root, '.gitignore');
  const entry = '.dossier-runtime/';
  const note = '# Dossier-engineer ephemeral runtime locks';
  if (!existsSync(gitignorePath)) {
    await writeFile(gitignorePath, `${note}\n${entry}\n`, 'utf8');
    return true;
  }
  const current = await readFile(gitignorePath, 'utf8');
  const lines = current
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'));
  if (lines.includes(entry) || lines.includes('**/.dossier-runtime/')) {
    return false;
  }
  const separator = current.endsWith('\n') ? '\n' : '\n\n';
  await writeFile(gitignorePath, `${current}${separator}${note}\n${entry}\n`, 'utf8');
  return true;
};

const readLockMetadata = async (lockPath: string): Promise<DossierWriteLockMetadata | null> => {
  try {
    const raw = await readFile(path.join(lockPath, 'holder.json'), 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const record = parsed as Record<string, unknown>;
    if (
      typeof record.pid !== 'number' ||
      typeof record.command !== 'string' ||
      typeof record.acquired_at !== 'string'
    ) {
      return null;
    }
    return {
      pid: record.pid,
      command: record.command,
      acquired_at: record.acquired_at,
    };
  } catch {
    return null;
  }
};

export const acquireDossierWriteLock = async (
  root: string,
  command: string,
  now: Date,
  options: DossierWriteLockOptions = {},
): Promise<() => Promise<void>> => {
  const runtimeDir = runtimeDirPath(root);
  const lockPath = dossierWriteLockPath(root);
  await mkdir(runtimeDir, { recursive: true });
  try {
    await mkdir(lockPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
    const [holder, details] = await Promise.all([
      readLockMetadata(lockPath),
      stat(lockPath).catch(() => null),
    ]);
    const ageSeconds =
      details === null ? null : Math.max(0, Math.round((now.getTime() - details.mtimeMs) / 1000));
    throw new DossierWriteLockConflictError({ lockPath, holder, ageSeconds });
  }

  const metadata = {
    pid: process.pid,
    command,
    acquired_at: now.toISOString(),
  } satisfies DossierWriteLockMetadata;

  try {
    if (options.writeMetadata !== undefined) {
      await options.writeMetadata(lockPath, metadata);
    } else {
      await writeFile(
        path.join(lockPath, 'holder.json'),
        JSON.stringify(metadata, null, 2),
        'utf8',
      );
    }
  } catch (error) {
    await rm(lockPath, { recursive: true, force: true });
    throw error;
  }

  return async () => {
    await rm(lockPath, { recursive: true, force: true });
  };
};

export const discoverRoot = (
  cwd: string,
  suppliedRoot: string | undefined,
  command: string,
): string => {
  if (suppliedRoot !== undefined) {
    const resolved = path.resolve(cwd, suppliedRoot);
    if (!existsSync(resolved)) {
      throw new RootNotFoundError(`Root does not exist: ${suppliedRoot}`);
    }
    return resolved;
  }

  let current = cwd;
  while (true) {
    if (existsSync(dossierPath(current, 'project.md'))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  if (command === 'init') {
    current = cwd;
    while (true) {
      if (existsSync(path.join(current, '.git'))) {
        return current;
      }
      const parent = path.dirname(current);
      if (parent === current) {
        break;
      }
      current = parent;
    }
    return cwd;
  }

  throw new RootNotFoundError(
    'Dossier root not found. Run `dossier-engineer init --root <path> --project-name "<name>"`.',
  );
};

export const ensureDossierDirs = async (root: string): Promise<void> => {
  await mkdir(dossierPath(root), { recursive: true });
  await Promise.all(ARTIFACT_DIRS.map((dir) => mkdir(dossierPath(root, dir), { recursive: true })));
};

export const parseMarkdownArtifact = (
  content: string,
): { frontmatter: Record<string, unknown>; body: string } => {
  if (!content.startsWith('---\n')) {
    throw new Error('Missing YAML frontmatter.');
  }
  const closeIndex = content.indexOf('\n---', 4);
  if (closeIndex === -1) {
    throw new Error('Unclosed YAML frontmatter.');
  }
  const rawYaml = content.slice(4, closeIndex);
  const bodyStart = content.indexOf('\n', closeIndex + 4);
  const body = bodyStart === -1 ? '' : content.slice(bodyStart + 1);
  const parsed = YAML.parse(rawYaml) as unknown;
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('YAML frontmatter must be a mapping.');
  }
  return { frontmatter: parsed as Record<string, unknown>, body };
};

export const stringifyMarkdownArtifact = (
  frontmatter: Record<string, unknown>,
  body: string,
): string =>
  `---\n${YAML.stringify(frontmatter, { lineWidth: 0 })}---\n${body.startsWith('\n') ? body.slice(1) : body}`;

export const readArtifactFile = async (root: string, relativePath: string): Promise<Artifact> => {
  const absolutePath = path.resolve(root, relativePath);
  const content = await readFile(absolutePath, 'utf8');
  const parsed = parseMarkdownArtifact(content);
  return {
    path: toPosix(relativePath),
    frontmatter: parsed.frontmatter,
    body: parsed.body,
  };
};

export const writeArtifactFile = async (
  root: string,
  relativePath: string,
  frontmatter: Record<string, unknown>,
  body: string,
): Promise<void> => {
  const absolutePath = path.resolve(root, relativePath);
  const parentDir = path.dirname(absolutePath);
  await mkdir(parentDir, { recursive: true });
  const tempPath = path.join(
    parentDir,
    `.${path.basename(absolutePath)}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`,
  );
  try {
    await writeFile(tempPath, stringifyMarkdownArtifact(frontmatter, body), 'utf8');
    await rename(tempPath, absolutePath);
  } catch (error) {
    await rm(tempPath, { force: true });
    throw error;
  }
};

export const listFilesRecursive = async (dir: string): Promise<string[]> => {
  if (!existsSync(dir)) {
    return [];
  }
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return listFilesRecursive(entryPath);
      }
      return [entryPath];
    }),
  );
  return nested.flat();
};

const artifactTypeFromRelativePath = (relativePath: string): ArtifactType | null => {
  if (relativePath === 'docs/dossier/project.md') {
    return 'dossier_project';
  }
  if (/^docs\/dossier\/sources\/SRC-.*\.md$/.test(relativePath)) return 'source';
  if (/^docs\/dossier\/capabilities\/CAP-.*\.md$/.test(relativePath)) return 'capability';
  if (/^docs\/dossier\/baselines\/BASE-.*\.md$/.test(relativePath)) return 'baseline';
  if (/^docs\/dossier\/guardrails\/KILL-.*\.md$/.test(relativePath)) return 'guardrail';
  if (/^docs\/dossier\/work-items\/WI-.*\.md$/.test(relativePath)) return 'work_item';
  if (/^docs\/dossier\/source-reviews\/SR-.*\.md$/.test(relativePath)) return 'source_review';
  if (/^docs\/dossier\/stages\/WI-.*\/STG-.*\.md$/.test(relativePath)) return 'stage_event';
  if (/^docs\/dossier\/verification\/WI-.*\/VER-.*\.md$/.test(relativePath)) return 'verification';
  if (/^docs\/dossier\/reviews\/WI-.*\/REV-.*\.md$/.test(relativePath)) return 'review';
  if (/^docs\/dossier\/hygiene\/WI-.*\/HYG-.*\.md$/.test(relativePath)) return 'hygiene';
  if (/^docs\/dossier\/changesets\/CS-.*\.md$/.test(relativePath)) return 'changeset';
  if (/^docs\/dossier\/retro\/RETRO-.*\.md$/.test(relativePath)) return 'retrospective_report';
  if (/^docs\/dossier\/reports\/.*\.md$/.test(relativePath)) return 'report';
  return null;
};

export const loadArtifacts = async (
  root: string,
): Promise<{ artifacts: Artifact[]; parseErrors: string[] }> => {
  const files = await listFilesRecursive(dossierPath(root));
  const artifacts: Artifact[] = [];
  const parseErrors: string[] = [];

  for (const file of files.filter((entry) => entry.endsWith('.md'))) {
    const relativePath = relativeToRoot(root, file);
    try {
      const artifact = await readArtifactFile(root, relativePath);
      artifacts.push(artifact);
    } catch (error) {
      parseErrors.push(
        `${relativePath}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return { artifacts, parseErrors };
};

export const findArtifactById = (
  artifacts: readonly Artifact[],
  id: string,
): Artifact | undefined =>
  artifacts.find(
    (artifact) => artifact.frontmatter.id === id || artifact.frontmatter.project_id === id,
  );

export const findArtifactsByType = (
  artifacts: readonly Artifact[],
  type: ArtifactType,
): Artifact[] => artifacts.filter((artifact) => artifact.frontmatter.artifact_type === type);

export const expectedArtifactType = (relativePath: string): ArtifactType | null =>
  artifactTypeFromRelativePath(relativePath);

export const hashFile = async (absolutePath: string): Promise<string> => {
  const content = await readFile(absolutePath);
  return createHash('sha256').update(content).digest('hex');
};

export const hashObject = (value: unknown): string => {
  const normalize = (input: unknown): unknown => {
    if (Array.isArray(input)) {
      return input.map(normalize);
    }
    if (input !== null && typeof input === 'object') {
      return Object.fromEntries(
        Object.entries(input as Record<string, unknown>)
          .filter(
            ([key]) => !['created_at', 'updated_at', 'registered_at', 'changed_at'].includes(key),
          )
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, nested]) => [key, normalize(nested)]),
      );
    }
    return input;
  };
  return createHash('sha256')
    .update(JSON.stringify(normalize(value)))
    .digest('hex');
};

export const slugify = (value: string): string => {
  const normalized = value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
  return normalized.length > 0 ? normalized : 'item';
};

export const makeId = (
  root: string,
  prefix: string,
  title: string,
  randomHex: (bytes: number) => string,
  relativePathForId: (id: string) => string,
  now = new Date(),
): string => {
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const slug = slugify(title);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const id = `${prefix}-${date}-${slug}-${randomHex(3)}`;
    if (!existsSync(path.resolve(root, relativePathForId(id)))) {
      return id;
    }
  }
  throw new Error(`Unable to generate unique ${prefix} id.`);
};

export const localPathExists = async (absolutePath: string): Promise<boolean> => {
  try {
    await stat(absolutePath);
    return true;
  } catch {
    return false;
  }
};

export const newArtifactFrontmatter = (
  artifact_type: ArtifactType,
  id: string,
  title: string,
  now: string,
): Record<string, unknown> => ({
  artifact_type,
  schema_version: SCHEMA_VERSION,
  id,
  title,
  created_at: now,
  updated_at: now,
});
