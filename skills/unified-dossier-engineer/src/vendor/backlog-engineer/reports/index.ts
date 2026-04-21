import type {
  AttentionEntry,
  ItemCard,
  QueueChain,
  SourceRegistryFile,
  StateFile,
} from '../schemas/index.ts';
import type { AttentionService, ItemsService, QueueService } from '../core/types.ts';
import type { HookRegistry } from '../hooks/index.ts';
import { buildReportModel as buildReportModelValue } from './build-report-model.ts';
import { renderStateMermaidGraph } from './render-mermaid-graph.ts';
import {
  buildReportSections as buildReportSectionsValue,
  renderReportMarkdown as renderReportMarkdownValue,
} from './render-report-markdown.ts';

export type ReportSection = {
  key: string;
  title: string;
  markdown: string;
};

export type LocalMermaidGraph = {
  title: string;
  mermaid: string;
  item_keys: string[];
};

export type ReportModel = {
  systemSummary: string[];
  metrics: {
    totalItems: number;
    itemsNeedingAttention: number;
    readyForNextStep: number;
    openGaps: number;
    openTodos: number;
  };
  globalMermaidGraph: string;
  localMermaidGraphs: LocalMermaidGraph[];
  attentionItems: AttentionEntry[];
  queueChains: QueueChain[];
  itemCatalog: ItemCard[];
};

export interface ReportsModule {
  buildReportModel(payload: {
    state: StateFile;
    registry: SourceRegistryFile;
  }): Promise<ReportModel>;
  buildSections(model: ReportModel): ReportSection[];
  renderMarkdown(sections: ReportSection[]): string;
  renderMermaid(model: ReportModel): string;
}

export function createReportsModule(payload: {
  items: ItemsService;
  attention: AttentionService;
  queue: QueueService;
  hooks: HookRegistry;
}): ReportsModule {
  return {
    buildReportModel({ state, registry }) {
      return buildReportModelValue({
        state,
        registry,
        services: {
          items: payload.items,
          attention: payload.attention,
          queue: payload.queue,
        },
        hooks: payload.hooks,
      });
    },
    buildSections(model) {
      return buildReportSectionsValue(model);
    },
    renderMarkdown(sections) {
      return renderReportMarkdownValue(sections);
    },
    renderMermaid(model) {
      return model.globalMermaidGraph;
    },
  };
}

export {
  buildReportModelValue as buildReportModel,
  buildReportSectionsValue as buildReportSections,
  renderReportMarkdownValue as renderReportMarkdown,
  renderStateMermaidGraph,
};
