import type { ErrorModule } from '../errors/index.ts';
import { openManagedParentDirectory } from '../artifacts/store-helpers.ts';
import { getMutationLockPath } from '../artifacts/backlog-layout.ts';
import type { FileSystemPort, PathPort } from './ports.ts';
import type { AbsoluteFsPath, BacklogRootPath, CommandName } from './shared.ts';

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

export async function acquireMutationLock(payload: {
  fs: FileSystemPort;
  path: PathPort;
  errors: ErrorModule;
  backlogRoot: BacklogRootPath;
  command: CommandName;
  cwd: AbsoluteFsPath;
  acquiredAt: string;
}): Promise<() => Promise<void>> {
  const lockPath = getMutationLockPath(payload.path, payload.backlogRoot);

  const parentDirectory = await openManagedParentDirectory({
    fs: payload.fs,
    path: payload.path,
    errors: payload.errors,
    root: payload.backlogRoot,
    filePath: lockPath,
    errorCode: 'BE_INTERNAL_STATE_CORRUPT',
  });
  const stableLockPath = parentDirectory.resolveEntry(payload.path.basename(lockPath));

  const content = `${JSON.stringify(
    {
      command: payload.command,
      cwd: payload.cwd,
      acquired_at: payload.acquiredAt,
    },
    null,
    2,
  )}\n`;

  try {
    await payload.fs.writeTextExclusive(stableLockPath, content);
  } catch (error) {
    await parentDirectory.close().catch(() => undefined);
    if (isErrnoException(error) && error.code === 'EEXIST') {
      throw payload.errors.create('BE_MUTATION_LOCKED', undefined, {
        details: {
          backlog_root: payload.backlogRoot,
          lock_path: lockPath,
        },
        cause: error,
      });
    }

    throw payload.errors.create('BE_INTERNAL_STATE_CORRUPT', undefined, {
      details: {
        path: stableLockPath,
      },
      cause: error,
    });
  }

  return async () => {
    try {
      await payload.fs.rm(stableLockPath, { force: true });
    } catch (error) {
      if (isErrnoException(error) && error.code === 'ENOENT') {
        await parentDirectory.close().catch(() => undefined);
        return;
      }

      await parentDirectory.close().catch(() => undefined);
      throw payload.errors.create('BE_INTERNAL_STATE_CORRUPT', undefined, {
        details: {
          path: stableLockPath,
        },
        cause: error,
      });
    }
    await parentDirectory.close();
  };
}
