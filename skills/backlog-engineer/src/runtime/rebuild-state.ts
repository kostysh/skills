import type { ArtifactsModule } from '../artifacts/index.ts';
import { readJsonArtifact } from '../artifacts/store-helpers.ts';
import {
  applyPacketReplay,
  applyPatchReplay,
  recomputeDerivedState,
  validateSourceRegistryReferences,
} from '../core/replay-pipeline.ts';
import type { ErrorModule } from '../errors/index.ts';
import type { RuntimeDependencies } from './ports.ts';
import type { BacklogRootPath } from './shared.ts';
import type {
  AppliedPatchEntry,
  AppliedRegistryFile,
  PacketContext,
  PacketFile,
  PatchFile,
  SchemaModule,
  StateFile,
} from '../schemas/index.ts';

type RuntimeStateArtifacts = {
  rootMarkerCreatedAt: string;
  sourceRegistry: ReturnType<SchemaModule['parseSourceRegistry']>;
  appliedRegistry: AppliedRegistryFile;
};

function collectItemSourceIds(item: StateFile['items'][number]): Set<string> {
  return new Set([
    ...item.origin_source_ids,
    ...item.specification_source_ids,
    ...item.plan_source_ids,
    ...item.implementation_source_ids,
    ...item.test_source_ids,
  ]);
}

function shouldRetainRuntimeTodo(payload: {
  todo: StateFile['todos'][number];
  rebuiltItemsByKey: Map<string, StateFile['items'][number]>;
  sourceLabelsById: Map<string, string>;
}): boolean {
  const item = payload.rebuiltItemsByKey.get(payload.todo.item_key);
  if (!item) {
    return false;
  }

  if (payload.todo.managed_by !== 'refresh') {
    return true;
  }

  if (!payload.todo.related_item_keys.every((itemKey) => payload.rebuiltItemsByKey.has(itemKey))) {
    return false;
  }

  if (
    !payload.todo.related_sources.every((source) => payload.sourceLabelsById.has(source.source_id))
  ) {
    return false;
  }

  if (payload.todo.type === 'review_source_change') {
    const itemSourceIds = collectItemSourceIds(item);
    return payload.todo.related_sources.every((source) => itemSourceIds.has(source.source_id));
  }

  if (payload.todo.type === 'review_dependency_change') {
    return payload.todo.related_item_keys.every((itemKey) =>
      item.depends_on_keys.includes(itemKey),
    );
  }

  return true;
}

function deepEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function createEmptyContext(): PacketContext {
  return {
    glossary: [],
    key_strategy: {},
    target_system: [],
    as_built: [],
    claims: [],
    contracts: [],
    data_domains: [],
    quality_attributes: [],
    policy_decisions: [],
  };
}

function createEmptyState(payload: {
  schemas: SchemaModule;
  createdAt: string;
  updatedAt: string;
  lastRefreshAt: string | null;
}): StateFile {
  return payload.schemas.parseStateFile({
    schema_version: 1,
    created_at: payload.createdAt,
    updated_at: payload.updatedAt,
    last_refresh_at: payload.lastRefreshAt,
    context: createEmptyContext(),
    items: [],
    todos: [],
  });
}

