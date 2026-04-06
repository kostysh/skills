import type { ErrorModule } from '../errors/index.ts';
import type { BacklogRootPath } from '../runtime/shared.ts';
import type {
  ItemKey,
  SchemaModule,
  SourceRecord,
  SourceRegistryFile,
  SourceId,
  SourceSummary,
  StateFile,
} from '../schemas/index.ts';
import type { ClockPort, FileSystemPort, HashPort, PathPort } from '../runtime/ports.ts';
import { normalizeSourcePath, sortSourceLabels } from './path-normalizer.ts';
import { hashSourceFile } from './source-hash-service.ts';
import { createSourceSummary, resolveSourceAbsolutePath } from './source-registry-service.ts';

function collectItemSourceIds(item: StateFile['items'][number]): Set<SourceId> {
  return new Set<SourceId>([
    ...item.origin_source_ids,
    ...item.specification_source_ids,
    ...item.plan_source_ids,
    ...item.implementation_source_ids,
    ...item.test_source_ids,
  ]);
}

function sortStringKeys<T extends string>(values: Iterable<T>): T[] {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function resolveSourceBySelector(payload: {
  path: PathPort;
  errors: ErrorModule;
  backlogRoot: BacklogRootPath;
  registry: SourceRegistryFile;
  selector:
    | { kind: 'source_id'; source_id: SourceId }
    | { kind: 'source_label'; source_label: string }
    | { kind: 'source_path'; source_path: string };
}): SourceRecord[] {
  const { selector } = payload;

  if (selector.kind === 'source_id') {
    const source = payload.registry.sources.find(
      (record) => record.source_id === selector.source_id,
    );
    if (!source) {
      throw payload.errors.create('BE_SOURCE_NOT_FOUND', undefined, {
        details: {
          source_id: selector.source_id,
        },
      });
    }

    return [source];
  }

  if (selector.kind === 'source_label') {
    const source = payload.registry.sources.find(
      (record) => record.source_label === selector.source_label,
    );
    if (!source) {
      throw payload.errors.create('BE_SOURCE_NOT_FOUND', undefined, {
        details: {
          source_label: selector.source_label,
        },
      });
    }

    return [source];
  }

  const normalized = normalizeSourcePath({
    path: payload.path,
    errors: payload.errors,
    backlogRoot: payload.backlogRoot,
    inputPath: selector.source_path,
  });
  const source = payload.registry.sources.find(
    (record) => record.path === normalized.relative_path,
  );
  if (!source) {
    throw payload.errors.create('BE_SOURCE_NOT_FOUND', undefined, {
      details: {
        path: normalized.relative_path,
      },
    });
  }

  return [source];
}

function collectTopLevelItemKeys(payload: {
  state: StateFile;
  linkedItemKeys: Set<ItemKey>;
}): Set<ItemKey> {
  const itemsByKey = new Map(payload.state.items.map((item) => [item.item_key, item]));
  const topLevelItemKeys = new Set<ItemKey>();

  for (const linkedItemKey of payload.linkedItemKeys) {
    const stack: ItemKey[] = [linkedItemKey];
    const seen = new Set<ItemKey>();

    while (stack.length > 0) {
      const itemKey = stack.pop();
      if (!itemKey) {
        break;
      }
      if (seen.has(itemKey)) {
        continue;
      }
      seen.add(itemKey);

      const item = itemsByKey.get(itemKey);
      if (!item || item.depends_on_keys.length === 0) {
        topLevelItemKeys.add(itemKey);
        continue;
      }

      for (const dependencyKey of item.depends_on_keys) {
        stack.push(dependencyKey);
      }
    }
  }

  return topLevelItemKeys;
}

function collectSubgraphItemKeys(payload: {
  state: StateFile;
  topLevelItemKeys: Set<ItemKey>;
}): Set<ItemKey> {
  const itemsByKey = new Map(payload.state.items.map((item) => [item.item_key, item]));
  const subgraphItemKeys = new Set<ItemKey>();
  const stack = [...payload.topLevelItemKeys];

  while (stack.length > 0) {
    const itemKey = stack.pop();
    if (!itemKey) {
      break;
    }
    if (subgraphItemKeys.has(itemKey)) {
      continue;
    }
    subgraphItemKeys.add(itemKey);

    const item = itemsByKey.get(itemKey);
    if (!item) {
      continue;
    }

    for (const reverseDependencyKey of item.reverse_dependency_keys) {
      stack.push(reverseDependencyKey);
    }
  }

  return subgraphItemKeys;
}

export async function refreshSourceHashes(payload: {
  fs: FileSystemPort;
  path: PathPort;
  hash: HashPort;
  clock: ClockPort;
  schemas: SchemaModule;
  errors: ErrorModule;
  backlogRoot: BacklogRootPath;
  registry: SourceRegistryFile;
  selectedSourceIds: SourceId[];
}): Promise<{
  registry: SourceRegistryFile;
  changedSourceIds: SourceId[];
  changedSources: SourceSummary[];
}> {
  const selectedIds = new Set(payload.selectedSourceIds);
  const refreshedAt = payload.clock.nowIsoUtc();
  const changedSourceIds: SourceId[] = [];
  const changedSources: SourceSummary[] = [];

  const nextSources = await Promise.all(
    payload.registry.sources.map(async (source) => {
      if (!selectedIds.has(source.source_id)) {
        return source;
      }

      const nextHash = await hashSourceFile({
        fs: payload.fs,
        path: payload.path,
        hash: payload.hash,
        errors: payload.errors,
        filePath: resolveSourceAbsolutePath({
          path: payload.path,
          backlogRoot: payload.backlogRoot,
          sourcePath: source.path,
        }),
      });

      const nextSource = {
        ...source,
        hash: nextHash,
        last_checked_at: refreshedAt,
      };

      if (nextHash !== source.hash) {
        changedSourceIds.push(source.source_id);
        changedSources.push(createSourceSummary(source));
      }

      return nextSource;
    }),
  );

  const registry =
    selectedIds.size === 0
      ? payload.registry
      : payload.schemas.parseSourceRegistry({
          ...payload.registry,
          updated_at: refreshedAt,
          sources: sortSourceLabels(nextSources),
        });

  return {
    registry,
    changedSourceIds: sortStringKeys(changedSourceIds),
    changedSources: sortSourceLabels(changedSources),
  };
}

export function resolveSourceScope(payload: {
  path: PathPort;
  errors: ErrorModule;
  backlogRoot: BacklogRootPath;
  state: StateFile;
  registry: SourceRegistryFile;
  selector:
    | { kind: 'source_id'; source_id: SourceId }
    | { kind: 'source_label'; source_label: string }
    | { kind: 'source_path'; source_path: string };
}): {
  sourceIds: SourceId[];
  topLevelItemKeys: ItemKey[];
  subgraphItemKeys: ItemKey[];
} {
  const selectedSources = resolveSourceBySelector(payload);
  const selectedSourceIds = new Set(selectedSources.map((source) => source.source_id));
  const linkedItemKeys = new Set<ItemKey>();

  for (const item of payload.state.items) {
    const sourceIds = collectItemSourceIds(item);
    if ([...selectedSourceIds].some((sourceId) => sourceIds.has(sourceId))) {
      linkedItemKeys.add(item.item_key);
    }
  }

  const topLevelItemKeys = collectTopLevelItemKeys({
    state: payload.state,
    linkedItemKeys,
  });
  const subgraphItemKeys = collectSubgraphItemKeys({
    state: payload.state,
    topLevelItemKeys,
  });

  return {
    sourceIds: sortStringKeys(selectedSourceIds),
    topLevelItemKeys: sortStringKeys(topLevelItemKeys),
    subgraphItemKeys: sortStringKeys(subgraphItemKeys),
  };
}
