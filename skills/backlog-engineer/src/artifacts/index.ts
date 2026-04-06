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
