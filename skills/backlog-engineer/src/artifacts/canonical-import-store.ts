import type { AbsoluteFsPath, BacklogRootPath } from '../runtime/shared.ts';
import type { BacklogRelativePosixPath, PacketId, PatchId } from '../schemas/index.ts';
import type { ArtifactsModuleDependencies } from './shared.ts';
import {
  PACKETS_DIRNAME,
  PATCHES_DIRNAME,
  createCanonicalImportFilename,
  getLayoutDirectories,
  toBacklogRelativePosixPath,
} from './backlog-layout.ts';
import { ensureManagedFilePathSafe, writeTextAtomically } from './store-helpers.ts';

async function importCanonicalArtifact(payload: {
  dependencies: ArtifactsModuleDependencies;
  root: BacklogRootPath;
  sourcePath: AbsoluteFsPath;
  rawContent: string;
  canonicalBasename: string;
  directoryName: typeof PACKETS_DIRNAME | typeof PATCHES_DIRNAME;
}): Promise<{
  canonicalPath: BacklogRelativePosixPath;
  sha256: string;
}> {
  const { dependencies, root, sourcePath, rawContent, canonicalBasename, directoryName } = payload;
  const sha256 = await dependencies.hash.sha256Text(rawContent);
  const filename = createCanonicalImportFilename(sha256, canonicalBasename, dependencies.errors);
  const directories = getLayoutDirectories(dependencies.path, root);
  const targetDir =
    directoryName === PACKETS_DIRNAME ? directories.packetsDir : directories.patchesDir;
  const targetPath = dependencies.path.join(targetDir, filename);
  const normalizedSourcePath = dependencies.path.resolve(sourcePath);

  await ensureManagedFilePathSafe({
    fs: dependencies.fs,
    path: dependencies.path,
    errors: dependencies.errors,
    root,
    filePath: targetPath,
    errorCode: 'BE_CANONICAL_WRITE_FAILED',
  });

  if (normalizedSourcePath === targetPath) {
    return {
      canonicalPath: toBacklogRelativePosixPath(dependencies.path, root, targetPath),
      sha256,
    };
  }

  if (await dependencies.fs.exists(targetPath)) {
    const existingStat = await dependencies.fs.stat(targetPath);
    if (existingStat.isFile) {
      const existingContent = await dependencies.fs.readText(targetPath);
      if (existingContent === rawContent) {
        return {
          canonicalPath: toBacklogRelativePosixPath(dependencies.path, root, targetPath),
          sha256,
        };
      }
    }
  }

  await writeTextAtomically({
    fs: dependencies.fs,
    path: dependencies.path,
    hash: dependencies.hash,
    errors: dependencies.errors,
    root,
    targetPath,
    content: rawContent,
    writeErrorCode: 'BE_CANONICAL_WRITE_FAILED',
  });

  return {
    canonicalPath: toBacklogRelativePosixPath(dependencies.path, root, targetPath),
    sha256,
  };
}

export async function importPacketFile(
  dependencies: ArtifactsModuleDependencies,
  payload: {
    root: BacklogRootPath;
    packetId: PacketId;
    sourcePath: AbsoluteFsPath;
    canonicalBasename: string;
    rawContent: string;
  },
): Promise<{
  canonicalPath: BacklogRelativePosixPath;
  sha256: string;
}> {
  void payload.packetId;
  void payload.sourcePath;
  return importCanonicalArtifact({
    dependencies,
    root: payload.root,
    sourcePath: payload.sourcePath,
    rawContent: payload.rawContent,
    canonicalBasename: payload.canonicalBasename,
    directoryName: PACKETS_DIRNAME,
  });
}

export async function importPatchFile(
  dependencies: ArtifactsModuleDependencies,
  payload: {
    root: BacklogRootPath;
    patchId: PatchId;
    sourcePath: AbsoluteFsPath;
    canonicalBasename: string;
    rawContent: string;
  },
): Promise<{
  canonicalPath: BacklogRelativePosixPath;
  sha256: string;
}> {
  void payload.patchId;
  void payload.sourcePath;
  return importCanonicalArtifact({
    dependencies,
    root: payload.root,
    sourcePath: payload.sourcePath,
    rawContent: payload.rawContent,
    canonicalBasename: payload.canonicalBasename,
    directoryName: PATCHES_DIRNAME,
  });
}
