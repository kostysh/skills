import type { ItemKey, PatchId, PatchKind, Sequence } from '../schemas/index.ts';

export interface TemplatesModule {
  renderBacklogAgentsTemplate(): string;
  renderPacketTemplate(): string;
  renderPatchTemplate(payload: {
    targetItemKeys: ItemKey[];
    kind: PatchKind;
    patchId: PatchId;
    createdAt: string;
    sequence: Sequence;
  }): string;
}
