import type { ItemKey, PatchId, PatchKind, Sequence } from '../schemas/index.ts';
import { renderBacklogAgentsTemplate } from './render-agents-template.ts';
import { renderPacketTemplate } from './render-packet-template.ts';
import { renderPatchTemplate } from './render-patch-template.ts';

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

export function createTemplatesModule(): TemplatesModule {
  return {
    renderBacklogAgentsTemplate,
    renderPacketTemplate,
    renderPatchTemplate,
  };
}

export { renderBacklogAgentsTemplate, renderPacketTemplate, renderPatchTemplate };
