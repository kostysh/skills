import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function readText(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf8');
}

export async function writeTextAtomic(filePath: string, text: string): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const tempFile = `${filePath}.tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await fs.writeFile(tempFile, text, 'utf8');
  await fs.rename(tempFile, filePath);
}

export async function writeJsonAtomic(filePath: string, value: unknown): Promise<void> {
  await writeTextAtomic(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export function isIgnoredDir(name: string, { isRepoTopLevel = false } = {}): boolean {
  return (
    new Set(['.git', 'node_modules', 'dist', 'build', 'coverage', '.next', '.turbo', '.cache']).has(
      name,
    ) ||
    (isRepoTopLevel && new Set(['workspace', 'models', 'data']).has(name))
  );
}

export async function walk(
  dir: string,
  files: string[] = [],
  {
    includeFile,
    rootDir = dir,
  }: { includeFile?: (filePath: string) => boolean; rootDir?: string } = {},
): Promise<string[]> {
  const resolvedRootDir = path.resolve(rootDir);
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const absPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const isRepoTopLevel = path.dirname(absPath) === resolvedRootDir;
      if (isIgnoredDir(entry.name, { isRepoTopLevel })) {
        continue;
      }
      await walk(
        absPath,
        files,
        includeFile ? { includeFile, rootDir: resolvedRootDir } : { rootDir: resolvedRootDir },
      );
      continue;
    }

    if (entry.isFile()) {
      if (!includeFile || includeFile(absPath)) {
        files.push(absPath);
      }
    }
  }
  return files;
}
