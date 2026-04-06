import type { ItemKey, PatchId, PatchKind, Sequence } from '../schemas/index.ts';

export function renderPatchTemplate(payload: {
  targetItemKeys: ItemKey[];
  kind: PatchKind;
  patchId: PatchId;
  createdAt: string;
  sequence: Sequence;
}): string {
  void payload.kind;

  return `${JSON.stringify(
    {
      metadata: {
        patch_id: payload.patchId,
        created_at: payload.createdAt,
        sequence: payload.sequence,
        target_item_keys: payload.targetItemKeys,
      },
      operations: [],
    },
    null,
    2,
  )}\n`;
}
