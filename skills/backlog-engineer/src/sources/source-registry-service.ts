import type { ErrorModule } from '../errors/index.ts';
import { SCHEMA_VERSION } from '../runtime/tool-metadata.ts';
import type { SchemaModule } from '../schemas/index.ts';
import type {
  BacklogRelativePosixPath,
  NormalizedFsPath,
  SourceId,
  SourceRecord,
  SourceRegistryFile,
} from '../schemas/index.ts';
import { sortSourceLabels } from './path-normalizer.ts';

export const SOURCE_KIND_VALUES = [
  'architecture',
  'module',
  'adr',
  'technical-decision',
  'integration',
  'operations',
  'planning',
  'specification',
] as const;

export const SOURCE_AUTHORITY_VALUES = ['authoritative', 'supporting', 'derived'] as const;

const SOURCE_KIND_SET = new Set<string>(SOURCE_KIND_VALUES);
const SOURCE_AUTHORITY_SET = new Set<string>(SOURCE_AUTHORITY_VALUES);

export function validateSourceKind(kind: string, errors: ErrorModule): void {
  if (SOURCE_KIND_SET.has(kind)) {
    return;
  }

  throw errors.create('BE_SOURCE_KIND_INVALID', undefined, {
    details: {
      kind,
      allowed_values: [...SOURCE_KIND_VALUES],
    },
  });
}

export function validateSourceAuthority(authority: string, errors: ErrorModule): void {
  if (SOURCE_AUTHORITY_SET.has(authority)) {
    return;
  }

  throw errors.create('BE_SOURCE_AUTHORITY_INVALID', undefined, {
    details: {
      authority,
      allowed_values: [...SOURCE_AUTHORITY_VALUES],
    },
  });
}

export function buildSourceRecord(payload: {
  schemas: SchemaModule;
  errors: ErrorModule;
  sourceId: SourceId;
  relativePath: BacklogRelativePosixPath;
  kind: string;
  note?: string;
  authority: string;
  registeredAt: string;
  lastCheckedAt: string;
  sourceHash: string;
}): SourceRecord {
  validateSourceKind(payload.kind, payload.errors);
  validateSourceAuthority(payload.authority, payload.errors);

  const registry = payload.schemas.parseSourceRegistry({
    schema_version: SCHEMA_VERSION,
    created_at: payload.registeredAt,
    updated_at: payload.registeredAt,
    sources: [
      {
        source_id: payload.sourceId,
        source_label: payload.relativePath,
        path: payload.relativePath,
        kind: payload.kind,
        authority: payload.authority,
        ...(payload.note ? { note: payload.note } : {}),
        hash: payload.sourceHash,
        registered_at: payload.registeredAt,
        last_checked_at: payload.lastCheckedAt,
      },
    ],
  });
  const [record] = registry.sources;
  if (!record) {
    throw payload.errors.create('BE_INTERNAL_STATE_CORRUPT', undefined, {
      details: {
        reason: 'source_registry_parse_returned_empty_sources',
      },
    });
  }

  return record;
}

export function registerSourceRecord(payload: {
  schemas: SchemaModule;
  registry: SourceRegistryFile;
  source: SourceRecord;
}): {
  registry: SourceRegistryFile;
  source: SourceRecord;
  created: boolean;
} {
  const existingSource = payload.registry.sources.find(
    (source) => source.path === payload.source.path,
  );
  if (existingSource) {
    return {
      registry: payload.registry,
      source: existingSource,
      created: false,
    };
  }

  return {
    registry: payload.schemas.parseSourceRegistry({
      ...payload.registry,
      updated_at: payload.source.registered_at,
      sources: sortSourceLabels([...payload.registry.sources, payload.source]),
    }),
    source: payload.source,
    created: true,
  };
}

export function createSourceSummary(source: Pick<SourceRecord, 'source_id' | 'source_label'>): {
  source_id: SourceId;
  source_label: SourceRecord['source_label'];
} {
  return {
    source_id: source.source_id,
    source_label: source.source_label,
  };
}

export function resolveSourceAbsolutePath(payload: {
  path: { resolve(...parts: string[]): string };
  backlogRoot: string;
  sourcePath: BacklogRelativePosixPath;
}): NormalizedFsPath {
  return payload.path.resolve(payload.backlogRoot, payload.sourcePath);
}
