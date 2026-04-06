import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import { createNoOpRegistry, type HookRegistry } from '../hooks/index.ts';
import type { AbsoluteFsPath } from './shared.ts';

export interface FileSystemPort {
  readText(path: AbsoluteFsPath): Promise<string>;
  writeText(path: AbsoluteFsPath, content: string): Promise<void>;
  exists(path: AbsoluteFsPath): Promise<boolean>;
  mkdir(path: AbsoluteFsPath, options?: { recursive?: boolean }): Promise<void>;
  readdir(path: AbsoluteFsPath): Promise<string[]>;
  rm(path: AbsoluteFsPath, options?: { recursive?: boolean; force?: boolean }): Promise<void>;
  stat(path: AbsoluteFsPath): Promise<{
    isFile: boolean;
    isDirectory: boolean;
    size: number;
    mtimeMs: number;
  }>;
  cwd(): AbsoluteFsPath;
}

export interface PathPort {
  resolve(...parts: string[]): AbsoluteFsPath;
  dirname(path: AbsoluteFsPath): AbsoluteFsPath;
  basename(pathValue: string): string;
  relative(from: AbsoluteFsPath, to: AbsoluteFsPath): string;
  normalize(pathValue: string): string;
  join(...parts: string[]): string;
}

export interface ClockPort {
  nowIsoUtc(): string;
}

export interface UuidPort {
  create(): string;
}

export interface HashPort {
  sha256Text(text: string): Promise<string>;
}

export interface ProcessIoPort {
  writeStdout(text: string): Promise<void>;
  writeStderr(text: string): Promise<void>;
}

export interface RuntimeDependencies {
  fs: FileSystemPort;
  path: PathPort;
  clock: ClockPort;
  uuid: UuidPort;
  hash: HashPort;
  hooks: HookRegistry;
}

export function createNodeFileSystemPort(): FileSystemPort {
  return {
    async readText(filePath) {
      return fs.readFile(filePath, 'utf8');
    },
    async writeText(filePath, content) {
      await fs.writeFile(filePath, content, 'utf8');
    },
    async exists(filePath) {
      try {
        await fs.access(filePath);
        return true;
      } catch {
        return false;
      }
    },
    async mkdir(dirPath, options) {
      await fs.mkdir(dirPath, options);
    },
    async readdir(dirPath) {
      const entries = await fs.readdir(dirPath);
      return entries.sort((left, right) => left.localeCompare(right));
    },
    async rm(targetPath, options) {
      await fs.rm(targetPath, options);
    },
    async stat(targetPath) {
      const stat = await fs.stat(targetPath);
      return {
        isFile: stat.isFile(),
        isDirectory: stat.isDirectory(),
        size: stat.size,
        mtimeMs: stat.mtimeMs,
      };
    },
    cwd() {
      return path.resolve(process.cwd());
    },
  };
}

export function createNodePathPort(): PathPort {
  return {
    resolve(...parts) {
      return path.resolve(...parts);
    },
    dirname(pathValue) {
      return path.dirname(pathValue);
    },
    basename(pathValue) {
      return path.basename(pathValue);
    },
    relative(from, to) {
      return path.relative(from, to);
    },
    normalize(pathValue) {
      return path.normalize(pathValue);
    },
    join(...parts) {
      return path.join(...parts);
    },
  };
}

export function createNodeClockPort(): ClockPort {
  return {
    nowIsoUtc() {
      return new Date().toISOString();
    },
  };
}

export function createNodeUuidPort(): UuidPort {
  return {
    create() {
      return crypto.randomUUID();
    },
  };
}

export function createNodeHashPort(): HashPort {
  return {
    sha256Text(text) {
      return Promise.resolve(crypto.createHash('sha256').update(text).digest('hex'));
    },
  };
}

export function createNodeProcessIoPort(
  stdout: Pick<NodeJS.WriteStream, 'write'>,
  stderr: Pick<NodeJS.WriteStream, 'write'>,
): ProcessIoPort {
  return {
    writeStdout(text) {
      stdout.write(text);
      return Promise.resolve();
    },
    writeStderr(text) {
      stderr.write(text);
      return Promise.resolve();
    },
  };
}

export function createNodeRuntimeDependencies(
  overrides: Partial<RuntimeDependencies> = {},
): RuntimeDependencies {
  return {
    fs: overrides.fs ?? createNodeFileSystemPort(),
    path: overrides.path ?? createNodePathPort(),
    clock: overrides.clock ?? createNodeClockPort(),
    uuid: overrides.uuid ?? createNodeUuidPort(),
    hash: overrides.hash ?? createNodeHashPort(),
    hooks: overrides.hooks ?? createNoOpRegistry(),
  };
}
