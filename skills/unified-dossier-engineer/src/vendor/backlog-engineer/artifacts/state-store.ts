import type { StateFile } from '../schemas/index.ts';
import type { BacklogRootPath } from '../runtime/shared.ts';
import type { ArtifactsModuleDependencies } from './shared.ts';
import { getStatePath } from './backlog-layout.ts';
import { ensureManagedFilePathSafe, readJsonArtifact, writeJsonArtifact } from './store-helpers.ts';

export async function readState(
  dependencies: ArtifactsModuleDependencies,
  root: BacklogRootPath,
): Promise<StateFile> {
  return readJsonArtifact({
    fs: dependencies.fs,
    path: dependencies.path,
    errors: dependencies.errors,
    root,
    filePath: getStatePath(dependencies.path, root),
    parse: (raw) => dependencies.schemas.parseStateFile(raw),
    readErrorCode: 'BE_INTERNAL_STATE_CORRUPT',
  });
}

export async function writeState(
  dependencies: ArtifactsModuleDependencies,
  root: BacklogRootPath,
  value: StateFile,
): Promise<void> {
  await writeJsonArtifact({
    fs: dependencies.fs,
    path: dependencies.path,
    hash: dependencies.hash,
    errors: dependencies.errors,
    root,
    filePath: getStatePath(dependencies.path, root),
    value,
    validate: (raw) => dependencies.schemas.parseStateFile(raw),
    writeErrorCode: 'BE_INTERNAL_STATE_CORRUPT',
  });
}

export async function stateExists(
  dependencies: ArtifactsModuleDependencies,
  root: BacklogRootPath,
): Promise<boolean> {
  const statePath = getStatePath(dependencies.path, root);
  await ensureManagedFilePathSafe({
    fs: dependencies.fs,
    path: dependencies.path,
    errors: dependencies.errors,
    root,
    filePath: statePath,
    errorCode: 'BE_INTERNAL_STATE_CORRUPT',
  });
  if (!(await dependencies.fs.exists(statePath))) {
    return false;
  }

  return (await dependencies.fs.lstat(statePath)).isFile;
}
