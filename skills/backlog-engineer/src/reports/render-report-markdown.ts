import type { ItemCard, PacketItem } from '../schemas/index.ts';
import type { ReportModel, ReportSection } from './index.ts';

function renderBulletLines(lines: readonly string[]): string {
  if (lines.length === 0) {
    return '- none';
  }

  return lines.map((line) => `- ${line}`).join('\n');
}

function renderMermaidBlock(mermaid: string): string {
  return ['```mermaid', mermaid.trimEnd(), '```'].join('\n');
}

function countBy<T extends string>(values: readonly T[]): Array<[T, number]> {
  const counts = new Map<T, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()].sort(([left], [right]) => left.localeCompare(right));
}

function renderItemKeyList(values: readonly string[]): string {
  return values.length > 0 ? values.join(', ') : 'none';
}

function renderContextSummary(card: ItemCard): string[] {
  return [
    `Claims: ${renderItemKeyList(card.context.claim_keys)}`,
    `Contracts: ${renderItemKeyList(card.context.contract_keys)}`,
    `Data domains: ${renderItemKeyList(card.context.data_domain_keys)}`,
    `Quality attributes: ${renderItemKeyList(card.context.quality_attribute_keys)}`,
    `Policy decisions: ${renderItemKeyList(card.context.policy_decision_keys)}`,
  ];
}

function countContextKeys(card: ItemCard): number {
  return (
    card.context.claim_keys.length +
    card.context.contract_keys.length +
    card.context.data_domain_keys.length +
    card.context.quality_attribute_keys.length +
    card.context.policy_decision_keys.length
  );
}

function renderItemSection(card: ItemCard): string {
  const item: PacketItem = card.item;

  return [
    `### ${item.item_key} — ${item.title}`,
    '',
    `- Type: ${item.type}`,
    `- Delivery state: ${item.delivery_state}`,
    `- Needs attention: ${String(card.computed_state.needs_attention)}`,
    `- Ready for next step: ${String(card.computed_state.ready_for_next_step)}`,
    `- Gaps: ${item.gaps.length > 0 ? item.gaps.join('; ') : 'none'}`,
    `- Depends on: ${renderItemKeyList(item.depends_on_keys)}`,
    `- Reverse dependencies: ${renderItemKeyList(card.reverse_dependency_keys)}`,
    `- Related sources: ${card.source_summaries.map((source) => source.source_label).join(', ') || 'none'}`,
    `- Todo: ${card.todo.map((todo) => todo.message).join('; ') || 'none'}`,
    `- Attention reasons: ${card.computed_state.attention_reasons.join('; ') || 'none'}`,
    '',
    'Context:',
    renderBulletLines(renderContextSummary(card)),
    '',
    'Item metrics:',
    renderBulletLines([
      `Dependency count: ${item.depends_on_keys.length}`,
      `Reverse dependency count: ${card.reverse_dependency_keys.length}`,
      `Gap count: ${item.gaps.length}`,
      `Related source count: ${card.source_summaries.length}`,
      `Related context element count: ${countContextKeys(card)}`,
    ]),
  ].join('\n');
}

export function buildReportSections(model: ReportModel): ReportSection[] {
  const typeCounts = countBy(model.itemCatalog.map((card) => card.item.type));
  const deliveryStateCounts = countBy(model.itemCatalog.map((card) => card.item.delivery_state));

  const taskGraphSection = [
    'Global graph:',
    '',
    renderMermaidBlock(model.globalMermaidGraph),
    ...(model.localMermaidGraphs.length > 0
      ? [
          '',
          'Local graphs:',
          '',
          ...model.localMermaidGraphs.flatMap((graph) => [
            `### ${graph.title}`,
            '',
            `- Item keys: ${graph.item_keys.join(', ')}`,
            '',
            renderMermaidBlock(graph.mermaid),
            '',
          ]),
        ]
      : []),
  ]
    .join('\n')
    .trimEnd();

  const attentionSection =
    model.attentionItems.length === 0
      ? 'No items currently require attention.'
      : model.attentionItems
          .map((entry) =>
            [
              `### ${entry.item_key} — ${entry.title}`,
              '',
              renderBulletLines([
                `Reason codes: ${entry.attention_reason_codes.join(', ')}`,
                `Reasons: ${entry.attention_reasons.join('; ')}`,
                `Sources: ${entry.source_summaries.map((source) => source.source_label).join(', ') || 'none'}`,
              ]),
            ].join('\n'),
          )
          .join('\n\n');

  const queueSection =
    model.queueChains.length === 0
      ? 'No tasks are ready for the next step.'
      : model.queueChains
          .map((chain) =>
            [
              `### Root: ${chain.root_item_key}`,
              '',
              renderBulletLines([
                `Ordering rule: ${chain.ordering_rule.join(' -> ')}`,
                `Items: ${chain.items.join(' -> ')}`,
              ]),
            ].join('\n'),
          )
          .join('\n\n');

  const allItemsSection =
    model.itemCatalog.length === 0
      ? 'No items are registered.'
      : model.itemCatalog.map((card) => renderItemSection(card)).join('\n\n');

  return [
    {
      key: 'system-summary',
      title: 'System Summary',
      markdown: renderBulletLines(model.systemSummary),
    },
    {
      key: 'backlog-metrics',
      title: 'Backlog Metrics',
      markdown: renderBulletLines([
        `Total items: ${model.metrics.totalItems}`,
        `Items needing attention: ${model.metrics.itemsNeedingAttention}`,
        `Ready for next step: ${model.metrics.readyForNextStep}`,
        `Items with gaps: ${model.metrics.openGaps}`,
        `Open todo count: ${model.metrics.openTodos}`,
        `Items by type: ${typeCounts.map(([type, count]) => `${type}=${count}`).join(', ') || 'none'}`,
        `Items by delivery state: ${deliveryStateCounts.map(([state, count]) => `${state}=${count}`).join(', ') || 'none'}`,
      ]),
    },
    {
      key: 'task-graph',
      title: 'Task Graph',
      markdown: taskGraphSection,
    },
    {
      key: 'needs-attention',
      title: 'Needs Attention',
      markdown: attentionSection,
    },
    {
      key: 'ready-for-next-step',
      title: 'Ready For Next Step',
      markdown: queueSection,
    },
    {
      key: 'all-items',
      title: 'All Items',
      markdown: allItemsSection,
    },
  ];
}

export function renderReportMarkdown(sections: readonly ReportSection[]): string {
  const renderedSections = sections.map(
    (section) => `## ${section.title}\n\n${section.markdown.trim()}`,
  );
  return `# Backlog Report\n\n${renderedSections.join('\n\n')}\n`;
}
