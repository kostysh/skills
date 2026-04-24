import type { ParsedStageLog, ReviewEvent } from '../core/types.ts';
import { readText, stringFromUnknown } from '../core/shared.ts';
import { parseLooseYaml } from './loose-yaml.ts';
import { parseMarkdownSections, splitBulletish } from './markdown.ts';

function extractReviewTimestamp(input: Record<string, unknown>): string | null {
  const value =
    input.timestamp ?? input.ts ?? input.created_at ?? input.time ?? input.occurred_at ?? null;
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function normalizeReviewVerdict(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase().replaceAll('_', '-');
  if (!normalized) {
    return null;
  }
  if (/\b(pass|passed|success)\b/u.test(normalized)) {
    return 'pass';
  }
  if (
    /\b(fail|failed|non-compliant|noncompliant|changes-requested|request-changes)\b/u.test(
      normalized,
    )
  ) {
    return normalized.includes('non') ? 'non-compliant' : 'fail';
  }

  return normalized;
}

function inferReviewVerdictFromText(value: string): string | null {
  const match = value.match(
    /\b(PASS|passed|FAIL|failed|non-compliant|noncompliant|changes_requested|changes-requested|request_changes|request-changes)\b/iu,
  );
  return normalizeReviewVerdict(match?.[1] ?? '');
}

function detailArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string' && entry.trim() !== '')
    : [];
}

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
        verdict: normalizeReviewVerdict(verdictMatch?.[1] ?? ''),
        source: 'prose',
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

function structuredReviewEvent(entry: unknown): ReviewEvent | null {
  if (typeof entry === 'string') {
    const raw = entry.trim();
    return raw.length > 0
      ? {
          raw,
          details: [],
          timestamp: null,
          verdict: inferReviewVerdictFromText(raw),
          source: 'structured',
        }
      : null;
  }

  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const record = entry as Record<string, unknown>;
  const raw =
    stringFromUnknown(record.raw, '') ||
    stringFromUnknown(record.summary, '') ||
    stringFromUnknown(record.message, '') ||
    stringFromUnknown(record.title, '') ||
    stringFromUnknown(record.notes, '') ||
    JSON.stringify(record);
  const verdict =
    normalizeReviewVerdict(
      record.verdict ?? record.status ?? record.result ?? record.outcome ?? record.review_status,
    ) ?? inferReviewVerdictFromText(raw);

  return {
    raw,
    details: detailArray(record.details),
    timestamp: extractReviewTimestamp(record),
    verdict,
    source: 'structured',
  };
}

export function structuredReviewEventsFromMetadata(
  metadata: Record<string, unknown>,
): ReviewEvent[] {
  const value =
    metadata.review_events ?? metadata.structured_review_events ?? metadata.reviewEvents ?? null;
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => structuredReviewEvent(entry))
    .filter((entry): entry is ReviewEvent => entry !== null);
}

export function isNonPassReviewEvent(event: ReviewEvent): boolean {
  const verdict = normalizeReviewVerdict(event.verdict ?? '') ?? '';
  return (
    verdict === 'fail' ||
    verdict === 'non-compliant' ||
    /\b(fail|failed|non-compliant|noncompliant|changes[-_]requested|request[-_]changes)\b/iu.test(
      event.raw,
    )
  );
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
    reviewEvents: [
      ...parseReviewEvents(reviewText),
      ...structuredReviewEventsFromMetadata(metadata as Record<string, unknown>),
    ],
    processMissLines: splitBulletish(processMissesText),
    closeOutLines: splitBulletish(closeOutText),
  };
}
