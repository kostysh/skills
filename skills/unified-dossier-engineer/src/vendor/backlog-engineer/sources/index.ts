import type { ErrorModule } from '../errors/index.ts';
import type { BacklogRootPath } from '../runtime/shared.ts';
import type {
  ItemKey,
  NormalizedFsPath,
  SchemaModule,
  SourceRelativePosixPath,
  SourceRecord,
  SourceRegistryFile,
  SourceId,
  SourceLabel,
  SourceSummary,
  StateFile,
} from '../schemas/index.ts';
import type { ClockPort, FileSystemPort, HashPort, PathPort } from '../runtime/ports.ts';
import { normalizeSourcePath } from './path-normalizer.ts';
import { hashSourceFile as hashSourceFileFromDisk } from './source-hash-service.ts';
import {
  buildSourceRecord as buildSourceRecordValue,
  registerSourceRecord,
} from './source-registry-service.ts';
import {
  refreshSourceHashes as refreshSourceHashesInRegistry,
  resolveSourceScope as resolveSourceScopeInState,
} from './source-scope-service.ts';

export interface SourcesModule {
  resolveCliSourcePath(payload: {
    backlogRoot: BacklogRootPath;
    inputPath: NormalizedFsPath;
  }): Promise<{
    absolute_path: NormalizedFsPath;
    relative_path: SourceRelativePosixPath;
    source_label: SourceLabel;
  }>;
  buildSourceRecord(payload: {
    sourceId: SourceId;
    relativePath: SourceRelativePosixPath;
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
      | { kind: 'source_path'; source_path: NormalizedFsPath };
  }): {
    sourceIds: SourceId[];
    topLevelItemKeys: ItemKey[];
    subgraphItemKeys: ItemKey[];
  };
}

export type SourcesModuleDependencies = {
  fs: FileSystemPort;
  path: PathPort;
  hash: HashPort;
  clock: ClockPort;
  schemas: SchemaModule;
  errors: ErrorModule;
};

export function createSourcesModule(dependencies: SourcesModuleDependencies): SourcesModule {
  return {
    resolveCliSourcePath(payload) {
      return Promise.resolve(
        normalizeSourcePath({
          path: dependencies.path,
          backlogRoot: payload.backlogRoot,
          inputPath: payload.inputPath,
        }),
      );
    },
    buildSourceRecord(payload) {
      return buildSourceRecordValue({
        schemas: dependencies.schemas,
        errors: dependencies.errors,
        sourceId: payload.sourceId,
        relativePath: payload.relativePath,
        kind: payload.kind,
        authority: payload.authority,
        registeredAt: payload.registeredAt,
        lastCheckedAt: payload.lastCheckedAt,
        sourceHash: payload.sourceHash,
        ...(payload.note ? { note: payload.note } : {}),
      });
    },
    hashSourceFile(path) {
      return hashSourceFileFromDisk({
        fs: dependencies.fs,
        path: dependencies.path,
        hash: dependencies.hash,
        errors: dependencies.errors,
        filePath: path,
      });
    },
    registerSource(payload) {
      return registerSourceRecord({
        schemas: dependencies.schemas,
        registry: payload.registry,
        source: payload.source,
      });
    },
    refreshSourceHashes(payload) {
      return refreshSourceHashesInRegistry({
        fs: dependencies.fs,
        path: dependencies.path,
        hash: dependencies.hash,
        clock: dependencies.clock,
        schemas: dependencies.schemas,
        errors: dependencies.errors,
        backlogRoot: payload.backlogRoot,
        registry: payload.registry,
        selectedSourceIds: payload.selectedSourceIds,
      });
    },
    resolveSourceScope(payload) {
      return resolveSourceScopeInState({
        path: dependencies.path,
        errors: dependencies.errors,
        backlogRoot: payload.backlogRoot,
        state: payload.state,
        registry: payload.registry,
        selector: payload.selector,
      });
    },
  };
}

export {
  SOURCE_AUTHORITY_VALUES,
  SOURCE_KIND_VALUES,
  validateSourceAuthority,
  validateSourceKind,
} from './source-registry-service.ts';
