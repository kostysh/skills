import type { AppliedRegistryFile } from '../schemas/index.ts';
import type { BacklogRootPath } from '../runtime/shared.ts';
import type { ArtifactsModuleDependencies } from './shared.ts';
import { getAppliedRegistryPath } from './backlog-layout.ts';
import { readJsonArtifact, writeJsonArtifact } from './store-helpers.ts';

export async function readAppliedRegistry(
  dependencies: ArtifactsModuleDependencies,
  root: BacklogRootPath,
): Promise<AppliedRegistryFile> {
  return readJsonArtifact({
    fs: dependencies.fs,
    errors: dependencies.errors,
    filePath: getAppliedRegistryPath(dependencies.path, root),
    parse: (raw) => dependencies.schemas.parseAppliedRegistry(raw),
  });
}

export async function writeAppliedRegistry(
  dependencies: ArtifactsModuleDependencies,
  root: BacklogRootPath,
  value: AppliedRegistryFile,
): Promise<void> {
  await writeJsonArtifact({
    fs: dependencies.fs,
    path: dependencies.path,
    hash: dependencies.hash,
    errors: dependencies.errors,
    root,
    filePath: getAppliedRegistryPath(dependencies.path, root),
    value,
    validate: (raw) => dependencies.schemas.parseAppliedRegistry(raw),
    writeErrorCode: 'BE_INTERNAL_STATE_CORRUPT',
  });
}
