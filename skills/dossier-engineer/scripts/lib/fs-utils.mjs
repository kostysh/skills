import { promises as fs } from 'node:fs';
import path from 'node:path';

export const readText = async (filePath) => fs.readFile(filePath, 'utf8');

export const writeTextAtomic = async (filePath, text) => {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const tempFile = `${filePath}.tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await fs.writeFile(tempFile, text, 'utf8');
  await fs.rename(tempFile, filePath);
};

export const writeJsonAtomic = async (filePath, value) =>
  writeTextAtomic(filePath, `${JSON.stringify(value, null, 2)}\n`);

export const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

export const ensureDir = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true });
};

export const isIgnoredDir = (name, { isRepoTopLevel = false } = {}) =>
  new Set(['.git', 'node_modules', 'dist', 'build', 'coverage', '.next', '.turbo', '.cache']).has(
    name,
  ) ||
  (isRepoTopLevel && new Set(['workspace', 'models', 'data']).has(name));

export const walk = async (dir, files = [], { includeFile, rootDir = dir } = {}) => {
  const resolvedRootDir = path.resolve(rootDir);
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const absPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const isRepoTopLevel = path.dirname(absPath) === resolvedRootDir;
      if (isIgnoredDir(entry.name, { isRepoTopLevel })) continue;
      await walk(absPath, files, { includeFile, rootDir: resolvedRootDir });
      continue;
    }

    if (entry.isFile()) {
      if (!includeFile || includeFile(absPath)) files.push(absPath);
    }
  }
  return files;
};
