import type {
  AttentionEntry,
  ItemCard,
  QueueChain,
  SourceRegistryFile,
  StateFile,
} from '../schemas/index.ts';

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
