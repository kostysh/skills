import type {
  AppliedRegistryFile,
  RootMarkerFile,
  SourceRegistryFile,
  StateFile,
} from '../schemas/index.ts';
import type { AbsoluteFsPath, BacklogRootPath } from '../runtime/shared.ts';
import type {
  BacklogRelativePosixPath,
  CliPathInput,
  NormalizedFsPath,
  PacketId,
  PatchId,
} from '../schemas/index.ts';
import {
  createBacklogDirectories as createBacklogDirectoriesOnDisk,
  getAgentsPath,
  getAppliedRegistryPath,
  getLayoutDirectories,
  getRootMarkerPath,
  getSourceRegistryPath,
  getStatePath,
} from './backlog-layout.ts';
import type { ArtifactsModuleDependencies } from './shared.ts';
import { importPacketFile, importPatchFile } from './canonical-import-store.ts';
import { deleteBacklog as deleteBacklogFromDisk } from './delete-backlog.ts';
import { initializeBacklogRoot as initializeBacklogRootOnDisk } from './initialize-backlog.ts';
import { writeReportFiles, writeTemplateOutput } from './report-store.ts';
import { readRootMarker, writeRootMarker } from './root-marker-store.ts';
import { readSourceRegistry, writeSourceRegistry } from './source-registry-store.ts';
import { readAppliedRegistry, writeAppliedRegistry } from './applied-registry-store.ts';
import { readState, stateExists, writeState } from './state-store.ts';
import { writeTextAtomically } from './store-helpers.ts';

async function createTempSiblingPath(payload: {
  path: ArtifactsModuleDependencies['path'];
  hash: ArtifactsModuleDependencies['hash'];
  targetPath: AbsoluteFsPath;
  content: string;
}): Promise<AbsoluteFsPath> {
  const seedHash = await payload.hash.sha256Text(`${payload.targetPath}\n${payload.content}`);
  return payload.path.join(
    payload.path.dirname(payload.targetPath),
    `.${payload.path.basename(payload.targetPath)}.tmp-${seedHash.slice(0, 12)}`,
  );
}

async function pruneEmptyRoot(payload: {
  fs: ArtifactsModuleDependencies['fs'];
  root: BacklogRootPath;
}): Promise<void> {
  if (!(await payload.fs.exists(payload.root))) {
    return;
  }

  const rootStat = await payload.fs.lstat(payload.root);
  if (!rootStat.isDirectory || rootStat.isSymbolicLink) {
    return;
  }

  const remainingEntries = await payload.fs.readdir(payload.root);
  if (remainingEntries.length === 0) {
    await payload.fs.rm(payload.root, { recursive: true, force: true });
  }
}

export interface ArtifactsModule {
  createBacklogDirectories(root: BacklogRootPath): Promise<void>;
  readRootMarker(root: BacklogRootPath): Promise<RootMarkerFile>;
  writeRootMarker(root: BacklogRootPath, marker: RootMarkerFile): Promise<void>;
  writeAgentsFile(root: BacklogRootPath, content: string): Promise<void>;
  initializeBacklogRoot(payload: {
    root: BacklogRootPath;
    createdAt: string;
    agentsContent: string;
  }): Promise<{
    path: NormalizedFsPath;
    root_marker_path: NormalizedFsPath;
    agents_path: NormalizedFsPath;
  }>;
  writeInitialArtifacts(payload: {
    root: BacklogRootPath;
    marker: RootMarkerFile;
    agentsContent: string;
    sourceRegistry: SourceRegistryFile;
    appliedRegistry: AppliedRegistryFile;
    state: StateFile;
  }): Promise<void>;
  readSourceRegistry(root: BacklogRootPath): Promise<SourceRegistryFile>;
  writeSourceRegistry(root: BacklogRootPath, value: SourceRegistryFile): Promise<void>;
  readAppliedRegistry(root: BacklogRootPath): Promise<AppliedRegistryFile>;
  writeAppliedRegistry(root: BacklogRootPath, value: AppliedRegistryFile): Promise<void>;
  readState(root: BacklogRootPath): Promise<StateFile>;
  writeState(root: BacklogRootPath, value: StateFile): Promise<void>;
  stateExists(root: BacklogRootPath): Promise<boolean>;
  importPacketFile(payload: {
    root: BacklogRootPath;
    packetId: PacketId;
    sourcePath: AbsoluteFsPath;
    canonicalBasename: string;
    rawContent: string;
  }): Promise<{
    canonicalPath: BacklogRelativePosixPath;
    sha256: string;
  }>;
  importPatchFile(payload: {
    root: BacklogRootPath;
    patchId: PatchId;
    sourcePath: AbsoluteFsPath;
    canonicalBasename: string;
    rawContent: string;
  }): Promise<{
    canonicalPath: BacklogRelativePosixPath;
    sha256: string;
  }>;
  writeReportFiles(payload: { root: BacklogRootPath; markdown: string; mermaid: string }): Promise<{
    reportPath: BacklogRelativePosixPath;
    graphPath: BacklogRelativePosixPath;
  }>;
  writeTemplateOutput(payload: {
    cwd: AbsoluteFsPath;
    out: CliPathInput;
    defaultBasename: string;
    collisionBasename?: string;
    content: string;
  }): Promise<NormalizedFsPath>;
  deleteBacklog(root: BacklogRootPath): Promise<void>;
}