function validatePatchKind(payload: {
  entry: AppliedPatchEntry;
  patch: PatchFile;
  errors: ErrorModule;
}): void {
  if (payload.patch.metadata.patch_id !== payload.entry.patch_id) {
    throw payload.errors.create('BE_INTERNAL_STATE_CORRUPT', undefined, {
      details: {
        patch_id: payload.entry.patch_id,
        reason: 'Patch metadata does not match applied registry entry.',
      },
    });
  }

  if (
    payload.patch.metadata.target_item_keys.length !== payload.entry.target_item_keys.length ||
    payload.patch.metadata.target_item_keys.some(
      (itemKey, index) => itemKey !== payload.entry.target_item_keys[index],
    )
  ) {
    throw payload.errors.create('BE_INTERNAL_STATE_CORRUPT', undefined, {
      details: {
        patch_id: payload.entry.patch_id,
        reason: 'Patch metadata target_item_keys do not match applied registry entry.',
      },
    });
  }

  if (payload.entry.kind === 'patch-item') {
    if (
      payload.patch.operations.some(
        (operation) =>
          operation.action === 'remove_item' || operation.action === 'remove_source_references',
      )
    ) {
      throw payload.errors.create('BE_PATCH_OPERATION_INVALID', undefined, {
        details: {
          patch_id: payload.entry.patch_id,
        },
      });
    }
    return;
  }

  if (payload.entry.kind === 'source-maintenance') {
    if (
      payload.patch.operations.some((operation) => operation.action !== 'remove_source_references')
    ) {
      throw payload.errors.create('BE_PATCH_OPERATION_INVALID', undefined, {
        details: {
          patch_id: payload.entry.patch_id,
        },
      });
    }
    const affectedKeys = new Set(
      payload.patch.operations.flatMap((operation) =>
        operation.action === 'remove_source_references' ? operation.affected_item_keys : [],
      ),
    );
    if (
      affectedKeys.size !== payload.entry.target_item_keys.length ||
      payload.entry.target_item_keys.some((itemKey) => !affectedKeys.has(itemKey))
    ) {
      throw payload.errors.create('BE_PATCH_OPERATION_INVALID', undefined, {
        details: {
          patch_id: payload.entry.patch_id,
          reason: 'source-maintenance affected_item_keys must cover target_item_keys.',
        },
      });
    }
    return;
  }

  const removedKeys = new Set(
    payload.patch.operations
      .filter((operation) => operation.action === 'remove_item')
      .map((operation) => operation.item_key),
  );
  if (
    payload.patch.operations.some((operation) => operation.action !== 'remove_item') ||
    payload.entry.target_item_keys.some((itemKey) => !removedKeys.has(itemKey))
  ) {
    throw payload.errors.create('BE_PATCH_OPERATION_INVALID', undefined, {
      details: {
        patch_id: payload.entry.patch_id,
      },
    });
  }
}

function createArtifactReplayFailedError(payload: {
  artifactKind: 'packet' | 'patch';
  canonicalPath: string;
  errors: ErrorModule;
  error: unknown;
  message: string;
  packetId?: string;
  patchId?: string;
}): Error {
  return payload.errors.create('BE_REBUILD_REPLAY_FAILED', payload.message, {
    details: {
      artifact_kind: payload.artifactKind,
      canonical_path: payload.canonicalPath,
      ...(payload.packetId ? { packet_id: payload.packetId } : {}),
      ...(payload.patchId ? { patch_id: payload.patchId } : {}),
      ...(payload.errors.isBacklogError(payload.error)
        ? {
            original_code: payload.error.code,
            original_message: payload.error.message,
          }
        : payload.error instanceof Error
          ? {
              original_message: payload.error.message,
            }
          : {}),
    },
    hint: 'Inspect the named canonical artifact. Do not repair rebuild failures by manually editing state.json or applied.json.',
    cause: payload.error,
  });
}

async function readCanonicalPacket(payload: {
  backlogRoot: BacklogRootPath;
  dependencies: RuntimeDependencies;
  schemas: SchemaModule;
  errors: ErrorModule;
  canonicalPath: string;
}): Promise<PacketFile> {
  const filePath = payload.dependencies.path.resolve(payload.backlogRoot, payload.canonicalPath);
  return readJsonArtifact({
    fs: payload.dependencies.fs,
    path: payload.dependencies.path,
    errors: payload.errors,
    root: payload.backlogRoot,
    filePath,
    parse: (raw) => payload.schemas.parsePacketFile(raw),
    readErrorCode: 'BE_INTERNAL_STATE_CORRUPT',
    missingCode: 'BE_INTERNAL_STATE_CORRUPT',
    corruptCode: 'BE_INTERNAL_STATE_CORRUPT',
  });
}

