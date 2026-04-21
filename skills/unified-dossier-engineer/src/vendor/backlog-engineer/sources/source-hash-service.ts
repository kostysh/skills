import type { ErrorModule } from '../errors/index.ts';
import type { NormalizedFsPath } from '../schemas/index.ts';
import type { FileSystemPort, HashPort, PathPort } from '../runtime/ports.ts';
import { ensureNoSymlinkAncestors } from '../artifacts/store-helpers.ts';

const MAX_SOURCE_FILE_BYTES = 10 * 1024 * 1024;

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

function isMissingFileError(error: unknown): boolean {
  return isErrnoException(error) && error.code === 'ENOENT';
}

export async function hashSourceFile(payload: {
  fs: FileSystemPort;
  path: PathPort;
  hash: HashPort;
  errors: ErrorModule;
  filePath: NormalizedFsPath;
}): Promise<string> {
  try {
    await ensureNoSymlinkAncestors({
      fs: payload.fs,
      path: payload.path,
      errors: payload.errors,
      targetPath: payload.filePath,
      errorCode: 'BE_SOURCE_READ_FAILED',
    });
  } catch (error) {
    if (isMissingFileError(error)) {
      throw payload.errors.create('BE_SOURCE_FILE_MISSING', undefined, {
        details: {
          path: payload.filePath,
        },
        cause: error,
      });
    }

    throw error;
  }

  let entry: Awaited<ReturnType<FileSystemPort['lstat']>>;
  try {
    entry = await payload.fs.lstat(payload.filePath);
  } catch (error) {
    if (isMissingFileError(error)) {
      throw payload.errors.create('BE_SOURCE_FILE_MISSING', undefined, {
        details: {
          path: payload.filePath,
        },
        cause: error,
      });
    }

    throw payload.errors.create('BE_SOURCE_READ_FAILED', undefined, {
      details: {
        path: payload.filePath,
        reason: 'lstat_failed',
      },
      cause: error,
    });
  }

  if (entry.isSymbolicLink) {
    throw payload.errors.create('BE_SOURCE_READ_FAILED', undefined, {
      details: {
        path: payload.filePath,
        reason: 'symbolic_link',
      },
    });
  }

  if (!entry.isFile) {
    throw payload.errors.create('BE_SOURCE_READ_FAILED', undefined, {
      details: {
        path: payload.filePath,
        reason: 'not_regular_file',
      },
    });
  }

  if (entry.size > MAX_SOURCE_FILE_BYTES) {
    throw payload.errors.create('BE_SOURCE_READ_FAILED', undefined, {
      details: {
        path: payload.filePath,
        reason: 'file_too_large',
        max_bytes: MAX_SOURCE_FILE_BYTES,
        actual_bytes: entry.size,
      },
    });
  }

  let content: string;
  try {
    content = await payload.fs.readText(payload.filePath);
  } catch (error) {
    if (isMissingFileError(error)) {
      throw payload.errors.create('BE_SOURCE_FILE_MISSING', undefined, {
        details: {
          path: payload.filePath,
        },
        cause: error,
      });
    }

    throw payload.errors.create('BE_SOURCE_READ_FAILED', undefined, {
      details: {
        path: payload.filePath,
        reason: 'read_failed',
      },
      cause: error,
    });
  }

  try {
    return await payload.hash.sha256Text(content);
  } catch (error) {
    throw payload.errors.create('BE_SOURCE_READ_FAILED', undefined, {
      details: {
        path: payload.filePath,
        reason: 'hash_failed',
      },
      cause: error,
    });
  }
}
