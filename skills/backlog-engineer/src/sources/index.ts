import type {
  SourceRecord,
  SourceRegistryFile,
  SourceSummary,
  StateFile,
} from '../schemas/index.ts';
import type { BacklogRootPath } from '../runtime/shared.ts';
import type {
  BacklogRelativePosixPath,
  CliPathInput,
  ItemKey,
  NormalizedFsPath,
  SourceId,
  SourceLabel,
} from '../schemas/index.ts';

export interface SourcesModule {
  resolveCliSourcePath(payload: {
    backlogRoot: BacklogRootPath;
    inputPath: CliPathInput;
  }): Promise<{
    absolute_path: NormalizedFsPath;
    relative_path: BacklogRelativePosixPath;
    source_label: SourceLabel;
  }>;
  buildSourceRecord(payload: {
    sourceId: SourceId;
    relativePath: BacklogRelativePosixPath;
    kind: string;
    note?: string;
    authority: string;
    registeredAt: string;
    lastCheckedAt: string;
    sourceHash: string;
  }): SourceRecord;
  hashSourceFile(path: NormalizedFsPath): Promise<string>;
  registerSource(payload: { registry: SourceRegistryFile; source: SourceRecord }): {
    registry: SourceRegistryFile;
    source: SourceRecord;
    created: boolean;
  };
  refreshSourceHashes(payload: {
    backlogRoot: BacklogRootPath;
    registry: SourceRegistryFile;
    selectedSourceIds: SourceId[];
  }): Promise<{
    registry: SourceRegistryFile;
    changedSourceIds: SourceId[];
    changedSources: SourceSummary[];
  }>;
  resolveSourceScope(payload: {
    backlogRoot: BacklogRootPath;
    state: StateFile;
    registry: SourceRegistryFile;
    selector:
      | { kind: 'source_id'; source_id: SourceId }
      | { kind: 'source_label'; source_label: string }
      | { kind: 'source_path'; source_path: CliPathInput };
  }): {
    sourceIds: SourceId[];
    topLevelItemKeys: ItemKey[];
    subgraphItemKeys: ItemKey[];
  };
}
