import type { ItemKey, PatchId, PatchKind, Sequence } from '../schemas/index.ts';

export function renderPatchTemplate(payload: {
  targetItemKeys: ItemKey[];
  kind: PatchKind;
  patchId: PatchId;
  createdAt: string;
  sequence: Sequence;
}): string {
  return `${JSON.stringify(
    {
      metadata: {
        patch_id: payload.patchId,
        created_at: payload.createdAt,
        sequence: payload.sequence,
        target_item_keys: payload.targetItemKeys,
      },
      operations: [
        payload.kind === 'remove-item'
          ? {
              item_key: payload.targetItemKeys[0] ?? '<item_key>',
              action: 'remove_item',
            }
          : {
              item_key: payload.targetItemKeys[0] ?? '<item_key>',
              action: 'replace_fields',
              fields: {
                title: '<new_title>',
                delivery_state: '<new_delivery_state>',
                gaps: [],
              },
            },
      ],
    },
    null,
    2,
  )}\n`;
}
