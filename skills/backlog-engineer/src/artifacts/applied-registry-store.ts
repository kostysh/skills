import type { AppliedRegistryFile } from '../schemas/index.ts';
import type { BacklogRootPath } from '../runtime/shared.ts';
import type { ArtifactsModuleDependencies } from './shared.ts';
import { getAppliedRegistryPath } from './backlog-layout.ts';
import { readJsonArtifact, writeJsonArtifact } from './store-helpers.ts';

function assertAppliedRegistrySemanticInvariants(
  value: AppliedRegistryFile,
  dependencies: ArtifactsModuleDependencies,
): void {
  const seenSequences = new Set<number>();

  for (const patch of value.patches) {
    if (seenSequences.has(patch.sequence)) {
      throw dependencies.errors.create('BE_PATCH_SEQUENCE_CONFLICT', undefined, {
        details: {
          patch_id: patch.patch_id,
          sequence: patch.sequence,
        },
      });
    }

    seenSequences.add(patch.sequence);
  }
}

export async function readAppliedRegistry(
  dependencies: ArtifactsModuleDependencies,
  root: BacklogRootPath,
): Promise<AppliedRegistryFile> {
  const registry = await readJsonArtifact({
    fs: dependencies.fs,
    path: dependencies.path,
    errors: dependencies.errors,
    root,
    filePath: getAppliedRegistryPath(dependencies.path, root),
    parse: (raw) => dependencies.schemas.parseAppliedRegistry(raw),
    readErrorCode: 'BE_INTERNAL_STATE_CORRUPT',
  });

  assertAppliedRegistrySemanticInvariants(registry, dependencies);

  return registry;
}

export async function writeAppliedRegistry(
  dependencies: ArtifactsModuleDependencies,
  root: BacklogRootPath,
  value: AppliedRegistryFile,
): Promise<void> {
  assertAppliedRegistrySemanticInvariants(value, dependencies);

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
