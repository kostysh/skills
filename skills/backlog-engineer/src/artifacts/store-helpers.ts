import { ZodError } from 'zod';

import type { ErrorCode, ErrorModule } from '../errors/index.ts';
import type { AbsoluteFsPath, BacklogRootPath } from '../runtime/shared.ts';
import type { FileSystemPort, HashPort, PathPort } from '../runtime/ports.ts';
import { isPathInsideRoot } from '../runtime/path-safety.ts';

export function createJsonIssueDetails(error: ZodError): {
  issues: Array<{
    path: string;
    message: string;
    code: string;
  }>;
} {
  return {
    issues: error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    })),
  };
}

function isMissingFileError(error: unknown): boolean {
  return (
    error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT'
  );
}

function createTempSiblingPath(
  path: PathPort,
  targetPath: AbsoluteFsPath,
  seedHash: string,
): AbsoluteFsPath {
  return path.join(
    path.dirname(targetPath),
    `.${path.basename(targetPath)}.tmp-${seedHash.slice(0, 12)}`,
  );
}

function listPathChain(path: PathPort, target: AbsoluteFsPath): AbsoluteFsPath[] {
  const normalizedTarget = path.resolve(target);
  const chain: AbsoluteFsPath[] = [normalizedTarget];
  let cursor = path.dirname(normalizedTarget);

  while (cursor !== chain[chain.length - 1]) {
    chain.push(cursor);
    cursor = path.dirname(cursor);
  }

  return chain.reverse();
}

async function ensureDirectoryChainIsSafe(payload: {
  fs: FileSystemPort;
  path: PathPort;
  errors: ErrorModule;
  root: BacklogRootPath;
  leafDirectory: AbsoluteFsPath;
  errorCode: ErrorCode;
  detailPath: AbsoluteFsPath;
}): Promise<void> {
  const { fs, path, errors, root, leafDirectory, errorCode, detailPath } = payload;
  const normalizedRoot = path.resolve(root);
  const normalizedLeaf = path.resolve(leafDirectory);

  if (
    !isPathInsideRoot({
      path,
      root: normalizedRoot,
      target: normalizedLeaf,
    })
  ) {
    throw errors.create(errorCode, undefined, {
      details: {
        path: detailPath,
      },
    });
  }

  for (const candidate of listPathChain(path, normalizedLeaf)) {
    if (!(await fs.exists(candidate))) {
      continue;
    }

    const entry = await fs.lstat(candidate);
    if (entry.isSymbolicLink || !entry.isDirectory) {
      throw errors.create(errorCode, undefined, {
        details: {
          path: detailPath,
        },
      });
    }
  }
}

export async function ensureManagedDirectoryPathSafe(payload: {
  fs: FileSystemPort;
  path: PathPort;
  errors: ErrorModule;
  root: BacklogRootPath;
  directoryPath: AbsoluteFsPath;
  errorCode: ErrorCode;
}): Promise<void> {
  const { fs, path, errors, root, directoryPath, errorCode } = payload;
  const targetDirectory = path.resolve(directoryPath);
  await ensureDirectoryChainIsSafe({
    fs,
    path,
    errors,
    root,
    leafDirectory: targetDirectory,
    errorCode,
    detailPath: targetDirectory,
  });

  if (!(await fs.exists(targetDirectory))) {
    return;
  }

  const entry = await fs.lstat(targetDirectory);
  if (entry.isSymbolicLink || !entry.isDirectory) {
    throw errors.create(errorCode, undefined, {
      details: {
        path: targetDirectory,
      },
    });
  }
}

export async function ensureManagedFilePathSafe(payload: {
  fs: FileSystemPort;
  path: PathPort;
  errors: ErrorModule;
  root: BacklogRootPath;
  filePath: AbsoluteFsPath;
  errorCode: ErrorCode;
}): Promise<void> {
  const { fs, path, errors, root, filePath, errorCode } = payload;
  const targetFile = path.resolve(filePath);
  await ensureDirectoryChainIsSafe({
    fs,
    path,
    errors,
    root,
    leafDirectory: path.dirname(targetFile),
    errorCode,
    detailPath: targetFile,
  });

  if (!(await fs.exists(targetFile))) {
    return;
  }

  const entry = await fs.lstat(targetFile);
  if (entry.isSymbolicLink || entry.isDirectory) {
    throw errors.create(errorCode, undefined, {
      details: {
        path: targetFile,
      },
    });
  }
}

