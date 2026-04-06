import { ZodError } from 'zod';

import { createInvalidJsonError, fromZodError } from '../errors/index.ts';
import type {
  AppliedRegistryFile,
  BacklogRelativePosixPath,
  ItemKey,
  PatchFile,
  SchemaModule,
  StateFile,
} from '../schemas/index.ts';
import type { CommandName } from '../runtime/shared.ts';
import type { CommandExecutionContext } from './types.ts';

type AuthoredJsonFile<T> = {
  absolutePath: string;
  canonicalBasename: string;
  rawContent: string;
  value: T;
};

export async function readAuthoredJsonFile<T>(payload: {
  context: CommandExecutionContext;
  commandName: CommandName;
  inputPath: string;
  parse: (raw: unknown) => T;
}): Promise<AuthoredJsonFile<T>> {
  const file = await payload.context.host.readCliTextFile(payload.inputPath);
  const { absolutePath, canonicalBasename, rawContent } = file;

  let rawJson: unknown;
  try {
    rawJson = JSON.parse(rawContent) as unknown;
  } catch (error) {
    throw createInvalidJsonError(
      {
        command: payload.commandName,
        path: absolutePath,
      },
      error,
    );
  }

  try {
    return {
      absolutePath,
      canonicalBasename,
      rawContent,
      value: payload.parse(rawJson),
    };
  } catch (error) {
    if (error instanceof ZodError) {
      throw fromZodError(error, {
        command: payload.commandName,
        path: absolutePath,
      });
    }

    throw error;
  }
}

export function appendAppliedPacketEntry(payload: {
  schemas: SchemaModule;
  registry: AppliedRegistryFile;
  packetId: string;
  canonicalPath: BacklogRelativePosixPath;
  contentHash: string;
  appliedAt: string;
  itemKeys: ItemKey[];
}): AppliedRegistryFile {
  const nextApplyIndex = payload.registry.next_apply_index;

  return payload.schemas.parseAppliedRegistry({
    ...payload.registry,
    updated_at: payload.appliedAt,
    next_apply_index: nextApplyIndex + 1,
    packets: [
      ...payload.registry.packets,
      {
        packet_id: payload.packetId,
        apply_index: nextApplyIndex,
        canonical_path: payload.canonicalPath,
        content_hash: payload.contentHash,
        applied_at: payload.appliedAt,
        item_keys: payload.itemKeys,
      },
    ],
  });
}

export function appendAppliedPatchEntry(payload: {
  schemas: SchemaModule;
  registry: AppliedRegistryFile;
  patch: PatchFile;
  kind: 'patch-item' | 'remove-item';
  canonicalPath: BacklogRelativePosixPath;
  contentHash: string;
  appliedAt: string;
}): AppliedRegistryFile {
  const nextApplyIndex = payload.registry.next_apply_index;

  return payload.schemas.parseAppliedRegistry({
    ...payload.registry,
    updated_at: payload.appliedAt,
    next_apply_index: nextApplyIndex + 1,
    patches: [
      ...payload.registry.patches,
      {
        patch_id: payload.patch.metadata.patch_id,
        apply_index: nextApplyIndex,
        canonical_path: payload.canonicalPath,
        content_hash: payload.contentHash,
        sequence: payload.patch.metadata.sequence,
        applied_at: payload.appliedAt,
        kind: payload.kind,
        target_item_keys: payload.patch.metadata.target_item_keys,
      },
    ],
  });
}

export function assertPatchRegistryConstraints(payload: {
  context: CommandExecutionContext;
  registry: AppliedRegistryFile;
  patch: PatchFile;
}): void {
  if (
    payload.registry.patches.some((entry) => entry.patch_id === payload.patch.metadata.patch_id)
  ) {
    throw payload.context.errors.create('BE_PATCH_ID_CONFLICT', undefined, {
      details: {
        patch_id: payload.patch.metadata.patch_id,
      },
    });
  }

  const maxSequence = payload.registry.patches.reduce((maxValue, entry) => {
    return Math.max(maxValue, entry.sequence);
  }, 0);
  if (payload.patch.metadata.sequence <= maxSequence) {
    throw payload.context.errors.create('BE_PATCH_SEQUENCE_CONFLICT', undefined, {
      details: {
        patch_id: payload.patch.metadata.patch_id,
        sequence: payload.patch.metadata.sequence,
        max_existing_sequence: maxSequence,
      },
    });
  }
}

export function countItemsInStateWithTodos(payload: {
  beforeState: StateFile;
  afterState: StateFile;
  itemKeys: readonly ItemKey[];
}): {
  created: ItemKey[];
  updated: ItemKey[];
  removed: ItemKey[];
} {
  const beforeByKey = new Map(payload.beforeState.items.map((item) => [item.item_key, item]));
  const afterByKey = new Map(payload.afterState.items.map((item) => [item.item_key, item]));
  const created: ItemKey[] = [];
  const updated: ItemKey[] = [];
  const removed: ItemKey[] = [];

  for (const itemKey of payload.itemKeys) {
    const beforeItem = beforeByKey.get(itemKey);
    const afterItem = afterByKey.get(itemKey);
    const beforeTodoIds = beforeItem?.open_todo_ids ?? [];
    const afterTodoIds = afterItem?.open_todo_ids ?? [];

    if (beforeTodoIds.length === 0 && afterTodoIds.length > 0) {
      created.push(itemKey);
      continue;
    }
    if (beforeTodoIds.length > 0 && afterTodoIds.length === 0) {
      removed.push(itemKey);
      continue;
    }
    if (beforeTodoIds.join(',') !== afterTodoIds.join(',')) {
      updated.push(itemKey);
    }
  }

  return {
    created,
    updated,
    removed,
  };
}
