import type { RootMarkerFile } from '../schemas/index.ts';
import type { BacklogRootPath } from '../runtime/shared.ts';
import type { ArtifactsModuleDependencies } from './shared.ts';
import { getRootMarkerPath } from './backlog-layout.ts';
import { readJsonArtifact, writeJsonArtifact } from './store-helpers.ts';

export async function readRootMarker(
  dependencies: ArtifactsModuleDependencies,
  root: BacklogRootPath,
): Promise<RootMarkerFile> {
  return readJsonArtifact({
    fs: dependencies.fs,
    errors: dependencies.errors,
    filePath: getRootMarkerPath(dependencies.path, root),
    parse: (raw) => dependencies.schemas.parseRootMarker(raw),
    missingCode: 'BE_ROOT_NOT_FOUND',
    corruptCode: 'BE_ROOT_NOT_FOUND',
  });
}

export async function writeRootMarker(
  dependencies: ArtifactsModuleDependencies,
  root: BacklogRootPath,
  marker: RootMarkerFile,
): Promise<void> {
  await writeJsonArtifact({
    fs: dependencies.fs,
    path: dependencies.path,
    hash: dependencies.hash,
    errors: dependencies.errors,
    root,
    filePath: getRootMarkerPath(dependencies.path, root),
    value: marker,
    validate: (raw) => dependencies.schemas.parseRootMarker(raw),
    writeErrorCode: 'BE_INTERNAL_STATE_CORRUPT',
  });
}
