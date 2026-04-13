import type { ParsedStageLog, ReviewEvent } from '../core/types.ts';
import { readText } from '../core/shared.ts';
import { parseLooseYaml } from './loose-yaml.ts';
import { parseMarkdownSections, splitBulletish } from './markdown.ts';

function parseReviewEvents(text: string): ReviewEvent[] {
  const lines = text.split(/\r?\n/);
  const events: ReviewEvent[] = [];
  let current: ReviewEvent | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const bulletMatch = line.match(/^-\s+(.+)$/u);
    if (bulletMatch) {
      if (current) {
        events.push(current);
      }

      const raw = bulletMatch[1] ?? '';
      const timestampMatch = raw.match(/(\d{4}-\d{2}-\d{2}T[0-9:+-]+)/u);
      const verdictMatch = raw.match(/\b(PASS|FAIL|pass|fail|non-compliant)\b/u);
      current = {
        raw,
        details: [],
        timestamp: timestampMatch?.[1] ?? null,
        verdict: verdictMatch?.[1]?.toLowerCase() ?? null,
      };
      continue;
    }

    if (line.startsWith('-') && current) {
      current.details.push(line.slice(1).trim());
    }
  }

  if (current) {
    events.push(current);
  }

  return events;
}

export function parseStageLog(filePath: string): ParsedStageLog {
  const raw = readText(filePath);
  const normalized = raw.replace(/^\uFEFF/u, '');
  let metadata = {};
  let body = normalized;

  const yamlFence = normalized.match(/^```yaml\s*\n([\s\S]*?)\n```\s*\n?/u);
  if (yamlFence) {
    metadata = parseLooseYaml(yamlFence[1] ?? '');
    body = normalized.slice(yamlFence[0].length);
  } else if (normalized.startsWith('---\n')) {
    const match = normalized.match(/^---\n([\s\S]*?)\n---\s*\n?/u);
    if (match) {
      metadata = parseLooseYaml(match[1] ?? '');
      body = normalized.slice(match[0].length);
    }
  }

  const sections = parseMarkdownSections(body);
  const reviewText = sections['События ревью'] || sections['Review events'] || '';
  const processMissesText = sections['Процессные промахи'] || sections['Process misses'] || '';
  const closeOutText = sections['Закрытие'] || sections['Close-out'] || '';

  return {
    filePath,
    raw,
    metadata,
    sections,
    reviewEvents: parseReviewEvents(reviewText),
    processMissLines: splitBulletish(processMissesText),
    closeOutLines: splitBulletish(closeOutText),
  };
}