async function readCanonicalPatch(payload: {
  backlogRoot: BacklogRootPath;
  dependencies: RuntimeDependencies;
  schemas: SchemaModule;
  errors: ErrorModule;
  canonicalPath: string;
}): Promise<PatchFile> {
  const filePath = payload.dependencies.path.resolve(payload.backlogRoot, payload.canonicalPath);
  return readJsonArtifact({
    fs: payload.dependencies.fs,
    path: payload.dependencies.path,
    errors: payload.errors,
    root: payload.backlogRoot,
    filePath,
    parse: (raw) => payload.schemas.parsePatchFile(raw),
    readErrorCode: 'BE_INTERNAL_STATE_CORRUPT',
    missingCode: 'BE_INTERNAL_STATE_CORRUPT',
    corruptCode: 'BE_INTERNAL_STATE_CORRUPT',
  });
}

async function loadRuntimeArtifacts(payload: {
  backlogRoot: BacklogRootPath;
  artifacts: ArtifactsModule;
}): Promise<RuntimeStateArtifacts> {
  const [rootMarker, sourceRegistry, appliedRegistry] = await Promise.all([
    payload.artifacts.readRootMarker(payload.backlogRoot),
    payload.artifacts.readSourceRegistry(payload.backlogRoot),
    payload.artifacts.readAppliedRegistry(payload.backlogRoot),
  ]);

  return {
    rootMarkerCreatedAt: rootMarker.created_at,
    sourceRegistry,
    appliedRegistry,
  };
}

function preserveRuntimeMetadata(payload: {
  rebuiltState: StateFile;
  currentState: StateFile | undefined;
  schemas: SchemaModule;
  sourceRegistry: RuntimeStateArtifacts['sourceRegistry'];
}): StateFile {
  if (!payload.currentState) {
    return payload.schemas.parseStateFile(payload.rebuiltState);
  }

  const rebuiltItemsByKey = new Map(
    payload.rebuiltState.items.map((item) => [item.item_key, item] as const),
  );
  const sourceLabelsById = new Map(
    payload.sourceRegistry.sources.map((source) => [source.source_id, source.source_label]),
  );
  const retainedTodos = payload.currentState.todos
    .filter((todo) =>
      shouldRetainRuntimeTodo({
        todo,
        rebuiltItemsByKey,
        sourceLabelsById,
      }),
    )
    .map((todo) => ({
      ...todo,
      related_sources: todo.related_sources.map((source) => ({
        source_id: source.source_id,
        source_label: sourceLabelsById.get(source.source_id) ?? source.source_label,
      })),
    }));

  return recomputeDerivedState({
    schemas: payload.schemas,
    state: payload.schemas.parseStateFile({
      ...payload.rebuiltState,
      created_at: payload.currentState.created_at,
      updated_at: payload.currentState.updated_at,
      last_refresh_at: payload.currentState.last_refresh_at,
      todos: retainedTodos,
    }),
  });
}

function stampUpdatedAt(payload: {
  state: StateFile;
  schemas: SchemaModule;
  updatedAt: string;
}): StateFile {
  return payload.schemas.parseStateFile({
    ...payload.state,
    updated_at: payload.updatedAt,
  });
}

