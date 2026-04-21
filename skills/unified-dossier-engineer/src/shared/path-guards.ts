import { promises as fs } from 'node:fs';
import path from 'node:path';

function pathEscapes(base: string, target: string): boolean {
  const relative = path.relative(base, target);
  return relative.startsWith('..') || path.isAbsolute(relative);
}

export function assertPathInside(baseDir: string, targetPath: string, label: string): void {
  const absBase = path.resolve(baseDir);
  const absTarget = path.resolve(targetPath);
  if (pathEscapes(absBase, absTarget)) {
    throw new Error(`${label} must stay inside ${absBase}.`);
  }
}

export async function assertNoSymlinkAncestors(
  rootDir: string,
  targetPath: string,
  label: string,
): Promise<void> {
  const absRoot = path.resolve(rootDir);
  const absTarget = path.resolve(targetPath);
  assertPathInside(absRoot, absTarget, label);

  let current = absTarget;
  while (true) {
    try {
      const stat = await fs.lstat(current);
      if (stat.isSymbolicLink()) {
        throw new Error(`${label} cannot use symlinked path components: ${current}`);
      }
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== 'ENOENT') {
        throw error;
      }
    }

    if (current === absRoot) {
      return;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return;
    }
    current = parent;
  }
}

export async function assertManagedWritePath(
  rootDir: string,
  managedDir: string,
  targetPath: string,
  label: string,
): Promise<void> {
  const absManagedDir = path.resolve(managedDir);
  const absTarget = path.resolve(targetPath);
  assertPathInside(absManagedDir, absTarget, label);
  await assertNoSymlinkAncestors(rootDir, absTarget, label);
}

export async function assertManagedReadPath(
  rootDir: string,
  managedDir: string,
  targetPath: string,
  label: string,
): Promise<void> {
  const absManagedDir = path.resolve(managedDir);
  const absTarget = path.resolve(targetPath);
  assertPathInside(absManagedDir, absTarget, label);
  await assertNoSymlinkAncestors(rootDir, absTarget, label);
}

export function resolveManagedPath(
  rootDir: string,
  inputPath: string,
  managedDir: string,
  label: string,
): string {
  const absRoot = path.resolve(rootDir);
  const absTarget = path.resolve(absRoot, inputPath);
  assertPathInside(path.resolve(managedDir), absTarget, label);
  return absTarget;
}

export async function resolveManagedReadPath(
  rootDir: string,
  inputPath: string,
  managedDir: string,
  label: string,
): Promise<string> {
  const absTarget = resolveManagedPath(rootDir, inputPath, managedDir, label);
  await assertManagedReadPath(rootDir, managedDir, absTarget, label);
  return absTarget;
}
