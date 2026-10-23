import { randomUUID } from 'node:crypto';
import { lstat, mkdir, readdir, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { sha256 } from './model.ts';

export async function exists(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}
export async function regularFiles(root: string, prefix = ''): Promise<string[]> {
  const info = await lstat(join(root, prefix));
  if (info.isSymbolicLink()) throw new Error(`Symbolic links are not allowed: ${prefix || root}`);
  if (info.isFile()) return [prefix];
  if (!info.isDirectory()) throw new Error(`Unsupported file type: ${prefix}`);
  const result: string[] = [];
  for (const name of (await readdir(join(root, prefix))).sort())
    result.push(...(await regularFiles(root, prefix ? `${prefix}/${name}` : name)));
  return result;
}
export async function fingerprint(root: string, files?: string[]): Promise<string> {
  const entries = [];
  for (const file of (files ?? (await regularFiles(root))).slice().sort()) {
    entries.push([file, sha256(await readFile(join(root, file)))]);
  }
  return sha256(JSON.stringify(entries));
}
export async function atomicJson(path: string, value: unknown): Promise<void> {
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
}
// Reject symlinked ancestors before creating a directory used for state or installation.
export async function directory(path: string): Promise<string> {
  const absolute = resolve(path);
  const parent = dirname(absolute);
  if (parent !== absolute) await directory(parent);
  if (!(await exists(absolute)))
    await mkdir(absolute).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'EEXIST') throw error;
    });
  const stat = await lstat(absolute);
  if (!stat.isDirectory() || stat.isSymbolicLink())
    throw new Error(`Expected a directory without symbolic links: ${absolute}`);
  return realpath(absolute);
}
