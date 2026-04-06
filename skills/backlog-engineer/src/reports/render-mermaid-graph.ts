import type { StateItem } from '../schemas/index.ts';

function escapeMermaidLabel(value: string): string {
  return value.replaceAll('"', "'").replaceAll('\n', ' ');
}

export function renderStateMermaidGraph(items: readonly StateItem[]): string {
  const sortedItems = [...items].sort((left, right) => left.item_key.localeCompare(right.item_key));
  const lines = ['flowchart TD'];

  for (const item of sortedItems) {
    lines.push(`  ${item.item_key}["${escapeMermaidLabel(`${item.item_key}: ${item.title}`)}"]`);
  }

  const edges = sortedItems.flatMap((item) =>
    [...item.depends_on_keys]
      .sort((left, right) => left.localeCompare(right))
      .map((dependencyKey) => ({
        from: dependencyKey,
        to: item.item_key,
      })),
  );

  for (const edge of edges) {
    lines.push(`  ${edge.from} --> ${edge.to}`);
  }

  return `${lines.join('\n')}\n`;
}