export async function ensureNoSymlinkAncestors(payload: {
  fs: FileSystemPort;
  path: PathPort;
  errors: ErrorModule;
  targetPath: AbsoluteFsPath;
  errorCode: ErrorCode;
}): Promise<void> {
  const { fs, path, errors, targetPath, errorCode } = payload;
  const normalizedTarget = path.resolve(targetPath);

  for (const candidate of listPathChain(path, normalizedTarget)) {
    if (!(await fs.exists(candidate))) {
      continue;
    }

    const entry = await fs.lstat(candidate);
    if (entry.isSymbolicLink) {
      throw errors.create(errorCode, undefined, {
        details: {
          path: normalizedTarget,
        },
      });
    }
  }
}

export async function readJsonArtifact<T>(payload: {
  fs: FileSystemPort;
  path?: PathPort;
  errors: ErrorModule;
  filePath: AbsoluteFsPath;
  parse: (raw: unknown) => T;
  root?: BacklogRootPath;
  readErrorCode?: ErrorCode;
  missingCode?: ErrorCode;
  corruptCode?: ErrorCode;
}): Promise<T> {
  const {
    fs,
    path,
    errors,
    filePath,
    parse,
    root,
    readErrorCode = 'BE_INTERNAL_STATE_CORRUPT',
    missingCode = 'BE_INTERNAL_STATE_CORRUPT',
    corruptCode = 'BE_INTERNAL_STATE_CORRUPT',
  } = payload;

  if (root && path) {
    await ensureManagedFilePathSafe({
      fs,
      path,
      errors,
      root,
      filePath,
      errorCode: readErrorCode,
    });
  }

  let rawText: string;
  try {
    rawText = await fs.readText(filePath);
  } catch (error) {
    if (isMissingFileError(error)) {
      throw errors.create(missingCode, undefined, {
        details: {
          path: filePath,
        },
        cause: error,
      });
    }

    throw errors.create(corruptCode, undefined, {
      details: {
        path: filePath,
      },
      cause: error,
    });
  }

  let rawJson: unknown;
  try {
    rawJson = JSON.parse(rawText) as unknown;
  } catch (error) {
    throw errors.create(corruptCode, undefined, {
      details: {
        path: filePath,
      },
      cause: error,
    });
  }

  try {
    return parse(rawJson);
  } catch (error) {
    if (error instanceof ZodError) {
      throw errors.create(corruptCode, undefined, {
        details: {
          path: filePath,
          ...createJsonIssueDetails(error),
        },
        cause: error,
      });
    }

    throw errors.create(corruptCode, undefined, {
      details: {
        path: filePath,
      },
      cause: error,
    });
  }
}

export async function writeTextAtomically(payload: {
  fs: FileSystemPort;
  path: PathPort;
  hash: HashPort;
  errors: ErrorModule;
  root?: BacklogRootPath;
  targetPath: AbsoluteFsPath;
  content: string;
  writeErrorCode: ErrorCode;
}): Promise<void> {
  const { fs, path, hash, errors, root, targetPath, content, writeErrorCode } = payload;
  const seedHash = await hash.sha256Text(`${targetPath}\n${content}`);
  const tempPath = createTempSiblingPath(path, targetPath, seedHash);

  if (root) {
    await ensureManagedFilePathSafe({
      fs,
      path,
      errors,
      root,
      filePath: targetPath,
      errorCode: writeErrorCode,
    });
  }

  try {
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.rm(tempPath, { force: true });
    await fs.writeText(tempPath, content);
    await fs.rename(tempPath, targetPath);
  } catch (error) {
    try {
      await fs.rm(tempPath, { force: true });
    } catch {
      // Ignore cleanup failures and preserve the original write failure for the caller.
    }
    throw errors.create(writeErrorCode, undefined, {
      details: {
        path: targetPath,
      },
      cause: error,
    });
  }
}

export async function writeJsonArtifact<T>(payload: {
  fs: FileSystemPort;
  path: PathPort;
  hash: HashPort;
  errors: ErrorModule;
  root: BacklogRootPath;
  filePath: AbsoluteFsPath;
  value: T;
  validate: (raw: unknown) => T;
  writeErrorCode: ErrorCode;
}): Promise<void> {
  const { fs, path, hash, errors, root, filePath, value, validate, writeErrorCode } = payload;

  let validatedValue: T;
  try {
    validatedValue = validate(value);
  } catch (error) {
    if (error instanceof ZodError) {
      throw errors.create('BE_SCHEMA_INVALID', undefined, {
        details: {
          path: filePath,
          ...createJsonIssueDetails(error),
        },
        cause: error,
      });
    }

    throw errors.create(writeErrorCode, undefined, {
      details: {
        path: filePath,
      },
      cause: error,
    });
  }

  const content = `${JSON.stringify(validatedValue, null, 2)}\n`;
  await writeTextAtomically({
    fs,
    path,
    hash,
    errors,
    root,
    targetPath: filePath,
    content,
    writeErrorCode,
  });
}