export async function rebuildStateFromCanonicalArtifacts(payload: {
  backlogRoot: BacklogRootPath;
  dependencies: RuntimeDependencies;
  artifacts: ArtifactsModule;
  schemas: SchemaModule;
  errors: ErrorModule;
  currentState?: StateFile;
}): Promise<StateFile> {
  const runtimeArtifacts = await loadRuntimeArtifacts({
    backlogRoot: payload.backlogRoot,
    artifacts: payload.artifacts,
  });

  const currentState = payload.currentState;
  let state = createEmptyState({
    schemas: payload.schemas,
    createdAt: currentState?.created_at ?? runtimeArtifacts.rootMarkerCreatedAt,
    updatedAt: currentState?.updated_at ?? payload.dependencies.clock.nowIsoUtc(),
    lastRefreshAt: currentState?.last_refresh_at ?? null,
  });

  const packetEntries = [...runtimeArtifacts.appliedRegistry.packets].sort((left, right) => {
    const applyCompare = left.apply_index - right.apply_index;
    if (applyCompare !== 0) {
      return applyCompare;
    }

    return left.canonical_path.localeCompare(right.canonical_path);
  });

  for (const packetEntry of packetEntries) {
    let packet: PacketFile;
    try {
      packet = await readCanonicalPacket({
        backlogRoot: payload.backlogRoot,
        dependencies: payload.dependencies,
        schemas: payload.schemas,
        errors: payload.errors,
        canonicalPath: packetEntry.canonical_path,
      });
    } catch (error) {
      throw createArtifactReplayFailedError({
        artifactKind: 'packet',
        canonicalPath: packetEntry.canonical_path,
        errors: payload.errors,
        error,
        message: 'Backlog rebuild failed while reading a canonical packet.',
        packetId: packetEntry.packet_id,
      });
    }

    if (
      JSON.stringify(packet.items.map((item) => item.item_key)) !==
      JSON.stringify(packetEntry.item_keys)
    ) {
      const error = payload.errors.create('BE_INTERNAL_STATE_CORRUPT', undefined, {
        details: {
          packet_id: packetEntry.packet_id,
          reason: 'Packet item_keys do not match applied registry entry.',
        },
      });
      throw createArtifactReplayFailedError({
        artifactKind: 'packet',
        canonicalPath: packetEntry.canonical_path,
        errors: payload.errors,
        error,
        message: 'Backlog rebuild failed while validating a canonical packet.',
        packetId: packetEntry.packet_id,
      });
    }

    try {
      state = applyPacketReplay({
        state,
        packet,
        errors: payload.errors,
      });
    } catch (error) {
      throw createArtifactReplayFailedError({
        artifactKind: 'packet',
        canonicalPath: packetEntry.canonical_path,
        errors: payload.errors,
        error,
        message: 'Backlog rebuild failed while replaying a canonical packet.',
        packetId: packetEntry.packet_id,
      });
    }
  }

  const patchEntries = [...runtimeArtifacts.appliedRegistry.patches].sort((left, right) => {
    const applyCompare = left.apply_index - right.apply_index;
    if (applyCompare !== 0) {
      return applyCompare;
    }

    const sequenceCompare = left.sequence - right.sequence;
    if (sequenceCompare !== 0) {
      return sequenceCompare;
    }

    return left.canonical_path.localeCompare(right.canonical_path);
  });

  for (const patchEntry of patchEntries) {
    let patch: PatchFile;
    try {
      patch = await readCanonicalPatch({
        backlogRoot: payload.backlogRoot,
        dependencies: payload.dependencies,
        schemas: payload.schemas,
        errors: payload.errors,
        canonicalPath: patchEntry.canonical_path,
      });
    } catch (error) {
      throw createArtifactReplayFailedError({
        artifactKind: 'patch',
        canonicalPath: patchEntry.canonical_path,
        errors: payload.errors,
        error,
        message: 'Backlog rebuild failed while reading a canonical patch.',
        patchId: patchEntry.patch_id,
      });
    }

    try {
      validatePatchKind({
        entry: patchEntry,
        patch,
        errors: payload.errors,
      });
    } catch (error) {
      throw createArtifactReplayFailedError({
        artifactKind: 'patch',
        canonicalPath: patchEntry.canonical_path,
        errors: payload.errors,
        error,
        message: 'Backlog rebuild failed while validating a canonical patch.',
        patchId: patchEntry.patch_id,
      });
    }

    state = applyPatchReplay({
      state,
      patch,
      errors: payload.errors,
      missingTodoPolicy: 'ignore',
      replayContext: {
        applyIndex: patchEntry.apply_index,
        canonicalPath: patchEntry.canonical_path,
        kind: patchEntry.kind,
        sequence: patchEntry.sequence,
      },
    });
  }

  validateSourceRegistryReferences({
    state,
    availableSourceIds: new Set(
      runtimeArtifacts.sourceRegistry.sources.map((source) => source.source_id),
    ),
    errors: payload.errors,
  });

  return preserveRuntimeMetadata({
    rebuiltState: recomputeDerivedState({
      schemas: payload.schemas,
      state,
    }),
    currentState,
    schemas: payload.schemas,
    sourceRegistry: runtimeArtifacts.sourceRegistry,
  });
}

export function areStatesEquivalent(left: StateFile, right: StateFile): boolean {
  return deepEqual(left, right);
}

export function updateRebuiltStateTimestamp(payload: {
  state: StateFile;
  schemas: SchemaModule;
  updatedAt: string;
}): StateFile {
  return stampUpdatedAt(payload);
}
