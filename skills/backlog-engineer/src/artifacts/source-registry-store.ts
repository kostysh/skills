import type { SourceRegistryFile } from '../schemas/index.ts';
import type { BacklogRootPath } from '../runtime/shared.ts';
import type { ArtifactsModuleDependencies } from './shared.ts';
import { getSourceRegistryPath } from './backlog-layout.ts';
import { readJsonArtifact, writeJsonArtifact } from './store-helpers.ts';

export async function readSourceRegistry(
  dependencies: ArtifactsModuleDependencies,
  root: BacklogRootPath,
): Promise<SourceRegistryFile> {
  return readJsonArtifact({
    fs: dependencies.fs,
    path: dependencies.path,
    errors: dependencies.errors,
    root,
    filePath: getSourceRegistryPath(dependencies.path, root),
    parse: (raw) => dependencies.schemas.parseSourceRegistry(raw),
    readErrorCode: 'BE_INTERNAL_STATE_CORRUPT',
  });
}

export async function writeSourceRegistry(
  dependencies: ArtifactsModuleDependencies,
  root: BacklogRootPath,
  value: SourceRegistryFile,
): Promise<void> {
  await writeJsonArtifact({
    fs: dependencies.fs,
    path: dependencies.path,
    hash: dependencies.hash,
    errors: dependencies.errors,
    root,
    filePath: getSourceRegistryPath(dependencies.path, root),
    value,
    validate: (raw) => dependencies.schemas.parseSourceRegistry(raw),
    writeErrorCode: 'BE_INTERNAL_STATE_CORRUPT',
  });
}