export function createArtifactsModule(dependencies: ArtifactsModuleDependencies): ArtifactsModule {
  return {
    createBacklogDirectories(root) {
      return createBacklogDirectoriesOnDisk(
        dependencies.fs,
        dependencies.path,
        dependencies.errors,
        root,
      );
    },
    readRootMarker(root) {
      return readRootMarker(dependencies, root);
    },
    writeRootMarker(root, marker) {
      return writeRootMarker(dependencies, root, marker);
    },
    async writeAgentsFile(root, content) {
      await writeTextAtomically({
        fs: dependencies.fs,
        path: dependencies.path,
        hash: dependencies.hash,
        errors: dependencies.errors,
        root,
        targetPath: getAgentsPath(dependencies.path, root),
        content,
        writeErrorCode: 'BE_INTERNAL_STATE_CORRUPT',
      });
    },
    initializeBacklogRoot(payload) {
      return initializeBacklogRootOnDisk(
        {
          ...dependencies,
          artifacts: this,
        },
        payload,
      );
    },
    async writeInitialArtifacts(payload) {
      const rootMarkerPath = getRootMarkerPath(dependencies.path, payload.root);
      const statePath = getStatePath(dependencies.path, payload.root);
      const sourceRegistryPath = getSourceRegistryPath(dependencies.path, payload.root);
      const appliedRegistryPath = getAppliedRegistryPath(dependencies.path, payload.root);
      const agentsPath = getAgentsPath(dependencies.path, payload.root);
      const layoutDirectories = getLayoutDirectories(dependencies.path, payload.root);
      const rootMarkerContent = `${JSON.stringify(payload.marker, null, 2)}\n`;
      const stateContent = `${JSON.stringify(payload.state, null, 2)}\n`;
      const sourceRegistryContent = `${JSON.stringify(payload.sourceRegistry, null, 2)}\n`;
      const appliedRegistryContent = `${JSON.stringify(payload.appliedRegistry, null, 2)}\n`;
      const tempPaths = await Promise.all([
        createTempSiblingPath({
          path: dependencies.path,
          hash: dependencies.hash,
          targetPath: rootMarkerPath,
          content: rootMarkerContent,
        }),
        createTempSiblingPath({
          path: dependencies.path,
          hash: dependencies.hash,
          targetPath: statePath,
          content: stateContent,
        }),
        createTempSiblingPath({
          path: dependencies.path,
          hash: dependencies.hash,
          targetPath: sourceRegistryPath,
          content: sourceRegistryContent,
        }),
        createTempSiblingPath({
          path: dependencies.path,
          hash: dependencies.hash,
          targetPath: appliedRegistryPath,
          content: appliedRegistryContent,
        }),
        createTempSiblingPath({
          path: dependencies.path,
          hash: dependencies.hash,
          targetPath: agentsPath,
          content: payload.agentsContent,
        }),
      ]);

      await createBacklogDirectoriesOnDisk(
        dependencies.fs,
        dependencies.path,
        dependencies.errors,
        payload.root,
      );
      try {
        await writeRootMarker(dependencies, payload.root, payload.marker);
        await writeState(dependencies, payload.root, payload.state);
        await writeSourceRegistry(dependencies, payload.root, payload.sourceRegistry);
        await writeAppliedRegistry(dependencies, payload.root, payload.appliedRegistry);
        await writeTextAtomically({
          fs: dependencies.fs,
          path: dependencies.path,
          hash: dependencies.hash,
          errors: dependencies.errors,
          root: payload.root,
          targetPath: agentsPath,
          content: payload.agentsContent,
          writeErrorCode: 'BE_INTERNAL_STATE_CORRUPT',
        });
      } catch (error) {
        for (const targetPath of [
          ...tempPaths,
          agentsPath,
          appliedRegistryPath,
          sourceRegistryPath,
          statePath,
          rootMarkerPath,
          layoutDirectories.internalDir,
          layoutDirectories.packetsDir,
          layoutDirectories.patchesDir,
          layoutDirectories.reportsDir,
        ]) {
          try {
            await dependencies.fs.rm(targetPath, { recursive: true, force: true });
          } catch {
            // Preserve the original bootstrap failure for the caller.
          }
        }

        try {
          await pruneEmptyRoot({
            fs: dependencies.fs,
            root: payload.root,
          });
        } catch {
          // Preserve the original bootstrap failure for the caller.
        }

        throw error;
      }
    },
    readSourceRegistry(root) {
      return readSourceRegistry(dependencies, root);
    },
    writeSourceRegistry(root, value) {
      return writeSourceRegistry(dependencies, root, value);
    },
    readAppliedRegistry(root) {
      return readAppliedRegistry(dependencies, root);
    },
    writeAppliedRegistry(root, value) {
      return writeAppliedRegistry(dependencies, root, value);
    },
    readState(root) {
      return readState(dependencies, root);
    },
    writeState(root, value) {
      return writeState(dependencies, root, value);
    },
    stateExists(root) {
      return stateExists(dependencies, root);
    },
    importPacketFile(payload) {
      return importPacketFile(dependencies, payload);
    },
    importPatchFile(payload) {
      return importPatchFile(dependencies, payload);
    },
    writeReportFiles(payload) {
      return writeReportFiles(dependencies, payload);
    },
    writeTemplateOutput(payload) {
      return writeTemplateOutput(dependencies, payload);
    },
    deleteBacklog(root) {
      return deleteBacklogFromDisk(dependencies, root);
    },
  };
}

export * from './backlog-layout.ts';
