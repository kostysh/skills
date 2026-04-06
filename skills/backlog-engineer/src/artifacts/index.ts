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
} from './backlog-layout.ts';
import type { ArtifactsModuleDependencies } from './shared.ts';
import { importPacketFile, importPatchFile } from './canonical-import-store.ts';
import { deleteBacklog as deleteBacklogFromDisk } from './delete-backlog.ts';
import { writeReportFiles, writeTemplateOutput } from './report-store.ts';
import { readRootMarker, writeRootMarker } from './root-marker-store.ts';
import { readSourceRegistry, writeSourceRegistry } from './source-registry-store.ts';
import { readAppliedRegistry, writeAppliedRegistry } from './applied-registry-store.ts';
import { readState, stateExists, writeState } from './state-store.ts';
import { writeTextAtomically } from './store-helpers.ts';

export interface ArtifactsModule {
  createBacklogDirectories(root: BacklogRootPath): Promise<void>;
  readRootMarker(root: BacklogRootPath): Promise<RootMarkerFile>;
  writeRootMarker(root: BacklogRootPath, marker: RootMarkerFile): Promise<void>;
  writeAgentsFile(root: BacklogRootPath, content: string): Promise<void>;
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
    async writeInitialArtifacts(payload) {
      await createBacklogDirectoriesOnDisk(
        dependencies.fs,
        dependencies.path,
        dependencies.errors,
        payload.root,
      );
      await writeSourceRegistry(dependencies, payload.root, payload.sourceRegistry);
      await writeAppliedRegistry(dependencies, payload.root, payload.appliedRegistry);
      await writeState(dependencies, payload.root, payload.state);
      await writeTextAtomically({
        fs: dependencies.fs,
        path: dependencies.path,
        hash: dependencies.hash,
        errors: dependencies.errors,
        root: payload.root,
        targetPath: getAgentsPath(dependencies.path, payload.root),
        content: payload.agentsContent,
        writeErrorCode: 'BE_INTERNAL_STATE_CORRUPT',
      });
      await writeRootMarker(dependencies, payload.root, payload.marker);
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
