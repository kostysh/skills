import path from 'node:path';

import type { FileSystemPort } from '../../src/runtime/ports.ts';
import type { AbsoluteFsPath } from '../../src/runtime/shared.ts';

type FileEntry = {
  kind: 'file';
  content: string;
  mtimeMs: number;
};

type DirectoryEntry = {
  kind: 'directory';
  mtimeMs: number;
};

type Entry = FileEntry | DirectoryEntry;

type FaultRule = {
  op: 'writeText' | 'writeTextExclusive' | 'rename' | 'rm' | 'mkdir';
  path?: AbsoluteFsPath;
  code: string;
  once?: boolean;
};

function createFsError(code: string, targetPath: string): NodeJS.ErrnoException {
  const error = new Error(`${code}: ${targetPath}`) as NodeJS.ErrnoException;
  error.code = code;
  error.path = targetPath;
  return error;
}

function cloneEntry(entry: Entry): Entry {
  return entry.kind === 'file' ? { ...entry } : { ...entry };
}

export function createInMemoryFileSystemPort(
  options: {
    cwd?: AbsoluteFsPath;
    faults?: FaultRule[];
    seed?: Array<
      | { path: AbsoluteFsPath; type: 'file'; content: string }
      | {
          path: AbsoluteFsPath;
          type: 'directory';
        }
    >;
  } = {},
): FileSystemPort {
  const posixPath = path.posix;
  let currentWorkingDirectory = options.cwd ?? '/workspace';
  const entries = new Map<AbsoluteFsPath, Entry>();
  const faults = [...(options.faults ?? [])];
  let currentMtime = 1;

  function normalize(targetPath: string): AbsoluteFsPath {
    return posixPath.resolve(targetPath);
  }

  function ensureDirectory(dirPath: AbsoluteFsPath): void {
    const normalized = normalize(dirPath);
    if (entries.has(normalized)) {
      const existing = entries.get(normalized);
      if (existing?.kind !== 'directory') {
        throw createFsError('ENOTDIR', normalized);
      }
      return;
    }

    const parent = posixPath.dirname(normalized);
    if (parent !== normalized) {
      ensureDirectory(parent);
    }

    entries.set(normalized, {
      kind: 'directory',
      mtimeMs: currentMtime++,
    });
  }

  function requireEntry(targetPath: AbsoluteFsPath): Entry {
    const entry = entries.get(normalize(targetPath));
    if (!entry) {
      throw createFsError('ENOENT', targetPath);
    }
    return entry;
  }

  function removeRecursively(targetPath: AbsoluteFsPath): void {
    const normalized = normalize(targetPath);
    for (const entryPath of [...entries.keys()]) {
      if (entryPath === normalized || entryPath.startsWith(`${normalized}/`)) {
        entries.delete(entryPath);
      }
    }
  }

  function maybeThrow(op: FaultRule['op'], targetPath: AbsoluteFsPath): void {
    const normalized = normalize(targetPath);
    const index = faults.findIndex((rule) => {
      if (rule.op !== op) {
        return false;
      }

      if (!rule.path) {
        return true;
      }

      return normalize(rule.path) === normalized;
    });

    if (index === -1) {
      return;
    }

    const rule = faults[index];
    if (rule?.once) {
      faults.splice(index, 1);
    }

    throw createFsError(rule?.code ?? 'EIO', normalized);
  }

  ensureDirectory('/');
  ensureDirectory(currentWorkingDirectory);

  for (const seedEntry of options.seed ?? []) {
    const normalized = normalize(seedEntry.path);
    if (seedEntry.type === 'directory') {
      ensureDirectory(normalized);
      continue;
    }

    ensureDirectory(posixPath.dirname(normalized));
    entries.set(normalized, {
      kind: 'file',
      content: seedEntry.content,
      mtimeMs: currentMtime++,
    });
  }

  return {
    readText(targetPath) {
      const entry = requireEntry(targetPath);
      if (entry.kind !== 'file') {
        throw createFsError('EISDIR', targetPath);
      }
      return Promise.resolve(entry.content);
    },
    readTextNoFollow(targetPath) {
      const entry = requireEntry(targetPath);
      if (entry.kind !== 'file') {
        throw createFsError('EISDIR', targetPath);
      }
      return Promise.resolve(entry.content);
    },
    writeText(targetPath, content) {
      const normalized = normalize(targetPath);
      maybeThrow('writeText', normalized);
      ensureDirectory(posixPath.dirname(normalized));
      entries.set(normalized, {
        kind: 'file',
        content,
        mtimeMs: currentMtime++,
      });
      return Promise.resolve();
    },
    writeTextExclusive(targetPath, content) {
      const normalized = normalize(targetPath);
      maybeThrow('writeTextExclusive', normalized);
      if (entries.has(normalized)) {
        throw createFsError('EEXIST', normalized);
      }
      ensureDirectory(posixPath.dirname(normalized));
      entries.set(normalized, {
        kind: 'file',
        content,
        mtimeMs: currentMtime++,
      });
      return Promise.resolve();
    },
    rename(fromPath, toPath) {
      const fromNormalized = normalize(fromPath);
      const toNormalized = normalize(toPath);
      maybeThrow('rename', toNormalized);
      const entry = requireEntry(fromNormalized);

      ensureDirectory(posixPath.dirname(toNormalized));
      entries.set(toNormalized, cloneEntry(entry));
      removeRecursively(fromNormalized);
      return Promise.resolve();
    },
    exists(targetPath) {
      return Promise.resolve(entries.has(normalize(targetPath)));
    },
    mkdir(targetPath, options) {
      const normalized = normalize(targetPath);
      maybeThrow('mkdir', normalized);
      if (options?.recursive) {
        ensureDirectory(normalized);
        return Promise.resolve();
      }

      const parent = posixPath.dirname(normalized);
      const parentEntry = entries.get(parent);
      if (!parentEntry || parentEntry.kind !== 'directory') {
        throw createFsError('ENOENT', parent);
      }

      if (entries.has(normalized)) {
        const existing = entries.get(normalized);
        if (existing?.kind === 'directory') {
          return Promise.resolve();
        }
        throw createFsError('EEXIST', normalized);
      }

      entries.set(normalized, {
        kind: 'directory',
        mtimeMs: currentMtime++,
      });
      return Promise.resolve();
    },
    readdir(targetPath) {
      const normalized = normalize(targetPath);
      const entry = requireEntry(normalized);
      if (entry.kind !== 'directory') {
        throw createFsError('ENOTDIR', normalized);
      }

      const childNames = new Set<string>();
      for (const entryPath of entries.keys()) {
        if (!entryPath.startsWith(`${normalized}/`)) {
          continue;
        }
        const rest = entryPath.slice(normalized.length + 1);
        if (rest.length === 0) {
          continue;
        }
        childNames.add(rest.split('/')[0] ?? rest);
      }

      return Promise.resolve([...childNames].sort((left, right) => left.localeCompare(right)));
    },
    rm(targetPath, options) {
      const normalized = normalize(targetPath);
      maybeThrow('rm', normalized);
      if (!entries.has(normalized)) {
        if (options?.force) {
          return Promise.resolve();
        }
        throw createFsError('ENOENT', normalized);
      }

      const entry = requireEntry(normalized);
      if (entry.kind === 'directory' && !options?.recursive) {
        const children = [...entries.keys()].filter(
          (entryPath) => entryPath.startsWith(`${normalized}/`) && entryPath !== normalized,
        );
        if (children.length > 0) {
          throw createFsError('ENOTEMPTY', normalized);
        }
      }

      removeRecursively(normalized);
      return Promise.resolve();
    },
    stat(targetPath) {
      const entry = requireEntry(targetPath);
      return Promise.resolve({
        isFile: entry.kind === 'file',
        isDirectory: entry.kind === 'directory',
        isSymbolicLink: false,
        size: entry.kind === 'file' ? entry.content.length : 0,
        mtimeMs: entry.mtimeMs,
      });
    },
    lstat(targetPath) {
      const entry = requireEntry(targetPath);
      return Promise.resolve({
        isFile: entry.kind === 'file',
        isDirectory: entry.kind === 'directory',
        isSymbolicLink: false,
        size: entry.kind === 'file' ? entry.content.length : 0,
        mtimeMs: entry.mtimeMs,
      });
    },
    realpath(targetPath) {
      return Promise.resolve(normalize(targetPath));
    },
    openDirectory(targetPath) {
      const normalized = normalize(targetPath);
      const entry = requireEntry(normalized);
      if (entry.kind !== 'directory') {
        throw createFsError('ENOTDIR', normalized);
      }
      return Promise.resolve({
        resolveEntry(name: string) {
          return normalize(posixPath.join(normalized, name));
        },
        close() {
          return Promise.resolve();
        },
      });
    },
    cwd() {
      return currentWorkingDirectory;
    },
    chdir(targetPath) {
      const normalized = normalize(targetPath);
      const entry = requireEntry(normalized);
      if (entry.kind !== 'directory') {
        throw createFsError('ENOTDIR', normalized);
      }
      currentWorkingDirectory = normalized;
    },
  };
}
